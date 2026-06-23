"""
OpenMTSciEd + 机构本地教学资源统一检索
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.license import Organization
from models.resource import TeachingResource
from services.opensciedu_client import (
    OpenSciEdUpstreamError,
    get_client_for_org,
    is_integration_enabled,
)


def _score_text_fields(query: str, *fields: Optional[str]) -> int:
    q = query.lower().strip()
    if not q:
        return 0
    score = 0
    for field in fields:
        value = (field or "").lower()
        if not value:
            continue
        if value == q:
            score += 100
        elif value.startswith(q):
            score += 50
        elif q in value:
            score += 20
        for word in q.split():
            if len(word) >= 2 and word in value:
                score += 10
    return score


def _search_local_resources(
    db: Session,
    org_id: int,
    query: str,
    limit: int,
) -> List[Dict[str, Any]]:
    pattern = f"%{query.strip()}%"
    rows = (
        db.query(TeachingResource)
        .filter(
            TeachingResource.org_id == org_id,
            or_(
                TeachingResource.name.ilike(pattern),
                TeachingResource.description.ilike(pattern),
                TeachingResource.tags.ilike(pattern),
                TeachingResource.category.ilike(pattern),
            ),
        )
        .order_by(TeachingResource.upload_time.desc())
        .limit(limit * 2)
        .all()
    )

    results: List[Dict[str, Any]] = []
    for row in rows:
        score = _score_text_fields(query, row.name, row.description, row.tags, row.category)
        if score <= 0:
            continue
        resource_type = (
            row.resource_type.value
            if hasattr(row.resource_type, "value")
            else str(row.resource_type)
        )
        fmt = row.format.value if hasattr(row.format, "value") else str(row.format)
        results.append(
            {
                "id": str(row.id),
                "title": row.name,
                "description": (row.description or "")[:200],
                "type": "local",
                "local_type": resource_type,
                "format": fmt,
                "source": "机构本地",
                "subject": row.category,
                "grade_level": row.difficulty_level or "",
                "url": "",
                "score": score,
            }
        )
    return results


def _search_scied_libraries(
    org: Organization,
    query: str,
    resource_type: str,
    limit: int,
) -> List[Dict[str, Any]]:
    if not is_integration_enabled(org):
        return []
    try:
        client = get_client_for_org(org)
        payload = client.search_libraries(q=query, type_=resource_type, limit=limit)
    except OpenSciEdUpstreamError:
        return []

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        return []

    results: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        results.append(
            {
                "id": str(item.get("id") or ""),
                "title": item.get("title") or "",
                "description": (item.get("description") or "")[:200],
                "type": item.get("type") or "tutorial",
                "source": item.get("source") or "OpenMTSciEd",
                "subject": item.get("subject") or "",
                "grade_level": item.get("grade_level") or "",
                "url": item.get("url") or "",
                "score": int(item.get("score") or 0),
            }
        )
    return results


def unified_search(
    db: Session,
    org: Organization,
    org_id: int,
    query: str,
    *,
    resource_type: str = "all",
    limit: int = 20,
    include_local: bool = True,
    include_scied: bool = True,
) -> Dict[str, Any]:
    q = query.strip()
    if not q:
        return {"query": q, "items": [], "total": 0, "sources": {"local": 0, "scied": 0}}

    per_source_limit = max(limit, 10)
    local_items: List[Dict[str, Any]] = []
    scied_items: List[Dict[str, Any]] = []

    if include_local:
        local_items = _search_local_resources(db, org_id, q, per_source_limit)
    if include_scied:
        scied_items = _search_scied_libraries(org, q, resource_type, per_source_limit)

    merged = local_items + scied_items
    merged.sort(key=lambda x: x.get("score", 0), reverse=True)
    items = merged[:limit]

    return {
        "query": q,
        "items": items,
        "total": len(merged),
        "sources": {
            "local": len(local_items),
            "scied": len(scied_items),
        },
    }
