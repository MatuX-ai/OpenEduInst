"""
职业学校业务路由（多租户版）
包含实训设备管理、实习跟踪及技能认证接口；org_id 一律从 Token 提取。
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from utils.database import get_db
from utils.auth_utils import require_org_context
from pydantic import BaseModel, Field

router = APIRouter(prefix="/vocational", tags=["vocational"])


# --- Pydantic Models ---


class EquipmentCreate(BaseModel):
    name: str
    model: str
    status: str = "available"  # available, in_use, maintenance
    purchase_date: Optional[date] = None


class EquipmentResponse(BaseModel):
    id: int
    org_id: int
    name: str
    model: str
    status: str
    purchase_date: Optional[date]

    class Config:
        orm_mode = True


class InternshipRecordCreate(BaseModel):
    student_id: int
    company_name: str
    start_date: date
    end_date: Optional[date] = None
    position: str
    status: str = "ongoing"  # ongoing, completed, terminated


# --- Routes ---


@router.get("/equipment", response_model=List[EquipmentResponse])
def list_equipment(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的实训设备列表（org_id 来自 Token）"""
    _, org_id = ctx
    # 实际实现需要查询数据库：filter 组织ID
    return []


@router.post("/equipment")
def add_equipment(
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加新的实训设备（org_id 来自 Token，拒绝路径传参）"""
    _, org_id = ctx
    pass


@router.get("/internships")
def list_internships(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的学生实习记录"""
    _, org_id = ctx
    return []


@router.post("/internships")
def create_internship(
    record: InternshipRecordCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建实习记录（org_id 来自 Token）"""
    _, org_id = ctx
    pass
