"""
数据脱敏工具（增强版）

场景：
- 手机号、身份证号、姓名、邮箱、银行卡号等个人敏感信息展示前进行脱敏处理
- 符合《个人信息保护法》最小化展示要求
- 提供 @mask_response 装饰器，对 FastAPI 路由的响应进行自动脱敏

脱敏规则：
- 手机号：保留前 3 位和后 4 位，中间 4 位以 * 替代（如 138****5678）
- 身份证号：保留前 6 位 + **** + 后 4 位
- 邮箱：用户名首字符保留，其余 * 替代，保留完整域名（g****@example.com）
- 姓名：2 字保留姓 + *（张*）；3 字及以上保留姓 + * + 末字（张*三）
- 银行卡：保留后 4 位，其余 *
- 通用：长字符串保留首尾字符，中间 *
"""

from __future__ import annotations

import copy
import logging
import re
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


# ================= 基础脱敏函数 =================
def mask_phone(phone: Optional[str]) -> str:
    if not phone:
        return ""
    s = str(phone).strip()
    if len(s) < 7:
        return s
    return f"{s[:3]}****{s[-4:]}"


def mask_id_card(id_card: Optional[str]) -> str:
    if not id_card:
        return ""
    s = str(id_card).strip()
    if len(s) < 10:
        return s
    return f"{s[:6]}****{s[-4:]}"


def mask_email(email: Optional[str]) -> str:
    if not email or "@" not in email:
        return email or ""
    name, domain = email.split("@", 1)
    if not name:
        return f"**@{domain}"
    if len(name) == 1:
        masked_name = name
    elif len(name) == 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
    return f"{masked_name}@{domain}"


def mask_name(name: Optional[str]) -> str:
    if not name:
        return ""
    s = str(name).strip()
    if len(s) == 1:
        return s
    if len(s) == 2:
        return s[0] + "*"
    return s[0] + "*" * (len(s) - 2) + s[-1]


def mask_bank_card(card: Optional[str]) -> str:
    if not card:
        return ""
    s = re.sub(r"\s+", "", str(card))
    if len(s) <= 4:
        return s
    return "*" * (len(s) - 4) + s[-4:]


def mask_generic(value: Optional[str], keep_head: int = 1, keep_tail: int = 1) -> str:
    if not value:
        return ""
    s = str(value)
    if len(s) <= keep_head + keep_tail:
        return s
    middle = "*" * (len(s) - keep_head - keep_tail)
    return s[:keep_head] + middle + (s[-keep_tail:] if keep_tail else "")


# ================= 字段 -> 函数映射表 =================
"""
示例：mask_dict(data, {"phone": "mask_phone", "id_card": "mask_id_card", ...})
"""
_FIELD_MAP = {
    "phone": mask_phone,
    "mobile": mask_phone,
    "mobile_phone": mask_phone,
    "tel": mask_phone,
    "id_card": mask_id_card,
    "idcard": mask_id_card,
    "identity": mask_id_card,
    "id_number": mask_id_card,
    "email": mask_email,
    "mail": mask_email,
    "name": mask_name,
    "real_name": mask_name,
    "full_name": mask_name,
    "user_name": mask_name,
    "username": mask_name,
    "bank_card": mask_bank_card,
    "credit_card": mask_bank_card,
    "card_no": mask_bank_card,
    "address": lambda v: mask_generic(v, 3, 3),
    "ip_address": lambda v: ".".join(v.split(".")[:2]) + ".*.*" if v and "." in v else v,
}


def mask_dict(data: Union[dict, list, None], fields: Optional[Dict[str, Union[str, Callable]]] = None) -> Any:
    """
    对 dict/list 中的指定字段进行脱敏。

    - 不修改原始对象（深拷贝）
    - fields 未提供时使用默认敏感字段映射（_FIELD_MAP）
    """
    if data is None:
        return None

    target_fields = fields or {k: v for k, v in _FIELD_MAP.items()}

    if isinstance(data, list):
        return [mask_dict(item, target_fields) for item in data]

    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            key_lower = key.lower().strip() if isinstance(key, str) else key
            if key_lower in target_fields:
                fn = target_fields[key_lower]
                if callable(fn):
                    result[key] = fn(value)
                elif isinstance(fn, str) and fn in globals():
                    result[key] = globals()[fn](value)
                else:
                    result[key] = value
            elif isinstance(value, (dict, list)):
                result[key] = mask_dict(value, target_fields)
            else:
                result[key] = value
        return result

    return data


# ================= 响应自动脱敏装饰器 =================
def mask_response(extra_fields: Optional[Dict[str, Union[str, Callable]]] = None) -> Callable:
    """
    FastAPI 路由函数的装饰器。对 route handler 返回的 dict / list 中的敏感字段自动脱敏。

    用法：
        @router.get("/users/{id}")
        @mask_response()
        def get_user(id: int):
            return {"name": "张三", "phone": "13812345678", "email": "zhangsan@example.com"}

        # 自定义额外字段
        @mask_response(extra_fields={"user_phone": "mask_phone", "secret": lambda v: "***"})
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            # 只对 dict/list 做脱敏
            if isinstance(result, (dict, list)):
                try:
                    merged = dict(_FIELD_MAP)
                    if extra_fields:
                        for k, v in extra_fields.items():
                            merged[k] = v
                    return mask_dict(result, merged)
                except Exception as exc:
                    logger.warning("响应脱敏失败 (%s)，返回原始结果", exc)
                    return result
            return result

        # 兼容 async
        import asyncio

        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                result = await func(*args, **kwargs)
                if isinstance(result, (dict, list)):
                    try:
                        merged = dict(_FIELD_MAP)
                        if extra_fields:
                            for k, v in extra_fields.items():
                                merged[k] = v
                        return mask_dict(result, merged)
                    except Exception as exc:
                        logger.warning("响应脱敏失败 (%s)，返回原始结果", exc)
                        return result
                return result

            return async_wrapper

        return wrapper

    return decorator


# ================= 便捷函数：仅脱敏用户列表中的敏感字段 =================
def mask_user_list(users: List[dict]) -> List[dict]:
    """只对用户列表的敏感字段脱敏，保留业务字段不变"""
    return [mask_dict(u) for u in users]


def mask_user(user: dict) -> dict:
    """单用户脱敏"""
    return mask_dict(user)
