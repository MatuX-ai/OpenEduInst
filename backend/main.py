from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from utils.database import engine, Base

# 导入所有模型以确保表被创建
# noqa: F401 表示忽略未使用导入的警告，因为这些模型需要被导入以创建数据库表
from models.base_models import User  # noqa: F401
from models.license import Organization  # noqa: F401
from models.user_organization import UserOrganization  # noqa: F401
from models.tenant import TenantConfig  # noqa: F401
from models.schedule import Lead  # noqa: F401

# 导入路由
from routes.license_routes import router as license_router
from routes.auth_routes import router as auth_router
from routes.org_creation_routes import router as org_creation_router
# from routes.user_organization_routes import router as user_org_router  # 暂时禁用
# from routes.user_license_routes import router as user_license_router  # 暂时禁用
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
    org_detail_router
)
from routes.org_overview_routes import router as org_overview_router

# 创建数据库表
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="OpenMT 教育机构管理系统",
    description="独立的教育机构管理系统 API",
    version="1.0.0",
)


# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册路由
app.include_router(auth_router)
app.include_router(org_creation_router)
app.include_router(license_router)
# app.include_router(user_org_router)  # 暂时禁用
# app.include_router(user_license_router)  # 暂时禁用
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
# 新注册的教育机构管理路由（放在最后，确保路由覆盖优先级）
app.include_router(edu_router)
app.include_router(org_detail_router)
app.include_router(org_overview_router)


@app.get("/favicon.ico")
@app.head("/favicon.ico")
def favicon():
    # 返回一个空的响应，避免404错误
    return Response(content="", media_type="image/x-icon")


@app.get("/")
def read_root():
    return {"message": "欢迎使用 OpenMT 教育机构管理系统"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
