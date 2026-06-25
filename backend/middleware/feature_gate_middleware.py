"""
功能网关中间件（Feature Gate Middleware）

拦截对已禁用功能的 API 请求，返回 HTTP 403 权限错误。
同时注入功能启用状态到 request.state，供业务层使用。
"""

from __future__ import annotations

import json
import logging
from typing import Optional, Dict, Set

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session

from utils.database import SessionLocal
from models.feature_flag import FeatureModule, OrgFeatureFlag

logger = logging.getLogger(__name__)

# 功能路由路径 -> feature_key 映射（用于拦截请求）
# 定义了需要功能开关控制的 API 路径前缀
FEATURE_ROUTE_MAP: Dict[str, str] = {
    "/api/v1/educational_institution/students": "student_management",
    "/api/v1/students": "student_management",
    "/api/v1/educational_institution/teachers": "teacher_management",
    "/api/v1/educational_institution/courses": "teaching_resources",
    "/api/v1/educational_institution/schedule": "schedule_management",
    "/api/v1/schedule": "schedule_management",
    "/api/v1/educational_institution/enrollment": "leads_management",
    "/api/v1/classrooms": "classroom_management",
    "/api/v1/hardware": "equipment_management",
    "/api/v1/resources": "teaching_resources",
    "/api/v1/competitions": "competition_management",
    "/api/v1/marketing": "marketing_center",
    "/api/v1/leads": "leads_management",
    "/api/v1/notifications": "notifications",
    "/api/v1/parent-portal": "parent_portal",
    "/api/v1/finance": "finance_management",
    "/api/v1/tokens": "token_management",
    "/api/v1/token": "token_management",
    "/api/v1/clubs": "stem_clubs",
    "/api/v1/consumable": "stem_consumables",
    "/api/v1/consumables": "stem_consumables",
    "/api/v1/exam": "exam_management",
    "/api/v1/vocational/equipment": "vocational_equipment",
    "/api/v1/vocational/safety": "vocational_safety",
    "/api/v1/vocational/courses": "vocational_courses",
    "/api/v1/vocational/enterprises": "vocational_enterprise",
    "/api/v1/vocational/assessments": "vocational_assessment",
    "/api/v1/backup": "backup_management",
    "/api/v1/ai-assistant": "ai_assistant",
    "/api/v1/ai_assistant": "ai_assistant",
}

# 白名单路径（这些路径不进行功能检查）
WHITELIST_PATHS = (
    "/health",
    "/favicon.ico",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/v1/auth",
    "/api/v1/features",
    "/api/v1/tenant",
    "/api/v1/system",
    "/api/v1/organizations",
    "/api/v1/educational_institution/overview",
    "/api/v1/educational_institution/dashboard",
    "/api/v1/educational_institution/metrics",
    "/api/v1/educational_institution/organization",
)


class FeatureGateMiddleware(BaseHTTPMiddleware):
    """
    功能网关中间件。
    
    功能：
    - 拦截对已禁用功能对应的 API 请求，返回 403 错误
    - 将当前机构的功能启用状态缓存到 request.state.feature_gates
    - 白名单路径跳过检查
    """

    def __init__(self, app, *args, **kwargs):
        super().__init__(app, *args, **kwargs)
        # 缓存已加载的 org_id -> {feature_key: is_enabled}
        self._cache: Dict[int, Dict[str, bool]] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        path = request.url.path

        # 跳过白名单路径
        if self._is_whitelisted(path):
            return await call_next(request)

        # 匹配功能路由
        feature_key = self._match_feature_route(path)
        if not feature_key:
            return await call_next(request)

        # 获取 org_id
        org_id = getattr(request.state, "org_id", None)
        if org_id is None:
            # 未登录或未选择机构的请求，跳过功能检查
            return await call_next(request)

        # 检查功能是否启用
        try:
            is_enabled = self._check_feature_enabled(org_id, feature_key)
            if not is_enabled:
                logger.info(
                    "功能网关拦截: org_id=%s, feature=%s, path=%s",
                    org_id, feature_key, path,
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "error": {
                            "code": "FEATURE_DISABLED",
                            "message": f"该功能已被管理员禁用（{feature_key}），请联系管理员启用",
                        },
                        "data": None,
                    },
                )

            # 注入功能状态
            if not hasattr(request.state, "feature_gates"):
                request.state.feature_gates = {}
            request.state.feature_gates[feature_key] = True

        except Exception as exc:
            logger.warning("功能网关检查异常（非阻塞放行）: %s", exc)

        return await call_next(request)

    def _is_whitelisted(self, path: str) -> bool:
        for prefix in WHITELIST_PATHS:
            if path.startswith(prefix):
                return True
        return False

    def _match_feature_route(self, path: str) -> Optional[str]:
        """匹配路径对应的功能 key（最长前缀匹配）"""
        matched = ""
        matched_key = None
        for prefix, key in FEATURE_ROUTE_MAP.items():
            if path.startswith(prefix) and len(prefix) > len(matched):
                matched = prefix
                matched_key = key
        return matched_key

    def _check_feature_enabled(self, org_id: int, feature_key: str) -> bool:
        """检查指定机构的功能是否启用（带缓存）"""
        # 先查缓存
        if org_id in self._cache and feature_key in self._cache[org_id]:
            return self._cache[org_id][feature_key]

        # 从数据库查询
        db: Session = SessionLocal()
        try:
            module = db.query(FeatureModule).filter(
                FeatureModule.feature_key == feature_key,
                FeatureModule.is_active == True,
            ).first()

            if not module:
                # 模块未定义时默认放行
                self._cache.setdefault(org_id, {})[feature_key] = True
                return True

            org_flag = db.query(OrgFeatureFlag).filter(
                OrgFeatureFlag.org_id == org_id,
                OrgFeatureFlag.feature_id == module.id,
            ).first()

            if org_flag:
                is_enabled = org_flag.is_enabled
            else:
                is_enabled = module.is_enabled_by_default

            self._cache.setdefault(org_id, {})[feature_key] = is_enabled
            return is_enabled
        finally:
            db.close()


# 便捷函数：在业务代码中检查功能是否启用
def is_feature_enabled(request: Request, feature_key: str) -> bool:
    """
    在业务路由中检查功能是否启用。
    使用方式：
        from middleware.feature_gate_middleware import is_feature_enabled
        if not is_feature_enabled(request, "student_management"):
            raise HTTPException(status_code=403, detail="功能已禁用")
    """
    gates = getattr(request.state, "feature_gates", {})
    return gates.get(feature_key, True)