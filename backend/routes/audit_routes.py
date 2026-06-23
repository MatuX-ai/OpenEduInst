"""
审计日志 API 路由

提供给系统管理员 / 机构管理员使用的审计查询接口。
- 支持分页、按操作类型、时间范围、用户、IP、风险等级筛选
- 提供统计汇总接口（最近24h操作分布、高风险事件、按用户统计等）
- 支持导出 CSV
- 仅 ADMIN / SUPER_ADMIN 角色可访问
"""

from __future__ import annotations

import csv
import io
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse

from middleware.audit_middleware import OPERATION_MAP  # 复用已注册的 operation 列表
from utils.auth_utils import require_role, require_org_context

router = APIRouter(prefix="/api/v1/audit", tags=["审计日志"])


# -------- 配置 --------
AUDIT_LOG_FILE = os.getenv("AUDIT_LOG_FILE", "logs/audit.log")
# 单次查询最多返回多少行（避免内存占用过多）
MAX_PAGE_SIZE = int(os.getenv("AUDIT_MAX_PAGE_SIZE", "200"))
# 允许查询的历史范围（天），超期日志由日志系统自动归档
MAX_HISTORY_DAYS = int(os.getenv("AUDIT_MAX_HISTORY_DAYS", "30"))


# -------- 权限控制 --------
# 仅 ADMIN / SUPER_ADMIN 可以调用审计接口
def _require_admin(ctx=Depends(require_org_context)) -> tuple:
    user, org_id = ctx
    # 角色信息由 auth_utils 中的认证流程注入
    role = getattr(user, "role", None)
    role_str = str(role).upper() if role else ""
    if role_str not in ("ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问审计日志")
    return user, org_id


# -------- 工具函数 --------
def _iter_audit_lines(log_file: str, from_ts: Optional[datetime], to_ts: Optional[datetime]):
    """懒加载遍历审计日志文件的 JSON 行"""
    path = Path(log_file)
    if not path.exists():
        return
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            # ts 过滤
            rec_ts = record.get("ts")
            if rec_ts and (from_ts or to_ts):
                try:
                    dt = datetime.fromisoformat(rec_ts.replace("Z", "+00:00"))
                    if from_ts and dt < from_ts:
                        continue
                    if to_ts and dt > to_ts:
                        continue
                except (ValueError, TypeError):
                    pass
            yield record


def _match_filters(
    record: dict,
    *,
    operation: Optional[str],
    user: Optional[str],
    org_id: Optional[int],
    ip: Optional[str],
    risk_level: Optional[str],
    methods: Optional[List[str]],
) -> bool:
    if operation and record.get("operation") != operation:
        return False
    if user and (record.get("user") or "") != user:
        return False
    if org_id is not None and record.get("org_id") != org_id:
        # 普通机构管理员只能看自己机构的
        return False
    if ip and (record.get("ip") or "") != ip:
        return False
    if risk_level and (record.get("risk_level") or "normal") != risk_level:
        return False
    if methods and record.get("method") not in methods:
        return False
    return True


# -------- 路由 --------
@router.get("/logs")
def get_audit_logs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE, description="每页条数"),
    operation: Optional[str] = Query(None, description="操作类型，如 CREATE_STUDENT"),
    user: Optional[str] = Query(None, description="用户名"),
    ip: Optional[str] = Query(None, description="IP 地址"),
    risk_level: Optional[str] = Query(None, description="风险等级: normal / warning / high"),
    method: Optional[str] = Query(None, description="HTTP 方法: GET / POST / PUT / DELETE"),
    hours: int = Query(24, ge=1, le=MAX_HISTORY_DAYS * 24, description="查询最近多少小时"),
    ctx: tuple = Depends(_require_admin),
):
    """查询审计日志（分页）。ADMIN 仅可查看所属机构的日志。"""
    _, org_id = ctx

    from_ts = datetime.now(timezone.utc) - timedelta(hours=hours)
    to_ts = datetime.now(timezone.utc)
    methods = [method.upper()] if method else None

    matching: List[dict] = []
    total = 0

    for record in _iter_audit_lines(AUDIT_LOG_FILE, from_ts, to_ts):
        if not _match_filters(
            record,
            operation=operation,
            user=user,
            org_id=org_id,
            ip=ip,
            risk_level=risk_level,
            methods=methods,
        ):
            continue
        total += 1
        matching.append(record)

    # 按时间倒序，最新的在前
    matching.sort(key=lambda r: r.get("ts", ""), reverse=True)

    start = (page - 1) * page_size
    end = start + page_size
    paged = matching[start:end]

    return {
        "success": True,
        "data": {
            "items": paged,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "查询成功",
    }


@router.get("/logs/export")
def export_audit_logs(
    hours: int = Query(24, ge=1, le=MAX_HISTORY_DAYS * 24, description="导出最近多少小时"),
    operation: Optional[str] = Query(None, description="按操作类型筛选"),
    risk_level: Optional[str] = Query(None, description="风险等级"),
    ctx: tuple = Depends(_require_admin),
):
    """以 CSV 格式导出审计日志"""
    _, org_id = ctx
    from_ts = datetime.now(timezone.utc) - timedelta(hours=hours)

    columns = [
        "ts", "user", "org_id", "role", "ip", "ip_location",
        "method", "path", "operation", "status", "took_ms",
        "risk_level", "request_body",
    ]

    def _generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(columns)
        yield buf.getvalue()
        buf.truncate(0)
        buf.seek(0)

        for record in _iter_audit_lines(AUDIT_LOG_FILE, from_ts, None):
            if not _match_filters(
                record,
                operation=operation,
                user=None,
                org_id=org_id,
                ip=None,
                risk_level=risk_level,
                methods=None,
            ):
                continue
            row = [str(record.get(c, "")) for c in columns]
            writer.writerow(row)
            yield buf.getvalue()
            buf.truncate(0)
            buf.seek(0)

    filename = f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        _generate(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/stats/summary")
def get_audit_summary(
    hours: int = Query(24, ge=1, le=MAX_HISTORY_DAYS * 24, description="最近多少小时"),
    ctx: tuple = Depends(_require_admin),
):
    """获取审计统计摘要：按操作类型、风险等级、用户统计"""
    _, org_id = ctx
    from_ts = datetime.now(timezone.utc) - timedelta(hours=hours)

    operation_stats: dict = {}
    risk_stats: dict = {"normal": 0, "warning": 0, "high": 0}
    user_stats: dict = {}
    total = 0

    for record in _iter_audit_lines(AUDIT_LOG_FILE, from_ts, None):
        if record.get("org_id") is not None and record.get("org_id") != org_id:
            continue
        total += 1

        op = record.get("operation") or "UNKNOWN"
        operation_stats[op] = operation_stats.get(op, 0) + 1

        rl = record.get("risk_level") or "normal"
        risk_stats[rl] = risk_stats.get(rl, 0) + 1

        u = record.get("user") or "anonymous"
        user_stats[u] = user_stats.get(u, 0) + 1

    # 只返回前 20 名活跃用户
    top_users = sorted(user_stats.items(), key=lambda x: -x[1])[:20]

    # 高风险事件取最近10条
    high_risk_events: List[dict] = []
    for record in _iter_audit_lines(AUDIT_LOG_FILE, from_ts, None):
        if record.get("risk_level") in ("high", "warning") and record.get("org_id") in (org_id, None):
            high_risk_events.append(record)
        if len(high_risk_events) >= 20:
            break

    return {
        "success": True,
        "data": {
            "total_events": total,
            "operation_stats": operation_stats,
            "risk_stats": risk_stats,
            "top_users": [{"user": u, "count": c} for u, c in top_users],
            "high_risk_events": high_risk_events[:10],
            "period_hours": hours,
        },
        "message": "汇总查询成功",
    }


@router.get("/operations")
def list_operations(_=Depends(_require_admin)):
    """获取已注册的操作类型列表，供前端筛选器使用"""
    return {
        "success": True,
        "data": list(OPERATION_MAP.values()),
        "message": "ok",
    }


@router.get("/logs/{request_id}")
def get_audit_detail(
    request_id: str,
    ctx: tuple = Depends(_require_admin),
):
    """按 request_id 检索某条日志的完整信息"""
    _, org_id = ctx

    for record in _iter_audit_lines(AUDIT_LOG_FILE, None, None):
        if record.get("request_id") == request_id:
            # 越权检查：不允许看其他机构的日志
            if record.get("org_id") is not None and record.get("org_id") != org_id:
                raise HTTPException(status_code=403, detail="无权查看该日志")
            return {"success": True, "data": record, "message": "ok"}

    raise HTTPException(status_code=404, detail="未找到对应的日志")
