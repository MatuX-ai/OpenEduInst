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
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # 改为可选
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
    """线索状态枚举"""
    PENDING = "待跟进"
    APPOINTED = "已预约试听"
    ENROLLED = "已报名"
    UNREACHABLE = "未接通"
    INVALID = "无效线索"


class LeadSource(enum.Enum):
    """线索来源枚举"""
    GROUND_PROMOTION = "地推活动"
    REFERRAL = "老带新"
    ONLINE = "线上咨询"
    TRANSFER = "转介绍"
    WALK_IN = "上门咨询"
    AD = "广告投放"
    OTHER = "其他"

class Lead(Base):
    """招生线索模型"""
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 家长信息
    parent_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    student_grade = Column(String(50), nullable=True)  # 学生年级
    
    # 线索信息
    source = Column(String(100), nullable=True)  # 线索来源：地推活动/老带新/线上咨询/转介绍
    interest_course = Column(String(200), nullable=False)  # 意向课程
    status = Column(Enum(LeadStatus), default=LeadStatus.PENDING, nullable=False, index=True)
    
    # 时间信息
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    follow_up_time = Column(DateTime, nullable=True)  # 下次跟进时间
    last_contact_time = Column(DateTime, nullable=True)  # 最后联系时间
    
    # 关联
    organization = relationship("Organization", back_populates="leads")
    follow_up_records = relationship("LeadFollowUp", back_populates="lead", cascade="all, delete-orphan")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "parent_name": self.parent_name,
            "phone": self.phone,
            "student_grade": self.student_grade,
            "source": self.source,
            "interest_course": self.interest_course,
            "status": self.status.value if isinstance(self.status, LeadStatus) else self.status,
            "create_time": self.create_time.isoformat() if self.create_time else None,
            "follow_up_time": self.follow_up_time.isoformat() if self.follow_up_time else None,
            "last_contact_time": self.last_contact_time.isoformat() if self.last_contact_time else None,
        }

class LeadFollowUp(Base):
    """线索跟进记录模型"""
    __tablename__ = "lead_follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 跟进信息
    contact_method = Column(String(50), nullable=False)  # 联系方式：电话/微信/面谈
    content = Column(String(1000), nullable=False)  # 跟进内容
    result = Column(String(200), nullable=True)  # 跟进结果
    
    # 时间信息
    follow_up_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    next_follow_up_time = Column(DateTime, nullable=True)
    
    # 关联
    lead = relationship("Lead", back_populates="follow_up_records")
    organization = relationship("Organization")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "contact_method": self.contact_method,
            "content": self.content,
            "result": self.result,
            "follow_up_time": self.follow_up_time.isoformat() if self.follow_up_time else None,
            "next_follow_up_time": self.next_follow_up_time.isoformat() if self.next_follow_up_time else None,
        }

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
