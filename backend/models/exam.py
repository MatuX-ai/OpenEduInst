"""
考试管理数据模型
用于管理题库、试卷、考试任务和考试结果
模块代码：EXAM
"""

import logging
from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean, JSON
from sqlalchemy.orm import relationship

from utils.database import Base

logger = logging.getLogger(__name__)


class QuestionType(enum.Enum):
    """题型枚举"""
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    CODING = "coding"


class QuestionDifficulty(enum.Enum):
    """难度枚举"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class QuestionBankSource(enum.Enum):
    """题库来源枚举"""
    EXTERNAL = "external"
    LOCAL = "local"


class QuestionStatus(enum.Enum):
    """试题状态"""
    ACTIVE = "active"
    ARCHIVED = "archived"


class ExamPaperStatus(enum.Enum):
    """试卷状态"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ExamMode(enum.Enum):
    """考试模式"""
    ONLINE = "online"
    OFFLINE = "offline"


class ExamTaskStatus(enum.Enum):
    """考试任务状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ENDED = "ended"


class ExamResultStatus(enum.Enum):
    """考试结果状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class SubmitType(enum.Enum):
    """提交方式"""
    ONLINE = "online"
    UPLOAD = "upload"
    MANUAL = "manual"


# ==================== 题库表 ====================

class QuestionBank(Base):
    """题库模型"""
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(200), nullable=False)
    source = Column(Enum(QuestionBankSource), default=QuestionBankSource.LOCAL, nullable=False)
    source_url = Column(String(500), nullable=True)
    subject = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    question_count = Column(Integer, default=0)
    last_sync_at = Column(DateTime, nullable=True)

    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship("Question", back_populates="bank", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "org_id": self.org_id,
                "name": self.name,
                "source": self.source.value if isinstance(self.source, QuestionBankSource) else self.source,
                "source_url": self.source_url,
                "subject": self.subject,
                "description": self.description,
                "question_count": self.question_count,
                "last_sync_at": self.last_sync_at.isoformat() if self.last_sync_at else None,
                "create_time": self.create_time.isoformat() if self.create_time else None,
                "update_time": self.update_time.isoformat() if self.update_time else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] QuestionBank.to_dict() 异常 | bank_id=%s | error=%s", self.id, str(e))
            raise


# ==================== 试题表 ====================

