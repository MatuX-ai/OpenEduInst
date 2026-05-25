"""
营销中心API路由
提供营销活动和优惠券的CRUD操作和统计功能
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from utils.database import get_db
from models.license import Organization
from models.marketing import MarketingCampaign, Coupon, CampaignType, CampaignStatus, SocialMediaAccount, SocialPlatform
from models.schedule import Lead, LeadStatus

router = APIRouter(
    prefix="/api/v1/marketing",
    tags=["marketing"],
)


@router.get("/campaigns")
def get_campaigns(
    org_id: int = Query(..., description="组织ID"),
    status: Optional[str] = Query(None, description="活动状态筛选"),
    type: Optional[str] = Query(None, description="活动类型筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取营销活动列表"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    query = db.query(MarketingCampaign).filter(MarketingCampaign.org_id == org_id)
    
    # 应用筛选条件
    if status:
        query = query.filter(MarketingCampaign.status == status)
    if type:
        query = query.filter(MarketingCampaign.type == type)
    
    total = query.count()
    campaigns = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "campaigns": [c.to_dict() for c in campaigns]
    }


# --- 社媒管理接口 ---
@router.get("/social-accounts")
def get_social_accounts(
    org_id: int = Query(..., description="组织ID"),
    platform: Optional[str] = Query(None, description="平台筛选"),
    db: Session = Depends(get_db)
):
    """获取社交媒体账号列表"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    query = db.query(SocialMediaAccount).filter(SocialMediaAccount.org_id == org_id)
    if platform:
        query = query.filter(SocialMediaAccount.platform == platform)
    
    accounts = query.all()
    return {"accounts": [a.to_dict() for a in accounts]}


@router.post("/social-accounts")
def create_social_account(
    org_id: int = Query(..., description="组织ID"),
    platform: str = Query(..., description="平台类型"),
    account_name: str = Query(..., description="账号名称"),
    account_id: Optional[str] = Query(None, description="平台账号ID"),
    db: Session = Depends(get_db)
):
    """添加社交媒体账号"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    try:
        p_enum = SocialPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid platform")
    
    account = SocialMediaAccount(
        org_id=org_id,
        platform=p_enum,
        account_name=account_name,
        account_id=account_id
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    return account.to_dict()


@router.put("/social-accounts/{account_id}")
def update_social_account(
    account_id: int,
    followers_count: Optional[int] = Query(None, description="粉丝数"),
    total_posts: Optional[int] = Query(None, description="发布数"),
    total_likes: Optional[int] = Query(None, description="点赞数"),
    db: Session = Depends(get_db)
):
    """更新社媒账号数据"""
    account = db.query(SocialMediaAccount).filter(SocialMediaAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if followers_count is not None:
        account.followers_count = followers_count
    if total_posts is not None:
        account.total_posts = total_posts
    if total_likes is not None:
        account.total_likes = total_likes
    
    db.commit()
    db.refresh(account)
    return account.to_dict()


# --- 招生线索集成接口 (在营销中心查看) ---
@router.get("/leads-summary")
def get_leads_summary(
    org_id: int = Query(..., description="组织ID"),
    db: Session = Depends(get_db)
):
    """获取营销中心视角的线索摘要"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    total = db.query(Lead).filter(Lead.org_id == org_id).count()
    pending = db.query(Lead).filter(Lead.org_id == org_id, Lead.status == LeadStatus.PENDING).count()
    enrolled = db.query(Lead).filter(Lead.org_id == org_id, Lead.status == LeadStatus.ENROLLED).count()
    
    # 按来源统计
    source_stats = db.query(Lead.source, func.count(Lead.id)).filter(
        Lead.org_id == org_id
    ).group_by(Lead.source).all()
    
    return {
        "total_leads": total,
        "pending_leads": pending,
        "enrolled_leads": enrolled,
        "source_distribution": [{"source": s, "count": c} for s, c in source_stats]
    }


@router.get("/campaigns/stats")
def get_campaign_stats(
    org_id: int = Query(..., description="组织ID"),
    db: Session = Depends(get_db)
):
    """获取营销活动统计数据"""
    # 本月营销收入
    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = db.query(MarketingCampaign).filter(
        MarketingCampaign.org_id == org_id,
        MarketingCampaign.start_date >= first_day_of_month
    ).with_entities(
        db.func.sum(MarketingCampaign.revenue)
    ).scalar() or 0
    
    # 活动参与人数（进行中的活动）
    active_participants = db.query(MarketingCampaign).filter(
        MarketingCampaign.org_id == org_id,
        MarketingCampaign.status == CampaignStatus.ACTIVE
    ).with_entities(
        db.func.sum(MarketingCampaign.participants_count)
    ).scalar() or 0
    
    # 平均转化率
    campaigns_with_conversion = db.query(MarketingCampaign).filter(
        MarketingCampaign.org_id == org_id,
        MarketingCampaign.conversion_rate.isnot(None)
    ).all()
    
    avg_conversion = 0
    if campaigns_with_conversion:
        total_conversion = sum(c.conversion_rate for c in campaigns_with_conversion)
        avg_conversion = total_conversion / len(campaigns_with_conversion)
    
    # 优惠券发放总数
    total_coupons = db.query(Coupon).filter(
        Coupon.org_id == org_id
    ).with_entities(
        db.func.sum(Coupon.total_quantity)
    ).scalar() or 0
    
    # 优惠券使用数
    used_coupons = db.query(Coupon).filter(
        Coupon.org_id == org_id
    ).with_entities(
        db.func.sum(Coupon.used_quantity)
    ).scalar() or 0
    
    return {
        "monthly_revenue": monthly_revenue,
        "active_participants": active_participants,
        "avg_conversion_rate": round(avg_conversion, 2),
        "total_coupons_issued": total_coupons,
        "total_coupons_used": used_coupons
    }


