"""
STEM功能简化测试路由
不依赖Organization查询，用于快速验证功能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from utils.database import get_db
from models.hardware_device import HardwareDevice, DeviceStatus, DeviceCategory
from models.token_billing import TokenBalance, TokenTransaction, TokenTransactionType
from models.stem_project import STEMProject, ProjectStatus, ProjectCategory, ProjectDifficulty
from models.maker_space import MakerSpace, SpaceStatus, SpaceType

router = APIRouter(prefix="/stem-test", tags=["STEM功能测试"])


@router.post("/create-sample-data")
def create_sample_data(db: Session = Depends(get_db)):
    """创建示例数据用于测试"""
    
    # 1. 创建示例硬件设备
    device = HardwareDevice(
        org_id=1,
        name="Arduino Uno开发板",
        model="Arduino Uno R3",
        serial_number=f"ARD{int(datetime.utcnow().timestamp())}",
        category=DeviceCategory.ARDUINO,
        description="用于STEM教学的Arduino开发板",
        purchase_date=datetime.utcnow(),
        purchase_price=150.0,
        supplier="Arduino官方",
        location="A栋3楼实验室1",
        status=DeviceStatus.AVAILABLE
    )
    db.add(device)
    
    # 2. 创建Token余额记录
    balance = TokenBalance(
        org_id=1,
        balance=10000,
        total_purchased=10000
    )
    db.add(balance)
    db.flush()  # 获取balance ID
    
    # 3. 创建Token交易记录
    transaction = TokenTransaction(
        balance_id=balance.id,
        org_id=1,
        transaction_type=TokenTransactionType.PURCHASE,
        amount=10000,
        description="初始充值",
        unit_price=0.01,
        total_cost=100.0
    )
    db.add(transaction)
    
    # 4. 创建示例项目
    project = STEMProject(
        org_id=1,
        name="智能温室控制系统",
        description="基于Arduino的物联网温室监控项目",
        category=ProjectCategory.IOT,
        difficulty=ProjectDifficulty.INTERMEDIATE,
        status=ProjectStatus.PLANNING,
        start_date=datetime.utcnow(),
        estimated_hours=40,
        max_students=8,
        progress_percentage=0
    )
    db.add(project)
    
    # 5. 创建示例创客空间
    space = MakerSpace(
        org_id=1,
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
        cancellation_hours=24
    )
    db.add(space)
    
    db.commit()
    
    return {
        "message": "示例数据创建成功",
        "device_id": device.id,
        "balance_id": balance.id,
        "transaction_id": transaction.id,
        "project_id": project.id,
        "space_id": space.id
    }


@router.get("/quick-stats")
def get_quick_stats(db: Session = Depends(get_db)):
    """获取快速统计信息"""
    
    # 设备统计
    total_devices = db.query(HardwareDevice).count()
    available_devices = db.query(HardwareDevice).filter(
        HardwareDevice.status == DeviceStatus.AVAILABLE
    ).count()
    
    # Token统计
    balances = db.query(TokenBalance).all()
    total_balance = sum(b.balance for b in balances) if balances else 0
    
    # 项目统计
    total_projects = db.query(STEMProject).count()
    active_projects = db.query(STEMProject).filter(
        STEMProject.status == ProjectStatus.IN_PROGRESS
    ).count()
    
    # 空间统计
    total_spaces = db.query(MakerSpace).count()
    available_spaces = db.query(MakerSpace).filter(
        MakerSpace.status == SpaceStatus.AVAILABLE
    ).count()
    
    return {
        "hardware": {
            "total_devices": total_devices,
            "available_devices": available_devices
        },
        "tokens": {
            "total_balance": total_balance
        },
        "projects": {
            "total_projects": total_projects,
            "active_projects": active_projects
        },
        "spaces": {
            "total_spaces": total_spaces,
            "available_spaces": available_spaces
        }
    }


@router.get("/list-devices")
def list_devices(db: Session = Depends(get_db)):
    """列出所有设备"""
    devices = db.query(HardwareDevice).all()
    return [{
        "id": d.id,
        "name": d.name,
        "category": d.category.value,
        "status": d.status.value,
        "location": d.location
    } for d in devices]


@router.get("/list-projects")
def list_projects(db: Session = Depends(get_db)):
    """列出所有项目"""
    projects = db.query(STEMProject).all()
    return [{
        "id": p.id,
        "name": p.name,
        "category": p.category.value,
        "difficulty": p.difficulty.value,
        "status": p.status.value,
        "progress": p.progress_percentage
    } for p in projects]


@router.get("/list-spaces")
def list_spaces(db: Session = Depends(get_db)):
    """列出所有空间"""
    spaces = db.query(MakerSpace).all()
    return [{
        "id": s.id,
        "name": s.name,
        "type": s.space_type.value,
        "capacity": s.capacity,
        "status": s.status.value,
        "location": s.location
    } for s in spaces]