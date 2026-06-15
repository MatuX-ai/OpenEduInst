"""
招生线索管理路由（多租户版）
org_id 一律从 Token 提取，禁止通过 query 传入跨组织查询。
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.schedule import Lead, LeadFollowUp, LeadStatus, LeadSource
from models.license import Organization

router = APIRouter(
    prefix="/api/v1/leads",
    tags=["leads"],
)


@router.get("/")
def get_leads(
    status: Optional[str] = Query(None, description="线索状态筛选"),
    source: Optional[str] = Query(None, description="线索来源筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的线索列表"""
    _, org_id = ctx

    query = db.query(Lead).filter(Lead.org_id == org_id)

    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)

    total = query.count()
    leads = query.order_by(Lead.create_time.desc()).offset(skip).limit(limit).all()

    return {
        "leads": [lead.to_dict() for lead in leads],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats")
def get_lead_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的线索统计数据"""
    _, org_id = ctx

    first_day_of_month = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    monthly_leads = (
        db.query(Lead).filter(Lead.org_id == org_id, Lead.create_time >= first_day_of_month).count()
    )

    status_stats = (
        db.query(Lead.status, func.count(Lead.id).label("count"))
        .filter(Lead.org_id == org_id)
        .group_by(Lead.status)
        .all()
    )

    source_stats = (
        db.query(Lead.source, func.count(Lead.id).label("count"))
        .filter(Lead.org_id == org_id)
        .group_by(Lead.source)
        .all()
    )

    total_leads = db.query(Lead).filter(Lead.org_id == org_id).count()
    enrolled_leads = (
        db.query(Lead).filter(Lead.org_id == org_id, Lead.status == LeadStatus.ENROLLED).count()
    )
    conversion_rate = (enrolled_leads / total_leads * 100) if total_leads > 0 else 0

    pending_leads = (
        db.query(Lead).filter(Lead.org_id == org_id, Lead.status == LeadStatus.PENDING).count()
    )

    return {
        "monthly_leads": monthly_leads,
        "status_stats": {status.value: count for status, count in status_stats},
        "source_stats": {source.value: count for source, count in source_stats},
        "conversion_rate": round(conversion_rate, 2),
        "pending_leads": pending_leads,
        "total_leads": total_leads,
    }


@router.post("/")
def create_lead(
    parent_name: str = Query(..., description="家长姓名"),
    phone: str = Query(..., description="联系电话"),
    student_grade: Optional[str] = Query(None, description="学生年级"),
    source: str = Query("其他", description="线索来源"),
    interest_course: str = Query(..., description="意向课程"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新线索（org_id 来自 Token）"""
    _, org_id = ctx

    try:
        lead_source_enum = LeadSource(source)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid source: {source}")

    lead = Lead(
        org_id=org_id,
        parent_name=parent_name,
        phone=phone,
        student_grade=student_grade,
        source=lead_source_enum.value,
        interest_course=interest_course,
        status=LeadStatus.PENDING,
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return lead.to_dict()


@router.put("/{lead_id}/status")
def update_lead_status(
    lead_id: int,
    status: str = Query(..., description="新状态"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新线索状态（校验所属组织）"""
    _, org_id = ctx
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        new_status = LeadStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    lead.status = new_status
    lead.last_contact_time = datetime.utcnow()

    db.commit()
    db.refresh(lead)

    return lead.to_dict()


@router.get("/{lead_id}/follow-ups")
def get_follow_ups(
    lead_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取线索的跟进记录（校验所属组织）"""
    _, org_id = ctx
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    follow_ups = (
        db.query(LeadFollowUp).filter(LeadFollowUp.lead_id == lead_id).order_by(
            LeadFollowUp.follow_up_time.desc()
        ).all()
    )

    return {
        "follow_ups": [fu.to_dict() for fu in follow_ups],
        "total": len(follow_ups),
    }


@router.post("/{lead_id}/follow-ups")
def create_follow_up(
    lead_id: int,
    contact_method: str = Query(..., description="联系方式"),
    content: str = Query(..., description="跟进内容"),
    result: Optional[str] = Query(None, description="跟进结果"),
    next_follow_up_time: Optional[datetime] = Query(None, description="下次跟进时间"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加跟进记录（校验所属组织）"""
    _, org_id = ctx
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    follow_up = LeadFollowUp(
        lead_id=lead_id,
        org_id=org_id,
        contact_method=contact_method,
        content=content,
        result=result,
        next_follow_up_time=next_follow_up_time,
    )

    db.add(follow_up)
    lead.last_contact_time = datetime.utcnow()

    db.commit()
    db.refresh(follow_up)

    return follow_up.to_dict()
