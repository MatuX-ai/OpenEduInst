"""
OpenMTSciEd 代理路由

前端通过 /api/v1/opensciedu/* 访问 STEM 资源，禁止直连上游。
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.settings import settings
from models.license import Organization
from models.user_organization import UserOrganizationRole
from services.opensciedu_client import (
    build_topic_studio_url,
    get_client_for_org,
    integration_http_error,
    is_integration_enabled,
    mask_api_key,
    normalize_api_root,
    normalize_web_base,
    resolve_api_key,
)
from services.opensciedu_search_service import unified_search
from utils.auth_utils import get_current_user_sync, require_org_context, require_role
from utils.database import get_db

router = APIRouter(prefix="/api/v1/opensciedu", tags=["OpenMTSciEd 集成"])


def _get_org(db: Session, org_id: int) -> Organization:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="机构不存在")
    return org


class OpenSciEdConfigUpdate(BaseModel):
    opensciedu_api_enabled: Optional[bool] = None
    opensciedu_api_key: Optional[str] = Field(None, description="机构级 API Key，留空则不修改")


@router.get("/health")
def opensciedu_health(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """检测与 OpenMTSciEd 上游连通性"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.health_check()
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/config")
def get_opensciedu_config(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """返回当前机构 OpenMTSciEd 集成配置（不含明文 Key）"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    platform_key = bool((resolve_api_key(org) or "") and not org.opensciedu_api_key)
    return {
        "enabled": is_integration_enabled(org),
        "opensciedu_api_enabled": bool(org.opensciedu_api_enabled),
        "sync_status": org.opensciedu_sync_status or "idle",
        "last_sync": org.opensciedu_last_sync.isoformat() if org.opensciedu_last_sync else None,
        "api_key_masked": mask_api_key(org.opensciedu_api_key or resolve_api_key(org)),
        "platform_fallback": platform_key,
        "upstream": normalize_api_root(settings.OPENSCIEDU_API_BASE),
    }


@router.put("/config")
def update_opensciedu_config(
    body: OpenSciEdConfigUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _admin=Depends(require_role(UserOrganizationRole.ADMIN, UserOrganizationRole.STAFF)),
):
    """更新机构 OpenMTSciEd 集成配置（管理员）"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    if body.opensciedu_api_enabled is not None:
        org.opensciedu_api_enabled = body.opensciedu_api_enabled
    if body.opensciedu_api_key is not None and body.opensciedu_api_key.strip():
        org.opensciedu_api_key = body.opensciedu_api_key.strip()
    db.commit()
    db.refresh(org)

    from utils.opensciedu_cache import invalidate_org

    invalidate_org(org_id)
    return {"message": "配置已更新", "enabled": is_integration_enabled(org)}


@router.post("/sync")
def trigger_opensciedu_sync(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _admin=Depends(require_role(UserOrganizationRole.ADMIN, UserOrganizationRole.STAFF)),
):
    """手动触发 OpenMTSciEd 元数据同步（管理员）"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    if not is_integration_enabled(org):
        raise HTTPException(
            status_code=403,
            detail={"code": "OPENSCIEDU_DISABLED", "message": "集成未启用，无法同步"},
        )
    from tasks.opensciedu_sync_tasks import sync_opensciedu_for_org

    result = sync_opensciedu_for_org(org_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=502, detail=result)
    return result


@router.get("/search")
def search_unified_resources(
    q: str = Query(..., min_length=1, max_length=200),
    type: str = Query("all", description="SciEd 类型：all|tutorial|material|hardware"),
    limit: int = Query(20, ge=1, le=50),
    include_local: bool = Query(True),
    include_scied: bool = Query(True),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
) -> Any:
    """机构本地资源 + OpenMTSciEd 统一检索"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    return unified_search(
        db,
        org,
        org_id,
        q,
        resource_type=type,
        limit=limit,
        include_local=include_local,
        include_scied=include_scied,
    )


@router.get("/topic-studio/links")
def get_topic_studio_links(
    draft_id: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """课题工作室深链（新窗口打开 OpenMTSciEd SPA）"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    web_base = normalize_web_base(settings.OPENSCIEDU_WEB_BASE, settings.OPENSCIEDU_API_BASE)
    enabled = is_integration_enabled(org)
    return {
        "enabled": enabled,
        "web_base": web_base,
        "list_url": build_topic_studio_url(),
        "new_draft_url": build_topic_studio_url("new"),
        "draft_url": build_topic_studio_url(draft_id) if draft_id else None,
        "org_id": org_id,
        "note": "课题工作室需在 OpenMTSciEd 桌面端/Web 登录后使用；EduInst 仅提供深链入口",
    }


@router.get("/stats")
def get_opensciedu_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_stats()
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/tutorials")
def list_tutorials(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
) -> Any:
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_tutorials(page=page, size=size, subject=subject, grade_level=grade_level)
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/tutorials/{tutorial_id}")
def get_tutorial(
    tutorial_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
) -> Any:
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_tutorial(tutorial_id)
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/coursewares")
def list_coursewares(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
) -> Any:
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_coursewares(
            page=page, size=size, subject=subject, grade_level=grade_level, type_=type
        )
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/recommendations")
def get_recommendations(
    limit: int = Query(10, ge=1, le=50),
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    user=Depends(get_current_user_sync),
) -> Any:
    """知识图谱推荐（只读）"""
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_recommendations(user_id=user.id, limit=limit, subject=subject)
    except Exception as exc:
        raise integration_http_error(exc) from exc


@router.get("/hardware-projects")
def list_hardware_projects(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
) -> Any:
    _, org_id = ctx
    org = _get_org(db, org_id)
    try:
        client = get_client_for_org(org)
        return client.get_hardware_projects(
            page=page, size=size, difficulty=difficulty, category=category, subject=subject
        )
    except Exception as exc:
        raise integration_http_error(exc) from exc
