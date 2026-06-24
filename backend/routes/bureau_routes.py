"""
教育局 STEM 教育监管平台 API 路由
包含：数据总览、学校监管、设备调配、师资培训、竞赛管理、经费管理、课程资源、数据报表
"""

from __future__ import annotations

import logging
from datetime import datetime, date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from utils.database import get_db
from utils.auth_utils import require_org_context, get_current_user_sync, get_current_org_id
from models.license import Organization, OrganizationType
from models.base_models import User
from models.bureau_models import (
    BureauSchool, SchoolSTEMScore, SchoolRating, EquipmentStatus,
    BureauEquipmentPool, EquipmentRequest, EquipmentAllocation, AllocationStatus,
    CrossSchoolSharing, SharingStatus,
    TrainingSession, TrainingRegistration, TrainingSessionStatus,
    BureauCompetition, CompetitionResult, CompetitionLevel, AwardLevel,
    BudgetPlan, BudgetStatus, BudgetExpense, ExpenseCategory, ExpenseStatus,
    BureauCurriculumResource, CurriculumCategory, CurriculumStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/bureau", tags=["教育局管理平台"])


# ==================== 依赖注入 ====================

def _get_bureau_id(ctx) -> int:
    """从上下文中获取教育局 org_id"""
    _, org_id = ctx
    return org_id


def _require_bureau_type(db: Session, bureau_id: int):
    """校验当前组织是否为教育局类型"""
    org = db.query(Organization).filter(Organization.id == bureau_id).first()
    if not org or org.org_type != OrganizationType.BUREAU:
        raise HTTPException(status_code=403, detail="当前账号不是教育局管理员")


def _paginate(query, page: int, page_size: int):
    """通用分页"""
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [dict(item) if isinstance(item, dict) else item for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


# ==================== FR-BDSH: 数据总览仪表盘 ====================

@router.get("/dashboard/stats")
def get_bureau_dashboard_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取教育局仪表盘关键指标"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    # 学校总数
    total_schools = db.query(func.count(BureauSchool.id)).filter(
        BureauSchool.bureau_id == bureau_id, BureauSchool.is_active == True
    ).scalar() or 0

    # STEM 学生总数
    total_stem_students = db.query(func.coalesce(func.sum(BureauSchool.stem_student_count), 0)).filter(
        BureauSchool.bureau_id == bureau_id
    ).scalar() or 0

    # STEM 教师总数
    total_stem_teachers = db.query(func.coalesce(func.sum(BureauSchool.stem_teacher_count), 0)).filter(
        BureauSchool.bureau_id == bureau_id
    ).scalar() or 0

    # STEM 覆盖率（评分 >= 60 的学校占比）
    covered = db.query(func.count(BureauSchool.id)).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.stem_score >= 60
    ).scalar() or 0
    coverage_rate = round(covered / total_schools * 100, 1) if total_schools > 0 else 0

    # 跨校设备共享次数
    sharing_count = db.query(func.count(CrossSchoolSharing.id)).filter(
        CrossSchoolSharing.bureau_id == bureau_id
    ).scalar() or 0

    # 年度竞赛获奖数
    current_year = datetime.utcnow().year
    award_count = db.query(func.count(CompetitionResult.id)).filter(
        CompetitionResult.id.in_(
            db.query(CompetitionResult.id).join(
                BureauCompetition, CompetitionResult.competition_id == BureauCompetition.id
            ).filter(
                BureauCompetition.bureau_id == bureau_id,
                func.extract("year", CompetitionResult.award_date) == current_year
            )
        )
    ).scalar() or 0

    # 薄弱学校数
    weak_schools = db.query(func.count(BureauSchool.id)).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.rating == SchoolRating.WEAK
    ).scalar() or 0

    # 环比变化（简化：用总数除以 2 做模拟）
    # TODO: 接入真实环比数据
    return {
        "success": True,
        "data": {
            "totalSchools": total_schools,
            "totalStemStudents": total_stem_students,
            "totalStemTeachers": total_stem_teachers,
            "stemCoverageRate": coverage_rate,
            "crossSchoolSharingCount": sharing_count,
            "annualAwardCount": award_count,
            "weakSchoolCount": weak_schools,
            "trends": {
                "schoolsChange": "+0%",
                "studentsChange": "+0%",
                "teachersChange": "+0%",
                "coverageChange": "+0%",
            },
        },
        "message": "获取仪表盘统计成功",
    }


