"""
职业学校 - 实训设备管理数据模型

涵盖工业级设备（PLC、CNC、工业机器人、嵌入式平台、电工电子实训台等）
的全生命周期管理，与通用硬件设备模型（hardware_device）互补，
聚焦职业学校实训特有场景。
"""

from datetime import datetime, date
from typing import Optional, List
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Date,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from utils.database import Base


# ==================== 枚举定义 ====================


class VocEquipmentCategory(str, enum.Enum):
    """实训设备分类枚举（职业学校特有）"""
    PLC = "plc"                           # PLC 控制套件
    CNC = "cnc"                           # CNC 数控机床
    INDUSTRIAL_ROBOT = "industrial_robot"  # 工业机器人
    EMBEDDED = "embedded"                 # 嵌入式开发平台
    ELECTRICAL = "electrical"             # 电工电子实训台
    PRINTER_3D = "printer_3d"            # 3D 打印机
    SENSOR_SYSTEM = "sensor_system"       # 传感器系统
    INSTRUMENT = "instrument"             # 测量仪器
    AUTO_CONTROL = "auto_control"         # 自动化控制系统
    HYDRAULIC = "hydraulic"               # 液压气动系统
    WELDING = "welding"                   # 焊接设备
    WIRING = "wiring"                     # 布线/接线系统
    COMPUTER = "computer"                 # 计算机/工控机
    OTHER = "other"                       # 其他


class VocEquipmentStatus(str, enum.Enum):
    """实训设备状态枚举"""
    AVAILABLE = "available"               # 可用
    IN_USE = "in_use"                     # 使用中/已借用
    MAINTENANCE = "maintenance"           # 维修中
    RETIRED = "retired"                   # 已报废
    IDLE = "idle"                         # 闲置（超过 N 天未使用）
    LOST = "lost"                         # 丢失


class VocSafetyLevel(str, enum.Enum):
    """设备安全分级"""
    NORMAL = "normal"                     # 普通
    WARNING = "warning"                   # 警告（需基本安全培训）
    DANGEROUS = "dangerous"              # 危险（需专项安全认证）


class VocBorrowStatus(str, enum.Enum):
    """借用记录状态"""
    PENDING = "pending"                   # 待审批
    APPROVED = "approved"                 # 已批准
    ACTIVE = "active"                     # 借用中
    RETURNED = "returned"                 # 已归还
    OVERDUE = "overdue"                   # 逾期
    REJECTED = "rejected"                 # 已拒绝


class VocMaintenanceType(str, enum.Enum):
    """维护类型"""
    REPAIR = "repair"                     # 维修
    CALIBRATION = "calibration"           # 校准
    UPGRADE = "upgrade"                   # 固件升级
    INSPECTION = "inspection"             # 定期检查
    CLEANING = "cleaning"                 # 清洁保养


# ==================== 主模型：实训设备 ====================


class VocEquipment(Base):
    """实训设备模型（职业学校版）"""

    __tablename__ = "voc_equipment"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # ---- 基本信息 ----
    name = Column(String(200), nullable=False, index=True)        # 设备名称
    model = Column(String(200), nullable=False)                   # 型号
    serial_number = Column(String(200), unique=True, index=True)  # 序列号/SN
    category = Column(Enum(VocEquipmentCategory), nullable=False) # 设备分类
    brand = Column(String(100))                                    # 品牌
    description = Column(Text)                                     # 设备描述

    # ---- 存放定位（四级定位） ----
    location_building = Column(String(100))        # 楼栋
    location_floor = Column(String(50))            # 楼层
    location_room = Column(String(100))            # 实训室
    location_station = Column(String(100))         # 工位/柜号

    # ---- 采购信息 ----
    purchase_date = Column(Date)                    # 采购日期
    purchase_price = Column(Float, default=0.0)    # 采购价格
    supplier = Column(String(200))                  # 供应商
    warranty_expire = Column(Date)                  # 保修到期日

    # ---- 安全与状态 ----
    safety_level = Column(Enum(VocSafetyLevel), default=VocSafetyLevel.NORMAL)  # 安全等级
    status = Column(Enum(VocEquipmentStatus), default=VocEquipmentStatus.AVAILABLE)

    # ---- 二维码 ----
    qr_code_url = Column(String(500))              # 二维码图片 URL

    # ---- 使用统计 ----
    total_borrow_count = Column(Integer, default=0)   # 累计借用次数
    total_usage_hours = Column(Float, default=0.0)   # 累计使用小时数

    # ---- 维护相关 ----
    last_maintenance_date = Column(Date)           # 最近维护日期
    next_maintenance_date = Column(Date)           # 下次维护日期
    last_check_date = Column(Date)                 # 最近检查日期

    # ---- 技术参数 ----
    specifications = Column(JSON)                   # 技术规格（JSON 格式）
    accessories = Column(JSON)                      # 配件清单（JSON 格式）

    # ---- 系统字段 ----
    is_active = Column(Boolean, default=True)
    idle_threshold_days = Column(Integer, default=30)  # 闲置判定天数
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ---- 关系 ----
    organization = relationship("Organization")
    borrow_records = relationship("VocEquipmentBorrow", back_populates="equipment",
                                  cascade="all, delete-orphan",
                                  foreign_keys="VocEquipmentBorrow.equipment_id")
    maintenance_records = relationship("VocEquipmentMaintenance", back_populates="equipment",
                                       cascade="all, delete-orphan")
    fault_reports = relationship("VocFaultReport", back_populates="equipment",
                                 cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VocEquipment(id={self.id}, name='{self.name}', sn='{self.serial_number}')>"


# ==================== 借用记录 ====================


class VocEquipmentBorrow(Base):
    """实训设备借用/归还记录"""

    __tablename__ = "voc_equipment_borrows"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("voc_equipment.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # ---- 借用人 ----
    borrower_id = Column(Integer, nullable=False, index=True)   # 用户ID
    borrower_name = Column(String(100))                          # 用户名（冗余）
    borrower_type = Column(String(20), default="student")        # student / teacher

    # ---- 借用信息 ----
    borrow_date = Column(DateTime, default=datetime.utcnow)     # 借用时间
    expected_return_date = Column(Date)                          # 预计归还日
    actual_return_date = Column(DateTime, nullable=True)        # 实际归还日
    purpose = Column(String(500))                                # 用途说明
    purpose_type = Column(String(50), default="course")         # course / project / competition
    related_id = Column(Integer, nullable=True)                  # 关联ID（课程/项目/竞赛）

    # ---- 审批 ----
    status = Column(Enum(VocBorrowStatus), default=VocBorrowStatus.ACTIVE)
    approver_id = Column(Integer, nullable=True)                 # 审批人ID
    approver_name = Column(String(100))                          # 审批人姓名
    approved_at = Column(DateTime, nullable=True)                # 审批时间
    reject_reason = Column(String(500))                          # 拒绝原因

    # ---- 归还检查 ----
    return_condition = Column(String(500))                       # 归还时设备状况
    is_damaged = Column(Boolean, default=False)                  # 是否损坏
    damage_description = Column(Text)                            # 损坏描述

    # ---- 系统字段 ----
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ---- 关系 ----
    equipment = relationship("VocEquipment", back_populates="borrow_records",
                             foreign_keys=[equipment_id])

    def __repr__(self):
        return f"<VocBorrow(id={self.id}, eq={self.equipment_id}, by={self.borrower_name})>"


# ==================== 维护记录 ====================


class VocEquipmentMaintenance(Base):
    """实训设备维护记录"""

    __tablename__ = "voc_equipment_maintenance"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("voc_equipment.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    maintenance_type = Column(Enum(VocMaintenanceType), nullable=False)
    description = Column(Text)                                    # 维护内容描述
    maintainer = Column(String(100))                              # 维护人
    maintainer_contact = Column(String(100))                      # 联系方式
    maintenance_date = Column(Date, default=date.today)           # 维护日期
    cost = Column(Float, default=0.0)                             # 维护费用
    notes = Column(Text)                                          # 备注
    attachment_url = Column(String(500))                          # 附件（维修单/照片）

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    equipment = relationship("VocEquipment", back_populates="maintenance_records")

    def __repr__(self):
        return f"<VocMaintenance(id={self.id}, eq={self.equipment_id}, type={self.maintenance_type})>"


# ==================== 故障报修 ====================


class VocFaultReport(Base):
    """设备故障报修记录"""

    __tablename__ = "voc_fault_reports"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("voc_equipment.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    reporter_id = Column(Integer, nullable=False)                  # 报修人ID
    reporter_name = Column(String(100))                            # 报修人姓名
    fault_type = Column(String(100))                               # 故障类型
    description = Column(Text)                                     # 故障描述
    photo_urls = Column(JSON)                                      # 照片URL列表

    # 维修进度
    status = Column(String(20), default="pending")                 # pending / processing / resolved
    assigned_to = Column(String(100))                              # 指派给
    resolution = Column(Text)                                      # 处理结果
    resolved_at = Column(DateTime, nullable=True)                  # 解决时间

    # 系统字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    equipment = relationship("VocEquipment", back_populates="fault_reports")

    def __repr__(self):
        return f"<VocFaultReport(id={self.id}, eq={self.equipment_id}, status={self.status})>"


# ==================== 设备盘点记录 ====================


class VocInventoryRecord(Base):
    """设备盘点记录"""

    __tablename__ = "voc_inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    inventory_date = Column(Date, default=date.today)              # 盘点日期
    inventory_area = Column(String(200))                           # 盘点区域（实训室名称）
    checker_id = Column(Integer)                                   # 盘点人ID
    checker_name = Column(String(100))                             # 盘点人姓名

    total_count = Column(Integer, default=0)                       # 应盘数量
    scanned_count = Column(Integer, default=0)                     # 实盘数量
    matched_count = Column(Integer, default=0)                     # 相符数量
    missing_count = Column(Integer, default=0)                     # 盘亏数量
    surplus_count = Column(Integer, default=0)                     # 盘盈数量
    damaged_count = Column(Integer, default=0)                     # 损坏数量

    details = Column(JSON)                                         # 盘点明细（JSON）
    status = Column(String(20), default="draft")                   # draft / completed
    notes = Column(Text)                                           # 备注

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<VocInventory(id={self.id}, date={self.inventory_date}, area='{self.inventory_area}')>"


# ==================== Pydantic Schemas ====================

from datetime import datetime as dt_datetime
from typing import Optional as Opt
from pydantic import BaseModel, Field


class VocEquipmentCreate(BaseModel):
    """创建设备请求"""
    name: str = Field(..., max_length=200, description="设备名称")
    model: str = Field(..., max_length=200, description="型号")
    serial_number: Opt[str] = Field(None, max_length=200, description="序列号")
    category: str = Field(..., description="设备分类")
    brand: Opt[str] = Field(None, max_length=100, description="品牌")
    description: Opt[str] = Field(None, description="设备描述")
    location_building: Opt[str] = Field(None, max_length=100, description="楼栋")
    location_floor: Opt[str] = Field(None, max_length=50, description="楼层")
    location_room: Opt[str] = Field(None, max_length=100, description="实训室")
    location_station: Opt[str] = Field(None, max_length=100, description="工位")
    purchase_date: Opt[date] = Field(None, description="采购日期")
    purchase_price: Opt[float] = Field(0.0, description="采购价格")
    supplier: Opt[str] = Field(None, max_length=200, description="供应商")
    warranty_expire: Opt[date] = Field(None, description="保修到期日")
    safety_level: str = Field("normal", description="安全等级")
    specifications: Opt[dict] = Field(None, description="技术规格(JSON)")
    accessories: Opt[list] = Field(None, description="配件清单(JSON)")


class VocEquipmentUpdate(BaseModel):
    """更新设备请求"""
    name: Opt[str] = Field(None, max_length=200)
    model: Opt[str] = Field(None, max_length=200)
    serial_number: Opt[str] = Field(None, max_length=200)
    category: Opt[str] = None
    brand: Opt[str] = Field(None, max_length=100)
    description: Opt[str] = None
    location_building: Opt[str] = Field(None, max_length=100)
    location_floor: Opt[str] = Field(None, max_length=50)
    location_room: Opt[str] = Field(None, max_length=100)
    location_station: Opt[str] = Field(None, max_length=100)
    purchase_date: Opt[date] = None
    purchase_price: Opt[float] = None
    supplier: Opt[str] = Field(None, max_length=200)
    warranty_expire: Opt[date] = None
    safety_level: Opt[str] = None
    status: Opt[str] = None
    specifications: Opt[dict] = None
    accessories: Opt[list] = None


class VocEquipmentResponse(BaseModel):
    """设备响应"""
    id: int
    org_id: int
    name: str
    model: str
    serial_number: Opt[str] = None
    category: str
    brand: Opt[str] = None
    description: Opt[str] = None
    location_building: Opt[str] = None
    location_floor: Opt[str] = None
    location_room: Opt[str] = None
    location_station: Opt[str] = None
    purchase_date: Opt[date] = None
    purchase_price: Opt[float] = None
    supplier: Opt[str] = None
    warranty_expire: Opt[date] = None
    safety_level: str = "normal"
    status: str = "available"
    qr_code_url: Opt[str] = None
    total_borrow_count: int = 0
    total_usage_hours: float = 0.0
    last_maintenance_date: Opt[date] = None
    next_maintenance_date: Opt[date] = None
    is_active: bool = True
    created_at: Opt[dt_datetime] = None

    model_config = {"from_attributes": True}


class VocBorrowCreate(BaseModel):
    """借用设备请求"""
    equipment_id: int = Field(..., description="设备ID")
    borrower_id: int = Field(..., description="借用人ID")
    borrower_name: str = Field(..., max_length=100, description="借用人姓名")
    borrower_type: str = Field("student", description="借用人类型")
    expected_return_date: date = Field(..., description="预计归还日")
    purpose: Opt[str] = Field(None, max_length=500, description="用途说明")
    purpose_type: str = Field("course", description="用途类型")
    related_id: Opt[int] = Field(None, description="关联ID")
    needs_approval: bool = Field(False, description="是否需要审批")


class VocBorrowResponse(BaseModel):
    """借用记录响应"""
    id: int
    equipment_id: int
    org_id: int
    borrower_id: int
    borrower_name: Opt[str] = None
    borrower_type: Opt[str] = None
    borrow_date: Opt[dt_datetime] = None
    expected_return_date: Opt[date] = None
    actual_return_date: Opt[dt_datetime] = None
    purpose: Opt[str] = None
    purpose_type: Opt[str] = None
    status: str = "active"
    approver_id: Opt[int] = None
    approver_name: Opt[str] = None
    is_damaged: bool = False
    damage_description: Opt[str] = None

    model_config = {"from_attributes": True}


class VocFaultReportCreate(BaseModel):
    """提交故障报修请求"""
    equipment_id: int = Field(..., description="设备ID")
    reporter_id: int = Field(..., description="报修人ID")
    reporter_name: str = Field(..., max_length=100, description="报修人姓名")
    fault_type: str = Field(..., max_length=100, description="故障类型")
    description: str = Field(..., description="故障描述")
    photo_urls: Opt[list] = Field(None, description="照片URL列表")


class VocFaultReportResponse(BaseModel):
    """故障报修响应"""
    id: int
    equipment_id: int
    org_id: int
    reporter_id: int
    reporter_name: Opt[str] = None
    fault_type: Opt[str] = None
    description: Opt[str] = None
    photo_urls: Opt[list] = None
    status: str = "pending"
    assigned_to: Opt[str] = None
    resolution: Opt[str] = None
    created_at: Opt[dt_datetime] = None

    model_config = {"from_attributes": True}


class VocMaintenanceCreate(BaseModel):
    """创建维护记录请求"""
    equipment_id: int = Field(..., description="设备ID")
    maintenance_type: str = Field(..., description="维护类型")
    description: str = Field(..., description="维护内容")
    maintainer: Opt[str] = Field(None, max_length=100, description="维护人")
    maintainer_contact: Opt[str] = Field(None, max_length=100, description="联系方式")
    maintenance_date: Opt[date] = Field(None, description="维护日期")
    cost: float = Field(0.0, description="维护费用")
    notes: Opt[str] = Field(None, description="备注")
    attachment_url: Opt[str] = Field(None, max_length=500, description="附件URL")


class VocDashboardStats(BaseModel):
    """职业学校仪表盘统计数据"""
    total_equipment: int = 0
    equipment_in_use: int = 0
    equipment_available: int = 0
    equipment_maintenance: int = 0
    equipment_usage_rate: str = "0%"
    equipment_idle_count: int = 0
    active_borrows: int = 0
    overdue_borrows: int = 0
    total_faults_pending: int = 0
    safety_days: int = 0

    model_config = {"from_attributes": True}