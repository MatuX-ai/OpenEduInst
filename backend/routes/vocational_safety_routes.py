"""
职业学校 - 安全监控与准入管理 + STEM 教务管理 API 路由
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.vocational_safety import (
    VocSafetyCertification, VocSafetyChecklist, VocIncidentReport,
    VocCourse, VocTrainingRoom, VocTrainingSchedule,
    VocSafetyCertStatus, VocIncidentType,
    VocSafetyCertCreate, VocChecklistCreate, VocIncidentCreate,
    VocCourseCreate, VocRoomCreate, VocScheduleCreate,
    VocSafetyStats, VocRoomUtilization,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/vocational", tags=["职业学校-安全与教务"])


# ==================== 安全准入 ====================


@router.post("/safety/certifications")
def create_safety_cert(
    payload: VocSafetyCertCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """通过安全认证"""
    _, org_id = ctx
    cert = VocSafetyCertification(
        org_id=org_id,
        user_id=payload.user_id,
        user_name=payload.user_name,
        safety_level=payload.safety_level,
        exam_score=payload.exam_score,
        expire_date=payload.expire_date or (date.today().replace(year=date.today().year + 1)),
        status=VocSafetyCertStatus.ACTIVE,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/safety/certifications")
def list_safety_certs(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取安全认证记录"""
    _, org_id = ctx
    query = db.query(VocSafetyCertification).filter(VocSafetyCertification.org_id == org_id)
    if user_id:
        query = query.filter(VocSafetyCertification.user_id == user_id)
    return query.order_by(VocSafetyCertification.created_at.desc()).all()


