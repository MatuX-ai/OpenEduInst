"""
硬件设备管理 API 路由（多租户版）

【关键安全约束】
- 所有写操作、读操作必须通过 require_org_context 拿到 org_id
- 所有 SQL 查询必须 filter(Model.org_id == org_id)
- 禁止从 query/path/body 读取 org_id
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.hardware_device import (
    DeviceCategory,
    DeviceMaintenanceRecord,
    DeviceMaintenanceRecordCreate,
    DeviceMaintenanceRecordResponse,
    DeviceStatus,
    DeviceUsageLog,
    DeviceUsageLogCreate,
    DeviceUsageLogResponse,
    HardwareDevice,
    HardwareDeviceCreate,
    HardwareDeviceResponse,
    HardwareDeviceUpdate,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/hardware", tags=["硬件设备管理"])


# =================== 设备 ===================

@router.post("/devices/", response_model=HardwareDeviceResponse)
def create_device(
    payload: HardwareDeviceCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新的硬件设备（自动关联到当前 Token 中的组织）"""
    _, org_id = ctx
    device = HardwareDevice(
        org_id=org_id,
        name=payload.name,
        model=payload.model,
        serial_number=payload.serial_number,
        category=payload.category,
        description=payload.description,
        purchase_date=payload.purchase_date,
        purchase_price=payload.purchase_price,
        supplier=payload.supplier,
        warranty_period=payload.warranty_period,
        status=DeviceStatus.AVAILABLE,
        location=payload.location,
        specifications=str(payload.specifications) if payload.specifications else None,
        accessories=str(payload.accessories) if payload.accessories else None,
        notes=payload.notes,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/devices/", response_model=List[HardwareDeviceResponse])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[DeviceCategory] = None,
    status: Optional[DeviceStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的设备列表"""
    _, org_id = ctx
    query = db.query(HardwareDevice).filter(
        HardwareDevice.org_id == org_id,
        HardwareDevice.is_active.is_(True),
    )
    if category:
        query = query.filter(HardwareDevice.category == category)
    if status:
        query = query.filter(HardwareDevice.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (HardwareDevice.name.ilike(like))
            | (HardwareDevice.model.ilike(like))
            | (HardwareDevice.serial_number.ilike(like))
        )
    return query.offset(skip).limit(limit).all()


@router.get("/devices/{device_id}", response_model=HardwareDeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取单个设备详情"""
    _, org_id = ctx
    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在或无权访问")
    return device


@router.put("/devices/{device_id}", response_model=HardwareDeviceResponse)
def update_device(
    device_id: int,
    payload: HardwareDeviceUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新设备信息"""
    _, org_id = ctx
    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在或无权访问")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    device.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(device)
    return device


@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """软删除设备"""
    _, org_id = ctx
    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在或无权访问")
    device.is_active = False
    device.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "设备删除成功"}


# =================== 维护记录 ===================

@router.post("/maintenance-records/", response_model=DeviceMaintenanceRecordResponse)
def create_maintenance_record(
    payload: DeviceMaintenanceRecordCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建设备维护记录"""
    _, org_id = ctx
    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == payload.device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在或无权访问")

    record = DeviceMaintenanceRecord(
        device_id=payload.device_id,
        org_id=org_id,
        maintenance_type=payload.maintenance_type,
        description=payload.description,
        performed_by=payload.performed_by,
        maintenance_date=payload.maintenance_date or datetime.utcnow(),
        cost=payload.cost or 0.0,
        result=payload.result,
        next_maintenance_date=payload.next_maintenance_date,
        attachments=str(payload.attachments) if payload.attachments else None,
    )
    db.add(record)

    if payload.next_maintenance_date:
        device.next_maintenance_date = payload.next_maintenance_date
    db.commit()
    db.refresh(record)
    return record


@router.get("/maintenance-records/", response_model=List[DeviceMaintenanceRecordResponse])
def list_maintenance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的维护记录列表"""
    _, org_id = ctx
    query = db.query(DeviceMaintenanceRecord).filter(
        DeviceMaintenanceRecord.org_id == org_id
    )
    if device_id is not None:
        # 额外校验：该设备也必须是当前组织的
        device = (
            db.query(HardwareDevice)
            .filter(HardwareDevice.id == device_id, HardwareDevice.org_id == org_id)
            .first()
        )
        if not device:
            raise HTTPException(status_code=404, detail="设备不存在或无权访问")
        query = query.filter(DeviceMaintenanceRecord.device_id == device_id)
    return query.offset(skip).limit(limit).all()


# =================== 使用日志 ===================

@router.post("/usage-logs/", response_model=DeviceUsageLogResponse)
def create_usage_log(
    payload: DeviceUsageLogCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建设备使用日志"""
    _, org_id = ctx
    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == payload.device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在或无权访问")

    log = DeviceUsageLog(
        device_id=payload.device_id,
        org_id=org_id,
        user_id=payload.user_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        purpose=payload.purpose,
        project_id=payload.project_id,
        condition_before=payload.condition_before,
        condition_after=payload.condition_after,
        issues_found=payload.issues_found,
    )
    db.add(log)
    device.status = DeviceStatus.IN_USE
    device.assigned_to = payload.user_id
    db.commit()
    db.refresh(log)
    return log


@router.get("/usage-logs/", response_model=List[DeviceUsageLogResponse])
def list_usage_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的设备使用日志列表"""
    _, org_id = ctx
    query = db.query(DeviceUsageLog).filter(DeviceUsageLog.org_id == org_id)
    if device_id is not None:
        device = (
            db.query(HardwareDevice)
            .filter(HardwareDevice.id == device_id, HardwareDevice.org_id == org_id)
            .first()
        )
        if not device:
            raise HTTPException(status_code=404, detail="设备不存在或无权访问")
        query = query.filter(DeviceUsageLog.device_id == device_id)
    if user_id is not None:
        query = query.filter(DeviceUsageLog.user_id == user_id)
    return query.offset(skip).limit(limit).all()


# =================== 统计 ===================

@router.get("/statistics/summary")
def get_device_statistics(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织设备统计"""
    _, org_id = ctx
    base = db.query(HardwareDevice).filter(HardwareDevice.org_id == org_id)
    total = base.count()
    available = base.filter(HardwareDevice.status == DeviceStatus.AVAILABLE).count()
    in_use = base.filter(HardwareDevice.status == DeviceStatus.IN_USE).count()
    maintenance = base.filter(HardwareDevice.status == DeviceStatus.MAINTENANCE).count()

    category_stats = {}
    for category in DeviceCategory:
        c = base.filter(HardwareDevice.category == category).count()
        if c > 0:
            category_stats[category.value] = c

    return {
        "total_devices": total,
        "available_devices": available,
        "in_use_devices": in_use,
        "maintenance_devices": maintenance,
        "category_stats": category_stats,
    }
