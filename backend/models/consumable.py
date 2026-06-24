"""
K12 STEM 耗材管理数据模型
用于管理普通 K12 学校 STEM 教学所需的各类耗材（3D打印耗材、电子元件、结构件等）

业务特征：
- 耗材领用关联学生 Token 消费（虚拟积分）
- 库存预警机制，低于阈值自动提醒
- 申购流程：导师发起 → 管理员审批 → 采购跟踪
"""

from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Float,
)
from sqlalchemy.orm import relationship

from utils.database import Base


class ConsumableCategory(str, enum.Enum):
    """耗材分类枚举"""
    FILAMENT_3D = "filament_3d"          # 3D打印耗材
    ELECTRONIC = "electronic"            # 电子元件
    STRUCTURAL = "structural"            # 结构件
    TOOL = "tool"                        # 工具
    SENSOR = "sensor"                    # 传感器
    WIRE_CABLE = "wire_cable"            # 线材
    BATTERY = "battery"                  # 电池
    FASTENER = "fastener"               # 紧固件
    CHEMICAL = "chemical"                # 化学试剂
    PAPER_CRAFT = "paper_craft"          # 纸艺/手工
    OTHER = "other"                      # 其他


class PurchaseRequestStatus(str, enum.Enum):
    """申购状态枚举"""
    PENDING = "pending"                  # 待审批
    APPROVED = "approved"                # 已批准
    REJECTED = "rejected"                # 已拒绝
    ORDERED = "ordered"                  # 已采购
    RECEIVED = "received"                # 已到货
    CANCELLED = "cancelled"              # 已取消


class Consumable(Base):
    """耗材模型"""

    __tablename__ = "stem_consumables"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 耗材名称
    category = Column(Enum(ConsumableCategory), nullable=False)  # 分类
    specification = Column(String(200))  # 规格参数，如 "PLA 1.75mm 白色"
    description = Column(Text)  # 描述
    
    # 库存信息
    unit = Column(String(20), default="个")  # 单位（个/卷/包/套/米）
    unit_price = Column(Float, default=0.0)  # 单价
    token_price = Column(Integer, default=0)  # Token 价格（虚拟积分）
    
    # 库存数量
    current_stock = Column(Integer, default=0)  # 当前库存
    min_stock = Column(Integer, default=10)  # 库存预警下限
    max_stock = Column(Integer, default=200)  # 库存上限
    
    # 供应商信息
    supplier = Column(String(200))  # 供应商
    supplier_contact = Column(String(100))  # 供应商联系方式
    
    # 图片
    image_url = Column(String(500))  # 图片URL
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    is_low_stock = Column(Boolean, default=False)  # 是否低库存（自动计算）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    usage_records = relationship("ConsumableUsage", back_populates="consumable", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Consumable(id={self.id}, name='{self.name}', stock={self.current_stock})>"


