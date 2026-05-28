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

    # 3. 初始化租户配置（功能开关、业务参数及自动发放云托管许可证）
    TenantInitService.initialize_tenant(db, new_org.id, request.org_type)

    # 4. 将当前用户关联到该组织，角色为管理员
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

    # 5. 生成包含 org_id 的 Access Token，方便前端直接进入后台
    access_token = create_access_token_sync(
        data={"sub": current_user.username, "org_id": new_org.id},
        expires_delta=timedelta(hours=24)
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
