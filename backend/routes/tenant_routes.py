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

# 定义基础菜单结构
BASE_MENU = [
    {"id": "dashboard", "title": "仪表盘", "icon": "dashboard", "path": "dashboard"},
    {"id": "classrooms", "title": "教室管理", "icon": "class", "path": "classrooms"},
    {"id": "teachers", "title": "教师管理", "icon": "person", "path": "teachers"},
    {"id": "students", "title": "学员管理", "icon": "school", "path": "students"},
    {"id": "roles", "title": "角色权限", "icon": "admin_panel_settings", "path": "roles"},
    {"id": "analytics", "title": "数据看板", "icon": "insights", "path": "analytics"}
]

ORG_SPECIFIC_MENU: Dict[OrganizationType, List[Dict[str, Any]]] = {
    OrganizationType.TRAINING: [
        {"id": "finance", "title": "财务管理", "icon": "account_balance_wallet", "path": "finance"},
        {"id": "wechat-cs", "title": "微信客服", "icon": "wechat", "path": "wechat-cs"},
        {"id": "schedule", "title": "排课管理", "icon": "event", "path": "schedule"}
    ],
    OrganizationType.K12: [
        {"id": "home-school", "title": "家校互动", "icon": "message", "path": "home-school"},
        {"id": "schedule", "title": "课表查询", "icon": "event_note", "path": "schedule"}
    ],
    OrganizationType.VOCATIONAL: [
        {"id": "finance", "title": "财务管理", "icon": "account_balance_wallet", "path": "finance"},
        {"id": "training", "title": "实训管理", "icon": "build", "path": "training"},
        {"id": "internship", "title": "实习跟踪", "icon": "work", "path": "internship"}
    ],
    OrganizationType.BUREAU: [
        {"id": "district-stats", "title": "辖区统计", "icon": "bar_chart", "path": "district-stats"},
        {"id": "security", "title": "安全预警", "icon": "security", "path": "security"}
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
