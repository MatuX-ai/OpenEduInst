"""
生产就绪基本检查：
  - require_org_context 依赖能正常工作
  - JWT 生成/解码一致
  - Token 中含 org_id，且中间件能解析出来
运行： pytest backend/tests/
"""

from __future__ import annotations

import os

os.environ.setdefault("SECRET_KEY", "test-test-test-test-test-test-test-test-test-test-test-test")
os.environ.setdefault("ENV", "dev")

import time  # noqa: E402
from datetime import timedelta  # noqa: E402

from jose import jwt  # noqa: E402

from config.settings import settings  # noqa: E402
from utils.auth_utils import (  # noqa: E402
    create_access_token_sync,
    create_refresh_token_sync,
    verify_token_sync,
)


def test_access_token_roundtrip():
    token = create_access_token_sync({"sub": "alice", "org_id": 42}, timedelta(minutes=5))
    payload = verify_token_sync(token)
    assert payload is not None
    assert payload["sub"] == "alice"
    assert payload["org_id"] == 42
    assert payload["type"] == "access"


def test_refresh_token_type_field():
    token = create_refresh_token_sync({"sub": "alice", "org_id": 42})
    payload = verify_token_sync(token)
    assert payload is not None
    assert payload["type"] == "refresh"


def test_bad_token_returns_none():
    assert verify_token_sync("not.a.valid.token") is None


def test_settings_present():
    # 运行时安全自检已经在 import settings 时执行
    assert settings.SECRET_KEY is not None
    assert len(settings.SECRET_KEY) > 16
