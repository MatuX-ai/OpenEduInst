"""
OpenMT 教育机构管理系统 - 应用入口
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from middleware.audit_middleware import AuditMiddleware
from middleware.demo_readonly import DemoReadOnlyMiddleware
from middleware.rate_limit_middleware import RateLimitMiddleware
from middleware.tenant_isolation import TenantIsolationMiddleware
from utils.database import Base, engine

# 配置日志
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# -------- 模型注册 (触发建表) --------
from models.base_models import User  # noqa: F401
from models.license import Organization  # noqa: F401
from models.user_organization import UserOrganization  # noqa: F401
from models.tenant import TenantConfig, TenantFeatureFlag  # noqa: F401
from models.license import License  # noqa: F401
from models.student import Student, Enrollment, AttendanceRecord  # noqa: F401
from models.hardware_device import (  # noqa: F401
    HardwareDevice,
    DeviceMaintenanceRecord,
    DeviceUsageLog,
)

# -------- CORS: 从环境变量读取允许的前端域名 --------
_cors_raw = os.getenv("CORS_ALLOW_ORIGINS", "")
if _cors_raw:
    _allow_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]
else:
    # 本地开发默认宽松；生产必须显式配置
    _allow_origins = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# 安全配置
_enforce_https = os.getenv("ENFORCE_HTTPS", "0").lower() in ("1", "true", "yes")

# -------- 路由导入 --------
from routes.license_routes import router as license_router
from routes.auth_routes import router as auth_router
from routes.org_creation_routes import router as org_creation_router
from routes.schedule_routes import router as schedule_router
from routes.business_routes import router as business_router
from routes.tenant_routes import router as tenant_router
from routes.vocational_routes import router as vocational_router
from routes.student_routes import router as student_router
from routes.hardware_routes import router as hardware_router
from routes.token_routes import router as token_router
from routes.project_routes import router as project_router
from routes.space_routes import router as space_router
from routes.stem_test_routes import router as stem_test_router
from routes.leads_routes import router as leads_router
from routes.resource_routes import router as resource_router
from routes.competition_routes import router as competition_router
from routes.notification_routes import router as notification_router
from routes.marketing_routes import router as marketing_router
from routes.parent_portal_routes import router as parent_portal_router
from routes.educational_institution_routes import (
    router as edu_router,
    org_detail_router,
)
from routes.org_overview_routes import router as org_overview_router
from routes.cloud_backup_routes import router as cloud_backup_router
from routes.ai_assistant_routes import router as ai_assistant_router
from routes.websocket_routes import router as websocket_router


try:
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表初始化完成")
except Exception as exc:  # pragma: no cover
    logger.error("数据库初始化失败: %s", exc)


app = FastAPI(
    title="OpenMT 教育机构管理系统",
    description="多租户教育机构管理系统 API",
    version="1.0.0",
)


# 【安全】CORS：生产必须使用显式的域名白名单
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    max_age=600,
)

# 【审计】审计日志中间件（建议放在限流之后，写操作必记）
app.add_middleware(AuditMiddleware)

# 【审计】租户隔离中间件（注入 org_id/user_id 到 request.state）
app.add_middleware(TenantIsolationMiddleware)

# 【安全】限流中间件（放在最外层：先限流、再鉴权、再业务）
app.add_middleware(RateLimitMiddleware)

# 【演示】Demo 账号只读中间件（只拦截写操作）
if os.getenv("DEMO_MODE", "0").lower() in ("1", "true", "yes"):
    app.add_middleware(DemoReadOnlyMiddleware)
    logger.warning("DEMO_MODE=on：演示账号的写操作将被拦截")


# 【安全】统一响应头：HSTS / X-Content-Type-Options / X-Frame-Options
@app.middleware("http")
async def _security_headers(request, call_next):  # type: ignore[override]
    response = await call_next(request)
    if _enforce_https:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# -------- 路由注册 --------
app.include_router(auth_router)
app.include_router(org_creation_router)
app.include_router(license_router)
app.include_router(schedule_router)
app.include_router(business_router)
app.include_router(tenant_router)
app.include_router(vocational_router)
app.include_router(student_router)
app.include_router(hardware_router)
app.include_router(token_router)
app.include_router(project_router)
app.include_router(space_router)
app.include_router(stem_test_router)
app.include_router(leads_router)
app.include_router(resource_router)
app.include_router(competition_router)
app.include_router(notification_router)
app.include_router(marketing_router)
app.include_router(parent_portal_router)
app.include_router(edu_router)
app.include_router(org_detail_router)
app.include_router(org_overview_router)
app.include_router(cloud_backup_router)
app.include_router(ai_assistant_router)
app.include_router(websocket_router)


@app.get("/favicon.ico", include_in_schema=False)
@app.head("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(content="", media_type="image/x-icon")


@app.get("/")
def read_root():
    return {"message": "欢迎使用 OpenMT 教育机构管理系统"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
