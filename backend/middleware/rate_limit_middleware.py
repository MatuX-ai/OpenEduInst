"""
API 限流中间件

策略说明：
- 匿名请求按 IP 限流（较严格：60 次/分钟）
- 已登录请求按 user_id 限流（较宽松：600 次/分钟）
- 登录接口单独限流（防暴力破解：10 次/分钟 / IP）
- 使用 Redis 做集群共享存储；若 Redis 不可用，自动降级到内存字典

注册方式（已在 main.py 中使用）：
    from middleware.rate_limit_middleware import RateLimitMiddleware
    app.add_middleware(RateLimitMiddleware)
"""

from __future__ import annotations

import logging
import os
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Optional, Tuple

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from utils.redis_client import redis_client  # 全局 Redis 客户端（失败时为 None）

logger = logging.getLogger(__name__)


# ============ 配置 ============
ANON_RATE_LIMIT = int(os.getenv("RL_ANON_LIMIT", "60"))       # 匿名每分钟
ANON_WINDOW_SEC = int(os.getenv("RL_ANON_WINDOW", "60"))

AUTH_RATE_LIMIT = int(os.getenv("RL_AUTH_LIMIT", "600"))       # 登录每分钟
AUTH_WINDOW_SEC = int(os.getenv("RL_AUTH_WINDOW", "60"))

LOGIN_RATE_LIMIT = int(os.getenv("RL_LOGIN_LIMIT", "10"))      # 登录接口每分钟
LOGIN_WINDOW_SEC = int(os.getenv("RL_LOGIN_WINDOW", "60"))

# 白名单路径（完全不限流）
WHITELIST_PATHS = ("/health", "/favicon.ico", "/docs", "/openapi.json", "/redoc")
# 登录相关路径（使用更严格的登录限流）
LOGIN_PATHS = ("/api/v1/auth/token", "/api/v1/auth/login")


# ============ 内存存储（Redis 不可用时降级） ============
class MemoryStore:
    def __init__(self) -> None:
        self._buckets: Dict[str, Tuple[float, int]] = {}
        self._lock = Lock()

    def incr_and_check(self, key: str, limit: int, window: int) -> Tuple[int, bool]:
        """返回 (剩余计数, 是否允许)，采用滑动窗口的近似版本"""
        now = time.time()
        with self._lock:
            # 过期的旧窗口自动重置
            entry = self._buckets.get(key)
            if entry is None or now - entry[0] > window:
                self._buckets[key] = (now, 1)
                return max(limit - 1, 0), True
            start, count = entry
            if count >= limit:
                return 0, False
            self._buckets[key] = (start, count + 1)
            return max(limit - count - 1, 0), True

    def reset(self) -> None:
        with self._lock:
            self._buckets.clear()


_memory_store = MemoryStore()


# ============ 限流逻辑 ============
def _client_ip(request: Request) -> str:
    """真实用户 IP（考虑反向代理场景）"""
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # 客户端 IP 通常是第一个
        return xff.split(",")[0].strip()
    cf = request.headers.get("CF-Connecting-IP")
    if cf:
        return cf
    client = getattr(request.client, "host", None) if request.client else None
    return client or "unknown"


def _user_key(request: Request) -> str:
    """从 JWT 中解析的 user_id / username（由 TenantIsolationMiddleware 注入）"""
    username = getattr(request.state, "username", None)
    if username:
        return f"u:{username}"
    return None


def _check_rate_limit(
    key: str, limit: int, window: int, redis_client=None
) -> Tuple[int, bool]:
    """返回 (remaining, allowed)"""
    if redis_client is not None:
        try:
            # 使用 Redis 的 INCR + EXPIRE 原子窗口
            current = redis_client.incr(key)
            if current == 1:
                redis_client.expire(key, window)
            remaining = max(limit - current, 0)
            return remaining, current <= limit
        except Exception as exc:  # pragma: no cover - Redis 异常降级
            logger.warning("Redis 限流失败，降级到内存存储: %s", exc)

    # 内存模式
    return _memory_store.incr_and_check(key, limit, window)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """全局请求限流"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path = request.url.path

        # 白名单跳过
        if path.startswith(WHITELIST_PATHS):
            return await call_next(request)

        ip = _client_ip(request)
        user_key = _user_key(request)
        # 统一使用全局 redis_client（不可用时自动降级到内存）
        r = redis_client if (redis_client is not None and getattr(redis_client, "ping", lambda: False)()) else None

        # 登录接口：按 IP 严格限流
        if path in LOGIN_PATHS:
            remaining, allowed = _check_rate_limit(
                f"login:{ip}", LOGIN_RATE_LIMIT, LOGIN_WINDOW_SEC, r
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "登录请求过于频繁，请稍后再试"},
                    headers={"Retry-After": str(LOGIN_WINDOW_SEC)},
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(LOGIN_RATE_LIMIT)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        # 已登录用户：按 user_id 限流
        if user_key:
            remaining, allowed = _check_rate_limit(
                f"auth:{user_key}", AUTH_RATE_LIMIT, AUTH_WINDOW_SEC, r
            )
            if not allowed:
                logger.warning("用户 %s 超过限流阈值 (%s req/min)", user_key, AUTH_RATE_LIMIT)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "请求过于频繁，请稍后再试"},
                    headers={"Retry-After": str(AUTH_WINDOW_SEC)},
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(AUTH_RATE_LIMIT)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        # 匿名请求：按 IP 限流
        remaining, allowed = _check_rate_limit(
            f"anon:{ip}", ANON_RATE_LIMIT, ANON_WINDOW_SEC, r
        )
        if not allowed:
            logger.warning("匿名 IP %s 超过限流阈值 (%s req/min)", ip, ANON_RATE_LIMIT)
            return JSONResponse(
                status_code=429,
                content={"detail": "请求过于频繁，请稍后再试"},
                headers={"Retry-After": str(ANON_WINDOW_SEC)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(ANON_RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
