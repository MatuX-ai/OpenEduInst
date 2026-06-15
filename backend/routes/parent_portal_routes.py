"""
家长中心API路由（多租户版）
org_id 一律从 Token 提取，禁止通过 query 传入跨组织查询。
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.student import Student
from models.parent_portal import ClassFeedback, StudentAchievement, ParentMessage, FeedbackRating

router = APIRouter(
    prefix="/api/v1/parent-portal",
    tags=["parent-portal"],
)


@router.get("/student/{student_id}/profile")
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员档案信息（校验所属组织）"""
    _, org_id = ctx
    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total_remaining_hours = 0
    completed_projects = 0

    achievements_count = (
        db.query(StudentAchievement)
        .filter(StudentAchievement.student_id == student_id)
        .count()
    )

    return {
        "student": student.to_dict(),
        "stats": {
            "total_remaining_hours": total_remaining_hours,
            "completed_projects": completed_projects,
            "achievements_count": achievements_count,
        },
    }


@router.get("/student/{student_id}/feedbacks")
def get_student_feedbacks(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员课堂反馈列表（校验所属组织）"""
    _, org_id = ctx

    # 先校验学生归属
    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(ClassFeedback).filter(
        ClassFeedback.student_id == student_id,
        ClassFeedback.org_id == org_id,
    )

    total = query.count()
    feedbacks = query.order_by(ClassFeedback.class_date.desc()).offset(skip).limit(limit).all()

    return {
        "feedbacks": [fb.to_dict() for fb in feedbacks],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/feedbacks")
def create_feedback(
    student_id: int = Query(..., description="学员ID"),
    course_name: str = Query(..., description="课程名称"),
    teacher_name: str = Query(..., description="教师姓名"),
    content: str = Query(..., description="反馈内容"),
    rating: int = Query(..., description="评分（1-5）"),
    class_date: str = Query(..., description="上课日期(ISO格式)"),
    homework: Optional[str] = Query(None, description="课后作业"),
    attachments: Optional[str] = Query(None, description="附件(JSON字符串)"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建课堂反馈（org_id 来自 Token，校验学员归属）"""
    _, org_id = ctx

    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        rating_enum = FeedbackRating(rating)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid rating: {rating}")

    new_feedback = ClassFeedback(
        org_id=org_id,
        student_id=student_id,
        course_name=course_name,
        teacher_name=teacher_name,
        content=content,
        rating=rating_enum,
        class_date=datetime.fromisoformat(class_date),
        homework=homework,
        attachments=attachments,
        is_read=False,
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return {"message": "Feedback created successfully", "feedback": new_feedback.to_dict()}


@router.get("/student/{student_id}/achievements")
def get_student_achievements(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员荣誉列表（校验所属组织）"""
    _, org_id = ctx

    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(StudentAchievement).filter(
        StudentAchievement.student_id == student_id,
        StudentAchievement.org_id == org_id,
    )

    total = query.count()
    achievements = query.order_by(StudentAchievement.achieved_date.desc()).offset(skip).limit(limit).all()

    return {
        "achievements": [ach.to_dict() for ach in achievements],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/achievements")
def create_achievement(
    student_id: int = Query(..., description="学员ID"),
    name: str = Query(..., description="成就名称"),
    type: str = Query(..., description="类型：competition/certification/award"),
    achieved_date: str = Query(..., description="获得日期(ISO格式)"),
    description: Optional[str] = Query(None, description="详细描述"),
    icon: Optional[str] = Query(None, description="图标emoji"),
    certificate_url: Optional[str] = Query(None, description="证书URL"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加学员荣誉（org_id 来自 Token，校验学员归属）"""
    _, org_id = ctx

    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    new_achievement = StudentAchievement(
        org_id=org_id,
        student_id=student_id,
        name=name,
        type=type,
        description=description,
        achieved_date=datetime.fromisoformat(achieved_date),
        icon=icon,
        certificate_url=certificate_url,
    )

    db.add(new_achievement)
    db.commit()
    db.refresh(new_achievement)

    return {"message": "Achievement created successfully", "achievement": new_achievement.to_dict()}


@router.get("/student/{student_id}/messages")
def get_student_messages(
    student_id: int,
    message_type: Optional[str] = Query(None, description="消息类型筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员相关消息列表（校验所属组织）"""
    _, org_id = ctx

    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(ParentMessage).filter(
        ParentMessage.student_id == student_id,
        ParentMessage.org_id == org_id,
    )

    if message_type:
        query = query.filter(ParentMessage.message_type == message_type)

    total = query.count()
    messages = query.order_by(ParentMessage.create_time.desc()).offset(skip).limit(limit).all()

    return {
        "messages": [msg.to_dict() for msg in messages],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/messages")
def create_message(
    student_id: int = Query(..., description="学员ID"),
    sender_type: str = Query(..., description="发送者类型：teacher/parent/admin"),
    sender_name: str = Query(..., description="发送者姓名"),
    content: str = Query(..., description="消息内容"),
    message_type: str = Query(..., description="消息类型：feedback/question/notification"),
    parent_message_id: Optional[int] = Query(None, description="回复的消息ID"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建家校沟通消息（org_id 来自 Token，校验学员归属）"""
    _, org_id = ctx

    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    new_message = ParentMessage(
        org_id=org_id,
        student_id=student_id,
        sender_type=sender_type,
        sender_name=sender_name,
        content=content,
        message_type=message_type,
        parent_message_id=parent_message_id,
        is_read=False,
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {"message": "Message created successfully", "parent_message": new_message.to_dict()}


@router.put("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """标记消息为已读（校验所属组织）"""
    _, org_id = ctx
    message = (
        db.query(ParentMessage)
        .filter(ParentMessage.id == message_id, ParentMessage.org_id == org_id)
        .first()
    )

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.is_read = True
    message.read_time = datetime.utcnow()

    db.commit()

    return {"message": "Message marked as read"}
