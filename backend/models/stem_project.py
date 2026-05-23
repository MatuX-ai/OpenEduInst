"""
STEM实验项目管理数据模型
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
    Float,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class ProjectStatus(str, enum.Enum):
    """项目状态枚举"""
    PLANNING = "planning"         # 规划中
    IN_PROGRESS = "in_progress"   # 进行中
    COMPLETED = "completed"       # 已完成
    SHOWCASE = "showcase"         # 展示中
    ARCHIVED = "archived"         # 已归档


class ProjectCategory(str, enum.Enum):
    """项目分类枚举"""
    ARDUINO = "arduino"           # Arduino项目
    IOT = "iot"                   # 物联网项目
    ROBOTICS = "robotics"         # 机器人项目
    AI_ML = "ai_ml"              # 人工智能/机器学习
    WEB_DEV = "web_dev"          # Web开发
    MOBILE_DEV = "mobile_dev"    # 移动开发
    GAME_DEV = "game_dev"        # 游戏开发
    DATA_SCIENCE = "data_science" # 数据科学
    OTHER = "other"               # 其他


class ProjectDifficulty(str, enum.Enum):
    """项目难度枚举"""
    BEGINNER = "beginner"         # 初级
    INTERMEDIATE = "intermediate" # 中级
    ADVANCED = "advanced"         # 高级


class STEMProject(Base):
    """STEM实验项目模型"""

    __tablename__ = "stem_projects"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 项目基本信息
    name = Column(String(200), nullable=False)  # 项目名称
    description = Column(Text)  # 项目描述
    category = Column(Enum(ProjectCategory), nullable=False)  # 项目分类
    difficulty = Column(Enum(ProjectDifficulty), default=ProjectDifficulty.BEGINNER)  # 难度等级
    
    # 项目状态
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    start_date = Column(DateTime)  # 开始日期
    end_date = Column(DateTime)  # 结束日期
    estimated_hours = Column(Integer)  # 预计工时（小时）
    actual_hours = Column(Integer, default=0)  # 实际工时（小时）
    
    # 进度信息
    progress_percentage = Column(Integer, default=0)  # 完成百分比 (0-100)
    
    # 人员信息
    mentor_id = Column(Integer, nullable=True)  # 导师ID（暂时移除外键）
    max_students = Column(Integer, default=10)  # 最大学生数
    current_students = Column(Integer, default=0)  # 当前学生数
    
    # 技术栈
    technologies = Column(Text)  # 使用的技术列表（JSON格式）
    required_equipment = Column(Text)  # 所需设备清单（JSON格式）
    
    # 成果展示
    showcase_url = Column(String(500))  # 展示链接
    demo_video_url = Column(String(500))  # 演示视频链接
    documentation_url = Column(String(500))  # 文档链接
    
    # 评估信息
    evaluation_score = Column(Float)  # 评估分数
    evaluation_comments = Column(Text)  # 评估评语
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    notes = Column(Text)  # 备注
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    # mentor = relationship("User", foreign_keys=[mentor_id])  # 暂时注释
    students = relationship("ProjectStudent", back_populates="project")
    milestones = relationship("ProjectMilestone", back_populates="project")
    resources = relationship("ProjectResource", back_populates="project")
    
    def __repr__(self):
        return f"<STEMProject(id={self.id}, name='{self.name}', status='{self.status}')>"


class ProjectStudent(Base):
    """项目学生关联模型"""

    __tablename__ = "project_students"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("stem_projects.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 参与信息
    role = Column(String(50), default="member")  # 角色（leader/member）
    join_date = Column(DateTime, default=datetime.utcnow)  # 加入日期
    contribution_hours = Column(Integer, default=0)  # 贡献工时
    
    # 表现评估
    performance_score = Column(Float)  # 表现分数
    performance_comments = Column(Text)  # 表现评语
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    project = relationship("STEMProject", back_populates="students")
    student = relationship("Student")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ProjectStudent(project_id={self.project_id}, student_id={self.student_id})>"


class MilestoneStatus(str, enum.Enum):
    """里程碑状态枚举"""
    PENDING = "pending"           # 待开始
    IN_PROGRESS = "in_progress"   # 进行中
    COMPLETED = "completed"       # 已完成
    DELAYED = "delayed"           # 延迟


class ProjectMilestone(Base):
    """项目里程碑模型"""

    __tablename__ = "project_milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("stem_projects.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 里程碑信息
    title = Column(String(200), nullable=False)  # 里程碑标题
    description = Column(Text)  # 里程碑描述
    status = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    
    # 时间信息
    planned_date = Column(DateTime)  # 计划日期
    actual_date = Column(DateTime)  # 实际完成日期
    
    # 进度信息
    completion_percentage = Column(Integer, default=0)  # 完成百分比
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    project = relationship("STEMProject", back_populates="milestones")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ProjectMilestone(id={self.id}, title='{self.title}')>"


class ResourceType(str, enum.Enum):
    """资源类型枚举"""
    DOCUMENT = "document"         # 文档
    CODE = "code"                 # 代码
    VIDEO = "video"               # 视频
    IMAGE = "image"               # 图片
    LINK = "link"                 # 链接
    OTHER = "other"               # 其他


class ProjectResource(Base):
    """项目资源模型"""

    __tablename__ = "project_resources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("stem_projects.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 资源信息
    name = Column(String(200), nullable=False)  # 资源名称
    description = Column(Text)  # 资源描述
    resource_type = Column(Enum(ResourceType), nullable=False)
    url = Column(String(500))  # 资源URL
    file_path = Column(String(500))  # 文件路径（如果是本地文件）
    
    # 元数据
    file_size = Column(Integer)  # 文件大小（字节）
    mime_type = Column(String(100))  # MIME类型
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)  # 创建者（暂时移除外键）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    project = relationship("STEMProject", back_populates="resources")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ProjectResource(id={self.id}, name='{self.name}')>"


# Pydantic Schemas
from pydantic import BaseModel, Field


class STEMProjectCreate(BaseModel):
    """创建项目的请求模型"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: ProjectCategory
    difficulty: ProjectDifficulty = ProjectDifficulty.BEGINNER
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    mentor_id: Optional[int] = None
    max_students: int = Field(default=10, ge=1, le=100)
    technologies: Optional[List[str]] = None
    required_equipment: Optional[List[str]] = None
    notes: Optional[str] = None


