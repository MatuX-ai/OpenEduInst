"""
租户配置与菜单路由（多租户版）
提供获取当前组织功能开关和动态导航菜单的接口；org_id 一律从 Token 提取。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization, OrganizationType
from models.user_organization import UserOrganization, UserOrganizationRole
from services.tenant_init_service import TenantInitService

router = APIRouter(prefix="/api/v1/tenant", tags=["tenant"])

TEACHER_PORTAL_MENU: List[Dict[str, Any]] = [
    {"id": "teacher-dashboard", "title": "教学工作台", "icon": "co_present", "path": "teacher/dashboard"},
    {"id": "teacher-resources", "title": "STEM 资源库", "icon": "library_books", "path": "resources"},
    {"id": "teacher-schedule", "title": "我的课表", "icon": "calendar_month", "path": "schedule"},
    {"id": "teacher-ai", "title": "AI 助教", "icon": "psychology", "path": "ai-assistant"},
]


# 定义基础菜单结构 (按业务场景分组)
BASE_MENU = [
    {
        "id": "dashboard",
        "title": "经营仪表盘",
        "icon": "space_dashboard",
        "path": "dashboard",
    },
    {
        "id": "teacher-workbench",
        "title": "教学工作台",
        "icon": "co_present",
        "path": "teacher/dashboard",
    },
    {
        "id": "academic",
        "title": "教务中心",
        "icon": "school",
        "children": [
            {"id": "students", "title": "学员管理", "icon": "people", "path": "students"},
            {"id": "teachers", "title": "教师管理", "icon": "person", "path": "teachers"},
            {"id": "schedule", "title": "排课管理", "icon": "calendar_month", "path": "schedule"},
            {"id": "resources", "title": "教学资源", "icon": "library_books", "path": "resources"},
        ],
    },
    {
        "id": "marketing",
        "title": "招生与营销",
        "icon": "campaign",
        "children": [
            {"id": "marketing-center", "title": "营销中心", "icon": "trending_up", "path": "marketing"},
            {"id": "leads", "title": "招生线索", "icon": "person_search", "path": "leads"},
        ],
    },
    {"id": "classrooms", "title": "教室管理", "icon": "meeting_room", "path": "classrooms"},
    {"id": "equipment", "title": "设备与器材管理", "icon": "devices", "path": "devices"},
    {"id": "competitions", "title": "竞赛认证", "icon": "emoji_events", "path": "competitions"},
    {
        "id": "finance",
        "title": "财务与资产",
        "icon": "account_balance_wallet",
        "children": [
            {"id": "finance-dashboard", "title": "财务管理", "icon": "payments", "path": "finance"},
            {"id": "licenses", "title": "许可证/Token", "icon": "vpn_key", "path": "tokens"},
        ],
    },
    {"id": "multi-campus", "title": "多校区管理", "icon": "business", "path": "multi-campus"},
    {
        "id": "system",
        "title": "系统设置",
        "icon": "settings",
        "children": [
            {"id": "users", "title": "团队与权限", "icon": "group", "path": "users"},
            {"id": "notifications", "title": "消息中心", "icon": "notifications", "path": "notifications"},
            {"id": "parent-portal", "title": "家长中心", "icon": "family_restroom", "path": "parent-portal"},
            {"id": "settings", "title": "基础配置", "icon": "tune", "path": "settings"},
        ],
    },
]


ORG_SPECIFIC_MENU: Dict[OrganizationType, List[Dict[str, Any]]] = {
    OrganizationType.TRAINING: [],
    OrganizationType.K12: [
        {"id": "home-school", "title": "家校互动", "icon": "message", "path": "home-school"},
        {"id": "clubs", "title": "社团管理", "icon": "groups", "path": "clubs"},
    ],
    OrganizationType.VOCATIONAL: [
        {"id": "internship", "title": "实习跟踪", "icon": "work", "path": "internship"}
    ],
    OrganizationType.BUREAU: [
        {"id": "district-stats", "title": "辖区统计", "icon": "bar_chart", "path": "district-stats"}
    ],
}


@router.get("/menu")
@router.get("/menu/{org_id}")
def get_organization_menu(
    org_id: int | None = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的动态导航菜单（org_id 可从路径或 Token 获取）"""
    user, token_org_id = ctx
    effective_org_id = org_id if org_id is not None else token_org_id
    org = db.query(Organization).filter(Organization.id == effective_org_id).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    membership = (
        db.query(UserOrganization)
        .filter(
            UserOrganization.user_id == user.id,
            UserOrganization.org_id == effective_org_id,
            UserOrganization.is_active.is_(True),
        )
        .first()
    )
    role = membership.role if membership else UserOrganizationRole.STAFF

    if role == UserOrganizationRole.TEACHER:
        return {"menu": TEACHER_PORTAL_MENU}

    menu = BASE_MENU.copy()
    specific_items = ORG_SPECIFIC_MENU.get(org.org_type, [])
    menu.extend(specific_items)

    return {"menu": menu}


@router.get("/config")
@router.get("/config/{org_id}")
def get_organization_config(
    org_id: int | None = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的业务配置和功能开关（org_id 可从路径或 Token 获取）"""
    _, token_org_id = ctx
    effective_org_id = org_id if org_id is not None else token_org_id
    from models.tenant import TenantConfig, TenantFeatureFlag

    config = db.query(TenantConfig).filter(TenantConfig.org_id == effective_org_id).first()
    flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == effective_org_id).all()

    return {
        "config": config.config_data if config else {},
        "features": {f.feature_key: f.is_enabled for f in flags},
    }
