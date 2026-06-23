"""OpenMTSciEd Redis/内存缓存层测试"""

import time

import pytest

from utils import opensciedu_cache as cache


@pytest.fixture(autouse=True)
def clear_memory_cache():
    cache._memory_cache.clear()
    yield
    cache._memory_cache.clear()


def test_build_cache_key_stable():
    k1 = cache.build_cache_key(1, "tutorials", {"page": 1, "size": 20})
    k2 = cache.build_cache_key(1, "tutorials", {"size": 20, "page": 1})
    assert k1 == k2
    assert k1.startswith("opensciedu:1:tutorials:")


def test_memory_cache_get_set():
    cache._redis_client = None
    cache._redis_checked = True

    assert cache.get_cached(9, "stats", None) is None
    cache.set_cached(9, "stats", {"tutorials": 3}, None, ttl=60)
    assert cache.get_cached(9, "stats", None) == {"tutorials": 3}


def test_memory_cache_expires():
    cache._redis_client = None
    cache._redis_checked = True

    cache.set_cached(9, "stats", {"tutorials": 1}, None, ttl=1)
    assert cache.get_cached(9, "stats", None) is not None

    key = cache.build_cache_key(9, "stats", None)
    expires_at, _ = cache._memory_cache[key]
    cache._memory_cache[key] = (time.time() - 1, cache._memory_cache[key][1])
    assert cache.get_cached(9, "stats", None) is None


def test_invalidate_org():
    cache._redis_client = None
    cache._redis_checked = True

    cache.set_cached(5, "stats", {"a": 1}, None, ttl=60)
    cache.set_cached(5, "tutorials", {"b": 2}, {"page": 1}, ttl=60)
    cache.set_cached(6, "stats", {"c": 3}, None, ttl=60)

    removed = cache.invalidate_org(5)
    assert removed >= 2
    assert cache.get_cached(5, "stats", None) is None
    assert cache.get_cached(6, "stats", None) == {"c": 3}
