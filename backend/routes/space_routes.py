"""
创客空间调度API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止硬编码 user_id=1 / org_id=1。
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.base_models import User
from models.maker_space import (
    MakerSpace,
    MakerSpaceCreate,
    MakerSpaceUpdate,
    MakerSpaceResponse,
    SpaceBooking,
    SpaceBookingCreate,
    SpaceBookingResponse,
    EquipmentSlot,
    EquipmentSlotCreate,
    EquipmentSlotResponse,
    SpaceStatus,
    BookingStatus,
    SpaceType,
)
from models.license import Organization
from models.hardware_device import HardwareDevice, DeviceStatus

router = APIRouter(prefix="/api/v1/spaces", tags=["创客空间调度"])


# ==================== 创客空间管理接口 ====================


@router.post("/", response_model=MakerSpaceResponse)
def create_space(
    space: MakerSpaceCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新的创客空间（org_id 来自 Token）"""
    user, org_id = ctx

    db_space = MakerSpace(
        name=space.name,
        description=getattr(space, "description", None),
        space_type=space.space_type,
        capacity=getattr(space, "capacity", 20),
        location=getattr(space, "location", None),
        room_number=getattr(space, "room_number", None),
        status=SpaceStatus.AVAILABLE,
        open_time=getattr(space, "open_time", "08:00"),
        close_time=getattr(space, "close_time", "22:00"),
        max_booking_hours=getattr(space, "max_booking_hours", 4),
        advance_booking_days=getattr(space, "advance_booking_days", 7),
        cancellation_hours=getattr(space, "cancellation_hours", 24),
        current_occupancy=0,
        created_by=user.id,
        org_id=org_id,
        equipment_list=str(space.equipment_list) if space.equipment_list else None,
        is_active=True,
    )

    db.add(db_space)
    db.commit()
    db.refresh(db_space)

    return db_space


