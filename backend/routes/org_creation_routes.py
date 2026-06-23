"""
组织创建与初始化路由
处理用户登录后创建组织并进入管理后台的流程
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.base_models import User
from models.license import Organization, OrganizationCreate, OrganizationType, License, LicenseType, LicenseStatus
from models.user_organization import UserOrganization, UserOrganizationRole
from utils.database import get_db
from utils.auth_utils import get_current_user_sync, create_access_token_sync, get_current_org_id
from services.tenant_init_service import TenantInitService
from datetime import timedelta, datetime
import uuid

router = APIRouter(prefix="/api/v1/organizations", tags=["组织管理"])


# 欢迎邮件发送（带重试，不阻塞主流程）
def _send_welcome_email_with_retry(
    contact_email: str,
    org_name: str,
    admin_username: str,
    max_retries: int = 3,
) -> None:
    """
    在新线程中异步发送欢迎邮件，失败最多重试 3 次
    """
    import os as _os
    import logging as _logging

    if _os.getenv("SEND_WELCOME_EMAIL", "1").lower() not in ("1", "true", "yes"):
        return

    import asyncio
    import time

    async def _attempt_send(retry: int = 0) -> bool:
        try:
            from services.email_service import get_email_service
            login_url = _os.getenv("FRONTEND_LOGIN_URL", "https://app.openmt.example.com/login")
            email_svc = get_email_service()
            await email_svc.send_welcome(
                to=contact_email,
                org_name=org_name,
                admin_username=admin_username,
                login_url=login_url,
            )
            _logging.getLogger(__name__).info(
                "欢迎邮件发送成功: %s (org=%s)", contact_email, org_name
            )
            return True
        except Exception as exc:
            if retry < max_retries - 1:
                wait = 2 ** (retry + 1)  # 指数退避: 2s, 4s, 8s
                _logging.getLogger(__name__).warning(
                    "欢迎邮件发送失败(第%d次重试): %s", retry + 1, exc
                )
                await asyncio.sleep(wait)
                return await _attempt_send(retry + 1)
            _logging.getLogger(__name__).warning(
                "欢迎邮件发送失败(已达最大重试%d次): %s", max_retries, exc
            )
            return False

    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.create_task(_attempt_send())
    except Exception as exc:
        _logging.getLogger(__name__).warning("欢迎邮件任务创建失败: %s", exc)


class OrgCreationRequest(BaseModel):
    name: str
    contact_email: str
    org_type: OrganizationType
    phone: str | None = None
    address: str | None = None


@router.post("/create")
def create_and_join_org(
    request: OrgCreationRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """创建新组织并将当前用户加入为管理员"""
    
    # 1. 检查邮箱是否已被其他组织使用
    existing_org = db.query(Organization).filter(Organization.contact_email == request.contact_email).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="该联系邮箱已被其他组织使用")

    # 2. 创建组织
    new_org = Organization(
        name=request.name,
        contact_email=request.contact_email,
        phone=request.phone,
        address=request.address,
        org_type=request.org_type,
        max_users=100,
        current_users=1
    )
    db.add(new_org)
    db.flush()  # 获取生成的 ID

    # 3. 【PostgreSQL】为新组织创建独立 Schema 并克隆表结构
    try:
        from utils.database import engine as _db_engine
        from utils.schema_isolation import create_schema_for_org

        create_schema_for_org(_db_engine, new_org.id)
    except Exception as exc:  # noqa: BLE001
        # SQLite 环境下 schema_isolation 会自动跳过，不影响开发流程
        import logging
        logging.getLogger(__name__).info("Schema 创建跳过（开发模式）: %s", exc)

    # 4. 初始化租户配置（功能开关、业务参数及自动发放云托管许可证）
    TenantInitService.initialize_tenant(db, new_org.id, request.org_type)

    # 5. 将当前用户关联到该组织，角色为管理员
    user_org_link = UserOrganization(
        user_id=current_user.id,
        org_id=new_org.id,
        role=UserOrganizationRole.ADMIN,
        is_primary=True,
        status="active"
    )
    db.add(user_org_link)
    db.commit()
    db.refresh(new_org)

    # 6. 生成包含 org_id 的 Access Token，方便前端直接进入后台
    access_token = create_access_token_sync(
        data={"sub": current_user.username, "org_id": new_org.id},
        expires_delta=timedelta(hours=24)
    )

    # 7. 异步发送欢迎邮件（失败不阻塞主流程，带重试）
    _send_welcome_email_with_retry(
        contact_email=request.contact_email,
        org_name=request.name,
        admin_username=current_user.username,
    )

    return {
        "message": "组织创建成功",
        "organization_id": new_org.id,
        "org_type": request.org_type.value,
        "access_token": access_token
    }


@router.get("/my")
def get_my_organizations(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """获取当前用户所属的所有组织"""
    links = db.query(UserOrganization).filter(UserOrganization.user_id == current_user.id).all()
    org_ids = [link.org_id for link in links if link.org_id]
    
    organizations = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return organizations


@router.get("/{org_id}")
def get_organization_detail(
    org_id: int,
    db: Session = Depends(get_db)
):
    """获取特定组织的详细信息"""
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="组织不存在")
    
    # 统计信息
    from models.user_organization import UserOrganization
    from models.license import License
    
    total_users = db.query(UserOrganization).filter(UserOrganization.org_id == org_id).count()
    active_license = db.query(License).filter(
        License.organization_id == org_id,
        License.status == LicenseStatus.ACTIVE
    ).first()
    
    return {
        "id": org.id,
        "name": org.name,
        "contact_email": org.contact_email,
        "phone": org.phone,
        "address": org.address,
        "org_type": org.org_type.value if org.org_type else None,
        "total_users": total_users,
        "license_type": active_license.license_type.value if active_license else None,
        "license_expires_at": active_license.expires_at.isoformat() if active_license and active_license.expires_at else None
    }
