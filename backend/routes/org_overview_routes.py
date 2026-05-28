"""
机构概览API路由
为前端 OrganizationDashboardService 提供机构概览数据
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from utils.database import get_db
from models.license import Organization
from models.student import Student
from models.base_models import Teacher, Course
from sqlalchemy import func

router = APIRouter(prefix="/api/v1/org", tags=["机构概览"])


@router.get("/{org_id}/overview")
def get_organization_overview(org_id: int, db: Session = Depends(get_db)):
    """
    获取机构概览信息
    返回 OrganizationOverview 格式的数据
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    total_licenses = 0
    active_licenses = 0
    total_users = db.query(func.count(Teacher.id)).filter(Teacher.org_id == org_id).scalar() or 0
    total_courses = db.query(func.count(Course.id)).filter(Course.org_id == org_id).scalar() or 0
    
    # Organization 没有 created_at/updated_at 字段，使用当前时间
    now_str = None

    return {
        "id": org.id,
        "name": org.name,
        "contact_email": org.contact_email or "",
        "phone": org.phone or "",
        "address": org.address or "",
        "max_users": org.max_users or 0,
        "is_active": getattr(org, 'is_active', True),
        "created_at": "",
        "updated_at": "",
        "org_type": org.org_type.value if hasattr(org.org_type, 'value') else str(org.org_type),
        "statistics": {
            "total_licenses": total_licenses,
            "active_licenses": active_licenses,
            "total_users": total_users,
            "total_courses": total_courses,
            "storage_used_mb": 0,
            "storage_limit_mb": 1024,
        },
    }
