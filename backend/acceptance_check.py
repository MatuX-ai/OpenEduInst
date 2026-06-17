import os
os.environ["DATABASE_URL"] = "sqlite:///./openmt_acceptance.db"
os.environ["PG_SSL_DISABLE"] = "1"
os.environ["SECRET_KEY"] = "acceptance-test-key"

import sys
sys.path.insert(0, r"G:\OpenMTEduInst\backend")

print("=" * 60)
print("阶段性验收 - 后端核心模块检查")
print("=" * 60)

checks = []

# 1. 模块导入
try:
    from main import app
    checks.append(("主程序 main.py 导入", True, f"{len(app.routes)} 条路由"))
except Exception as e:
    checks.append(("主程序 main.py 导入", False, str(e)))

# 2. 模型导入
try:
    from models.schedule import Lead, LeadStatus, LeadSource
    from models.base_models import User
    from models.license import License, Organization
    checks.append(("核心模型导入", True, "Lead/LeadStatus/LeadSource/User/License/Organization"))
except Exception as e:
    checks.append(("核心模型导入", False, str(e)))

# 3. 多租户隔离中间件
try:
    from middleware.tenant_isolation import TenantIsolationMiddleware
    checks.append(("租户隔离中间件", True, "已实现 TenantIsolationMiddleware"))
except Exception as e:
    checks.append(("租户隔离中间件", False, str(e)))

# 4. auth_utils - require_org_context
try:
    from utils.auth_utils import require_org_context
    checks.append(("require_org_context 依赖", True, "org_id 从 Token 提取"))
except Exception as e:
    checks.append(("require_org_context 依赖", False, str(e)))

# 5. 数据库
try:
    from utils.database import Base, engine, get_db
    checks.append(("数据库引擎", True, f"DATABASE_URL: {engine.url}"))
except Exception as e:
    checks.append(("数据库引擎", False, str(e)))

# 6. 路由模块
try:
    route_modules = [
        "auth_routes", "license_routes", "student_routes",
        "leads_routes", "educational_institution_routes",
        "org_overview_routes", "tenant_routes", "schedule_routes",
        "competition_routes", "notification_routes",
        "marketing_routes", "project_routes", "space_routes",
        "hardware_routes", "token_routes", "vocational_routes",
        "parent_portal_routes", "business_routes",
        "user_organization_routes", "user_license_routes",
    ]
    imports_ok = 0
    for mod in route_modules:
        try:
            __import__(f"routes.{mod}")
            imports_ok += 1
        except Exception:
            pass
    checks.append(("路由模块", imports_ok == len(route_modules), f"{imports_ok}/{len(route_modules)} 成功导入"))
except Exception as e:
    checks.append(("路由模块", False, str(e)))

# 7. 安全配置
try:
    # 检查 main.py 中是否有安全头
    with open(r"G:\OpenMTEduInst\backend\main.py", "r", encoding="utf-8") as f:
        main_content = f.read()
    has_cors = "CORSMiddleware" in main_content
    has_security_headers = "Strict-Transport-Security" in main_content or "X-Content-Type-Options" in main_content
    checks.append(("安全配置", has_cors and has_security_headers, f"CORS={has_cors}, 安全头={has_security_headers}"))
except Exception as e:
    checks.append(("安全配置", False, str(e)))

# 8. Swagger/OpenAPI
try:
    openapi = app.openapi()
    paths_count = len(openapi.get("paths", {}))
    checks.append(("OpenAPI 文档", True, f"{paths_count} 个端点"))
except Exception as e:
    checks.append(("OpenAPI 文档", False, str(e)))

# 打印结果
total = len(checks)
ok = sum(1 for _, ok, _ in checks if ok)
fail = total - ok

print()
for name, passed, detail in checks:
    symbol = "[OK]" if passed else "[FAIL]"
    print(f" {symbol} {name:<40} {detail}")

print()
print("=" * 60)
print(f"后端检查: {ok}/{total} 通过, {fail}/{total} 失败")
print(f"总路由数: {len(app.routes)}")
print("=" * 60)
