"""
K12 STEM 社团管理 API 路由（多租户版）

【关键安全约束】
- 所有接口 org_id 一律从 Token 提取
- 所有 SQL 查询必须 filter(Model.org_id == org_id)
- 禁止从 query/path/body 读取 org_id
"""

from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models.club import (
    Club, ClubCreate, ClubUpdate, ClubResponse,
    ClubMember, ClubMemberCreate, ClubMemberUpdate, ClubMemberResponse,
    ClubMemberRole, ClubMemberStatus,
    ClubActivity, ClubActivityCreate, ClubActivityUpdate, ClubActivityResponse,
    ClubAttendance, ClubAttendanceCreate, ClubAttendanceResponse,
    AttendanceStatus,
    ClubRecruitment, ClubRecruitmentCreate, ClubRecruitmentUpdate, ClubRecruitmentResponse,
    ClubApplication, ClubApplicationCreate, ClubApplicationReview, ClubApplicationResponse,
    ApplicationStatus,
    ClubCategory, ClubStatus, ActivityType,
    ClubStatsResponse, ClubDetailStats,
)
from models.student import Student
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/stem/clubs", tags=["STEM 社团管理"])


# ==================== 社团 CRUD ====================

@router.post("/", response_model=ClubResponse)
def create_club(
    payload: ClubCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新社团"""
    _, org_id = ctx
    club = Club(
        org_id=org_id,
        name=payload.name,
        logo=payload.logo,
        description=payload.description,
        category=payload.category,
        grade_range_min=payload.grade_range_min,
        grade_range_max=payload.grade_range_max,
        max_members=payload.max_members,
        require_interview=payload.require_interview,
        leader_teacher_id=payload.leader_teacher_id,
        leader_teacher_name=payload.leader_teacher_name,
        semester=payload.semester,
        school_year=payload.school_year,
        status=ClubStatus.RECRUITING,
    )
    db.add(club)
    db.commit()
    db.refresh(club)
    return club


@router.get("/", response_model=List[ClubResponse])
def list_clubs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[ClubCategory] = None,
    status: Optional[ClubStatus] = None,
    search: Optional[str] = None,
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团列表（支持筛选和搜索）"""
    _, org_id = ctx
    query = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    )
    if category:
        query = query.filter(Club.category == category)
    if status:
        query = query.filter(Club.status == status)
    if semester:
        query = query.filter(Club.semester == semester)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Club.name.ilike(like))
            | (Club.description.ilike(like))
            | (Club.leader_teacher_name.ilike(like))
        )
    return query.order_by(Club.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{club_id}", response_model=ClubResponse)
def get_club(
    club_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团详情"""
    _, org_id = ctx
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).first()
    if not club:
        raise HTTPException(status_code=404, detail="社团不存在")
    return club


@router.put("/{club_id}", response_model=ClubResponse)
def update_club(
    club_id: int,
    payload: ClubUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新社团信息"""
    _, org_id = ctx
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.org_id == org_id,
    ).first()
    if not club:
        raise HTTPException(status_code=404, detail="社团不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(club, field, value)

    db.commit()
    db.refresh(club)
    return club


@router.delete("/{club_id}")
def delete_club(
    club_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """解散/删除社团（软删除）"""
    _, org_id = ctx
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.org_id == org_id,
    ).first()
    if not club:
        raise HTTPException(status_code=404, detail="社团不存在")

    club.is_active = False
    club.status = ClubStatus.DISSOLVED
    db.commit()
    return {"message": "社团已解散", "club_id": club_id}


# ==================== 社团成员管理 ====================

@router.get("/{club_id}/members", response_model=List[ClubMemberResponse])
def list_club_members(
    club_id: int,
    role: Optional[ClubMemberRole] = None,
    status: Optional[ClubMemberStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团成员列表"""
    _, org_id = ctx
    query = db.query(ClubMember).filter(
        ClubMember.club_id == club_id,
        ClubMember.org_id == org_id,
    )
    if role:
        query = query.filter(ClubMember.role == role)
    if status:
        query = query.filter(ClubMember.status == status)
    return query.offset(skip).limit(limit).all()


@router.post("/{club_id}/members", response_model=ClubMemberResponse)
def add_club_member(
    club_id: int,
    payload: ClubMemberCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加社团成员"""
    _, org_id = ctx

    # 验证社团存在
    club = db.query(Club).filter(Club.id == club_id, Club.org_id == org_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="社团不存在")

    # 检查人数上限
    if club.current_members >= club.max_members:
        raise HTTPException(status_code=400, detail="社团人数已达上限")

    # 检查是否已在该社团
    existing = db.query(ClubMember).filter(
        ClubMember.club_id == club_id,
        ClubMember.student_id == payload.student_id,
        ClubMember.status != ClubMemberStatus.QUIT,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该学生已是社团成员")

    # 获取学生信息
    student = db.query(Student).filter(
        Student.id == payload.student_id,
        Student.org_id == org_id,
    ).first()

    member = ClubMember(
        club_id=club_id,
        org_id=org_id,
        student_id=payload.student_id,
        student_name=student.name if student else payload.student_id,
        grade=payload.grade or (student.grade_level if student else None),
        class_name=payload.class_name or (student.class_name if student else None),
        role=payload.role,
    )
    db.add(member)

    # 更新社团成员计数
    club.current_members = db.query(ClubMember).filter(
        ClubMember.club_id == club_id,
        ClubMember.status == ClubMemberStatus.ACTIVE,
    ).count() + 1

    db.commit()
    db.refresh(member)
    return member


@router.put("/{club_id}/members/{member_id}", response_model=ClubMemberResponse)
def update_club_member(
    club_id: int,
    member_id: int,
    payload: ClubMemberUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新社团成员信息（角色、评价）"""
    _, org_id = ctx
    member = db.query(ClubMember).filter(
        ClubMember.id == member_id,
        ClubMember.club_id == club_id,
        ClubMember.org_id == org_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员记录不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{club_id}/members/{member_id}")
def remove_club_member(
    club_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """移除社团成员"""
    _, org_id = ctx
    member = db.query(ClubMember).filter(
        ClubMember.id == member_id,
        ClubMember.club_id == club_id,
        ClubMember.org_id == org_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员记录不存在")

    member.status = ClubMemberStatus.QUIT
    member.quit_at = datetime.utcnow()

    # 更新社团成员计数
    club = db.query(Club).filter(Club.id == club_id).first()
    if club and club.current_members > 0:
        club.current_members -= 1

    db.commit()
    return {"message": "成员已移除"}


# ==================== 社团活动管理 ====================

@router.get("/{club_id}/activities", response_model=List[ClubActivityResponse])
def list_club_activities(
    club_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    activity_type: Optional[ActivityType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团活动列表"""
    _, org_id = ctx
    query = db.query(ClubActivity).filter(
        ClubActivity.club_id == club_id,
        ClubActivity.org_id == org_id,
    )
    if year and month:
        query = query.filter(
            func.extract('year', ClubActivity.activity_date) == year,
            func.extract('month', ClubActivity.activity_date) == month,
        )
    elif year:
        query = query.filter(func.extract('year', ClubActivity.activity_date) == year)
    if activity_type:
        query = query.filter(ClubActivity.activity_type == activity_type)
    return query.order_by(ClubActivity.activity_date.desc()).offset(skip).limit(limit).all()


@router.post("/{club_id}/activities", response_model=ClubActivityResponse)
def create_club_activity(
    club_id: int,
    payload: ClubActivityCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建社团活动"""
    _, org_id = ctx
    activity = ClubActivity(
        club_id=club_id,
        org_id=org_id,
        title=payload.title,
        description=payload.description,
        activity_type=payload.activity_type,
        activity_date=payload.activity_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        teacher_id=payload.teacher_id,
        teacher_name=payload.teacher_name,
        expected_count=payload.expected_count,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/{club_id}/activities/{activity_id}", response_model=ClubActivityResponse)
def update_club_activity(
    club_id: int,
    activity_id: int,
    payload: ClubActivityUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新社团活动"""
    _, org_id = ctx
    activity = db.query(ClubActivity).filter(
        ClubActivity.id == activity_id,
        ClubActivity.club_id == club_id,
        ClubActivity.org_id == org_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{club_id}/activities/{activity_id}")
def cancel_club_activity(
    club_id: int,
    activity_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """取消社团活动"""
    _, org_id = ctx
    activity = db.query(ClubActivity).filter(
        ClubActivity.id == activity_id,
        ClubActivity.club_id == club_id,
        ClubActivity.org_id == org_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    activity.is_cancelled = True
    db.commit()
    return {"message": "活动已取消"}


# ==================== 考勤管理 ====================

@router.get("/{club_id}/activities/{activity_id}/attendance", response_model=List[ClubAttendanceResponse])
def list_attendance(
    club_id: int,
    activity_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取活动考勤记录"""
    _, org_id = ctx
    return db.query(ClubAttendance).filter(
        ClubAttendance.activity_id == activity_id,
        ClubAttendance.club_id == club_id,
        ClubAttendance.org_id == org_id,
    ).all()


@router.post("/{club_id}/activities/{activity_id}/attendance")
def batch_create_attendance(
    club_id: int,
    activity_id: int,
    records: List[ClubAttendanceCreate],
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """批量创建考勤记录"""
    _, org_id = ctx

    activity = db.query(ClubActivity).filter(
        ClubActivity.id == activity_id,
        ClubActivity.club_id == club_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    created = []
    for rec in records:
        attendance = ClubAttendance(
            activity_id=activity_id,
            club_id=club_id,
            org_id=org_id,
            student_id=rec.student_id,
            status=rec.status,
            check_in_time=rec.check_in_time,
            check_out_time=rec.check_out_time,
            notes=rec.notes,
        )
        db.add(attendance)
        created.append(attendance)

    # 更新实际参与人数
    activity.actual_count = len(records)

    db.commit()
    for c in created:
        db.refresh(c)
    return {"message": f"已记录 {len(created)} 条考勤", "count": len(created)}


# ==================== 招募管理 ====================

@router.post("/{club_id}/recruitments", response_model=ClubRecruitmentResponse)
def create_recruitment(
    club_id: int,
    payload: ClubRecruitmentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建招募公告"""
    user, org_id = ctx
    recruitment = ClubRecruitment(
        club_id=club_id,
        org_id=org_id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        start_date=payload.start_date,
        end_date=payload.end_date,
        interview_date=payload.interview_date,
        created_by=user.id,
    )
    db.add(recruitment)

    # 标记社团为招募中
    club = db.query(Club).filter(Club.id == club_id).first()
    if club:
        club.is_recruiting = True
        if club.status == ClubStatus.ACTIVE:
            club.status = ClubStatus.RECRUITING

    db.commit()
    db.refresh(recruitment)
    return recruitment


@router.get("/{club_id}/recruitments", response_model=List[ClubRecruitmentResponse])
def list_recruitments(
    club_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团招募公告列表"""
    _, org_id = ctx
    return db.query(ClubRecruitment).filter(
        ClubRecruitment.club_id == club_id,
        ClubRecruitment.org_id == org_id,
    ).order_by(ClubRecruitment.created_at.desc()).all()


@router.put("/{club_id}/recruitments/{recruitment_id}", response_model=ClubRecruitmentResponse)
def update_recruitment(
    club_id: int,
    recruitment_id: int,
    payload: ClubRecruitmentUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新招募公告"""
    _, org_id = ctx
    rec = db.query(ClubRecruitment).filter(
        ClubRecruitment.id == recruitment_id,
        ClubRecruitment.club_id == club_id,
        ClubRecruitment.org_id == org_id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="招募公告不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rec, field, value)

    db.commit()
    db.refresh(rec)
    return rec


# ==================== 申请管理 ====================

@router.get("/{club_id}/recruitments/{recruitment_id}/applications", response_model=List[ClubApplicationResponse])
def list_applications(
    club_id: int,
    recruitment_id: int,
    status: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取申请列表"""
    _, org_id = ctx
    query = db.query(ClubApplication).filter(
        ClubApplication.recruitment_id == recruitment_id,
        ClubApplication.club_id == club_id,
        ClubApplication.org_id == org_id,
    )
    if status:
        query = query.filter(ClubApplication.status == status)
    return query.order_by(ClubApplication.created_at.desc()).all()


@router.post("/{club_id}/recruitments/{recruitment_id}/applications", response_model=ClubApplicationResponse)
def create_application(
    club_id: int,
    recruitment_id: int,
    payload: ClubApplicationCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学生提交社团申请"""
    _, org_id = ctx

    # 验证招募公告
    rec = db.query(ClubRecruitment).filter(
        ClubRecruitment.id == recruitment_id,
        ClubRecruitment.club_id == club_id,
        ClubRecruitment.org_id == org_id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="招募公告不存在")
    if rec.is_closed:
        raise HTTPException(status_code=400, detail="招募已结束")

    # 获取学生信息
    student = db.query(Student).filter(
        Student.id == payload.student_id,
        Student.org_id == org_id,
    ).first()

    application = ClubApplication(
        recruitment_id=recruitment_id,
        club_id=club_id,
        org_id=org_id,
        student_id=payload.student_id,
        student_name=student.name if student else "",
        grade=student.grade_level if student else None,
        class_name=student.class_name if student else None,
        reason=payload.reason,
        experience=payload.experience,
        guardian_phone=payload.guardian_phone,
    )
    db.add(application)

    # 更新申请计数
    rec.applicant_count = db.query(ClubApplication).filter(
        ClubApplication.recruitment_id == recruitment_id,
    ).count() + 1

    db.commit()
    db.refresh(application)
    return application


@router.put("/{club_id}/recruitments/{recruitment_id}/applications/{application_id}/review", response_model=ClubApplicationResponse)
def review_application(
    club_id: int,
    recruitment_id: int,
    application_id: int,
    payload: ClubApplicationReview,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审核社团申请"""
    user, org_id = ctx
    application = db.query(ClubApplication).filter(
        ClubApplication.id == application_id,
        ClubApplication.recruitment_id == recruitment_id,
        ClubApplication.club_id == club_id,
        ClubApplication.org_id == org_id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="申请记录不存在")

    application.status = payload.status
    application.review_comment = payload.review_comment
    application.reviewed_by = user.id
    application.reviewed_at = datetime.utcnow()

    # 如果通过，自动添加为社团成员
    if payload.status == ApplicationStatus.APPROVED:
        club = db.query(Club).filter(Club.id == club_id).first()
        if club and club.current_members < club.max_members:
            existing_member = db.query(ClubMember).filter(
                ClubMember.club_id == club_id,
                ClubMember.student_id == application.student_id,
            ).first()
            if not existing_member:
                member = ClubMember(
                    club_id=club_id,
                    org_id=org_id,
                    student_id=application.student_id,
                    student_name=application.student_name,
                    grade=application.grade,
                    class_name=application.class_name,
                )
                db.add(member)
                club.current_members += 1

        # 更新招募录取计数
        rec = db.query(ClubRecruitment).filter(ClubRecruitment.id == recruitment_id).first()
        if rec:
            rec.accepted_count = db.query(ClubApplication).filter(
                ClubApplication.recruitment_id == recruitment_id,
                ClubApplication.status == ApplicationStatus.APPROVED,
            ).count() + 1

    db.commit()
    db.refresh(application)
    return application


# ==================== 统计看板 ====================

@router.get("/stats/overview", response_model=ClubStatsResponse)
def get_club_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取社团统计概览"""
    _, org_id = ctx

    total_clubs = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).count()

    active_clubs = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
        Club.status == ClubStatus.ACTIVE,
    ).count()

    recruiting_clubs = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
        Club.is_recruiting.is_(True),
    ).count()

    total_members = db.query(ClubMember).filter(
        ClubMember.org_id == org_id,
        ClubMember.status == ClubMemberStatus.ACTIVE,
    ).count()

    # 本月活动数
    first_of_month = date.today().replace(day=1)
    monthly_activities = db.query(ClubActivity).filter(
        ClubActivity.org_id == org_id,
        ClubActivity.activity_date >= first_of_month,
        ClubActivity.is_cancelled.is_(False),
    ).count()

    # 平均出勤率（粗略估计）
    total_attendance = db.query(ClubAttendance).filter(
        ClubAttendance.org_id == org_id,
    ).count()
    total_present = db.query(ClubAttendance).filter(
        ClubAttendance.org_id == org_id,
        ClubAttendance.status == AttendanceStatus.PRESENT,
    ).count()
    avg_rate = (total_present / total_attendance * 100) if total_attendance > 0 else 0.0

    return ClubStatsResponse(
        total_clubs=total_clubs,
        active_clubs=active_clubs,
        recruiting_clubs=recruiting_clubs,
        total_members=total_members,
        total_activities_this_month=monthly_activities,
        avg_attendance_rate=round(avg_rate, 1),
    )


@router.get("/stats/detail", response_model=List[ClubDetailStats])
def get_club_detail_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取各社团详细统计"""
    _, org_id = ctx

    clubs = db.query(Club).filter(
        Club.org_id == org_id,
        Club.is_active.is_(True),
    ).all()

    first_of_month = date.today().replace(day=1)
    result = []
    for club in clubs:
        activity_count = db.query(ClubActivity).filter(
            ClubActivity.club_id == club.id,
            ClubActivity.activity_date >= first_of_month,
            ClubActivity.is_cancelled.is_(False),
        ).count()

        member_count = db.query(ClubMember).filter(
            ClubMember.club_id == club.id,
            ClubMember.status == ClubMemberStatus.ACTIVE,
        ).count()

        result.append(ClubDetailStats(
            club_id=club.id,
            club_name=club.name,
            category=club.category,
            member_count=member_count,
            activity_count_this_month=activity_count,
            attendance_rate=0.0,
            active_member_count=member_count,
        ))

    return result