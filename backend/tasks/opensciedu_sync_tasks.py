"""
OpenMTSciEd 元数据定时同步任务

将教程/课件/硬件项目统计与样本写入 organizations.opensciedu_api_config，
并刷新 Redis 缓存。
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from config.settings import settings

logger = logging.getLogger(__name__)


def _list_sync_org_ids() -> List[int]:
    from utils.database import SessionLocal
    from models.license import Organization
    from services.opensciedu_client import is_integration_enabled

    db = SessionLocal()
    try:
        orgs = db.query(Organization).filter(Organization.is_active.is_(True)).all()
        ids: List[int] = []
        for org in orgs:
            if not org.opensciedu_sync_enabled:
                continue
            if not is_integration_enabled(org):
                continue
            ids.append(org.id)
        return ids
    finally:
        db.close()


def sync_opensciedu_for_org(org_id: int) -> Dict[str, Any]:
    """同步单个机构的 OpenMTSciEd 元数据"""
    from utils.database import SessionLocal
    from models.license import Organization
    from services.opensciedu_client import (
        OpenSciEdUpstreamError,
        get_client_for_org,
        is_integration_enabled,
    )
    from utils.opensciedu_cache import invalidate_org, set_cached

    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org or not is_integration_enabled(org):
            return {"org_id": org_id, "status": "skipped", "reason": "integration_disabled"}

        org.opensciedu_sync_status = "syncing"
        db.commit()

        client = get_client_for_org(org)
        stats = client.get_stats(use_cache=False)

        samples: Dict[str, Any] = {}
        try:
            tutorials = client.get_tutorials(page=1, size=5, use_cache=False)
            samples["tutorials"] = [
                {"id": i.get("id"), "title": i.get("title")}
                for i in (tutorials.get("items") or [])[:5]
            ]
        except OpenSciEdUpstreamError:
            samples["tutorials"] = []

        config = dict(org.opensciedu_api_config or {})
        config["cached_stats"] = stats
        config["samples"] = samples
        config["synced_at"] = datetime.utcnow().isoformat() + "Z"

        org.opensciedu_api_config = config
        org.opensciedu_last_sync = datetime.utcnow()
        org.opensciedu_sync_status = "success"
        db.commit()

        invalidate_org(org_id)
        set_cached(org_id, "stats", stats, params=None)

        logger.info("OpenMTSciEd 同步完成 org_id=%s stats=%s", org_id, stats)
        return {"org_id": org_id, "status": "success", "stats": stats}
    except Exception as exc:  # noqa: BLE001
        logger.exception("OpenMTSciEd 同步失败 org_id=%s", org_id)
        try:
            org = db.query(Organization).filter(Organization.id == org_id).first()
            if org:
                org.opensciedu_sync_status = "error"
                db.commit()
        except Exception:  # noqa: BLE001
            pass
        return {"org_id": org_id, "status": "error", "error": str(exc)}
    finally:
        db.close()


def run_opensciedu_sync_all() -> Dict[str, Any]:
    """遍历所有启用同步的机构"""
    if not settings.OPENSCIEDU_SYNC_ENABLED:
        logger.info("OPENSCIEDU_SYNC_ENABLED=false，跳过同步")
        return {"processed": 0, "results": [], "skipped": True}

    logger.info("=" * 60)
    logger.info("[Celery] 启动 OpenMTSciEd 元数据同步")
    logger.info("=" * 60)

    org_ids = _list_sync_org_ids()
    if not org_ids:
        logger.warning("无启用 OpenMTSciEd 同步的机构")
        return {"processed": 0, "results": []}

    results = [sync_opensciedu_for_org(org_id) for org_id in org_ids]
    success = sum(1 for r in results if r.get("status") == "success")
    logger.info("OpenMTSciEd 同步完成: 成功=%d/%d", success, len(results))
    return {"processed": len(results), "success": success, "results": results}
