"""
AI 助教服务路由
提供智能排课建议、学生学情分析、代码自动审查 RESTful API
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.ai_assistant_service import AIAssistantService
from utils.auth_utils import require_org_context
from utils.database import get_db

router = APIRouter(prefix="/api/v1/ai", tags=["AI 助教"])


# ---------- 请求/响应模型 ----------

class SchedulingRequest(BaseModel):
    teachers: List[dict] = Field(..., description="教师列表，每项含 id/name/available_slots")
    classrooms: List[dict] = Field(..., description="教室列表，每项含 id/name/capacity")
    courses: List[dict] = Field(..., description="课程列表，每项含 id/name/students/duration")
    constraints: Optional[dict] = Field(None, description="排课约束（如禁止时间段）")


class StudentAnalysisRequest(BaseModel):
    student_id: int = Field(..., description="学生 ID")


class CodeReviewRequest(BaseModel):
    code: str = Field(..., description="待审查的代码文本")
    language: str = Field("python", description="编程语言: python / c / cpp / arduino / javascript")
    student_name: str = Field("", description="学生姓名（可选）")


# ---------- 路由 ----------

@router.post("/scheduling/suggest", summary="智能排课建议")
def suggest_scheduling(
    req: SchedulingRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    基于约束满足 + 贪心优化算法，生成最优排课方案。
    返回排课结果、冲突列表、负载均衡评分。
    """
    _, org_id = ctx
    svc = AIAssistantService(db, org_id)
    try:
        result = svc.suggest_scheduling(
            teachers=req.teachers,
            classrooms=req.classrooms,
            courses=req.courses,
            constraints=req.constraints,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/student/analyze", summary="学生学情分析")
def analyze_student(
    req: StudentAnalysisRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    生成个人学情报告：雷达图 + 流失预警 + 改进建议。
    分析维度：出勤率、课时消耗、项目完成率、竞赛获奖、课堂参与度。
    """
    _, org_id = ctx
    svc = AIAssistantService(db, org_id)
    try:
        result = svc.analyze_student(req.student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/code/review", summary="代码自动审查")
def review_code(
    req: CodeReviewRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    对学生提交的代码进行自动审查。
    支持 Python / C / C++(Arduino) / JavaScript。
    评分维度：正确性(40%) + 风格(20%) + 逻辑(20%) + 创新性(20%)。
    """
    _, org_id = ctx
    svc = AIAssistantService(db, org_id)
    try:
        result = svc.review_code(
            code=req.code,
            language=req.language,
            student_name=req.student_name,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/token-balance", summary="查询 AI Token 余额")
def get_token_balance(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """查询当前组织的 AI Token 余额和消耗统计"""
    _, org_id = ctx
    try:
        from models.token_billing import TokenAccount
        account = (
            db.query(TokenAccount)
            .filter(TokenAccount.organization_id == org_id)
            .first()
        )
        if account:
            return {
                "balance": account.balance,
                "total_consumed": getattr(account, "total_consumed", 0),
                "monthly_quota": 10000,
            }
    except Exception:
        pass
    return {
        "balance": 10000,
        "total_consumed": 0,
        "monthly_quota": 10000,
        "note": "Token 计费系统初始化中，当前免费使用",
    }
