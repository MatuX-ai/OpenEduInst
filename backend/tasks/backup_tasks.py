"""
Celery 备份任务实现

提供三个定时任务：
- ``run_daily_incremental_backup``：每日凌晨执行增量备份
- ``run_weekly_full_backup``：每周日凌晨执行全量备份
- ``run_hourly_cleanup``：每小时清理过期快照
"""

from __future__ import annotations

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def _list_all_org_ids() -> List[int]:
    """获取所有需要备份的组织 ID

    实现说明：
    - 开发环境（SQLite）使用 SQLAlchemy 查询
    - 生产环境（PostgreSQL Schema 隔离）需先临时切到 public Schema
    """
    try:
        from utils.database import SessionLocal
        from models.license import Organization
    except ImportError as exc:
        logger.error("数据库导入失败: %s", exc)
        return []

    db = SessionLocal()
    try:
        orgs = db.query(Organization).filter(Organization.is_active.is_(True)).all()
        return [org.id for org in orgs]
    except Exception as exc:  # noqa: BLE001
        logger.error("获取组织列表失败: %s", exc)
        return []
    finally:
        db.close()


def _run_backup_for_org(org_id: int, backup_type: str) -> Optional[dict]:
    """为指定组织执行备份"""
    from utils.database import SessionLocal
    from models.backup import BackupType
    from services.cloud_backup_service import CloudBackupService
    from utils.s3_storage import get_s3_service

    db = SessionLocal()
    try:
        svc = CloudBackupService(db)

        # 1. 导出数据（模拟：实际应使用 pg_dump 或 ORM 序列化）
        record_count = svc._count_org_records(org_id)

        # 2. 上传到 S3
        s3 = get_s3_service()
        payload = f"# Backup for org {org_id} at {backup_type}\nrecords={record_count}\n".encode()
        s3_result = s3.upload_backup_snapshot(
            org_id=org_id,
            snapshot_id=f"bkp-{org_id}-{backup_type}",
            payload=payload,
        )

        # 3. 写快照记录到 DB
        backup_type_enum = (
            BackupType.WEEKLY_FULL if backup_type == "weekly_full" else BackupType.DAILY_INCREMENTAL
        )
        snapshot = svc.create_backup(
            org_id=org_id,
            backup_type=backup_type_enum,
            label=f"定时{backup_type}备份",
        )

        # 4. 更新存储路径
        if s3_result:
            snapshot.storage_path = f"s3://{s3_result['bucket']}/{s3_result['key']}"
            db.commit()

        logger.info(
            "✅ 组织 %s 备份完成: type=%s snapshot=%s s3_key=%s",
            org_id, backup_type, snapshot.snapshot_id, s3_result.get("key"),
        )
        return {
            "org_id": org_id,
            "type": backup_type,
            "snapshot_id": snapshot.snapshot_id,
            "s3_key": s3_result.get("key"),
            "status": "success",
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("组织 %s 备份失败: %s", org_id, exc)
        return {"org_id": org_id, "type": backup_type, "status": "failed", "error": str(exc)}
    finally:
        db.close()


# ------------------------------------------------------------
# 定时任务入口（被 Celery Beat 调用）
# ------------------------------------------------------------

def run_daily_incremental_backup():
    """每日增量备份：遍历所有组织，依次创建增量快照"""
    logger.info("=" * 60)
    logger.info("[Celery] 启动每日增量备份任务")
    logger.info("=" * 60)

    org_ids = _list_all_org_ids()
    if not org_ids:
        logger.warning("未找到任何活跃组织，跳过备份")
        return {"processed": 0, "results": []}

    results = []
    for org_id in org_ids:
        result = _run_backup_for_org(org_id, "daily_incremental")
        if result:
            results.append(result)

    success = sum(1 for r in results if r.get("status") == "success")
    logger.info("每日增量备份完成: 成功=%d/%d", success, len(results))
    return {"processed": len(results), "results": results}


def run_weekly_full_backup():
    """每周全量备份"""
    logger.info("=" * 60)
    logger.info("[Celery] 启动每周全量备份任务")
    logger.info("=" * 60)

    org_ids = _list_all_org_ids()
    if not org_ids:
        return {"processed": 0, "results": []}

    results = []
    for org_id in org_ids:
        result = _run_backup_for_org(org_id, "weekly_full")
        if result:
            results.append(result)

    success = sum(1 for r in results if r.get("status") == "success")
    logger.info("每周全量备份完成: 成功=%d/%d", success, len(results))
    return {"processed": len(results), "results": results}


def run_hourly_cleanup():
    """每小时清理过期快照"""
    logger.info("[Celery] 启动过期快照清理")
    try:
        from utils.database import SessionLocal
        from services.cloud_backup_service import CloudBackupService
        from utils.s3_storage import get_s3_service

        db = SessionLocal()
        try:
            svc = CloudBackupService(db)
            expired_count = svc.cleanup_expired_snapshots()
            logger.info("过期快照清理完成: 共 %d 个", expired_count)
            return {"expired_count": expired_count}
        finally:
            db.close()
    except Exception as exc:  # noqa: BLE001
        logger.error("过期清理任务失败: %s", exc)
        return {"error": str(exc)}
