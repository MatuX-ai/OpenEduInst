"""
云端自动备份服务
- 定时备份、手动备份、快照管理
- 真实 ORM 数据导出 / 导入（按 org_id 隔离）
- 一键回滚前会自动保存当前状态快照，失败可回退
- 自动上传到 S3 / MinIO（带降级）

注意：
- 所有敏感字段（手机号、身份证、邮箱、姓名、家庭住址、监护人信息等）
  在导出时会脱敏，避免备份文件泄漏导致隐私问题。
- S3 key 格式固定为 ``openmt/{org_id}/backups/{snapshot_id}.json``，与租户隔离前缀一致。
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from models.backup import (
    BackupSnapshot,
    BackupStatus,
    BackupType,
    RestoreOperation,
    RestoreStatus,
)
from models.notification import Notification, NotificationType, NotificationPriority
from utils.data_masking import (
    mask_generic,
    mask_id_card,
    mask_name,
    mask_phone,
    mask_email,
)
from utils.redis_client import org_cache

logger = logging.getLogger(__name__)

# ============================================================
# 备份策略配置
# ============================================================
DAILY_RETENTION_DAYS = 30
WEEKLY_RETENTION_WEEKS = 12

# 需要备份的核心表（类名 + 过滤字段）
# 字段名为 ORM 列名，与 org_id 对齐；若某表无 org_id 字段会被跳过。
BACKUP_TABLES: List[Tuple[str, str]] = [
    ("Student", "organization_id"),
    ("Enrollment", "org_id"),
    ("AttendanceRecord", "org_id"),
    ("License", "organization_id"),
    ("TenantConfig", "org_id"),
    ("TenantFeatureFlag", "org_id"),
    ("HardwareDevice", "org_id"),
    ("DeviceMaintenanceRecord", "org_id"),
    ("DeviceUsageLog", "org_id"),
    ("TokenBalance", "org_id"),
    ("TokenTransaction", "org_id"),
    ("TokenPackage", "org_id"),
    ("Classroom", "org_id"),
    ("ClassSchedule", "org_id"),
    ("MakerSpace", "org_id"),
    ("SpaceBooking", "org_id"),
    ("EquipmentSlot", "org_id"),
    ("TeachingResource", "org_id"),
    ("ResourceCategory", "org_id"),
    ("STEMProject", "org_id"),
    ("ProjectStudent", "org_id"),
    ("ProjectMilestone", "org_id"),
    ("ProjectResource", "org_id"),
    ("Competition", "org_id"),
    ("CompetitionRegistration", "org_id"),
    ("Certification", "org_id"),
    ("ExamRegistration", "org_id"),
    ("ClassFeedback", "org_id"),
    ("StudentAchievement", "org_id"),
    ("ParentMessage", "org_id"),
    ("MarketingCampaign", "org_id"),
    ("SocialMediaAccount", "org_id"),
    ("Coupon", "org_id"),
    ("Settlement", "org_id"),
    ("Lead", "org_id"),
    ("LeadFollowUp", "org_id"),
    ("Schedule", "org_id"),
    ("Teacher", "org_id"),
    ("Course", "org_id"),
    ("User", "_no_global_org_filter"),  # 特殊：按 user_organization 过滤
]

# 敏感字段 -> 脱敏函数名
SENSITIVE_FIELDS: Dict[str, str] = {
    "phone": "mask_phone",
    "mobile": "mask_phone",
    "contact_phone": "mask_phone",
    "id_card": "mask_id_card",
    "id_number": "mask_id_card",
    "passport": "mask_id_card",
    "email": "mask_email",
    "contact_email": "mask_email",
    "name": "mask_name",
    "full_name": "mask_name",
    "guardian_name": "mask_name",
    "guardian_phone": "mask_phone",
    "contact_name": "mask_name",
    "address": "mask_address_generic",
    "home_address": "mask_address_generic",
    "residential_address": "mask_address_generic",
}

MASKERS = {
    "mask_phone": mask_phone,
    "mask_id_card": mask_id_card,
    "mask_email": mask_email,
    "mask_name": mask_name,
    "mask_address_generic": lambda v: mask_generic(v, keep_head=2, keep_tail=2) if v else v,
}


# ============================================================
# 工具：导出 / 导入核心逻辑
# ============================================================
def _serialize_rows(model, rows: List[Any]) -> List[Dict[str, Any]]:
    """将 ORM 对象列表转换为 JSON 可序列化的字典"""
    out: List[Dict[str, Any]] = []
    col_names = [c.name for c in model.__table__.columns]
    for row in rows:
        record: Dict[str, Any] = {}
        for col in col_names:
            val = getattr(row, col, None)
            if isinstance(val, datetime):
                record[col] = val.isoformat()
            elif val is None:
                record[col] = None
            else:
                try:
                    json.dumps(val, ensure_ascii=False)
                    record[col] = val
                except (TypeError, ValueError):
                    record[col] = str(val)
        out.append(record)
    return out


def _mask_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """对单条记录的敏感字段做脱敏；备份文件中不保存原始隐私数据"""
    new_record = dict(record)
    for field, m_name in SENSITIVE_FIELDS.items():
        if field not in new_record:
            continue
        func = MASKERS.get(m_name)
        if func is None or new_record[field] is None:
            continue
        try:
            new_record[field] = func(new_record[field])
        except Exception as exc:  # noqa: BLE001
            logger.debug("脱敏失败 field=%s err=%s", field, exc)
    return new_record


def _dump_payload(org_id: int, db: Session) -> Dict[str, Any]:
    """导出组织的 ORM 数据。为避免循环依赖，按需导入 models 包。"""
    import models as _models_pkg

    snapshot_time = datetime.utcnow()
    tables_data: Dict[str, List[Dict[str, Any]]] = {}
    total_records = 0

    # 收集属于该 org 的 user_id（用于 User 表过滤）
    try:
        from models.user_organization import UserOrganization
        user_ids = [
            uo.user_id for uo in db.query(UserOrganization).filter(
                UserOrganization.org_id == org_id
            ).all()
        ]
    except Exception:  # noqa: BLE001
        user_ids = []

    for model_name, _col in BACKUP_TABLES:
        try:
            model = getattr(_models_pkg, model_name, None)
            if model is None:
                continue
            if not hasattr(model, "__table__"):
                continue

            if _col == "_no_global_org_filter":
                # User: 按 user_id in 过滤
                if not user_ids:
                    continue
                rows = db.query(model).filter(model.id.in_(user_ids)).all()
            else:
                if not hasattr(model, _col):
                    continue
                rows = db.query(model).filter(
                    getattr(model, _col) == org_id
                ).all()

            serialized = _serialize_rows(model, rows)
            # 备份文件整体脱敏，避免泄露
            masked = [_mask_record(r) for r in serialized]
            tables_data[model_name] = masked
            total_records += len(masked)
        except Exception as exc:  # noqa: BLE001
            logger.warning("导出表失败 table=%s err=%s", model_name, exc)
            tables_data[model_name] = []

    return {
        "org_id": org_id,
        "snapshot_time": snapshot_time.isoformat(),
        "generated_at": snapshot_time.isoformat(),
        "version": "1.0",
        "record_count": total_records,
        "tables": tables_data,
    }


def _load_payload(payload_bytes: bytes) -> Dict[str, Any]:
    """解析 JSON 快照 payload"""
    data = json.loads(payload_bytes.decode("utf-8"))
    if not isinstance(data, dict) or "tables" not in data:
        raise ValueError("快照格式不合法，缺少 tables 字段")
    return data


def _import_payload(org_id: int, db: Session, payload: Dict[str, Any]) -> Dict[str, int]:
    """真实导入：清空现有该 org 的 ORM 数据，再批量 insert"""
    import models as _models_pkg

    restore_stats: Dict[str, int] = {}

    # 先收集属于该 org 的 user_id，用于 User 表恢复前的清理
    try:
        from models.user_organization import UserOrganization
        user_ids = [
            uo.user_id for uo in db.query(UserOrganization).filter(
                UserOrganization.org_id == org_id
            ).all()
        ]
    except Exception:  # noqa: BLE001
        user_ids = []

    for model_name, records in payload.get("tables", {}).items():
        if not isinstance(records, list):
            continue
        model = getattr(_models_pkg, model_name, None)
        if model is None or not hasattr(model, "__table__"):
            continue

        # 确定过滤字段
        filter_col = None
        for _name, _col in BACKUP_TABLES:
            if _name == model_name:
                filter_col = _col
                break

        try:
            if filter_col == "_no_global_org_filter":
                if user_ids:
                    db.query(model).filter(model.id.in_(user_ids)).delete(
                        synchronize_session=False
                    )
            elif filter_col and hasattr(model, filter_col):
                db.query(model).filter(
                    getattr(model, filter_col) == org_id
                ).delete(synchronize_session=False)
            else:
                # 无法按 org 隔离，跳过该表
                logger.info("跳过不可按 org 隔离的表: %s", model_name)
                continue

            # 批量插入（一次 100 条避免大事务）
            insert_count = 0
            batch: List[Dict[str, Any]] = []
            for r in records:
                batch.append(r)
                if len(batch) >= 100:
                    db.bulk_insert_mappings(model, batch)
                    insert_count += len(batch)
                    batch = []
            if batch:
                db.bulk_insert_mappings(model, batch)
                insert_count += len(batch)

            restore_stats[model_name] = insert_count
        except Exception as exc:  # noqa: BLE001
            logger.error("表恢复失败 table=%s err=%s", model_name, exc)
            restore_stats[model_name] = -1

    return restore_stats


# ============================================================
# 上传到 S3 / 本地降级
# ============================================================
def _upload_to_storage(
    org_id: int, snapshot_id: str, payload: bytes, backup_type: BackupType
) -> Dict[str, Any]:
    try:
        from utils.s3_storage import get_s3_service

        s3 = get_s3_service()
        result = s3.upload_backup_snapshot(
            org_id=org_id, snapshot_id=snapshot_id, payload=payload,
        )
        return {
            "storage_path": f"s3://{result['bucket']}/{result['key']}",
            "endpoint": result.get("endpoint"),
            "size": result.get("size"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("S3 上传失败 org=%s err=%s，降级到本地文件", org_id, exc)
        import pathlib
        fallback_dir = pathlib.Path("./_local_backups")
        fallback_dir.mkdir(parents=True, exist_ok=True)
        target = fallback_dir / f"{org_id}_{snapshot_id}_{backup_type.value}.json"
        target.write_bytes(payload)
        return {
            "storage_path": f"file://{target.resolve()}",
            "endpoint": "local-fallback",
            "size": len(payload),
        }


# ============================================================
# 服务入口
# ============================================================
class CloudBackupService:
    """云端自动备份服务"""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ---------- 查询 ----------
    def list_snapshots(self, org_id: int, limit: int = 50) -> List[BackupSnapshot]:
        return (
            self.db.query(BackupSnapshot)
            .filter(BackupSnapshot.org_id == org_id)
            .order_by(BackupSnapshot.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_snapshot(self, snapshot_id: str) -> Optional[BackupSnapshot]:
        return (
            self.db.query(BackupSnapshot)
            .filter(BackupSnapshot.snapshot_id == snapshot_id)
            .first()
        )

    def get_backup_status(self, org_id: int) -> Dict[str, Any]:
        total = (
            self.db.query(BackupSnapshot)
            .filter(
                BackupSnapshot.org_id == org_id,
                BackupSnapshot.status == BackupStatus.COMPLETED,
            )
            .count()
        )
        latest = (
            self.db.query(BackupSnapshot)
            .filter(
                BackupSnapshot.org_id == org_id,
                BackupSnapshot.status == BackupStatus.COMPLETED,
            )
            .order_by(BackupSnapshot.completed_at.desc())
            .first()
        )
        total_size = sum(
            (s.file_size_bytes or 0) for s in (
                self.db.query(BackupSnapshot).filter(
                    BackupSnapshot.org_id == org_id,
                    BackupSnapshot.status == BackupStatus.COMPLETED,
                ).all()
            )
        )
        return {
            "total_snapshots": total,
            "latest_backup": latest.completed_at.isoformat() if latest and latest.completed_at else None,
            "next_scheduled": _calc_next_schedule(),
            "total_storage_bytes": total_size,
            "backup_enabled": self._is_backup_enabled(org_id),
        }

    def _push_backup_event(
        self, org_id: int, event_type: str, title: str, content: str,
        data: Optional[Dict[str, Any]] = None, priority: str = "medium",
    ) -> None:
        try:
            p = NotificationPriority.HIGH if priority == "high" else (
                NotificationPriority.LOW if priority == "low" else NotificationPriority.MEDIUM
            )
            notif = Notification(
                org_id=org_id, title=title, content=content,
                type=NotificationType.SYSTEM, priority=p, is_read=False,
                created_at=datetime.utcnow(),
            )
            self.db.add(notif)
            self.db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.warning("写入备份通知失败: %s", exc)

        try:
            from services.websocket_service import manager, build_notification
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None
            if loop is not None:
                loop.create_task(
                    manager.broadcast(
                        org_id, build_notification(
                            event_type=event_type, title=title,
                            content=content, data=data,
                        )
                    )
                )
        except Exception as exc:  # noqa: BLE001
            logger.debug("WS 推送跳过: %s", exc)

    # ---------- 备份执行 ----------
    def create_backup(
        self, org_id: int, backup_type: BackupType = BackupType.MANUAL,
        label: Optional[str] = None,
    ) -> BackupSnapshot:
        sid = f"bkp-{uuid.uuid4().hex[:16]}"
        now = datetime.utcnow()

        snapshot = BackupSnapshot(
            org_id=org_id, snapshot_id=sid,
            label=label or f"手动备份 {now.strftime('%Y-%m-%d %H:%M')}",
            backup_type=backup_type, status=BackupStatus.IN_PROGRESS,
            started_at=now, tables_included=[t for t, _ in BACKUP_TABLES],
        )
        self.db.add(snapshot)
        self.db.flush()

        try:
            # 1. 导出真实 ORM 数据
            payload_dict = _dump_payload(org_id, self.db)
            payload = json.dumps(payload_dict, ensure_ascii=False, default=str).encode("utf-8")
            data_hash = hashlib.sha256(payload).hexdigest()

            # 2. 上传到 S3 / MinIO（自动降级到本地）
            storage_info = _upload_to_storage(org_id, sid, payload, backup_type)

            # 3. 计算过期时间
            expires = (
                now + timedelta(weeks=WEEKLY_RETENTION_WEEKS)
                if backup_type == BackupType.WEEKLY_FULL
                else now + timedelta(days=DAILY_RETENTION_DAYS)
            )

            snapshot.status = BackupStatus.COMPLETED
            snapshot.completed_at = datetime.utcnow()
            snapshot.file_size_bytes = len(payload)
            snapshot.record_count = payload_dict["record_count"]
            snapshot.checksum = data_hash
            snapshot.storage_path = storage_info.get("storage_path")
            snapshot.expires_at = expires

            self.db.commit()
            logger.info(
                "备份完成: org=%s snapshot=%s records=%s size=%s path=%s",
                org_id, sid, snapshot.record_count, snapshot.file_size_bytes,
                snapshot.storage_path,
            )

            # 清理缓存：让前端能看到最新快照列表
            try:
                org_cache.delete(org_id, "backup:status")
            except Exception:  # noqa: BLE001
                pass

            self._push_backup_event(
                org_id=org_id, event_type="backup_complete",
                title="备份已完成", content=f"{snapshot.label} 已完成，共 {snapshot.record_count} 条记录",
                data={"snapshot_id": sid, "record_count": snapshot.record_count, "size": len(payload)},
                priority="medium",
            )

        except Exception as exc:  # noqa: BLE001
            snapshot.status = BackupStatus.FAILED
            snapshot.error_message = str(exc)[:500]
            snapshot.completed_at = datetime.utcnow()
            self.db.commit()
            logger.exception("备份失败 org=%s snapshot=%s", org_id, sid)
            self._push_backup_event(
                org_id=org_id, event_type="backup_failed", title="备份失败",
                content=f"备份执行失败：{str(exc)[:200]}",
                data={"snapshot_id": sid, "error": str(exc)[:500]}, priority="high",
            )

        return snapshot

    # ---------- 一键回滚 ----------
    def restore_from_snapshot(
        self, org_id: int, snapshot_id: str, initiated_by: str,
    ) -> RestoreOperation:
        snapshot = self.get_snapshot(snapshot_id)
        if not snapshot:
            raise ValueError(f"快照不存在: {snapshot_id}")
        if snapshot.org_id != org_id:
            raise ValueError("快照不属于当前组织")
        if snapshot.status != BackupStatus.COMPLETED:
            raise ValueError(f"快照状态不允许恢复: {snapshot.status.value}")

        # 先保存当前状态安全快照，失败时可回退
        safety = self.create_backup(
            org_id=org_id, backup_type=BackupType.MANUAL,
            label=f"回滚前安全快照 ({snapshot_id[:12]})",
        )
        if safety.status != BackupStatus.COMPLETED:
            raise ValueError(f"创建安全快照失败: {safety.error_message}")

        restore = RestoreOperation(
            org_id=org_id, snapshot_id=snapshot.id, status=RestoreStatus.IN_PROGRESS,
            safety_snapshot_id=safety.snapshot_id, initiated_by=initiated_by or "system",
            started_at=datetime.utcnow(),
        )
        self.db.add(restore)
        self.db.flush()

        try:
            # 下载并校验快照
            payload_bytes = _download_payload(snapshot)
            payload = _load_payload(payload_bytes)

            # 校验 checksum
            actual_sha256 = hashlib.sha256(payload_bytes).hexdigest()
            if snapshot.checksum and actual_sha256 != snapshot.checksum:
                raise ValueError(
                    f"快照完整性校验失败: expected={snapshot.checksum} actual={actual_sha256}"
                )

            # 导入真实数据
            restore_stats = _import_payload(org_id, self.db, payload)
            total = sum(max(v, 0) for v in restore_stats.values())

            restore.status = RestoreStatus.COMPLETED
            restore.completed_at = datetime.utcnow()
            restore.records_restored = total
            restore.details = {"tables": restore_stats}
            self.db.commit()

            logger.info(
                "恢复完成 org=%s snapshot=%s records=%s tables=%s",
                org_id, snapshot_id, total, restore_stats,
            )

            # 清理缓存
            try:
                org_cache.clear_org(org_id)
            except Exception:  # noqa: BLE001
                pass

            self._push_backup_event(
                org_id=org_id, event_type="restore_complete",
                title="数据恢复已完成",
                content=f"从快照 {snapshot_id[:12]}... 恢复完成，共 {total} 条记录",
                data={
                    "snapshot_id": snapshot_id, "records_restored": total,
                    "safety_snapshot_id": safety.snapshot_id,
                }, priority="medium",
            )

        except Exception as exc:  # noqa: BLE001
            restore.status = RestoreStatus.FAILED
            restore.error_message = str(exc)[:500]
            restore.completed_at = datetime.utcnow()
            self.db.commit()
            logger.exception("恢复失败 org=%s snapshot=%s", org_id, snapshot_id)
            self._push_backup_event(
                org_id=org_id, event_type="restore_failed", title="数据恢复失败",
                content=f"从快照恢复失败：{str(exc)[:200]}",
                data={"snapshot_id": snapshot_id, "error": str(exc)[:500]},
                priority="high",
            )

        return restore

    # ---------- 过期清理 ----------
    def cleanup_expired_snapshots(self) -> int:
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
            try:
                if snap.storage_path and snap.storage_path.startswith("s3://"):
                    from utils.s3_storage import get_s3_service
                    parts = snap.storage_path[5:].split("/", 1)
                    if len(parts) == 2:
                        _bucket, key = parts
                        path_parts = key.split("/")
                        if len(path_parts) >= 4:
                            try:
                                org_id = int(path_parts[1])
                                module = path_parts[2]
                                filename = "/".join(path_parts[3:])
                                get_s3_service().delete_file(org_id, module, filename)
                            except Exception:  # noqa: BLE001
                                pass
            except Exception as exc:  # noqa: BLE001
                logger.warning("删除过期快照存储文件失败: %s", exc)
            count += 1
        self.db.commit()
        logger.info("清理过期快照: %d 个", count)
        return count

    def _count_org_records(self, org_id: int) -> int:
        """估算组织记录数（用于 UI 显示）"""
        try:
            from models.student import Student
            total = self.db.query(Student).filter(
                Student.organization_id == org_id
            ).count()
        except Exception:  # noqa: BLE001
            total = 0
        try:
            from models.license import License
            total += self.db.query(License).filter(
                License.organization_id == org_id
            ).count()
        except Exception:  # noqa: BLE001
            pass
        return max(total, 1)

    def _is_backup_enabled(self, org_id: int) -> bool:
        try:
            from models.tenant import TenantConfig
            cfg = self.db.query(TenantConfig).filter(TenantConfig.org_id == org_id).first()
            if cfg and cfg.config_data:
                return bool(cfg.config_data.get("cloud_backup_enabled", False))
        except Exception:  # noqa: BLE001
            pass
        return True  # 默认开启云托管版自动备份


# ============================================================
# 下载快照内容（S3 / 本地）
# ============================================================
def _download_payload(snapshot: BackupSnapshot) -> bytes:
    path = snapshot.storage_path or ""
    if path.startswith("s3://"):
        try:
            from utils.s3_storage import get_s3_service
            parts = path[5:].split("/", 1)
            if len(parts) != 2:
                raise ValueError("S3 路径格式不正确")
            _bucket, key = parts
            path_parts = key.split("/")
            if len(path_parts) < 4:
                raise ValueError("S3 key 缺少 org 前缀信息")
            org_id = int(path_parts[1])
            module = path_parts[2]
            filename = "/".join(path_parts[3:])
            data = get_s3_service().download_file(org_id, module, filename)
            if data is None:
                raise ValueError("S3 返回空")
            return data
        except Exception as exc:  # noqa: BLE001
            logger.error("从 S3 下载快照失败 path=%s err=%s", path, exc)
            raise

    # 本地降级
    if path.startswith("file://"):
        try:
            import pathlib
            local_path = pathlib.Path(path[len("file://"):])
            if not local_path.exists():
                raise FileNotFoundError(str(local_path))
            return local_path.read_bytes()
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"本地快照不存在: {exc}")

    raise ValueError("快照存储路径为空或格式无法识别")


# ============================================================
# 时间工具
# ============================================================
def _calc_next_schedule() -> str:
    now = datetime.utcnow() + timedelta(hours=8)  # UTC+8
    next_2am = now.replace(hour=2, minute=0, second=0, microsecond=0)
    if now >= next_2am:
        next_2am += timedelta(days=1)
    return (next_2am - timedelta(hours=8)).isoformat()
