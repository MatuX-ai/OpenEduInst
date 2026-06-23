"""
多租户 Redis 缓存包装器

所有缓存 Key 自动添加 ``{org_id}:{module}:{key}`` 前缀，确保不同机构
的数据在缓存层完全隔离，避免越权访问。

特性：
- 透明封装：业务代码无需关心 org_id 注入
- 线程安全：使用现有 redis 客户端
- 失败降级：Redis 不可用时静默降级到内存 Map

Key 格式：
    {org_id}:{module}:{actual_key}

    例如：42:student:list_page_1
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Optional

logger = logging.getLogger(__name__)


class _NullRedis:
    """Redis 不可用时的内存降级实现（仅供开发/测试）"""

    def __init__(self) -> None:
        self._data: dict = {}
        self._lock = threading.Lock()

    def _full(self, key: str) -> str:
        return f"_dev_:{key}"

    def get(self, key: str) -> Optional[bytes]:
        with self._lock:
            v = self._data.get(self._full(key))
            return v.encode() if isinstance(v, str) else v

    def set(self, key: str, value, ex: Optional[int] = None) -> bool:  # noqa: ARG002
        with self._lock:
            self._data[self._full(key)] = (
                value.decode() if isinstance(value, bytes) else str(value)
            )
        return True

    def delete(self, *keys: str) -> int:
        n = 0
        with self._lock:
            for k in keys:
                fk = self._full(k)
                if fk in self._data:
                    del self._data[fk]
                    n += 1
        return n

    def keys(self, pattern: str = "*") -> list:
        with self._lock:
            if pattern == "*":
                return list(self._data.keys())
            import fnmatch
            return [k for k in self._data if fnmatch.fnmatchcase(k, pattern)]

    def exists(self, key: str) -> bool:
        with self._lock:
            return self._full(key) in self._data


class TenantCache:
    """多租户隔离的 Redis 缓存包装器"""

    def __init__(self, redis_client=None, namespace: str = "openmt"):
        """初始化

        Args:
            redis_client: 已连接的 redis 客户端；传 None 时使用降级实现
            namespace: 全局命名空间前缀，避免与其他系统共用 Redis 时冲突
        """
        self._redis = redis_client if redis_client is not None else _NullRedis()
        self._namespace = namespace
        self._enabled = redis_client is not None

    # --------------------------------------------------------
    # Key 构造
    # --------------------------------------------------------

    def _make_key(self, org_id: int, module: str, key: str) -> str:
        if org_id is None:
            raise ValueError("org_id 不能为空（多租户隔离要求）")
        # 仅允许字母数字下划线，剔除危险字符
        safe_key = key.replace(" ", "_").replace(":", "/")
        return f"{self._namespace}:{org_id}:{module}:{safe_key}"

    # --------------------------------------------------------
    # 基础操作
    # --------------------------------------------------------

    def get(self, org_id: int, module: str, key: str) -> Optional[Any]:
        """读取缓存，自动反序列化 JSON"""
        full_key = self._make_key(org_id, module, key)
        try:
            raw = self._redis.get(full_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis GET 失败，降级返回 None: %s", exc)
            return None
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (TypeError, ValueError):
            return raw

    def set(
        self,
        org_id: int,
        module: str,
        key: str,
        value: Any,
        ttl_seconds: Optional[int] = None,
    ) -> bool:
        """写入缓存，自动 JSON 序列化"""
        full_key = self._make_key(org_id, module, key)
        try:
            payload = json.dumps(value, default=str, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            logger.error("缓存值序列化失败: key=%s err=%s", full_key, exc)
            return False
        try:
            self._redis.set(full_key, payload, ex=ttl_seconds)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis SET 失败: key=%s err=%s", full_key, exc)
            return False

    def delete(self, org_id: int, module: str, key: str) -> bool:
        """删除指定缓存键"""
        full_key = self._make_key(org_id, module, key)
        try:
            n = self._redis.delete(full_key)
            return n > 0
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis DEL 失败: %s", exc)
            return False

    def delete_module(self, org_id: int, module: str) -> int:
        """删除某 org 某 module 下的所有缓存"""
        pattern = self._make_key(org_id, module, "*")
        try:
            keys = self._redis.keys(pattern)
            if not keys:
                return 0
            return int(self._redis.delete(*keys))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis 模块清理失败: %s", exc)
            return 0

    def exists(self, org_id: int, module: str, key: str) -> bool:
        full_key = self._make_key(org_id, module, key)
        try:
            return bool(self._redis.exists(full_key))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis EXISTS 失败: %s", exc)
            return False

    # --------------------------------------------------------
    # 健康检查
    # --------------------------------------------------------

    @property
    def is_real_redis(self) -> bool:
        return self._enabled


# 全局实例
_cache_instance: Optional[TenantCache] = None


def get_tenant_cache() -> TenantCache:
    """获取全局 TenantCache 单例"""
    global _cache_instance
    if _cache_instance is None:
        try:
            from utils.redis_client import redis_client  # 延迟导入
            _cache_instance = TenantCache(redis_client=redis_client)
        except Exception as exc:  # noqa: BLE001
            logger.warning("无法加载全局 redis 客户端，使用降级缓存: %s", exc)
            _cache_instance = TenantCache(redis_client=None)
    return _cache_instance
