"""
租户配置与菜单路由
提供获取当前组织功能开关和动态导航菜单的接口
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from utils.database import get_db
from models.license import OrganizationType
from services.tenant_init_service import TenantInitService

router = APIRouter(
    prefix="/tenant",
    tags=["tenant"]
)

# 定义基础菜单结构 (按业务场景分组)
BASE_MENU = [
    {
        "id": "overview",
        "title": "经营概览",
        "icon": "dashboard",
        "children": [
            {"id": "dashboard", "title": "经营仪表盘", "icon": "space_dashboard", "path": "dashboard"}
        ]
    },
    {
        "id": "academic",
        "title": "教务中心",
        "icon": "school",
        "children": [
            {"id": "students", "title": "学员管理", "icon": "people", "path": "students"},
            {"id": "teachers", "title": "教师管理", "icon": "person", "path": "teachers"},
            {"id": "schedule", "title": "排课管理", "icon": "calendar_month", "path": "schedule"}
        ]
    },
    {
        "id": "marketing",
        "title": "招生与营销",
        "icon": "campaign",
        "children": [
            {"id": "marketing-center", "title": "营销中心", "icon": "trending_up", "path": "marketing"},
            {"id": "parent-portal", "title": "家长中心", "icon": "family_restroom", "path": "parent-portal"},
            {"id": "resources", "title": "教学资源", "icon": "library_books", "path": "resources"}
        ]
    },
    {
        "id": "stem-lab",
        "title": "STEM 实验室",
        "icon": "science",
        "children": [
            {"id": "projects", "title": "项目管理", "icon": "account_tree", "path": "projects"},
            {"id": "devices", "title": "设备与空间", "icon": "devices", "path": "devices"},
            {"id": "competitions", "title": "竞赛认证", "icon": "emoji_events", "path": "competitions"}
        ]
    },
    {
        "id": "finance",
        "title": "财务与资产",
        "icon": "account_balance_wallet",
        "children": [
            {"id": "finance-dashboard", "title": "财务管理", "icon": "payments", "path": "finance"},
            {"id": "licenses", "title": "许可证/Token", "icon": "vpn_key", "path": "licenses"},
            {"id": "multi-campus", "title": "多校区管理", "icon": "business", "path": "multi-campus"}
        ]
    },
    {
        "id": "system",
        "title": "系统设置",
        "icon": "settings",
        "children": [
            {"id": "users", "title": "团队与权限", "icon": "group", "path": "users"},
            {"id": "notifications", "title": "消息中心", "icon": "notifications", "path": "notifications"},
            {"id": "settings", "title": "基础配置", "icon": "tune", "path": "settings"}
        ]
    }
]

# 针对不同组织类型的补充菜单项（已整合进 BASE_MENU，此处保留作为扩展点）
ORG_SPECIFIC_MENU: Dict[OrganizationType, List[Dict[str, Any]]] = {
    OrganizationType.TRAINING: [],
    OrganizationType.K12: [
        {"id": "home-school", "title": "家校互动", "icon": "message", "path": "home-school"},
        {"id": "clubs", "title": "社团管理", "icon": "groups", "path": "clubs"}
    ],
    OrganizationType.VOCATIONAL: [
        {"id": "internship", "title": "实习跟踪", "icon": "work", "path": "internship"}
    ],
    OrganizationType.BUREAU: [
        {"id": "district-stats", "title": "辖区统计", "icon": "bar_chart", "path": "district-stats"}
    ]
}

@router.get("/menu/{org_id}")
def get_organization_menu(org_id: int, db: Session = Depends(get_db)):
    """获取指定组织的动态导航菜单"""
    # 实际项目中应从数据库查询 org_type
    # 这里为了演示，假设我们有一个方法能获取到类型
    from models.license import Organization
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    menu = BASE_MENU.copy()
    specific_items = ORG_SPECIFIC_MENU.get(org.org_type, [])
    menu.extend(specific_items)
    
    return {"menu": menu}

@router.get("/config/{org_id}")
def get_organization_config(org_id: int, db: Session = Depends(get_db)):
    """获取指定组织的业务配置和功能开关"""
    from models.tenant import TenantConfig, TenantFeatureFlag
    
    config = db.query(TenantConfig).filter(TenantConfig.org_id == org_id).first()
    flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org_id).all()
    
    return {
        "config": config.config_data if config else {},
        "features": {f.feature_key: f.is_enabled for f in flags}
    }
