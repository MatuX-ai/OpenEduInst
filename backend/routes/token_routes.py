"""
Token计费系统API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止硬编码 org_id = 1。
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.token_billing import (
    TokenPackage,
    TokenPackageCreate,
    TokenPackageResponse,
    TokenBalance,
    TokenBalanceResponse,
    TokenTransaction,
    TokenTransactionCreate,
    TokenTransactionResponse,
    TokenUsageLog,
    TokenUsageLogCreate,
    TokenUsageLogResponse,
    TokenType,
    TokenTransactionType,
)
from models.license import Organization

router = APIRouter(prefix="/api/v1/tokens", tags=["Token计费系统"])


# ==================== Token套餐管理接口 ====================


@router.post("/packages/", response_model=TokenPackageResponse)
def create_token_package(
    package: TokenPackageCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建Token套餐（org_id 来自 Token，拒绝请求体传入）"""
    _, org_id = ctx
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 创建套餐实例（忽略 payload 中可能存在的 org_id）
    db_package = TokenPackage(
        name=package.name,
        description=package.description,
        org_id=org.id,
        token_amount=getattr(package, "token_amount", 0),
        price=getattr(package, "price", 0.0),
        is_active=True,
    )

    db.add(db_package)
    db.commit()
    db.refresh(db_package)

    return db_package


@router.get("/packages/", response_model=List[TokenPackageResponse])
def list_token_packages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = True,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的Token套餐列表（org_id 来自 Token）"""
    _, org_id = ctx
    query = db.query(TokenPackage).filter(TokenPackage.org_id == org_id)

    if active_only:
        query = query.filter(TokenPackage.is_active == True)

    packages = query.offset(skip).limit(limit).all()
    return packages


@router.get("/packages/{package_id}", response_model=TokenPackageResponse)
def get_token_package(
    package_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取单个Token套餐详情（校验所属组织）"""
    _, org_id = ctx
    package = (
        db.query(TokenPackage)
        .filter(TokenPackage.id == package_id, TokenPackage.org_id == org_id)
        .first()
    )
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# ==================== Token余额管理接口 ====================


