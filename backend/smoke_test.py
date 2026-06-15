"""冒烟测试：直接运行 pytest 或 python smoke_test.py"""
import os
os.environ["DATABASE_URL"] = "sqlite:///./_smoke.db"
os.environ.setdefault("SECRET_KEY", "smoke-smoke-smoke-smoke-smoke-smoke-smoke-1234")

import sys
sys.path.insert(0, ".")

from utils.auth_utils import (
    create_access_token_sync, create_refresh_token_sync,
    verify_token_sync, require_org_context, require_role,
)
from middleware.tenant_isolation import TenantIsolationMiddleware
from routes.auth_routes import router as auth_router
from routes.student_routes import router as student_router
from routes.hardware_routes import router as hardware_router

# 1) token 往返
t = create_access_token_sync({"sub": "u", "org_id": 1})
p = verify_token_sync(t)
assert p["sub"] == "u" and p["org_id"] == 1 and p["type"] == "access", p

# 2) refresh token
r = create_refresh_token_sync({"sub": "u", "org_id": 1})
assert verify_token_sync(r)["type"] == "refresh"

# 3) bad token
assert verify_token_sync("not.valid.token") is None

# 4) require_* 依赖工厂成功导入，且为可调用对象
assert callable(require_org_context) and callable(require_role)

print("SMOKE_OK")
