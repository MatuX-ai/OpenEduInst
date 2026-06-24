"""
职业学校 - 校企合作管理 + 实习就业跟踪 + 双创孵化 数据模型
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


# ==================== 校企合作 ====================


class VocEnterprise(Base):
    """合作企业"""
    __tablename__ = "voc_enterprises"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    industry = Column(String(100))
    scale = Column(String(50), default="medium")
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    cooperation_start = Column(Date)
    cooperation_end = Column(Date)
    status = Column(String(20), default="active")  # active/expired/terminated
    description = Column(Text)
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("VocCooperationProject", back_populates="enterprise")
    demands = relationship("VocEnterpriseDemand", back_populates="enterprise")


class VocEnterpriseDemand(Base):
    """企业需求"""
    __tablename__ = "voc_enterprise_demands"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("voc_enterprises.id"), nullable=False)
    demand_type = Column(String(50))  # tech/talent/equipment
    title = Column(String(200))
    description = Column(Text)
    status = Column(String(20), default="pending")  # pending/matching/in_progress/resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    enterprise = relationship("VocEnterprise", back_populates="demands")


class VocCooperationProject(Base):
    """校企联合项目"""
    __tablename__ = "voc_cooperation_projects"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("voc_enterprises.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    tech_field = Column(String(100))
    stage = Column(String(50), default="requirement")  # requirement/design/prototype/testing/trial/delivered
    progress = Column(Integer, default=0)
    school_supervisor = Column(String(100))
    enterprise_supervisor = Column(String(100))
    start_date = Column(Date)
    expected_end = Column(Date)
    total_funding = Column(Float, default=0.0)
    status = Column(String(20), default="active")  # active/completed/suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    enterprise = relationship("VocEnterprise", back_populates="projects")
    milestones = relationship("VocProjectMilestone", back_populates="project")


class VocProjectMilestone(Base):
    """项目里程碑"""
    __tablename__ = "voc_project_milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("voc_cooperation_projects.id"), nullable=False)
    name = Column(String(200))
    description = Column(Text)
    deadline = Column(Date)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    deliverable = Column(Text)

    project = relationship("VocCooperationProject", back_populates="milestones")


# ==================== 技能竞赛 ====================


class VocCompetition(Base):
    """竞赛"""
    __tablename__ = "voc_competitions"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    sub_title = Column(String(200))
    level = Column(String(50))  # national/provincial/city/county/industry
    organizer = Column(String(200))
    competition_date = Column(Date)
    registration_deadline = Column(Date)
    location = Column(String(200))
    entry_fee = Column(Float, default=0.0)
    status = Column(String(20), default="registration")  # registration/training/ongoing/ended
    created_at = Column(DateTime, default=datetime.utcnow)

    registrations = relationship("VocCompetitionRegistration", back_populates="competition")


class VocCompetitionRegistration(Base):
    """竞赛报名"""
    __tablename__ = "voc_competition_registrations"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("voc_competitions.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, nullable=False)
    student_name = Column(String(100))
    teacher_id = Column(Integer)
    teacher_name = Column(String(100))
    status = Column(String(20), default="registered")  # registered/confirmed/paid/withdrawn
    award_level = Column(String(50))
    award_cert_url = Column(String(500))
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    competition = relationship("VocCompetition", back_populates="registrations")


# ==================== 实习就业 ====================


class VocInternshipPosition(Base):
    """实习岗位"""
    __tablename__ = "voc_internship_positions"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("voc_enterprises.id"), nullable=False)
    title = Column(String(200))
    headcount = Column(Integer, default=1)
    skill_requirements = Column(Text)
    salary = Column(String(200))
    location = Column(String(200))
    duration_months = Column(Integer, default=3)
    status = Column(String(20), default="open")  # open/closed
    created_at = Column(DateTime, default=datetime.utcnow)


class VocInternshipRecord(Base):
    """实习记录"""
    __tablename__ = "voc_internship_records"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String(100))
    enterprise_id = Column(Integer, ForeignKey("voc_enterprises.id"), nullable=False)
    position = Column(String(100))
    supervisor_teacher = Column(String(100))
    enterprise_mentor = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    weekly_report_count = Column(Integer, default=0)
    evaluation = Column(Text)
    score = Column(Float)
    status = Column(String(20), default="ongoing")  # ongoing/completed/terminated
    created_at = Column(DateTime, default=datetime.utcnow)


class VocEmploymentRecord(Base):
    """就业记录"""
    __tablename__ = "voc_employment_records"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String(100))
    enterprise_id = Column(Integer, ForeignKey("voc_enterprises.id"), nullable=False)
    position = Column(String(100))
    salary = Column(Float)
    location = Column(String(200))
    employment_date = Column(Date)
    follow_up_1m = Column(Text)
    follow_up_3m = Column(Text)
    follow_up_6m = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== 双创孵化 ====================


class VocIncubatorProject(Base):
    """双创孵化项目"""
    __tablename__ = "voc_incubator_projects"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    team_name = Column(String(100))
    leader_id = Column(Integer)
    leader_name = Column(String(100))
    description = Column(Text)
    pain_point = Column(Text)
    tech_solution = Column(Text)
    stage = Column(String(50), default="idea")  # idea/prototype/testing/market
    progress = Column(Integer, default=0)
    mentor_id = Column(Integer)
    mentor_name = Column(String(100))
    total_funding = Column(Float, default=0.0)
    funding_source = Column(String(200))
    patent_applied = Column(Boolean, default=False)
    patent_number = Column(String(100))
    market_status = Column(String(200))
    status = Column(String(20), default="active")  # active/completed/suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("VocIncubatorMember", back_populates="project")


class VocIncubatorMember(Base):
    """孵化项目成员"""
    __tablename__ = "voc_incubator_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("voc_incubator_projects.id"), nullable=False)
    student_id = Column(Integer)
    student_name = Column(String(100))
    role = Column(String(50), default="member")  # leader/member
    contribution = Column(Integer, default=0)

    project = relationship("VocIncubatorProject", back_populates="members")


# ==================== Pydantic Schemas ====================

from typing import Optional as Opt
from pydantic import BaseModel, Field


class VocEnterpriseCreate(BaseModel):
    name: str
    industry: Opt[str] = None
    scale: str = "medium"
    contact_person: Opt[str] = None
    contact_phone: Opt[str] = None
    description: Opt[str] = None


class VocEnterpriseResponse(BaseModel):
    id: int
    name: str
    industry: Opt[str] = None
    scale: Opt[str] = None
    contact_person: Opt[str] = None
    contact_phone: Opt[str] = None
    status: str = "active"
    cooperation_start: Opt[date] = None
    description: Opt[str] = None
    model_config = {"from_attributes": True}


class VocCoopProjectCreate(BaseModel):
    enterprise_id: int
    name: str
    description: Opt[str] = None
    tech_field: Opt[str] = None
    school_supervisor: Opt[str] = None
    enterprise_supervisor: Opt[str] = None
    start_date: Opt[date] = None
    expected_end: Opt[date] = None
    total_funding: float = 0.0


class VocIncubatorCreate(BaseModel):
    name: str
    team_name: Opt[str] = None
    leader_id: int
    leader_name: str
    description: str
    pain_point: Opt[str] = None
    tech_solution: Opt[str] = None
    mentor_id: Opt[int] = None
    mentor_name: Opt[str] = None


class VocCompetitionCreate(BaseModel):
    name: str
    sub_title: Opt[str] = None
    level: str = "provincial"
    organizer: Opt[str] = None
    competition_date: Opt[date] = None
    registration_deadline: Opt[date] = None
    location: Opt[str] = None
    entry_fee: float = 0.0


class VocInternshipCreate(BaseModel):
    student_id: int
    student_name: str
    enterprise_id: int
    position: str
    supervisor_teacher: Opt[str] = None
    enterprise_mentor: Opt[str] = None
    start_date: Opt[date] = None
    end_date: Opt[date] = None


class VocEmploymentCreate(BaseModel):
    student_id: int
    student_name: str
    enterprise_id: int
    position: str
    salary: Opt[float] = None
    location: Opt[str] = None
    employment_date: Opt[date] = None


class VocCooperationStats(BaseModel):
    total_enterprises: int = 0
    active_projects: int = 0
    total_internships: int = 0
    employment_rate: str = "0%"
    incubator_projects: int = 0

    model_config = {"from_attributes": True}