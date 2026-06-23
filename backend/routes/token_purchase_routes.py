"""
Token 充值订单 API 路由（阶段三 3.2）

提供完整的「下单→Mock 支付→到账」链路：
- POST   /api/v1/token-orders/                    创建订单 + 调起支付网关
- GET    /api/v1/token-orders/                    当前组织订单列表（分页 + 状态筛选）
- GET    /api/v1/token-orders/{order_no}          订单详情
- POST   /api/v1/token-orders/{order_no}/mock-confirm  Mock 支付确认（成功/失败演示）
- POST   /api/v1/token-orders/{order_no}/cancel         取消订单（仅 PENDING/PROCESSING）

所有端点 org_id 来自 require_org_context，禁止请求体传入。
Mock 支付确认带行级锁（with_for_update）防止并发重复到账。
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.token_billing import (
    MockPaymentConfirmRequest,
    PaymentMethod,
    TokenBalance,
    TokenOrder,
    TokenOrderCreate,
    TokenOrderResponse,
    TokenOrderStatus,
    TokenPackage,
    TokenTransaction,
    TokenTransactionType,
)
from services.payment_service import (
    MockPaymentAdapter,
    generate_order_no,
    get_payment_adapter,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/token-orders", tags=["Token 充值"])


# ---------- 响应辅助模型 ----------


class TokenOrderCreateResponse(BaseModel):
    """创建订单的完整响应（含支付入口）"""

    order: TokenOrderResponse
    payment_url: str
    transaction_id: str
    payment_status: str  # processing / success / failed


# ---------- 端点 ----------


@router.post(
    "/",
    response_model=TokenOrderCreateResponse,
    summary="创建 Token 充值订单（调起 Mock 支付）",
)
async def create_token_order(
    payload: TokenOrderCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    流程：
    1. 校验套餐（必须属于本组织 + active）
    2. 生成 order_no（TK + YYYYMMDD + 8 位随机）
    3. 写 PENDING 订单
    4. 调 PaymentAdapter.create_payment 拿到 payment_url + transaction_id
    5. 订单置 PROCESSING，返回支付入口给前端
    """
    _, org_id = ctx

    # 1. 校验套餐
    package = (
        db.query(TokenPackage)
        .filter(
            TokenPackage.id == payload.package_id,
            TokenPackage.org_id == org_id,
            TokenPackage.is_active.is_(True),
        )
        .first()
    )
    if not package:
        raise HTTPException(
            status_code=404,
            detail=f"套餐不存在或已下线: package_id={payload.package_id}",
        )

    # 2. 生成订单号（重试兜底）
    order_no = generate_order_no(prefix="TK")
    for _ in range(3):
        exists = (
            db.query(TokenOrder).filter(TokenOrder.order_no == order_no).first()
        )
        if not exists:
            break
        order_no = generate_order_no(prefix="TK")
    else:
        raise HTTPException(status_code=500, detail="生成订单号失败，请重试")

    # 3. 写订单
    order = TokenOrder(
        org_id=org_id,
        order_no=order_no,
        package_id=package.id,
        user_id=payload.user_id,
        token_amount=package.token_amount,
        price=package.price,
        currency=package.currency or "CNY",
        payment_method=payload.payment_method,
        status=TokenOrderStatus.PENDING,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # 4. 调起支付
    adapter = get_payment_adapter(payload.payment_method.value)
    try:
        pay_result = await adapter.create_payment(
            order_no=order_no,
            amount=package.price,
            currency=order.currency,
            subject=f"OpenMT Token 充值 - {package.name}",
            metadata={"package_id": package.id, "org_id": org_id},
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("调起支付失败 order_no=%s err=%s", order_no, e)
        order.status = TokenOrderStatus.FAILED
        order.failure_reason = f"支付网关调用失败: {e}"
        db.commit()
        raise HTTPException(status_code=502, detail=f"支付网关调用失败: {e}")

    # 5. 订单置 PROCESSING
    order.status = TokenOrderStatus.PROCESSING
    order.transaction_id = pay_result.get("transaction_id")
    db.commit()
    db.refresh(order)

    return TokenOrderCreateResponse(
        order=TokenOrderResponse.model_validate(order),
        payment_url=pay_result.get("payment_url", ""),
        transaction_id=pay_result.get("transaction_id", ""),
        payment_status=pay_result.get("status", "processing"),
    )


@router.get("/", response_model=List[TokenOrderResponse], summary="订单列表")
def list_token_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[TokenOrderStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """当前组织的订单列表，支持状态筛选"""
    _, org_id = ctx
    q = db.query(TokenOrder).filter(TokenOrder.org_id == org_id)
    if status_filter:
        q = q.filter(TokenOrder.status == status_filter)
    orders = q.order_by(TokenOrder.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_no}", response_model=TokenOrderResponse, summary="订单详情")
def get_token_order(
    order_no: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    _, org_id = ctx
    order = (
        db.query(TokenOrder)
        .filter(TokenOrder.order_no == order_no, TokenOrder.org_id == org_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post(
    "/{order_no}/mock-confirm",
    response_model=TokenOrderResponse,
    summary="Mock 支付确认（演示用）",
)
def mock_confirm_payment(
    order_no: str,
    payload: MockPaymentConfirmRequest = MockPaymentConfirmRequest(),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    Mock 支付确认接口：
    - 默认成功；force_fail=true 时强制失败
    - 加 SELECT FOR UPDATE 行级锁防止并发到账
    - 成功时：更新余额 + 写 PURCHASE 流水 + 订单置 SUCCESS
    - 失败时：订单置 FAILED + 写失败原因
    """
    _, org_id = ctx

    # 锁订单
    order = (
        db.query(TokenOrder)
        .filter(TokenOrder.order_no == order_no, TokenOrder.org_id == org_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order.is_terminal:
        raise HTTPException(
            status_code=409,
            detail=f"订单已处于终态（{order.status.value}），无法重复确认",
        )

    if order.status != TokenOrderStatus.PROCESSING:
        raise HTTPException(
            status_code=400,
            detail=f"订单状态不允许确认（当前 {order.status.value}）",
        )

    # 强制失败
    if payload.force_fail:
        order.status = TokenOrderStatus.FAILED
        order.failure_reason = "用户主动取消 / 模拟支付失败"
        db.commit()
        db.refresh(order)
        raise HTTPException(
            status_code=402, detail="模拟支付失败（演示场景）"
        )

    # 成功到账：事务内同时更新余额 + 写流水
    try:
        balance = (
            db.query(TokenBalance)
            .filter(TokenBalance.org_id == org_id)
            .with_for_update()
            .first()
        )
        if not balance:
            balance = TokenBalance(org_id=org_id)
            db.add(balance)
            db.flush()  # 拿到 balance.id

        unit_price = order.price / order.token_amount if order.token_amount else 0.0

        # 写交易流水（PURCHASE）
        tx = TokenTransaction(
            balance_id=balance.id,
            org_id=org_id,
            transaction_type=TokenTransactionType.PURCHASE,
            amount=order.token_amount,
            description=f"购买 Token 套餐：订单 {order.order_no}",
            reference_id=order.order_no,
            user_id=order.user_id,
            unit_price=unit_price,
            total_cost=order.price,
        )
        db.add(tx)

        # 更新余额
        balance.balance += order.token_amount
        balance.total_purchased += order.token_amount
        balance.last_transaction_at = datetime.utcnow()
        balance.updated_at = datetime.utcnow()

        # 订单置 SUCCESS
        order.status = TokenOrderStatus.SUCCESS
        order.paid_at = datetime.utcnow()

        db.commit()
        db.refresh(order)

        logger.info(
            "[MockPayment] confirm SUCCESS order_no=%s tokens=%d balance=%d",
            order.order_no, order.token_amount, balance.balance,
        )
        return order
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:  # noqa: BLE001
        db.rollback()
        order.status = TokenOrderStatus.FAILED
        order.failure_reason = f"到账事务异常: {e}"
        db.commit()
        logger.exception("Mock 支付到账失败 order_no=%s err=%s", order_no, e)
        raise HTTPException(status_code=500, detail=f"到账处理失败: {e}")


@router.post(
    "/{order_no}/cancel",
    response_model=TokenOrderResponse,
    summary="取消订单（仅 PENDING/PROCESSING）",
)
def cancel_token_order(
    order_no: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    _, org_id = ctx
    order = (
        db.query(TokenOrder)
        .filter(TokenOrder.order_no == order_no, TokenOrder.org_id == org_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.is_terminal:
        raise HTTPException(
            status_code=409,
            detail=f"订单已处于终态（{order.status.value}），无法取消",
        )

    order.status = TokenOrderStatus.CANCELLED
    order.failure_reason = "用户主动取消"
    db.commit()
    db.refresh(order)
    return order
