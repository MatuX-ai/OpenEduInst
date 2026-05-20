"""
职业学校业务路由
包含实训设备管理、实习跟踪及技能认证接口
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from utils.database import get_db
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/vocational",
    tags=["vocational"]
)

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

@router.get("/equipment/{org_id}", response_model=List[EquipmentResponse])
def list_equipment(org_id: int, db: Session = Depends(get_db)):
    """获取指定组织的实训设备列表"""
    # 实际实现需要查询数据库
    return []

@router.post("/equipment/{org_id}")
def add_equipment(org_id: int, equipment: EquipmentCreate, db: Session = Depends(get_db)):
    """添加新的实训设备"""
    pass

@router.get("/internships/{org_id}")
def list_internships(org_id: int, db: Session = Depends(get_db)):
    """获取学生实习记录"""
    return []

@router.post("/internships")
def create_internship(record: InternshipRecordCreate, db: Session = Depends(get_db)):
    """创建实习记录"""
    pass
