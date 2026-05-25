from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from utils.database import get_db
from models.schedule import Lead, LeadStatus
from models.user_organization import UserOrganization
from models.license import Organization
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class LeadConvertRequest(BaseModel):
    lead_id: int
    course_id: int
    teacher_id: int = None

@router.post("/leads/convert/")
def convert_lead_to_enrollment(request: LeadConvertRequest, db: Session = Depends(get_db)):
    """将招生线索转化为正式报名（简化逻辑）"""
    lead = db.query(Lead).filter(Lead.id == request.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # 更新线索状态
    lead.status = LeadStatus.ENROLLED
    
    # TODO: 这里应该创建正式的 UserOrganization 关联或 Enrollment 记录
    # 暂时仅返回成功消息
    
    db.commit()
    return {"message": "Lead converted successfully", "lead_id": lead.id}

@router.get("/settlements/pending/")
def get_pending_settlements(org_id: int, db: Session = Depends(get_db)):
    """获取待确认的课时结算单"""
    from models.schedule import Settlement
    return db.query(Settlement).filter(
        Settlement.org_id == org_id, 
        Settlement.is_confirmed == False
    ).all()

@router.get("/organizations/my")
def get_my_organizations(db: Session = Depends(get_db)):
    """获取当前用户所属的组织列表（简化版，返回所有组织）"""
    # 暂时返回所有活跃组织，后续可以根据 token 中的用户 ID 过滤
    organizations = db.query(Organization).filter(Organization.is_active == True).all()
    
    result = []
    for org in organizations:
        result.append({
            "id": org.id,
            "name": org.name,
            "org_type": org.org_type,
            "contact_email": org.contact_email,
            "is_active": org.is_active
        })
    
    return result
