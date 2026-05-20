from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from utils.database import get_db
from models.schedule import Schedule, Lead, Settlement, ScheduleStatus
from services.schedule_service import ScheduleService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic Schemas
class ScheduleCreate(BaseModel):
    org_id: int
    course_id: int
    teacher_id: int
    classroom_id: int
    start_time: datetime
    end_time: datetime
    recurrence_rule: str = None

class LeadCreate(BaseModel):
    org_id: int
    name: str
    phone: str
    parent_name: str = None
    source: str = None

@router.get("/schedules/")
def read_schedules(org_id: int, db: Session = Depends(get_db)):
    return db.query(Schedule).filter(Schedule.org_id == org_id).all()

@router.post("/schedules/")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    service = ScheduleService(db)
    
    # Check for conflicts
    if service.check_conflicts(schedule.teacher_id, schedule.classroom_id, schedule.start_time, schedule.end_time):
        raise HTTPException(status_code=400, detail="Schedule conflict detected for teacher or classroom")
    
    db_schedule = Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/leads/")
def read_leads(org_id: int, db: Session = Depends(get_db)):
    return db.query(Lead).filter(Lead.org_id == org_id).all()

@router.post("/leads/")
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = Lead(**lead.dict())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead
