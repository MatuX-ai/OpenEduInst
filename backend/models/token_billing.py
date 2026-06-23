"""
Token计费系统数据模型
用于STEM培训机构的AI功能计费管理
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


class TokenType(str, enum.Enum):
    """Token类型枚举"""
    AI_TUTOR = "ai_tutor"           # AI助教
    SMART_ASSESSMENT = "smart_assessment"  # 智能评测
    COURSE_GENERATION = "course_generation"  # 课程生成
    CODE_REVIEW = "code_review"     # 代码审查
    PROJECT_SUGGESTION = "project_suggestion"  # 项目建议
    OTHER = "other"                 # 其他


class TokenTransactionType(str, enum.Enum):
    """Token交易类型枚举"""
    PURCHASE = "purchase"           # 购买
    CONSUME = "consume"             # 消耗
    REFUND = "refund"               # 退款
    BONUS = "bonus"                 # 赠送
    ADJUSTMENT = "adjustment"       # 调整


class TokenPackage(Base):
    """Token套餐模型"""

    __tablename__ = "stem_token_packages"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 套餐信息
    name = Column(String(100), nullable=False)  # 套餐名称
    description = Column(Text)  # 套餐描述
    token_amount = Column(Integer, nullable=False)  # Token数量
    price = Column(Float, nullable=False)  # 价格
    currency = Column(String(10), default="CNY")  # 货币单位
    
    # 有效期
    validity_days = Column(Integer, default=365)  # 有效期（天）
    
    # 状态
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)  # 是否热门
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<TokenPackage(id={self.id}, name='{self.name}', tokens={self.token_amount})>"


class TokenBalance(Base):
    """Token余额模型"""

    __tablename__ = "stem_token_balances"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, unique=True, index=True)
    
    # 余额信息
    balance = Column(Integer, default=0)  # 当前余额
    total_purchased = Column(Integer, default=0)  # 累计购买
    total_consumed = Column(Integer, default=0)  # 累计消耗
    total_refunded = Column(Integer, default=0)  # 累计退款
    total_bonus = Column(Integer, default=0)  # 累计赠送
    
    # 最后更新时间
    last_transaction_at = Column(DateTime, nullable=True)
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    transactions = relationship("TokenTransaction", back_populates="balance")
    
    def __repr__(self):
        return f"<TokenBalance(org_id={self.org_id}, balance={self.balance})>"


class TokenTransaction(Base):
    """Token交易记录模型"""

    __tablename__ = "stem_token_transactions"

    id = Column(Integer, primary_key=True, index=True)
    balance_id = Column(Integer, ForeignKey("stem_token_balances.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 交易信息
    transaction_type = Column(Enum(TokenTransactionType), nullable=False)
    token_type = Column(Enum(TokenType), nullable=True)  # 可选，特定类型的Token
    amount = Column(Integer, nullable=False)  # 交易数量（正数表示增加，负数表示减少）
    description = Column(Text)  # 交易描述
    
    # 关联信息
    reference_id = Column(String(100))  # 参考ID（如订单号、项目ID等）
    user_id = Column(Integer, nullable=True)  # 操作用户（暂时移除外键）
    
    # 费用信息
    unit_price = Column(Float, default=0.0)  # 单价
    total_cost = Column(Float, default=0.0)  # 总费用
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    balance = relationship("TokenBalance", back_populates="transactions")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<TokenTransaction(id={self.id}, type='{self.transaction_type}', amount={self.amount})>"


class TokenUsageLog(Base):
    """Token使用日志模型"""

    __tablename__ = "stem_token_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 使用信息
    user_id = Column(Integer, nullable=False)  # 使用者（暂时移除外键）
    token_type = Column(Enum(TokenType), nullable=False)  # Token类型
    amount = Column(Integer, nullable=False)  # 使用数量
    description = Column(Text)  # 使用描述
    
    # 关联信息
    project_id = Column(Integer, nullable=True)  # 关联项目（暂时移除外键）
    session_id = Column(String(100))  # 会话ID
    api_endpoint = Column(String(200))  # API端点
    
    # 使用详情
    input_tokens = Column(Integer, default=0)  # 输入Token数
    output_tokens = Column(Integer, default=0)  # 输出Token数
    processing_time = Column(Float)  # 处理时间（秒）
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<TokenUsageLog(id={self.id}, user_id={self.user_id}, amount={self.amount})>"


# Pydantic Schemas
from pydantic import BaseModel, Field


class TokenPackageCreate(BaseModel):
    """创建Token套餐的请求模型"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    token_amount: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    currency: str = Field(default="CNY", max_length=10)
    validity_days: int = Field(default=365, gt=0)
    is_popular: bool = False


class TokenPackageResponse(BaseModel):
    """Token套餐响应模型"""
    id: int
    org_id: int
    name: str
    description: Optional[str]
    token_amount: int
    price: float
    currency: str
    validity_days: int
    is_active: bool
    is_popular: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenBalanceResponse(BaseModel):
    """Token余额响应模型"""
    id: int
    org_id: int
    balance: int
    total_purchased: int
    total_consumed: int
    total_refunded: int
    total_bonus: int
    last_transaction_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenTransactionCreate(BaseModel):
    """创建Token交易的请求模型"""
    transaction_type: TokenTransactionType
    token_type: Optional[TokenType] = None
    amount: int
    description: Optional[str] = None
    reference_id: Optional[str] = Field(None, max_length=100)
    user_id: Optional[int] = None
    unit_price: float = 0.0
    total_cost: float = 0.0


