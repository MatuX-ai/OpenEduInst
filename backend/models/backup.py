"""
云端自动备份数据模型
存储备份快照元数据、恢复操作记录
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
    JSON,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class BackupType(str, enum.Enum):
    """备份类型"""
    DAILY_INCREMENTAL = "daily_incremental"      # 每日增量备份
    WEEKLY_FULL = "weekly_full"                   # 每周全量备份
    MANUAL = "manual"                             # 手动备份


class BackupStatus(str, enum.Enum):
    """备份状态"""
    PENDING = "pending"        # 等待执行
    IN_PROGRESS = "in_progress"  # 执行中
    COMPLETED = "completed"    # 完成
    FAILED = "failed"          # 失败
    EXPIRED = "expired"        # 已过期（超出保留期）


class RestoreStatus(str, enum.Enum):
    """恢复状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class BackupSnapshot(Base):
    """备份快照元数据"""

    __tablename__ = "backup_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # 快照标识
    snapshot_id = Column(String(100), unique=True, nullable=False, index=True)
    label = Column(String(255), nullable=True)  # 人类可读的标签

    # 备份类型与状态
    backup_type = Column(Enum(BackupType), nullable=False)
    status = Column(Enum(BackupStatus), default=BackupStatus.PENDING)

    # 存储信息
    storage_path = Column(Text, nullable=True)  # S3/MinIO 路径
    file_size_bytes = Column(BigInteger, default=0)
    checksum = Column(String(64), nullable=True)  # SHA-256 校验和

    # 备份范围描述
    tables_included = Column(JSON, default=list)  # 包含的表名列表
    record_count = Column(Integer, default=0)  # 总记录数

    # 时间信息
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # 过期时间（基于保留策略）

    # 错误信息
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    restore_operations = relationship("RestoreOperation", back_populates="snapshot")

    def __repr__(self):
        return f"<BackupSnapshot(id={self.id}, org={self.org_id}, type={self.backup_type}, status={self.status})>"


class RestoreOperation(Base):
    """恢复操作记录"""

    __tablename__ = "restore_operations"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    snapshot_id = Column(Integer, ForeignKey("backup_snapshots.id"), nullable=False)

    # 恢复状态
    status = Column(Enum(RestoreStatus), default=RestoreStatus.PENDING)

    # 恢复前自动创建安全快照
    safety_snapshot_id = Column(String(100), nullable=True)

    # 操作人
    initiated_by = Column(String(100), nullable=True)  # 用户名
    initiated_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # 恢复结果
    records_restored = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    # 关系
    snapshot = relationship("BackupSnapshot", back_populates="restore_operations")

    def __repr__(self):
        return f"<RestoreOperation(id={self.id}, org={self.org_id}, status={self.status})>"
