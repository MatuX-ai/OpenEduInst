"""
Redis 客户端工具类
- 许可证存储（按 license_key 缓存）
- 通用 org-scoped 缓存（所有 key 强制带 ``org:{org_id}:`` 前缀，实现租户数据隔离）

注意：
- 生产环境必须配置 REDIS_URL，否则会回退到内存存储并记录告警日志。
- Redis 不可用时会静默降级到内存存储，不会影响业务请求。
"""

from __future__ import annotations

import json
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

try:
    import redis  # type: ignore
    _REDIS_AVAILABLE = True
except ImportError:  # pragma: no cover
    redis = None  # type: ignore
    _REDIS_AVAILABLE = False

try:
    from config.license_config import load_sentinel_config  # type: ignore
except Exception:  # pragma: no cover
    load_sentinel_config = None  # type: ignore

from config.settings import settings

logger = logging.getLogger(__name__)


# ============================================================
# 内存存储降级（单进程安全，多进程/容器部署不共享）
# ============================================================
class _InMemoryStore:
    """Redis 不可用时的进程内 KV + TTL 降级实现"""

    def __init__(self) -> None:
        self._data: Dict[str, Tuple[Any, Optional[float]]] = {}
        self._lock = threading.Lock()

    def setex(self, key: str, seconds: float, value: Any) -> bool:
        with self._lock:
            expire_at = (time.time() + seconds) if seconds and seconds > 0 else None
            self._data[key] = (value, expire_at)
            return True

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None
            value, expire_at = item
            if expire_at is not None and time.time() > expire_at:
                self._data.pop(key, None)
                return None
            return value

    def delete(self, *keys: str) -> int:
        removed = 0
        with self._lock:
            for k in keys:
                if k in self._data:
                    self._data.pop(k, None)
                    removed += 1
        return removed

    def ttl(self, key: str) -> int:
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return -2
            _, expire_at = item
            if expire_at is None:
                return -1
            remaining = int(expire_at - time.time())
            return remaining if remaining > 0 else -2

    def keys(self, pattern: str) -> List[str]:
        import fnmatch
        with self._lock:
            return [k for k in list(self._data.keys()) if fnmatch.fnmatch(k, pattern)]

    def ping(self) -> bool:  # noqa: PLR6301
        return True

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

    def incr(self, key: str) -> int:
        """Redis `INCR` 语义：若 key 不存在则从 0 开始，原子自增返回新值。"""
        with self._lock:
            item = self._data.get(key)
            current = 0
            expire_at: Optional[float] = None
            if item is not None:
                try:
                    current = int(item[0])
                except (TypeError, ValueError):
                    current = 0
                expire_at = item[1]
            new = current + 1
            self._data[key] = (new, expire_at)
            return new

    def expire(self, key: str, seconds: float) -> bool:
        """给指定 key 设置 TTL"""
        with self._lock:
            if key not in self._data:
                return False
            current_value, _ = self._data[key]
            self._data[key] = (current_value, time.time() + seconds)
            return True

    def info(self, _section: str = "memory") -> Dict[str, Any]:
        return {"used_memory_human": "N/A (in-memory)"}


