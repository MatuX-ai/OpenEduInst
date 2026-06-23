"""
支付网关适配层（阶段三 3.2）

设计目标：
- 抽象统一接口（PaymentAdapter），未来接入 WeChat/Alipay/Bank 只需新增 adapter
- 默认实现 MockPaymentAdapter：用于开发/演示/沙箱
- 工厂方法 get_payment_adapter(method) 根据 payment_method 字符串返回对应 adapter

约束：
- 所有金额单位为「元」（Float），精度 2 位小数
- 订单号由调用方生成，本层不关心
- 返回值统一为 dict，key 包括：order_no / status / payment_url / transaction_id
"""

from __future__ import annotations

import logging
import secrets
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class PaymentError(Exception):
    """支付通用错误"""


class PaymentConfigError(PaymentError):
    """支付配置错误（缺少密钥等）"""


class PaymentGatewayError(PaymentError):
    """支付网关调用错误（超时/限流/系统错误）"""


# ---------- 抽象基类 ----------


class PaymentAdapter(ABC):
    """支付适配器抽象基类"""

    name: str = "base"

    @abstractmethod
    async def create_payment(
        self,
        order_no: str,
        amount: float,
        currency: str = "CNY",
        subject: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        调起支付

        Args:
            order_no: 业务订单号
            amount: 金额（元，> 0）
            currency: 货币
            subject: 商品描述
            metadata: 透传元数据

        Returns:
            dict: {order_no, status, payment_url, transaction_id, raw}
        """

    @abstractmethod
    async def query_payment(self, order_no: str) -> Dict[str, Any]:
        """查询支付状态"""

    @abstractmethod
    async def refund(
        self, order_no: str, refund_amount: float, reason: str = ""
    ) -> Dict[str, Any]:
        """申请退款（最小实现，返回 SUCCESS + 流水号）"""


# ---------- Mock 实现 ----------


class MockPaymentAdapter(PaymentAdapter):
    """
    沙箱/Mock 支付适配器

    行为：
    - create_payment：即时返回 PROCESSING 状态 + 内部确认链接
    - query_payment：始终返回 SUCCESS（开发期假定已支付）
    - refund：返回 REFUNDED
    """

    name = "mock"

    async def create_payment(
        self,
        order_no: str,
        amount: float,
        currency: str = "CNY",
        subject: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if amount <= 0:
            raise PaymentConfigError(f"金额必须大于 0，实际: {amount}")

        # 模拟网关处理耗时（开发期可关闭）
        # time.sleep(0.05)

        transaction_id = f"MOCK{secrets.token_hex(8).upper()}"

        # 内部确认链接：前端弹窗将 POST 到此路径
        payment_url = f"/api/v1/token-orders/{order_no}/mock-confirm"

        logger.info(
            "[MockPayment] create_payment order_no=%s amount=%.2f txn=%s",
            order_no, amount, transaction_id,
        )

        return {
            "order_no": order_no,
            "status": "processing",
            "payment_url": payment_url,
            "transaction_id": transaction_id,
            "amount": amount,
            "currency": currency,
            "subject": subject,
            "metadata": metadata or {},
            "raw": {"mock": True, "ts": int(time.time())},
        }

    async def query_payment(self, order_no: str) -> Dict[str, Any]:
        return {
            "order_no": order_no,
            "status": "success",  # Mock 假定已成功
            "raw": {"mock": True},
        }

    async def refund(
        self, order_no: str, refund_amount: float, reason: str = ""
    ) -> Dict[str, Any]:
        refund_no = f"REFUND{secrets.token_hex(6).upper()}"
        return {
            "order_no": order_no,
            "refund_no": refund_no,
            "status": "refunded",
            "refund_amount": refund_amount,
            "reason": reason,
        }


# ---------- 工厂 ----------


_adapter_cache: Dict[str, PaymentAdapter] = {}


def get_payment_adapter(method: Optional[str] = None) -> PaymentAdapter:
    """
    工厂：根据支付方式返回对应 adapter 实例（带缓存）

    Args:
        method: 支付方式字符串（mock / wechat / alipay / bank_transfer）
                 缺省或未知值一律回退到 Mock
    """
    key = (method or "mock").lower()
    if key in _adapter_cache:
        return _adapter_cache[key]

    if key == "mock":
        instance = MockPaymentAdapter()
    else:
        # 未来扩展：WeChatPayAdapter / AlipayAdapter / BankTransferAdapter
        logger.warning(
            "暂未实现 payment_adapter=%s，回退到 Mock。可在 services/payment_service.py 扩展。",
            key,
        )
        instance = MockPaymentAdapter()

    _adapter_cache[key] = instance
    return instance


# ---------- 工具函数 ----------


def generate_order_no(prefix: str = "TK") -> str:
    """
    生成业务订单号：TK + YYYYMMDD + 8 位大写随机
    例：TK20260617AB3D9F21
    """
    from datetime import datetime

    date_part = datetime.utcnow().strftime("%Y%m%d")
    rand_part = secrets.token_hex(4).upper()  # 8 字符
    return f"{prefix}{date_part}{rand_part}"


__all__ = [
    "PaymentAdapter",
    "MockPaymentAdapter",
    "PaymentError",
    "PaymentConfigError",
    "PaymentGatewayError",
    "get_payment_adapter",
    "generate_order_no",
]