class TokenTransactionResponse(BaseModel):
    """Token交易响应模型"""
    id: int
    balance_id: int
    org_id: int
    transaction_type: TokenTransactionType
    token_type: Optional[TokenType]
    amount: int
    description: Optional[str]
    reference_id: Optional[str]
    user_id: Optional[int]
    unit_price: float
    total_cost: float
    created_at: datetime

    class Config:
        from_attributes = True


class TokenUsageLogCreate(BaseModel):
    """创建Token使用日志的请求模型"""
    user_id: int
    token_type: TokenType
    amount: int
    description: Optional[str] = None
    project_id: Optional[int] = None
    session_id: Optional[str] = Field(None, max_length=100)
    api_endpoint: Optional[str] = Field(None, max_length=200)
    input_tokens: int = 0
    output_tokens: int = 0
    processing_time: Optional[float] = None


class TokenUsageLogResponse(BaseModel):
    """Token使用日志响应模型"""
    id: int
    org_id: int
    user_id: int
    token_type: TokenType
    amount: int
    description: Optional[str]
    project_id: Optional[int]
    session_id: Optional[str]
    api_endpoint: Optional[str]
    input_tokens: int
    output_tokens: int
    processing_time: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 阶段三 3.2：Token 充值订单模型（订单 + Mock 支付状态机）
# ============================================================


class TokenOrderStatus(str, enum.Enum):
    """Token 订单状态枚举"""
    PENDING = "pending"        # 待支付（订单刚创建）
    PROCESSING = "processing"  # 支付处理中（已调起支付网关）
    SUCCESS = "success"        # 支付成功（已到账）
    FAILED = "failed"          # 支付失败
    REFUNDED = "refunded"      # 已退款
    CANCELLED = "cancelled"    # 已取消


class PaymentMethod(str, enum.Enum):
    """支付方式"""
    MOCK = "mock"               # 沙箱/Mock 支付（演示用）
    WECHAT = "wechat"           # 微信支付
    ALIPAY = "alipay"           # 支付宝
    BANK = "bank_transfer"      # 银行转账


class TokenOrder(Base):
    """Token 充值订单模型"""

    __tablename__ = "stem_token_orders"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # 订单号：TK + YYYYMMDD + 8 位随机（前端可读、可对账）
    order_no = Column(String(64), unique=True, nullable=False, index=True)

    # 关联信息
    package_id = Column(Integer, ForeignKey("stem_token_packages.id"), nullable=True)
    user_id = Column(Integer, nullable=True)  # 发起人（暂时移除外键）

    # 金额信息
    token_amount = Column(Integer, nullable=False)  # 购买 Token 数量
    price = Column(Float, nullable=False)            # 应付金额
    currency = Column(String(10), default="CNY")     # 货币单位

    # 支付信息
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.MOCK)
    status = Column(Enum(TokenOrderStatus), default=TokenOrderStatus.PENDING, index=True)
    transaction_id = Column(String(64), nullable=True)   # 支付网关流水号
    paid_at = Column(DateTime, nullable=True)            # 支付成功时间
    failure_reason = Column(String(255), nullable=True)  # 失败原因

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    organization = relationship("Organization")
    package = relationship("TokenPackage")

    def __repr__(self):
        return (
            f"<TokenOrder(order_no='{self.order_no}', "
            f"status='{self.status.value}', tokens={self.token_amount})>"
        )

    @property
    def is_paid(self) -> bool:
        return self.status == TokenOrderStatus.SUCCESS

    @property
    def is_terminal(self) -> bool:
        """订单是否处于终态（成功/失败/取消/退款）"""
        return self.status in (
            TokenOrderStatus.SUCCESS,
            TokenOrderStatus.FAILED,
            TokenOrderStatus.CANCELLED,
            TokenOrderStatus.REFUNDED,
        )


class TokenOrderCreate(BaseModel):
    """创建 Token 订单的请求模型"""
    package_id: int = Field(..., gt=0, description="套餐 ID")
    payment_method: PaymentMethod = Field(
        default=PaymentMethod.MOCK, description="支付方式"
    )
    user_id: Optional[int] = Field(None, description="发起人用户 ID（可选）")


class TokenOrderResponse(BaseModel):
    """Token 订单响应模型"""
    id: int
    org_id: int
    order_no: str
    package_id: Optional[int]
    user_id: Optional[int]
    token_amount: int
    price: float
    currency: str
    payment_method: PaymentMethod
    status: TokenOrderStatus
    transaction_id: Optional[str]
    paid_at: Optional[datetime]
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_paid: bool
    is_terminal: bool

    class Config:
        from_attributes = True


class MockPaymentConfirmRequest(BaseModel):
    """Mock 支付确认请求（演示用，强制指定成功或失败）"""
    force_fail: bool = Field(
        default=False, description="是否强制失败（用于演示失败链路）"
    )