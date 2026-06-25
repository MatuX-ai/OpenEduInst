"""
路由包初始化 - 集中管理所有路由模块的导入与导出

用法：
    from routes import ALL_ROUTERS
    for router in ALL_ROUTERS:
        app.include_router(router)
"""

# 基础业务路由
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

# 营销 & 门户路由
from routes.leads_routes import router as leads_router
from routes.resource_routes import router as resource_router
from routes.competition_routes import router as competition_router
from routes.notification_routes import router as notification_router
from routes.marketing_routes import router as marketing_router
from routes.parent_portal_routes import router as parent_portal_router

# 教育机构路由（含三个路由器）
from routes.educational_institution_routes import (
    router as edu_router,
    org_detail_router,
    org_scoped_router,
)
from routes.org_overview_routes import router as org_overview_router

# 云备份 & AI 助教 & WebSocket
from routes.cloud_backup_routes import router as cloud_backup_router
from routes.ai_assistant_routes import router as ai_assistant_router
from routes.websocket_routes import router as websocket_router

# OpenMTSciEd 集成
from routes.opensciedu_routes import router as opensciedu_router

# 审计日志 & 系统设置
from routes.audit_routes import router as audit_router
from routes.system_routes import router as system_router

# STEM 社团 & 耗材 & 看板 & Demo
from routes.club_routes import router as club_router
from routes.consumable_routes import router as consumable_router
from routes.stem_dashboard_routes import router as stem_dashboard_router
from routes.demo_routes import router as demo_router

# 职业学校：安全/教务/合作/竞赛/评估
from routes.vocational_safety_routes import router as vocational_safety_router
from routes.vocational_cooperation_routes import router as vocational_cooperation_router
from routes.vocational_assessment_routes import router as vocational_assessment_router

# 教育局管理平台
from routes.bureau_routes import router as bureau_router

# 考试管理
from routes.exam_routes import router as exam_router


# 批量注册用的路由列表（保持注册顺序与功能分组一致）
ALL_ROUTERS = [
    # ---- 认证 & 组织 ----
    auth_router,
    org_creation_router,
    license_router,
    # ---- 日程 & 业务 ----
    schedule_router,
    business_router,
    tenant_router,
    # ---- 职业学校（旧） ----
    vocational_router,
    # ---- 学生 & 硬件 ----
    student_router,
    hardware_router,
    # ---- Token ----
    token_router,
    token_purchase_router,
    # ---- 项目 & 空间 & STEM 测试 ----
    project_router,
    space_router,
    stem_test_router,
    # ---- 营销 & 门户 ----
    leads_router,
    resource_router,
    competition_router,
    notification_router,
    marketing_router,
    parent_portal_router,
    # ---- 教育机构 ----
    edu_router,
    org_detail_router,
    org_scoped_router,
    org_overview_router,
    # ---- 云备份 & AI & WebSocket ----
    cloud_backup_router,
    ai_assistant_router,
    websocket_router,
    # ---- OpenMTSciEd ----
    opensciedu_router,
    # ---- 审计日志 & 系统设置 ----
    audit_router,
    system_router,
    # ---- STEM 社团 & 耗材 & 看板 ----
    club_router,
    consumable_router,
    stem_dashboard_router,
    demo_router,
    # ---- 职业学校（新）：安全/教务/合作/竞赛/评估 ----
    vocational_safety_router,
    vocational_cooperation_router,
    vocational_assessment_router,
    # ---- 教育局 ----
    bureau_router,
    # ---- 考试管理 ----
    exam_router,
]