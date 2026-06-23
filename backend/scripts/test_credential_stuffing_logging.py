"""模拟撞库攻击并校验 auth_routes.py 的失败日志是否正确区分：

   - 对「不存在的用户」：期望打出 `[auth.login] FAIL user_not_found username=...`
   - 对「存在的用户但密码错误」：期望打出 `[auth.login] FAIL bad_password user_id=... username=...`

实现方式：
   1. 临时把 DATABASE_URL 改为 SQLite（不污染开发/生产数据库）
   2. 以 FASTAPI TestClient 调用 /api/v1/auth/register 先注册若干“被撞库目标”
   3. 构造 username 清单：一半真实存在（但密码错误），另一半随机不存在
   4. 并发/顺序调用 /api/v1/auth/token 进行撞库
   5. 捕获 routes.auth_routes 日志流，断言每条请求对应日志中出现且仅出现一种 FAIL 标记
"""
from __future__ import annotations

import logging
import pathlib
import secrets
import sys
import threading
from collections import Counter
from datetime import datetime
from typing import List

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# —— Logger：专门捕获 auth_routes 的日志行 ——
AUTH_LOG_NAME = "routes.auth_routes"
auth_logger = logging.getLogger(AUTH_LOG_NAME)
auth_logger.setLevel(logging.DEBUG)

captured: List[logging.LogRecord] = []
_capture_lock = threading.Lock()


class _ListHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        if record.name == AUTH_LOG_NAME:
            with _capture_lock:
                captured.append(record)


_list_handler = _ListHandler(level=logging.DEBUG)
auth_logger.addHandler(_list_handler)

# 同时也输出到 stderr（带统一格式），方便人工看
_stderr_handler = logging.StreamHandler(sys.stderr)
_stderr_handler.setFormatter(
    logging.Formatter("%(asctime)s %(levelname)s %(name)s | %(message)s",
                      datefmt="%H:%M:%S"))
_stderr_handler.setLevel(logging.DEBUG)
auth_logger.addHandler(_stderr_handler)
auth_logger.propagate = False


# —— 依赖 & Middleware ——
# 限流中间件降级（撞库脚本会连续发请求，避免测试被 429 拦截）
try:
    import middleware.rate_limit_middleware as _rlm  # type: ignore
    _rlm.LOGIN_RATE_LIMIT = 100000
    _rlm.AUTH_RATE_LIMIT = 100000
    _rlm.ANON_RATE_LIMIT = 100000
    _rlm.LOGIN_WINDOW_SEC = 3600
    _rlm.AUTH_WINDOW_SEC = 3600
    _rlm.ANON_WINDOW_SEC = 3600
    try:
        _rlm._memory_store.reset()
    except Exception:
        pass
except Exception:
    pass

# —— 准备 SQLite 临时数据库 ——
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from utils.database import Base, get_db as _real_get_db  # noqa: E402

# 先 import 主入口，触发各模型/路由注册到 Base.metadata / FastAPI app
import main as _main_mod  # noqa: E402, F401

_tmp_dir = ROOT / "_tmp_cred_stuff"
_tmp_dir.mkdir(exist_ok=True)
_db_path = _tmp_dir / f"attack_{secrets.token_hex(4)}_{datetime.utcnow():%H%M%S}.db"

