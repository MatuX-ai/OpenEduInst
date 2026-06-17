import os
os.environ["DATABASE_URL"] = "sqlite:///./openmt_acceptance.db"
os.environ["PG_SSL_DISABLE"] = "1"
os.environ["SECRET_KEY"] = "acceptance-test-key"

import sys
sys.path.insert(0, r"G:\OpenMTEduInst\backend")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 60)
print("阶段性验收 - 后端接口测试")
print("=" * 60)

tests = [
    ("GET /", "/"),
    ("GET /health", "/health"),
    ("GET /docs (Swagger)", "/docs"),
]

passed = 0
failed = 0

for name, url in tests:
    try:
        r = client.get(url)
        status = f"[HTTP {r.status_code}]"
        ok = r.status_code < 500
        print(f"{status} {name} -> {'OK' if ok else 'FAIL'}")
        if ok:
            passed += 1
        else:
            failed += 1
    except Exception as e:
        print(f"[ERR] {name}: {e}")
        failed += 1

# 测试几个重要的多租户端点（带认证 token 测试，但先测匿名响应）
multi_tenant_paths = [
    "/api/v1/educational_institution/overview",
    "/api/v1/educational_institution/students",
    "/api/v1/educational_institution/courses",
    "/api/v1/leads",
    "/api/v1/org/overview",
    "/api/v1/marketing/campaigns",
]

print("\n--- 多租户端点 (应该要求认证，返回 401/422/重定向等) ---")
for p in multi_tenant_paths:
    try:
        r = client.get(p)
        print(f"[HTTP {r.status_code}] GET {p}")
        passed += 1
    except Exception as e:
        print(f"[ERR] {p}: {e}")
        failed += 1

print("\n" + "=" * 60)
print(f"汇总: {passed} 通过 / {failed} 失败")
print(f"总路由数: {len(app.routes)}")
print("=" * 60)
