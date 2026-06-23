"""
OpenMTSciEd API 客户端（服务端代理用）

浏览器不得直连 OpenMTSciEd；由 EduInst 后端携带 API Key 转发请求。
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import HTTPException

from config.settings import settings
from models.license import Organization

logger = logging.getLogger(__name__)


class OpenSciEdIntegrationError(Exception):
    """集成未启用或配置缺失"""

    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


class OpenSciEdUpstreamError(Exception):
    """上游 OpenMTSciEd 请求失败"""

    def __init__(self, message: str, status_code: int = 502):
        self.status_code = status_code
        super().__init__(message)


def normalize_api_root(base: str) -> str:
    """将 OPENSCIEDU_API_BASE 规范为 .../api/v1"""
    root = (base or "").rstrip("/")
    if root.endswith("/api/v1"):
        return root
    if root.endswith("/api"):
        return f"{root}/v1"
    return f"{root}/api/v1"


def normalize_web_base(explicit: str = "", api_base: str = "") -> str:
    """OpenMTSciEd Web/桌面 SPA 根地址（课题工作室深链）"""
    if explicit and explicit.strip():
        return explicit.strip().rstrip("/")
    root = (api_base or settings.OPENSCIEDU_API_BASE or "").rstrip("/")
    if root.endswith("/api/v1"):
        return root[: -len("/api/v1")]
    if root.endswith("/api"):
        return root[: -len("/api")]
    return root or "https://opensciedu.matux.tech"


def build_topic_studio_url(draft_id: Optional[str] = None) -> str:
    base = normalize_web_base(settings.OPENSCIEDU_WEB_BASE, settings.OPENSCIEDU_API_BASE)
    if draft_id:
        return f"{base}/topic-studio/{draft_id}"
    return f"{base}/topic-studio"


def resolve_api_key(org: Organization) -> Optional[str]:
    org_key = (org.opensciedu_api_key or "").strip()
    if org_key:
        return org_key
    platform_key = (settings.OPENSCIEDU_API_KEY or "").strip()
    return platform_key or None


def is_integration_enabled(org: Organization) -> bool:
    """机构已启用，或平台级 Key 可用（演示/开发）"""
    if org.opensciedu_api_enabled:
        return resolve_api_key(org) is not None
    platform_key = (settings.OPENSCIEDU_API_KEY or "").strip()
    return bool(platform_key)


def require_integration(org: Organization) -> str:
    if not is_integration_enabled(org):
        raise OpenSciEdIntegrationError(
            "OPENSCIEDU_DISABLED",
            "OpenMTSciEd 集成未启用，请在系统设置中配置或联系管理员",
        )
    api_key = resolve_api_key(org)
    if not api_key:
        raise OpenSciEdIntegrationError(
            "OPENSCIEDU_DISABLED",
            "缺少 OpenMTSciEd API Key",
        )
    return api_key


def mask_api_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    if len(key) <= 4:
        return "****"
    return f"****{key[-4:]}"


def rewrite_cdn_urls(payload: Any) -> Any:
    """将相对资源 URL 重写为 CDN 绝对地址"""
    cdn_base = (settings.OPENSCIEDU_CDN_BASE or "").rstrip("/")
    if not cdn_base:
        return payload

    url_fields = ("file_url", "thumbnail_url", "url", "cover_url", "download_url")

    if isinstance(payload, dict):
        out = {}
        for k, v in payload.items():
            if k in url_fields and isinstance(v, str) and v and not v.startswith(("http://", "https://")):
                out[k] = urljoin(f"{cdn_base}/", v.lstrip("/"))
            elif isinstance(v, (dict, list)):
                out[k] = rewrite_cdn_urls(v)
            else:
                out[k] = v
        return out
    if isinstance(payload, list):
        return [rewrite_cdn_urls(item) for item in payload]
    return payload


class OpenSciEdClient:
    def __init__(self, api_key: str, org_id: Optional[int] = None):
        self.api_root = normalize_api_root(settings.OPENSCIEDU_API_BASE)
        self.api_key = api_key
        self.org_id = org_id
        self.timeout = settings.OPENSCIEDU_API_TIMEOUT

    def _headers(self) -> Dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["X-API-Key"] = self.api_key
        return headers

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_resource: Optional[str] = None,
    ) -> Any:
        if (
            method.upper() == "GET"
            and use_cache
            and self.org_id is not None
            and cache_resource
        ):
            from utils.opensciedu_cache import get_cached, set_cached

            cached = get_cached(self.org_id, cache_resource, params)
            if cached is not None:
                return cached
            data = self._raw_request(method, path, params=params, json_body=json_body)
            set_cached(self.org_id, cache_resource, data, params)
            return data
        return self._raw_request(method, path, params=params, json_body=json_body)

    def _raw_request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> Any:
        path = path if path.startswith("/") else f"/{path}"
        url = f"{self.api_root}{path}"
        started = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.request(
                    method,
                    url,
                    params=params,
                    json=json_body,
                    headers=self._headers(),
                )
        except httpx.RequestError as exc:
            logger.warning("OpenMTSciEd 上游不可达: %s %s", url, exc)
            raise OpenSciEdUpstreamError(
                f"OpenMTSciEd 服务不可达: {exc}",
                status_code=502,
            ) from exc

        latency_ms = int((time.perf_counter() - started) * 1000)
        logger.debug(
            "OpenMTSciEd %s %s -> %s (%sms)",
            method,
            url,
            response.status_code,
            latency_ms,
        )

        if response.status_code >= 400:
            detail = response.text[:500] if response.text else response.reason_phrase
            raise OpenSciEdUpstreamError(
                f"OpenMTSciEd 上游错误 ({response.status_code}): {detail}",
                status_code=502,
            )

        if not response.content:
            return {}
        try:
            data = response.json()
        except ValueError as exc:
            raise OpenSciEdUpstreamError(
                "OpenMTSciEd 返回非 JSON 响应",
                status_code=502,
            ) from exc
        return rewrite_cdn_urls(data)

    def health_check(self) -> Dict[str, Any]:
        started = time.perf_counter()
        try:
            with httpx.Client(timeout=min(self.timeout, 10)) as client:
                # 优先 /api/health，否则用 tutorials 探测
                parsed = urlparse(self.api_root)
                health_url = f"{parsed.scheme}://{parsed.netloc}/api/health"
                response = client.get(health_url, headers=self._headers())
                connected = response.status_code < 500
        except httpx.RequestError:
            connected = False
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {
            "connected": connected,
            "upstream": self.api_root,
            "latency_ms": latency_ms,
        }

    def get_tutorials(
        self,
        page: int = 1,
        size: int = 20,
        subject: Optional[str] = None,
        grade_level: Optional[str] = None,
        use_cache: bool = True,
    ) -> Any:
        params: Dict[str, Any] = {"page": page, "size": size}
        if subject:
            params["subject"] = subject
        if grade_level:
            params["grade_level"] = grade_level
        return self.request(
            "GET", "/tutorials", params=params, use_cache=use_cache, cache_resource="tutorials"
        )

    def get_tutorial(self, tutorial_id: str) -> Any:
        return self.request(
            "GET",
            f"/tutorials/{tutorial_id}",
            use_cache=False,
            cache_resource=f"tutorial:{tutorial_id}",
        )

    def get_coursewares(
        self,
        page: int = 1,
        size: int = 20,
        subject: Optional[str] = None,
        grade_level: Optional[str] = None,
        type_: Optional[str] = None,
        use_cache: bool = True,
    ) -> Any:
        params: Dict[str, Any] = {"page": page, "size": size}
        if subject:
            params["subject"] = subject
        if grade_level:
            params["grade_level"] = grade_level
        if type_:
            params["type"] = type_
        return self.request(
            "GET", "/coursewares", params=params, use_cache=use_cache, cache_resource="coursewares"
        )

    def get_hardware_projects(
        self,
        page: int = 1,
        size: int = 20,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        subject: Optional[str] = None,
        use_cache: bool = True,
    ) -> Any:
        params: Dict[str, Any] = {"page": page, "size": size}
        if difficulty:
            params["difficulty"] = difficulty
        if category:
            params["category"] = category
        if subject:
            params["subject"] = subject
        return self.request(
            "GET",
            "/hardware-projects",
            params=params,
            use_cache=use_cache,
            cache_resource="hardware-projects",
        )

    def get_libraries_stats(self, use_cache: bool = True) -> Any:
        return self.request(
            "GET",
            "/libraries/stats",
            use_cache=use_cache,
            cache_resource="libraries-stats",
        )

    def get_recommendations(
        self,
        user_id: int,
        limit: int = 10,
        subject: Optional[str] = None,
        use_cache: bool = True,
    ) -> Any:
        params: Dict[str, Any] = {"user_id": str(user_id), "limit": str(limit)}
        if subject:
            params["subject"] = subject
        return self.request(
            "GET",
            "/knowledge-graph/recommend",
            params=params,
            use_cache=use_cache,
            cache_resource="recommendations",
        )

    def search_libraries(
        self,
        q: str,
        type_: str = "all",
        limit: int = 20,
        use_cache: bool = True,
    ) -> Any:
        params: Dict[str, Any] = {"q": q, "type": type_, "limit": str(limit)}
        return self.request(
            "GET",
            "/libraries/search",
            params=params,
            use_cache=use_cache,
            cache_resource="libraries-search",
        )

    def get_stats(self, use_cache: bool = True) -> Dict[str, int]:
        """聚合上游列表 total（失败项记 0）"""
        if use_cache and self.org_id is not None:
            from utils.opensciedu_cache import get_cached, set_cached

            cached = get_cached(self.org_id, "stats", None)
            if cached is not None:
                return cached

        stats = {"tutorials": 0, "coursewares": 0, "hardware_projects": 0}
        for key, fetch in (
            ("tutorials", lambda: self.get_tutorials(page=1, size=1, use_cache=use_cache)),
            ("coursewares", lambda: self.get_coursewares(page=1, size=1, use_cache=use_cache)),
            (
                "hardware_projects",
                lambda: self.get_hardware_projects(page=1, size=1, use_cache=use_cache),
            ),
        ):
            try:
                data = fetch()
                stats[key] = int(data.get("total", 0) if isinstance(data, dict) else 0)
            except OpenSciEdUpstreamError:
                logger.warning("OpenMTSciEd stats 拉取 %s 失败", key)

        if use_cache and self.org_id is not None:
            from utils.opensciedu_cache import set_cached

            set_cached(self.org_id, "stats", stats, None)
        return stats


def get_client_for_org(org: Organization) -> OpenSciEdClient:
    api_key = require_integration(org)
    return OpenSciEdClient(api_key, org_id=org.id)


def integration_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, OpenSciEdIntegrationError):
        return HTTPException(
            status_code=403,
            detail={"code": exc.code, "message": str(exc)},
        )
    if isinstance(exc, OpenSciEdUpstreamError):
        return HTTPException(
            status_code=exc.status_code,
            detail={"code": "OPENSCIEDU_UPSTREAM_ERROR", "message": str(exc)},
        )
    raise exc
