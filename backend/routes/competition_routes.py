"""
竞赛与认证管理API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 query 传入。
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.competition import (
    Competition, CompetitionRegistration, Certification, ExamRegistration,
    CompetitionLevel, CompetitionCategory, CompetitionStatus
)

router = APIRouter(
    prefix="/api/v1/competitions",
    tags=["competitions"],
)


# ==================== 竞赛管理 ====================

@router.get("/")
def get_competitions(
    status: Optional[str] = Query(None, description="竞赛状态筛选"),
    category: Optional[str] = Query(None, description="竞赛类别筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的竞赛列表"""
    _, org_id = ctx

    query = db.query(Competition).filter(Competition.org_id == org_id)

    if status:
        query = query.filter(Competition.status == status)
    if category:
        query = query.filter(Competition.category == category)

    total = query.count()
    competitions = query.order_by(Competition.competition_date.asc()).offset(skip).limit(limit).all()

    return {
        "competitions": [comp.to_dict() for comp in competitions],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats")
def get_competition_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的竞赛统计数据"""
    _, org_id = ctx

    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_participants = (
        db.query(CompetitionRegistration)
        .filter(
            CompetitionRegistration.org_id == org_id,
            CompetitionRegistration.register_time >= first_day_of_month,
        )
        .count()
    )

    total_awards = (
        db.query(CompetitionRegistration)
        .filter(
            CompetitionRegistration.org_id == org_id,
            CompetitionRegistration.award_level.isnot(None),
        )
        .count()
    )

    gold_awards = (
        db.query(CompetitionRegistration)
        .filter(
            CompetitionRegistration.org_id == org_id,
            CompetitionRegistration.award_level.like("%一等奖%"),
        )
        .count()
    )

    thirty_days_later = datetime.now() + timedelta(days=30)
    upcoming_events = (
        db.query(Competition)
        .filter(
            Competition.org_id == org_id,
            Competition.competition_date >= datetime.now(),
            Competition.competition_date <= thirty_days_later,
        )
        .count()
    )

    return {
        "monthly_participants": monthly_participants,
        "total_awards": total_awards,
        "gold_awards": gold_awards,
        "upcoming_events": upcoming_events,
    }


@router.post("/")
def create_competition(
    name: str = Query(..., description="竞赛名称"),
    organizer: str = Query(..., description="主办单位"),
    level: str = Query(..., description="竞赛级别"),
    category: str = Query(..., description="竞赛类别"),
    register_deadline: str = Query(..., description="报名截止日期(ISO格式)"),
    competition_date: str = Query(..., description="比赛日期(ISO格式)"),
    achievements: Optional[str] = Query(None, description="往届获奖情况"),
    description: Optional[str] = Query(None, description="竞赛描述"),
    max_participants: Optional[int] = Query(None, description="最大人数限制"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新竞赛（org_id 来自 Token）"""
    _, org_id = ctx

    try:
        level_enum = CompetitionLevel(level)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid level: {level}")

    try:
        category_enum = CompetitionCategory(category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    new_competition = Competition(
        org_id=org_id,
        name=name,
        organizer=organizer,
        level=level_enum,
        category=category_enum,
        register_deadline=datetime.fromisoformat(register_deadline),
        competition_date=datetime.fromisoformat(competition_date),
        achievements=achievements,
        description=description,
        max_participants=max_participants,
        participants_count=0,
        status=CompetitionStatus.REGISTERING,
    )

    db.add(new_competition)
    db.commit()
    db.refresh(new_competition)

    return {"message": "Competition created successfully", "competition": new_competition.to_dict()}


@router.put("/{competition_id}/status")
def update_competition_status(
    competition_id: int,
    status: str = Query(..., description="新状态"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新竞赛状态（校验所属组织）"""
    _, org_id = ctx
    competition = (
        db.query(Competition)
        .filter(Competition.id == competition_id, Competition.org_id == org_id)
        .first()
    )

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    try:
        status_enum = CompetitionStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    competition.status = status_enum
    db.commit()

    return {"message": "Status updated", "competition": competition.to_dict()}


# ==================== 竞赛报名管理 ====================

@router.get("/{competition_id}/registrations")
def get_registrations(
    competition_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取竞赛报名列表（校验所属组织）"""
    _, org_id = ctx
    competition = (
        db.query(Competition)
        .filter(Competition.id == competition_id, Competition.org_id == org_id)
        .first()
    )

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    query = db.query(CompetitionRegistration).filter(
        CompetitionRegistration.competition_id == competition_id
    )

    total = query.count()
    registrations = query.order_by(CompetitionRegistration.register_time.desc()).offset(skip).limit(limit).all()

    return {
        "registrations": [reg.to_dict() for reg in registrations],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/{competition_id}/registrations")
def register_for_competition(
    competition_id: int,
    student_name: str = Query(..., description="学员姓名"),
    parent_name: Optional[str] = Query(None, description="家长姓名"),
    phone: str = Query(..., description="联系电话"),
    grade: Optional[str] = Query(None, description="年级"),
    project_name: Optional[str] = Query(None, description="参赛项目名称"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """报名竞赛（校验所属组织、org_id 来自 Token）"""
    _, org_id = ctx
    competition = (
        db.query(Competition)
        .filter(Competition.id == competition_id, Competition.org_id == org_id)
        .first()
    )

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    if competition.max_participants and competition.participants_count >= competition.max_participants:
        raise HTTPException(status_code=400, detail="Competition is full")

    new_registration = CompetitionRegistration(
        org_id=org_id,
        competition_id=competition_id,
        student_name=student_name,
        parent_name=parent_name,
        phone=phone,
        grade=grade,
        project_name=project_name,
        registration_status="已报名",
        payment_status="未缴费",
    )

    db.add(new_registration)
    competition.participants_count += 1

    db.commit()
    db.refresh(new_registration)

    return {"message": "Registration successful", "registration": new_registration.to_dict()}


# ==================== 等级认证管理 ====================

@router.get("/certifications")
def get_certifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的等级认证列表"""
    _, org_id = ctx

    query = db.query(Certification).filter(Certification.org_id == org_id)

    total = query.count()
    certifications = query.order_by(Certification.next_exam_date.asc()).offset(skip).limit(limit).all()

    return {
        "certifications": [cert.to_dict() for cert in certifications],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/certifications")
def create_certification(
    name: str = Query(..., description="认证名称"),
    organizer: str = Query(..., description="发证机构"),
    certification_type: str = Query(..., description="认证类型"),
    levels: Optional[str] = Query(None, description="认证级别(逗号分隔)"),
    next_exam_date: Optional[str] = Query(None, description="下次考试日期(ISO格式)"),
    exam_location: Optional[str] = Query(None, description="考试地点"),
    pass_rate: Optional[float] = Query(None, description="历史通过率"),
    exam_fee: Optional[float] = Query(None, description="考试费用"),
    description: Optional[str] = Query(None, description="认证描述"),
    requirements: Optional[str] = Query(None, description="考试要求"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建等级认证（org_id 来自 Token）"""
    _, org_id = ctx

    new_certification = Certification(
        org_id=org_id,
        name=name,
        organizer=organizer,
        certification_type=certification_type,
        levels=levels,
        next_exam_date=datetime.fromisoformat(next_exam_date) if next_exam_date else None,
        exam_location=exam_location,
        pass_rate=pass_rate,
        exam_fee=exam_fee,
        description=description,
        requirements=requirements,
        registered_students=0,
    )

    db.add(new_certification)
    db.commit()
    db.refresh(new_certification)

    return {"message": "Certification created successfully", "certification": new_certification.to_dict()}


@router.get("/certifications/{cert_id}/registrations")
def get_exam_registrations(
    cert_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试报名列表（校验所属组织）"""
    _, org_id = ctx
    certification = (
        db.query(Certification)
        .filter(Certification.id == cert_id, Certification.org_id == org_id)
        .first()
    )

    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")

    query = db.query(ExamRegistration).filter(ExamRegistration.certification_id == cert_id)

    total = query.count()
    registrations = query.order_by(ExamRegistration.register_time.desc()).offset(skip).limit(limit).all()

    return {
        "registrations": [reg.to_dict() for reg in registrations],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/certifications/{cert_id}/registrations")
def register_for_exam(
    cert_id: int,
    student_name: str = Query(..., description="学员姓名"),
    parent_name: Optional[str] = Query(None, description="家长姓名"),
    phone: str = Query(..., description="联系电话"),
    grade: Optional[str] = Query(None, description="年级"),
    exam_level: str = Query(..., description="报考级别"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """报名参加考试（校验所属组织、org_id 来自 Token）"""
    _, org_id = ctx
    certification = (
        db.query(Certification)
        .filter(Certification.id == cert_id, Certification.org_id == org_id)
        .first()
    )

    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")

    new_registration = ExamRegistration(
        org_id=org_id,
        certification_id=cert_id,
        student_name=student_name,
        parent_name=parent_name,
        phone=phone,
        grade=grade,
        exam_level=exam_level,
        exam_date=certification.next_exam_date,
        registration_status="已报名",
        payment_status="未缴费",
    )

    db.add(new_registration)
    certification.registered_students += 1

    db.commit()
    db.refresh(new_registration)

    return {"message": "Exam registration successful", "registration": new_registration.to_dict()}