@router.get("/balance/", response_model=TokenBalanceResponse)
def get_token_balance(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的Token余额（org_id 来自 Token）"""
    _, org_id = ctx
    balance = db.query(TokenBalance).filter(TokenBalance.org_id == org_id).first()

    if not balance:
        balance = TokenBalance(org_id=org_id)
        db.add(balance)
        db.commit()
        db.refresh(balance)

    return balance


# ==================== Token交易管理接口 ====================


@router.post("/transactions/", response_model=TokenTransactionResponse)
def create_token_transaction(
    transaction: TokenTransactionCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建Token交易记录（org_id 来自 Token）"""
    _, org_id = ctx

    balance = db.query(TokenBalance).filter(TokenBalance.org_id == org_id).first()
    if not balance:
        balance = TokenBalance(org_id=org_id)
        db.add(balance)
        db.commit()
        db.refresh(balance)

    db_transaction = TokenTransaction(
        transaction_type=transaction.transaction_type,
        token_type=transaction.token_type,
        amount=transaction.amount,
        description=transaction.description,
        reference_id=transaction.reference_id,
        user_id=transaction.user_id,
        balance_id=balance.id,
        org_id=org_id,
    )

    # 更新余额
    if transaction.transaction_type in (
        TokenTransactionType.PURCHASE,
        TokenTransactionType.BONUS,
        TokenTransactionType.ADJUSTMENT,
    ):
        balance.balance += transaction.amount
        if transaction.transaction_type == TokenTransactionType.PURCHASE:
            balance.total_purchased += transaction.amount
        elif transaction.transaction_type == TokenTransactionType.BONUS:
            balance.total_bonus += transaction.amount
    elif transaction.transaction_type in (
        TokenTransactionType.CONSUME,
        TokenTransactionType.REFUND,
    ):
        balance.balance -= abs(transaction.amount)
        if transaction.transaction_type == TokenTransactionType.CONSUME:
            balance.total_consumed += abs(transaction.amount)
        elif transaction.transaction_type == TokenTransactionType.REFUND:
            balance.total_refunded += abs(transaction.amount)

    balance.last_transaction_at = datetime.utcnow()
    balance.updated_at = datetime.utcnow()

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return db_transaction


@router.get("/transactions/", response_model=List[TokenTransactionResponse])
def list_token_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    transaction_type: Optional[TokenTransactionType] = None,
    token_type: Optional[TokenType] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的Token交易记录列表（org_id 来自 Token）"""
    _, org_id = ctx
    query = db.query(TokenTransaction).filter(TokenTransaction.org_id == org_id)

    if transaction_type:
        query = query.filter(TokenTransaction.transaction_type == transaction_type)
    if token_type:
        query = query.filter(TokenTransaction.token_type == token_type)

    transactions = (
        query.order_by(TokenTransaction.created_at.desc()).offset(skip).limit(limit).all()
    )
    return transactions


# ==================== Token使用日志接口 ====================


@router.post("/usage-logs/", response_model=TokenUsageLogResponse)
def create_token_usage_log(
    log: TokenUsageLogCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建Token使用日志（org_id 来自 Token）"""
    _, org_id = ctx

    db_log = TokenUsageLog(
        token_type=log.token_type,
        amount=log.amount,
        description=log.description,
        reference_id=log.reference_id,
        user_id=log.user_id,
        org_id=org_id,
    )
    db.add(db_log)

    # 联动创建消费交易 & 更新余额
    balance = db.query(TokenBalance).filter(TokenBalance.org_id == org_id).first()
    if balance:
        balance.balance -= log.amount
        balance.total_consumed += log.amount
        balance.last_transaction_at = datetime.utcnow()
        balance.updated_at = datetime.utcnow()

        db_transaction = TokenTransaction(
            transaction_type=TokenTransactionType.CONSUME,
            token_type=log.token_type,
            amount=log.amount,
            description=f"Token使用: {log.description}",
            reference_id=f"usage_{db_log.id}",
            user_id=log.user_id,
            balance_id=balance.id,
            org_id=org_id,
        )
        db.add(db_transaction)

    db.commit()
    db.refresh(db_log)

    return db_log


@router.get("/usage-logs/", response_model=List[TokenUsageLogResponse])
def list_token_usage_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    token_type: Optional[TokenType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的Token使用日志列表"""
    _, org_id = ctx
    query = db.query(TokenUsageLog).filter(TokenUsageLog.org_id == org_id)

    if user_id:
        query = query.filter(TokenUsageLog.user_id == user_id)
    if token_type:
        query = query.filter(TokenUsageLog.token_type == token_type)
    if start_date:
        query = query.filter(TokenUsageLog.created_at >= start_date)
    if end_date:
        query = query.filter(TokenUsageLog.created_at <= end_date)

    logs = query.order_by(TokenUsageLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


# ==================== 统计接口 ====================


@router.get("/statistics/summary")
def get_token_statistics(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的Token统计信息（org_id 来自 Token）"""
    _, org_id = ctx

    balance = db.query(TokenBalance).filter(TokenBalance.org_id == org_id).first()
    if not balance:
        return {
            "current_balance": 0,
            "total_purchased": 0,
            "total_consumed": 0,
            "total_refunded": 0,
            "total_bonus": 0,
        }

    usage_stats = {}
    for token_type in TokenType:
        total_used = (
            db.query(TokenUsageLog)
            .filter(
                TokenUsageLog.org_id == org_id,
                TokenUsageLog.token_type == token_type,
            )
            .count()
        )
        if total_used > 0:
            usage_stats[token_type.value] = total_used

    return {
        "current_balance": balance.balance,
        "total_purchased": balance.total_purchased,
        "total_consumed": balance.total_consumed,
        "total_refunded": balance.total_refunded,
        "total_bonus": balance.total_bonus,
        "usage_stats": usage_stats,
        "last_transaction_at": balance.last_transaction_at,
    }