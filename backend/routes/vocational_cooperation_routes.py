"""
职业学校 - 校企合作 + 技能竞赛 + 实习就业 + 双创孵化 API 路由
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.vocational_cooperation import (
    VocEnterprise, VocEnterpriseDemand, VocCooperationProject,
    VocProjectMilestone, VocCompetition, VocCompetitionRegistration,
    VocInternshipPosition, VocInternshipRecord, VocEmploymentRecord,
    VocIncubatorProject, VocIncubatorMember,
    VocEnterpriseCreate, VocEnterpriseResponse,
    VocCoopProjectCreate, VocIncubatorCreate,
    VocCompetitionCreate, VocInternshipCreate, VocEmploymentCreate,
    VocCooperationStats,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/vocational", tags=["职业学校-合作与竞赛"])


# ==================== 校企合作 ====================


@router.post("/enterprises", response_model=VocEnterpriseResponse)
def create_enterprise(
    payload: VocEnterpriseCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加合作企业"""
    _, org_id = ctx
    ent = VocEnterprise(org_id=org_id, **payload.model_dump())
    db.add(ent)
    db.commit()
    db.refresh(ent)
    return ent


@router.get("/enterprises", response_model=List[VocEnterpriseResponse])
def list_enterprises(
    industry: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """合作企业列表"""
    _, org_id = ctx
    query = db.query(VocEnterprise).filter(
        VocEnterprise.org_id == org_id, VocEnterprise.is_active.is_(True)
    )
    if industry:
        query = query.filter(VocEnterprise.industry == industry)
    if search:
        like = f"%{search}%"
        query = query.filter(VocEnterprise.name.ilike(like))
    return query.order_by(VocEnterprise.created_at.desc()).all()


@router.get("/enterprises/{ent_id}", response_model=VocEnterpriseResponse)
def get_enterprise(
    ent_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """企业详情"""
    _, org_id = ctx
    ent = db.query(VocEnterprise).filter(
        VocEnterprise.id == ent_id, VocEnterprise.org_id == org_id
    ).first()
    if not ent:
        raise HTTPException(status_code=404, detail="企业不存在")
    return ent


@router.post("/enterprises/{ent_id}/demands")
def create_demand(
    ent_id: int,
    demand_type: str = Query(...),
    title: str = Query(...),
    description: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """发布企业需求"""
    _, org_id = ctx
    ent = db.query(VocEnterprise).filter(VocEnterprise.id == ent_id, VocEnterprise.org_id == org_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="企业不存在")
    demand = VocEnterpriseDemand(
        org_id=org_id, enterprise_id=ent_id,
        demand_type=demand_type, title=title, description=description,
    )
    db.add(demand)
    db.commit()
    db.refresh(demand)
    return demand


# ==================== 联合项目 ====================


@router.post("/cooperation-projects")
def create_coop_project(
    payload: VocCoopProjectCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建校企联合项目"""
    _, org_id = ctx
    project = VocCooperationProject(org_id=org_id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/cooperation-projects")
def list_coop_projects(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """联合项目列表"""
    _, org_id = ctx
    query = db.query(VocCooperationProject).filter(VocCooperationProject.org_id == org_id)
    if status:
        query = query.filter(VocCooperationProject.status == status)
    return query.order_by(VocCooperationProject.created_at.desc()).all()


@router.put("/cooperation-projects/{project_id}/progress")
def update_project_progress(
    project_id: int,
    progress: int = Query(..., ge=0, le=100),
    stage: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新项目进度"""
    _, org_id = ctx
    project = db.query(VocCooperationProject).filter(
        VocCooperationProject.id == project_id, VocCooperationProject.org_id == org_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    project.progress = progress
    if stage:
        project.stage = stage
    if progress >= 100:
        project.status = "completed"
    db.commit()
    return {"message": "进度已更新", "progress": progress}


# ==================== 技能竞赛 ====================


@router.post("/competitions")
def create_competition(
    payload: VocCompetitionCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """录入竞赛信息"""
    _, org_id = ctx
    comp = VocCompetition(org_id=org_id, **payload.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


@router.get("/competitions")
def list_competitions(
    level: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """竞赛列表"""
    _, org_id = ctx
    query = db.query(VocCompetition).filter(VocCompetition.org_id == org_id)
    if level:
        query = query.filter(VocCompetition.level == level)
    if status:
        query = query.filter(VocCompetition.status == status)
    return query.order_by(VocCompetition.competition_date.desc().nullslast()).all()


@router.post("/competitions/{comp_id}/register")
def register_competition(
    comp_id: int,
    student_id: int = Query(...),
    student_name: str = Query(...),
    teacher_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """报名竞赛"""
    _, org_id = ctx
    comp = db.query(VocCompetition).filter(VocCompetition.id == comp_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="竞赛不存在")
    reg = VocCompetitionRegistration(
        competition_id=comp_id, org_id=org_id,
        student_id=student_id, student_name=student_name,
        teacher_name=teacher_name,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@router.put("/competitions/{comp_id}/results")
def update_competition_results(
    comp_id: int,
    registration_id: int = Query(...),
    award_level: Optional[str] = Query(None),
    score: Optional[float] = Query(None),
    cert_url: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """录入竞赛成绩"""
    _, org_id = ctx
    reg = db.query(VocCompetitionRegistration).filter(
        VocCompetitionRegistration.id == registration_id,
        VocCompetitionRegistration.competition_id == comp_id,
        VocCompetitionRegistration.org_id == org_id,
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="报名记录不存在")
    if award_level:
        reg.award_level = award_level
    if score is not None:
        reg.score = score
    if cert_url:
        reg.award_cert_url = cert_url
    db.commit()
    return {"message": "成绩已录入"}


@router.get("/competitions/stats")
def competition_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """竞赛统计"""
    _, org_id = ctx
    total = db.query(func.count(VocCompetition.id)).filter(
        VocCompetition.org_id == org_id
    ).scalar() or 0
    by_level = db.query(
        VocCompetition.level, func.count(VocCompetition.id)
    ).filter(VocCompetition.org_id == org_id).group_by(VocCompetition.level).all()
    awards = db.query(
        VocCompetitionRegistration.award_level,
        func.count(VocCompetitionRegistration.id)
    ).filter(
        VocCompetitionRegistration.org_id == org_id,
        VocCompetitionRegistration.award_level.isnot(None),
    ).group_by(VocCompetitionRegistration.award_level).all()
    return {"total": total, "by_level": dict(by_level), "awards": dict(awards)}


# ==================== 实习就业 ====================


@router.post("/internships")
def create_internship(
    payload: VocInternshipCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建实习记录"""
    _, org_id = ctx
    record = VocInternshipRecord(org_id=org_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/internships")
def list_internships(
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """实习记录列表"""
    _, org_id = ctx
    query = db.query(VocInternshipRecord).filter(VocInternshipRecord.org_id == org_id)
    if student_id:
        query = query.filter(VocInternshipRecord.student_id == student_id)
    if status:
        query = query.filter(VocInternshipRecord.status == status)
    return query.order_by(VocInternshipRecord.start_date.desc().nullslast()).all()


@router.get("/employment/stats")
def employment_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """就业统计"""
    _, org_id = ctx
    total = db.query(func.count(VocEmploymentRecord.id)).filter(
        VocEmploymentRecord.org_id == org_id
    ).scalar() or 0
    by_location = db.query(
        VocEmploymentRecord.location, func.count(VocEmploymentRecord.id)
    ).filter(VocEmploymentRecord.org_id == org_id).group_by(VocEmploymentRecord.location).all()
    avg_salary = db.query(func.avg(VocEmploymentRecord.salary)).filter(
        VocEmploymentRecord.org_id == org_id
    ).scalar() or 0
    return {
        "total_employed": total,
        "by_location": dict(by_location),
        "avg_salary": round(float(avg_salary), 2),
    }


@router.post("/employment/records")
def create_employment(
    payload: VocEmploymentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """记录就业信息"""
    _, org_id = ctx
    record = VocEmploymentRecord(org_id=org_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ==================== 双创孵化 ====================


@router.post("/incubator/projects")
def create_incubator(
    payload: VocIncubatorCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """提交创意/创建孵化项目"""
    _, org_id = ctx
    project = VocIncubatorProject(org_id=org_id, **payload.model_dump())
    db.add(project)
    db.flush()
    # 队长自动成为成员
    member = VocIncubatorMember(
        project_id=project.id, student_id=payload.leader_id,
        student_name=payload.leader_name, role="leader",
    )
    db.add(member)
    db.commit()
    db.refresh(project)
    return project


@router.get("/incubator/projects")
def list_incubator_projects(
    stage: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """孵化项目列表"""
    _, org_id = ctx
    query = db.query(VocIncubatorProject).filter(VocIncubatorProject.org_id == org_id)
    if stage:
        query = query.filter(VocIncubatorProject.stage == stage)
    if status:
        query = query.filter(VocIncubatorProject.status == status)
    return query.order_by(VocIncubatorProject.created_at.desc()).all()


@router.put("/incubator/projects/{project_id}/stage")
def update_incubator_stage(
    project_id: int,
    stage: str = Query(...),
    progress: Optional[int] = Query(None, ge=0, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新孵化阶段"""
    _, org_id = ctx
    project = db.query(VocIncubatorProject).filter(
        VocIncubatorProject.id == project_id, VocIncubatorProject.org_id == org_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    project.stage = stage
    if progress is not None:
        project.progress = progress
    if progress and progress >= 100:
        project.status = "completed"
    db.commit()
    return {"message": "阶段已更新"}


@router.get("/incubator/stats")
def incubator_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """孵化看板统计"""
    _, org_id = ctx
    total = db.query(func.count(VocIncubatorProject.id)).filter(
        VocIncubatorProject.org_id == org_id
    ).scalar() or 0
    by_stage = db.query(
        VocIncubatorProject.stage, func.count(VocIncubatorProject.id)
    ).filter(VocIncubatorProject.org_id == org_id).group_by(VocIncubatorProject.stage).all()
    completed = db.query(func.count(VocIncubatorProject.id)).filter(
        VocIncubatorProject.org_id == org_id, VocIncubatorProject.status == "completed"
    ).scalar() or 0
    total_funding = db.query(func.sum(VocIncubatorProject.total_funding)).filter(
        VocIncubatorProject.org_id == org_id
    ).scalar() or 0
    patents = db.query(func.count(VocIncubatorProject.id)).filter(
        VocIncubatorProject.org_id == org_id, VocIncubatorProject.patent_applied.is_(True)
    ).scalar() or 0
    return {
        "total": total,
        "by_stage": dict(by_stage),
        "completed": completed,
        "success_rate": f"{round(completed / total * 100, 1)}%" if total > 0 else "0%",
        "total_funding": round(float(total_funding), 2),
        "patent_count": patents,
    }


# ==================== 合作统计 ====================


@router.get("/cooperation/stats", response_model=VocCooperationStats)
def cooperation_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """校企合作看板统计"""
    _, org_id = ctx
    enterprises = db.query(func.count(VocEnterprise.id)).filter(
        VocEnterprise.org_id == org_id, VocEnterprise.is_active.is_(True)
    ).scalar() or 0
    active_projects = db.query(func.count(VocCooperationProject.id)).filter(
        VocCooperationProject.org_id == org_id, VocCooperationProject.status == "active"
    ).scalar() or 0
    internships = db.query(func.count(VocInternshipRecord.id)).filter(
        VocInternshipRecord.org_id == org_id, VocInternshipRecord.status == "ongoing"
    ).scalar() or 0
    employed = db.query(func.count(VocEmploymentRecord.id)).filter(
        VocEmploymentRecord.org_id == org_id
    ).scalar() or 0
    incubator = db.query(func.count(VocIncubatorProject.id)).filter(
        VocIncubatorProject.org_id == org_id, VocIncubatorProject.status == "active"
    ).scalar() or 0
    return VocCooperationStats(
        total_enterprises=enterprises,
        active_projects=active_projects,
        total_internships=internships,
        employment_rate=f"{round(employed / max(internships + employed, 1) * 100, 1)}%",
        incubator_projects=incubator,
    )