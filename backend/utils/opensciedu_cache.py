"""
OpenMTSciEd 代理响应缓存（Redis + 内存回退）

Key 格式: opensciedu:{org_id}:{resource}:{params_hash}
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any, Optional

from config.settings import settings

logger = logging.getLogger(__name__)

_memory_cache: dict[str, tuple[float, str]] = {}
_redis_client = None
_redis_checked = False


def _get_redis():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis

        client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        client.ping()
        _redis_client = client
        logger.info("OpenMTSciEd 缓存使用 Redis: %s", settings.REDIS_URL)
    except Exception as exc:  # noqa: BLE001
        logger.debug("OpenMTSciEd Redis 缓存不可用，使用内存: %s", exc)
        _redis_client = None
    return _redis_client


def build_cache_key(org_id: int, resource: str, params: Optional[dict] = None) -> str:
    raw = json.dumps(params or {}, sort_keys=True, ensure_ascii=False)
    digest = hashlib.md5(raw.encode()).hexdigest()[:12]
    return f"opensciedu:{org_id}:{resource}:{digest}"


def get_cached(org_id: int, resource: str, params: Optional[dict] = None) -> Optional[Any]:
    key = build_cache_key(org_id, resource, params)
    client = _get_redis()
    if client:
        try:
            raw = client.get(key)
            if raw:
                return json.loads(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis 读取 OpenMTSciEd 缓存失败: %s", exc)

    entry = _memory_cache.get(key)
    if not entry:
        return None
    expires_at, raw = entry
    if time.time() > expires_at:
        _memory_cache.pop(key, None)
        return None
    return json.loads(raw)


def set_cached(
    org_id: int,
    resource: str,
    value: Any,
    params: Optional[dict] = None,
    ttl: Optional[int] = None,
) -> None:
    key = build_cache_key(org_id, resource, params)
    ttl = ttl or settings.OPENSCIEDU_CACHE_TTL
    raw = json.dumps(value, ensure_ascii=False, default=str)

    client = _get_redis()
    if client:
        try:
            client.setex(key, ttl, raw)
            return
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis 写入 OpenMTSciEd 缓存失败: %s", exc)

    _memory_cache[key] = (time.time() + ttl, raw)


def invalidate_org(org_id: int) -> int:
    """清除某机构全部 OpenMTSciEd 缓存，返回删除数量"""
    prefix = f"opensciedu:{org_id}:"
    removed = 0

    client = _get_redis()
    if client:
        try:
            for key in client.scan_iter(match=f"{prefix}*"):
                client.delete(key)
                removed += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis 清除 OpenMTSciEd 缓存失败: %s", exc)

    mem_keys = [k for k in _memory_cache if k.startswith(prefix)]
    for k in mem_keys:
        _memory_cache.pop(k, None)
        removed += 1
    return removed
