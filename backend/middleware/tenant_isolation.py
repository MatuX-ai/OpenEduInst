"""
多租户数据隔离中间件 (ASGI 级)

职责：
- 对所有业务路由的请求，从 Token 中解析 org_id 并注入到 request.state
- 记录访问审计（org_id, user_id, path, ip）
- 禁止通过 query/path/body 显式传入的 org_id 绕过 Token 中的 org_id（见 require_org_context）

注意：真正的数据过滤发生在路由层通过 require_org_context 拿到 org_id 后，
      在 SQL 中显式 filter(Model.org_id == org_id)。这里只做全局注入 + 安全日志。
"""

from __future__ import annotations

import logging
import time
from typing import Optional

from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from config.settings import settings

logger = logging.getLogger(__name__)

# 不做强制拦截的路径（登录、公开文档、健康检查）
_PUBLIC_PREFIXES = (
    "/api/v1/auth/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/favicon.ico",
)


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """在请求对象上注入 org_id/user_id，供后续中间件 / 依赖函数使用"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        org_id: Optional[int] = None
        username: Optional[str] = None

        token = _extract_bearer_token(request)
        if token and not request.url.path.startswith(_PUBLIC_PREFIXES):
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                org_id = payload.get("org_id")
                username = payload.get("sub")
            except JWTError:
                # 让后续依赖返回 401，这里只记录
                logger.debug("中间件检测到无效 JWT：path=%s", request.url.path)

        request.state.org_id = org_id
        request.state.username = username
        request.state.request_id = getattr(request.state, "request_id", None) or _gen_req_id()

        response: Response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "req=%s user=%s org=%s method=%s path=%s status=%s took=%.1fms",
            request.state.request_id,
            username,
            org_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response


def _extract_bearer_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(None, 1)[1].strip()
    return None


def _gen_req_id() -> str:
    import uuid

    return uuid.uuid4().hex[:12]


# 保留旧的 get_current_org_id 依赖函数（推荐改用 utils.auth_utils.require_org_context）
async def get_current_org_id(request: Request) -> int:
    """兼容用法：从 request.state 读取 org_id（如已被中间件注入）"""
    org_id = getattr(request.state, "org_id", None)
    if org_id is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token 中缺少组织信息",
        )
    return int(org_id)
