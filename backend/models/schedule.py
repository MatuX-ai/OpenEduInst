from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from utils.database import Base

class ScheduleStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)  # 多租户隔离
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    recurrence_rule = Column(String(255), nullable=True)  # iCal recurrence rule
    
    status = Column(Enum(ScheduleStatus), default=ScheduleStatus.DRAFT)
    max_students = Column(Integer, default=0)
    enrolled_students = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # course = relationship("Course")  # 暂时注释
    # teacher = relationship("Teacher")  # 暂时注释
    # classroom = relationship("Classroom")  # 暂时注释

class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    TRIAL = "trial"
    ENROLLED = "enrolled"
    LOST = "lost"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    parent_name = Column(String(100), nullable=True)
    source = Column(String(50), nullable=True)  # e.g., WeChat, Referral
    
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    
    hours = Column(Integer, nullable=False)  # in minutes or hours
    rate = Column(Integer, nullable=False)  # hourly rate
    total_amount = Column(Integer, nullable=False)
    
    is_confirmed = Column(Boolean, default=False)
    settlement_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # schedule = relationship("Schedule")  # 暂时注释
    # teacher = relationship("Teacher")  # 暂时注释
