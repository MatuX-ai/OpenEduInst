"""
营销管理数据模型
用于STEM培训机构的营销活动和优惠券管理
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean
from sqlalchemy.orm import relationship

from utils.database import Base


class SocialPlatform(enum.Enum):
    """社交媒体平台枚举"""
    WECHAT = "wechat"  # 微信公众号/视频号
    DOUYIN = "douyin"  # 抖音
    XIAOHONGSHU = "xiaohongshu"  # 小红书
    WEIBO = "weibo"  # 微博
    BILIBILI = "bilibili"  # B站


class SocialMediaAccount(Base):
    """社交媒体账号模型"""
    __tablename__ = "social_media_accounts"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 账号信息
    platform = Column(Enum(SocialPlatform), nullable=False)  # 平台类型
    account_name = Column(String(100), nullable=False)  # 账号名称
    account_id = Column(String(100), nullable=True)  # 平台账号ID
    followers_count = Column(Integer, default=0)  # 粉丝数
    
    # 运营数据
    total_posts = Column(Integer, default=0)  # 总发布数
    total_likes = Column(Integer, default=0)  # 总点赞数
    conversion_leads = Column(Integer, default=0)  # 转化线索数
    
    # 状态
    is_active = Column(Boolean, default=True)  # 是否启用
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="social_accounts")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "platform": self.platform.value if isinstance(self.platform, SocialPlatform) else self.platform,
            "account_name": self.account_name,
            "account_id": self.account_id,
            "followers_count": self.followers_count,
            "total_posts": self.total_posts,
            "total_likes": self.total_likes,
            "conversion_leads": self.conversion_leads,
            "is_active": self.is_active,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }


class CampaignType(enum.Enum):
    """活动类型枚举"""
    GROUP_BUY = "group_buy"  # 拼团
    REFERRAL = "referral"  # 推荐
    COUPON = "coupon"  # 优惠券
    EARLY_BIRD = "early_bird"  # 早鸟价
    DISCOUNT = "discount"  # 折扣


class CampaignStatus(enum.Enum):
    """活动状态枚举"""
    PLANNED = "planned"  # 规划中
    ACTIVE = "active"  # 进行中
    ENDED = "ended"  # 已结束
    CANCELLED = "cancelled"  # 已取消


class MarketingCampaign(Base):
    """营销活动模型"""
    __tablename__ = "marketing_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 活动名称
    type = Column(Enum(CampaignType), nullable=False)  # 活动类型
    description = Column(Text, nullable=True)  # 活动描述
    
    # 时间信息
    start_date = Column(DateTime, nullable=False)  # 开始时间
    end_date = Column(DateTime, nullable=False)  # 结束时间
    
    # 参与信息
    participants_count = Column(Integer, default=0)  # 参与人数
    target_participants = Column(Integer, nullable=True)  # 目标人数
    
    # 转化数据
    conversion_rate = Column(Float, nullable=True)  # 转化率（百分比）
    revenue = Column(Float, default=0.0)  # 带来营收
    
    # 状态
    status = Column(Enum(CampaignStatus), default=CampaignStatus.PLANNED, nullable=False)
    
    # 配置信息（JSON格式存储）
    config = Column(Text, nullable=True)  # 活动配置（如拼团人数、优惠金额等）
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="campaigns")
    coupons = relationship("Coupon", back_populates="campaign", cascade="all, delete-orphan")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "type": self.type.value if isinstance(self.type, CampaignType) else self.type,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "participants_count": self.participants_count,
            "target_participants": self.target_participants,
            "conversion_rate": self.conversion_rate,
            "revenue": self.revenue,
            "status": self.status.value if isinstance(self.status, CampaignStatus) else self.status,
            "config": self.config,
            "create_time": self.create_time.isoformat() if self.create_time else None,
            "update_time": self.update_time.isoformat() if self.update_time else None,
        }


class Coupon(Base):
    """优惠券模型"""
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("marketing_campaigns.id"), nullable=True, index=True)
    
    # 基本信息
    code = Column(String(50), nullable=False, unique=True, index=True)  # 优惠券代码
    name = Column(String(200), nullable=False)  # 优惠券名称
    
    # 优惠内容
    discount_type = Column(String(20), nullable=False)  # 优惠类型：fixed（固定金额）、percentage（百分比）
    discount_value = Column(Float, nullable=False)  # 优惠值（金额或百分比）
    
    # 使用条件
    min_amount = Column(Float, nullable=True)  # 最低消费金额
    condition_description = Column(String(300), nullable=True)  # 使用条件描述
    
    # 发放信息
    total_quantity = Column(Integer, nullable=False)  # 总数量
    used_quantity = Column(Integer, default=0)  # 已使用数量
    
    # 有效期
    expiry_date = Column(DateTime, nullable=False)  # 过期时间
    
    # 状态
    is_active = Column(Boolean, default=True, nullable=False)  # 是否有效
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="coupons")
    campaign = relationship("MarketingCampaign", back_populates="coupons")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "campaign_id": self.campaign_id,
            "code": self.code,
            "name": self.name,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "min_amount": self.min_amount,
            "condition_description": self.condition_description,
            "total_quantity": self.total_quantity,
            "used_quantity": self.used_quantity,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "is_active": self.is_active,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }
