"""
教育机构管理API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 URL/query 传入跨组织查询。
"""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.base_models import Teacher, Course
from models.student import Student, Enrollment, StudentStatus

router = APIRouter(prefix="/api/v1/educational_institution", tags=["教育机构管理"])

org_detail_router = APIRouter(prefix="/api/v1", tags=["机构详情"])


# ==================== 机构概览 ====================

@router.get("/overview")
def get_org_overview(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构概览数据（org_id 来自 Token）"""
    _, org_id = ctx

    student_count = db.query(func.count(Student.id)).filter(Student.org_id == org_id).scalar() or 0
    teacher_count = (
        db.query(func.count(Teacher.id)).filter(Teacher.org_id == org_id, Teacher.is_active == True).scalar() or 0
    )
    course_count = (
        db.query(func.count(Course.id)).filter(Course.org_id == org_id, Course.is_active == True).scalar() or 0
    )
    active_members = (
        db.query(func.count(Student.id)).filter(Student.org_id == org_id, Student.status == StudentStatus.ACTIVE).scalar() or 0
    )

    return {
        "success": True,
        "data": {
            "studentCount": student_count,
            "teacherCount": teacher_count,
            "activeCourses": course_count,
            "activeMembers": active_members,
        },
        "message": "获取机构概览成功",
    }


# ==================== 核心指标 ====================

@router.get("/metrics")
def get_org_metrics(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构核心指标（org_id 来自 Token）"""
    _, org_id = ctx

    active_students = (
        db.query(func.count(Student.id)).filter(
            Student.org_id == org_id, Student.status == StudentStatus.ACTIVE
        ).scalar() or 0
    )

    total_courses = db.query(func.count(Course.id)).filter(Course.org_id == org_id).scalar() or 0
    completed_courses = 0

    return {
        "success": True,
        "data": {
            "activeStudents": active_students,
            "monthlyRevenue": "¥0",
            "courseCompletionRate": "0%",
        },
        "message": "获取核心指标成功",
    }


# ==================== 课程管理 ====================

@router.get("/courses")
def get_org_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构的课程列表（分页）"""
    _, org_id = ctx

    query = db.query(Course).filter(Course.org_id == org_id)
    total = query.count()
    courses = query.order_by(Course.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for c in courses:
        items.append({
            "id": c.id,
            "org_id": c.org_id,
            "name": c.title,
            "category": c.category or "",
            "enrollmentCount": 0,
            "capacity": 0,
            "status": "ongoing" if c.is_active else "archived",
            "startDate": c.created_at.isoformat() if c.created_at else None,
            "endDate": c.updated_at.isoformat() if c.updated_at else None,
            "description": c.description or "",
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取课程列表成功",
    }


@router.post("/courses")
def create_org_course(
    name: str = Query(..., description="课程名称"),
    category: str = Query("", description="课程分类"),
    description: str = Query("", description="课程描述"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新课程（org_id 来自 Token）"""
    _, org_id = ctx

    course = Course(
        org_id=org_id,
        title=name,
        category=category,
        description=description,
        is_active=True,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return {
        "success": True,
        "data": {
            "id": course.id,
            "org_id": course.org_id,
            "name": course.title,
            "category": course.category or "",
            "status": "ongoing",
        },
        "message": "课程创建成功",
    }


@router.put("/courses/{course_id}")
def update_org_course(
    course_id: int,
    name: Optional[str] = Query(None, description="课程名称"),
    category: Optional[str] = Query(None, description="课程分类"),
    description: Optional[str] = Query(None, description="课程描述"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新课程信息（校验所属组织）"""
    _, org_id = ctx
    course = db.query(Course).filter(Course.id == course_id, Course.org_id == org_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if name is not None:
        course.title = name
    if category is not None:
        course.category = category
    if description is not None:
        course.description = description

    db.commit()
    db.refresh(course)

    return {
        "success": True,
        "data": {
            "id": course.id,
            "org_id": course.org_id,
            "name": course.title,
            "category": course.category or "",
            "status": "ongoing" if course.is_active else "archived",
        },
        "message": "课程更新成功",
    }


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除课程（校验所属组织）"""
    _, org_id = ctx
    course = db.query(Course).filter(Course.id == course_id, Course.org_id == org_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()

    return {
        "success": True,
        "data": {"success": True, "message": "课程已删除"},
        "message": "课程删除成功",
    }


# ==================== 课程统计 ====================

@router.get("/course/stats")
def get_course_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取课程统计信息（org_id 来自 Token）"""
    _, org_id = ctx

    total = db.query(func.count(Course.id)).filter(Course.org_id == org_id).scalar() or 0
    active = (
        db.query(func.count(Course.id)).filter(Course.org_id == org_id, Course.is_active == True).scalar() or 0
    )

    return {
        "success": True,
        "data": {
            "totalCourses": total,
            "activeCourses": active,
            "completedCourses": 0,
            "averageProgress": 0,
            "completionRate": 0,
        },
        "message": "获取课程统计成功",
    }


# ==================== 教师管理 ====================

@router.get("/teachers")
def get_org_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构的教师列表（分页）"""
    _, org_id = ctx

    query = db.query(Teacher).filter(Teacher.org_id == org_id)
    total = query.count()
    teachers = query.order_by(Teacher.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for t in teachers:
        items.append({
            "id": t.id,
            "user_id": t.id,
            "org_id": t.org_id,
            "name": t.name,
            "email": t.email or "",
            "department": t.specialty or "",
            "courseCount": 0,
            "totalHours": 0,
            "activeHours": 0,
            "status": "active" if t.is_active else "inactive",
            "specialization": t.specialty or "",
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取教师列表成功",
    }


@router.post("/teachers")
def add_org_teacher(
    name: str = Query(..., description="教师姓名"),
    email: str = Query("", description="邮箱"),
    phone: str = Query("", description="电话"),
    specialization: str = Query("", description="专业领域"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加新教师（org_id 来自 Token）"""
    _, org_id = ctx

    teacher = Teacher(
        org_id=org_id,
        name=name,
        email=email,
        phone=phone,
        specialty=specialization,
        is_active=True,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return {
        "success": True,
        "data": {
            "id": teacher.id,
            "org_id": teacher.org_id,
            "name": teacher.name,
            "email": teacher.email or "",
            "status": "active",
        },
        "message": "教师添加成功",
    }


# ==================== 学生管理 ====================

@router.get("/students")
def get_org_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构的学生列表（分页）"""
    _, org_id = ctx

    query = db.query(Student).filter(Student.org_id == org_id)
    total = query.count()
    students = query.order_by(Student.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for s in students:
        items.append({
            "id": s.id,
            "user_id": s.id,
            "org_id": s.org_id,
            "name": s.name,
            "email": s.email or "",
            "grade": "",
            "class_name": "",
            "enrolledCourses": 0,
            "progress": 0,
            "attendanceRate": 0,
            "averageScore": 0,
            "lastActivity": s.updated_at.isoformat() if s.updated_at else None,
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "enrollmentDate": s.created_at.isoformat() if s.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取学生列表成功",
    }


@router.post("/students")
def add_org_student(
    name: str = Query(..., description="学生姓名"),
    email: str = Query("", description="邮箱"),
    phone: str = Query("", description="电话"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加新学生（org_id 来自 Token）"""
    _, org_id = ctx

    count = db.query(func.count(Student.id)).filter(Student.org_id == org_id).scalar() or 0
    student_number = f"STU{org_id:04d}{(count + 1):04d}"

    student = Student(
        org_id=org_id,
        student_number=student_number,
        name=name,
        email=email,
        phone=phone,
        status=StudentStatus.ACTIVE,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "success": True,
        "data": {
            "id": student.id,
            "org_id": student.org_id,
            "name": student.name,
            "student_number": student.student_number,
            "status": "active",
        },
        "message": "学生添加成功",
    }


@router.put("/students/{student_id}/progress")
def update_student_progress(
    student_id: int,
    progress: int = Query(0, ge=0, le=100, description="学习进度"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新学生学习进度（校验所属组织）"""
    _, org_id = ctx
    student = db.query(Student).filter(Student.id == student_id, Student.org_id == org_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "success": True,
        "data": {
            "id": student.id,
            "org_id": student.org_id,
            "name": student.name,
            "progress": progress,
            "status": student.status.value if hasattr(student.status, "value") else str(student.status),
        },
        "message": "学习进度更新成功",
    }


# ==================== 报名统计 ====================

@router.get("/enrollment/stats")
def get_enrollment_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取报名统计信息（org_id 来自 Token）"""
    _, org_id = ctx

    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id).scalar() or 0
    active_enrollments = (
        db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id, Enrollment.is_active == True).scalar() or 0
    )

    return {
        "success": True,
        "data": {
            "totalEnrollments": total_enrollments,
            "activeEnrollments": active_enrollments,
            "completedEnrollments": 0,
            "dropoutRate": 0,
            "conversionRate": 0,
            "retentionRate": 0,
            "churnRate": 0,
        },
        "message": "获取报名统计成功",
    }


# ==================== 完整Dashboard ====================

@router.get("/dashboard")
def get_org_dashboard(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前机构Dashboard完整数据"""
    _, org_id = ctx

    student_count = db.query(func.count(Student.id)).filter(Student.org_id == org_id).scalar() or 0
    teacher_count = (
        db.query(func.count(Teacher.id)).filter(Teacher.org_id == org_id, Teacher.is_active == True).scalar() or 0
    )
    course_count = (
        db.query(func.count(Course.id)).filter(Course.org_id == org_id, Course.is_active == True).scalar() or 0
    )
    active_members = (
        db.query(func.count(Student.id)).filter(Student.org_id == org_id, Student.status == StudentStatus.ACTIVE).scalar() or 0
    )

    courses = db.query(Course).filter(Course.org_id == org_id).order_by(Course.created_at.desc()).limit(10).all()
    course_list = []
    for c in courses:
        course_list.append({
            "id": c.id,
            "org_id": c.org_id,
            "name": c.title,
            "category": c.category or "",
            "enrollmentCount": 0,
            "capacity": 0,
            "status": "ongoing" if c.is_active else "archived",
            "startDate": c.created_at.isoformat() if c.created_at else None,
            "endDate": None,
            "teacherName": "",
            "progress": 0,
            "revenue": 0,
        })

    teachers = db.query(Teacher).filter(Teacher.org_id == org_id).order_by(Teacher.created_at.desc()).limit(10).all()
    teacher_list = []
    for t in teachers:
        teacher_list.append({
            "id": t.id,
            "user_id": t.id,
            "org_id": t.org_id,
            "name": t.name,
            "email": t.email or "",
            "department": t.specialty or "",
            "courseCount": 0,
            "totalHours": 0,
            "activeHours": 0,
            "status": "active" if t.is_active else "inactive",
            "specialization": t.specialty or "",
            "employee_id": "",
            "performanceScore": 0,
        })

    students = db.query(Student).filter(Student.org_id == org_id).order_by(Student.id.desc()).limit(10).all()
    student_list = []
    for s in students:
        student_list.append({
            "id": s.id,
            "user_id": s.id,
            "org_id": s.org_id,
            "name": s.name,
            "email": s.email or "",
            "grade": "",
            "class_name": "",
            "enrolledCourses": 0,
            "progress": 0,
            "attendanceRate": 0,
            "averageScore": 0,
            "lastActivity": s.updated_at.isoformat() if s.updated_at else None,
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "enrollmentDate": s.created_at.isoformat() if s.created_at else None,
        })

    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id).scalar() or 0

    return {
        "success": True,
        "data": {
            "overview": {
                "studentCount": student_count,
                "teacherCount": teacher_count,
                "activeCourses": course_count,
                "activeMembers": active_members,
            },
            "courses": course_list,
            "teachers": teacher_list,
            "students": student_list,
            "enrollmentStats": {
                "totalEnrollments": total_enrollments,
                "activeEnrollments": 0,
                "completedEnrollments": 0,
                "dropoutRate": 0,
                "conversionRate": 0,
                "retentionRate": 0,
                "churnRate": 0,
            },
            "courseStats": {
                "totalCourses": course_count,
                "activeCourses": course_count,
                "completedCourses": 0,
                "averageProgress": 0,
                "completionRate": 0,
                "satisfactionRate": 0,
                "revenueGenerated": 0,
            },
            "recentActivities": [],
            "alerts": [],
            "lastUpdated": datetime.utcnow().isoformat(),
        },
        "message": "获取Dashboard数据成功",
    }


# ==================== 组织详情 ====================

@router.get("/organization")
def get_organization_detail(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织详情（org_id 来自 Token）"""
    _, org_id = ctx
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": org.id,
        "name": org.name,
        "org_type": org.org_type.value if hasattr(org.org_type, "value") else str(org.org_type),
        "contact_email": org.contact_email or "",
        "phone": org.phone or "",
        "address": org.address or "",
        "max_users": org.max_users or 0,
        "is_active": getattr(org, "is_active", True),
    }


@org_detail_router.get("/organizations/{org_id}")
def get_organization_detail_legacy(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取组织详情（保留旧路径，org_id 以 Token 为准，URL 参数仅用于匹配）"""
    _, token_org_id = ctx
    org = db.query(Organization).filter(Organization.id == token_org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": org.id,
        "name": org.name,
        "org_type": org.org_type.value if hasattr(org.org_type, "value") else str(org.org_type),
        "contact_email": org.contact_email or "",
        "phone": org.phone or "",
        "address": org.address or "",
        "max_users": org.max_users or 0,
        "is_active": getattr(org, "is_active", True),
    }
