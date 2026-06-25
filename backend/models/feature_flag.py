"""
功能屏蔽配置模型
管理系统中所有可配置的功能模块的启用/禁用状态，
支持配置历史记录与回滚，记录操作日志。
"""

from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, JSON, Text,
)
from sqlalchemy.orm import relationship

from utils.database import Base

import enum


class FeatureCategory(str, enum.Enum):
    """功能模块分类"""
    ACADEMIC = "academic"            # 教务管理
    MARKETING = "marketing"          # 招生营销
    FINANCE = "finance"              # 财务资产
    SYSTEM = "system"                # 系统设置
    STEM = "stem"                    # STEM教育
    VOCATIONAL = "vocational"        # 职业教育
    EXAM = "exam"                    # 考试管理
    COMMUNICATION = "communication"  # 沟通协作
    ASSET = "asset"                  # 资产管理
    OTHER = "other"                  # 其他


class FeatureModule(Base):
    """功能模块定义（系统预定义，不可动态增删）"""
    
    __tablename__ = "feature_modules"

    id = Column(Integer, primary_key=True, index=True)
    # 功能标识符 (例如: 'student_management', 'schedule_management')
    feature_key = Column(String(100), unique=True, nullable=False, index=True)
    # 功能显示名称
    display_name = Column(String(200), nullable=False)
    # 功能描述
    description = Column(String(500), default="")
    # 功能分类
    category = Column(String(50), nullable=False, default="other")
    # 图标（Material Icon 名称）
    icon = Column(String(50), default="settings")
    # 路由路径（关联的前端路由）
    route_path = Column(String(200), default="")
    # 排序权重
    sort_order = Column(Integer, default=0)
    # 是否默认启用
    is_enabled_by_default = Column(Boolean, default=True)
    # 适用于哪些机构类型（JSON数组，空表示适用于所有非教育局机构）
    applicable_org_types = Column(JSON, default=list)
    # 依赖的其他功能key（JSON数组，禁用此功能时自动禁用依赖项）
    dependencies = Column(JSON, default=list)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    org_flags = relationship("OrgFeatureFlag", back_populates="feature_module",
                             cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FeatureModule(key='{self.feature_key}', name='{self.display_name}')>"


class OrgFeatureFlag(Base):
    """机构功能屏蔽配置（每个机构每个功能一条记录）"""
    
    __tablename__ = "org_feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    feature_id = Column(Integer, ForeignKey("feature_modules.id"), nullable=False)
    
    # 是否启用（True=启用，False=禁用/屏蔽）
    is_enabled = Column(Boolean, default=True)
    
    # 额外配置（可选）
    extra_config = Column(JSON, default=dict)
    
    # 操作人信息
    operated_by = Column(Integer, nullable=True)       # 操作人用户ID
    operated_by_name = Column(String(100), nullable=True)  # 操作人用户名
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization", back_populates="feature_flags")
    feature_module = relationship("FeatureModule", back_populates="org_flags")

    def __repr__(self):
        return f"<OrgFeatureFlag(org_id={self.org_id}, feature_id={self.feature_id}, enabled={self.is_enabled})>"


class FeatureChangeLog(Base):
    """功能配置变更日志（用于历史记录和回滚）"""
    
    __tablename__ = "feature_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    feature_id = Column(Integer, ForeignKey("feature_modules.id"), nullable=True)
    
    # 变更类型：toggle / batch_toggle / rollback
    change_type = Column(String(50), nullable=False, default="toggle")
    
    # 变更前状态快照（JSON，记录变更前的所有配置状态）
    before_snapshot = Column(JSON, default=dict)
    # 变更后状态快照（JSON）
    after_snapshot = Column(JSON, default=dict)
    # 变更详情描述
    change_detail = Column(Text, default="")
    
    # 操作人
    operated_by = Column(Integer, nullable=True)
    operated_by_name = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    organization = relationship("Organization")

    def __repr__(self):
        return f"<FeatureChangeLog(org_id={self.org_id}, type='{self.change_type}')>"


# ==================== Pydantic Schemas ====================

from pydantic import BaseModel, Field


class FeatureModuleResponse(BaseModel):
    id: int
    feature_key: str
    display_name: str
    description: str
    category: str
    icon: str
    route_path: str
    sort_order: int
    is_enabled_by_default: bool
    applicable_org_types: List[str]
    dependencies: List[str]
    is_active: bool
    
    model_config = {"from_attributes": True}


class FeatureToggleRequest(BaseModel):
    feature_id: int
    is_enabled: bool


class BatchToggleRequest(BaseModel):
    toggles: List[FeatureToggleRequest]
    batch_note: str = ""


class OrgFeatureFlagResponse(BaseModel):
    id: int
    org_id: int
    feature_id: int
    is_enabled: bool
    extra_config: Dict[str, Any]
    operated_by: Optional[int] = None
    operated_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # 关联的功能模块信息
    feature_key: Optional[str] = None
    display_name: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    route_path: Optional[str] = None
    sort_order: Optional[int] = None
    dependencies: Optional[List[str]] = None
    
    model_config = {"from_attributes": True}


class FeatureChangeLogResponse(BaseModel):
    id: int
    org_id: int
    feature_id: Optional[int] = None
    change_type: str
    before_snapshot: Dict[str, Any]
    after_snapshot: Dict[str, Any]
    change_detail: str
    operated_by: Optional[int] = None
    operated_by_name: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class FeatureConfigResponse(BaseModel):
    """机构完整的功能配置响应"""
    modules: List[FeatureModuleResponse]
    flags: Dict[str, bool]  # feature_key -> is_enabled
    org_flags: List[OrgFeatureFlagResponse]