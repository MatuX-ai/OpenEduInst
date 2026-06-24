"""
职业学校 - 技能评估体系 API 路由
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.vocational_assessment import (
    VocSkillStandard, VocSkillAssessment, VocCertificate,
    VocSkillStandardCreate, VocAssessmentCreate, VocCertificateCreate,
    VocStudentSkillProfile,
)
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/vocational", tags=["职业学校-技能评估"])


# ==================== 技能标准库 ====================


@router.post("/assessments/standards")
def create_skill_standard(
    payload: VocSkillStandardCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建技能标准"""
    _, org_id = ctx
    std = VocSkillStandard(org_id=org_id, **payload.model_dump())
    db.add(std)
    db.commit()
    db.refresh(std)
    return std


@router.get("/assessments/standards")
def list_skill_standards(
    major: Optional[str] = None,
    skill_level: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """技能标准库列表"""
    _, org_id = ctx
    query = db.query(VocSkillStandard).filter(
        VocSkillStandard.org_id == org_id, VocSkillStandard.is_active.is_(True)
    )
    if major:
        query = query.filter(VocSkillStandard.major == major)
    if skill_level:
        query = query.filter(VocSkillStandard.skill_level == skill_level)
    return query.all()


# ==================== 技能考核 ====================


@router.post("/assessments/evaluate")
def create_assessment(
    payload: VocAssessmentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """提交技能评估"""
    _, org_id = ctx
    assessment = VocSkillAssessment(org_id=org_id, **payload.model_dump())
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/assessments/student/{student_id}/profile")
def get_student_skill_profile(
    student_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学生技能档案"""
    _, org_id = ctx

    assessments = db.query(VocSkillAssessment).filter(
        VocSkillAssessment.org_id == org_id,
        VocSkillAssessment.student_id == student_id,
    ).order_by(VocSkillAssessment.assessment_date.desc()).all()

    certificates = db.query(VocCertificate).filter(
        VocCertificate.org_id == org_id,
        VocCertificate.student_id == student_id,
    ).order_by(VocCertificate.issue_date.desc()).all()

    avg = db.query(func.avg(VocSkillAssessment.score)).filter(
        VocSkillAssessment.org_id == org_id,
        VocSkillAssessment.student_id == student_id,
    ).scalar() or 0.0

    # 构建雷达图数据
    radar_data = {}
    for a in assessments:
        skill = db.query(VocSkillStandard).filter(VocSkillStandard.id == a.skill_id).first()
        if skill:
            dim = skill.skill_name
            if dim not in radar_data:
                radar_data[dim] = []
            radar_data[dim].append(a.score)

    return {
        "student_id": student_id,
        "student_name": assessments[0].student_name if assessments else "",
        "avg_score": round(float(avg), 1),
        "skill_count": len(assessments),
        "assessments": [
            {
                "id": a.id,
                "skill_id": a.skill_id,
                "score": a.score,
                "comment": a.comment,
                "evaluator_name": a.evaluator_name,
                "assessment_date": str(a.assessment_date),
                "skill_name": db.query(VocSkillStandard.skill_name).filter(
                    VocSkillStandard.id == a.skill_id
                ).scalar() or "",
            }
            for a in assessments
        ],
        "certificates": [
            {
                "id": c.id,
                "cert_name": c.cert_name,
                "cert_number": c.cert_number,
                "cert_level": c.cert_level,
                "issuing_authority": c.issuing_authority,
                "issue_date": str(c.issue_date) if c.issue_date else None,
            }
            for c in certificates
        ],
        "radar": {
            dim: round(sum(scores) / len(scores), 1)
            for dim, scores in radar_data.items()
        },
    }


# ==================== 技能证书 ====================


@router.post("/certificates")
def create_certificate(
    payload: VocCertificateCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """记录技能证书"""
    _, org_id = ctx
    cert = VocCertificate(org_id=org_id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/certificates")
def list_certificates(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """证书列表"""
    _, org_id = ctx
    query = db.query(VocCertificate).filter(VocCertificate.org_id == org_id)
    if student_id:
        query = query.filter(VocCertificate.student_id == student_id)
    return query.order_by(VocCertificate.issue_date.desc().nullslast()).all()


@router.get("/assessments/stats")
def assessment_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """技能评估统计"""
    _, org_id = ctx
    total = db.query(func.count(VocSkillAssessment.id)).filter(
        VocSkillAssessment.org_id == org_id
    ).scalar() or 0
    avg_score = db.query(func.avg(VocSkillAssessment.score)).filter(
        VocSkillAssessment.org_id == org_id
    ).scalar() or 0
    passed = db.query(func.count(VocSkillAssessment.id)).filter(
        VocSkillAssessment.org_id == org_id,
        VocSkillAssessment.score >= 60,
    ).scalar() or 0
    cert_total = db.query(func.count(VocCertificate.id)).filter(
        VocCertificate.org_id == org_id
    ).scalar() or 0
    return {
        "total_assessments": total,
        "avg_score": round(float(avg_score), 1),
        "pass_rate": f"{round(passed / total * 100, 1)}%" if total > 0 else "0%",
        "total_certificates": cert_total,
    }