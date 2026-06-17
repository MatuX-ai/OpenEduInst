"""排课与线索管理路由（多租户版）"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.schedule import Schedule, Lead, Settlement, ScheduleStatus
from models.base_models import Teacher, Course
from models.classroom import Classroom
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


class ScheduleUpdate(BaseModel):
    course_id: Optional[int] = None
    teacher_id: Optional[int] = None
    classroom_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    status: Optional[str] = None
    max_students: Optional[int] = None


class LeadCreate(BaseModel):
    name: str
    phone: str
    parent_name: Optional[str] = None
    source: Optional[str] = None


DAY_LABELS = {1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日'}


def _enrich_schedule(db: Session, s: Schedule) -> dict:
    """将 Schedule ORM 对象转换为前端所需的富化字典"""
    course = db.query(Course).filter(Course.id == s.course_id).first() if s.course_id else None
    teacher = db.query(Teacher).filter(Teacher.id == s.teacher_id).first() if s.teacher_id else None
    classroom = db.query(Classroom).filter(Classroom.id == s.classroom_id).first() if s.classroom_id else None

    start_dt = s.start_time
    end_dt = s.end_time
    day_of_week = start_dt.isoweekday()  # 1=Mon..7=Sun
    start_time_str = start_dt.strftime('%H:%M')
    end_time_str = end_dt.strftime('%H:%M')

    # 解析 recurrence_rule -> repeatType / repeatWeeks
    repeat_type = 'none'
    repeat_weeks = None
    if s.recurrence_rule:
        parts = s.recurrence_rule.split(';')
        if len(parts) >= 1:
            repeat_type = parts[0]
        if len(parts) >= 2:
            try:
                repeat_weeks = int(parts[1])
            except (ValueError, TypeError):
                pass

    status = 'scheduled'
    if s.status == ScheduleStatus.CANCELLED:
        status = 'cancelled'
    elif s.status == ScheduleStatus.COMPLETED:
        status = 'scheduled'

    return {
        'id': s.id,
        'courseId': s.course_id or 0,
        'courseName': course.title if course else '',
        'courseCode': '',
        'courseType': course.category if course else '',
        'teacherId': s.teacher_id or 0,
        'teacherName': teacher.name if teacher else '',
        'classroomId': s.classroom_id,
        'classroomName': classroom.room_number if classroom else '',
        'studentIds': [],
        'dayOfWeek': day_of_week,
        'startTime': start_time_str,
        'endTime': end_time_str,
        'startDate': start_dt.strftime('%Y-%m-%d'),
        'repeatType': repeat_type,
        'repeatWeeks': repeat_weeks,
        'status': status,
        'createdAt': s.created_at.isoformat() if s.created_at else '',
        'updatedAt': s.updated_at.isoformat() if s.updated_at else '',
    }


@router.get("/schedules/classrooms")
def read_classrooms(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的教室列表"""
    _, org_id = ctx
    classrooms = db.query(Classroom).filter(Classroom.org_id == org_id).all()
    return [
        {
            'id': c.id,
            'name': c.room_number,
            'capacity': c.capacity,
            'location': c.building or '',
            'type': c.room_type or '',
            'isAvailable': c.is_available if c.is_available is not None else True,
            'notes': c.notes or '',
            'createdAt': c.created_at.isoformat() if c.created_at else '',
            'updatedAt': c.updated_at.isoformat() if c.updated_at else '',
        }
        for c in classrooms
    ]


@router.get("/schedules/")
def read_schedules(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的排课列表（富化数据，org_id 来自 Token）"""
    _, org_id = ctx
    schedules = db.query(Schedule).filter(Schedule.org_id == org_id).all()
    return {
        'data': [_enrich_schedule(db, s) for s in schedules],
        'total': len(schedules),
        'page': 1,
        'pageSize': 200,
    }


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
    return _enrich_schedule(db, db_schedule)


@router.get("/schedules/leads/")
def read_leads(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的线索列表（org_id 来自 Token）"""
    _, org_id = ctx
    return db.query(Lead).filter(Lead.org_id == org_id).all()


@router.get("/schedules/{schedule_id}")
def read_schedule_detail(
    schedule_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取排课详情（富化数据）"""
    _, org_id = ctx
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id, Schedule.org_id == org_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return _enrich_schedule(db, schedule)


@router.put("/schedules/{schedule_id}")
def update_schedule(
    schedule_id: int,
    updates: ScheduleUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新排课记录"""
    _, org_id = ctx
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id, Schedule.org_id == org_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = updates.model_dump(exclude_unset=True)

    # 检查时间冲突
    if 'start_time' in update_data or 'end_time' in update_data:
        new_start = update_data.get('start_time', schedule.start_time)
        new_end = update_data.get('end_time', schedule.end_time)
        new_tid = update_data.get('teacher_id', schedule.teacher_id)
        new_cid = update_data.get('classroom_id', schedule.classroom_id)
        service = ScheduleService(db)
        if service.check_conflicts(new_tid, new_cid, new_start, new_end, exclude_schedule_id=schedule_id):
            raise HTTPException(status_code=400, detail="Schedule conflict detected")

    for key, value in update_data.items():
        if key == 'status' and isinstance(value, str):
            try:
                value = ScheduleStatus(value)
            except ValueError:
                continue
        if hasattr(schedule, key):
            setattr(schedule, key, value)

    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return _enrich_schedule(db, schedule)


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """软删除排课记录（状态设为 cancelled）"""
    _, org_id = ctx
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id, Schedule.org_id == org_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.status = ScheduleStatus.CANCELLED
    schedule.updated_at = datetime.utcnow()
    db.commit()
    return {'success': True, 'message': 'Schedule cancelled'}


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
