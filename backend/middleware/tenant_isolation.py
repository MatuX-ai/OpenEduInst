"""
多租户数据隔离中间件 (ASGI 级)（增强版）

职责：
- 对所有业务路由的请求，从 Token 中解析 org_id / username / user_id / role 并注入到 request.state
- 为审计中间件、限流中间件、业务代码提供统一的请求上下文
- Token 黑名单 / 权限校验发生在 utils.auth_utils 中；中间件仅负责"解析 + 注入"

注意：真正的数据过滤发生在路由层通过 require_org_context 拿到 org_id 后，
     在 SQL 中显式 filter(Model.org_id == org_id)。
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Optional

from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request

from config.settings import settings

logger = logging.getLogger(__name__)


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """在 request 对象上注入 org_id/username/user_id/role，供下游中间件/业务使用"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ):
        start = time.perf_counter()

        org_id: Optional[int] = None
        username: Optional[str] = None
        user_id: Optional[int] = None
        role: Optional[str] = None

        token = self._extract_bearer_token(request)
        if token:
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                org_id = payload.get("org_id")
                username = payload.get("sub")
                user_id = payload.get("user_id")
                role = payload.get("role")
                if isinstance(role, str):
                    role = role.upper()
            except JWTError:
                # Token 无效，不中断，留给 auth_utils 里正式校验抛出 401
                logger.debug("TenantIsolationMiddleware 解析到无效 JWT")

        request.state.org_id = org_id
        request.state.username = username
        request.state.user_id = user_id
        request.state.user_role = role
        request.state.request_id = getattr(request.state, "request_id", None) or uuid.uuid4().hex[:16]

        try:
            response = await call_next(request)
        finally:
            pass

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.debug(
            "req=%s user=%s org=%s role=%s method=%s path=%s took=%.1fms",
            request.state.request_id,
            username,
            org_id,
            role,
            request.method,
            request.url.path,
            elapsed_ms,
        )
        return response

    @staticmethod
    def _extract_bearer_token(request: Request) -> Optional[str]:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            return auth.split(None, 1)[1].strip()
        return None


# 保留旧的依赖函数
async def get_current_org_id(request: Request) -> int:
    """兼容用法：从 request.state 读取 org_id"""
    org_id = getattr(request.state, "org_id", None)
    if org_id is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token 中缺少组织信息",
        )
    return int(org_id)