@router.get("/dashboard/coverage-trend")
def get_coverage_trend(
    months: int = Query(6, ge=3, le=24),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取 STEM 覆盖率趋势"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    # 从评分记录获取历史趋势
    today = date.today()
    trend_data = []
    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        label = f"{y}-{m:02d}"

        # 统计该月有评分记录的学校中评分 >= 60 的比例
        from sqlalchemy import extract
        scored_schools = db.query(func.count(func.distinct(SchoolSTEMScore.school_id))).filter(
            SchoolSTEMScore.school_id.in_(
                db.query(BureauSchool.id).filter(BureauSchool.bureau_id == bureau_id)
            ),
            extract("year", SchoolSTEMScore.score_date) == y,
            extract("month", SchoolSTEMScore.score_date) == m,
            SchoolSTEMScore.overall_score >= 60,
        ).scalar() or 0

        total_scored = db.query(func.count(func.distinct(SchoolSTEMScore.school_id))).filter(
            SchoolSTEMScore.school_id.in_(
                db.query(BureauSchool.id).filter(BureauSchool.bureau_id == bureau_id)
            ),
            extract("year", SchoolSTEMScore.score_date) == y,
            extract("month", SchoolSTEMScore.score_date) == m,
        ).scalar() or 0

        rate = round(scored_schools / total_scored * 100, 1) if total_scored > 0 else 0
        trend_data.append({"month": label, "rate": rate, "target": 80})

    return {
        "success": True,
        "data": {"trend": trend_data},
        "message": "获取覆盖率趋势成功",
    }


@router.get("/dashboard/school-distribution")
def get_school_distribution(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学校类型分布"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    schools = db.query(BureauSchool).filter(
        BureauSchool.bureau_id == bureau_id, BureauSchool.is_active == True
    ).all()

    school_ids = [s.org_id for s in schools]
    orgs = db.query(Organization).filter(Organization.id.in_(school_ids)).all()
    org_map = {o.id: o for o in orgs}

    distribution = {}
    for s in schools:
        org = org_map.get(s.org_id)
        org_type = org.org_type.value if org else "unknown"
        # 简化类型映射
        type_label = {
            "k12_school": "K12学校",
            "vocational_school": "职业学校",
            "training_institution": "培训机构",
        }.get(org_type, org_type)
        distribution[type_label] = distribution.get(type_label, 0) + 1

    return {
        "success": True,
        "data": {
            "distribution": [
                {"name": k, "value": v} for k, v in distribution.items()
            ],
            "total": len(schools),
        },
        "message": "获取学校分布成功",
    }


@router.get("/dashboard/weak-alerts")
def get_weak_school_alerts(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取薄弱校预警列表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    weak_schools = db.query(BureauSchool).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.rating == SchoolRating.WEAK,
    ).order_by(BureauSchool.stem_score.asc()).all()

    items = []
    for s in weak_schools:
        org = db.query(Organization).filter(Organization.id == s.org_id).first()
        items.append({
            "id": s.id,
            "orgId": s.org_id,
            "name": org.name if org else f"学校#{s.org_id}",
            "orgType": org.org_type.value if org else "",
            "stemScore": s.stem_score,
            "equipmentStatus": s.equipment_status.value,
            "suggestion": "建议优先配发设备、安排教师培训",
        })

    return {
        "success": True,
        "data": {"alerts": items, "total": len(items)},
        "message": "获取薄弱校预警成功",
    }


@router.get("/dashboard/quick-links")
def get_quick_links(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取四大功能快捷入口数据"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    # 待审批设备申请数
    pending_requests = db.query(func.count(EquipmentRequest.id)).filter(
        EquipmentRequest.bureau_id == bureau_id,
        EquipmentRequest.status == AllocationStatus.PENDING,
    ).scalar() or 0

    # 进行中培训数
    active_trainings = db.query(func.count(TrainingSession.id)).filter(
        TrainingSession.bureau_id == bureau_id,
        TrainingSession.status.in_([TrainingSessionStatus.REGISTERING, TrainingSessionStatus.UPCOMING]),
    ).scalar() or 0

    # 即将截止报名的竞赛数
    upcoming_competitions = db.query(func.count(BureauCompetition.id)).filter(
        BureauCompetition.bureau_id == bureau_id,
        BureauCompetition.status == "报名中",
    ).scalar() or 0

    # 待审核课程资源数
    pending_resources = db.query(func.count(BureauCurriculumResource.id)).filter(
        BureauCurriculumResource.bureau_id == bureau_id,
        BureauCurriculumResource.status == CurriculumStatus.PENDING,
    ).scalar() or 0

    return {
        "success": True,
        "data": {
            "equipment": {"pendingRequests": pending_requests, "label": "设备调配"},
            "training": {"activeSessions": active_trainings, "label": "师资培训"},
            "competition": {"upcomingEvents": upcoming_competitions, "label": "竞赛组织"},
            "curriculum": {"pendingReviews": pending_resources, "label": "课程共享"},
        },
        "message": "获取快捷入口数据成功",
    }


# ==================== FR-BSCH: 学校监管 ====================

@router.get("/schools")
def list_schools(
    rating: Optional[str] = Query(None, description="评级筛选"),
    sort_by: str = Query("stem_score", description="排序字段"),
    order: str = Query("desc", description="排序方向"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学校 STEM 教育质量评估列表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(BureauSchool).filter(BureauSchool.bureau_id == bureau_id)

    if rating:
        try:
            rating_enum = SchoolRating(rating)
            query = query.filter(BureauSchool.rating == rating_enum)
        except ValueError:
            pass

    # 排序
    sort_col = getattr(BureauSchool, sort_by, BureauSchool.stem_score)
    query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    total = query.count()
    schools = query.offset((page - 1) * page_size).limit(page_size).all()

    org_ids = [s.org_id for s in schools]
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all() if org_ids else []
    org_map = {o.id: o for o in orgs}

    items = []
    for s in schools:
        org = org_map.get(s.org_id)
        items.append({
            "id": s.id,
            "orgId": s.org_id,
            "name": org.name if org else f"学校#{s.org_id}",
            "orgType": org.org_type.value if org else "",
            "studentCount": org.current_users if org else 0,
            "stemStudentCount": s.stem_student_count,
            "stemTeacherCount": s.stem_teacher_count,
            "stemScore": s.stem_score,
            "rating": s.rating.value,
            "equipmentStatus": s.equipment_status.value,
            "districtArea": s.district_area,
            "description": s.description or "",
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取学校列表成功",
    }


@router.get("/schools/{school_id}")
def get_school_detail(
    school_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学校 STEM 教育详情"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    school = db.query(BureauSchool).filter(
        BureauSchool.id == school_id,
        BureauSchool.bureau_id == bureau_id,
    ).first()
    if not school:
        raise HTTPException(status_code=404, detail="学校不存在")

    org = db.query(Organization).filter(Organization.id == school.org_id).first()

    # 最近评分记录
    recent_scores = db.query(SchoolSTEMScore).filter(
        SchoolSTEMScore.school_id == school.id
    ).order_by(SchoolSTEMScore.score_date.desc()).limit(12).all()

    # 设备列表
    allocations = db.query(EquipmentAllocation).filter(
        EquipmentAllocation.school_id == school.id
    ).order_by(EquipmentAllocation.created_at.desc()).limit(20).all()

    # 培训记录
    training_records = db.query(TrainingRegistration).filter(
        TrainingRegistration.school_id == school.id
    ).order_by(TrainingRegistration.created_at.desc()).limit(10).all()

    # 竞赛获奖
    awards = db.query(CompetitionResult).filter(
        CompetitionResult.school_id == school.id
    ).order_by(CompetitionResult.created_at.desc()).limit(10).all()

    return {
        "success": True,
        "data": {
            "school": {
                "id": school.id,
                "orgId": school.org_id,
                "name": org.name if org else "",
                "orgType": org.org_type.value if org else "",
                "districtArea": school.district_area,
                "stemStudentCount": school.stem_student_count,
                "stemTeacherCount": school.stem_teacher_count,
                "stemScore": school.stem_score,
                "rating": school.rating.value,
                "equipmentStatus": school.equipment_status.value,
                "description": school.description or "",
            },
            "scoreHistory": [
                {
                    "date": sc.score_date.isoformat(),
                    "overallScore": sc.overall_score,
                    "curriculumScore": sc.curriculum_score,
                    "equipmentScore": sc.equipment_score,
                    "teacherScore": sc.teacher_score,
                    "competitionScore": sc.competition_score,
                    "coverageScore": sc.coverage_score,
                }
                for sc in recent_scores
            ],
            "equipmentAllocations": [
                {
                    "id": a.id,
                    "itemName": db.query(BureauEquipmentPool.name).filter(
                        BureauEquipmentPool.id == a.equipment_item_id
                    ).scalar() or "",
                    "quantity": a.quantity,
                    "status": a.status.value,
                    "createdAt": a.created_at.isoformat() if a.created_at else None,
                }
                for a in allocations
            ],
            "trainingRecords": [
                {
                    "id": tr.id,
                    "sessionName": db.query(TrainingSession.title).filter(
                        TrainingSession.id == tr.session_id
                    ).scalar() or "",
                    "teacherName": tr.teacher_name,
                    "isAttended": tr.is_attended,
                    "score": tr.score,
                }
                for tr in training_records
            ],
            "competitionAwards": [
                {
                    "id": a.id,
                    "competitionName": db.query(BureauCompetition.name).filter(
                        BureauCompetition.id == a.competition_id
                    ).scalar() or "",
                    "awardName": a.award_name,
                    "awardLevel": a.award_level.value,
                    "awardType": a.award_type,
                    "awardDate": a.award_date.isoformat() if a.award_date else None,
                }
                for a in awards
            ],
        },
        "message": "获取学校详情成功",
    }


@router.put("/schools/{school_id}/evaluate")
def evaluate_school(
    school_id: int,
    overall_score: int = Query(..., ge=0, le=100),
    curriculum_score: int = Query(0, ge=0, le=100),
    equipment_score: int = Query(0, ge=0, le=100),
    teacher_score: int = Query(0, ge=0, le=100),
    competition_score: int = Query(0, ge=0, le=100),
    coverage_score: int = Query(0, ge=0, le=100),
    evaluation: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """评估学校 STEM 教育质量"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    school = db.query(BureauSchool).filter(
        BureauSchool.id == school_id,
        BureauSchool.bureau_id == bureau_id,
    ).first()
    if not school:
        raise HTTPException(status_code=404, detail="学校不存在")

    # 创建评分记录
    score_record = SchoolSTEMScore(
        school_id=school.id,
        score_date=date.today(),
        overall_score=overall_score,
        curriculum_score=curriculum_score,
        equipment_score=equipment_score,
        teacher_score=teacher_score,
        competition_score=competition_score,
        coverage_score=coverage_score,
        evaluation=evaluation,
    )
    db.add(score_record)

    # 更新学校评分
    school.stem_score = overall_score
    if overall_score >= 85:
        school.rating = SchoolRating.EXCELLENT
    elif overall_score >= 70:
        school.rating = SchoolRating.GOOD
    elif overall_score >= 60:
        school.rating = SchoolRating.NEED_IMPROVEMENT
    else:
        school.rating = SchoolRating.WEAK

    db.commit()

    return {
        "success": True,
        "data": {
            "schoolId": school.id,
            "stemScore": school.stem_score,
            "rating": school.rating.value,
        },
        "message": "学校评估成功",
    }


# ==================== FR-BEQ: 设备调配管理 ====================

@router.get("/equipment-pool")
def get_equipment_pool(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取设备配发池总览"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    items = db.query(BureauEquipmentPool).filter(
        BureauEquipmentPool.bureau_id == bureau_id,
        BureauEquipmentPool.is_active == True,
    ).all()

    total_value = sum(
        (item.unit_price or 0) * item.total_quantity for item in items
    )
    allocated_value = sum(
        (item.unit_price or 0) * item.allocated_quantity for item in items
    )
    in_transit_value = sum(
        (item.unit_price or 0) * item.in_transit_quantity for item in items
    )

    return {
        "success": True,
        "data": {
            "totalValue": float(total_value),
            "allocatedValue": float(allocated_value),
            "inTransitValue": float(in_transit_value),
            "pendingRequests": db.query(func.count(EquipmentRequest.id)).filter(
                EquipmentRequest.bureau_id == bureau_id,
                EquipmentRequest.status == AllocationStatus.PENDING,
            ).scalar() or 0,
            "items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "category": item.category,
                    "unit": item.unit,
                    "unitPrice": float(item.unit_price or 0),
                    "totalQuantity": item.total_quantity,
                    "allocatedQuantity": item.allocated_quantity,
                    "inStockQuantity": item.in_stock_quantity,
                    "inTransitQuantity": item.in_transit_quantity,
                    "minStock": item.min_stock,
                    "supplier": item.supplier,
                    "isLowStock": item.in_stock_quantity <= item.min_stock if item.min_stock > 0 else False,
                }
                for item in items
            ],
        },
        "message": "获取设备配发池成功",
    }


@router.post("/equipment-pool/items")
def add_equipment_item(
    name: str = Query(...),
    category: str = Query(...),
    unit: str = Query("套"),
    unit_price: float = Query(0),
    total_quantity: int = Query(0),
    in_stock_quantity: int = Query(0),
    supplier: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加设备品类"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    item = BureauEquipmentPool(
        bureau_id=bureau_id,
        name=name,
        category=category,
        unit=unit,
        unit_price=unit_price,
        total_quantity=total_quantity,
        in_stock_quantity=in_stock_quantity,
        supplier=supplier,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "data": {"id": item.id, "name": item.name},
        "message": "设备品类添加成功",
    }


@router.get("/equipment-requests/pending")
def get_pending_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取待审批的配发申请"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(EquipmentRequest).filter(
        EquipmentRequest.bureau_id == bureau_id,
        EquipmentRequest.status == AllocationStatus.PENDING,
    ).order_by(EquipmentRequest.created_at.desc())

    total = query.count()
    requests = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for req in requests:
        school = db.query(BureauSchool).filter(BureauSchool.id == req.school_id).first()
        org = db.query(Organization).filter(Organization.id == school.org_id).first() if school else None
        equip = db.query(BureauEquipmentPool).filter(BureauEquipmentPool.id == req.equipment_item_id).first()
        items.append({
            "id": req.id,
            "schoolName": org.name if org else "",
            "equipmentName": equip.name if equip else "",
            "quantity": req.quantity,
            "reason": req.reason,
            "priority": req.priority,
            "status": req.status.value,
            "createdAt": req.created_at.isoformat() if req.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取待审批列表成功",
    }


@router.put("/equipment-requests/{request_id}/approve")
def approve_equipment_request(
    request_id: int,
    approved: bool = Query(...),
    comment: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审批设备配发申请"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    req = db.query(EquipmentRequest).filter(
        EquipmentRequest.id == request_id,
        EquipmentRequest.bureau_id == bureau_id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="申请不存在")

    req.status = AllocationStatus.APPROVED if approved else AllocationStatus.RECEIVED
    req.approval_comment = comment

    if approved:
        # 创建配发记录
        allocation = EquipmentAllocation(
            bureau_id=bureau_id,
            equipment_item_id=req.equipment_item_id,
            school_id=req.school_id,
            request_id=req.id,
            quantity=req.quantity,
            status=AllocationStatus.APPROVED,
            approval_date=datetime.utcnow(),
        )
        db.add(allocation)

        # 更新库存
        equip = db.query(BureauEquipmentPool).filter(
            BureauEquipmentPool.id == req.equipment_item_id
        ).first()
        if equip:
            equip.allocated_quantity = (equip.allocated_quantity or 0) + req.quantity
            equip.in_stock_quantity = max(0, (equip.in_stock_quantity or 0) - req.quantity)

    db.commit()

    return {
        "success": True,
        "data": {"requestId": req.id, "status": req.status.value},
        "message": "审批完成",
    }


@router.get("/cross-school-shares")
def get_cross_school_shares(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取跨校设备共享记录"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(CrossSchoolSharing).filter(
        CrossSchoolSharing.bureau_id == bureau_id
    ).order_by(CrossSchoolSharing.created_at.desc())

    total = query.count()
    shares = query.offset((page - 1) * page_size).limit(page_size).all()

    def _school_name(school_id):
        s = db.query(BureauSchool).filter(BureauSchool.id == school_id).first()
        if s:
            org = db.query(Organization).filter(Organization.id == s.org_id).first()
            return org.name if org else ""
        return ""

    def _equip_name(item_id):
        e = db.query(BureauEquipmentPool).filter(BureauEquipmentPool.id == item_id).first()
        return e.name if e else ""

    items = [
        {
            "id": s.id,
            "fromSchool": _school_name(s.from_school_id),
            "toSchool": _school_name(s.to_school_id),
            "equipmentName": _equip_name(s.equipment_item_id),
            "quantity": s.quantity,
            "borrowDate": s.borrow_date.isoformat() if s.borrow_date else None,
            "expectedReturnDate": s.expected_return_date.isoformat() if s.expected_return_date else None,
            "actualReturnDate": s.actual_return_date.isoformat() if s.actual_return_date else None,
            "reason": s.reason,
            "status": s.status.value,
        }
        for s in shares
    ]

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取共享记录成功",
    }


# ==================== FR-BTRAIN: 师资培训管理 ====================

@router.get("/training/overview")
def get_training_overview(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取培训总体进度"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    total_sessions = db.query(func.count(TrainingSession.id)).filter(
        TrainingSession.bureau_id == bureau_id
    ).scalar() or 0

    completed_sessions = db.query(func.count(TrainingSession.id)).filter(
        TrainingSession.bureau_id == bureau_id,
        TrainingSession.status == TrainingSessionStatus.COMPLETED,
    ).scalar() or 0

    total_registrations = db.query(func.count(TrainingRegistration.id)).filter(
        TrainingRegistration.session_id.in_(
            db.query(TrainingSession.id).filter(TrainingSession.bureau_id == bureau_id)
        )
    ).scalar() or 0

    total_attended = db.query(func.count(TrainingRegistration.id)).filter(
        TrainingRegistration.session_id.in_(
            db.query(TrainingSession.id).filter(TrainingSession.bureau_id == bureau_id)
        ),
        TrainingRegistration.is_attended == True,
    ).scalar() or 0

    return {
        "success": True,
        "data": {
            "totalSessions": total_sessions,
            "completedSessions": completed_sessions,
            "totalRegistrations": total_registrations,
            "totalAttended": total_attended,
            "completionRate": round(total_attended / total_registrations * 100, 1) if total_registrations > 0 else 0,
            "totalTeachers": 0,  # 需关联其他表
            "targetTeachers": 0,
        },
        "message": "获取培训总览成功",
    }


@router.get("/training/sessions")
def list_training_sessions(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取培训场次列表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(TrainingSession).filter(TrainingSession.bureau_id == bureau_id)
    if status:
        try:
            query = query.filter(TrainingSession.status == TrainingSessionStatus(status))
        except ValueError:
            pass
    query = query.order_by(TrainingSession.created_at.desc())

    total = query.count()
    sessions = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        {
            "id": s.id,
            "title": s.title,
            "trainer": s.trainer,
            "trainerOrg": s.trainer_org,
            "date": s.date.isoformat() if s.date else None,
            "type": s.type.value,
            "location": s.location,
            "maxAttendees": s.max_attendees,
            "currentAttendees": s.current_attendees,
            "coverageArea": s.coverage_area,
            "status": s.status.value,
            "description": s.description or "",
        }
        for s in sessions
    ]

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取培训列表成功",
    }


@router.post("/training/sessions")
def create_training_session(
    title: str = Query(...),
    trainer: str = Query(""),
    trainer_org: str = Query(""),
    date_str: str = Query(""),
    type_str: str = Query("线下"),
    location: str = Query(""),
    max_attendees: int = Query(0),
    coverage_area: str = Query(""),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建培训场次"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    training_date = None
    if date_str:
        try:
            training_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    session = TrainingSession(
        bureau_id=bureau_id,
        title=title,
        trainer=trainer,
        trainer_org=trainer_org,
        date=training_date,
        type=TrainingType(type_str) if type_str in ("线下", "线上") else TrainingType.OFFLINE,
        location=location,
        max_attendees=max_attendees,
        coverage_area=coverage_area,
        description=description,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "data": {"id": session.id, "title": session.title, "status": session.status.value},
        "message": "培训场次创建成功",
    }


@router.get("/training/district-coverage")
def get_district_coverage(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取各片区培训覆盖率"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    # 获取所有片区
    areas = db.query(BureauSchool.district_area).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.is_active == True,
    ).distinct().all()

    result = []
    for (area,) in areas:
        if not area:
            continue
        total_schools = db.query(func.count(BureauSchool.id)).filter(
            BureauSchool.bureau_id == bureau_id,
            BureauSchool.district_area == area,
        ).scalar() or 0

        # 该片区学校教师参训数
        school_ids = db.query(BureauSchool.id).filter(
            BureauSchool.bureau_id == bureau_id,
            BureauSchool.district_area == area,
        ).subquery()

        trained = db.query(func.count(func.distinct(TrainingRegistration.school_id))).filter(
            TrainingRegistration.school_id.in_(db.query(school_ids.c.id)),
        ).scalar() or 0

        coverage = round(trained / total_schools * 100, 1) if total_schools > 0 else 0
        result.append({
            "area": area,
            "totalSchools": total_schools,
            "trainedSchools": trained,
            "coverageRate": coverage,
            "isMet": coverage >= 80,  # 80% 达标线
        })

    return {
        "success": True,
        "data": {"districts": result},
        "message": "获取片区覆盖率成功",
    }


# ==================== FR-BCOMP: 竞赛管理 ====================

@router.get("/competitions")
def list_competitions(
    level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取竞赛列表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(BureauCompetition).filter(BureauCompetition.bureau_id == bureau_id)
    if level:
        try:
            query = query.filter(BureauCompetition.level == CompetitionLevel(level))
        except ValueError:
            pass
    if status:
        query = query.filter(BureauCompetition.status == status)

    query = query.order_by(BureauCompetition.created_at.desc())

    total = query.count()
    competitions = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        {
            "id": c.id,
            "name": c.name,
            "level": c.level.value,
            "organizer": c.organizer,
            "competitionDate": c.competition_date.isoformat() if c.competition_date else None,
            "registrationDeadline": c.registration_deadline.isoformat() if c.registration_deadline else None,
            "location": c.location,
            "status": c.status,
            "description": c.description or "",
        }
        for c in competitions
    ]

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取竞赛列表成功",
    }


@router.post("/competitions")
def create_competition(
    name: str = Query(...),
    level: str = Query("县级"),
    organizer: str = Query(""),
    date_str: str = Query(""),
    deadline_str: str = Query(""),
    location: str = Query(""),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建竞赛信息"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    comp_date = None
    if date_str:
        try:
            comp_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    deadline = None
    if deadline_str:
        try:
            deadline = datetime.strptime(deadline_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    competition = BureauCompetition(
        bureau_id=bureau_id,
        name=name,
        level=CompetitionLevel(level) if level in ("国家级", "省级", "市级", "县级") else CompetitionLevel.COUNTY,
        organizer=organizer,
        competition_date=comp_date,
        registration_deadline=deadline,
        location=location,
        description=description,
    )
    db.add(competition)
    db.commit()
    db.refresh(competition)

    return {
        "success": True,
        "data": {"id": competition.id, "name": competition.name},
        "message": "竞赛创建成功",
    }


@router.get("/competitions/stats")
def get_competition_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取竞赛统计看板"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    # 各等级获奖数
    level_stats = {}
    for level in CompetitionLevel:
        count = db.query(func.count(CompetitionResult.id)).filter(
            CompetitionResult.competition_id.in_(
                db.query(BureauCompetition.id).filter(BureauCompetition.bureau_id == bureau_id)
            ),
            CompetitionResult.id.in_(
                db.query(CompetitionResult.id).join(
                    BureauCompetition, CompetitionResult.competition_id == BureauCompetition.id
                ).filter(BureauCompetition.level == level)
            ),
        ).scalar() or 0
        level_stats[level.value] = count

    # 最近获奖
    recent_results = db.query(CompetitionResult).filter(
        CompetitionResult.competition_id.in_(
            db.query(BureauCompetition.id).filter(BureauCompetition.bureau_id == bureau_id)
        )
    ).order_by(CompetitionResult.created_at.desc()).limit(10).all()

    recent = []
    for r in recent_results:
        comp = db.query(BureauCompetition).filter(BureauCompetition.id == r.competition_id).first()
        school = db.query(BureauSchool).filter(BureauSchool.id == r.school_id).first()
        org = db.query(Organization).filter(Organization.id == school.org_id).first() if school else None
        recent.append({
            "id": r.id,
            "competitionName": comp.name if comp else "",
            "awardName": r.award_name,
            "awardLevel": r.award_level.value,
            "schoolName": org.name if org else "",
            "awardDate": r.award_date.isoformat() if r.award_date else None,
        })

    return {
        "success": True,
        "data": {
            "byLevel": level_stats,
            "recentAwards": recent,
            "totalAwards": db.query(func.count(CompetitionResult.id)).filter(
                CompetitionResult.competition_id.in_(
                    db.query(BureauCompetition.id).filter(BureauCompetition.bureau_id == bureau_id)
                )
            ).scalar() or 0,
        },
        "message": "获取竞赛统计成功",
    }


@router.post("/competitions/{competition_id}/results")
def add_competition_result(
    competition_id: int,
    school_id: int = Query(...),
    award_name: str = Query(""),
    award_level: str = Query("三等奖"),
    award_type: str = Query("团体"),
    student_name: str = Query(""),
    teacher_name: str = Query(""),
    award_date_str: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """录入竞赛成绩"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    comp = db.query(BureauCompetition).filter(
        BureauCompetition.id == competition_id,
        BureauCompetition.bureau_id == bureau_id,
    ).first()
    if not comp:
        raise HTTPException(status_code=404, detail="竞赛不存在")

    award_date = None
    if award_date_str:
        try:
            award_date = datetime.strptime(award_date_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    result = CompetitionResult(
        competition_id=competition_id,
        school_id=school_id,
        award_name=award_name,
        award_level=AwardLevel(award_level) if award_level in ("特等奖", "一等奖", "二等奖", "三等奖", "优秀奖") else AwardLevel.THIRD,
        award_type=award_type,
        student_name=student_name,
        teacher_name=teacher_name,
        award_date=award_date,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "success": True,
        "data": {"id": result.id},
        "message": "成绩录入成功",
    }


# ==================== FR-BBGT: 经费管理 ====================

@router.get("/budget/overview")
def get_budget_overview(
    fiscal_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取经费总览"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    year = fiscal_year or datetime.utcnow().year
    plan = db.query(BudgetPlan).filter(
        BudgetPlan.bureau_id == bureau_id,
        BudgetPlan.fiscal_year == year,
    ).first()

    if not plan:
        return {
            "success": True,
            "data": {
                "fiscalYear": year,
                "totalAmount": 0,
                "spentAmount": 0,
                "remainingAmount": 0,
                "executionRate": 0,
                "status": "未创建",
                "categoryBreakdown": [],
                "recentExpenses": [],
            },
            "message": "该年度暂无预算",
        }

    # 各类别支出
    expenses = db.query(
        BudgetExpense.category,
        func.coalesce(func.sum(BudgetExpense.amount), 0),
    ).filter(
        BudgetExpense.budget_plan_id == plan.id,
    ).group_by(BudgetExpense.category).all()

    category_breakdown = [
        {
            "category": cat.value,
            "amount": float(amount),
        }
        for cat, amount in expenses
    ]

    recent = db.query(BudgetExpense).filter(
        BudgetExpense.budget_plan_id == plan.id,
    ).order_by(BudgetExpense.created_at.desc()).limit(10).all()

    recent_expenses = []
    for e in recent:
        school_name = ""
        if e.school_id:
            school = db.query(BureauSchool).filter(BureauSchool.id == e.school_id).first()
            if school:
                org = db.query(Organization).filter(Organization.id == school.org_id).first()
                school_name = org.name if org else ""
        recent_expenses.append({
            "id": e.id,
            "category": e.category.value,
            "itemName": e.item_name,
            "amount": float(e.amount),
            "schoolName": school_name,
            "expenseDate": e.expense_date.isoformat() if e.expense_date else None,
            "status": e.status.value,
        })

    remaining = float(plan.total_amount or 0) - float(plan.spent_amount or 0)
    execution_rate = round(float(plan.spent_amount or 0) / float(plan.total_amount or 1) * 100, 1)

    return {
        "success": True,
        "data": {
            "fiscalYear": year,
            "totalAmount": float(plan.total_amount or 0),
            "spentAmount": float(plan.spent_amount or 0),
            "remainingAmount": max(0, remaining),
            "executionRate": min(100, execution_rate),
            "status": plan.status.value,
            "categoryBreakdown": category_breakdown,
            "recentExpenses": recent_expenses,
        },
        "message": "获取经费总览成功",
    }


@router.post("/budget/plans")
def create_budget_plan(
    fiscal_year: int = Query(...),
    total_amount: float = Query(...),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建预算计划"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    existing = db.query(BudgetPlan).filter(
        BudgetPlan.bureau_id == bureau_id,
        BudgetPlan.fiscal_year == fiscal_year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该年度预算计划已存在")

    plan = BudgetPlan(
        bureau_id=bureau_id,
        fiscal_year=fiscal_year,
        total_amount=total_amount,
        description=description,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "success": True,
        "data": {"id": plan.id, "fiscalYear": plan.fiscal_year},
        "message": "预算计划创建成功",
    }


@router.post("/budget/expenses")
def create_budget_expense(
    budget_plan_id: int = Query(...),
    category: str = Query("其他"),
    item_name: str = Query(...),
    amount: float = Query(...),
    school_id: Optional[int] = Query(None),
    expense_date_str: str = Query(""),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建经费支出记录"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    plan = db.query(BudgetPlan).filter(
        BudgetPlan.id == budget_plan_id,
        BudgetPlan.bureau_id == bureau_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="预算计划不存在")

    expense_date = None
    if expense_date_str:
        try:
            expense_date = datetime.strptime(expense_date_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    expense = BudgetExpense(
        budget_plan_id=budget_plan_id,
        category=ExpenseCategory(category) if any(category == c.value for c in ExpenseCategory) else ExpenseCategory.OTHER,
        item_name=item_name,
        amount=amount,
        school_id=school_id,
        expense_date=expense_date,
        description=description,
    )
    db.add(expense)

    # 更新已支出金额
    plan.spent_amount = (plan.spent_amount or 0) + amount

    db.commit()
    db.refresh(expense)

    return {
        "success": True,
        "data": {"id": expense.id, "itemName": expense.item_name},
        "message": "支出记录创建成功",
    }


# ==================== FR-BCUR: 课程资源共享 ====================

@router.get("/curriculum/overview")
def get_curriculum_overview(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取课程资源池总览"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    total_resources = db.query(func.count(BureauCurriculumResource.id)).filter(
        BureauCurriculumResource.bureau_id == bureau_id,
    ).scalar() or 0

    published = db.query(func.count(BureauCurriculumResource.id)).filter(
        BureauCurriculumResource.bureau_id == bureau_id,
        BureauCurriculumResource.status == CurriculumStatus.PUBLISHED,
    ).scalar() or 0

    contributing_schools = db.query(func.count(func.distinct(BureauCurriculumResource.school_id))).filter(
        BureauCurriculumResource.bureau_id == bureau_id,
    ).scalar() or 0

    # 分类统计
    category_stats = db.query(
        BureauCurriculumResource.category,
        func.count(BureauCurriculumResource.id),
    ).filter(
        BureauCurriculumResource.bureau_id == bureau_id,
    ).group_by(BureauCurriculumResource.category).all()

    return {
        "success": True,
        "data": {
            "totalResources": total_resources,
            "publishedResources": published,
            "contributingSchools": contributing_schools,
            "categoryBreakdown": [
                {"category": cat.value, "count": count}
                for cat, count in category_stats
            ],
        },
        "message": "获取课程资源总览成功",
    }


@router.get("/curriculum/resources")
def list_curriculum_resources(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取课程资源列表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    query = db.query(BureauCurriculumResource).filter(BureauCurriculumResource.bureau_id == bureau_id)
    if category:
        try:
            query = query.filter(BureauCurriculumResource.category == CurriculumCategory(category))
        except ValueError:
            pass
    if status:
        try:
            query = query.filter(BureauCurriculumResource.status == CurriculumStatus(status))
        except ValueError:
            pass

    query = query.order_by(BureauCurriculumResource.created_at.desc())

    total = query.count()
    resources = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for r in resources:
        school = db.query(BureauSchool).filter(BureauSchool.id == r.school_id).first()
        org = db.query(Organization).filter(Organization.id == school.org_id).first() if school else None
        items.append({
            "id": r.id,
            "title": r.title,
            "category": r.category.value,
            "gradeRange": r.grade_range,
            "author": r.author,
            "schoolName": org.name if org else "",
            "fileType": r.file_type,
            "description": r.description or "",
            "downloadCount": r.download_count,
            "rating": float(r.rating or 0),
            "status": r.status.value,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取资源列表成功",
    }


@router.post("/curriculum/resources")
def create_curriculum_resource(
    title: str = Query(...),
    category: str = Query("编程与计算思维"),
    grade_range: str = Query(""),
    author: str = Query(""),
    school_id: int = Query(...),
    file_type: str = Query("教案"),
    description: str = Query(""),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """上传课程资源"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    resource = BureauCurriculumResource(
        bureau_id=bureau_id,
        school_id=school_id,
        title=title,
        category=CurriculumCategory(category) if any(category == c.value for c in CurriculumCategory) else CurriculumCategory.PROGRAMMING,
        grade_range=grade_range,
        author=author,
        file_type=file_type,
        description=description,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    return {
        "success": True,
        "data": {"id": resource.id, "title": resource.title},
        "message": "资源上传成功，待审核",
    }


@router.put("/curriculum/resources/{resource_id}/approve")
def approve_curriculum_resource(
    resource_id: int,
    approved: bool = Query(...),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """审核课程资源"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    resource = db.query(BureauCurriculumResource).filter(
        BureauCurriculumResource.id == resource_id,
        BureauCurriculumResource.bureau_id == bureau_id,
    ).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")

    resource.status = CurriculumStatus.PUBLISHED if approved else CurriculumStatus.ARCHIVED
    db.commit()

    return {
        "success": True,
        "data": {"id": resource.id, "status": resource.status.value},
        "message": "审核完成",
    }


# ==================== FR-BREP: 数据报表 ====================

@router.get("/reports/coverage")
def get_coverage_report(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """STEM 覆盖率报表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    schools = db.query(BureauSchool).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.is_active == True,
    ).all()

    total = len(schools)
    covered = sum(1 for s in schools if s.stem_score >= 60)
    weak = sum(1 for s in schools if s.rating == SchoolRating.WEAK)

    # 各评级分布
    rating_dist = {}
    for r in SchoolRating:
        rating_dist[r.value] = sum(1 for s in schools if s.rating == r)

    return {
        "success": True,
        "data": {
            "totalSchools": total,
            "coveredSchools": covered,
            "coverageRate": round(covered / total * 100, 1) if total > 0 else 0,
            "weakSchools": weak,
            "ratingDistribution": rating_dist,
        },
        "message": "获取覆盖率报表成功",
    }


@router.get("/reports/school-ranking")
def get_school_ranking_report(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学校评估排名报表"""
    bureau_id = _get_bureau_id(ctx)
    _require_bureau_type(db, bureau_id)

    schools = db.query(BureauSchool).filter(
        BureauSchool.bureau_id == bureau_id,
        BureauSchool.is_active == True,
    ).order_by(BureauSchool.stem_score.desc()).all()

    items = []
    for idx, s in enumerate(schools, 1):
        org = db.query(Organization).filter(Organization.id == s.org_id).first()
        items.append({
            "rank": idx,
            "schoolName": org.name if org else "",
            "orgType": org.org_type.value if org else "",
            "stemScore": s.stem_score,
            "rating": s.rating.value,
            "equipmentStatus": s.equipment_status.value,
        })

    return {
        "success": True,
        "data": {"ranking": items, "total": len(items)},
        "message": "获取排名报表成功",
    }


# ==================== 验证接口 ====================

@router.get("/verify")
def verify_bureau_access(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """验证当前用户是否具有教育局管理员权限"""
    bureau_id = _get_bureau_id(ctx)
    try:
        _require_bureau_type(db, bureau_id)
        org = db.query(Organization).filter(Organization.id == bureau_id).first()
        return {
            "success": True,
            "data": {
                "isBureau": True,
                "bureauId": bureau_id,
                "bureauName": org.name if org else "",
            },
            "message": "当前账号为教育局管理员",
        }
    except HTTPException:
        return {
            "success": False,
            "data": {"isBureau": False},
            "message": "当前账号不是教育局管理员",
        }