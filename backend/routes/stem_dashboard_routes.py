"""
K12 STEM 综合数据看板 API 路由（多租户版）

提供学校 STEM 教育管理的全局统计与趋势数据
"""

from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.club import (
    Club, ClubMember, ClubActivity, ClubAttendance,
    ClubCategory, ClubStatus, ClubMemberStatus, AttendanceStatus,
)
from models.consumable import (
    Consumable, ConsumableUsage, ConsumablePurchaseRequest,
    PurchaseRequestStatus,
)
from models.stem_project import STEMProject, ProjectStatus
from models.hardware_device import HardwareDevice, DeviceStatus
from models.competition import Competition, CompetitionRegistration
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/stem/dashboard", tags=["STEM 数据看板"])


class DashboardOverview(BaseModel):
    """看板总览数据"""
    club_count: int
    project_count: int
    device_count: int
    member_count: int
    active_activity_count: int
    competition_count: int
    low_stock_count: int

    class Config:
        from_attributes = True


class TrendItem(BaseModel):
    """趋势数据项"""
    date: str
    count: int


class CategoryDistribution(BaseModel):
    """分类分布"""
    category: str
    count: int
    percentage: float


# Pydantic
from pydantic import BaseModel


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取 STEM 看板总览"""
    _, org_id = ctx

    club_count = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).count()

    project_count = db.query(STEMProject).filter(
        STEMProject.org_id == org_id,
        STEMProject.is_active.is_(True),
    ).count()

    device_count = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
    ).count()

    member_count = db.query(ClubMember).filter(
        ClubMember.org_id == org_id,
        ClubMember.status == ClubMemberStatus.ACTIVE,
    ).count()

    today = date.today()
    active_activity_count = db.query(ClubActivity).filter(
        ClubActivity.org_id == org_id,
        ClubActivity.activity_date >= today,
        ClubActivity.is_cancelled.is_(False),
    ).count()

    competition_count = db.query(Competition).filter(
        Competition.org_id == org_id,
    ).count()

    low_stock_count = db.query(Consumable).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
        Consumable.is_low_stock.is_(True),
    ).count()

    return DashboardOverview(
        club_count=club_count,
        project_count=project_count,
        device_count=device_count,
        member_count=member_count,
        active_activity_count=active_activity_count,
        competition_count=competition_count,
        low_stock_count=low_stock_count,
    )


@router.get("/club-category-distribution")
def get_club_category_distribution(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团分类分布"""
    _, org_id = ctx

    results = db.query(
        Club.category,
        func.count(Club.id).label('count'),
    ).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).group_by(Club.category).all()

    total = sum(r.count for r in results) or 1
    return [
        CategoryDistribution(
            category=r.category.value if hasattr(r.category, 'value') else str(r.category),
            count=r.count,
            percentage=round(r.count / total * 100, 1),
        ) for r in results
    ]


@router.get("/monthly-trends")
def get_monthly_trends(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取月度趋势数据（社团活动数）"""
    _, org_id = ctx

    today = date.today()
    trends = []
    for i in range(months - 1, -1, -1):
        first = today.replace(day=1) - timedelta(days=30 * i)
        # Month start/end
        month_start = first.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)

        count = db.query(ClubActivity).filter(
            ClubActivity.org_id == org_id,
            ClubActivity.activity_date >= month_start,
            ClubActivity.activity_date < month_end,
            ClubActivity.is_cancelled.is_(False),
        ).count()

        trends.append(TrendItem(
            date=month_start.strftime("%Y-%m"),
            count=count,
        ))

    return trends


@router.get("/top-clubs")
def get_top_clubs(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取活跃度最高的社团排名"""
    _, org_id = ctx

    clubs = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).all()

    result = []
    for club in clubs:
        member_count = db.query(ClubMember).filter(
            ClubMember.club_id == club.id,
            ClubMember.status == ClubMemberStatus.ACTIVE,
        ).count()

        activity_count = db.query(ClubActivity).filter(
            ClubActivity.club_id == club.id,
            ClubActivity.is_cancelled.is_(False),
        ).count()

        result.append({
            "club_id": club.id,
            "club_name": club.name,
            "category": club.category.value if hasattr(club.category, 'value') else str(club.category),
            "member_count": member_count,
            "activity_count": activity_count,
            "status": club.status.value if hasattr(club.status, 'value') else str(club.status),
        })

    result.sort(key=lambda x: x["activity_count"], reverse=True)
    return result[:limit]


@router.get("/device-usage-stats")
def get_device_usage_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取设备使用统计"""
    _, org_id = ctx

    total = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
    ).count()

    available = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
        HardwareDevice.status == DeviceStatus.AVAILABLE,
    ).count()

    in_use = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
        HardwareDevice.status == DeviceStatus.IN_USE,
    ).count()

    maintenance = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
        HardwareDevice.status == DeviceStatus.MAINTENANCE,
    ).count()

    return {
        "total": total,
        "available": available,
        "in_use": in_use,
        "maintenance": maintenance,
        "usage_rate": round(in_use / total * 100, 1) if total > 0 else 0,
    }