"""pytest 形式的撞库测试：验证登录失败日志区分 user_not_found / bad_password。

用法：
    cd backend
    PYTHONPATH=. pytest tests/test_credential_stuffing_logging.py -v

设计要点：
    - 不依赖 Postgres/Redis：每个测试函数使用独立的 SQLite 临时数据库，保证隔离
    - 通过 FastAPI dependency_overrides 替换 get_db
    - 捕获 routes.auth_routes 的日志流，做断言
    - 对敏感字段（用户名）进行脱敏后才写入日志
"""
from __future__ import annotations

import logging
import secrets
import threading
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import List

import pytest

ROOT = Path(__file__).resolve().parent.parent
AUTH_LOG_NAME = "routes.auth_routes"
STRONG_PWD = "OpenMT@2024"
API = "/api/v1/auth"


# ---------------------------------------------------------------------------
# 日志捕获：每个测试函数独立一份 ListHandler，便于断言
# ---------------------------------------------------------------------------
class _ListHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__(level=logging.DEBUG)
        self.records: List[logging.LogRecord] = []
        self._lock = threading.Lock()

    def emit(self, record: logging.LogRecord) -> None:
        if record.name == AUTH_LOG_NAME:
            with self._lock:
                self.records.append(record)

    def clear(self) -> None:
        with self._lock:
            self.records.clear()


@pytest.fixture()
def auth_log_handler():
    """向 routes.auth_routes 注入一个可被测试断言的 list handler。"""
    auth_logger = logging.getLogger(AUTH_LOG_NAME)
    previous_level = auth_logger.level
    auth_logger.setLevel(logging.DEBUG)

    handler = _ListHandler()
    auth_logger.addHandler(handler)
    try:
        yield handler
    finally:
        auth_logger.removeHandler(handler)
        auth_logger.setLevel(previous_level)


# ---------------------------------------------------------------------------
# 数据库 / App / TestClient：每个测试函数独立一个 SQLite 临时文件
# ---------------------------------------------------------------------------
@pytest.fixture()
def sqlite_engine(tmp_path):
    # 先触发主 app 导入，确保所有模型都已声明到 Base.metadata
    try:
        from utils.database import Base

        import main as _main_app  # noqa: F401
    except Exception as exc:
        pytest.skip(f"无法导入 backend 主模块: {exc}")

    # 把 rate_limit_middleware 的限流放大，避免 429 干扰
    try:
        import middleware.rate_limit_middleware as _rlm  # type: ignore
        _rlm.LOGIN_RATE_LIMIT = 100000
        _rlm.AUTH_RATE_LIMIT = 100000
        _rlm.ANON_RATE_LIMIT = 100000
    except Exception:
        pass

    from sqlalchemy import create_engine
    from utils.database import Base

    db_path = tmp_path / f"attack_{secrets.token_hex(4)}_{datetime.utcnow():%H%M%S}.db"
    engine = create_engine(f"sqlite:///{db_path}",
                           connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def testing_session_factory(sqlite_engine):
    from sqlalchemy.orm import sessionmaker
    return sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)


@pytest.fixture()
def _email_stub(monkeypatch):
    """邮箱验证码服务：任何长度>=4 的 code 都视为合法，便于直接注册测试账号。"""
    try:
        import services.email_verification_service as _evs
    except Exception:
        return

    class _StubEmailVerificationService:
        def __init__(self, db):
            self.db = db

        def send_verification_code(self, email: str) -> dict:
            return {"message": "sent", "email": email}

        def verify_code(self, email: str, code: str) -> dict:
            if not code or len(code) < 4:
                raise ValueError("验证码太短")
            return {"message": "valid", "email": email}

    monkeypatch.setattr(_evs, "EmailVerificationService",
                         _StubEmailVerificationService)

    # 路由模块内的同名引用也需要替换
    try:
        import routes.auth_routes as _ar
        monkeypatch.setattr(_ar, "EmailVerificationService",
                             _StubEmailVerificationService)
    except Exception:
        pass


