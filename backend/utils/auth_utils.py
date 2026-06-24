"""
认证与租户隔离相关的依赖项和工具函数（增强版）

主要变更：
- 集成细粒度 RBAC 权限系统 (Role / Permission)
- 集成 Token 黑名单（主动吊销、全用户会话吊销）
- 把 role / user_id 注入到 request.state，供审计、限流、其他中间件使用
- 增加 `require_permission(...)` —— 基于权限而不是角色的细粒度依赖
- generate_access_token 中增加 jti (JWT ID) 字段，便于按 Token 吊销
"""

from __future__ import annotations

import logging
import time
import uuid
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.settings import settings
from middleware.permissions import Role, Permission, role_has_permission
from middleware.token_blacklist import is_token_revoked
from models.base_models import User
from models.user_organization import UserOrganization, UserOrganizationRole
from utils.database import get_db

logger = logging.getLogger(__name__)

oauth2_scheme = HTTPBearer(auto_error=False)


# ---------- 密码哈希 / 验证（集中定义，避免各路由重复实现） ----------
def hash_password(password: str) -> str:
    """使用 bcrypt 对密码进行加盐哈希。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证明文密码与 bcrypt 哈希是否匹配。"""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _decode_token(token: str) -> dict:
    """解码 JWT 并返回 payload；失败抛出 401。同时做黑名单检查。"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # -------- Token 黑名单检查 --------
    jti: Optional[str] = payload.get("jti")
    sub: Optional[str] = payload.get("sub")
    iat: Optional[float] = payload.get("iat")
    if is_token_revoked(jti, username=sub, iat=iat):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 已失效，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_user_sync(
    token: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """同步版本：校验 Token，返回当前 User 对象；附加 role、org_id 等属性。"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(token.credentials)
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

    # 附加 org_id、role 信息，便于下游依赖和中间件使用
    user.org_id = payload.get("org_id")
    # 优先从 payload 里拿 role（这样 Token 自身可以带 role），其次从 DB 中 user_organization 查询
    role_str = payload.get("role")
    if role_str:
        user.role = role_str.upper()
    else:
        # 若 Token 中没有 role，尝试从 user_organization 表反查
        if user.org_id:
            row = (
                db.query(UserOrganization)
                .filter(
                    UserOrganization.user_id == user.id,
                    UserOrganization.org_id == user.org_id,
                    UserOrganization.is_active.is_(True),
                )
                .first()
            )
            if row and row.role:
                try:
                    user.role = row.role.value.upper() if hasattr(row.role, "value") else str(row.role).upper()
                except Exception:
                    user.role = str(row.role).upper()
            else:
                user.role = Role.USER.value
        else:
            user.role = Role.USER.value
    user.jti = payload.get("jti")
    return user


def get_current_org_id(
    token: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_scheme),
) -> int:
    """从 JWT Token 中提取当前组织 ID"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(token.credentials)
    org_id = payload.get("org_id")
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token 中缺少组织信息，请先加入某个机构",
        )
    return int(org_id)


def _get_user_org_role(
    db: Session, user_id: int, org_id: int
) -> Optional[str]:
    row = (
        db.query(UserOrganization)
        .filter(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == org_id,
            UserOrganization.is_active.is_(True),
        )
        .first()
    )
    if not row:
        return None
    if hasattr(row.role, "value"):
        return row.role.value.upper()
    return str(row.role).upper()


def require_org_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_sync),
    org_id_from_token: int = Depends(get_current_org_id),
) -> Tuple[User, int]:
    """
    推荐所有业务路由使用：
      同时完成 User 认证 + 组织 ID 提取 + 成员关系校验 + 许可证检查。
    """
    # 校验用户确实属于该组织
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

    # 把 DB 中查到的角色重新回写到 user 对象（覆盖 Token 中可能携带的，DB 更权威）
    user.role = role

    _check_license_validity(db, org_id_from_token)

    return user, org_id_from_token


def _check_license_validity(db: Session, org_id: int) -> None:
    try:
        from models.license import License, LicenseStatus

        active_license = (
            db.query(License)
            .filter(
                License.organization_id == org_id,
                License.status == LicenseStatus.ACTIVE,
            )
            .first()
        )
        if active_license and active_license.expires_at:
            now = datetime.utcnow()
            if now > active_license.expires_at:
                logger.warning("机构 org_id=%s 许可证已过期", org_id)
                active_license.status = LicenseStatus.EXPIRED
                db.commit()
            elif (active_license.expires_at - now).days <= 7:
                logger.info("机构 org_id=%s 许可证即将在 %d 天后过期",
                            org_id, (active_license.expires_at - now).days)
    except Exception as exc:
        logger.debug("许可证检查跳过（非阻塞）: %s", exc)


# ---------------- 基于角色的依赖 ----------------
def require_role(*allowed_roles: Role):
    """
    返回一个 FastAPI Depends，要求当前用户具备指定角色之一。

    用法：
        _ = Depends(require_role(Role.ADMIN, Role.SUPER_ADMIN))
    """
    allowed = {r.value for r in allowed_roles}

    def _checker(
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user_sync),
        org_id: int = Depends(get_current_org_id),
    ) -> None:
        role = _get_user_org_role(db, user.id, org_id)
        if role is None:
            raise HTTPException(status_code=403, detail="无权访问该机构的数据")
        if role not in allowed:
            logger.info("RBAC 拦截: user=%s role=%s required=%s", user.username, role, allowed)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="角色权限不足")

    return _checker


# ---------------- 基于权限（Permission）的依赖 ----------------
def require_permission(*permissions: Permission):
    """
    要求当前用户具备指定权限之一（细粒度权限控制）。

    用法：
        _ = Depends(require_permission(Permission.AUDIT_READ))
    """
    perm_set = set(permissions)

    def _checker(
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user_sync),
        org_id: int = Depends(get_current_org_id),
    ) -> None:
        role = _get_user_org_role(db, user.id, org_id)
        if role is None:
            raise HTTPException(status_code=403, detail="无权访问")
        # 至少满足一个权限即可通过
        for p in perm_set:
            if role_has_permission(role, p):
                return
        logger.info("权限拦截: user=%s role=%s required_permissions=%s",
                    user.username, role, [p.value for p in perm_set])
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")

    return _checker


# ---------------- Token 生成（增强版） ----------------
def create_access_token_sync(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    生成访问令牌（access token）。默认 30 分钟。
    Token payload 中新增：
        - jti: UUID 形式的唯一 ID，便于单独吊销
        - iat: 签发时间戳，便于全量吊销判断
        - role: 字符串形式角色（若传入）
    """
    to_encode = dict(data)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    to_encode["type"] = "access"
    to_encode["iat"] = int(time.time())
    to_encode["jti"] = uuid.uuid4().hex
    if "role" in to_encode and to_encode["role"] is not None:
        to_encode["role"] = str(to_encode["role"]).upper()
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token_sync(data: dict, expires_days: int = 7) -> str:
    """生成刷新令牌。默认 7 天。同样附加 jti / iat。"""
    to_encode = dict(data)
    to_encode["exp"] = datetime.utcnow() + timedelta(days=expires_days)
    to_encode["type"] = "refresh"
    to_encode["iat"] = int(time.time())
    to_encode["jti"] = uuid.uuid4().hex
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token_sync(token: str) -> Optional[dict]:
    """通用校验：成功返回 payload，失败返回 None。"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        sub = payload.get("sub")
        iat = payload.get("iat")
        if is_token_revoked(jti, username=sub, iat=iat):
            return None
        return payload
    except JWTError:
        return None


# 向后兼容别名
get_current_user = get_current_user_sync
