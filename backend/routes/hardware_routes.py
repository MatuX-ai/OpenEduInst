"""
硬件设备管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from utils.database import get_db
from models.hardware_device import (
    HardwareDevice,
    HardwareDeviceCreate,
    HardwareDeviceUpdate,
    HardwareDeviceResponse,
    DeviceMaintenanceRecord,
    DeviceMaintenanceRecordCreate,
    DeviceMaintenanceRecordResponse,
    DeviceUsageLog,
    DeviceUsageLogCreate,
    DeviceUsageLogResponse,
    DeviceStatus,
    DeviceCategory,
)
from models.license import Organization

router = APIRouter(prefix="/api/v1/hardware", tags=["硬件设备管理"])


# 设备管理接口
@router.post("/devices/", response_model=HardwareDeviceResponse)
def create_device(
    device: HardwareDeviceCreate,
    db: Session = Depends(get_db),
):
    """创建新的硬件设备"""
    # 验证组织是否存在（简化处理，实际应从 Token 获取 org_id）
    org = db.query(Organization).filter(Organization.id == device.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 创建设备实例
    db_device = HardwareDevice(
        **device.dict(),
        org_id=org.id,
        specifications=str(device.specifications) if device.specifications else None,
        accessories=str(device.accessories) if device.accessories else None,
    )
    
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    return db_device


@router.get("/devices/", response_model=List[HardwareDeviceResponse])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[DeviceCategory] = None,
    status: Optional[DeviceStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """获取设备列表"""
    query = db.query(HardwareDevice)
    
    # 添加过滤条件
    if category:
        query = query.filter(HardwareDevice.category == category)
    if status:
        query = query.filter(HardwareDevice.status == status)
    if search:
        query = query.filter(
            (HardwareDevice.name.ilike(f"%{search}%")) |
            (HardwareDevice.model.ilike(f"%{search}%")) |
            (HardwareDevice.serial_number.ilike(f"%{search}%"))
        )
    
    devices = query.offset(skip).limit(limit).all()
    return devices


@router.get("/devices/{device_id}", response_model=HardwareDeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
):
    """获取单个设备详情"""
    device = db.query(HardwareDevice).filter(HardwareDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/devices/{device_id}", response_model=HardwareDeviceResponse)
def update_device(
    device_id: int,
    device_update: HardwareDeviceUpdate,
    db: Session = Depends(get_db),
):
    """更新设备信息"""
    device = db.query(HardwareDevice).filter(HardwareDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # 更新字段
    for field, value in device_update.dict(exclude_unset=True).items():
        setattr(device, field, value)
    
    device.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(device)
    
    return device


@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
):
    """删除设备（软删除）"""
    device = db.query(HardwareDevice).filter(HardwareDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.is_active = False
    device.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Device deleted successfully"}


# 维护记录接口
@router.post("/maintenance-records/", response_model=DeviceMaintenanceRecordResponse)
def create_maintenance_record(
    record: DeviceMaintenanceRecordCreate,
    db: Session = Depends(get_db),
):
    """创建设备维护记录"""
    # 验证设备是否存在
    device = db.query(HardwareDevice).filter(HardwareDevice.id == record.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # 创建维护记录
    db_record = DeviceMaintenanceRecord(
        **record.dict(),
        org_id=device.org_id,
        attachments=str(record.attachments) if record.attachments else None,
    )
    
    db.add(db_record)
    
    # 更新设备的下次维护日期
    if record.next_maintenance_date:
        device.next_maintenance_date = record.next_maintenance_date
    
    db.commit()
    db.refresh(db_record)
    
    return db_record


@router.get("/maintenance-records/", response_model=List[DeviceMaintenanceRecordResponse])
def list_maintenance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """获取维护记录列表"""
    query = db.query(DeviceMaintenanceRecord)
    
    if device_id:
        query = query.filter(DeviceMaintenanceRecord.device_id == device_id)
    
    records = query.offset(skip).limit(limit).all()
    return records


# 使用日志接口
@router.post("/usage-logs/", response_model=DeviceUsageLogResponse)
def create_usage_log(
    log: DeviceUsageLogCreate,
    db: Session = Depends(get_db),
):
    """创建设备使用日志"""
    # 验证设备是否存在
    device = db.query(HardwareDevice).filter(HardwareDevice.id == log.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # 创建使用日志
    db_log = DeviceUsageLog(
        **log.dict(),
        org_id=device.org_id,
    )
    
    db.add(db_log)
    
    # 更新设备状态为使用中
    device.status = DeviceStatus.IN_USE
    device.assigned_to = log.user_id
    
    db.commit()
    db.refresh(db_log)
    
    return db_log


@router.get("/usage-logs/", response_model=List[DeviceUsageLogResponse])
def list_usage_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """获取使用日志列表"""
    query = db.query(DeviceUsageLog)
    
    if device_id:
        query = query.filter(DeviceUsageLog.device_id == device_id)
    if user_id:
        query = query.filter(DeviceUsageLog.user_id == user_id)
    
    logs = query.offset(skip).limit(limit).all()
    return logs


# 统计接口
@router.get("/statistics/summary")
def get_device_statistics(
    db: Session = Depends(get_db),
):
    """获取设备统计信息"""
    total_devices = db.query(HardwareDevice).count()
    available_devices = db.query(HardwareDevice).filter(
        HardwareDevice.status == DeviceStatus.AVAILABLE
    ).count()
    in_use_devices = db.query(HardwareDevice).filter(
        HardwareDevice.status == DeviceStatus.IN_USE
    ).count()
    maintenance_devices = db.query(HardwareDevice).filter(
        HardwareDevice.status == DeviceStatus.MAINTENANCE
    ).count()
    
    # 按分类统计
    category_stats = {}
    for category in DeviceCategory:
        count = db.query(HardwareDevice).filter(
            HardwareDevice.category == category
        ).count()
        if count > 0:
            category_stats[category.value] = count
    
    return {
        "total_devices": total_devices,
        "available_devices": available_devices,
        "in_use_devices": in_use_devices,
        "maintenance_devices": maintenance_devices,
        "category_stats": category_stats,
    }