@router.post("/safety/checklists")
def create_checklist(
    payload: VocChecklistCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """提交安全检查"""
    _, org_id = ctx
    cl = VocSafetyChecklist(
        org_id=org_id,
        location_room=payload.location_room,
        checker_id=payload.checker_id,
        checker_name=payload.checker_name,
        items=payload.items,
        passed=payload.passed,
        abnormality=payload.abnormality,
    )
    db.add(cl)
    db.commit()
    db.refresh(cl)
    return cl


@router.get("/safety/checklists")
def list_checklists(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """安全检查记录列表"""
    _, org_id = ctx
    query = db.query(VocSafetyChecklist).filter(VocSafetyChecklist.org_id == org_id)
    if date_from:
        query = query.filter(VocSafetyChecklist.check_date >= date_from)
    if date_to:
        query = query.filter(VocSafetyChecklist.check_date <= date_to)
    return query.order_by(VocSafetyChecklist.check_date.desc()).all()


@router.post("/safety/incidents")
def report_incident(
    payload: VocIncidentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """报告事故"""
    _, org_id = ctx
    report = VocIncidentReport(
        org_id=org_id,
        incident_type=payload.incident_type,
        location_room=payload.location_room,
        description=payload.description,
        severity=payload.severity,
        reporter_id=payload.reporter_id,
        reporter_name=payload.reporter_name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/safety/incidents")
def list_incidents(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """事故报告列表"""
    _, org_id = ctx
    query = db.query(VocIncidentReport).filter(VocIncidentReport.org_id == org_id)
    if status:
        query = query.filter(VocIncidentReport.status == status)
    return query.order_by(VocIncidentReport.incident_date.desc()).all()


@router.get("/safety/stats", response_model=VocSafetyStats)
def get_safety_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """安全统计"""
    _, org_id = ctx
    total_certs = db.query(func.count(VocSafetyCertification.id)).filter(
        VocSafetyCertification.org_id == org_id,
    ).scalar() or 0
    active_certs = db.query(func.count(VocSafetyCertification.id)).filter(
        VocSafetyCertification.org_id == org_id,
        VocSafetyCertification.status == VocSafetyCertStatus.ACTIVE,
    ).scalar() or 0
    pending_inc = db.query(func.count(VocIncidentReport.id)).filter(
        VocIncidentReport.org_id == org_id,
        VocIncidentReport.status == "pending",
    ).scalar() or 0
    check_today = db.query(func.count(VocSafetyChecklist.id)).filter(
        VocSafetyChecklist.org_id == org_id,
        VocSafetyChecklist.check_date == date.today(),
    ).scalar() or 0
    return VocSafetyStats(
        total_certifications=total_certs,
        active_certifications=active_certs,
        pending_incidents=pending_inc,
        checklists_today=check_today,
    )


# ==================== STEM 教务 ====================


@router.post("/courses")
def create_course(
    payload: VocCourseCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建实训课程"""
    _, org_id = ctx
    course = VocCourse(org_id=org_id, **payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses")
def list_courses(
    major: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """实训课程列表"""
    _, org_id = ctx
    query = db.query(VocCourse).filter(VocCourse.org_id == org_id, VocCourse.is_active.is_(True))
    if major:
        query = query.filter(VocCourse.major == major)
    return query.order_by(VocCourse.created_at.desc()).all()


@router.get("/courses/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """实训课程详情"""
    _, org_id = ctx
    course = db.query(VocCourse).filter(VocCourse.id == course_id, VocCourse.org_id == org_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course


@router.post("/rooms")
def create_room(
    payload: VocRoomCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建实训室"""
    _, org_id = ctx
    room = VocTrainingRoom(org_id=org_id, **payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/rooms")
def list_rooms(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """实训室列表"""
    _, org_id = ctx
    return db.query(VocTrainingRoom).filter(
        VocTrainingRoom.org_id == org_id, VocTrainingRoom.is_active.is_(True)
    ).all()


@router.post("/schedules")
def create_schedule(
    payload: VocScheduleCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """排课"""
    _, org_id = ctx
    # 冲突检测
    conflict = db.query(VocTrainingSchedule).filter(
        VocTrainingSchedule.org_id == org_id,
        VocTrainingSchedule.room_id == payload.room_id,
        VocTrainingSchedule.weekday == payload.weekday,
        VocTrainingSchedule.status == "active",
        VocTrainingSchedule.start_time < payload.end_time,
        VocTrainingSchedule.end_time > payload.start_time,
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="该实训室此时段已有排课")
    schedule = VocTrainingSchedule(org_id=org_id, **payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/schedules")
def list_schedules(
    room_id: Optional[int] = None,
    weekday: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """课表列表"""
    _, org_id = ctx
    query = db.query(VocTrainingSchedule).filter(
        VocTrainingSchedule.org_id == org_id,
        VocTrainingSchedule.status == "active",
    )
    if room_id:
        query = query.filter(VocTrainingSchedule.room_id == room_id)
    if weekday:
        query = query.filter(VocTrainingSchedule.weekday == weekday)
    return query.order_by(VocTrainingSchedule.weekday, VocTrainingSchedule.start_time).all()


@router.get("/rooms/utilization")
def get_room_utilization(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """实训室利用率分析"""
    _, org_id = ctx
    rooms = db.query(VocTrainingRoom).filter(
        VocTrainingRoom.org_id == org_id, VocTrainingRoom.is_active.is_(True)
    ).all()
    result = []
    for room in rooms:
        total_schedules = db.query(func.count(VocTrainingSchedule.id)).filter(
            VocTrainingSchedule.room_id == room.id,
            VocTrainingSchedule.status == "active",
        ).scalar() or 0
        total_slots = 7 * 10  # 7天 * 10个时段
        rate = f"{round(total_schedules / total_slots * 100, 1)}%" if total_slots > 0 else "0%"
        result.append(VocRoomUtilization(
            room_id=room.id, room_name=room.name,
            total_slots=total_slots, used_slots=total_schedules,
            utilization_rate=rate,
        ))
    return result


@router.get("/teacher-workload")
def get_teacher_workload(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """教师工作量统计"""
    _, org_id = ctx
    workloads = db.query(
        VocTrainingSchedule.teacher_name,
        func.count(VocTrainingSchedule.id).label("schedule_count"),
    ).filter(
        VocTrainingSchedule.org_id == org_id,
        VocTrainingSchedule.status == "active",
    ).group_by(VocTrainingSchedule.teacher_name).all()
    return [{"teacher_name": w[0], "schedule_count": w[1], "total_hours": w[1] * 1.5} for w in workloads]