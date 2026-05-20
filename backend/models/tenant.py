"""
多租户配置与功能开关模型
支持根据不同组织类型（培训机构、K12、职校、教育局）定制功能模块和业务配置
"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    JSON,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class TenantConfig(Base):
    """租户业务配置模型
    
    存储不同组织类型的特定业务参数，例如：
    - 培训机构的课时单价、续费周期
    - K12学校的学期设置、班级容量限制
    - 职业学校的实训设备管理规则
    - 教育局的数据上报频率
    """

    __tablename__ = "tenant_configs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, unique=True, index=True)
    
    # 配置内容 (JSON格式，灵活存储各类业务参数)
    config_data = Column(JSON, default=dict)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization", back_populates="configs")

    def __repr__(self):
        return f"<TenantConfig(org_id={self.org_id})>"


class TenantFeatureFlag(Base):
    """租户功能开关模型
    
    控制不同组织类型可见的功能模块，例如：
    - 培训机构：开启“招生线索”、“直播授课”
    - K12学校：开启“家校互动”、“学籍管理”
    - 教育局：开启“辖区统计”、“安全预警”，关闭“排课”
    """

    __tablename__ = "tenant_feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 功能标识符 (例如: 'admissions', 'live_streaming', 'home_school_comm')
    feature_key = Column(String(100), nullable=False, index=True)
    
    # 是否启用
    is_enabled = Column(Boolean, default=True)
    
    # 额外配置 (可选，如功能的子项配置)
    extra_config = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization", back_populates="feature_flags")

    def __repr__(self):
        return f"<TenantFeatureFlag(org_id={self.org_id}, key='{self.feature_key}')>"


# Pydantic Schemas
from pydantic import BaseModel, Field


class TenantConfigCreate(BaseModel):
    org_id: int
    config_data: Dict[str, Any] = Field(default_factory=dict)


class TenantConfigResponse(BaseModel):
    id: int
    org_id: int
    config_data: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TenantFeatureFlagCreate(BaseModel):
    org_id: int
    feature_key: str
    is_enabled: bool = True
    extra_config: Dict[str, Any] = Field(default_factory=dict)


class TenantFeatureFlagResponse(BaseModel):
    id: int
    org_id: int
    feature_key: str
    is_enabled: bool
    extra_config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
