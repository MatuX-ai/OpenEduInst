"""
STEM功能测试路由（多租户版）
所有接口 org_id 一律从 Token 提取，数据只在当前组织范围内可见。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.hardware_device import HardwareDevice, DeviceStatus, DeviceCategory
from models.token_billing import TokenBalance, TokenTransaction, TokenTransactionType
from models.stem_project import STEMProject, ProjectStatus, ProjectCategory, ProjectDifficulty
from models.maker_space import MakerSpace, SpaceStatus, SpaceType

router = APIRouter(prefix="/api/v1/stem-test", tags=["STEM功能测试"])


@router.post("/create-sample-data")
def create_sample_data(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """为当前组织创建示例数据用于测试"""
    user, org_id = ctx

    # 1. 创建示例硬件设备
    device = HardwareDevice(
        org_id=org_id,
        name="Arduino Uno开发板",
        model="Arduino Uno R3",
        serial_number=f"ARD{int(datetime.utcnow().timestamp())}",
        category=DeviceCategory.ARDUINO,
        description="用于STEM教学的Arduino开发板",
        purchase_date=datetime.utcnow(),
        purchase_price=150.0,
        supplier="Arduino官方",
        location="A栋3楼实验室1",
        status=DeviceStatus.AVAILABLE,
    )
    db.add(device)

    # 2. 创建Token余额记录
    balance = TokenBalance(org_id=org_id, balance=10000, total_purchased=10000)
    db.add(balance)
    db.flush()

    # 3. 创建Token交易记录
    transaction = TokenTransaction(
        balance_id=balance.id,
        org_id=org_id,
        transaction_type=TokenTransactionType.PURCHASE,
        amount=10000,
        description="初始充值",
        unit_price=0.01,
        total_cost=100.0,
    )
    db.add(transaction)

    # 4. 创建示例项目
    project = STEMProject(
        org_id=org_id,
        name="智能温室控制系统",
        description="基于Arduino的物联网温室监控项目",
        category=ProjectCategory.IOT,
        difficulty=ProjectDifficulty.INTERMEDIATE,
        status=ProjectStatus.PLANNING,
        start_date=datetime.utcnow(),
        estimated_hours=40,
        max_students=8,
        current_students=0,
        progress_percentage=0,
        created_by=user.id,
    )
    db.add(project)

    # 5. 创建示例创客空间
    space = MakerSpace(
        org_id=org_id,
        name="Arduino实验室",
        description="专门用于Arduino开发的实验室",
        space_type=SpaceType.LAB_ARDUINO,
        capacity=20,
        location="A栋3楼",
        room_number="301",
        status=SpaceStatus.AVAILABLE,
        open_time="08:00",
        close_time="22:00",
        max_booking_hours=4,
        advance_booking_days=7,
        cancellation_hours=24,
        current_occupancy=0,
        created_by=user.id,
    )
    db.add(space)

    db.commit()

    return {
        "message": "示例数据创建成功",
        "org_id": org_id,
        "device_id": device.id,
        "balance_id": balance.id,
        "transaction_id": transaction.id,
        "project_id": project.id,
        "space_id": space.id,
    }


@router.get("/quick-stats")
def get_quick_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的快速统计信息"""
    _, org_id = ctx

    device_base = db.query(HardwareDevice).filter(HardwareDevice.org_id == org_id)
    total_devices = device_base.count()
    available_devices = device_base.filter(HardwareDevice.status == DeviceStatus.AVAILABLE).count()

    balance = db.query(TokenBalance).filter(TokenBalance.org_id == org_id).first()
    total_balance = balance.balance if balance else 0

    project_base = db.query(STEMProject).filter(STEMProject.org_id == org_id)
    total_projects = project_base.count()
    active_projects = project_base.filter(STEMProject.status == ProjectStatus.IN_PROGRESS).count()

    space_base = db.query(MakerSpace).filter(MakerSpace.org_id == org_id)
    total_spaces = space_base.count()
    available_spaces = space_base.filter(MakerSpace.status == SpaceStatus.AVAILABLE).count()

    return {
        "hardware": {"total_devices": total_devices, "available_devices": available_devices},
        "tokens": {"total_balance": total_balance},
        "projects": {"total_projects": total_projects, "active_projects": active_projects},
        "spaces": {"total_spaces": total_spaces, "available_spaces": available_spaces},
    }


@router.get("/list-devices")
def list_devices(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """列出当前组织的所有设备"""
    _, org_id = ctx
    devices = db.query(HardwareDevice).filter(HardwareDevice.org_id == org_id).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "category": d.category.value,
            "status": d.status.value,
            "location": d.location,
        }
        for d in devices
    ]


@router.get("/list-projects")
def list_projects(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """列出当前组织的所有项目"""
    _, org_id = ctx
    projects = db.query(STEMProject).filter(STEMProject.org_id == org_id).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category.value,
            "difficulty": p.difficulty.value,
            "status": p.status.value,
            "progress": p.progress_percentage,
        }
        for p in projects
    ]


@router.get("/list-spaces")
def list_spaces(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """列出当前组织的所有空间"""
    _, org_id = ctx
    spaces = db.query(MakerSpace).filter(MakerSpace.org_id == org_id).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "type": s.space_type.value,
            "capacity": s.capacity,
            "status": s.status.value,
            "location": s.location,
        }
        for s in spaces
    ]