# ============================================================
# Redis 连接管理
# ============================================================
class _RedisConnector:
    """统一的 Redis 连接管理：优先 REDIS_URL，失败降级到内存"""

    def __init__(self) -> None:
        self.client: Any = None
        self._build()

    def _build(self) -> None:
        if not _REDIS_AVAILABLE:
            logger.warning("redis 包未安装，使用内存存储降级")
            self.client = _InMemoryStore()
            return

        url = getattr(settings, "REDIS_URL", None) or ""
        if url:
            try:
                self.client = redis.Redis.from_url(
                    url, decode_responses=True,
                    socket_connect_timeout=5, socket_timeout=10,
                )
                self.client.ping()
                logger.info("✅ Redis 已连接 (来自 REDIS_URL)")
                return
            except Exception as exc:  # noqa: BLE001
                logger.warning("通过 REDIS_URL 连接失败 (%s)，尝试哨兵/默认", exc)

        if load_sentinel_config is not None:
            try:
                cfg = load_sentinel_config()
                storage = getattr(cfg, "storage", None)
                if storage and hasattr(storage, "host"):
                    r = redis.Redis(
                        host=storage.host,
                        port=storage.port,
                        db=storage.db,
                        password=storage.password,
                        ssl=getattr(storage, "ssl", False),
                        decode_responses=True,
                        socket_connect_timeout=5, socket_timeout=10,
                    )
                    r.ping()
                    self.client = r
                    logger.info("✅ Redis 已连接 (哨兵配置)")
                    return
            except Exception as exc:  # noqa: BLE001
                logger.warning("哨兵配置 Redis 不可用: %s", exc)

        logger.warning("Redis 不可用，使用内存存储降级 (仅单实例，重启丢失)")
        self.client = _InMemoryStore()

    def is_connected(self) -> bool:
        if self.client is None:
            return False
        try:
            return bool(self.client.ping())
        except Exception:  # noqa: BLE001
            return False

    def get_store(self):
        return self.client


_connector = _RedisConnector()


# ============================================================
# 许可证存储
# ============================================================
class RedisLicenseStore:
    """Redis 许可证缓存 (key: ``license:{key}``)"""

    DEFAULT_EXPIRE_HOURS = 24

    def __init__(self) -> None:
        self.client = _connector.get_store()
        try:
            cfg = load_sentinel_config() if load_sentinel_config else None
            self.expire_hours = getattr(
                getattr(cfg, "license", None), "expiration_hours",
                self.DEFAULT_EXPIRE_HOURS,
            )
        except Exception:  # noqa: BLE001
            self.expire_hours = self.DEFAULT_EXPIRE_HOURS

    def is_connected(self) -> bool:
        return _connector.is_connected()

    def store_license(self, license_key: str, license_data: Dict[str, Any]) -> bool:
        if not license_key:
            return False
        try:
            data = dict(license_data)
            for k, v in list(data.items()):
                if isinstance(v, datetime):
                    data[k] = v.isoformat()
            key = f"license:{license_key}"
            self.client.setex(
                key, timedelta(hours=self.expire_hours),
                json.dumps(data, default=str),
            )
            logger.info("许可证已缓存 license_key=%s", license_key)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("缓存许可证失败 license_key=%s err=%s", license_key, exc)
            return False

    def get_license(self, license_key: str) -> Optional[Dict[str, Any]]:
        if not license_key:
            return None
        try:
            raw = self.client.get(f"license:{license_key}")
            if not raw:
                return None
            data = json.loads(raw) if isinstance(raw, str) else raw
            for k in ("issued_at", "expires_at", "activated_at", "paid_at"):
                if isinstance(data.get(k), str):
                    try:
                        data[k] = datetime.fromisoformat(data[k])
                    except ValueError:
                        pass
            return data
        except Exception as exc:  # noqa: BLE001
            logger.warning("读取许可证缓存失败 license_key=%s err=%s", license_key, exc)
            return None

    def delete_license(self, license_key: str) -> bool:
        if not license_key:
            return False
        try:
            return bool(self.client.delete(f"license:{license_key}"))
        except Exception as exc:  # noqa: BLE001
            logger.warning("删除许可证缓存失败 license_key=%s err=%s", license_key, exc)
            return False

    def update_license_status(self, license_key: str, status: str) -> bool:
        data = self.get_license(license_key)
        if not data:
            return False
        data["status"] = status
        return self.store_license(license_key, data)

    def get_license_ttl(self, license_key: str) -> Optional[int]:
        try:
            ttl = self.client.ttl(f"license:{license_key}")
            return int(ttl) if ttl is not None and ttl >= 0 else None
        except Exception:  # noqa: BLE001
            return None

    def flush_expired_licenses(self) -> int:
        if not self.is_connected():
            return 0
        try:
            keys = self.client.keys("license:*") or []
            cleaned = 0
            for k in keys:
                try:
                    ttl = self.client.ttl(k)
                    if ttl is None or ttl == -2:
                        self.client.delete(k)
                        cleaned += 1
                except Exception:  # noqa: BLE001
                    continue
            if cleaned:
                logger.info("清理了 %s 个过期许可证缓存", cleaned)
            return cleaned
        except Exception as exc:  # noqa: BLE001
            logger.warning("清理过期许可证缓存失败: %s", exc)
            return 0

    def get_statistics(self) -> Dict[str, Any]:
        if not self.is_connected():
            return {"error": "Redis未连接"}
        try:
            keys = self.client.keys("license:*") or []
            stats: Dict[str, Any] = {
                "total_licenses": len(keys),
                "active_licenses": 0,
                "expired_licenses": 0,
            }
            for k in keys:
                raw = self.client.get(k)
                if not raw:
                    continue
                try:
                    data = json.loads(raw) if isinstance(raw, str) else raw
                except Exception:  # noqa: BLE001
                    continue
                status = data.get("status", "")
                if status == "active":
                    stats["active_licenses"] += 1
                elif status == "expired":
                    stats["expired_licenses"] += 1
            if hasattr(self.client, "info"):
                try:
                    stats["redis_info"] = self.client.info("memory")
                except Exception:  # noqa: BLE001
                    stats["redis_info"] = "N/A"
            return stats
        except Exception as exc:  # noqa: BLE001
            return {"error": str(exc)}


