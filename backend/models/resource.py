"""
教学资源数据模型
用于管理STEM培训机构的课件、代码、视频等教学资源
"""

from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship

from utils.database import Base


class ResourceType(enum.Enum):
    """资源类型枚举"""
    COURSEWARE = "课件"
    EXPERIMENT_MANUAL = "实验手册"
    VIDEO = "视频"
    CODE = "代码"
    PROJECT_DOC = "项目文档"


class ResourceFormat(enum.Enum):
    """资源格式枚举"""
    PPT = "PPT"
    PDF = "PDF"
    MP4 = "MP4"
    ZIP = "ZIP"
    PY = "PY"
    INO = "INO"
    DOCX = "DOCX"


class TeachingResource(Base):
    """教学资源模型"""
    __tablename__ = "teaching_resources"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 资源名称
    description = Column(Text, nullable=True)  # 资源描述
    
    # 分类信息
    category = Column(String(100), nullable=False, index=True)  # 资源类别（如：Arduino课件库、Python编程资源）
    resource_type = Column(Enum(ResourceType), nullable=False)  # 资源类型
    format = Column(Enum(ResourceFormat), nullable=False)  # 文件格式
    
    # 文件信息
    file_size = Column(Float, nullable=True)  # 文件大小（MB）
    file_path = Column(String(500), nullable=True)  # 文件存储路径
    download_count = Column(Integer, default=0)  # 下载次数
    
    # 元数据
    tags = Column(String(300), nullable=True)  # 标签（逗号分隔）
    difficulty_level = Column(String(50), nullable=True)  # 难度等级（初级/中级/高级）
    
    # 时间信息
    upload_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_download_time = Column(DateTime, nullable=True)
    
    # 关联
    organization = relationship("Organization", back_populates="teaching_resources")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "resource_type": self.resource_type.value if isinstance(self.resource_type, ResourceType) else self.resource_type,
            "format": self.format.value if isinstance(self.format, ResourceFormat) else self.format,
            "file_size": self.file_size,
            "file_path": self.file_path,
            "download_count": self.download_count,
            "tags": self.tags,
            "difficulty_level": self.difficulty_level,
            "upload_time": self.upload_time.isoformat() if self.upload_time else None,
            "last_download_time": self.last_download_time.isoformat() if self.last_download_time else None,
        }


class ResourceCategory(Base):
    """资源分类模型"""
    __tablename__ = "resource_categories"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 分类信息
    name = Column(String(100), nullable=False, unique=True)  # 分类名称
    icon = Column(String(20), nullable=True)  # 图标emoji
    description = Column(String(300), nullable=True)  # 分类描述
    sort_order = Column(Integer, default=0)  # 排序顺序
    
    # 统计信息
    resource_count = Column(Integer, default=0)  # 资源数量
    
    # 时间信息
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "icon": self.icon,
            "description": self.description,
            "sort_order": self.sort_order,
            "resource_count": self.resource_count,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }
