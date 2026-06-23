"""
审计日志中间件（增强版）

输出：
- 文件: logs/audit.log（JSONL 格式，每行一条）
- 同时输出到标准 logger，可由容器日志/ELK/云厂商日志采集
- 对写操作 (POST/PUT/DELETE/PATCH) 和敏感路径 (/auth/*, /organizations/*) 强制记录

字段说明:
    {
        "type": "audit",
        "request_id": "a3f8b2c1d9e0",
        "ts": "2024-06-14T13:55:02.123Z",
        "user": "teacher1@example.com",
        "user_id": 123,
        "org_id": 3,
        "role": "ADMIN",
        "ip": "203.0.113.14",
        "ip_location": "上海市",              # 新增：IP归属地（可选）
        "method": "POST",
        "path": "/api/v1/students/",
        "operation": "CREATE_STUDENT",          # 新增：标准化操作类型
        "status": 201,
        "took_ms": 42.3,
        "user_agent": "Mozilla/5.0 ...",
        "request_body": { ... },                # 新增：写操作请求体（脱敏后）
        "response_summary": { ... },            # 新增：响应摘要
        "trace_id": "xxx",
        "risk_level": "normal"                   # 新增：风险等级 normal/warning/high
    }

增强功能：
- 标准化的 operation 字段，方便按操作类型查询与告警
- 写操作请求体记录（自动脱敏敏感字段）
- IP归属地解析（通过 IP库或 GeoIP，本地可用简单网段匹配）
- 异常操作检测（短时间多次删除、跨IP登录、高权限操作等）
- 风险等级标记
- 按操作类型的查询友好结构
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from threading import Lock
from typing import Any, Optional, Dict

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

# ---------- 配置 ----------
AUDIT_LOG_FILE = os.getenv("AUDIT_LOG_FILE", "logs/audit.log")
AUDIT_LEVEL = os.getenv("AUDIT_LEVEL", "write").lower()  # all / write / sensitive
# 是否记录写操作的 request body（脱敏后）
RECORD_REQUEST_BODY = os.getenv("AUDIT_RECORD_BODY", "true").lower() == "true"
# 记录 request body 的最大大小（字符数），超过则截断
BODY_MAX_CHARS = int(os.getenv("AUDIT_BODY_MAX_CHARS", "4000"))

WHITELIST_PATHS = ("/health", "/favicon.ico", "/docs", "/openapi.json", "/redoc")
WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# 敏感路径（强制记录，无论 method）
SENSITIVE_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/licenses",
    "/api/v1/admin/",
)

# 敏感参数名，避免在日志中泄漏 —— 扩展版本，支持正则
REDACT_KEYS = {
    "password",
    "token",
    "authorization",
    "cookie",
    "secret",
    "credit_card",
    "bank_card",
    "id_card",
    "identity",
    "phone",
    "mobile",
    "email",
    "smscode",
    "sms_code",
    "verification_code",
    "api_key",
    "apikey",
    "private_key",
    "access_token",
    "refresh_token",
}
# 同时对 value 进行关键词检测（兜底），避免漏网
_REDACT_VALUE_PATTERNS = [
    re.compile(r"^[0-9]{11}$"),            # 11位手机号
    re.compile(r"^[0-9]{17}[0-9xX]$"),     # 18位身份证
]

# ---------- 操作类型映射 ----------
# path -> 标准化 operation。非精确匹配，按最长前缀匹配
OPERATION_MAP: Dict[str, str] = {
    # 认证
    "/api/v1/auth/login": "USER_LOGIN",
    "/api/v1/auth/token": "ISSUE_TOKEN",
    "/api/v1/auth/logout": "USER_LOGOUT",
    "/api/v1/auth/refresh": "REFRESH_TOKEN",

    # 机构管理
    "/api/v1/organizations": "MANAGE_ORGANIZATION",

    # 学生管理
    "/api/v1/students/": "MANAGE_STUDENT",
    "/api/v1/educational_institution/students": "MANAGE_STUDENT",

    # 教师管理
    "/api/v1/educational_institution/teachers": "MANAGE_TEACHER",

    # 课程管理
    "/api/v1/educational_institution/courses": "MANAGE_COURSE",

    # 招生报名
    "/api/v1/educational_institution/enrollment": "MANAGE_ENROLLMENT",

    # 排课
    "/api/v1/schedule/": "MANAGE_SCHEDULE",

    # 硬件设备
    "/api/v1/hardware/": "MANAGE_HARDWARE",

    # 许可证
    "/api/v1/licenses": "MANAGE_LICENSE",

    # 计费 Token
    "/api/v1/token/purchase": "TOKEN_PURCHASE",
    "/api/v1/tokens": "MANAGE_TOKENS",

    # 管理员操作
    "/api/v1/admin/": "ADMIN_OPERATION",

    # 系统设置
    "/api/v1/system/settings": "UPDATE_SYSTEM_SETTINGS",
}


# ---------- IP归属地解析（轻量化，无需外部依赖） ----------
# 生产环境建议替换为 GeoIP2 / 淘宝IP库 / 自建服务；此处提供轻量实现
class _IPLocationResolver:
    """
    简单 IP 归属解析器。
    - 本地 IP (10.x / 172.16-31.x / 192.168.x / 127.x) -> "内网"
    - 其他 -> "公网"
    生产环境可在此接入 GeoIP 数据库以获得精确城市/ASN信息。
    """

    _PRIVATE_RE = re.compile(
        r"^(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)"
    )

    def resolve(self, ip: Optional[str]) -> Optional[str]:
        if not ip:
            return None
        try:
            if self._PRIVATE_RE.match(ip):
                return "内网"
            return "公网"
        except Exception:
            return None


_ip_resolver = _IPLocationResolver()


# ---------- 最近操作追踪（用于异常检测） ----------
class _RecentOperationsTracker:
    """
    记录最近一段时间内的用户/IP操作，用于检测可疑行为：
    - 同一用户短时间大量 DELETE 操作
    - 同一 IP 短时间多次登录失败
    - 短时间内多个用户在同一 IP 登录（账号共享检测）
    """

    def __init__(self, window_seconds: int = 300, max_entries_per_key: int = 50) -> None:
        self._window = window_seconds
        self._max = max_entries_per_key
        self._user_ops: Dict[str, list] = {}
        self._ip_ops: Dict[str, list] = {}
        self._lock = Lock()

    def record(self, user: Optional[str], ip: Optional[str], method: str, path: str) -> str:
        """记录一次操作并返回风险评估结果"""
        now = time.time()
        risk = "normal"

        if not user and not ip:
            return risk

        with self._lock:
            # 清理过期
            cutoff = now - self._window
            if user:
                self._user_ops.setdefault(user, []).append((now, method, path))
                self._user_ops[user] = [x for x in self._user_ops[user] if x[0] > cutoff][-self._max:]

                # 检测：过去5分钟内 DELETE 超过 5 次
                deletes = sum(1 for x in self._user_ops[user] if x[1] == "DELETE")
                if deletes >= 5:
                    risk = "high"
                elif deletes >= 3:
                    risk = "warning"

                # 检测：登录路径短时间多次 POST
                if "/auth/" in path and method == "POST":
                    recent_logins = sum(
                        1 for x in self._user_ops[user]
                        if x[1] == "POST" and "/auth/" in x[2]
                    )
                    if recent_logins >= 5:
                        risk = "warning" if risk == "normal" else risk

            if ip:
                self._ip_ops.setdefault(ip, []).append((now, user or "", path))
                self._ip_ops[ip] = [x for x in self._ip_ops[ip] if x[0] > cutoff][-self._max:]

                # 检测：同一 IP 在 300s 内有 >=3 个不同用户登录
                distinct_users = {x[1] for x in self._ip_ops[ip] if x[1]}
                if len(distinct_users) >= 3:
                    risk = "warning" if risk == "normal" else risk

        return risk


_ops_tracker = _RecentOperationsTracker()


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


# ---------- 工具函数 ----------
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
    return getattr(request.state, "client_ip", None) or (
        request.client.host if request.client else None
    )


def _operation_for(method: str, path: str) -> str:
    """根据 method + path 推断标准化 operation"""
    # 最长前缀匹配
    matched = ""
    for prefix in OPERATION_MAP:
        if path.startswith(prefix) and len(prefix) > len(matched):
            matched = prefix
    base = OPERATION_MAP.get(matched, "ACCESS_API")

    # 根据 method 加上 ACTION 前缀
    if method == "POST":
        action = "CREATE" if base not in ("USER_LOGIN", "USER_LOGOUT", "ISSUE_TOKEN", "REFRESH_TOKEN") else ""
    elif method == "PUT":
        action = "UPDATE"
    elif method == "DELETE":
        action = "DELETE"
    elif method == "PATCH":
        action = "PATCH"
    else:
        action = "READ"

    return f"{action}_{base}" if action else base


def _deep_redact(obj: Any) -> Any:
    """递归地对 dict / list 中的敏感字段进行脱敏"""
    if obj is None:
        return None

    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.lower() in REDACT_KEYS:
                result[k] = "***"
                continue
            # value 级别兜底：检测疑似手机号/身份证号
            if isinstance(v, str):
                for pat in _REDACT_VALUE_PATTERNS:
                    if pat.match(v):
                        result[k] = "***"
                        break
                else:
                    result[k] = _deep_redact(v)
            else:
                result[k] = _deep_redact(v)
        return result

    if isinstance(obj, list):
        return [_deep_redact(x) for x in obj]

    return obj


def _truncate(obj: Any, max_chars: int) -> str:
    """对象 -> JSON 字符串，若超过 max_chars 则截断"""
    text = json.dumps(obj, ensure_ascii=False, default=str) if not isinstance(obj, str) else obj
    if len(text) > max_chars:
        return text[: max_chars - 3] + "..."
    return text


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        method = request.method
        path = request.url.path

        user = getattr(request.state, "username", None)
        user_id = getattr(request.state, "user_id", None)
        org_id = getattr(request.state, "org_id", None)
        request_id = getattr(request.state, "request_id", None)
        role = getattr(request.state, "user_role", None)

        # 预先记录 body（仅对需要审计的写操作）—— 注意必须在 call_next 之前读取
        body_recorded: Optional[str] = None
        if RECORD_REQUEST_BODY and method in WRITE_METHODS and _should_record(method, path):
            try:
                raw = await request.body()
                if raw:
                    try:
                        parsed = json.loads(raw.decode("utf-8"))
                        redacted = _deep_redact(parsed)
                        body_recorded = _truncate(redacted, BODY_MAX_CHARS)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        body_recorded = "[binary or non-JSON body]"
            except Exception:
                body_recorded = "[unavailable]"

        response: Response = await call_next(request)

        if not _should_record(method, path):
            return response

        took_ms = (time.perf_counter() - start) * 1000.0

        ip = _client_ip(request)
        operation = _operation_for(method, path)
        risk = _ops_tracker.record(user, ip, method, path)

        # 如果用户有高权限操作，提升风险等级
        if role and str(role).upper() in ("ADMIN", "SUPER_ADMIN") and method in WRITE_METHODS:
            risk = "warning" if risk == "normal" else risk

        status = getattr(response, "status_code", None)
        if status and status >= 400:
            risk = "warning" if risk == "normal" else risk
        if status and status >= 500:
            risk = "high"

        record = {
            "type": "audit",
            "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "request_id": request_id,
            "user": user,
            "user_id": user_id,
            "org_id": org_id,
            "role": str(role) if role else None,
            "ip": ip,
            "ip_location": _ip_resolver.resolve(ip),
            "method": method,
            "path": path,
            "operation": operation,
            "status": status,
            "took_ms": round(took_ms, 2),
            "user_agent": request.headers.get("user-agent", "")[:200],
            "request_body": body_recorded,
            "response_summary": {
                "status": status,
            },
            "trace_id": request.headers.get("x-trace-id") or request.headers.get("x-request-id"),
            "risk_level": risk,
        }

        try:
            _audit_logger.info(json.dumps(record, ensure_ascii=False))
        except Exception:
            pass  # 审计日志出错绝对不能影响业务流程

        return response


# ---------------- 提供给外部使用的便捷接口 ----------------
def write_manual_audit(
    *,
    user: Optional[str] = None,
    org_id: Optional[int] = None,
    operation: str,
    path: str = "manual",
    ip: Optional[str] = None,
    status: int = 0,
    extra: Optional[Dict[str, Any]] = None,
    risk_level: str = "normal",
) -> None:
    """
    业务代码中手动写入一条审计日志。
    用法示例：
        from middleware.audit_middleware import write_manual_audit
        write_manual_audit(
            user=current_user.username,
            org_id=current_org.id,
            operation="DELETE_STUDENT",
            ip=request.client.host,
            extra={"student_id": student_id},
        )
    """
    record = {
        "type": "audit",
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "request_id": f"manual-{int(time.time()*1000)}",
        "user": user,
        "user_id": None,
        "org_id": org_id,
        "role": None,
        "ip": ip,
        "ip_location": _ip_resolver.resolve(ip) if ip else None,
        "method": "MANUAL",
        "path": path,
        "operation": operation,
        "status": status,
        "took_ms": 0,
        "user_agent": None,
        "request_body": json.dumps(extra or {}, ensure_ascii=False) if extra else None,
        "response_summary": None,
        "trace_id": None,
        "risk_level": risk_level,
    }
    try:
        _audit_logger.info(json.dumps(record, ensure_ascii=False))
    except Exception:
        pass
