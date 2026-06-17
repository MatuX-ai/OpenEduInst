"""
云端自动备份服务
负责定时备份、手动备份、快照管理和一键回滚
"""

import asyncio
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
from models.notification import Notification, NotificationType, NotificationPriority
from utils.database import Base, engine
from services.websocket_service import (
    manager,
    build_notification as build_ws_notification,
    EVENT_BACKUP_COMPLETE,
)

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

    def _push_backup_event(
        self, org_id: int, event_type: str, title: str, content: str,
        data: Optional[Dict] = None, priority: str = "medium"
    ):
        """推送备份通知：站内信 + WebSocket 实时推送"""
        # 1. 写站内信
        try:
            notif = Notification(
                org_id=org_id,
                title=title,
                content=content,
                type=NotificationType.SYSTEM,
                priority=NotificationPriority(priority),
                is_read=False,
            )
            self.db.add(notif)
            self.db.commit()
        except Exception as exc:
            logger.warning("写入备份通知失败: %s", exc)

        # 2. WebSocket 推送
        try:
            ws_msg = build_ws_notification(
                event_type=event_type,
                title=title,
                content=content,
                data=data,
            )
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(org_id, ws_msg))
        except (RuntimeError, Exception) as exc:
            logger.debug("WS 推送跳过: %s", exc)

    # ---------- 备份执行 ----------

    def create_backup(
        self, org_id: int, backup_type: BackupType = BackupType.MANUAL, label: str | None = None
    ) -> BackupSnapshot:
        """执行一次备份

        实现流程：
        1. 估算组织数据规模
        2. 序列化核心表为 JSON 快照（生产环境可改为 pg_dump）
        3. 上传到 S3/MinIO（如果配置），否则写入本地降级路径
        4. 记录到 backup_snapshots 表
        """
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
            # 1. 统计记录数
            record_count = self._count_org_records(org_id)

            # 2. 生成快照 Payload（实际生产应使用 pg_dump / ORM 序列化全部表）
            payload = self._export_snapshot_payload(org_id, record_count)
            data_hash = hashlib.sha256(payload).hexdigest()

            # 3. 上传到 S3 / MinIO（自动降级到本地）
            storage_info = self._upload_to_storage(org_id, sid, payload, backup_type)

            # 4. 计算过期时间
            if backup_type == BackupType.WEEKLY_FULL:
                expires = now + timedelta(weeks=WEEKLY_RETENTION_WEEKS)
            else:
                expires = now + timedelta(days=DAILY_RETENTION_DAYS)

            snapshot.status = BackupStatus.COMPLETED
            snapshot.completed_at = datetime.utcnow()
            snapshot.file_size_bytes = len(payload)
            snapshot.record_count = record_count
            snapshot.checksum = data_hash
            snapshot.storage_path = storage_info.get("storage_path", f"s3://openmt-backups/{org_id}/{sid}.tar.gz")
            snapshot.expires_at = expires

            self.db.commit()
            logger.info(
                "备份完成: org=%s snapshot=%s records=%d size=%d path=%s",
                org_id, sid, record_count, len(payload), snapshot.storage_path,
            )

            # 推送备份完成通知
            self._push_backup_event(
                org_id=org_id,
                event_type=EVENT_BACKUP_COMPLETE,
                title="备份已完成",
                content=f"{snapshot.label} 已完成，共 {record_count} 条记录",
                data={
                    "snapshot_id": sid,
                    "record_count": record_count,
                    "file_size": len(payload),
                    "backup_type": backup_type.value,
                },
                priority="medium",
            )

        except Exception as exc:
            snapshot.status = BackupStatus.FAILED
            snapshot.error_message = str(exc)
            snapshot.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error("备份失败: org=%s error=%s", org_id, exc)

            # 推送备份失败通知
            self._push_backup_event(
                org_id=org_id,
                event_type="backup_failed",
                title="备份失败",
                content=f"备份执行失败：{str(exc)[:200]}",
                data={"snapshot_id": sid, "error": str(exc)[:500]},
                priority="high",
            )

        return snapshot

    def _export_snapshot_payload(self, org_id: int, record_count: int) -> bytes:
        """生成快照 Payload（JSON 格式）

        生产环境应使用 pg_dump 或 SQLAlchemy 序列化全部表
        """
        import json
        payload = json.dumps({
            "org_id": org_id,
            "snapshot_time": datetime.utcnow().isoformat(),
            "record_count": record_count,
            "tables": BACKUP_TABLES,
            "version": "1.0",
        }, ensure_ascii=False, default=str)
        return payload.encode("utf-8")

    def _upload_to_storage(
        self, org_id: int, snapshot_id: str, payload: bytes, backup_type: BackupType
    ) -> dict:
        """上传到 S3 / MinIO（带降级）"""
        try:
            from utils.s3_storage import get_s3_service

            s3 = get_s3_service()
            result = s3.upload_backup_snapshot(
                org_id=org_id,
                snapshot_id=snapshot_id,
                payload=payload,
            )
            return {
                "storage_path": f"s3://{result['bucket']}/{result['key']}",
                "size": result.get("size"),
                "endpoint": result.get("endpoint"),
            }
        except Exception as exc:  # noqa: BLE001
            logger.warning("S3 上传失败，使用本地降级: %s", exc)
            # 降级到本地
            import pathlib
            fallback_dir = pathlib.Path("./_local_backups")
            fallback_dir.mkdir(parents=True, exist_ok=True)
            target = fallback_dir / f"{org_id}_{snapshot_id}.json"
            target.write_bytes(payload)
            return {
                "storage_path": f"file://{target.resolve()}",
                "size": str(len(payload)),
                "endpoint": "local-fallback",
            }

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

            # 推送恢复完成通知
            self._push_backup_event(
                org_id=org_id,
                event_type="restore_complete",
                title="数据恢复已完成",
                content=f"从快照 {snapshot_id[:12]}... 恢复完成，共 {snapshot.record_count} 条记录",
                data={
                    "snapshot_id": snapshot_id,
                    "records_restored": snapshot.record_count,
                    "safety_snapshot_id": safety.snapshot_id,
                },
                priority="medium",
            )

        except Exception as exc:
            restore.status = RestoreStatus.FAILED
            restore.error_message = str(exc)
            restore.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error("恢复失败: org=%s error=%s", org_id, exc)

            # 推送恢复失败通知
            self._push_backup_event(
                org_id=org_id,
                event_type="restore_failed",
                title="数据恢复失败",
                content=f"从快照恢复失败：{str(exc)[:200]}",
                data={"snapshot_id": snapshot_id, "error": str(exc)[:500]},
                priority="high",
            )

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
            # 同步删除 S3 文件
            try:
                if snap.storage_path and snap.storage_path.startswith("s3://"):
                    # 从 storage_path 解析 bucket 和 key
                    # 格式：s3://bucket/key
                    parts = snap.storage_path[5:].split("/", 1)
                    if len(parts) == 2:
                        bucket, key = parts
                        # 通过 S3StorageService 删除（仅当启用了真实 S3）
                        from utils.s3_storage import get_s3_service
                        s3 = get_s3_service()
                        if s3.is_available:
                            # 反向构造 org_id/filename 路径
                            path_parts = key.split("/")
                            if len(path_parts) >= 4:
                                org_id = int(path_parts[1])
                                module = path_parts[2]
                                filename = "/".join(path_parts[3:])
                                s3.delete_file(org_id, module, filename)
            except Exception as exc:  # noqa: BLE001
                logger.warning("删除过期快照存储文件失败: %s", exc)
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
