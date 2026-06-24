"""
职业学校 - 安全监控与准入管理 + STEM 教务管理 数据模型
"""

from datetime import datetime, date
from typing import Optional, List
import enum

from sqlalchemy import (
    Boolean, Column, DateTime, Date, Enum, Float,
    ForeignKey, Integer, String, Text, JSON,
)
from sqlalchemy.orm import relationship

from utils.database import Base


# ==================== 安全准入 ====================


class VocSafetyCertStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class VocSafetyLevel(str, enum.Enum):
    NORMAL = "normal"
    WARNING = "warning"
    DANGEROUS = "dangerous"


class VocIncidentType(str, enum.Enum):
    EQUIPMENT_DAMAGE = "equipment_damage"
    PERSONAL_INJURY = "personal_injury"
    FIRE = "fire"
    ELECTRIC_SHOCK = "electric_shock"
    CHEMICAL_LEAK = "chemical_leak"
    OTHER = "other"


class VocSafetyCertification(Base):
    """安全准入认证记录"""
    __tablename__ = "voc_safety_certifications"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_name = Column(String(100))

    safety_level = Column(Enum(VocSafetyLevel), nullable=False)
    exam_score = Column(Integer)
    exam_date = Column(Date, default=date.today)
    expire_date = Column(Date)
    status = Column(Enum(VocSafetyCertStatus), default=VocSafetyCertStatus.ACTIVE)

    created_at = Column(DateTime, default=datetime.utcnow)


class VocSafetyChecklist(Base):
    """安全检查记录"""
    __tablename__ = "voc_safety_checklists"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    location_room = Column(String(100), nullable=False)
    checker_id = Column(Integer)
    checker_name = Column(String(100))
    check_date = Column(Date, default=date.today)
    items = Column(JSON)  # [{item: "xxx", passed: true/false, note: "xxx"}]
    passed = Column(Boolean, default=True)
    abnormality = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class VocIncidentReport(Base):
    """事故报告"""
    __tablename__ = "voc_incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    incident_type = Column(Enum(VocIncidentType), nullable=False)
    location_room = Column(String(100))
    description = Column(Text)
    severity = Column(String(20), default="minor")  # minor/major/critical
    reporter_id = Column(Integer)
    reporter_name = Column(String(100))
    incident_date = Column(DateTime, default=datetime.utcnow)
    handling = Column(Text)
    status = Column(String(20), default="pending")  # pending/handling/resolved
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== STEM 教务 ====================


class VocCourse(Base):
    """实训课程"""
    __tablename__ = "voc_courses"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    major = Column(String(100))  # 适用专业
    total_hours = Column(Integer, default=0)
    training_type = Column(String(50), default="mixed")  # theory/practical/mixed
    teacher_id = Column(Integer)
    teacher_name = Column(String(100))
    room_id = Column(Integer, ForeignKey("voc_training_rooms.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    room = relationship("VocTrainingRoom", back_populates="courses")


class VocTrainingRoom(Base):
    """实训室"""
    __tablename__ = "voc_training_rooms"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    building = Column(String(100))
    floor = Column(String(50))
    capacity = Column(Integer, default=20)
    equipment_summary = Column(Text)
    is_active = Column(Boolean, default=True)

    courses = relationship("VocCourse", back_populates="room")
    schedules = relationship("VocTrainingSchedule", back_populates="room")


class VocTrainingSchedule(Base):
    """实训排课"""
    __tablename__ = "voc_training_schedules"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("voc_courses.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("voc_training_rooms.id"), nullable=False)
    teacher_id = Column(Integer)
    teacher_name = Column(String(100))
    weekday = Column(Integer)  # 1-7
    start_time = Column(String(10))  # "08:00"
    end_time = Column(String(10))    # "09:30"
    semester = Column(String(50))
    max_students = Column(Integer, default=20)
    status = Column(String(20), default="active")

    room = relationship("VocTrainingRoom", back_populates="schedules")


# ==================== Pydantic Schemas ====================

from typing import Optional as Opt
from pydantic import BaseModel, Field


class VocSafetyCertCreate(BaseModel):
    user_id: int
    user_name: str
    safety_level: str = "normal"
    exam_score: Opt[int] = None
    expire_date: Opt[date] = None


class VocChecklistCreate(BaseModel):
    location_room: str
    checker_id: int
    checker_name: str
    items: list
    passed: bool = True
    abnormality: Opt[str] = None


class VocIncidentCreate(BaseModel):
    incident_type: str
    location_room: Opt[str] = None
    description: str
    severity: str = "minor"
    reporter_id: int
    reporter_name: str


class VocCourseCreate(BaseModel):
    name: str
    description: Opt[str] = None
    major: Opt[str] = None
    total_hours: int = 0
    training_type: str = "mixed"
    teacher_id: Opt[int] = None
    teacher_name: Opt[str] = None
    room_id: Opt[int] = None


class VocRoomCreate(BaseModel):
    name: str
    building: Opt[str] = None
    floor: Opt[str] = None
    capacity: int = 20
    equipment_summary: Opt[str] = None


class VocScheduleCreate(BaseModel):
    course_id: int
    room_id: int
    teacher_id: Opt[int] = None
    teacher_name: Opt[str] = None
    weekday: int
    start_time: str
    end_time: str
    semester: Opt[str] = None
    max_students: int = 20


class VocSafetyStats(BaseModel):
    safety_days: int = 0
    total_certifications: int = 0
    active_certifications: int = 0
    pending_incidents: int = 0
    checklists_today: int = 0

    model_config = {"from_attributes": True}


class VocRoomUtilization(BaseModel):
    room_id: int
    room_name: str
    total_slots: int = 0
    used_slots: int = 0
    utilization_rate: str = "0%"

    model_config = {"from_attributes": True}