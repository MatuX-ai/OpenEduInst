"""
学员管理数据模型
用于教育机构的学员信息管理
"""

from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class StudentStatus(str, enum.Enum):
    """学员状态枚举"""
    ACTIVE = "active"           # 在读
    INACTIVE = "inactive"       # 休学
    GRADUATED = "graduated"     # 毕业
    DROPPED_OUT = "dropped_out" # 退学


class Gender(str, enum.Enum):
    """性别枚举"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Student(Base):
    """学员信息模型"""

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # 基本信息
    student_number = Column(String(50), unique=True, nullable=False, index=True)  # 学号
    name = Column(String(100), nullable=False)  # 姓名
    gender = Column(Enum(Gender), nullable=True)  # 性别
    id_card = Column(String(18), unique=True, nullable=True, index=True)  # 身份证号
    birth_date = Column(DateTime, nullable=True)  # 出生日期
    age = Column(Integer, nullable=True)  # 年龄

    # 联系信息
    phone = Column(String(20), nullable=True)  # 联系电话
    email = Column(String(255), nullable=True)  # 邮箱
    address = Column(Text, nullable=True)  # 家庭住址

    # 监护人信息
    guardian_name = Column(String(100), nullable=True)  # 监护人姓名
    guardian_phone = Column(String(20), nullable=True)  # 监护人电话
    guardian_relationship = Column(String(50), nullable=True)  # 与学员关系

    # 学籍信息
    enrollment_date = Column(DateTime, default=datetime.utcnow)  # 入学日期
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE)  # 学员状态
    grade_level = Column(String(50), nullable=True)  # 年级/级别
    class_name = Column(String(100), nullable=True)  # 班级名称

    # 紧急联系人
    emergency_contact_name = Column(String(100), nullable=True)  # 紧急联系人姓名
    emergency_contact_phone = Column(String(20), nullable=True)  # 紧急联系人电话

    # 其他信息
    notes = Column(Text, nullable=True)  # 备注
    avatar_url = Column(String(500), nullable=True)  # 头像URL

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "student_number": self.student_number,
            "name": self.name,
            "gender": self.gender.value if self.gender else None,
            "id_card": self.id_card,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "age": self.age,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "guardian_name": self.guardian_name,
            "guardian_phone": self.guardian_phone,
            "guardian_relationship": self.guardian_relationship,
            "enrollment_date": self.enrollment_date.isoformat() if self.enrollment_date else None,
            "status": self.status.value if self.status else None,
            "grade_level": self.grade_level,
            "class_name": self.class_name,
            "emergency_contact_name": self.emergency_contact_name,
            "emergency_contact_phone": self.emergency_contact_phone,
            "notes": self.notes,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}', number='{self.student_number}')>"


class Enrollment(Base):
    """学员课程报名模型"""

    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    # course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)  # 暂时注释，因为Course表不存在
    course_id = Column(Integer, nullable=False, index=True)  # 临时使用普通字段

    # 报名信息
    enrollment_date = Column(DateTime, default=datetime.utcnow)  # 报名日期
    start_date = Column(DateTime, nullable=True)  # 课程开始日期
    end_date = Column(DateTime, nullable=True)  # 课程结束日期
    status = Column(String(50), default="active")  # 报名状态（active, completed, cancelled）

    # 费用信息
    fee_amount = Column(Integer, nullable=True)  # 学费金额（分）
    payment_status = Column(String(50), default="pending")  # 支付状态（pending, paid, refunded）

    # 学习进度
    progress_percentage = Column(Integer, default=0)  # 学习进度百分比
    last_attendance_date = Column(DateTime, nullable=True)  # 最后出勤日期

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization")
    student = relationship("Student", back_populates="enrollments")
    # course = relationship("Course")  # 暂时注释

    def __repr__(self):
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, course_id={self.course_id})>"


class AttendanceRecord(Base):
    """学员出勤记录模型"""

    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    # schedule_id = Column(Integer, ForeignKey("class_schedules.id"), nullable=True, index=True)  # 暂时注释
    schedule_id = Column(Integer, nullable=True, index=True)  # 临时使用普通字段

    # 出勤信息
    attendance_date = Column(DateTime, nullable=False, index=True)  # 出勤日期
    status = Column(String(50), nullable=False)  # 出勤状态（present, absent, late, early_leave）
    check_in_time = Column(DateTime, nullable=True)  # 签到时间
    check_out_time = Column(DateTime, nullable=True)  # 签退时间

    # 备注
    notes = Column(Text, nullable=True)  # 备注说明

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization")
    student = relationship("Student", back_populates="attendance_records")
    # schedule = relationship("ClassSchedule")  # 暂时注释

    def __repr__(self):
        return f"<AttendanceRecord(id={self.id}, student_id={self.student_id}, date={self.attendance_date})>"


# Pydantic模型用于API请求/响应
from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    """创建学员的请求模型"""

    name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[Gender] = None
    id_card: Optional[str] = Field(None, max_length=18)
    birth_date: Optional[datetime] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, max_length=100)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    guardian_relationship: Optional[str] = Field(None, max_length=50)
    grade_level: Optional[str] = Field(None, max_length=50)
    class_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    avatar_url: Optional[str] = Field(None, max_length=500)


class StudentUpdate(BaseModel):
    """更新学员的请求模型"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    gender: Optional[Gender] = None
    id_card: Optional[str] = Field(None, max_length=18)
    birth_date: Optional[datetime] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, max_length=100)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    guardian_relationship: Optional[str] = Field(None, max_length=50)
    status: Optional[StudentStatus] = None
    grade_level: Optional[str] = Field(None, max_length=50)
    class_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    avatar_url: Optional[str] = Field(None, max_length=500)


class StudentResponse(BaseModel):
    """学员响应模型"""

    id: int
    org_id: int
    student_number: str
    name: str
    gender: Optional[Gender]
    id_card: Optional[str]
    birth_date: Optional[datetime]
    age: Optional[int]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    guardian_name: Optional[str]
    guardian_phone: Optional[str]
    guardian_relationship: Optional[str]
    enrollment_date: datetime
    status: StudentStatus
    grade_level: Optional[str]
    class_name: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    notes: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    """创建报名的请求模型"""

    student_id: int
    course_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    fee_amount: Optional[int] = None
    notes: Optional[str] = None


class EnrollmentResponse(BaseModel):
    """报名响应模型"""

    id: int
    org_id: int
    student_id: int
    course_id: int
    enrollment_date: datetime
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str
    fee_amount: Optional[int]
    payment_status: str
    progress_percentage: int
    last_attendance_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceRecordCreate(BaseModel):
    """创建出勤记录的请求模型"""

    student_id: int
    schedule_id: Optional[int] = None
    attendance_date: datetime
    status: str = Field(..., pattern="^(present|absent|late|early_leave)$")
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class AttendanceRecordResponse(BaseModel):
    """出勤记录响应模型"""

    id: int
    org_id: int
    student_id: int
    schedule_id: Optional[int]
    attendance_date: datetime
    status: str
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