engine = create_engine(f"sqlite:///{_db_path}", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


from main import app  # noqa: E402
app.dependency_overrides[_real_get_db] = _override_get_db


# —— 邮箱验证码服务降级：任何 code 长度>=4 都视为通过 ——
import services.email_verification_service as _evs  # noqa: E402


class _StubEmailVerificationService:
    def __init__(self, db):
        self.db = db

    def send_verification_code(self, email: str) -> dict:
        return {"message": "sent", "email": email}

    def verify_code(self, email: str, code: str) -> dict:
        if not code or len(code) < 4:
            raise ValueError("验证码太短")
        return {"message": "valid", "email": email}


_evs.EmailVerificationService = _StubEmailVerificationService
try:
    import routes.auth_routes as _ar
    _ar.EmailVerificationService = _StubEmailVerificationService
except Exception:
    pass


# —— 常量 ——
API = "/api/v1/auth"
STRONG_PWD = "OpenMT@2024"
REAL_USERS: List[str] = []   # 注册成功后填充
FAKE_USERS: List[str] = []   # 撞库用“不存在的用户”


# —— 工具：生成唯一用户名 ——
def _unique(prefix: str = "t") -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


# —— 注册一批真实用户，作为撞库目标 ——
def _seed_real_users(client, n: int = 10) -> None:
    for i in range(n):
        username = _unique("real")
        email = f"{username}@example.com"
        payload = {
            "username": username, "email": email,
            "password": STRONG_PWD, "verification_code": "123456",
        }
        resp = client.post(f"{API}/register", json=payload)
        if resp.status_code != 200:
            raise RuntimeError(
                f"注册测试用户失败：HTTP {resp.status_code} -> {resp.json()}")
        REAL_USERS.append(username)
    print(f"[SETUP] 已注册 {len(REAL_USERS)} 个真实用户作为撞库目标",
          file=sys.stderr)


# —— 构造撞库请求批次 ——
def _build_attack_batches(real_n: int = 10, fake_n: int = 10) -> List[str]:
    """返回 username 列表，其中一半是刚注册的真实用户（但密码错误），一半不存在。"""
    real = REAL_USERS[:real_n]
    fakes = [_unique("ghost") for _ in range(fake_n)]
    return real + fakes


# —— 执行撞库：每次调用前清空日志队列，便于按请求定位 ——
def _run_attack(client) -> dict:
    """返回统计信息：Counter 按 FAIL 类型计数。"""
    stats = Counter({"user_not_found": 0, "bad_password": 0, "ok": 0, "unexpected": 0})

    # 先把历史日志（注册阶段）清理掉，避免污染断言
    with _capture_lock:
        captured.clear()

    for username in _build_attack_batches(real_n=len(REAL_USERS), fake_n=len(REAL_USERS)):
        # 每次请求单独 slice：captured[:] 只看本次新增（由于同步请求，可以 len(captured_before) 做记号）
        before = len(captured)
        resp = client.post(
            f"{API}/token",
            data={"username": username, "password": "WrongP@ssw0rd"},
        )
        after = len(captured)
        new_records = captured[before:after]
        msg_texts = [r.getMessage() for r in new_records]

        # 对外部响应：不管是用户不存在 / 密码错误，都应是 401，且 detail 相同
        assert resp.status_code == 401, (
            f"撞库请求返回错误状态码：HTTP {resp.status_code} body={resp.json()}")

        # 统计与断言日志
        has_user_not_found = any("FAIL user_not_found" in m for m in msg_texts)
        has_bad_password = any("FAIL bad_password" in m for m in msg_texts)

        if username in REAL_USERS:
            # 真实用户但密码错误 → 必须有 bad_password，且不能有 user_not_found
            assert has_bad_password, (
                f"真实用户 {username} 密码错误，但未在日志中看到 FAIL bad_password：{msg_texts}")
            assert not has_user_not_found, (
                f"真实用户 {username} 密码错误，却误报 user_not_found：{msg_texts}")
            stats["bad_password"] += 1
        else:
            # 不存在用户 → 必须有 user_not_found，且不能有 bad_password
            assert has_user_not_found, (
                f"不存在用户 {username}，但未在日志中看到 FAIL user_not_found：{msg_texts}")
            assert not has_bad_password, (
                f"不存在用户 {username}，却误报 bad_password：{msg_texts}")
            stats["user_not_found"] += 1

    return dict(stats)


# —— 主流程 ——
def main() -> int:
    from fastapi.testclient import TestClient  # noqa: E402
    client = TestClient(app)

    print("[1/3] 注册撞库目标用户 ...", file=sys.stderr)
    _seed_real_users(client, n=10)

    print("[2/3] 执行撞库请求（每请求独立断言日志分支） ...", file=sys.stderr)
    stats = _run_attack(client)

    print("[3/3] 汇总结果：", file=sys.stderr)
    for k, v in stats.items():
        print(f"      {k:20s}: {v}", file=sys.stderr)

    expected_real = len(REAL_USERS)
    expected_fake = len(REAL_USERS)
    assert stats["user_not_found"] == expected_fake, (
        f"user_not_found 计数不符：期望 {expected_fake}，实际 {stats['user_not_found']}")
    assert stats["bad_password"] == expected_real, (
        f"bad_password 计数不符：期望 {expected_real}，实际 {stats['bad_password']}")

    print("\n[SUCCESS] auth_routes.py 正确区分 user_not_found / bad_password",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
