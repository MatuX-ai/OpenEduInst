"""
认证与租户隔离相关的依赖项和工具函数
- get_current_user_sync: 校验 Token, 返回本地 User 对象
- get_current_org_id: 从 Token 中提取当前组织 ID
- require_org_context: 【生产关键】同时校验 User + org_id, 返回 (user, org_id)
- create_access_token_sync / create_refresh_token_sync: 生成 JWT
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.settings import settings
from models.base_models import User
from models.user_organization import UserOrganization, UserOrganizationRole
from utils.database import get_db

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


def _decode_token(token: str) -> dict:
    """解码 JWT 并返回 payload；失败抛出 401"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_sync(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """同步版本：校验 Token 并返回当前 User"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(token)
    username: Optional[str] = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的 Token"
        )

    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在或已被禁用"
        )
    # 把 org_id 挂到 user 对象上（向后兼容）
    if payload.get("org_id"):
        user.org_id = payload["org_id"]
    return user


def get_current_org_id(
    token: Optional[str] = Depends(oauth2_scheme),
) -> int:
    """从 JWT Token 中提取当前组织 ID"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(token)
    org_id = payload.get("org_id")
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token 中缺少组织信息，请先加入某个机构",
        )
    return int(org_id)


def _get_user_org_role(
    db: Session, user_id: int, org_id: int
) -> Optional[UserOrganizationRole]:
    """查询当前用户在目标组织中的角色；未加入返回 None"""
    row = (
        db.query(UserOrganization)
        .filter(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == org_id,
            UserOrganization.is_active.is_(True),
        )
        .first()
    )
    return row.role if row else None


def require_org_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_sync),
    org_id_from_token: int = Depends(get_current_org_id),
) -> Tuple[User, int]:
    """
    【推荐所有业务路由使用】同时完成 User 认证 + 组织 ID 提取 + 成员关系校验。
    用法示例:
        user, org_id = Depends(require_org_context)
        query = db.query(Student).filter(Student.org_id == org_id)
    """
    # 校验用户确实属于该组织，防止通过手工篡改 Token 中 org_id 越权
    role = _get_user_org_role(db, user.id, org_id_from_token)
    if role is None:
        logger.warning(
            "用户 %s 尝试访问未加入的组织 org_id=%s，已拦截",
            user.username,
            org_id_from_token,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该机构的数据",
        )
    return user, org_id_from_token


def require_role(*allowed_roles: UserOrganizationRole):
    """
    返回一个 FastAPI Depends，要求当前用户在其组织中具备指定角色之一。
    用法示例:
        _ = Depends(require_role(UserOrganizationRole.ADMIN, UserOrganizationRole.STAFF))
    """

    def _checker(
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user_sync),
        org_id: int = Depends(get_current_org_id),
    ) -> None:
        role = _get_user_org_role(db, user.id, org_id)
        if role is None:
            raise HTTPException(status_code=403, detail="无权访问该机构的数据")
        if role not in allowed_roles:
            logger.info(
                "RBAC 拦截: user=%s role=%s required=%s",
                user.username,
                role,
                [r.value for r in allowed_roles],
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="角色权限不足",
            )

    return _checker


# ======================= Token 生成 =======================

def create_access_token_sync(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    """生成访问令牌（access token）。默认 30 分钟"""
    to_encode = dict(data)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    to_encode["type"] = "access"
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token_sync(data: dict, expires_days: int = 7) -> str:
    """生成刷新令牌。默认 7 天"""
    to_encode = dict(data)
    to_encode["exp"] = datetime.utcnow() + timedelta(days=expires_days)
    to_encode["type"] = "refresh"
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token_sync(token: str) -> Optional[dict]:
    """通用校验：成功返回 payload，失败返回 None"""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# 向后兼容的别名
get_current_user = get_current_user_sync
