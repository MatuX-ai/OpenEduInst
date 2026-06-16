"""
云端备份管理路由
提供备份快照列表、手动备份、一键回滚等 RESTful API
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.backup import BackupType
from services.cloud_backup_service import CloudBackupService
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/cloud/backup", tags=["云端备份"])


def _get_service(db: Session = Depends(get_db)) -> CloudBackupService:
    return CloudBackupService(db)


@router.get("/status", summary="获取备份状态概览")
def get_backup_status(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的备份状态：快照总数、最近备份时间、下次计划、存储用量"""
    _, org_id = ctx
    svc = CloudBackupService(db)
    return svc.get_backup_status(org_id)


@router.get("/list", summary="获取备份快照列表")
def list_snapshots(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的备份快照列表（按时间倒序）"""
    _, org_id = ctx
    svc = CloudBackupService(db)
    snapshots = svc.list_snapshots(org_id, limit=limit)
    return [
        {
            "snapshot_id": s.snapshot_id,
            "label": s.label,
            "backup_type": s.backup_type.value,
            "status": s.status.value,
            "file_size_bytes": s.file_size_bytes,
            "record_count": s.record_count,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
        }
        for s in snapshots
    ]


@router.post("/create", summary="手动创建备份")
def create_manual_backup(
    label: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """手动触发一次即时备份"""
    user, org_id = ctx
    svc = CloudBackupService(db)
    snapshot = svc.create_backup(org_id, BackupType.MANUAL, label=label)
    return {
        "message": "备份已完成" if snapshot.status.value == "completed" else "备份执行中",
        "snapshot_id": snapshot.snapshot_id,
        "status": snapshot.status.value,
    }


@router.post("/restore", summary="一键回滚")
def restore_from_snapshot(
    snapshot_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """从指定快照恢复数据。回滚前会自动创建安全快照保护当前状态。"""
    user, org_id = ctx
    svc = CloudBackupService(db)
    try:
        operation = svc.restore_from_snapshot(
            org_id=org_id,
            snapshot_id=snapshot_id,
            initiated_by=getattr(user, "username", "unknown"),
        )
        return {
            "message": "恢复已完成" if operation.status.value == "completed" else "恢复执行中",
            "operation_id": operation.id,
            "status": operation.status.value,
            "records_restored": operation.records_restored,
            "safety_snapshot_id": operation.safety_snapshot_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
