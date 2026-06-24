"""
职业学校 - 技能评估体系 数据模型
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


# ==================== 技能评估 ====================


class VocSkillStandard(Base):
    """技能标准库"""
    __tablename__ = "voc_skill_standards"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    major = Column(String(100))  # 适用专业
    skill_name = Column(String(200), nullable=False)
    skill_level = Column(String(50), default="intermediate")  # beginner/intermediate/advanced
    description = Column(Text)
    assessment_criteria = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VocSkillAssessment(Base):
    """技能考核记录"""
    __tablename__ = "voc_skill_assessments"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String(100))
    skill_id = Column(Integer, ForeignKey("voc_skill_standards.id"), nullable=False)
    score = Column(Float)  # 百分制
    comment = Column(Text)
    evaluator_id = Column(Integer)
    evaluator_name = Column(String(100))
    assessment_date = Column(Date, default=date.today)
    evidence_urls = Column(JSON)  # 佐证照片/视频
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("VocSkillStandard")


class VocCertificate(Base):
    """技能证书"""
    __tablename__ = "voc_certificates"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String(100))
    cert_name = Column(String(200))
    cert_number = Column(String(200))
    cert_level = Column(String(100))
    issuing_authority = Column(String(200))
    issue_date = Column(Date)
    expire_date = Column(Date)
    cert_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== Pydantic Schemas ====================

from typing import Optional as Opt
from pydantic import BaseModel, Field


class VocSkillStandardCreate(BaseModel):
    major: str
    skill_name: str
    skill_level: str = "intermediate"
    description: Opt[str] = None
    assessment_criteria: Opt[str] = None


class VocAssessmentCreate(BaseModel):
    student_id: int
    student_name: str
    skill_id: int
    score: float
    comment: Opt[str] = None
    evaluator_id: int
    evaluator_name: str
    evidence_urls: Opt[list] = None


class VocCertificateCreate(BaseModel):
    student_id: int
    student_name: str
    cert_name: str
    cert_number: Opt[str] = None
    cert_level: Opt[str] = None
    issuing_authority: Opt[str] = None
    issue_date: Opt[date] = None
    expire_date: Opt[date] = None
    cert_url: Opt[str] = None


class VocStudentSkillProfile(BaseModel):
    student_id: int
    student_name: str
    assessments: list = []
    certificates: list = []
    avg_score: float = 0.0
    skill_count: int = 0

    model_config = {"from_attributes": True}