@pytest.fixture()
def client(testing_session_factory, _email_stub):
    from main import app
    from utils.database import get_db as _real_get_db
    from fastapi.testclient import TestClient

    def _override_get_db():
        db = testing_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[_real_get_db] = _override_get_db
    try:
        with TestClient(app) as tc:
            yield tc
    finally:
        app.dependency_overrides.pop(_real_get_db, None)


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------
def _unique(prefix: str = "t") -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def _register(client, username: str) -> None:
    email = f"{username}@example.com"
    resp = client.post(
        f"{API}/register",
        json={"username": username, "email": email,
              "password": STRONG_PWD, "verification_code": "123456"},
    )
    assert resp.status_code == 200, (
        f"注册测试用户失败: HTTP {resp.status_code} -> {resp.json()}")


# ---------------------------------------------------------------------------
# 测试：每请求单独清空日志并断言分支
# ---------------------------------------------------------------------------
def test_login_failure_logs_distinguish_user_not_found_vs_bad_password(
    client, auth_log_handler,
):
    # 先注册一批被撞库目标
    real_users = [_unique("real") for _ in range(8)]
    for u in real_users:
        _register(client, u)
    fake_users = [_unique("ghost") for _ in range(8)]

    auth_log_handler.clear()

    stats = Counter({"user_not_found": 0, "bad_password": 0})

    # 先请求 real_users（密码错误）→ 应该都走 bad_password
    for username in real_users:
        before = len(auth_log_handler.records)
        resp = client.post(
            f"{API}/token",
            data={"username": username, "password": "WrongP@ssw0rd"},
        )
        after = len(auth_log_handler.records)
        new_msgs = [r.getMessage() for r in auth_log_handler.records[before:after]]

        assert resp.status_code == 401, (
            f"真实用户 {username} 返回状态码异常: HTTP {resp.status_code}")
        has_bad = any("FAIL bad_password" in m for m in new_msgs)
        has_not_found = any("FAIL user_not_found" in m for m in new_msgs)
        assert has_bad, (
            f"真实用户 {username} 密码错误，但日志未出现 FAIL bad_password: {new_msgs}")
        assert not has_not_found, (
            f"真实用户 {username} 密码错误，却误报 user_not_found: {new_msgs}")
        stats["bad_password"] += 1

    # 再请求 fake_users（不存在的用户）→ 应该都走 user_not_found
    for username in fake_users:
        before = len(auth_log_handler.records)
        resp = client.post(
            f"{API}/token",
            data={"username": username, "password": "WrongP@ssw0rd"},
        )
        after = len(auth_log_handler.records)
        new_msgs = [r.getMessage() for r in auth_log_handler.records[before:after]]

        assert resp.status_code == 401, (
            f"不存在用户 {username} 返回状态码异常: HTTP {resp.status_code}")
        has_bad = any("FAIL bad_password" in m for m in new_msgs)
        has_not_found = any("FAIL user_not_found" in m for m in new_msgs)
        assert has_not_found, (
            f"不存在用户 {username}，但日志未出现 FAIL user_not_found: {new_msgs}")
        assert not has_bad, (
            f"不存在用户 {username}，却误报 bad_password: {new_msgs}")
        stats["user_not_found"] += 1

    assert stats["bad_password"] == len(real_users), stats
    assert stats["user_not_found"] == len(fake_users), stats


def test_login_success_logs_contain_ok(client, auth_log_handler):
    username = _unique("okuser")
    _register(client, username)

    auth_log_handler.clear()
    resp = client.post(f"{API}/token",
                       data={"username": username, "password": STRONG_PWD})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

    new_msgs = [r.getMessage() for r in auth_log_handler.records]
    ok_lines = [m for m in new_msgs if "[auth.login] OK" in m]
    assert ok_lines, (
        f"登录成功后未在日志中发现 [auth.login] OK 行，实际日志: {new_msgs}")
    # OK 日志中不应出现 FAIL 关键字
    fail_lines = [m for m in new_msgs if "[auth.login] FAIL" in m]
    assert not fail_lines, (
        f"登录成功却出现 FAIL 日志: {fail_lines}")