# ============================================================
# org-scoped 通用缓存（租户隔离）
# ============================================================
class OrgScopedCache:
    """
    组织级缓存工具：所有对外 key 强制带 ``org:{org_id}:`` 前缀，保证租户数据隔离。

    使用方式::

        cache = OrgScopedCache()
        cache.set(org_id, "student:summary:42", payload, ttl_seconds=3600)
        payload = cache.get(org_id, "student:summary:42")

    注意：
    - 业务调用方只需要传相对 key，本工具会自动拼接 org 前缀。
    - Redis 不可用时自动降级到内存存储。
    """

    KEY_PREFIX_TEMPLATE = "org:{org_id}:"

    def __init__(self) -> None:
        self.client = _connector.get_store()

    def is_connected(self) -> bool:
        return _connector.is_connected()

    def _build_key(self, org_id: int, key: str) -> str:
        if not isinstance(org_id, int) or org_id <= 0:
            raise ValueError(f"org_id 必须为正整数，实际: {org_id!r}")
        return f"{self.KEY_PREFIX_TEMPLATE.format(org_id=org_id)}{key}"

    def set(self, org_id: int, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        try:
            payload = json.dumps(value, default=str, ensure_ascii=False)
            return bool(self.client.setex(self._build_key(org_id, key), ttl_seconds, payload))
        except Exception as exc:  # noqa: BLE001
            logger.warning("OrgScopedCache.set 失败 org=%s key=%s err=%s", org_id, key, exc)
            return False

    def get(self, org_id: int, key: str) -> Optional[Any]:
        try:
            raw = self.client.get(self._build_key(org_id, key))
            if raw is None:
                return None
            if isinstance(raw, str):
                try:
                    return json.loads(raw)
                except json.JSONDecodeError:
                    return raw
            return raw
        except Exception as exc:  # noqa: BLE001
            logger.warning("OrgScopedCache.get 失败 org=%s key=%s err=%s", org_id, key, exc)
            return None

    def delete(self, org_id: int, key: str) -> bool:
        try:
            return bool(self.client.delete(self._build_key(org_id, key)))
        except Exception as exc:  # noqa: BLE001
            logger.warning("OrgScopedCache.delete 失败 org=%s key=%s err=%s", org_id, key, exc)
            return False

    def exists(self, org_id: int, key: str) -> bool:
        try:
            k = self._build_key(org_id, key)
            if hasattr(self.client, "exists"):
                return bool(self.client.exists(k))
            return self.client.get(k) is not None
        except Exception:  # noqa: BLE001
            return False

    def ttl(self, org_id: int, key: str) -> Optional[int]:
        try:
            val = self.client.ttl(self._build_key(org_id, key))
            return int(val) if val is not None and val >= 0 else None
        except Exception:  # noqa: BLE001
            return None

    def delete_org_prefix(self, org_id: int, partial_key_prefix: str) -> int:
        """删除 ``org:{org_id}:{partial_key_prefix}*`` 下的所有 key"""
        try:
            target = self._build_key(org_id, f"{partial_key_prefix}*")
            if hasattr(self.client, "keys"):
                matched = self.client.keys(target) or []
                if matched:
                    return int(self.client.delete(*matched) or 0)
            return 0
        except Exception as exc:  # noqa: BLE001
            logger.warning("OrgScopedCache.delete_org_prefix 失败 org=%s err=%s", org_id, exc)
            return 0

    def clear_org(self, org_id: int) -> int:
        """清空某组织的全部缓存（组织退订场景）"""
        try:
            prefix = self.KEY_PREFIX_TEMPLATE.format(org_id=org_id)
            if hasattr(self.client, "keys"):
                matched = self.client.keys(f"{prefix}*") or []
                if matched:
                    return int(self.client.delete(*matched) or 0)
            return 0
        except Exception as exc:  # noqa: BLE001
            logger.warning("OrgScopedCache.clear_org 失败 org=%s err=%s", org_id, exc)
            return 0


# ============================================================
# 全局单例入口
# ============================================================
redis_license_store = RedisLicenseStore()
org_cache = OrgScopedCache()


def get_redis_connector() -> _RedisConnector:
    """暴露给 Celery / 定时任务等其他模块使用"""
    return _connector


# ---------------------------------------------------------------
# 兼容符号：供 `middleware.rate_limit_middleware` 使用
# 接口约定（需具备 `ping / incr / expire / delete / setex / get` 方法）
# ---------------------------------------------------------------
class _LegacyRedisClient:
    """最小可用的兼容 Redis 客户端 facade。"""

    def __init__(self) -> None:
        try:
            self._inner = _connector.client  # 若 Redis 可用，直接复用
        except Exception:  # noqa: BLE001
            self._inner = None
        self._mem = _InMemoryStore() if self._inner is None else None

    def ping(self) -> bool:
        try:
            return bool(self._inner.ping()) if self._inner is not None else True
        except Exception:  # noqa: BLE001
            return False

    def incr(self, key: str) -> int:
        if self._inner is not None:
            return int(self._inner.incr(key))
        with self._mem._lock:  # type: ignore[attr-defined]
            current = 0
            try:
                v, _ = self._mem._data.get(key, (0, None))  # type: ignore[attr-defined]
                current = int(v) if isinstance(v, (int, float)) else 0
            except Exception:  # noqa: BLE001
                current = 0
            self._mem._data[key] = (current + 1, None)  # type: ignore[attr-defined]
            return current + 1

    def expire(self, key: str, seconds: int) -> bool:
        if self._inner is not None:
            return bool(self._inner.expire(key, seconds))
        with self._mem._lock:  # type: ignore[attr-defined]
            if key in self._mem._data:  # type: ignore[attr-defined]
                cur, _ = self._mem._data[key]  # type: ignore[attr-defined]
                self._mem._data[key] = (cur, time.time() + seconds)  # type: ignore[attr-defined]
                return True
        return False

    def delete(self, *keys: str) -> int:
        if self._inner is not None:
            return int(self._inner.delete(*keys) or 0)
        with self._mem._lock:  # type: ignore[attr-defined]
            removed = 0
            for k in keys:
                if k in self._mem._data:  # type: ignore[attr-defined]
                    del self._mem._data[k]  # type: ignore[attr-defined]
                    removed += 1
            return removed

    def setex(self, key: str, seconds: int, value: str) -> bool:
        if self._inner is not None:
            return bool(self._inner.setex(key, seconds, value))
        return self._mem.setex(key, seconds, value)  # type: ignore[arg-type]

    def get(self, key: str) -> Optional[str]:
        if self._inner is not None:
            val = self._inner.get(key)
            return val.decode() if isinstance(val, bytes) else val
        val = self._mem.get(key)  # type: ignore[attr-defined]
        return val  # type: ignore[arg-type,return-value]


redis_client = _LegacyRedisClient()
