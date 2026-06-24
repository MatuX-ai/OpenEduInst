"""
K12 STEM 耗材管理 API 路由（多租户版）

涵盖：耗材 CRUD、库存管理、领用记录、申购审批流程
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.consumable import (
    Consumable, ConsumableCreate, ConsumableUpdate, ConsumableResponse,
    ConsumableUsage, ConsumableUsageCreate, ConsumableUsageResponse,
    ConsumablePurchaseRequest, PurchaseRequestItem,
    PurchaseRequestCreate, PurchaseRequestReview, PurchaseRequestResponse,
    PurchaseRequestItemCreate, PurchaseRequestItemResponse,
    ConsumableCategory, PurchaseRequestStatus,
    ConsumableStatsResponse, LowStockItem,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/stem/consumables", tags=["STEM 耗材管理"])


# ==================== 耗材 CRUD ====================

@router.post("/", response_model=ConsumableResponse)
def create_consumable(
    payload: ConsumableCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新耗材"""
    _, org_id = ctx
    consumable = Consumable(
        org_id=org_id,
        name=payload.name,
        category=payload.category,
        specification=payload.specification,
        description=payload.description,
        unit=payload.unit,
        unit_price=payload.unit_price,
        token_price=payload.token_price,
        current_stock=payload.current_stock,
        min_stock=payload.min_stock,
        max_stock=payload.max_stock,
        supplier=payload.supplier,
        supplier_contact=payload.supplier_contact,
        image_url=payload.image_url,
        is_low_stock=payload.current_stock <= payload.min_stock,
    )
    db.add(consumable)
    db.commit()
    db.refresh(consumable)
    return consumable


@router.get("/", response_model=List[ConsumableResponse])
def list_consumables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[ConsumableCategory] = None,
    low_stock_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取耗材列表"""
    _, org_id = ctx
    query = db.query(Consumable).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
    )
    if category:
        query = query.filter(Consumable.category == category)
    if low_stock_only:
        query = query.filter(Consumable.is_low_stock.is_(True))
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Consumable.name.ilike(like))
            | (Consumable.specification.ilike(like))
            | (Consumable.supplier.ilike(like))
        )
    return query.order_by(Consumable.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{consumable_id}", response_model=ConsumableResponse)
def get_consumable(
    consumable_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取耗材详情"""
    _, org_id = ctx
    consumable = db.query(Consumable).filter(
        Consumable.id == consumable_id,
        Consumable.org_id == org_id,
    ).first()
    if not consumable:
        raise HTTPException(status_code=404, detail="耗材不存在")
    return consumable


