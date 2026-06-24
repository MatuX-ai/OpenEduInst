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
from models.token_billing import (  # noqa: F401
    TokenOrder,
    TokenOrderStatus,
    PaymentMethod,
    TokenPackage,
    TokenBalance,
)
from models.club import (  # noqa: F401
    Club, ClubMember, ClubActivity, ClubAttendance,
    ClubRecruitment, ClubApplication,
)
from models.consumable import (  # noqa: F401
    Consumable, ConsumableUsage, ConsumablePurchaseRequest, PurchaseRequestItem,
)
from models.vocational_equipment import (  # noqa: F401
    VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance,
    VocFaultReport, VocInventoryRecord,
)
from models.vocational_safety import (  # noqa: F401
    VocSafetyCertification, VocSafetyChecklist, VocIncidentReport,
    VocCourse, VocTrainingRoom, VocTrainingSchedule,
)
from models.vocational_cooperation import (  # noqa: F401
    VocEnterprise, VocEnterpriseDemand, VocCooperationProject,
    VocProjectMilestone, VocCompetition, VocCompetitionRegistration,
    VocInternshipPosition, VocInternshipRecord, VocEmploymentRecord,
    VocIncubatorProject, VocIncubatorMember,
)
from models.vocational_assessment import (  # noqa: F401
    VocSkillStandard, VocSkillAssessment, VocCertificate,
)
from models.bureau_models import (  # noqa: F401
    BureauSchool, SchoolSTEMScore, BureauEquipmentPool,
    EquipmentRequest, EquipmentAllocation, CrossSchoolSharing,
    TrainingSession, TrainingRegistration,
    BureauCompetition, CompetitionResult,
    BudgetPlan, BudgetExpense,
    BureauCurriculumResource,
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
from routes.token_purchase_routes import router as token_purchase_router
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
    org_scoped_router,
)
from routes.org_overview_routes import router as org_overview_router
from routes.cloud_backup_routes import router as cloud_backup_router
from routes.ai_assistant_routes import router as ai_assistant_router
from routes.websocket_routes import router as websocket_router
from routes.opensciedu_routes import router as opensciedu_router
# 新增：审计日志路由 & 系统设置路由
from routes.audit_routes import router as audit_router
from routes.system_routes import router as system_router
# 新增：STEM 社团 & 耗材 & 看板路由
from routes.club_routes import router as club_router
from routes.consumable_routes import router as consumable_router
from routes.stem_dashboard_routes import router as stem_dashboard_router
from routes.demo_routes import router as demo_router
# 新增：职业学校 安全/教务/合作/竞赛/评估 路由
from routes.vocational_safety_routes import router as vocational_safety_router
from routes.vocational_cooperation_routes import router as vocational_cooperation_router
from routes.vocational_assessment_routes import router as vocational_assessment_router
from routes.bureau_routes import router as bureau_router


try:
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表初始化完成")
except Exception as exc:  # pragma: no cover
    logger.error("数据库初始化失败: %s", exc)

# 【安全】初始化 PostgreSQL Schema 级多租户隔离（仅 PG 引擎生效）
try:
    from utils.schema_isolation import init_schema_isolation

    init_schema_isolation(engine)
except Exception as exc:  # noqa: BLE001
    logger.warning("Schema 隔离初始化失败（非阻塞）: %s", exc)


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


# 【安全】统一响应头：HSTS / X-Content-Type-Options / X-Frame-Options / CSP
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
    # CSP 头：仅允许同源资源，禁止 inline script（生产环境推荐严格策略）
    _csp = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; "
        "font-src 'self' data:; "
        "connect-src 'self' ws: wss:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    response.headers["Content-Security-Policy"] = _csp
    # 权限策略：禁用未使用的浏览器能力
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=(), payment=()"
    )
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
app.include_router(token_purchase_router)
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
app.include_router(org_scoped_router)
app.include_router(org_overview_router)
app.include_router(cloud_backup_router)
app.include_router(ai_assistant_router)
app.include_router(websocket_router)
app.include_router(opensciedu_router)
# 新增：审计日志 & 系统设置
app.include_router(audit_router)
app.include_router(system_router)
# 新增：STEM 社团 & 耗材 & 看板
app.include_router(club_router)
app.include_router(consumable_router)
app.include_router(stem_dashboard_router)
app.include_router(demo_router)
# 注册：职业学校 安全/教务/合作/竞赛/评估 路由
app.include_router(vocational_safety_router)
app.include_router(vocational_cooperation_router)
app.include_router(vocational_assessment_router)
# 注册：教育局管理平台 路由
app.include_router(bureau_router)


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


@app.on_event("startup")
async def _on_startup():
    logger.info(
        "系统启动完成。已加载模块: 审计日志 / 限流 / 多租户隔离 / Token黑名单 / 细粒度RBAC / 数据脱敏"
    )
    # 打印可用的配置
    logger.info(
        "ENV: LOG_LEVEL=%s, AUDIT_LEVEL=%s, AUDIT_RECORD_BODY=%s, DEMO_MODE=%s",
        os.getenv("LOG_LEVEL", "INFO"),
        os.getenv("AUDIT_LEVEL", "write"),
        os.getenv("AUDIT_RECORD_BODY", "true"),
        os.getenv("DEMO_MODE", "off"),
    )
