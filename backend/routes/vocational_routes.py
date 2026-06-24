"""
职业学校 - 实训设备管理 API 路由（多租户版）

涵盖：实训设备 CRUD、借用/归还、维护记录、故障报修、仪表盘统计
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models.vocational_equipment import (
    VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance,
    VocFaultReport, VocInventoryRecord,
    VocEquipmentCategory, VocEquipmentStatus, VocSafetyLevel,
    VocBorrowStatus, VocMaintenanceType,
    # Pydantic schemas
    VocEquipmentCreate, VocEquipmentUpdate, VocEquipmentResponse,
    VocBorrowCreate, VocBorrowResponse,
    VocFaultReportCreate, VocFaultReportResponse,
    VocMaintenanceCreate,
    VocDashboardStats,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/vocational", tags=["职业学校-实训设备管理"])


# ======================================================================
#  实训设备 CRUD
# ======================================================================


@router.get("/equipment", response_model=List[VocEquipmentResponse])
def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = None,
    status: Optional[str] = None,
    safety_level: Optional[str] = None,
    location_room: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取实训设备列表（支持多维筛选）"""
    _, org_id = ctx
    query = db.query(VocEquipment).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
    )
    if category:
        query = query.filter(VocEquipment.category == category)
    if status:
        query = query.filter(VocEquipment.status == status)
    if safety_level:
        query = query.filter(VocEquipment.safety_level == safety_level)
    if location_room:
        query = query.filter(VocEquipment.location_room.ilike(f"%{location_room}%"))
    if search:
        like = f"%{search}%"
        query = query.filter(
            (VocEquipment.name.ilike(like))
            | (VocEquipment.model.ilike(like))
            | (VocEquipment.serial_number.ilike(like))
            | (VocEquipment.supplier.ilike(like))
        )
    return query.order_by(VocEquipment.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/equipment", response_model=VocEquipmentResponse, status_code=201)
def create_equipment(
    payload: VocEquipmentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加实训设备"""
    _, org_id = ctx
    equipment = VocEquipment(
        org_id=org_id,
        name=payload.name,
        model=payload.model,
        serial_number=payload.serial_number,
        category=payload.category,
        brand=payload.brand,
        description=payload.description,
        location_building=payload.location_building,
        location_floor=payload.location_floor,
        location_room=payload.location_room,
        location_station=payload.location_station,
        purchase_date=payload.purchase_date,
        purchase_price=payload.purchase_price,
        supplier=payload.supplier,
        warranty_expire=payload.warranty_expire,
        safety_level=payload.safety_level,
        specifications=payload.specifications,
        accessories=payload.accessories,
    )
    # 生成二维码标识
    equipment.qr_code_url = f"/api/v1/vocational/equipment/{equipment.id}/qr"
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/equipment/{equipment_id}", response_model=VocEquipmentResponse)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取实训设备详情"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    return equipment


@router.put("/equipment/{equipment_id}", response_model=VocEquipmentResponse)
def update_equipment(
    equipment_id: int,
    payload: VocEquipmentUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新实训设备信息"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)

    db.commit()
    db.refresh(equipment)
    return equipment


@router.delete("/equipment/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除实训设备（软删除）"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    equipment.is_active = False
    equipment.status = VocEquipmentStatus.RETIRED
    db.commit()
    return {"message": "设备已删除"}


@router.put("/equipment/{equipment_id}/location")
def update_equipment_location(
    equipment_id: int,
    building: Optional[str] = Query(None),
    floor: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    station: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新设备存放位置"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    if building is not None:
        equipment.location_building = building
    if floor is not None:
        equipment.location_floor = floor
    if room is not None:
        equipment.location_room = room
    if station is not None:
        equipment.location_station = station
    db.commit()
    return {"message": "位置已更新", "equipment_id": equipment_id}


# ======================================================================
#  设备借用与归还
# ======================================================================


@router.post("/equipment/{equipment_id}/borrow", response_model=VocBorrowResponse)
def borrow_equipment(
    equipment_id: int,
    payload: VocBorrowCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """借用设备"""
    user, org_id = ctx

    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    if equipment.status != VocEquipmentStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"设备当前状态不可借用: {equipment.status.value}")

    # 创建借用记录
    borrow = VocEquipmentBorrow(
        equipment_id=equipment_id,
        org_id=org_id,
        borrower_id=payload.borrower_id,
        borrower_name=payload.borrower_name,
        borrower_type=payload.borrower_type,
        expected_return_date=payload.expected_return_date,
        purpose=payload.purpose,
        purpose_type=payload.purpose_type,
        related_id=payload.related_id,
        status=VocBorrowStatus.PENDING if payload.needs_approval else VocBorrowStatus.ACTIVE,
        approver_id=user.id if not payload.needs_approval else None,
        approver_name=user.get("username", "system") if not payload.needs_approval else None,
        approved_at=datetime.utcnow() if not payload.needs_approval else None,
    )
    db.add(borrow)

    # 更新设备状态
    equipment.status = VocEquipmentStatus.PENDING if payload.needs_approval else VocEquipmentStatus.IN_USE
    equipment.total_borrow_count += 1

    db.commit()
    db.refresh(borrow)
    return borrow


@router.post("/equipment/{equipment_id}/return")
def return_equipment(
    equipment_id: int,
    borrower_id: int = Query(..., description="借用人ID"),
    condition: Optional[str] = Query(None, description="归还时设备状况"),
    is_damaged: bool = Query(False, description="是否损坏"),
    damage_desc: Optional[str] = Query(None, description="损坏描述"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """归还设备"""
    _, org_id = ctx

    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")

    # 查找活跃借用记录
    borrow = db.query(VocEquipmentBorrow).filter(
        VocEquipmentBorrow.equipment_id == equipment_id,
        VocEquipmentBorrow.borrower_id == borrower_id,
        VocEquipmentBorrow.status.in_([VocBorrowStatus.ACTIVE, VocBorrowStatus.OVERDUE]),
    ).order_by(VocEquipmentBorrow.borrow_date.desc()).first()

    if not borrow:
        raise HTTPException(status_code=400, detail="未找到该设备的活跃借用记录")

    # 更新借用记录
    borrow.actual_return_date = datetime.utcnow()
    borrow.return_condition = condition
    borrow.is_damaged = is_damaged
    borrow.damage_description = damage_desc
    if is_damaged:
        borrow.status = VocBorrowStatus.RETURNED
    else:
        borrow.status = VocBorrowStatus.RETURNED

    # 更新设备状态
    if is_damaged:
        equipment.status = VocEquipmentStatus.MAINTENANCE
    else:
        equipment.status = VocEquipmentStatus.AVAILABLE

    db.commit()
    return {
        "message": "设备已归还",
        "equipment_id": equipment_id,
        "is_damaged": is_damaged,
        "return_date": borrow.actual_return_date.isoformat(),
    }


@router.put("/borrows/{borrow_id}/approve", response_model=VocBorrowResponse)
def approve_borrow(
    borrow_id: int,
    approved: bool = Query(..., description="是否批准"),
    reject_reason: Optional[str] = Query(None, description="拒绝原因"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审批设备借用申请"""
    user, org_id = ctx

    borrow = db.query(VocEquipmentBorrow).filter(
        VocEquipmentBorrow.id == borrow_id,
        VocEquipmentBorrow.org_id == org_id,
    ).first()
    if not borrow:
        raise HTTPException(status_code=404, detail="借用记录不存在")

    if borrow.status != VocBorrowStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"该借用记录状态不允许审批: {borrow.status.value}")

    borrowing_equipment = borrow.equipment

    if approved:
        borrow.status = VocBorrowStatus.ACTIVE
        borrow.approver_id = user.id
        borrow.approver_name = user.get("username", "admin")
        borrow.approved_at = datetime.utcnow()
        if borrowing_equipment:
            borrowing_equipment.status = VocEquipmentStatus.IN_USE
    else:
        borrow.status = VocBorrowStatus.REJECTED
        borrow.reject_reason = reject_reason
        if borrowing_equipment:
            borrowing_equipment.status = VocEquipmentStatus.AVAILABLE

    db.commit()
    db.refresh(borrow)
    return borrow


@router.get("/borrows", response_model=List[VocBorrowResponse])
def list_borrows(
    equipment_id: Optional[int] = None,
    borrower_id: Optional[int] = None,
    status: Optional[str] = None,
    overdue_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取设备借用记录列表"""
    _, org_id = ctx
    query = db.query(VocEquipmentBorrow).filter(
        VocEquipmentBorrow.org_id == org_id,
    )
    if equipment_id:
        query = query.filter(VocEquipmentBorrow.equipment_id == equipment_id)
    if borrower_id:
        query = query.filter(VocEquipmentBorrow.borrower_id == borrower_id)
    if status:
        query = query.filter(VocEquipmentBorrow.status == status)
    if overdue_only:
        query = query.filter(
            VocEquipmentBorrow.status == VocBorrowStatus.ACTIVE,
            VocEquipmentBorrow.expected_return_date < date.today(),
        )
    return query.order_by(VocEquipmentBorrow.borrow_date.desc()).offset(skip).limit(limit).all()


# ======================================================================
#  设备维护管理
# ======================================================================


@router.post("/equipment/{equipment_id}/maintenance")
def add_maintenance_record(
    equipment_id: int,
    payload: VocMaintenanceCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加设备维护记录"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")

    record = VocEquipmentMaintenance(
        equipment_id=equipment_id,
        org_id=org_id,
        maintenance_type=payload.maintenance_type,
        description=payload.description,
        maintainer=payload.maintainer,
        maintainer_contact=payload.maintainer_contact,
        maintenance_date=payload.maintenance_date or date.today(),
        cost=payload.cost,
        notes=payload.notes,
        attachment_url=payload.attachment_url,
    )
    db.add(record)

    # 更新设备维护日期
    equipment.last_maintenance_date = payload.maintenance_date or date.today()
    if equipment.status == VocEquipmentStatus.MAINTENANCE:
        equipment.status = VocEquipmentStatus.AVAILABLE

    db.commit()
    db.refresh(record)
    return {
        "message": "维护记录已添加",
        "maintenance_id": record.id,
        "equipment_id": equipment_id,
    }


@router.get("/equipment/{equipment_id}/maintenance")
def list_maintenance(
    equipment_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取设备维护记录"""
    _, org_id = ctx
    records = db.query(VocEquipmentMaintenance).filter(
        VocEquipmentMaintenance.equipment_id == equipment_id,
        VocEquipmentMaintenance.org_id == org_id,
    ).order_by(VocEquipmentMaintenance.maintenance_date.desc()).offset(skip).limit(limit).all()
    return records


# ======================================================================
#  故障报修
# ======================================================================


@router.post("/equipment/{equipment_id}/report-fault", response_model=VocFaultReportResponse)
def report_fault(
    equipment_id: int,
    payload: VocFaultReportCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """提交设备故障报修"""
    _, org_id = ctx
    equipment = db.query(VocEquipment).filter(
        VocEquipment.id == equipment_id,
        VocEquipment.org_id == org_id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")

    report = VocFaultReport(
        equipment_id=equipment_id,
        org_id=org_id,
        reporter_id=payload.reporter_id,
        reporter_name=payload.reporter_name,
        fault_type=payload.fault_type,
        description=payload.description,
        photo_urls=payload.photo_urls or [],
        status="pending",
    )
    db.add(report)

    # 设备状态标记为维修中
    equipment.status = VocEquipmentStatus.MAINTENANCE

    db.commit()
    db.refresh(report)
    return report


@router.get("/fault-reports", response_model=List[VocFaultReportResponse])
def list_fault_reports(
    equipment_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取故障报修列表"""
    _, org_id = ctx
    query = db.query(VocFaultReport).filter(VocFaultReport.org_id == org_id)
    if equipment_id:
        query = query.filter(VocFaultReport.equipment_id == equipment_id)
    if status:
        query = query.filter(VocFaultReport.status == status)
    return query.order_by(VocFaultReport.created_at.desc()).offset(skip).limit(limit).all()


@router.put("/fault-reports/{report_id}/resolve")
def resolve_fault(
    report_id: int,
    resolution: str = Query(..., description="处理结果"),
    assigned_to: Optional[str] = Query(None, description="处理人"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """处理故障报修"""
    _, org_id = ctx
    report = db.query(VocFaultReport).filter(
        VocFaultReport.id == report_id,
        VocFaultReport.org_id == org_id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="故障报修记录不存在")

    report.status = "resolved"
    report.resolution = resolution
    if assigned_to:
        report.assigned_to = assigned_to
    report.resolved_at = datetime.utcnow()
    db.commit()

    # 设备状态恢复
    equipment = db.query(VocEquipment).filter(VocEquipment.id == report.equipment_id).first()
    if equipment and equipment.status == VocEquipmentStatus.MAINTENANCE:
        equipment.status = VocEquipmentStatus.AVAILABLE

    db.commit()
    return {"message": "故障已处理", "report_id": report_id}


# ======================================================================
#  闲置预警
# ======================================================================


@router.get("/equipment/idle-alert")
def get_idle_equipment(
    threshold_days: int = Query(30, ge=1, description="闲置判定天数"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取闲置设备预警列表（超过 threshold_days 天未使用）"""
    _, org_id = ctx
    cutoff = date.today() - timedelta(days=threshold_days)

    idle_equipment = db.query(VocEquipment).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
        VocEquipment.status == VocEquipmentStatus.AVAILABLE,
        ~VocEquipment.id.in_(
            db.query(VocEquipmentBorrow.equipment_id).filter(
                VocEquipmentBorrow.borrow_date >= cutoff,
            )
        ),
    ).all()

    return {
        "threshold_days": threshold_days,
        "idle_count": len(idle_equipment),
        "idle_equipment": [
            {
                "id": eq.id,
                "name": eq.name,
                "model": eq.model,
                "location_room": eq.location_room,
                "location_station": eq.location_station,
                "last_borrow_date": None,  # 可进一步查询
            }
            for eq in idle_equipment
        ],
    }


# ======================================================================
#  设备统计
# ======================================================================


@router.get("/equipment/stats")
def get_equipment_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取实训设备统计报表"""
    _, org_id = ctx

    total = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id, VocEquipment.is_active.is_(True)
    ).scalar() or 0

    by_status = db.query(
        VocEquipment.status, func.count(VocEquipment.id)
    ).filter(
        VocEquipment.org_id == org_id, VocEquipment.is_active.is_(True)
    ).group_by(VocEquipment.status).all()

    by_category = db.query(
        VocEquipment.category, func.count(VocEquipment.id)
    ).filter(
        VocEquipment.org_id == org_id, VocEquipment.is_active.is_(True)
    ).group_by(VocEquipment.category).all()

    by_safety = db.query(
        VocEquipment.safety_level, func.count(VocEquipment.id)
    ).filter(
        VocEquipment.org_id == org_id, VocEquipment.is_active.is_(True)
    ).group_by(VocEquipment.safety_level).all()

    in_use = sum(cnt for st, cnt in by_status if st == VocEquipmentStatus.IN_USE)
    in_maintenance = sum(cnt for st, cnt in by_status if st == VocEquipmentStatus.MAINTENANCE)
    available = sum(cnt for st, cnt in by_status if st == VocEquipmentStatus.AVAILABLE)
    usage_rate = f"{round(in_use / total * 100, 1)}%" if total > 0 else "0%"

    return {
        "total": total,
        "in_use": in_use,
        "available": available,
        "maintenance": in_maintenance,
        "usage_rate": usage_rate,
        "by_status": {st.value: cnt for st, cnt in by_status},
        "by_category": {cat.value: cnt for cat, cnt in by_category},
        "by_safety_level": {sl.value: cnt for sl, cnt in by_safety},
    }


@router.get("/dashboard", response_model=VocDashboardStats)
def get_vocational_dashboard(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取职业学校仪表盘核心统计数据"""
    _, org_id = ctx

    total = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id, VocEquipment.is_active.is_(True)
    ).scalar() or 0

    in_use = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
        VocEquipment.status == VocEquipmentStatus.IN_USE,
    ).scalar() or 0

    available = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
        VocEquipment.status == VocEquipmentStatus.AVAILABLE,
    ).scalar() or 0

    maintenance = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
        VocEquipment.status == VocEquipmentStatus.MAINTENANCE,
    ).scalar() or 0

    usage_rate = f"{round(in_use / total * 100, 1)}%" if total > 0 else "0%"

    # 闲置设备数（30 天未借用的设备）
    cutoff = date.today() - timedelta(days=30)
    idle_count = db.query(func.count(VocEquipment.id)).filter(
        VocEquipment.org_id == org_id,
        VocEquipment.is_active.is_(True),
        VocEquipment.status == VocEquipmentStatus.AVAILABLE,
        ~VocEquipment.id.in_(
            db.query(VocEquipmentBorrow.equipment_id).filter(
                VocEquipmentBorrow.borrow_date >= cutoff,
            )
        ),
    ).scalar() or 0

    # 活跃借用 + 逾期
    active_borrows = db.query(func.count(VocEquipmentBorrow.id)).filter(
        VocEquipmentBorrow.org_id == org_id,
        VocEquipmentBorrow.status == VocBorrowStatus.ACTIVE,
    ).scalar() or 0

    overdue_borrows = db.query(func.count(VocEquipmentBorrow.id)).filter(
        VocEquipmentBorrow.org_id == org_id,
        VocEquipmentBorrow.status == VocBorrowStatus.ACTIVE,
        VocEquipmentBorrow.expected_return_date < date.today(),
    ).scalar() or 0

    # 待处理故障
    pending_faults = db.query(func.count(VocFaultReport.id)).filter(
        VocFaultReport.org_id == org_id,
        VocFaultReport.status == "pending",
    ).scalar() or 0

    return VocDashboardStats(
        total_equipment=total,
        equipment_in_use=in_use,
        equipment_available=available,
        equipment_maintenance=maintenance,
        equipment_usage_rate=usage_rate,
        equipment_idle_count=idle_count,
        active_borrows=active_borrows,
        overdue_borrows=overdue_borrows,
        total_faults_pending=pending_faults,
        safety_days=0,  # 安全天数由安全模块提供
    )