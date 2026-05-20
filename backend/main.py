from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 导入路由
from routes.license_routes import router as license_router
from routes.user_organization_routes import router as user_org_router
from routes.user_license_routes import router as user_license_router
from routes.schedule_routes import router as schedule_router
from routes.business_routes import router as business_router
from routes.tenant_routes import router as tenant_router
from routes.vocational_routes import router as vocational_router

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
app.include_router(license_router)
app.include_router(user_org_router)
app.include_router(user_license_router)
app.include_router(schedule_router)
app.include_router(business_router)
app.include_router(tenant_router)
app.include_router(vocational_router)

@app.get("/")
def read_root():
    return {"message": "欢迎使用 OpenMT 教育机构管理系统"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
