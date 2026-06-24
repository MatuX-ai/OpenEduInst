"""
K12 STEM 社团管理数据模型
用于管理普通 K12 学校的跨班级 STEM 社团（非学科类/兴趣类/俱乐部）

业务特征：
- 社团是 K12 STEM 教育的核心组织形式，区别于传统班级
- 学生跨班级加入社团，支持面试选拔
- 社团按学期/学年运营，包含招募、活动、考勤、评价等环节
"""

from datetime import datetime, date
from typing import Optional, List
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class ClubCategory(str, enum.Enum):
    """社团分类枚举"""
    ROBOTICS = "robotics"              # 机器人
    PROGRAMMING = "programming"        # 编程
    DRONE = "drone"                    # 无人机
    PRINTING_3D = "printing_3d"        # 3D打印
    ENGINEERING = "engineering"        # 工程搭建
    SCIENCE_EXP = "science_exp"        # 科学实验
    AI = "ai"                          # 人工智能
    MAKER = "maker"                    # 创客综合
    OTHER = "other"                    # 其他


class ClubStatus(str, enum.Enum):
    """社团状态枚举"""
    RECRUITING = "recruiting"          # 招募中
    ACTIVE = "active"                  # 运营中
    ARCHIVED = "archived"              # 已归档
    DISSOLVED = "dissolved"            # 已解散


class ClubMemberRole(str, enum.Enum):
    """社团成员角色枚举"""
    LEADER = "leader"                  # 社长/团长
    VICE_LEADER = "vice_leader"        # 副社长
    MEMBER = "member"                  # 普通成员


class ClubMemberStatus(str, enum.Enum):
    """社团成员状态枚举"""
    ACTIVE = "active"                  # 活跃
    INACTIVE = "inactive"              # 不活跃
    QUIT = "quit"                      # 已退出


class ActivityType(str, enum.Enum):
    """活动类型枚举"""
    REGULAR = "regular"                # 常规活动
    WORKSHOP = "workshop"              # 专题工作坊
    COMPETITION = "competition"        # 竞赛集训
    FIELD_TRIP = "field_trip"          # 外出参观
    SHOWCASE = "showcase"              # 成果展示
    OTHER = "other"                    # 其他


class AttendanceStatus(str, enum.Enum):
    """考勤状态枚举"""
    PRESENT = "present"                # 出勤
    ABSENT = "absent"                  # 缺勤
    LATE = "late"                      # 迟到
    EARLY_LEAVE = "early_leave"        # 早退
    EXCUSED = "excused"                # 请假


