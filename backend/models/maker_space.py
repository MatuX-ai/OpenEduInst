"""
创客空间调度数据模型
用于STEM培训机构的实验室和设备预约管理
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
)
from sqlalchemy.orm import relationship

from utils.database import Base


class SpaceType(str, enum.Enum):
    """空间类型枚举"""
    LAB_ARDUINO = "lab_arduino"       # Arduino实验室
    LAB_IOT = "lab_iot"               # IoT实验室
    LAB_ROBOTICS = "lab_robotics"     # 机器人实验室
    LAB_AI = "lab_ai"                 # AI实验室
    LAB_3D_PRINTING = "lab_3d_printing"  # 3D打印实验室
    MAKER_SPACE = "maker_space"       # 创客空间
    MEETING_ROOM = "meeting_room"     # 会议室
    OTHER = "other"                   # 其他


class SpaceStatus(str, enum.Enum):
    """空间状态枚举"""
    AVAILABLE = "available"           # 可用
    OCCUPIED = "occupied"             # 使用中
    MAINTENANCE = "maintenance"       # 维护中
    CLOSED = "closed"                 # 关闭


class BookingStatus(str, enum.Enum):
    """预约状态枚举"""
    PENDING = "pending"               # 待确认
    CONFIRMED = "confirmed"           # 已确认
    CANCELLED = "cancelled"           # 已取消
    COMPLETED = "completed"           # 已完成
    NO_SHOW = "no_show"               # 未到场


class MakerSpace(Base):
    """创客空间/实验室模型"""

    __tablename__ = "maker_spaces"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 空间基本信息
    name = Column(String(200), nullable=False)  # 空间名称
    description = Column(Text)  # 空间描述
    space_type = Column(Enum(SpaceType), nullable=False)  # 空间类型
    
    # 容量信息
    capacity = Column(Integer, default=20)  # 容纳人数
    current_occupancy = Column(Integer, default=0)  # 当前占用数
    
    # 位置信息
    location = Column(String(200))  # 位置描述
    floor = Column(Integer)  # 楼层
    room_number = Column(String(50))  # 房间号
    
    # 设备清单
    equipment_list = Column(Text)  # 设备清单（JSON格式）
    
    # 状态信息
    status = Column(Enum(SpaceStatus), default=SpaceStatus.AVAILABLE)
    
    # 开放时间
    open_time = Column(String(10))  # 开放时间 (HH:MM)
    close_time = Column(String(10))  # 关闭时间 (HH:MM)
    
    # 预约规则
    max_booking_hours = Column(Integer, default=4)  # 最大预约时长（小时）
    advance_booking_days = Column(Integer, default=7)  # 可提前预约天数
    cancellation_hours = Column(Integer, default=24)  # 取消预约提前时间（小时）
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    notes = Column(Text)  # 备注
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    bookings = relationship("SpaceBooking", back_populates="space")
    
    def __repr__(self):
        return f"<MakerSpace(id={self.id}, name='{self.name}', type='{self.space_type}')>"


class SpaceBooking(Base):
    """空间预约记录模型"""

    __tablename__ = "space_bookings"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("maker_spaces.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 预约信息
    user_id = Column(Integer, nullable=False)  # 预约人（暂时移除外键）
    project_id = Column(Integer, ForeignKey("stem_projects.id"), nullable=True)  # 关联项目
    
    # 时间安排
    start_time = Column(DateTime, nullable=False)  # 开始时间
    end_time = Column(DateTime, nullable=False)  # 结束时间
    
    # 预约详情
    purpose = Column(String(500))  # 预约目的
    participant_count = Column(Integer, default=1)  # 参与人数
    required_equipment = Column(Text)  # 所需设备（JSON格式）
    
    # 状态信息
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    
    # 审批信息
    approved_by = Column(Integer, nullable=True)  # 审批人（暂时移除外键）
    approved_at = Column(DateTime, nullable=True)  # 审批时间
    rejection_reason = Column(Text)  # 拒绝原因
    
    # 使用反馈
    actual_start_time = Column(DateTime, nullable=True)  # 实际开始时间
    actual_end_time = Column(DateTime, nullable=True)  # 实际结束时间
    feedback = Column(Text)  # 使用反馈
    rating = Column(Integer)  # 评分 (1-5)
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    space = relationship("MakerSpace", back_populates="bookings")
    organization = relationship("Organization")
    # user = relationship("User", foreign_keys=[user_id])  # 暂时注释
    # approver = relationship("User", foreign_keys=[approved_by])  # 暂时注释
    
    def __repr__(self):
        return f"<SpaceBooking(id={self.id}, space_id={self.space_id}, status='{self.status}')>"


class EquipmentSlot(Base):
    """设备时段预约模型"""

    __tablename__ = "equipment_slots"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 设备信息
    device_id = Column(Integer, ForeignKey("hardware_devices.id"), nullable=False, index=True)  # 关联硬件设备
    
    # 预约信息
    user_id = Column(Integer, nullable=False)  # 预约人（暂时移除外键）
    project_id = Column(Integer, ForeignKey("stem_projects.id"), nullable=True)  # 关联项目
    
    # 时间安排
    start_time = Column(DateTime, nullable=False)  # 开始时间
    end_time = Column(DateTime, nullable=False)  # 结束时间
    
    # 预约详情
    purpose = Column(String(500))  # 使用目的
    
    # 状态信息
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    device = relationship("HardwareDevice")
    # user = relationship("User", foreign_keys=[user_id])  # 暂时注释
    
    def __repr__(self):
        return f"<EquipmentSlot(id={self.id}, device_id={self.device_id})>"


# Pydantic Schemas
from pydantic import BaseModel, Field


class MakerSpaceCreate(BaseModel):
    """创建创客空间的请求模型"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    space_type: SpaceType
    capacity: int = Field(default=20, ge=1, le=200)
    location: Optional[str] = Field(None, max_length=200)
    floor: Optional[int] = None
    room_number: Optional[str] = Field(None, max_length=50)
    equipment_list: Optional[List[str]] = None
    open_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    close_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    max_booking_hours: int = Field(default=4, ge=1, le=24)
    advance_booking_days: int = Field(default=7, ge=1, le=30)
    cancellation_hours: int = Field(default=24, ge=1, le=168)
    notes: Optional[str] = None


