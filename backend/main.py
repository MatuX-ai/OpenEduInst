from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.database import engine, Base

# 导入所有模型以确保表被创建
from models.base_models import User, Teacher, Course
from models.license import Organization, License
from models.user_organization import UserOrganization
from models.tenant import TenantConfig, TenantFeatureFlag

# 导入路由
from routes.license_routes import router as license_router
from routes.auth_routes import router as auth_router
from routes.org_creation_routes import router as org_creation_router
# from routes.user_organization_routes import router as user_org_router  # 暂时禁用，依赖缺失
# from routes.user_license_routes import router as user_license_router  # 暂时禁用，依赖缺失
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

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OpenMT 教育机构管理系统",
    description="独立的教育机构管理系统 API",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {"message": "欢迎使用 OpenMT 教育机构管理系统"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