class ConsumableUsage(Base):
    """耗材使用/领用记录模型"""

    __tablename__ = "stem_consumable_usages"

    id = Column(Integer, primary_key=True, index=True)
    consumable_id = Column(Integer, ForeignKey("stem_consumables.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 领用信息
    quantity = Column(Integer, nullable=False)  # 领用数量
    token_cost = Column(Integer, default=0)  # Token 消耗
    
    # 领用人
    user_id = Column(Integer, nullable=True)  # 教师/学生ID
    user_name = Column(String(100))  # 领用人姓名（冗余）
    user_type = Column(String(20), default="student")  # 领用类型：student/teacher
    
    # 用途
    purpose = Column(String(500))  # 用途说明
    project_id = Column(Integer, nullable=True)  # 关联项目
    club_id = Column(Integer, nullable=True)  # 关联社团
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    consumable = relationship("Consumable", back_populates="usage_records")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<ConsumableUsage(id={self.id}, consumable_id={self.consumable_id}, qty={self.quantity})>"


class ConsumablePurchaseRequest(Base):
    """耗材申购单模型"""

    __tablename__ = "stem_consumable_purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 申购信息
    title = Column(String(200), nullable=False)  # 申购标题
    reason = Column(Text)  # 申购理由
    
    # 状态
    status = Column(Enum(PurchaseRequestStatus), default=PurchaseRequestStatus.PENDING)
    
    # 发起人
    requester_id = Column(Integer, nullable=True)  # 发起人（导师）
    requester_name = Column(String(100))  # 发起人姓名
    
    # 审批信息
    reviewer_id = Column(Integer, nullable=True)  # 审批人
    reviewer_name = Column(String(100))  # 审批人姓名
    review_comment = Column(Text)  # 审批意见
    reviewed_at = Column(DateTime)  # 审批时间
    
    # 采购信息
    estimated_total = Column(Float, default=0.0)  # 预估总价
    actual_total = Column(Float)  # 实际总价
    supplier = Column(String(200))  # 供应商
    ordered_at = Column(DateTime)  # 采购时间
    received_at = Column(DateTime)  # 到货时间
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    items = relationship("PurchaseRequestItem", back_populates="request", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ConsumablePurchaseRequest(id={self.id}, title='{self.title}', status='{self.status}')>"


class PurchaseRequestItem(Base):
    """申购单明细模型"""

    __tablename__ = "stem_purchase_request_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("stem_consumable_purchase_requests.id"), nullable=False, index=True)
    consumable_id = Column(Integer, ForeignKey("stem_consumables.id"), nullable=True, index=True)
    
    # 物品信息
    consumable_name = Column(String(200), nullable=False)  # 耗材名称
    specification = Column(String(200))  # 规格
    quantity = Column(Integer, nullable=False)  # 申购数量
    estimated_price = Column(Float, default=0.0)  # 预估单价
    actual_price = Column(Float)  # 实际单价
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    request = relationship("ConsumablePurchaseRequest", back_populates="items")
    consumable = relationship("Consumable")
    
    def __repr__(self):
        return f"<PurchaseRequestItem(id={self.id}, name='{self.consumable_name}', qty={self.quantity})>"


# ============================================================
# Pydantic Schemas
# ============================================================
from pydantic import BaseModel, Field


# ----- Consumable -----
class ConsumableCreate(BaseModel):
    """创建耗材的请求模型"""
    name: str = Field(..., min_length=1, max_length=200)
    category: ConsumableCategory
    specification: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    unit: str = Field(default="个", max_length=20)
    unit_price: float = 0.0
    token_price: int = 0
    current_stock: int = 0
    min_stock: int = Field(default=10, ge=0)
    max_stock: int = Field(default=200, ge=0)
    supplier: Optional[str] = Field(None, max_length=200)
    supplier_contact: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)


class ConsumableUpdate(BaseModel):
    """更新耗材的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[ConsumableCategory] = None
    specification: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=20)
    unit_price: Optional[float] = None
    token_price: Optional[int] = None
    current_stock: Optional[int] = None
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=200)
    supplier_contact: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)


class ConsumableResponse(BaseModel):
    """耗材响应模型"""
    id: int
    org_id: int
    name: str
    category: ConsumableCategory
    specification: Optional[str]
    description: Optional[str]
    unit: str
    unit_price: float
    token_price: int
    current_stock: int
    min_stock: int
    max_stock: int
    supplier: Optional[str]
    supplier_contact: Optional[str]
    image_url: Optional[str]
    is_active: bool
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- ConsumableUsage -----
class ConsumableUsageCreate(BaseModel):
    """创建耗材领用记录的请求模型"""
    consumable_id: int
    quantity: int = Field(..., ge=1)
    user_id: Optional[int] = None
    user_name: Optional[str] = Field(None, max_length=100)
    user_type: str = Field(default="student", max_length=20)
    purpose: Optional[str] = None
    project_id: Optional[int] = None
    club_id: Optional[int] = None


class ConsumableUsageResponse(BaseModel):
    """耗材领用记录响应模型"""
    id: int
    consumable_id: int
    org_id: int
    quantity: int
    token_cost: int
    user_id: Optional[int]
    user_name: Optional[str]
    user_type: str
    purpose: Optional[str]
    project_id: Optional[int]
    club_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ----- PurchaseRequest -----
class PurchaseRequestItemCreate(BaseModel):
    """申购单明细创建模型"""
    consumable_id: Optional[int] = None
    consumable_name: str = Field(..., min_length=1, max_length=200)
    specification: Optional[str] = Field(None, max_length=200)
    quantity: int = Field(..., ge=1)
    estimated_price: float = 0.0


class PurchaseRequestCreate(BaseModel):
    """创建申购单的请求模型"""
    title: str = Field(..., min_length=1, max_length=200)
    reason: Optional[str] = None
    requester_name: Optional[str] = Field(None, max_length=100)
    items: List[PurchaseRequestItemCreate] = Field(..., min_items=1)


class PurchaseRequestReview(BaseModel):
    """审核申购单的请求模型"""
    status: PurchaseRequestStatus
    review_comment: Optional[str] = None


class PurchaseRequestItemResponse(BaseModel):
    """申购单明细响应模型"""
    id: int
    request_id: int
    consumable_id: Optional[int]
    consumable_name: str
    specification: Optional[str]
    quantity: int
    estimated_price: float
    actual_price: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseRequestResponse(BaseModel):
    """申购单响应模型"""
    id: int
    org_id: int
    title: str
    reason: Optional[str]
    status: PurchaseRequestStatus
    requester_id: Optional[int]
    requester_name: Optional[str]
    reviewer_id: Optional[int]
    reviewer_name: Optional[str]
    review_comment: Optional[str]
    reviewed_at: Optional[datetime]
    estimated_total: float
    actual_total: Optional[float]
    supplier: Optional[str]
    ordered_at: Optional[datetime]
    received_at: Optional[datetime]
    items: List[PurchaseRequestItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- Dashboard/Stats -----
class ConsumableStatsResponse(BaseModel):
    """耗材统计概览"""
    total_types: int
    low_stock_count: int
    total_stock_value: float
    monthly_usage_count: int
    pending_purchase_requests: int


class LowStockItem(BaseModel):
    """低库存耗材项"""
    id: int
    name: str
    category: ConsumableCategory
    current_stock: int
    min_stock: int
    unit: str