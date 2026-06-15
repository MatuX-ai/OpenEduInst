"""
学员管理API路由
提供学员信息的CRUD操作、报名管理和出勤记录功能
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import get_current_org_id, get_current_user_sync, require_org_context
from models.student import (
    Student, 
    Enrollment, 
    AttendanceRecord,
    StudentCreate, 
    StudentUpdate, 
    StudentResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    AttendanceRecordCreate,
    AttendanceRecordResponse,
    StudentStatus
)
from models.license import Organization

router = APIRouter(prefix="/api/v1/students", tags=["学员管理"])


# ==================== 学员管理 ====================

@router.get("/", response_model=dict)
def get_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[StudentStatus] = None,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)  # 从 Token 中提取并校验
):
    """获取学员列表（自动根据登录用户所属组织过滤）"""
    try:
        query = db.query(Student).filter(Student.org_id == org_id)
        
        if status:
            query = query.filter(Student.status == status)
        
        if keyword:
            query = query.filter(
                (Student.name.like(f"%{keyword}%")) |
                (Student.student_number.like(f"%{keyword}%"))
            )
        
        # 计算总数
        total = query.count()
        
        # 分页
        skip = (page - 1) * page_size
        students = query.offset(skip).limit(page_size).all()
        
        return {
            "data": [s.to_dict() for s in students],
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
    except Exception as e:
        import traceback
        print(f"错误详情: {e}")
        print(traceback.format_exc())
        raise


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int, 
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)
):
    """获取单个学员详情（带多租户隔离）"""
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.org_id == org_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")
    return student


@router.post("/", response_model=StudentResponse)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)
):
    """创建新学员（自动关联到当前用户的组织）"""
    # 验证机构是否存在
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="机构不存在")
    
    # 生成学号（简化逻辑，实际应该更复杂）
    import random
    student_number = f"STU{org_id}{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
    
    # 检查学号是否已存在
    while db.query(Student).filter(Student.student_number == student_number).first():
        student_number = f"STU{org_id}{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
    
    # 创建学员
    db_student = Student(
        org_id=org_id,
        student_number=student_number,
        **student_data.dict()
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return db_student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)
):
    """更新学员信息（带多租户隔离）"""
    db_student = db.query(Student).filter(
        Student.id == student_id,
        Student.org_id == org_id
    ).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")
    
    # 更新字段
    update_data = student_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_student, field, value)
    
    db.commit()
    db.refresh(db_student)
    
    return db_student


@router.delete("/{student_id}")
def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)
):
    """删除学员（带多租户隔离）"""
    db_student = db.query(Student).filter(
        Student.id == student_id,
        Student.org_id == org_id
    ).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")
    
    db.delete(db_student)
    db.commit()
    
    return {"message": "学员删除成功"}


# ==================== 报名管理 ====================

@router.get("/{student_id}/enrollments", response_model=List[EnrollmentResponse])
def get_student_enrollments(
    student_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员的报名记录（仅当前组织）"""
    _, org_id = ctx
    # 先校验该学员属于当前组织
    student = db.query(Student).filter(
        Student.id == student_id, Student.org_id == org_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id, Enrollment.org_id == org_id
    ).all()
    return enrollments


@router.post("/enrollments", response_model=EnrollmentResponse)
def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建报名记录（org_id 来自 Token，拒绝 query 传入）"""
    _, org_id = ctx
    student = db.query(Student).filter(
        Student.id == enrollment_data.student_id, Student.org_id == org_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")

    db_enrollment = Enrollment(
        org_id=org_id,
        student_id=enrollment_data.student_id,
        course_id=enrollment_data.course_id,
        start_date=enrollment_data.start_date,
        end_date=enrollment_data.end_date,
        fee_amount=enrollment_data.fee_amount,
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


# ==================== 出勤记录 ====================

@router.get("/{student_id}/attendance", response_model=List[AttendanceRecordResponse])
def get_student_attendance(
    student_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学员的出勤记录（仅当前组织）"""
    _, org_id = ctx
    student = db.query(Student).filter(
        Student.id == student_id, Student.org_id == org_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")

    query = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id,
        AttendanceRecord.org_id == org_id,
    )
    if start_date:
        query = query.filter(AttendanceRecord.attendance_date >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.attendance_date <= end_date)
    return query.all()


@router.post("/attendance", response_model=AttendanceRecordResponse)
def create_attendance_record(
    attendance_data: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建出勤记录（org_id 来自 Token，拒绝 query 传入）"""
    _, org_id = ctx
    student = db.query(Student).filter(
        Student.id == attendance_data.student_id, Student.org_id == org_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="学员不存在或无权访问")

    db_attendance = AttendanceRecord(
        org_id=org_id,
        student_id=attendance_data.student_id,
        schedule_id=attendance_data.schedule_id,
        attendance_date=attendance_data.attendance_date,
        status=attendance_data.status,
        check_in_time=attendance_data.check_in_time,
        check_out_time=attendance_data.check_out_time,
        notes=attendance_data.notes,
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


# ==================== 统计信息 ====================

@router.get("/stats/summary")
def get_student_stats(
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org_id)  # 从 Token 中提取并校验
):
    """获取学员统计信息"""
    total_students = db.query(Student).filter(Student.org_id == org_id).count()
    active_students = db.query(Student).filter(
        Student.org_id == org_id,
        Student.status == StudentStatus.ACTIVE
    ).count()
    
    return {
        "total_students": total_students,
        "active_students": active_students,
        "inactive_students": total_students - active_students
    }
