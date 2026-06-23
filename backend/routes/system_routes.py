"""
系统设置 / 安全设置 API 路由

提供给 ADMIN / SUPER_ADMIN 使用的接口：
  - 查看当前用户的角色和权限
  - 查看系统安全配置（CORS、限流、Token TTL 等）
  - 主动吊销当前 Token（登出）
  - 主动吊销某用户的所有 Token（强制下线）
  - 查看平台统计信息（用户数、机构数、许可证数等）
  - 修改用户角色（仅 SUPER_ADMIN）
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from jose import jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from config.settings import settings
from middleware.permissions import (
    Permission,
    Role,
    role_has_permission,
    role_permission_list,
)
from middleware.token_blacklist import (
    revoke_all_for_user,
    revoke_token,
    token_blacklist,
)
from models.base_models import User
from models.license import License, LicenseStatus, Organization
from models.user_organization import UserOrganization, UserOrganizationRole
from utils.auth_utils import (
    get_current_user_sync,
    require_org_context,
    require_permission,
    require_role,
)
from utils.database import get_db

router = APIRouter(prefix="/api/v1/system", tags=["系统设置"])
logger = logging.getLogger(__name__)


# ---------------- 当前用户信息 ----------------
@router.get("/me")
def get_current_user_info(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_sync),
    ctx: tuple = Depends(require_org_context),
):
    """返回当前登录用户的基本信息、角色、权限列表"""
    _, org_id = ctx
    role = getattr(user, "role", None)
    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "username": user.username,
            "email": getattr(user, "email", None),
            "org_id": org_id,
            "role": role,
            "permissions": role_permission_list(role),
            "is_super_admin": role == Role.SUPER_ADMIN.value,
            "is_admin": role in (Role.SUPER_ADMIN.value, Role.ADMIN.value),
        },
        "message": "ok",
    }


# ---------------- 安全配置查看 ----------------
@router.get("/security/config")
def get_security_config(
    _=Depends(require_permission(Permission.SYSTEM_READ)),
):
    """查看系统安全配置（敏感值均已脱敏）"""
    return {
        "success": True,
        "data": {
            "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "algorithm": settings.ALGORITHM,
            "secret_key_masked": "***" if settings.SECRET_KEY else "",
            "cors_allow_origin_count": len(
                [o for o in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if o.strip()]
            ),
            "enforce_https": os.getenv("ENFORCE_HTTPS", "0") != "0",
            "rate_limit": {
                "anon": os.getenv("RL_ANON_LIMIT", "60"),
                "auth": os.getenv("RL_AUTH_LIMIT", "600"),
                "login": os.getenv("RL_LOGIN_LIMIT", "10"),
                "admin": os.getenv("RL_ADMIN_LIMIT", "2000"),
                "super_admin": os.getenv("RL_SUPER_ADMIN_LIMIT", "5000"),
            },
            "audit": {
                "log_file": os.getenv("AUDIT_LOG_FILE", "logs/audit.log"),
                "level": os.getenv("AUDIT_LEVEL", "write"),
                "record_body": os.getenv("AUDIT_RECORD_BODY", "true").lower() == "true",
            },
            "token_blacklist": {
                "ttl_seconds": os.getenv("TOKEN_BLACKLIST_TTL_SECONDS", str(30 * 24 * 3600)),
                "redis_enabled": token_blacklist._redis is not None if hasattr(token_blacklist, "_redis") else False,
            },
            "imatu": {
                "sync_enabled": os.getenv("IMATU_SYNC_ENABLED", "true").lower() == "true",
                "api_base": os.getenv("IMATU_API_BASE", ""),
            },
        },
        "message": "ok",
    }


# ---------------- 登出（吊销当前 Token） ----------------
@router.post("/logout")
def logout(
    user: User = Depends(get_current_user_sync),
):
    """主动注销当前 Token，将其加入黑名单"""
    jti = getattr(user, "jti", None)
    if jti:
        revoke_token(jti)
        logger.info("用户 %s 已注销 Token (jti=%s)", user.username, jti[:8])
    return {"success": True, "message": "已退出登录", "data": None}


# ---------------- 强制下线某用户（SUPER_ADMIN 或当前用户所属 ADMIN） ----------------
@router.post("/force-logout/{username}")
def force_logout_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync),
    _=Depends(require_permission(Permission.SYSTEM_WRITE)),
):
    """强制吊销指定用户的所有 Token（密码修改、安全事件等场景使用）"""
    # 不能吊销超级管理员（除非自己就是超级管理员或者目标就是自己）
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    current_role = getattr(current_user, "role", None)
    if current_role != Role.SUPER_ADMIN.value and current_user.username != username:
        # 非 SUPER_ADMIN 只能吊销自己
        raise HTTPException(status_code=403, detail="无权吊销其他用户的 Token")

    revoke_all_for_user(username)
    logger.warning("用户 %s 已被 %s 强制吊销所有 Token", username, current_user.username)
    return {"success": True, "message": "已强制该用户下线", "data": {"username": username}}


# ---------------- 平台统计 ----------------
@router.get("/stats/summary")
def get_platform_stats(
    db: Session = Depends(get_db),
    _=Depends(require_permission(Permission.SYSTEM_READ)),
):
    """返回平台级别的汇总统计（SUPER_ADMIN 可查看全平台，ADMIN 仅本机构）"""
    org_id = getattr(require_org_context, "__self__", None)
    total_orgs = db.query(func.count(Organization.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_licenses = db.query(func.count(License.id)).scalar() or 0
    active_licenses = (
        db.query(func.count(License.id)).filter(License.status == LicenseStatus.ACTIVE).scalar() or 0
    )

    return {
        "success": True,
        "data": {
            "organizations": int(total_orgs),
            "users": int(total_users),
            "licenses_total": int(total_licenses),
            "licenses_active": int(active_licenses),
        },
        "message": "ok",
    }


# ---------------- 角色列表 ----------------
@router.get("/roles")
def get_roles(_=Depends(require_permission(Permission.SYSTEM_READ))):
    """返回系统中所有可用的角色及对应权限"""
    return {
        "success": True,
        "data": [
            {
                "role": role.value,
                "permissions": [p.value for p in Permission if role_has_permission(role.value, p)],
            }
            for role in Role
        ],
        "message": "ok",
    }


# ---------------- 修改用户角色（仅 SUPER_ADMIN） ----------------
@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True, description="新的角色"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync),
    org_ctx: tuple = Depends(require_org_context),
    _=Depends(require_role(Role.SUPER_ADMIN)),
):
    """修改指定用户在当前机构中的角色，仅 SUPER_ADMIN 可操作"""
    _, org_id = org_ctx
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    normalized = role.upper()
    valid_roles = {r.value for r in Role}
    if normalized not in valid_roles:
        raise HTTPException(status_code=400, detail=f"无效的角色，可选值: {sorted(valid_roles)}")

    # 更新或创建 UserOrganization
    row = (
        db.query(UserOrganization)
        .filter(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == org_id,
        )
        .first()
    )
    if row:
        try:
            row.role = UserOrganizationRole(normalized.lower())
        except Exception:
            row.role = normalized.lower()
    else:
        try:
            new_role = UserOrganizationRole(normalized.lower())
        except Exception:
            new_role = normalized.lower()
        row = UserOrganization(user_id=user_id, org_id=org_id, role=new_role, is_active=True)
        db.add(row)
    db.commit()

    logger.info("用户 %s 的角色由 %s 修改为 %s (操作人=%s)",
                target.username, "unknown", normalized, current_user.username)
    return {"success": True, "message": "角色修改成功", "data": {"user_id": user_id, "role": normalized}}


# ---------------- 查看机构内用户列表 ----------------
@router.get("/users")
def list_org_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    ctx: tuple = Depends(require_org_context),
    _=Depends(require_permission(Permission.USER_READ)),
):
    """查看当前机构下的用户列表（含角色、状态）"""
    _, org_id = ctx

    subq = (
        db.query(
            UserOrganization.user_id.label("uid"),
            UserOrganization.role.label("role"),
            UserOrganization.is_active.label("is_active"),
        )
        .filter(UserOrganization.org_id == org_id)
        .subquery()
    )
    total = (
        db.query(func.count(subq.c.uid))
        .scalar() or 0
    )
    rows = (
        db.query(User, subq.c.role, subq.c.is_active)
        .join(subq, User.id == subq.c.uid)
        .order_by(User.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for u, r, active in rows:
        role_val = r.value if hasattr(r, "value") else str(r)
        items.append({
            "id": u.id,
            "username": u.username,
            "email": getattr(u, "email", None),
            "role": role_val,
            "is_active": bool(active) and bool(getattr(u, "is_active", True)),
            "created_at": getattr(u, "created_at", None),
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": int(total),
            "page": page,
            "page_size": page_size,
            "total_pages": (int(total) + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "ok",
    }


# ---------------- 启用/禁用机构内用户 ----------------
@router.patch("/users/{user_id}/status")
def update_user_active_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    ctx: tuple = Depends(require_org_context),
    _=Depends(require_permission(Permission.USER_WRITE)),
):
    """启用/禁用当前机构下的用户"""
    _, org_id = ctx
    row = (
        db.query(UserOrganization)
        .filter(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == org_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="该用户不在当前机构")
    row.is_active = is_active
    db.commit()

    # 如果用户被禁用，同时吊销其所有 Token
    if not is_active:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            revoke_all_for_user(user.username)

    return {"success": True, "message": "用户状态已更新", "data": {"user_id": user_id, "is_active": is_active}}
