"""
API 限流中间件（增强版）

策略说明：
- 匿名请求按 IP 限流（较严格：默认 60 次/分钟）
- 已登录请求按 user_id 限流（较宽松：默认 600 次/分钟）
- 登录接口单独限流（防暴力破解：默认 10 次/分钟 / IP）
- 按角色差异化限流：SUPER_ADMIN / ADMIN 可获得更高配额
- 使用 Redis 做集群共享存储；若 Redis 不可用，自动降级到内存字典

环境变量：
    RL_ANON_LIMIT       # 匿名用户每分钟请求数，默认 60
    RL_ANON_WINDOW      # 匿名用户限流窗口秒数，默认 60
    RL_AUTH_LIMIT       # 已登录用户每分钟请求数，默认 600
    RL_AUTH_WINDOW      # 已登录用户限流窗口秒数，默认 60
    RL_LOGIN_LIMIT      # 登录接口每分钟请求数 / IP，默认 10
    RL_LOGIN_WINDOW     # 登录接口窗口秒数，默认 60
    RL_ADMIN_LIMIT      # ADMIN 角色每分钟请求数，默认 2000
    RL_SUPER_ADMIN_LIMIT  # SUPER_ADMIN 角色每分钟请求数，默认 5000
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

logger = logging.getLogger(__name__)


# ==================== 配置 ====================
def _int_env(name: str, default: int) -> int:
    try:
        val = os.getenv(name, str(default))
        return int(val) if str(val).isdigit() else default
    except Exception:
        return default


# 默认基础配置
ANON_RATE_LIMIT = _int_env("RL_ANON_LIMIT", 60)
ANON_WINDOW_SEC = _int_env("RL_ANON_WINDOW", 60)
AUTH_RATE_LIMIT = _int_env("RL_AUTH_LIMIT", 600)
AUTH_WINDOW_SEC = _int_env("RL_AUTH_WINDOW", 60)
LOGIN_RATE_LIMIT = _int_env("RL_LOGIN_LIMIT", 10)
LOGIN_WINDOW_SEC = _int_env("RL_LOGIN_WINDOW", 60)

# 角色差异化
ADMIN_RATE_LIMIT = _int_env("RL_ADMIN_LIMIT", 2000)
SUPER_ADMIN_RATE_LIMIT = _int_env("RL_SUPER_ADMIN_LIMIT", 5000)

# 白名单路径（完全不限流）
WHITELIST_PATHS = ("/health", "/favicon.ico", "/docs", "/openapi.json", "/redoc")
# 登录相关路径（使用更严格的登录限流）
LOGIN_PATHS = ("/api/v1/auth/token", "/api/v1/auth/login")


# ==================== Redis 客户端懒加载 ====================
def _get_redis():
    try:
        from utils.redis_client import redis_client
        if redis_client is not None and getattr(redis_client, "ping", lambda: False)():
            return redis_client
    except Exception as exc:
        logger.debug("Redis 不可用，限流将使用内存: %s", exc)
    return None


# ==================== 内存存储（Redis 不可用时降级） ====================
class MemoryStore:
    def __init__(self) -> None:
        self._buckets: Dict[str, Tuple[float, int]] = {}
        self._lock = Lock()

    def incr_and_check(self, key: str, limit: int, window: int) -> Tuple[int, bool]:
        now = time.time()
        with self._lock:
            entry = self._buckets.get(key)
            if entry is None or now - entry[0] > window:
                self._buckets[key] = (now, 1)
                return max(limit - 1, 0), True
            _, count = entry
            if count >= limit:
                return 0, False
            self._buckets[key] = (_, count + 1)
            return max(limit - count - 1, 0), True

    def reset(self) -> None:
        with self._lock:
            self._buckets.clear()


_memory_store = MemoryStore()


# ==================== 工具函数 ====================
def _client_ip(request: Request) -> str:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    cf = request.headers.get("CF-Connecting-IP")
    if cf:
        return cf
    client = getattr(request.client, "host", None) if request.client else None
    return client or "unknown"


def _user_key(request: Request) -> Optional[str]:
    """从 request.state 获取 username（由 TenantIsolationMiddleware 注入）"""
    username = getattr(request.state, "username", None)
    if username:
        return f"u:{username}"
    return None


def _user_role(request: Request) -> Optional[str]:
    role = getattr(request.state, "user_role", None)
    return role.upper() if role else None


def _check_rate_limit(
    key: str, limit: int, window: int, redis_client=None
) -> Tuple[int, bool]:
    if redis_client is not None:
        try:
            current = redis_client.incr(key)
            if current == 1:
                redis_client.expire(key, window)
            remaining = max(limit - current, 0)
            return remaining, current <= limit
        except Exception as exc:
            logger.warning("Redis 限流失败，降级到内存存储: %s", exc)
    return _memory_store.incr_and_check(key, limit, window)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """全局请求限流中间件（增强版：按角色差异化配额）"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path = request.url.path

        if path.startswith(WHITELIST_PATHS):
            return await call_next(request)

        ip = _client_ip(request)
        user_key = _user_key(request)
        role = _user_role(request)
        redis_client = _get_redis()

        # ---- 登录接口：严格按 IP 限流 ----
        if path in LOGIN_PATHS:
            remaining, allowed = _check_rate_limit(
                f"login:{ip}", LOGIN_RATE_LIMIT, LOGIN_WINDOW_SEC, redis_client
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "登录请求过于频繁，请稍后再试"},
                    headers={
                        "Retry-After": str(LOGIN_WINDOW_SEC),
                        "X-RateLimit-Limit": str(LOGIN_RATE_LIMIT),
                        "X-RateLimit-Remaining": str(remaining),
                    },
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(LOGIN_RATE_LIMIT)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        # ---- 已登录用户：按角色差异化限流 ----
        if user_key:
            if role == "SUPER_ADMIN":
                limit, window = SUPER_ADMIN_RATE_LIMIT, AUTH_WINDOW_SEC
            elif role == "ADMIN":
                limit, window = ADMIN_RATE_LIMIT, AUTH_WINDOW_SEC
            else:
                limit, window = AUTH_RATE_LIMIT, AUTH_WINDOW_SEC

            remaining, allowed = _check_rate_limit(user_key, limit, window, redis_client)
            if not allowed:
                logger.warning("用户 %s (role=%s) 超过限流阈值 (%s req/min)",
                               user_key, role, limit)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "请求过于频繁，请稍后再试"},
                    headers={
                        "Retry-After": str(window),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": str(remaining),
                    },
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        # ---- 匿名请求：按 IP 限流 ----
        remaining, allowed = _check_rate_limit(f"anon:{ip}", ANON_RATE_LIMIT, ANON_WINDOW_SEC, redis_client)
        if not allowed:
            logger.warning("匿名 IP %s 超过限流阈值 (%s req/min)", ip, ANON_RATE_LIMIT)
            return JSONResponse(
                status_code=429,
                content={"detail": "请求过于频繁，请稍后再试"},
                headers={
                    "Retry-After": str(ANON_WINDOW_SEC),
                    "X-RateLimit-Limit": str(ANON_RATE_LIMIT),
                    "X-RateLimit-Remaining": str(remaining),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(ANON_RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
