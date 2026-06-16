"""排课与线索管理路由（多租户版）"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.schedule import Schedule, Lead, Settlement, ScheduleStatus
from services.schedule_service import ScheduleService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["排课与线索管理"])


# Pydantic Schemas
class ScheduleCreate(BaseModel):
    course_id: int
    teacher_id: int
    classroom_id: int
    start_time: datetime
    end_time: datetime
    recurrence_rule: Optional[str] = None


class LeadCreate(BaseModel):
    name: str
    phone: str
    parent_name: Optional[str] = None
    source: Optional[str] = None


@router.get("/schedules/")
def read_schedules(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的排课列表（org_id 来自 Token）"""
    _, org_id = ctx
    return db.query(Schedule).filter(Schedule.org_id == org_id).all()


@router.post("/schedules/")
def create_schedule(
    schedule: ScheduleCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建排课（org_id 来自 Token，拒绝请求体传入）"""
    _, org_id = ctx
    service = ScheduleService(db)

    # Check for conflicts
    if service.check_conflicts(
        schedule.teacher_id, schedule.classroom_id, schedule.start_time, schedule.end_time
    ):
        raise HTTPException(
            status_code=400, detail="Schedule conflict detected for teacher or classroom"
        )

    db_schedule = Schedule(
        org_id=org_id,
        course_id=schedule.course_id,
        teacher_id=schedule.teacher_id,
        classroom_id=schedule.classroom_id,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        recurrence_rule=schedule.recurrence_rule,
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.get("/schedules/leads/")
def read_leads(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的线索列表（org_id 来自 Token）"""
    _, org_id = ctx
    return db.query(Lead).filter(Lead.org_id == org_id).all()


@router.post("/schedules/leads/")
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建线索（org_id 来自 Token，拒绝请求体传入）"""
    _, org_id = ctx
    db_lead = Lead(
        org_id=org_id,
        name=lead.name,
        phone=lead.phone,
        parent_name=lead.parent_name,
        source=lead.source,
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead
