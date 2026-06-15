"""
审计日志中间件

输出：
- 文件: logs/audit.log（JSONL 格式，每行一条）
- 同时输出到标准 logger，可由容器日志/ELK/云厂商日志采集
- 对写操作 (POST/PUT/DELETE/PATCH) 和敏感路径 (/auth/*, /organizations/*) 强制记录

字段示例:
    {
        "type": "audit",
        "request_id": "a3f8b2c1d9e0",
        "ts": "2024-06-14T13:55:02.123Z",
        "user": "teacher1@example.com",
        "org_id": 3,
        "ip": "203.0.113.14",
        "method": "POST",
        "path": "/api/v1/students/",
        "status": 201,
        "took_ms": 42.3,
        "user_agent": "Mozilla/5.0 ...",
        "trace_id": "xxx"  # 若存在
    }
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

# ---------- 配置 ----------
AUDIT_LOG_FILE = os.getenv("AUDIT_LOG_FILE", "logs/audit.log")
AUDIT_LEVEL = os.getenv("AUDIT_LEVEL", "write").lower()  # all / write / sensitive

WHITELIST_PATHS = ("/health", "/favicon.ico", "/docs", "/openapi.json", "/redoc")
WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}
SENSITIVE_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/organizations/",
    "/api/v1/licenses",
)

# 敏感参数名，避免在日志中泄漏
REDACT_KEYS = {
    "password",
    "token",
    "authorization",
    "cookie",
    "secret",
    "credit_card",
}


# ---------- 日志初始化 ----------
_log_dir = Path(AUDIT_LOG_FILE).parent
if _log_dir and str(_log_dir) != ".":
    try:
        _log_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

_audit_logger = logging.getLogger("audit")
_audit_logger.setLevel(logging.INFO)
# 避免重复 handler （可能被多次 import）
if not any(isinstance(h, logging.FileHandler) and getattr(h, "_audit", False) for h in _audit_logger.handlers):
    try:
        _fh = logging.FileHandler(AUDIT_LOG_FILE, encoding="utf-8")
        _fh.setFormatter(logging.Formatter("%(message)s"))
        _fh._audit = True  # type: ignore[attr-defined]
        _audit_logger.addHandler(_fh)
        # 禁止向上传播到 root logger（避免重复）
        _audit_logger.propagate = False
    except OSError:
        # 写文件失败则退回到 stdout
        pass


def _should_record(method: str, path: str) -> bool:
    if path.startswith(WHITELIST_PATHS):
        return False
    if AUDIT_LEVEL == "all":
        return True
    if AUDIT_LEVEL == "sensitive":
        return method in WRITE_METHODS or path.startswith(SENSITIVE_PREFIXES)
    # 默认 write 级别
    return method in WRITE_METHODS or path.startswith(SENSITIVE_PREFIXES)


def _client_ip(request: Request) -> str:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    cf = request.headers.get("CF-Connecting-IP")
    if cf:
        return cf
    return getattr(request.client, "host", None) if request.client else None


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        method = request.method
        path = request.url.path
        query = request.url.query

        user = getattr(request.state, "username", None)
        org_id = getattr(request.state, "org_id", None)
        request_id = getattr(request.state, "request_id", None)

        response: Response = await call_next(request)

        if not _should_record(method, path):
            return response

        took_ms = (time.perf_counter() - start) * 1000.0

        # 对 query 参数做脱敏
        redacted_query = None
        if query:
            parts = []
            for pair in query.split("&"):
                if "=" in pair:
                    k, _, v = pair.partition("=")
                    if k.lower() in REDACT_KEYS:
                        v = "***"
                    parts.append(f"{k}={v}")
                else:
                    parts.append(pair)
            redacted_query = "&".join(parts)

        record = {
            "type": "audit",
            "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "request_id": request_id,
            "user": user,
            "org_id": org_id,
            "ip": _client_ip(request),
            "method": method,
            "path": path,
            "query": redacted_query,
            "status": getattr(response, "status_code", None),
            "took_ms": round(took_ms, 2),
            "user_agent": request.headers.get("user-agent", "")[:200],
            "trace_id": request.headers.get("x-trace-id") or request.headers.get("x-request-id"),
        }

        try:
            _audit_logger.info(json.dumps(record, ensure_ascii=False))
        except Exception:
            pass  # 审计日志出错绝对不能影响业务流程

        return response
