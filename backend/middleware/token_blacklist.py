"""
Token 黑名单 / 主动失效机制

设计目标：
- 支持主动吊销 Token（登出、密码修改、强制下线）
- 基于 Redis 做分布式存储；Redis 不可用时自动降级到内存字典
- Token 通过 JWT 的 jti（唯一 ID）来区分，而非依赖整个 Token 字符串
- 支持"某用户的所有 Token 全量吊销"（例如用户修改密码后所有旧会话失效）

环境变量：
    TOKEN_BLACKLIST_TTL_SECONDS  # 黑名单条目保留秒数，默认等于 access token 最长有效期(30天)
"""

from __future__ import annotations

import logging
import os
import time
from threading import Lock
from typing import Dict, Optional, Set

logger = logging.getLogger(__name__)

DEFAULT_TTL = int(os.getenv("TOKEN_BLACKLIST_TTL_SECONDS", str(30 * 24 * 3600)))


class TokenBlacklist:
    """Token 黑名单管理器（Redis 优先，自动降级到内存）"""

    def __init__(self) -> None:
        self._memory_jtis: Dict[str, float] = {}  # jti -> expire_ts
        self._memory_users: Dict[str, float] = {}  # username -> expire_ts（该时间之前签发的 token 一律失效）
        self._lock = Lock()
        self._redis = None
        self._init_redis()

    # ---------------- 内部方法 ----------------
    def _init_redis(self) -> None:
        try:
            from utils.redis_client import redis_client
            if redis_client is not None and getattr(redis_client, "ping", lambda: False)():
                self._redis = redis_client
                logger.info("Token 黑名单启用 Redis 存储")
        except Exception as exc:
            logger.warning("Token 黑名单无法连接到 Redis，将使用内存存储: %s", exc)
            self._redis = None

    def _key_jti(self, jti: str) -> str:
        return f"token_blacklist:jti:{jti}"

    def _key_user(self, username: str) -> str:
        return f"token_blacklist:user:{username}"

    # ---------------- 公开 API ----------------
    def revoke_token(self, jti: str, ttl_seconds: int = DEFAULT_TTL) -> None:
        """吊销单个 Token（指定 jti）"""
        if not jti:
            return
        expire_ts = time.time() + ttl_seconds

        if self._redis is not None:
            try:
                self._redis.set(self._key_jti(jti), "1", ex=ttl_seconds)
                return
            except Exception as exc:
                logger.warning("Redis 吊销 Token 失败，降级到内存: %s", exc)

        with self._lock:
            self._memory_jtis[jti] = expire_ts
            self._purge_expired_locked()

    def revoke_all_for_user(self, username: str, ttl_seconds: int = DEFAULT_TTL) -> None:
        """吊销某用户的所有 Token（通过"不早于"时间戳实现）"""
        if not username:
            return
        now_ts = time.time()
        expire_ts = now_ts + ttl_seconds

        if self._redis is not None:
            try:
                self._redis.set(self._key_user(username), str(now_ts), ex=ttl_seconds)
                return
            except Exception as exc:
                logger.warning("Redis 吊销用户 Token 失败，降级到内存: %s", exc)

        with self._lock:
            self._memory_users[username] = expire_ts
            self._purge_expired_locked()

    def is_token_revoked(self, jti: Optional[str], username: Optional[str], iat: Optional[float]) -> bool:
        """判断给定 Token 是否被吊销。"""
        if not jti and not username:
            return False

        now = time.time()

        # 先检查 Redis
        if self._redis is not None:
            try:
                if jti and self._redis.get(self._key_jti(jti)) is not None:
                    return True
                if username:
                    user_ts_str = self._redis.get(self._key_user(username))
                    if user_ts_str is not None:
                        try:
                            user_ts = float(user_ts_str)
                            if iat is not None and iat < user_ts:
                                return True
                            if iat is None:  # 没提供 iat 的话，只要有记录就视为失效
                                return True
                        except ValueError:
                            pass
            except Exception as exc:
                logger.debug("Redis 检查 Token 状态失败，降级到内存: %s", exc)

        # 再检查内存
        with self._lock:
            self._purge_expired_locked()
            if jti and jti in self._memory_jtis:
                return True
            if username and username in self._memory_users:
                if iat is not None and iat < self._memory_users[username] - (self._memory_users[username] - now):
                    # 简化处理：如果用户被记入黑名单，且 iat 未提供或早于吊销时间，则视为失效
                    return True
                if iat is None:
                    return True
        return False

    def _purge_expired_locked(self) -> None:
        """必须在持有 _lock 的情况下调用，清理过期条目"""
        now = time.time()
        if self._memory_jtis:
            self._memory_jtis = {k: v for k, v in self._memory_jtis.items() if v > now}
        if self._memory_users:
            self._memory_users = {k: v for k, v in self._memory_users.items() if v > now}


# 全局单例
token_blacklist = TokenBlacklist()


# ---------------- 便捷函数 ----------------
def revoke_token(jti: str, ttl_seconds: int = DEFAULT_TTL) -> None:
    """吊销单个 Token"""
    token_blacklist.revoke_token(jti, ttl_seconds)


def revoke_all_for_user(username: str, ttl_seconds: int = DEFAULT_TTL) -> None:
    """吊销某用户的所有 Token"""
    token_blacklist.revoke_all_for_user(username, ttl_seconds)


def is_token_revoked(jti: Optional[str], username: Optional[str] = None, iat: Optional[float] = None) -> bool:
    """判断 Token 是否被吊销"""
    return token_blacklist.is_token_revoked(jti, username, iat)