@router.put("/{consumable_id}", response_model=ConsumableResponse)
def update_consumable(
    consumable_id: int,
    payload: ConsumableUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新耗材信息"""
    _, org_id = ctx
    consumable = db.query(Consumable).filter(
        Consumable.id == consumable_id,
        Consumable.org_id == org_id,
    ).first()
    if not consumable:
        raise HTTPException(status_code=404, detail="耗材不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consumable, field, value)

    # 自动计算低库存状态
    consumable.is_low_stock = consumable.current_stock <= consumable.min_stock

    db.commit()
    db.refresh(consumable)
    return consumable


@router.delete("/{consumable_id}")
def delete_consumable(
    consumable_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除耗材（软删除）"""
    _, org_id = ctx
    consumable = db.query(Consumable).filter(
        Consumable.id == consumable_id,
        Consumable.org_id == org_id,
    ).first()
    if not consumable:
        raise HTTPException(status_code=404, detail="耗材不存在")
    consumable.is_active = False
    db.commit()
    return {"message": "耗材已删除"}


@router.post("/{consumable_id}/stock-adjust")
def adjust_stock(
    consumable_id: int,
    quantity: int = Query(..., description="调整数量（正数增加，负数减少）"),
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """调整耗材库存"""
    _, org_id = ctx
    consumable = db.query(Consumable).filter(
        Consumable.id == consumable_id,
        Consumable.org_id == org_id,
    ).first()
    if not consumable:
        raise HTTPException(status_code=404, detail="耗材不存在")

    new_stock = consumable.current_stock + quantity
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="库存不足，无法减少")

    consumable.current_stock = new_stock
    consumable.is_low_stock = new_stock <= consumable.min_stock
    db.commit()
    return {
        "message": f"库存已调整，当前库存: {new_stock}",
        "current_stock": new_stock,
        "is_low_stock": consumable.is_low_stock,
    }


# ==================== 领用管理 ====================

@router.post("/use", response_model=ConsumableUsageResponse)
def use_consumable(
    payload: ConsumableUsageCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """领用耗材"""
    _, org_id = ctx

    consumable = db.query(Consumable).filter(
        Consumable.id == payload.consumable_id,
        Consumable.org_id == org_id,
    ).first()
    if not consumable:
        raise HTTPException(status_code=404, detail="耗材不存在")
    if consumable.current_stock < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"库存不足（当前: {consumable.current_stock}，需要: {payload.quantity}）",
        )

    # 计算 Token 消耗
    token_cost = consumable.token_price * payload.quantity

    usage = ConsumableUsage(
        consumable_id=payload.consumable_id,
        org_id=org_id,
        quantity=payload.quantity,
        token_cost=token_cost,
        user_id=payload.user_id,
        user_name=payload.user_name,
        user_type=payload.user_type,
        purpose=payload.purpose,
        project_id=payload.project_id,
        club_id=payload.club_id,
    )
    db.add(usage)

    # 扣减库存
    consumable.current_stock -= payload.quantity
    consumable.is_low_stock = consumable.current_stock <= consumable.min_stock

    db.commit()
    db.refresh(usage)
    return usage


@router.get("/usage-records", response_model=List[ConsumableUsageResponse])
def list_usage_records(
    consumable_id: Optional[int] = None,
    club_id: Optional[int] = None,
    project_id: Optional[int] = None,
    user_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取耗材领用记录"""
    _, org_id = ctx
    query = db.query(ConsumableUsage).filter(
        ConsumableUsage.org_id == org_id,
    )
    if consumable_id:
        query = query.filter(ConsumableUsage.consumable_id == consumable_id)
    if club_id:
        query = query.filter(ConsumableUsage.club_id == club_id)
    if project_id:
        query = query.filter(ConsumableUsage.project_id == project_id)
    if user_type:
        query = query.filter(ConsumableUsage.user_type == user_type)
    return query.order_by(ConsumableUsage.created_at.desc()).offset(skip).limit(limit).all()


# ==================== 申购管理 ====================

@router.post("/purchase-requests", response_model=PurchaseRequestResponse)
def create_purchase_request(
    payload: PurchaseRequestCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建申购单"""
    user, org_id = ctx

    pr = ConsumablePurchaseRequest(
        org_id=org_id,
        title=payload.title,
        reason=payload.reason,
        requester_id=user.id,
        requester_name=payload.requester_name,
        status=PurchaseRequestStatus.PENDING,
    )
    db.add(pr)
    db.flush()

    total = 0.0
    for item_data in payload.items:
        item = PurchaseRequestItem(
            request_id=pr.id,
            consumable_id=item_data.consumable_id,
            consumable_name=item_data.consumable_name,
            specification=item_data.specification,
            quantity=item_data.quantity,
            estimated_price=item_data.estimated_price,
        )
        db.add(item)
        total += item_data.estimated_price * item_data.quantity

    pr.estimated_total = total
    db.commit()
    db.refresh(pr)
    return pr


@router.get("/purchase-requests", response_model=List[PurchaseRequestResponse])
def list_purchase_requests(
    status: Optional[PurchaseRequestStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取申购单列表"""
    _, org_id = ctx
    query = db.query(ConsumablePurchaseRequest).filter(
        ConsumablePurchaseRequest.org_id == org_id,
    )
    if status:
        query = query.filter(ConsumablePurchaseRequest.status == status)
    return query.order_by(
        ConsumablePurchaseRequest.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/purchase-requests/{pr_id}", response_model=PurchaseRequestResponse)
def get_purchase_request(
    pr_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取申购单详情"""
    _, org_id = ctx
    pr = db.query(ConsumablePurchaseRequest).filter(
        ConsumablePurchaseRequest.id == pr_id,
        ConsumablePurchaseRequest.org_id == org_id,
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="申购单不存在")
    return pr


@router.put("/purchase-requests/{pr_id}/review", response_model=PurchaseRequestResponse)
def review_purchase_request(
    pr_id: int,
    payload: PurchaseRequestReview,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审核申购单"""
    user, org_id = ctx
    pr = db.query(ConsumablePurchaseRequest).filter(
        ConsumablePurchaseRequest.id == pr_id,
        ConsumablePurchaseRequest.org_id == org_id,
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="申购单不存在")

    pr.status = payload.status
    pr.review_comment = payload.review_comment
    pr.reviewer_id = user.id
    pr.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(pr)
    return pr


# ==================== 统计看板 ====================

@router.get("/stats/overview", response_model=ConsumableStatsResponse)
def get_consumable_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取耗材统计概览"""
    _, org_id = ctx

    total_types = db.query(Consumable).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
    ).count()

    low_stock_count = db.query(Consumable).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
        Consumable.is_low_stock.is_(True),
    ).count()

    total_value = db.query(
        func.sum(Consumable.unit_price * Consumable.current_stock)
    ).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
    ).scalar() or 0.0

    # 本月领用次数
    first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_usage = db.query(ConsumableUsage).filter(
        ConsumableUsage.org_id == org_id,
        ConsumableUsage.created_at >= first_of_month,
    ).count()

    pending_pr = db.query(ConsumablePurchaseRequest).filter(
        ConsumablePurchaseRequest.org_id == org_id,
        ConsumablePurchaseRequest.status == PurchaseRequestStatus.PENDING,
    ).count()

    return ConsumableStatsResponse(
        total_types=total_types,
        low_stock_count=low_stock_count,
        total_stock_value=round(total_value, 2),
        monthly_usage_count=monthly_usage,
        pending_purchase_requests=pending_pr,
    )


@router.get("/low-stock", response_model=List[LowStockItem])
def get_low_stock_items(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取低库存耗材列表"""
    _, org_id = ctx
    items = db.query(Consumable).filter(
        Consumable.org_id == org_id,
        Consumable.is_active.is_(True),
        Consumable.is_low_stock.is_(True),
    ).all()
    return [
        LowStockItem(
            id=item.id,
            name=item.name,
            category=item.category,
            current_stock=item.current_stock,
            min_stock=item.min_stock,
            unit=item.unit,
        ) for item in items
    ]