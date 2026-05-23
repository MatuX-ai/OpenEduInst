"""
STEM培训机构硬件设备管理数据模型
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


class DeviceStatus(str, enum.Enum):
    """设备状态枚举"""
    AVAILABLE = "available"      # 可用
    IN_USE = "in_use"           # 使用中
    MAINTENANCE = "maintenance" # 维护中
    RETIRED = "retired"         # 已退役
    LOST = "lost"               # 丢失


class DeviceCategory(str, enum.Enum):
    """设备分类枚举"""
    ARDUINO = "arduino"         # Arduino开发板
    SENSOR = "sensor"           # 传感器
    RASPBERRY_PI = "raspberry_pi"  # 树莓派
    ROBOT = "robot"             # 机器人
    DRONE = "drone"             # 无人机
    VR_DEVICE = "vr_device"     # VR设备
    PRINTER_3D = "printer_3d"   # 3D打印机
    COMPUTER = "computer"       # 计算机
    OTHER = "other"             # 其他


class HardwareDevice(Base):
    """硬件设备模型"""

    __tablename__ = "hardware_devices"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 设备基本信息
    name = Column(String(200), nullable=False)  # 设备名称
    model = Column(String(100))  # 型号
    serial_number = Column(String(100), unique=True, index=True)  # 序列号
    category = Column(Enum(DeviceCategory), nullable=False)  # 设备分类
    description = Column(Text)  # 设备描述
    
    # 采购信息
    purchase_date = Column(DateTime)  # 采购日期
    purchase_price = Column(Float)  # 采购价格
    supplier = Column(String(200))  # 供应商
    warranty_period = Column(Integer)  # 保修期（月）
    
    # 状态信息
    status = Column(Enum(DeviceStatus), default=DeviceStatus.AVAILABLE)
    location = Column(String(200))  # 存放位置
    assigned_to = Column(Integer, nullable=True)  # 当前使用者（暂时移除外键）
    last_maintenance_date = Column(DateTime)  # 上次维护日期
    next_maintenance_date = Column(DateTime)  # 下次维护日期
    
    # 技术参数
    specifications = Column(Text)  # 技术规格（JSON格式）
    accessories = Column(Text)  # 配件清单（JSON格式）
    
    # 系统字段
    is_active = Column(Boolean, default=True)
    notes = Column(Text)  # 备注
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    organization = relationship("Organization")
    maintenance_records = relationship("DeviceMaintenanceRecord", back_populates="device")
    usage_logs = relationship("DeviceUsageLog", back_populates="device")
    
    def __repr__(self):
        return f"<HardwareDevice(id={self.id}, name='{self.name}', status='{self.status}')>"


class MaintenanceType(str, enum.Enum):
    """维护类型枚举"""
    ROUTINE = "routine"         # 例行维护
    REPAIR = "repair"           # 维修
    UPGRADE = "upgrade"         # 升级
    CALIBRATION = "calibration" # 校准


class DeviceMaintenanceRecord(Base):
    """设备维护记录模型"""

    __tablename__ = "device_maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("hardware_devices.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 维护信息
    maintenance_type = Column(Enum(MaintenanceType), nullable=False)
    description = Column(Text, nullable=False)  # 维护描述
    performed_by = Column(Integer, nullable=True)  # 执行人（暂时移除外键）
    maintenance_date = Column(DateTime, default=datetime.utcnow)  # 维护日期
    cost = Column(Float, default=0.0)  # 维护费用
    
    # 结果信息
    result = Column(Text)  # 维护结果
    next_maintenance_date = Column(DateTime)  # 下次维护日期
    
    # 附件
    attachments = Column(Text)  # 附件列表（JSON格式）
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    device = relationship("HardwareDevice", back_populates="maintenance_records")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<DeviceMaintenanceRecord(id={self.id}, device_id={self.device_id})>"


class DeviceUsageLog(Base):
    """设备使用日志模型"""

    __tablename__ = "device_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("hardware_devices.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 使用信息
    user_id = Column(Integer, nullable=False)  # 使用者（暂时移除外键）
    start_time = Column(DateTime, nullable=False)  # 开始时间
    end_time = Column(DateTime)  # 结束时间
    purpose = Column(String(200))  # 使用目的
    project_id = Column(Integer, nullable=True)  # 关联项目（暂时移除外键）
    
    # 状态信息
    condition_before = Column(Text)  # 使用前状态
    condition_after = Column(Text)  # 使用后状态
    issues_found = Column(Text)  # 发现的问题
    
    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    device = relationship("HardwareDevice", back_populates="usage_logs")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<DeviceUsageLog(id={self.id}, device_id={self.device_id})>"


# Pydantic Schemas
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class HardwareDeviceCreate(BaseModel):
    """创建设备的请求模型"""
    name: str = Field(..., min_length=1, max_length=200)
    model: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    category: DeviceCategory
    description: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    supplier: Optional[str] = Field(None, max_length=200)
    warranty_period: Optional[int] = None
    location: Optional[str] = Field(None, max_length=200)
    specifications: Optional[Dict[str, Any]] = None
    accessories: Optional[List[str]] = None
    notes: Optional[str] = None


class HardwareDeviceUpdate(BaseModel):
    """更新设备的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    model: Optional[str] = Field(None, max_length=100)
    status: Optional[DeviceStatus] = None
    location: Optional[str] = Field(None, max_length=200)
    assigned_to: Optional[int] = None
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    notes: Optional[str] = None


class HardwareDeviceResponse(BaseModel):
    """设备响应模型"""
    id: int
    org_id: int
    name: str
    model: Optional[str]
    serial_number: Optional[str]
    category: DeviceCategory
    description: Optional[str]
    purchase_date: Optional[datetime]
    purchase_price: Optional[float]
    supplier: Optional[str]
    warranty_period: Optional[int]
    status: DeviceStatus
    location: Optional[str]
    assigned_to: Optional[int]
    last_maintenance_date: Optional[datetime]
    next_maintenance_date: Optional[datetime]
    specifications: Optional[Dict[str, Any]]
    accessories: Optional[List[str]]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DeviceMaintenanceRecordCreate(BaseModel):
    """创建维护记录的请求模型"""
    device_id: int
    maintenance_type: MaintenanceType
    description: str
    performed_by: Optional[int] = None
    cost: float = 0.0
    result: Optional[str] = None
    next_maintenance_date: Optional[datetime] = None
    attachments: Optional[List[str]] = None


class DeviceMaintenanceRecordResponse(BaseModel):
    """维护记录响应模型"""
    id: int
    device_id: int
    org_id: int
    maintenance_type: MaintenanceType
    description: str
    performed_by: Optional[int]
    maintenance_date: datetime
    cost: float
    result: Optional[str]
    next_maintenance_date: Optional[datetime]
    attachments: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DeviceUsageLogCreate(BaseModel):
    """创建设备使用日志的请求模型"""
    device_id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    purpose: Optional[str] = Field(None, max_length=200)
    project_id: Optional[int] = None
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    issues_found: Optional[str] = None


class DeviceUsageLogResponse(BaseModel):
    """设备使用日志响应模型"""
    id: int
    device_id: int
    org_id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    purpose: Optional[str]
    project_id: Optional[int]
    condition_before: Optional[str]
    condition_after: Optional[str]
    issues_found: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True