@router.post("/campaigns")
def create_campaign(
    org_id: int = Query(..., description="组织ID"),
    name: str = Query(..., description="活动名称"),
    type: str = Query(..., description="活动类型"),
    description: Optional[str] = Query(None, description="活动描述"),
    start_date: str = Query(..., description="开始时间(ISO格式)"),
    end_date: str = Query(..., description="结束时间(ISO格式)"),
    target_participants: Optional[int] = Query(None, description="目标人数"),
    config: Optional[str] = Query(None, description="活动配置(JSON字符串)"),
    db: Session = Depends(get_db)
):
    """创建新营销活动"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    try:
        type_enum = CampaignType(type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid type: {type}")
    
    new_campaign = MarketingCampaign(
        org_id=org_id,
        name=name,
        type=type_enum,
        description=description,
        start_date=datetime.fromisoformat(start_date),
        end_date=datetime.fromisoformat(end_date),
        target_participants=target_participants,
        config=config,
        status=CampaignStatus.PLANNED
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    return {
        "message": "Campaign created successfully",
        "campaign": new_campaign.to_dict()
    }


@router.put("/campaigns/{campaign_id}/status")
def update_campaign_status(
    campaign_id: int,
    status: str = Query(..., description="新状态"),
    org_id: int = Query(..., description="组织ID"),
    db: Session = Depends(get_db)
):
    """更新活动状态"""
    campaign = db.query(MarketingCampaign).filter(
        MarketingCampaign.id == campaign_id,
        MarketingCampaign.org_id == org_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    try:
        status_enum = CampaignStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    campaign.status = status_enum
    campaign.update_time = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Campaign status updated"}


@router.get("/coupons")
def get_coupons(
    org_id: int = Query(..., description="组织ID"),
    is_active: Optional[bool] = Query(None, description="是否有效"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取优惠券列表"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    query = db.query(Coupon).filter(Coupon.org_id == org_id)
    
    if is_active is not None:
        query = query.filter(Coupon.is_active == is_active)
    
    total = query.count()
    coupons = query.order_by(Coupon.create_time.desc()).offset(skip).limit(limit).all()
    
    return {
        "coupons": [coupon.to_dict() for coupon in coupons],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/coupons")
def create_coupon(
    org_id: int = Query(..., description="组织ID"),
    code: str = Query(..., description="优惠券代码"),
    name: str = Query(..., description="优惠券名称"),
    discount_type: str = Query(..., description="优惠类型：fixed/percentage"),
    discount_value: float = Query(..., description="优惠值"),
    min_amount: Optional[float] = Query(None, description="最低消费金额"),
    condition_description: Optional[str] = Query(None, description="使用条件描述"),
    total_quantity: int = Query(..., description="总数量"),
    expiry_date: str = Query(..., description="过期时间(ISO格式)"),
    campaign_id: Optional[int] = Query(None, description="关联活动ID"),
    db: Session = Depends(get_db)
):
    """创建新优惠券"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 检查代码是否已存在
    existing = db.query(Coupon).filter(Coupon.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    new_coupon = Coupon(
        org_id=org_id,
        code=code,
        name=name,
        discount_type=discount_type,
        discount_value=discount_value,
        min_amount=min_amount,
        condition_description=condition_description,
        total_quantity=total_quantity,
        expiry_date=datetime.fromisoformat(expiry_date),
        campaign_id=campaign_id,
        is_active=True
    )
    
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    
    return {
        "message": "Coupon created successfully",
        "coupon": new_coupon.to_dict()
    }


@router.put("/coupons/{coupon_id}/use")
def use_coupon(
    coupon_id: int,
    org_id: int = Query(..., description="组织ID"),
    db: Session = Depends(get_db)
):
    """使用优惠券（增加使用计数）"""
    coupon = db.query(Coupon).filter(
        Coupon.id == coupon_id,
        Coupon.org_id == org_id
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    if coupon.used_quantity >= coupon.total_quantity:
        raise HTTPException(status_code=400, detail="Coupon quantity exhausted")
    
    coupon.used_quantity += 1
    
    db.commit()
    
    return {"message": "Coupon used successfully"}