@router.get("/", response_model=List[MakerSpaceResponse])
def list_spaces(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    space_type: Optional[SpaceType] = None,
    status: Optional[SpaceStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的创客空间列表"""
    _, org_id = ctx
    query = db.query(MakerSpace).filter(MakerSpace.org_id == org_id)

    if space_type:
        query = query.filter(MakerSpace.space_type == space_type)
    if status:
        query = query.filter(MakerSpace.status == status)
    if search:
        query = query.filter(
            (MakerSpace.name.ilike(f"%{search}%"))
            | (MakerSpace.description.ilike(f"%{search}%"))
            | (MakerSpace.location.ilike(f"%{search}%"))
        )

    spaces = query.offset(skip).limit(limit).all()
    return spaces


@router.get("/{space_id}", response_model=MakerSpaceResponse)
def get_space(
    space_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取单个创客空间详情（校验所属组织）"""
    _, org_id = ctx
    space = (
        db.query(MakerSpace)
        .filter(MakerSpace.id == space_id, MakerSpace.org_id == org_id)
        .first()
    )
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


@router.put("/{space_id}", response_model=MakerSpaceResponse)
def update_space(
    space_id: int,
    space_update: MakerSpaceUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新创客空间信息（校验所属组织）"""
    _, org_id = ctx
    space = (
        db.query(MakerSpace)
        .filter(MakerSpace.id == space_id, MakerSpace.org_id == org_id)
        .first()
    )
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    for field, value in space_update.dict(exclude_unset=True).items():
        setattr(space, field, value)

    space.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(space)

    return space


@router.delete("/{space_id}")
def delete_space(
    space_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除创客空间（软删除，校验所属组织）"""
    _, org_id = ctx
    space = (
        db.query(MakerSpace)
        .filter(MakerSpace.id == space_id, MakerSpace.org_id == org_id)
        .first()
    )
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    space.is_active = False
    space.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Space deleted successfully"}


# ==================== 空间预约管理接口 ====================


@router.post("/bookings/", response_model=SpaceBookingResponse)
def create_booking(
    booking: SpaceBookingCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建空间预约（org_id 来自 Token；校验空间归属）"""
    user, org_id = ctx

    space = (
        db.query(MakerSpace)
        .filter(MakerSpace.id == booking.space_id, MakerSpace.org_id == org_id)
        .first()
    )
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    if space.status != SpaceStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Space is not available")

    # 检查时间冲突
    conflicting_booking = (
        db.query(SpaceBooking)
        .filter(
            SpaceBooking.space_id == booking.space_id,
            SpaceBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            SpaceBooking.start_time < booking.end_time,
            SpaceBooking.end_time > booking.start_time,
        )
        .first()
    )

    if conflicting_booking:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    # 检查预约时长限制
    booking_hours = (booking.end_time - booking.start_time).total_seconds() / 3600
    if booking_hours > space.max_booking_hours:
        raise HTTPException(
            status_code=400, detail=f"Booking exceeds maximum {space.max_booking_hours} hours"
        )

    # 检查提前预约天数限制
    max_advance_date = datetime.utcnow() + timedelta(days=space.advance_booking_days)
    if booking.start_time > max_advance_date:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot book more than {space.advance_booking_days} days in advance",
        )

    # 创建预约记录
    db_booking = SpaceBooking(
        space_id=booking.space_id,
        user_id=user.id,
        title=getattr(booking, "title", f"Booking by {user.username}"),
        start_time=booking.start_time,
        end_time=booking.end_time,
        participant_count=getattr(booking, "participant_count", 1),
        status=BookingStatus.PENDING,
        purpose=getattr(booking, "purpose", None),
        required_equipment=str(booking.required_equipment) if booking.required_equipment else None,
        org_id=org_id,
    )

    db.add(db_booking)

    # 联动逻辑：如果预约时指定了所需设备，则自动锁定这些设备的状态
    if booking.required_equipment:
        try:
            import json

            equipment_ids = json.loads(booking.required_equipment)
            for device_id in equipment_ids:
                device = (
                    db.query(HardwareDevice)
                    .filter(
                        HardwareDevice.id == device_id,
                        HardwareDevice.org_id == org_id,
                    )
                    .first()
                )
                if device and device.status == DeviceStatus.AVAILABLE:
                    device.status = DeviceStatus.IN_USE
                    device.assigned_to = user.id
        except Exception as e:
            print(f"Failed to lock equipment: {e}")

    # 更新空间的当前占用数
    space.current_occupancy += getattr(booking, "participant_count", 1)

    db.commit()
    db.refresh(db_booking)

    return db_booking


@router.get("/bookings/", response_model=List[SpaceBookingResponse])
def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    space_id: Optional[int] = None,
    status: Optional[BookingStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的预约记录列表"""
    _, org_id = ctx
    query = db.query(SpaceBooking).filter(SpaceBooking.org_id == org_id)

    if space_id:
        query = query.filter(SpaceBooking.space_id == space_id)
    if status:
        query = query.filter(SpaceBooking.status == status)
    if start_date:
        query = query.filter(SpaceBooking.start_time >= start_date)
    if end_date:
        query = query.filter(SpaceBooking.end_time <= end_date)

    bookings = query.order_by(SpaceBooking.start_time).offset(skip).limit(limit).all()
    return bookings


@router.put("/bookings/{booking_id}/approve", response_model=SpaceBookingResponse)
def approve_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审批通过预约（校验所属组织）"""
    user, org_id = ctx
    booking = (
        db.query(SpaceBooking)
        .filter(SpaceBooking.id == booking_id, SpaceBooking.org_id == org_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not pending")

    booking.status = BookingStatus.CONFIRMED
    booking.approved_by = user.id
    booking.approved_at = datetime.utcnow()
    booking.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)

    return booking


@router.put("/bookings/{booking_id}/cancel", response_model=SpaceBookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """取消预约（校验所属组织）"""
    _, org_id = ctx
    booking = (
        db.query(SpaceBooking)
        .filter(SpaceBooking.id == booking_id, SpaceBooking.org_id == org_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

    space = db.query(MakerSpace).filter(MakerSpace.id == booking.space_id).first()
    if space:
        hours_until_start = (booking.start_time - datetime.utcnow()).total_seconds() / 3600
        if hours_until_start < space.cancellation_hours:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel within {space.cancellation_hours} hours of start time",
            )

    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()

    if space:
        space.current_occupancy = max(0, space.current_occupancy - booking.participant_count)

    # 联动逻辑：取消预约时，释放之前锁定的设备状态
    if booking.required_equipment:
        try:
            import json

            equipment_ids = json.loads(booking.required_equipment)
            for device_id in equipment_ids:
                device = (
                    db.query(HardwareDevice)
                    .filter(
                        HardwareDevice.id == device_id,
                        HardwareDevice.org_id == org_id,
                    )
                    .first()
                )
                if device and device.status == DeviceStatus.IN_USE:
                    device.status = DeviceStatus.AVAILABLE
                    device.assigned_to = None
        except Exception as e:
            print(f"Failed to release equipment: {e}")

    db.commit()
    db.refresh(booking)

    return booking


# ==================== 设备时段预约接口 ====================


@router.post("/equipment-slots/", response_model=EquipmentSlotResponse)
def create_equipment_slot(
    slot: EquipmentSlotCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建设备时段预约（校验设备归属当前组织）"""
    user, org_id = ctx

    device = (
        db.query(HardwareDevice)
        .filter(HardwareDevice.id == slot.device_id, HardwareDevice.org_id == org_id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.status != DeviceStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Device is not available")

    # 检查时间冲突
    conflicting_slot = (
        db.query(EquipmentSlot)
        .filter(
            EquipmentSlot.device_id == slot.device_id,
            EquipmentSlot.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            EquipmentSlot.start_time < slot.end_time,
            EquipmentSlot.end_time > slot.start_time,
        )
        .first()
    )

    if conflicting_slot:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    # 创建时段预约记录
    db_slot = EquipmentSlot(
        device_id=slot.device_id,
        user_id=user.id,
        start_time=slot.start_time,
        end_time=slot.end_time,
        status=BookingStatus.PENDING,
        purpose=getattr(slot, "purpose", None),
        org_id=org_id,
    )

    db.add(db_slot)
    device.status = DeviceStatus.IN_USE
    device.assigned_to = user.id

    db.commit()
    db.refresh(db_slot)

    return db_slot


@router.get("/equipment-slots/", response_model=List[EquipmentSlotResponse])
def list_equipment_slots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[int] = None,
    status: Optional[BookingStatus] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的设备时段预约列表"""
    _, org_id = ctx
    query = db.query(EquipmentSlot).filter(EquipmentSlot.org_id == org_id)

    if device_id:
        query = query.filter(EquipmentSlot.device_id == device_id)
    if status:
        query = query.filter(EquipmentSlot.status == status)

    slots = query.order_by(EquipmentSlot.start_time).offset(skip).limit(limit).all()
    return slots


# ==================== 统计接口 ====================


@router.get("/statistics/summary")
def get_space_statistics(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的创客空间统计信息"""
    _, org_id = ctx

    space_base = db.query(MakerSpace).filter(MakerSpace.org_id == org_id)
    total_spaces = space_base.count()
    available_spaces = space_base.filter(MakerSpace.status == SpaceStatus.AVAILABLE).count()
    occupied_spaces = space_base.filter(MakerSpace.status == SpaceStatus.OCCUPIED).count()

    booking_base = db.query(SpaceBooking).filter(SpaceBooking.org_id == org_id)
    total_bookings = booking_base.count()
    confirmed_bookings = booking_base.filter(SpaceBooking.status == BookingStatus.CONFIRMED).count()
    completed_bookings = booking_base.filter(SpaceBooking.status == BookingStatus.COMPLETED).count()

    # 按类型统计空间
    type_stats = {}
    for space_type in SpaceType:
        count = space_base.filter(MakerSpace.space_type == space_type).count()
        if count > 0:
            type_stats[space_type.value] = count

    return {
        "total_spaces": total_spaces,
        "available_spaces": available_spaces,
        "occupied_spaces": occupied_spaces,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "type_stats": type_stats,
    }