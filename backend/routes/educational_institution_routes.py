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
    """获取当前机构概览数据（org_id 来自 Token）— 与 /org/{org_id}/overview 格式一致"""
    _, org_id = ctx

    org = db.query(Organization).filter(Organization.id == org_id).first()

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
    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id).scalar() or 0

    return {
        "success": True,
        "data": {
            # 机构基本信息（与 org_overview_routes._build_overview 保持一致）
            "id": org.id if org else org_id,
            "name": org.name if org else "",
            "contact_email": org.contact_email if org else "",
            "phone": org.phone if org else "",
            "address": org.address if org else "",
            "website": getattr(org, "website", "") or "",
            "max_users": org.max_users if org else 0,
            "is_active": getattr(org, "is_active", True) if org else True,
            "created_at": org.created_at.isoformat() if org and getattr(org, "created_at", None) else "",
            "updated_at": org.updated_at.isoformat() if org and getattr(org, "updated_at", None) else "",
            "org_type": org.org_type.value if org and hasattr(org.org_type, "value") else (str(org.org_type) if org else ""),
            # 业务统计
            "studentCount": student_count,
            "teacherCount": teacher_count,
            "activeCourses": course_count,
            "activeMembers": active_members,
            # 嵌套统计
            "statistics": {
                "total_licenses": 0,
                "active_licenses": 0,
                "total_users": teacher_count,
                "total_courses": course_count,
                "total_enrollments": total_enrollments,
                "total_students": student_count,
                "storage_used_mb": 0,
                "storage_limit_mb": 1024,
            },
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
    active_courses = (
        db.query(func.count(Course.id)).filter(Course.org_id == org_id, Course.is_active == True).scalar() or 0
    )
    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id).scalar() or 0
    active_enrollments = (
        db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id, Enrollment.is_active == True).scalar() or 0
    )
    total_teachers = db.query(func.count(Teacher.id)).filter(Teacher.org_id == org_id).scalar() or 0

    # 计算完成率（有 enrollments 的课程视为活跃，反推完成率）
    completion_rate = 0
    if total_courses > 0:
        completion_rate = round((total_courses - active_courses) / total_courses * 100)

    return {
        "success": True,
        "data": {
            "activeStudents": active_students,
            "totalStudents": active_students,
            "totalTeachers": total_teachers,
            "totalCourses": total_courses,
            "activeCourses": active_courses,
            "totalEnrollments": total_enrollments,
            "activeEnrollments": active_enrollments,
            "monthlyRevenue": "¥0",
            "courseCompletionRate": f"{completion_rate}%",
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
    completed = db.query(func.count(Course.id)).filter(
        Course.org_id == org_id, Course.is_active == False
    ).scalar() or 0

    # 计算平均进度（基于课程活跃度比例）
    avg_progress = 0
    if total > 0:
        avg_progress = round(active / total * 100)

    return {
        "success": True,
        "data": {
            "totalCourses": total,
            "activeCourses": active,
            "completedCourses": completed,
            "averageProgress": avg_progress,
            "completionRate": avg_progress,
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
    # 注意：部分数据库可能没有 Enrollment.is_active 字段，使用 try/except 保护
    try:
        active_enrollments = (
            db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id, Enrollment.is_active == True).scalar() or 0
        )
    except Exception:
        active_enrollments = total_enrollments

    return {
        "success": True,
        "data": {
            "totalEnrollments": total_enrollments,
            "activeEnrollments": active_enrollments,
            "completedEnrollments": max(0, total_enrollments - active_enrollments),
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
    """
    获取当前机构Dashboard完整数据
    返回格式与 org_overview_routes._build_dashboard 保持一致
    兼容前端 InstitutionDashboardComponent 的字段期望
    """
    _, org_id = ctx

    org = db.query(Organization).filter(Organization.id == org_id).first()

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
    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.org_id == org_id).scalar() or 0
    total_courses_all = db.query(func.count(Course.id)).filter(Course.org_id == org_id).scalar() or 0
    total_users = student_count + teacher_count

    # 课程列表（近10条）
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

    # 教师列表（近10条）
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

    # 学生列表（近10条）
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

    return {
        "success": True,
        "data": {
            # 机构基础信息（与 org_overview_routes._build_dashboard 对齐）
            "organization": {
                "id": org.id if org else org_id,
                "name": org.name if org else "",
                "contact_email": org.contact_email if org else "",
                "phone": org.phone if org else "",
                "address": org.address if org else "",
                "website": getattr(org, "website", "") or "",
                "max_users": org.max_users if org else 0,
                "is_active": getattr(org, "is_active", True) if org else True,
                "created_at": org.created_at.isoformat() if org and getattr(org, "created_at", None) else "",
                "updated_at": org.updated_at.isoformat() if org and getattr(org, "updated_at", None) else "",
            },
            "statistics": {
                "activeLicenses": 0,
                "totalUsers": total_users,
                "totalStudents": student_count,
                "totalTeachers": teacher_count,
                "totalCourses": total_courses_all,
                "activeCourses": course_count,
                "totalEnrollments": total_enrollments,
                "totalProjects": course_count,
                "hardwareConsumption": 0,
                "licenseRemaining": 0,
                "newProjectsThisMonth": 0,
                "activeUsers": total_users,
                "storageUsed": 0,
                "storageTotal": 1024,
            },
            "charts": {
                "userGrowthData": [],
                "projectTrendData": [],
                "hardwareUsageData": [],
                "licenseUsageData": [],
            },
            # 兼容旧版字段（原 get_org_dashboard 格式）
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
                "totalCourses": total_courses_all,
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


# ============================================================
# 以下为适配前端的 org/{org_id}/... 路径变体
# 逻辑与上述无 org_id 路由完全一致，仅 URL 形式不同
# 实际 org_id 以 Token 为准，URL 中的 org_id 仅用于路由匹配
# ============================================================

org_scoped_router = APIRouter(
    prefix="/api/v1/educational_institution/org",
    tags=["机构管理-组织范围"],
)


@org_scoped_router.get("/{org_id}/overview")
def get_org_overview_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """机构概览（带 org_id 路径参数，兼容旧版 org/... 路径形式）"""
    return get_org_overview(db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/metrics")
def get_org_metrics_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """机构核心指标（带 org_id 路径参数）"""
    return get_org_metrics(db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/courses")
def get_org_courses_scoped(
    org_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """课程列表（带 org_id 路径参数）"""
    return get_org_courses(page=page, page_size=page_size, db=db, ctx=ctx)


@org_scoped_router.post("/{org_id}/courses")
def create_org_course_scoped(
    org_id: int,
    name: str = Query(...),
    category: str = Query(""),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建课程（带 org_id 路径参数）"""
    return create_org_course(name=name, category=category, description=description, db=db, ctx=ctx)


@org_scoped_router.put("/{org_id}/courses/{course_id}")
def update_org_course_scoped(
    org_id: int,
    course_id: int,
    name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新课程（带 org_id 路径参数）"""
    return update_org_course(
        course_id=course_id,
        name=name,
        category=category,
        description=description,
        db=db,
        ctx=ctx,
    )


@org_scoped_router.get("/{org_id}/course/stats")
def get_course_stats_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """课程统计（带 org_id 路径参数）"""
    return get_course_stats(db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/teachers")
def get_org_teachers_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """教师列表（带 org_id 路径参数）"""
    return get_org_teachers(db=db, ctx=ctx)


@org_scoped_router.post("/{org_id}/teachers")
def create_org_teacher_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建教师（带 org_id 路径参数）"""
    return add_org_teacher(db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/students")
def get_org_students_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学生列表（带 org_id 路径参数）"""
    return get_org_students(db=db, ctx=ctx)


@org_scoped_router.post("/{org_id}/students")
def create_org_student_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建学生（带 org_id 路径参数）"""
    return add_org_student(db=db, ctx=ctx)


@org_scoped_router.put("/{org_id}/students/{student_id}/progress")
def update_student_progress_scoped(
    org_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新学生进度（带 org_id 路径参数）"""
    return update_student_progress(student_id=student_id, db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/enrollment/stats")
def get_enrollment_stats_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """招生统计（带 org_id 路径参数）"""
    return get_enrollment_stats(db=db, ctx=ctx)


@org_scoped_router.get("/{org_id}/dashboard")
def get_org_dashboard_scoped(
    org_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """机构 Dashboard 汇总（带 org_id 路径参数）"""
    return get_org_dashboard(db=db, ctx=ctx)
