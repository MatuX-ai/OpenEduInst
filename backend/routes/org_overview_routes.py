"""
机构概览API路由（多租户版）
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


def _build_overview(org_id: int, db: Session) -> dict:
    """构建机构概览数据（内部复用）"""
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
        "website": getattr(org, "website", "") or "",
        "max_users": org.max_users or 0,
        "is_active": getattr(org, "is_active", True),
        "created_at": org.created_at.isoformat() if getattr(org, "created_at", None) else "",
        "updated_at": org.updated_at.isoformat() if getattr(org, "updated_at", None) else "",
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


def _build_dashboard(org_id: int, db: Session) -> dict:
    """构建Dashboard数据（匹配前端DashboardData接口）"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    student_count = db.query(func.count(Student.id)).filter(Student.org_id == org_id).scalar() or 0
    teacher_count = db.query(func.count(Teacher.id)).filter(
        Teacher.org_id == org_id, Teacher.is_active == True
    ).scalar() or 0
    course_count = db.query(func.count(Course.id)).filter(
        Course.org_id == org_id, Course.is_active == True
    ).scalar() or 0
    total_users = student_count + teacher_count

    total_licenses = 0
    active_licenses = 0

    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "contact_email": org.contact_email or "",
            "phone": org.phone or "",
            "address": org.address or "",
            "website": getattr(org, "website", "") or "",
            "max_users": org.max_users or 0,
            "is_active": getattr(org, "is_active", True),
            "created_at": org.created_at.isoformat() if getattr(org, "created_at", None) else "",
            "updated_at": org.updated_at.isoformat() if getattr(org, "updated_at", None) else "",
        },
        "statistics": {
            "activeLicenses": active_licenses,
            "totalProjects": course_count,
            "totalUsers": total_users,
            "hardwareConsumption": 0,
            "licenseRemaining": total_licenses - active_licenses,
            "newProjectsThisMonth": 0,
            "activeUsers": total_users,
            "storageUsed": 0,
            "storageTotal": 1024,
        },
        "charts": {
            "userGrowthData": [],
            "projectTrendData": [],
            "hardwareUsageData": [],
            "licenseUsageData": [],
        },
        "recentActivities": [],
        "alerts": [],
    }


@router.get("/overview")
@router.get("/{org_id}/overview")
def get_organization_overview(
    org_id: int | None = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构概览信息（org_id 可从路径或 Token 获取）"""
    _, token_org_id = ctx
    effective_org_id = org_id if org_id is not None else token_org_id
    return _build_overview(effective_org_id, db)


@router.get("/{org_id}/dashboard")
def get_organization_dashboard(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构Dashboard数据"""
    return _build_dashboard(org_id, db)


@router.get("/{org_id}/licenses/statistics")
def get_license_statistics(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取许可证统计"""
    from models.license import License
    total = db.query(func.count(License.id)).filter(License.org_id == org_id).scalar() or 0
    active = db.query(func.count(License.id)).filter(
        License.org_id == org_id, License.status == "active"
    ).scalar() or 0
    expired = db.query(func.count(License.id)).filter(
        License.org_id == org_id, License.status == "expired"
    ).scalar() or 0
    return {
        "total_licenses": total,
        "active_licenses": active,
        "expired_licenses": expired,
        "expiring_soon": 0,
        "license_types": [],
        "usage_trend": [],
    }
