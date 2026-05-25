"""
竞赛与认证数据模型
用于管理STEM培训机构的赛事报名、考级安排和获奖成果
"""

from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean
from sqlalchemy.orm import relationship

from utils.database import Base


class CompetitionLevel(enum.Enum):
    """竞赛级别枚举"""
    INTERNATIONAL = "国际级"
    NATIONAL = "国家级"
    PROVINCIAL = "省级"
    CITY = "市级"


class CompetitionCategory(enum.Enum):
    """竞赛类别枚举"""
    ROBOTICS = "机器人"
    PROGRAMMING = "编程"
    MAKER = "创客"
    AI = "人工智能"
    ELECTRONICS = "电子信息"


class CompetitionStatus(enum.Enum):
    """竞赛状态枚举"""
    REGISTERING = "报名中"
    PREPARING = "筹备中"
    CLOSED = "已截止"
    ONGOING = "进行中"
    COMPLETED = "已结束"


class Competition(Base):
    """竞赛模型"""
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 竞赛名称
    organizer = Column(String(200), nullable=False)  # 主办单位
    level = Column(Enum(CompetitionLevel), nullable=False)  # 竞赛级别
    category = Column(Enum(CompetitionCategory), nullable=False)  # 竞赛类别
    
    # 时间信息
    register_deadline = Column(DateTime, nullable=False)  # 报名截止日期
    competition_date = Column(DateTime, nullable=False)  # 比赛日期
    
    # 参与信息
    participants_count = Column(Integer, default=0)  # 报名人数
    max_participants = Column(Integer, nullable=True)  # 最大人数限制
    
    # 状态
    status = Column(Enum(CompetitionStatus), default=CompetitionStatus.REGISTERING, nullable=False)
    
    # 成就记录
    achievements = Column(Text, nullable=True)  # 往届获奖情况
    
    # 描述
    description = Column(Text, nullable=True)  # 竞赛描述
    rules = Column(Text, nullable=True)  # 竞赛规则
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    organization = relationship("Organization", back_populates="competitions")
    registrations = relationship("CompetitionRegistration", back_populates="competition", cascade="all, delete-orphan")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "organizer": self.organizer,
            "level": self.level.value if isinstance(self.level, CompetitionLevel) else self.level,
            "category": self.category.value if isinstance(self.category, CompetitionCategory) else self.category,
            "register_deadline": self.register_deadline.isoformat() if self.register_deadline else None,
            "competition_date": self.competition_date.isoformat() if self.competition_date else None,
            "participants_count": self.participants_count,
            "max_participants": self.max_participants,
            "status": self.status.value if isinstance(self.status, CompetitionStatus) else self.status,
            "achievements": self.achievements,
            "description": self.description,
            "rules": self.rules,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }


class CompetitionRegistration(Base):
    """竞赛报名记录模型"""
    __tablename__ = "competition_registrations"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True, index=True)  # 可选，可能还没有学员ID
    
    # 报名信息
    student_name = Column(String(100), nullable=False)  # 学员姓名
    parent_name = Column(String(100), nullable=True)  # 家长姓名
    phone = Column(String(20), nullable=False)  # 联系电话
    grade = Column(String(50), nullable=True)  # 年级
    
    # 参赛项目
    project_name = Column(String(200), nullable=True)  # 参赛项目名称
    project_description = Column(Text, nullable=True)  # 项目描述
    
    # 状态
    registration_status = Column(String(50), default="已报名")  # 报名状态
    payment_status = Column(String(50), default="未缴费")  # 缴费状态
    
    # 成绩（赛后填写）
    award_level = Column(String(50), nullable=True)  # 获奖等级（一等奖/二等奖等）
    score = Column(Float, nullable=True)  # 得分
    
    # 时间戳
    register_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization")
    competition = relationship("Competition", back_populates="registrations")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "competition_id": self.competition_id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "parent_name": self.parent_name,
            "phone": self.phone,
            "grade": self.grade,
            "project_name": self.project_name,
            "registration_status": self.registration_status,
            "payment_status": self.payment_status,
            "award_level": self.award_level,
            "score": self.score,
            "register_time": self.register_time.isoformat() if self.register_time else None,
        }


class Certification(Base):
    """等级认证模型"""
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 认证名称
    organizer = Column(String(200), nullable=False)  # 发证机构
    certification_type = Column(String(100), nullable=False)  # 认证类型（Python编程/硬件开发/AI应用等）
    
    # 级别信息
    levels = Column(String(300), nullable=True)  # 认证级别（逗号分隔，如：一级,二级,三级）
    
    # 考试信息
    next_exam_date = Column(DateTime, nullable=True)  # 下次考试日期
    exam_location = Column(String(200), nullable=True)  # 考试地点
    
    # 统计信息
    registered_students = Column(Integer, default=0)  # 报名人数
    pass_rate = Column(Float, nullable=True)  # 历史通过率（百分比）
    
    # 费用
    exam_fee = Column(Float, nullable=True)  # 考试费用
    
    # 描述
    description = Column(Text, nullable=True)  # 认证描述
    requirements = Column(Text, nullable=True)  # 考试要求
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    organization = relationship("Organization", back_populates="certifications")
    exam_registrations = relationship("ExamRegistration", back_populates="certification", cascade="all, delete-orphan")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "organizer": self.organizer,
            "certification_type": self.certification_type,
            "levels": self.levels,
            "next_exam_date": self.next_exam_date.isoformat() if self.next_exam_date else None,
            "exam_location": self.exam_location,
            "registered_students": self.registered_students,
            "pass_rate": self.pass_rate,
            "exam_fee": self.exam_fee,
            "description": self.description,
            "requirements": self.requirements,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }


class ExamRegistration(Base):
    """考试报名记录模型"""
    __tablename__ = "exam_registrations"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    certification_id = Column(Integer, ForeignKey("certifications.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True, index=True)
    
    # 考生信息
    student_name = Column(String(100), nullable=False)  # 学员姓名
    parent_name = Column(String(100), nullable=True)  # 家长姓名
    phone = Column(String(20), nullable=False)  # 联系电话
    grade = Column(String(50), nullable=True)  # 年级
    
    # 报考信息
    exam_level = Column(String(50), nullable=False)  # 报考级别
    exam_date = Column(DateTime, nullable=True)  # 考试日期
    
    # 状态
    registration_status = Column(String(50), default="已报名")  # 报名状态
    payment_status = Column(String(50), default="未缴费")  # 缴费状态
    
    # 成绩
    exam_score = Column(Float, nullable=True)  # 考试成绩
    passed = Column(Boolean, nullable=True)  # 是否通过
    certificate_number = Column(String(100), nullable=True)  # 证书编号
    
    # 时间戳
    register_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization")
    certification = relationship("Certification", back_populates="exam_registrations")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "certification_id": self.certification_id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "parent_name": self.parent_name,
            "phone": self.phone,
            "grade": self.grade,
            "exam_level": self.exam_level,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "registration_status": self.registration_status,
            "payment_status": self.payment_status,
            "exam_score": self.exam_score,
            "passed": self.passed,
            "certificate_number": self.certificate_number,
            "register_time": self.register_time.isoformat() if self.register_time else None,
        }
