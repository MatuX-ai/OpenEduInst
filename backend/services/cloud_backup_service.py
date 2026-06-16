"""
云端自动备份服务
负责定时备份、手动备份、快照管理和一键回滚
"""

import hashlib
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from models.backup import (
    BackupSnapshot,
    BackupStatus,
    BackupType,
    RestoreOperation,
    RestoreStatus,
)
from models.license import License, LicenseStatus
from utils.database import Base, engine

logger = logging.getLogger(__name__)

# 保留策略（天）
DAILY_RETENTION_DAYS = 30
WEEKLY_RETENTION_WEEKS = 12

# 需要备份的核心表
BACKUP_TABLES = [
    "organizations", "users", "students", "enrollments",
    "courses", "schedules", "projects", "devices",
    "token_accounts", "orders", "bills", "leads",
    "tenant_configs", "tenant_feature_flags", "licenses",
    "notifications", "competitions", "resources",
]


class CloudBackupService:
    """云端自动备份服务"""

    def __init__(self, db: Session):
        self.db = db

    # ---------- 查询 ----------

    def list_snapshots(self, org_id: int, limit: int = 50) -> List[BackupSnapshot]:
        """获取组织的备份快照列表"""
        return (
            self.db.query(BackupSnapshot)
            .filter(BackupSnapshot.org_id == org_id)
            .order_by(BackupSnapshot.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_snapshot(self, snapshot_id: str) -> Optional[BackupSnapshot]:
        """根据 snapshot_id 获取快照"""
        return (
            self.db.query(BackupSnapshot)
            .filter(BackupSnapshot.snapshot_id == snapshot_id)
            .first()
        )

    def get_backup_status(self, org_id: int) -> Dict[str, Any]:
        """获取组织备份状态概览"""
        total = self.db.query(BackupSnapshot).filter(
            BackupSnapshot.org_id == org_id,
            BackupSnapshot.status == BackupStatus.COMPLETED,
        ).count()

        latest = (
            self.db.query(BackupSnapshot)
            .filter(
                BackupSnapshot.org_id == org_id,
                BackupSnapshot.status == BackupStatus.COMPLETED,
            )
            .order_by(BackupSnapshot.completed_at.desc())
            .first()
        )

        total_size = (
            self.db.query(BackupSnapshot)
            .filter(
                BackupSnapshot.org_id == org_id,
                BackupSnapshot.status == BackupStatus.COMPLETED,
            )
            .with_entities(
                __import__("sqlalchemy").func.sum(BackupSnapshot.file_size_bytes)
            )
            .scalar()
            or 0
        )

        return {
            "total_snapshots": total,
            "latest_backup": latest.completed_at.isoformat() if latest and latest.completed_at else None,
            "next_scheduled": self._calc_next_schedule(),
            "total_storage_bytes": total_size,
            "backup_enabled": self._is_backup_enabled(org_id),
        }

    # ---------- 备份执行 ----------

    def create_backup(
        self, org_id: int, backup_type: BackupType = BackupType.MANUAL, label: str | None = None
    ) -> BackupSnapshot:
        """执行一次备份（模拟实际导出逻辑，生产环境应调用 S3/MinIO）"""
        sid = f"bkp-{uuid.uuid4().hex[:16]}"
        now = datetime.utcnow()

        snapshot = BackupSnapshot(
            org_id=org_id,
            snapshot_id=sid,
            label=label or f"{'手动' if backup_type == BackupType.MANUAL else '自动'}备份 {now.strftime('%Y-%m-%d %H:%M')}",
            backup_type=backup_type,
            status=BackupStatus.IN_PROGRESS,
            started_at=now,
            tables_included=BACKUP_TABLES,
        )
        self.db.add(snapshot)
        self.db.flush()

        try:
            # --- 实际备份逻辑（模拟） ---
            # 生产环境中这里应执行：
            #   1. pg_dump 或 SELECT ... INTO OUTFILE
            #   2. 压缩 → 上传到 S3/MinIO
            #   3. 计算 SHA-256 校验和
            record_count = self._count_org_records(org_id)
            data_hash = hashlib.sha256(f"{org_id}-{now.isoformat()}".encode()).hexdigest()

            # 计算过期时间
            if backup_type == BackupType.WEEKLY_FULL:
                expires = now + timedelta(weeks=WEEKLY_RETENTION_WEEKS)
            else:
                expires = now + timedelta(days=DAILY_RETENTION_DAYS)

            snapshot.status = BackupStatus.COMPLETED
            snapshot.completed_at = datetime.utcnow()
            snapshot.file_size_bytes = record_count * 256  # 估算
            snapshot.record_count = record_count
            snapshot.checksum = data_hash
            snapshot.storage_path = f"s3://openmt-backups/{org_id}/{sid}.tar.gz"
            snapshot.expires_at = expires

            self.db.commit()
            logger.info("备份完成: org=%s snapshot=%s records=%d", org_id, sid, record_count)

        except Exception as exc:
            snapshot.status = BackupStatus.FAILED
            snapshot.error_message = str(exc)
            snapshot.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error("备份失败: org=%s error=%s", org_id, exc)

        return snapshot

    # ---------- 一键回滚 ----------

    def restore_from_snapshot(
        self, org_id: int, snapshot_id: str, initiated_by: str
    ) -> RestoreOperation:
        """从指定快照恢复数据（一键回滚）"""
        snapshot = self.get_snapshot(snapshot_id)
        if not snapshot:
            raise ValueError(f"快照不存在: {snapshot_id}")
        if snapshot.org_id != org_id:
            raise ValueError("快照不属于当前组织")
        if snapshot.status != BackupStatus.COMPLETED:
            raise ValueError(f"快照状态不允许恢复: {snapshot.status}")

        # 1. 创建安全快照（恢复前的当前状态保护）
        safety = self.create_backup(org_id, BackupType.MANUAL, label=f"回滚前安全快照 ({snapshot_id})")

        # 2. 创建恢复操作记录
        restore = RestoreOperation(
            org_id=org_id,
            snapshot_id=snapshot.id,
            status=RestoreStatus.IN_PROGRESS,
            safety_snapshot_id=safety.snapshot_id,
            initiated_by=initiated_by,
        )
        self.db.add(restore)
        self.db.flush()

        try:
            # --- 实际恢复逻辑（模拟） ---
            # 生产环境中这里应执行：
            #   1. 从 S3/MinIO 下载快照
            #   2. 校验 SHA-256
            #   3. 清空目标 Schema 数据
            #   4. 导入快照数据
            #   5. 验证数据完整性
            restore.records_restored = snapshot.record_count
            restore.status = RestoreStatus.COMPLETED
            restore.completed_at = datetime.utcnow()
            self.db.commit()
            logger.info("恢复完成: org=%s snapshot=%s by=%s", org_id, snapshot_id, initiated_by)

        except Exception as exc:
            restore.status = RestoreStatus.FAILED
            restore.error_message = str(exc)
            restore.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error("恢复失败: org=%s error=%s", org_id, exc)

        return restore

    # ---------- 过期清理 ----------

    def cleanup_expired_snapshots(self) -> int:
        """清理已过期的快照"""
        now = datetime.utcnow()
        expired = (
            self.db.query(BackupSnapshot)
            .filter(
                BackupSnapshot.expires_at < now,
                BackupSnapshot.status == BackupStatus.COMPLETED,
            )
            .all()
        )
        count = 0
        for snap in expired:
            snap.status = BackupStatus.EXPIRED
            # 生产环境应同时删除 S3 文件
            count += 1
        self.db.commit()
        logger.info("清理过期快照: %d 个", count)
        return count

    # ---------- 内部方法 ----------

    def _count_org_records(self, org_id: int) -> int:
        """统计组织关联的核心表记录数（用于估算备份大小）"""
        total = 0
        try:
            # 统计几个核心表
            from models.student import Student
            total += self.db.query(Student).filter(Student.organization_id == org_id).count()
        except Exception:
            pass
        try:
            from models.license import License
            total += self.db.query(License).filter(License.organization_id == org_id).count()
        except Exception:
            pass
        return max(total, 1)

    def _is_backup_enabled(self, org_id: int) -> bool:
        """检查组织是否开启了云备份"""
        from models.tenant import TenantConfig
        config = self.db.query(TenantConfig).filter(TenantConfig.org_id == org_id).first()
        if config and config.config_data:
            return config.config_data.get("cloud_backup_enabled", False)
        return False

    def _calc_next_schedule(self) -> str:
        """计算下一次自动备份时间（每日凌晨 02:00 UTC+8）"""
        now = datetime.utcnow() + timedelta(hours=8)  # UTC+8
        next_2am = now.replace(hour=2, minute=0, second=0, microsecond=0)
        if now >= next_2am:
            next_2am += timedelta(days=1)
        return (next_2am - timedelta(hours=8)).isoformat()  # 转回 UTC
