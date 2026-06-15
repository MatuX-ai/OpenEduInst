"""业务通用路由（多租户版）- 线索转换、结算单等"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from utils.database import get_db
from utils.auth_utils import require_org_context
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
def convert_lead_to_enrollment(
    request: LeadConvertRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """将招生线索转化为正式报名（多租户：仅允许操作本组织的线索）"""
    _, org_id = ctx
    lead = db.query(Lead).filter(
        Lead.id == request.lead_id,
        Lead.org_id == org_id,
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # 更新线索状态
    lead.status = LeadStatus.ENROLLED

    db.commit()
    return {"message": "Lead converted successfully", "lead_id": lead.id}


@router.get("/settlements/pending/")
def get_pending_settlements(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取待确认的课时结算单（org_id 来自 Token）"""
    _, org_id = ctx
    from models.schedule import Settlement

    return db.query(Settlement).filter(
        Settlement.org_id == org_id,
        Settlement.is_confirmed == False,
    ).all()


@router.get("/organizations/my")
def get_my_organizations(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前用户所属的组织（org_id 来自 Token，返回当前组织）"""
    _, org_id = ctx
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": org.id,
        "name": org.name,
        "org_type": org.org_type.value if hasattr(org.org_type, "value") else str(org.org_type),
        "contact_email": org.contact_email or "",
        "is_active": getattr(org, "is_active", True),
    }
