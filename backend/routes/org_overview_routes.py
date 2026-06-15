"""
机构概览API路由（多租户版）
org_id 一律从 Token 提取，禁止通过 URL/query 传入跨组织查询。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.student import Student
from models.base_models import Teacher, Course
from sqlalchemy import func

router = APIRouter(prefix="/api/v1/org", tags=["机构概览"])


@router.get("/overview")
def get_organization_overview(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构概览信息（org_id 来自 Token）"""
    _, org_id = ctx
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    total_licenses = 0
    active_licenses = 0
    total_users = db.query(func.count(Teacher.id)).filter(Teacher.org_id == org_id).scalar() or 0
    total_courses = db.query(func.count(Course.id)).filter(Course.org_id == org_id).scalar() or 0

    return {
        "id": org.id,
        "name": org.name,
        "contact_email": org.contact_email or "",
        "phone": org.phone or "",
        "address": org.address or "",
        "max_users": org.max_users or 0,
        "is_active": getattr(org, "is_active", True),
        "created_at": "",
        "updated_at": "",
        "org_type": org.org_type.value if hasattr(org.org_type, "value") else str(org.org_type),
        "statistics": {
            "total_licenses": total_licenses,
            "active_licenses": active_licenses,
            "total_users": total_users,
            "total_courses": total_courses,
            "storage_used_mb": 0,
            "storage_limit_mb": 1024,
        },
    }