class Club(Base):
    """社团模型 - K12 STEM 核心组织单元"""

    __tablename__ = "stem_clubs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(100), nullable=False)  # 社团名称
    logo = Column(String(500))  # Logo URL
    description = Column(Text)  # 社团简介
    category = Column(Enum(ClubCategory), nullable=False)  # 社团分类
    
    # 年级适用范围（K12 特有）
    grade_range_min = Column(Integer, default=1)  # 适用最低年级（1-12）
    grade_range_max = Column(Integer, default=6)  # 适用最高年级（1-12）
    
    # 成员限制
    max_members = Column(Integer, default=30)  # 人数上限
    current_members = Column(Integer, default=0)  # 当前人数
    
    # 招募设置
    require_interview = Column(Boolean, default=False)  # 是否需要面试
    is_recruiting = Column(Boolean, default=False)  # 是否正在招募
    
    # 状态
    status = Column(Enum(ClubStatus), default=ClubStatus.RECRUITING)
    
    # 负责人（社团导师）
    leader_teacher_id = Column(Integer, nullable=True)  # 导师教师ID
    leader_teacher_name = Column(String(100))  # 导师姓名（冗余字段，方便展示）
    
    # 学期学年
    semester = Column(String(50))  # 学期，如 "2026-spring"
    school_year = Column(String(20))  # 学年，如 "2025-2026"
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    members = relationship("ClubMember", back_populates="club", cascade="all, delete-orphan")
    activities = relationship("ClubActivity", back_populates="club", cascade="all, delete-orphan")
    recruitments = relationship("ClubRecruitment", back_populates="club", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Club(id={self.id}, name='{self.name}', status='{self.status}')>"


class ClubMember(Base):
    """社团成员关联模型"""

    __tablename__ = "stem_club_members"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("stem_clubs.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 学生信息
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    student_name = Column(String(100))  # 冗余字段
    grade = Column(String(50))  # 年级（冗余字段）
    class_name = Column(String(100))  # 班级（冗余字段）
    
    # 社团角色
    role = Column(Enum(ClubMemberRole), default=ClubMemberRole.MEMBER)
    status = Column(Enum(ClubMemberStatus), default=ClubMemberStatus.ACTIVE)
    
    # 加入信息
    joined_at = Column(DateTime, default=datetime.utcnow)  # 加入日期
    quit_at = Column(DateTime)  # 退出日期
    
    # 学期评价
    evaluation_score = Column(Integer)  # 学期评分 (1-5)
    evaluation_comment = Column(Text)  # 评价内容
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    club = relationship("Club", back_populates="members")
    student = relationship("Student")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ClubMember(club_id={self.club_id}, student_id={self.student_id}, role='{self.role}')>"


class ClubActivity(Base):
    """社团活动/排课模型"""

    __tablename__ = "stem_club_activities"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("stem_clubs.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 活动基本信息
    title = Column(String(200), nullable=False)  # 活动标题
    description = Column(Text)  # 活动描述
    activity_type = Column(Enum(ActivityType), default=ActivityType.REGULAR)
    
    # 活动安排
    activity_date = Column(Date, nullable=False, index=True)  # 活动日期
    start_time = Column(String(10))  # 开始时间，如 "15:30"
    end_time = Column(String(10))  # 结束时间，如 "17:00"
    location = Column(String(200))  # 活动地点/创客空间
    
    # 导师信息
    teacher_id = Column(Integer, nullable=True)  # 带队教师
    teacher_name = Column(String(100))  # 教师名（冗余）
    
    # 参与统计
    expected_count = Column(Integer, default=0)  # 预计参与人数
    actual_count = Column(Integer, default=0)  # 实际参与人数
    
    # 状态
    is_cancelled = Column(Boolean, default=False)
    cancel_reason = Column(Text)
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    club = relationship("Club", back_populates="activities")
    organization = relationship("Organization")
    attendance_records = relationship("ClubAttendance", back_populates="activity", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ClubActivity(id={self.id}, title='{self.title}', date='{self.activity_date}')>"


class ClubAttendance(Base):
    """社团活动考勤记录模型"""

    __tablename__ = "stem_club_attendance"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("stem_club_activities.id"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("stem_clubs.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 学生信息
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    student_name = Column(String(100))  # 冗余
    
    # 考勤信息
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    check_in_time = Column(DateTime)  # 签到时间
    check_out_time = Column(DateTime)  # 签退时间
    
    # 备注
    notes = Column(Text)
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    activity = relationship("ClubActivity", back_populates="attendance_records")
    club = relationship("Club")
    student = relationship("Student")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ClubAttendance(activity_id={self.activity_id}, student_id={self.student_id})>"


class ClubRecruitment(Base):
    """社团招募公告模型"""

    __tablename__ = "stem_club_recruitments"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("stem_clubs.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 招募信息
    title = Column(String(200), nullable=False)  # 招募标题
    description = Column(Text)  # 招募详情
    requirements = Column(Text)  # 招募要求
    
    # 时间安排
    start_date = Column(Date)  # 招募开始日期
    end_date = Column(Date)  # 招募截止日期
    interview_date = Column(Date)  # 面试日期
    
    # 统计
    applicant_count = Column(Integer, default=0)  # 申请人数
    accepted_count = Column(Integer, default=0)  # 录取人数
    
    # 状态
    is_published = Column(Boolean, default=False)  # 是否已发布
    is_closed = Column(Boolean, default=False)  # 是否已结束
    
    # 系统字段
    created_by = Column(Integer, nullable=True)  # 创建人（导师）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    club = relationship("Club", back_populates="recruitments")
    organization = relationship("Organization")
    applications = relationship("ClubApplication", back_populates="recruitment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ClubRecruitment(id={self.id}, title='{self.title}')>"


class ApplicationStatus(str, enum.Enum):
    """申请状态枚举"""
    PENDING = "pending"                # 待审核
    APPROVED = "approved"              # 已通过
    REJECTED = "rejected"              # 未通过
    WAITLIST = "waitlist"              # 候补


class ClubApplication(Base):
    """社团申请记录模型"""

    __tablename__ = "stem_club_applications"

    id = Column(Integer, primary_key=True, index=True)
    recruitment_id = Column(Integer, ForeignKey("stem_club_recruitments.id"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("stem_clubs.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 申请人信息
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    student_name = Column(String(100))  # 冗余
    grade = Column(String(50))  # 年级
    class_name = Column(String(100))  # 班级
    
    # 申请信息
    reason = Column(Text)  # 申请理由
    experience = Column(Text)  # 相关经验
    guardian_phone = Column(String(20))  # 家长联系电话
    
    # 审核信息
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    review_comment = Column(Text)  # 审核意见
    reviewed_by = Column(Integer, nullable=True)  # 审核人
    reviewed_at = Column(DateTime)  # 审核时间
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    recruitment = relationship("ClubRecruitment", back_populates="applications")
    club = relationship("Club")
    student = relationship("Student")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ClubApplication(id={self.id}, student_id={self.student_id}, status='{self.status}')>"


# ============================================================
# Pydantic Schemas
# ============================================================
from pydantic import BaseModel, Field


# ----- Club -----
class ClubCreate(BaseModel):
    """创建社团的请求模型"""
    name: str = Field(..., min_length=1, max_length=100)
    logo: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    category: ClubCategory
    grade_range_min: int = Field(default=1, ge=1, le=12)
    grade_range_max: int = Field(default=6, ge=1, le=12)
    max_members: int = Field(default=30, ge=1, le=500)
    require_interview: bool = False
    leader_teacher_id: Optional[int] = None
    leader_teacher_name: Optional[str] = Field(None, max_length=100)
    semester: Optional[str] = Field(None, max_length=50)
    school_year: Optional[str] = Field(None, max_length=20)


class ClubUpdate(BaseModel):
    """更新社团的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    logo: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    category: Optional[ClubCategory] = None
    grade_range_min: Optional[int] = Field(None, ge=1, le=12)
    grade_range_max: Optional[int] = Field(None, ge=1, le=12)
    max_members: Optional[int] = Field(None, ge=1, le=500)
    require_interview: Optional[bool] = None
    is_recruiting: Optional[bool] = None
    status: Optional[ClubStatus] = None
    leader_teacher_id: Optional[int] = None
    leader_teacher_name: Optional[str] = Field(None, max_length=100)


class ClubResponse(BaseModel):
    """社团响应模型"""
    id: int
    org_id: int
    name: str
    logo: Optional[str]
    description: Optional[str]
    category: ClubCategory
    grade_range_min: int
    grade_range_max: int
    max_members: int
    current_members: int
    require_interview: bool
    is_recruiting: bool
    status: ClubStatus
    leader_teacher_id: Optional[int]
    leader_teacher_name: Optional[str]
    semester: Optional[str]
    school_year: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- ClubMember -----
class ClubMemberCreate(BaseModel):
    """添加社团成员的请求模型"""
    student_id: int
    role: ClubMemberRole = ClubMemberRole.MEMBER
    grade: Optional[str] = None
    class_name: Optional[str] = None


class ClubMemberUpdate(BaseModel):
    """更新社团成员信息的请求模型"""
    role: Optional[ClubMemberRole] = None
    status: Optional[ClubMemberStatus] = None
    evaluation_score: Optional[int] = Field(None, ge=1, le=5)
    evaluation_comment: Optional[str] = None


class ClubMemberResponse(BaseModel):
    """社团成员响应模型"""
    id: int
    club_id: int
    org_id: int
    student_id: int
    student_name: Optional[str]
    grade: Optional[str]
    class_name: Optional[str]
    role: ClubMemberRole
    status: ClubMemberStatus
    joined_at: datetime
    quit_at: Optional[datetime]
    evaluation_score: Optional[int]
    evaluation_comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- ClubActivity -----
class ClubActivityCreate(BaseModel):
    """创建社团活动的请求模型"""
    club_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    activity_type: ActivityType = ActivityType.REGULAR
    activity_date: date
    start_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    end_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    location: Optional[str] = Field(None, max_length=200)
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = Field(None, max_length=100)
    expected_count: int = 0


class ClubActivityUpdate(BaseModel):
    """更新社团活动的请求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    activity_date: Optional[date] = None
    start_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    end_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    location: Optional[str] = Field(None, max_length=200)
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = Field(None, max_length=100)
    is_cancelled: Optional[bool] = None
    cancel_reason: Optional[str] = None


class ClubActivityResponse(BaseModel):
    """社团活动响应模型"""
    id: int
    club_id: int
    org_id: int
    title: str
    description: Optional[str]
    activity_type: ActivityType
    activity_date: date
    start_time: Optional[str]
    end_time: Optional[str]
    location: Optional[str]
    teacher_id: Optional[int]
    teacher_name: Optional[str]
    expected_count: int
    actual_count: int
    is_cancelled: bool
    cancel_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- ClubAttendance -----
class ClubAttendanceCreate(BaseModel):
    """创建考勤记录的请求模型（批量）"""
    student_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class ClubAttendanceResponse(BaseModel):
    """考勤记录响应模型"""
    id: int
    activity_id: int
    club_id: int
    org_id: int
    student_id: int
    student_name: Optional[str]
    status: AttendanceStatus
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ----- ClubRecruitment -----
class ClubRecruitmentCreate(BaseModel):
    """创建招募公告的请求模型"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    requirements: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    interview_date: Optional[date] = None


class ClubRecruitmentUpdate(BaseModel):
    """更新招募公告的请求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    requirements: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    interview_date: Optional[date] = None
    is_published: Optional[bool] = None
    is_closed: Optional[bool] = None


class ClubRecruitmentResponse(BaseModel):
    """招募公告响应模型"""
    id: int
    club_id: int
    org_id: int
    title: str
    description: Optional[str]
    requirements: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    interview_date: Optional[date]
    applicant_count: int
    accepted_count: int
    is_published: bool
    is_closed: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- ClubApplication -----
class ClubApplicationCreate(BaseModel):
    """创建申请的请求模型"""
    student_id: int
    reason: Optional[str] = None
    experience: Optional[str] = None
    guardian_phone: Optional[str] = Field(None, max_length=20)


class ClubApplicationReview(BaseModel):
    """审核申请的请求模型"""
    status: ApplicationStatus
    review_comment: Optional[str] = None


class ClubApplicationResponse(BaseModel):
    """申请响应模型"""
    id: int
    recruitment_id: int
    club_id: int
    org_id: int
    student_id: int
    student_name: Optional[str]
    grade: Optional[str]
    class_name: Optional[str]
    reason: Optional[str]
    experience: Optional[str]
    guardian_phone: Optional[str]
    status: ApplicationStatus
    review_comment: Optional[str]
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- Dashboard/Stats Schemas -----
class ClubStatsResponse(BaseModel):
    """社团统计概览响应"""
    total_clubs: int
    active_clubs: int
    recruiting_clubs: int
    total_members: int
    total_activities_this_month: int
    avg_attendance_rate: float


class ClubDetailStats(BaseModel):
    """单个社团详细统计"""
    club_id: int
    club_name: str
    category: ClubCategory
    member_count: int
    activity_count_this_month: int
    attendance_rate: float
    active_member_count: int