class STEMProjectUpdate(BaseModel):
    """更新项目的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    end_date: Optional[datetime] = None
    actual_hours: Optional[int] = None
    mentor_id: Optional[int] = None
    showcase_url: Optional[str] = Field(None, max_length=500)
    demo_video_url: Optional[str] = Field(None, max_length=500)
    documentation_url: Optional[str] = Field(None, max_length=500)
    evaluation_score: Optional[float] = Field(None, ge=0, le=100)
    evaluation_comments: Optional[str] = None
    notes: Optional[str] = None


class STEMProjectResponse(BaseModel):
    """项目响应模型"""
    id: int
    org_id: int
    name: str
    description: Optional[str]
    category: ProjectCategory
    difficulty: ProjectDifficulty
    status: ProjectStatus
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    estimated_hours: Optional[int]
    actual_hours: int
    progress_percentage: int
    mentor_id: Optional[int]
    max_students: int
    current_students: int
    technologies: Optional[List[str]]
    required_equipment: Optional[List[str]]
    showcase_url: Optional[str]
    demo_video_url: Optional[str]
    documentation_url: Optional[str]
    evaluation_score: Optional[float]
    evaluation_comments: Optional[str]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProjectStudentCreate(BaseModel):
    """添加学生到项目的请求模型"""
    student_id: int
    role: str = Field(default="member", max_length=50)


class ProjectStudentResponse(BaseModel):
    """项目学生响应模型"""
    id: int
    project_id: int
    student_id: int
    org_id: int
    role: str
    join_date: datetime
    contribution_hours: int
    performance_score: Optional[float]
    performance_comments: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProjectMilestoneCreate(BaseModel):
    """创建里程碑的请求模型"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    planned_date: Optional[datetime] = None


class ProjectMilestoneResponse(BaseModel):
    """里程碑响应模型"""
    id: int
    project_id: int
    org_id: int
    title: str
    description: Optional[str]
    status: MilestoneStatus
    planned_date: Optional[datetime]
    actual_date: Optional[datetime]
    completion_percentage: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProjectResourceCreate(BaseModel):
    """创建项目资源的请求模型"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    resource_type: ResourceType
    url: Optional[str] = Field(None, max_length=500)
    file_path: Optional[str] = Field(None, max_length=500)


class ProjectResourceResponse(BaseModel):
    """项目资源响应模型"""
    id: int
    project_id: int
    org_id: int
    name: str
    description: Optional[str]
    resource_type: ResourceType
    url: Optional[str]
    file_path: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True