class Question(Base):
    """试题模型"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("question_banks.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    external_id = Column(String(100), nullable=True, index=True)
    type = Column(Enum(QuestionType), nullable=False)
    difficulty = Column(Enum(QuestionDifficulty), default=QuestionDifficulty.MEDIUM, nullable=False)
    subject = Column(String(100), nullable=True, index=True)
    content = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)
    answer = Column(Text, nullable=True)
    answer_analysis = Column(Text, nullable=True)
    score = Column(Float, default=5.0)
    tags = Column(JSON, nullable=True)
    status = Column(Enum(QuestionStatus), default=QuestionStatus.ACTIVE, nullable=False)

    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bank = relationship("QuestionBank", back_populates="questions")
    paper_questions = relationship("PaperQuestion", back_populates="question", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "bank_id": self.bank_id,
                "org_id": self.org_id,
                "external_id": self.external_id,
                "type": self.type.value if isinstance(self.type, QuestionType) else self.type,
                "difficulty": self.difficulty.value if isinstance(self.difficulty, QuestionDifficulty) else self.difficulty,
                "subject": self.subject,
                "content": self.content,
                "options": self.options,
                "answer": self.answer,
                "answer_analysis": self.answer_analysis,
                "score": self.score,
                "tags": self.tags,
                "status": self.status.value if isinstance(self.status, QuestionStatus) else self.status,
                "create_time": self.create_time.isoformat() if self.create_time else None,
                "update_time": self.update_time.isoformat() if self.update_time else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] Question.to_dict() 异常 | question_id=%s | error=%s", self.id, str(e))
            raise


# ==================== 试卷表 ====================

class ExamPaper(Base):
    """试卷模型"""
    __tablename__ = "exam_papers"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    total_score = Column(Float, default=100.0)
    duration = Column(Integer, default=60)
    status = Column(Enum(ExamPaperStatus), default=ExamPaperStatus.DRAFT, nullable=False)
    format_settings = Column(JSON, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    paper_questions = relationship("PaperQuestion", back_populates="paper", cascade="all, delete-orphan")
    exam_tasks = relationship("ExamTask", back_populates="paper")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "org_id": self.org_id,
                "title": self.title,
                "description": self.description,
                "total_score": self.total_score,
                "duration": self.duration,
                "status": self.status.value if isinstance(self.status, ExamPaperStatus) else self.status,
                "format_settings": self.format_settings,
                "created_by": self.created_by,
                "create_time": self.create_time.isoformat() if self.create_time else None,
                "update_time": self.update_time.isoformat() if self.update_time else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] ExamPaper.to_dict() 异常 | paper_id=%s | error=%s", self.id, str(e))
            raise


# ==================== 试卷-试题关联表 ====================

class PaperQuestion(Base):
    """试卷-试题关联模型"""
    __tablename__ = "paper_questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("exam_papers.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)

    order_no = Column(Integer, nullable=False)
    score = Column(Float, default=5.0)
    section = Column(String(50), nullable=True)

    paper = relationship("ExamPaper", back_populates="paper_questions")
    question = relationship("Question", back_populates="paper_questions")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "paper_id": self.paper_id,
                "question_id": self.question_id,
                "order_no": self.order_no,
                "score": self.score,
                "section": self.section,
                "question": self.question.to_dict() if self.question else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] PaperQuestion.to_dict() 异常 | pq_id=%s | error=%s", self.id, str(e))
            raise


# ==================== 考试任务表 ====================

class ExamTask(Base):
    """考试任务模型"""
    __tablename__ = "exam_tasks"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey("exam_papers.id"), nullable=False, index=True)

    title = Column(String(200), nullable=False)
    mode = Column(Enum(ExamMode), default=ExamMode.ONLINE, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration = Column(Integer, default=60)
    student_ids = Column(JSON, nullable=True)
    class_ids = Column(JSON, nullable=True)
    submit_type = Column(Enum(SubmitType), default=SubmitType.ONLINE, nullable=False)
    status = Column(Enum(ExamTaskStatus), default=ExamTaskStatus.PENDING, nullable=False)
    auto_grade = Column(Boolean, default=True)
    allow_late = Column(Boolean, default=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    paper = relationship("ExamPaper", back_populates="exam_tasks")
    results = relationship("ExamResult", back_populates="exam_task", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "org_id": self.org_id,
                "paper_id": self.paper_id,
                "title": self.title,
                "mode": self.mode.value if isinstance(self.mode, ExamMode) else self.mode,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "end_time": self.end_time.isoformat() if self.end_time else None,
                "duration": self.duration,
                "student_ids": self.student_ids,
                "class_ids": self.class_ids,
                "submit_type": self.submit_type.value if isinstance(self.submit_type, SubmitType) else self.submit_type,
                "status": self.status.value if isinstance(self.status, ExamTaskStatus) else self.status,
                "auto_grade": self.auto_grade,
                "allow_late": self.allow_late,
                "created_by": self.created_by,
                "create_time": self.create_time.isoformat() if self.create_time else None,
                "update_time": self.update_time.isoformat() if self.update_time else None,
                "paper": self.paper.to_dict() if self.paper else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] ExamTask.to_dict() 异常 | task_id=%s | error=%s", self.id, str(e))
            raise


# ==================== 考试结果表 ====================

class ExamResult(Base):
    """考试结果模型"""
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exam_tasks.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    answers = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    objective_score = Column(Float, nullable=True)
    subjective_score = Column(Float, nullable=True)
    start_time = Column(DateTime, nullable=True)
    submit_time = Column(DateTime, nullable=True)
    status = Column(Enum(ExamResultStatus), default=ExamResultStatus.PENDING, nullable=False)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)
    feedback = Column(Text, nullable=True)

    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    exam_task = relationship("ExamTask", back_populates="results")

    def to_dict(self):
        try:
            return {
                "id": self.id,
                "exam_id": self.exam_id,
                "student_id": self.student_id,
                "org_id": self.org_id,
                "answers": self.answers,
                "score": self.score,
                "objective_score": self.objective_score,
                "subjective_score": self.subjective_score,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "submit_time": self.submit_time.isoformat() if self.submit_time else None,
                "status": self.status.value if isinstance(self.status, ExamResultStatus) else self.status,
                "graded_by": self.graded_by,
                "graded_at": self.graded_at.isoformat() if self.graded_at else None,
                "feedback": self.feedback,
                "create_time": self.create_time.isoformat() if self.create_time else None,
            }
        except Exception as e:
            logger.warning("[EXAM-MODEL] ExamResult.to_dict() 异常 | result_id=%s | error=%s", self.id, str(e))
            raise