class MakerSpaceUpdate(BaseModel):
    """更新创客空间的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1, le=200)
    status: Optional[SpaceStatus] = None
    location: Optional[str] = Field(None, max_length=200)
    equipment_list: Optional[List[str]] = None
    open_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    close_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    max_booking_hours: Optional[int] = Field(None, ge=1, le=24)
    advance_booking_days: Optional[int] = Field(None, ge=1, le=30)
    cancellation_hours: Optional[int] = Field(None, ge=1, le=168)
    notes: Optional[str] = None


class MakerSpaceResponse(BaseModel):
    """创客空间响应模型"""
    id: int
    org_id: int
    name: str
    description: Optional[str]
    space_type: SpaceType
    capacity: int
    current_occupancy: int
    location: Optional[str]
    floor: Optional[int]
    room_number: Optional[str]
    equipment_list: Optional[List[str]]
    status: SpaceStatus
    open_time: Optional[str]
    close_time: Optional[str]
    max_booking_hours: int
    advance_booking_days: int
    cancellation_hours: int
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class SpaceBookingCreate(BaseModel):
    """创建空间预约的请求模型"""
    space_id: int
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = Field(None, max_length=500)
    participant_count: int = Field(default=1, ge=1, le=100)
    required_equipment: Optional[List[str]] = None
    project_id: Optional[int] = None


class SpaceBookingResponse(BaseModel):
    """空间预约响应模型"""
    id: int
    space_id: int
    org_id: int
    user_id: int
    project_id: Optional[int]
    start_time: datetime
    end_time: datetime
    purpose: Optional[str]
    participant_count: int
    required_equipment: Optional[List[str]]
    status: BookingStatus
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    feedback: Optional[str]
    rating: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class EquipmentSlotCreate(BaseModel):
    """创建设备时段预约的请求模型"""
    device_id: int
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = Field(None, max_length=500)
    project_id: Optional[int] = None


class EquipmentSlotResponse(BaseModel):
    """设备时段预约响应模型"""
    id: int
    org_id: int
    device_id: int
    user_id: int
    project_id: Optional[int]
    start_time: datetime
    end_time: datetime
    purpose: Optional[str]
    status: BookingStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True