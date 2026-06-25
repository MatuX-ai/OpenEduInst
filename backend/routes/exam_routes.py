"""
考试管理 API 路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 query 传入。
模块代码：EXAM
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import random

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.student import Student
from models.exam import (
    QuestionBank, Question, ExamPaper, PaperQuestion,
    ExamTask, ExamResult,
    QuestionType, QuestionDifficulty, QuestionBankSource, QuestionStatus,
    ExamPaperStatus, ExamMode, ExamTaskStatus, ExamResultStatus, SubmitType,
)

logger = logging.getLogger(__name__)

# ── 枚举字符串 → 枚举成员映射（用于兼容 query 参数传入的字符串） ──

_QUESTION_STATUS_MAP = {
    "active": QuestionStatus.ACTIVE,
    "archived": QuestionStatus.ARCHIVED,
}

_PAPER_STATUS_MAP = {
    "draft": ExamPaperStatus.DRAFT,
    "published": ExamPaperStatus.PUBLISHED,
    "archived": ExamPaperStatus.ARCHIVED,
}

_TASK_STATUS_MAP = {
    "pending": ExamTaskStatus.PENDING,
    "in_progress": ExamTaskStatus.IN_PROGRESS,
    "ended": ExamTaskStatus.ENDED,
}

_RESULT_STATUS_MAP = {
    "submitted": ExamResultStatus.SUBMITTED,
    "graded": ExamResultStatus.GRADED,
}

router = APIRouter(
    prefix="/api/v1/exam",
    tags=["exam"],
)


# ==================== 题库管理 ====================

@router.get("/banks")
def get_question_banks(
    subject: Optional[str] = Query(None, description="科目筛选"),
    source: Optional[str] = Query(None, description="来源筛选"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取题库列表"""
    _, org_id = ctx
    logger.info("[EXAM] 获取题库列表 | org_id=%s | subject=%s | source=%s", org_id, subject, source)

    query = db.query(QuestionBank).filter(QuestionBank.org_id == org_id)
    if subject:
        query = query.filter(QuestionBank.subject == subject)
    if source:
        query = query.filter(QuestionBank.source == source)
    banks = query.order_by(QuestionBank.create_time.desc()).all()

    logger.info("[EXAM] 题库列表查询完成 | org_id=%s | count=%d", org_id, len(banks))
    return {"banks": [b.to_dict() for b in banks]}


@router.post("/banks")
def create_question_bank(
    name: str,
    subject: Optional[str] = None,
    source_url: Optional[str] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建题库"""
    _, org_id = ctx
    source = QuestionBankSource.EXTERNAL if source_url else QuestionBankSource.LOCAL
    logger.info("[EXAM] 创建题库 | org_id=%s | name='%s' | source=%s | subject=%s",
                org_id, name, source.value, subject)

    bank = QuestionBank(
        org_id=org_id,
        name=name,
        source=source,
        source_url=source_url,
        subject=subject,
        description=description,
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)

    logger.info("[EXAM] 题库创建成功 | bank_id=%s | org_id=%s | name='%s'", bank.id, org_id, name)
    return {"bank": bank.to_dict()}


@router.get("/questions")
def get_questions(
    bank_id: Optional[int] = Query(None, description="题库ID"),
    q_type: Optional[str] = Query(None, alias="type", description="题型"),
    difficulty: Optional[str] = Query(None, description="难度"),
    subject: Optional[str] = Query(None, description="科目"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    status: Optional[str] = Query("active", description="状态"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取试题列表（多维度筛选）"""
    _, org_id = ctx
    logger.info("[EXAM] 获取试题列表 | org_id=%s | bank_id=%s | type=%s | difficulty=%s | subject=%s | keyword=%s | skip=%d | limit=%d",
                org_id, bank_id, q_type, difficulty, subject, keyword, skip, limit)

    query = db.query(Question).filter(Question.org_id == org_id)
    if bank_id:
        query = query.filter(Question.bank_id == bank_id)
    if q_type:
        query = query.filter(Question.type == q_type)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if subject:
        query = query.filter(Question.subject == subject)
    if status:
        status_val = _QUESTION_STATUS_MAP.get(status, status)
        query = query.filter(Question.status == status_val)
    if keyword:
        query = query.filter(Question.content.ilike(f"%{keyword}%"))

    total = query.count()
    questions = query.order_by(Question.create_time.desc()).offset(skip).limit(limit).all()

    logger.info("[EXAM] 试题列表查询完成 | org_id=%s | total=%d | returned=%d", org_id, total, len(questions))
    return {
        "questions": [q.to_dict() for q in questions],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/questions/{question_id}")
def get_question_detail(
    question_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取试题详情"""
    _, org_id = ctx
    logger.info("[EXAM] 获取试题详情 | org_id=%s | question_id=%s", org_id, question_id)

    question = db.query(Question).filter(
        Question.id == question_id,
        Question.org_id == org_id,
    ).first()
    if not question:
        logger.warning("[EXAM] 试题不存在 | org_id=%s | question_id=%s", org_id, question_id)
        raise HTTPException(status_code=404, detail="试题不存在")

    logger.info("[EXAM] 试题详情获取成功 | question_id=%s | type=%s | subject=%s",
                question_id, question.type.value if isinstance(question.type, QuestionType) else question.type, question.subject)
    return {"question": question.to_dict()}


@router.post("/questions")
def create_question(
    type: str,
    content: str,
    difficulty: str = "medium",
    subject: Optional[str] = None,
    options: Optional[dict] = None,
    answer: Optional[str] = None,
    answer_analysis: Optional[str] = None,
    score: float = 5.0,
    tags: Optional[list] = None,
    bank_id: Optional[int] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建试题（手动添加本地试题）"""
    _, org_id = ctx
    logger.info("[EXAM] 创建试题 | org_id=%s | type=%s | difficulty=%s | subject=%s | bank_id=%s",
                org_id, type, difficulty, subject, bank_id)

    # 如果没有指定题库，自动创建或使用默认题库
    if not bank_id:
        default_bank = db.query(QuestionBank).filter(
            QuestionBank.org_id == org_id,
            QuestionBank.source == QuestionBankSource.LOCAL,
        ).first()
        if not default_bank:
            logger.info("[EXAM] 自动创建默认本地题库 | org_id=%s", org_id)
            default_bank = QuestionBank(
                org_id=org_id,
                name="本地题库",
                source=QuestionBankSource.LOCAL,
                subject=subject,
            )
            db.add(default_bank)
            db.flush()
        bank_id = default_bank.id
        logger.info("[EXAM] 使用默认题库 | bank_id=%s", bank_id)

    question = Question(
        bank_id=bank_id,
        org_id=org_id,
        type=type,
        difficulty=difficulty,
        subject=subject,
        content=content,
        options=options,
        answer=answer,
        answer_analysis=answer_analysis,
        score=score,
        tags=tags,
        status=QuestionStatus.ACTIVE,
    )
    db.add(question)

    # 更新题库题目计数
    bank = db.query(QuestionBank).filter(QuestionBank.id == bank_id).first()
    if bank:
        bank.question_count = (bank.question_count or 0) + 1

    db.commit()
    db.refresh(question)

    logger.info("[EXAM] 试题创建成功 | question_id=%s | org_id=%s | bank_id=%s | type=%s",
                question.id, org_id, bank_id, type)
    return {"question": question.to_dict()}


@router.put("/questions/{question_id}")
def update_question(
    question_id: int,
    content: Optional[str] = None,
    difficulty: Optional[str] = None,
    options: Optional[dict] = None,
    answer: Optional[str] = None,
    answer_analysis: Optional[str] = None,
    score: Optional[float] = None,
    tags: Optional[list] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新试题"""
    _, org_id = ctx
    logger.info("[EXAM] 更新试题 | org_id=%s | question_id=%s | status=%s", org_id, question_id, status)

    question = db.query(Question).filter(
        Question.id == question_id,
        Question.org_id == org_id,
    ).first()
    if not question:
        logger.warning("[EXAM] 更新失败：试题不存在 | org_id=%s | question_id=%s", org_id, question_id)
        raise HTTPException(status_code=404, detail="试题不存在")

    changed_fields = []
    if content is not None:
        question.content = content
        changed_fields.append("content")
    if difficulty is not None:
        question.difficulty = difficulty
        changed_fields.append("difficulty")
    if options is not None:
        question.options = options
        changed_fields.append("options")
    if answer is not None:
        question.answer = answer
        changed_fields.append("answer")
    if answer_analysis is not None:
        question.answer_analysis = answer_analysis
        changed_fields.append("answer_analysis")
    if score is not None:
        question.score = score
        changed_fields.append("score")
    if tags is not None:
        question.tags = tags
        changed_fields.append("tags")
    if status is not None:
        question.status = status
        changed_fields.append("status")

    db.commit()
    db.refresh(question)

    logger.info("[EXAM] 试题更新成功 | question_id=%s | changed_fields=%s", question_id, changed_fields)
    return {"question": question.to_dict()}


@router.post("/questions/sync")
def sync_external_questions(
    bank_id: Optional[int] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """
    同步外部题库试题（Mock 实现）
    实际生产环境应调用 https://opensciedu.matux.tech/ API
    """
    _, org_id = ctx
    logger.info("[EXAM] 开始同步外部题库 | org_id=%s | bank_id=%s | subject=%s",
                org_id, bank_id, subject)

    # 获取或创建外部题库
    if bank_id:
        bank = db.query(QuestionBank).filter(
            QuestionBank.id == bank_id,
            QuestionBank.org_id == org_id,
        ).first()
        if bank:
            logger.info("[EXAM] 使用指定外部题库 | bank_id=%s | name='%s'", bank.id, bank.name)
    else:
        bank = db.query(QuestionBank).filter(
            QuestionBank.org_id == org_id,
            QuestionBank.source == QuestionBankSource.EXTERNAL,
        ).first()
        if not bank:
            logger.info("[EXAM] 自动创建外部题库 | org_id=%s", org_id)
            bank = QuestionBank(
                org_id=org_id,
                name="OpenSciEd 外部题库",
                source=QuestionBankSource.EXTERNAL,
                source_url="https://opensciedu.matux.tech/",
                subject=subject,
            )
            db.add(bank)
            db.flush()

    if not bank:
        logger.error("[EXAM] 同步失败：题库不存在 | org_id=%s | bank_id=%s", org_id, bank_id)
        raise HTTPException(status_code=404, detail="题库不存在")

    # Mock 同步数据（生产环境替换为实际 API 调用）
    mock_questions = [
        {
            "type": "single_choice",
            "difficulty": "easy",
            "subject": subject or "机器人1级",
            "content": "以下哪个传感器用于检测距离？",
            "options": [
                {"label": "A", "content": "温度传感器"},
                {"label": "B", "content": "超声波传感器"},
                {"label": "C", "content": "光敏传感器"},
                {"label": "D", "content": "湿度传感器"},
            ],
            "answer": "B",
            "answer_analysis": "超声波传感器通过发射超声波并接收回波来测量距离。",
            "score": 5.0,
            "tags": ["传感器", "机器人基础"],
        },
        {
            "type": "single_choice",
            "difficulty": "medium",
            "subject": subject or "机器人1级",
            "content": "机器人编程中，循环结构的作用是？",
            "options": [
                {"label": "A", "content": "执行一次特定操作"},
                {"label": "B", "content": "重复执行一段代码"},
                {"label": "C", "content": "定义变量类型"},
                {"label": "D", "content": "结束程序运行"},
            ],
            "answer": "B",
            "answer_analysis": "循环结构用于重复执行一段代码，直到满足特定条件。",
            "score": 5.0,
            "tags": ["编程基础", "循环"],
        },
        {
            "type": "true_false",
            "difficulty": "easy",
            "subject": subject or "机器人1级",
            "content": "机器人只能由程序控制，不能手动操作。",
            "answer": "false",
            "answer_analysis": "机器人可以通过手动遥控和程序控制两种方式操作。",
            "score": 3.0,
            "tags": ["机器人基础"],
        },
        {
            "type": "fill_blank",
            "difficulty": "medium",
            "subject": subject or "机器人1级",
            "content": "在 Arduino 编程中，`_____` 函数用于初始化设置，只在程序开始时执行一次。",
            "answer": "setup",
            "answer_analysis": "setup() 函数在 Arduino 程序启动时执行一次，用于初始化引脚模式和串口通信等。",
            "score": 3.0,
            "tags": ["Arduino", "编程基础"],
        },
        {
            "type": "single_choice",
            "difficulty": "hard",
            "subject": subject or "机器人1级",
            "content": "以下哪种电机最适合需要精确位置控制的机器人关节？",
            "options": [
                {"label": "A", "content": "直流电机"},
                {"label": "B", "content": "步进电机"},
                {"label": "C", "content": "舵机"},
                {"label": "D", "content": "无刷电机"},
            ],
            "answer": "C",
            "answer_analysis": "舵机（Servo Motor）可以通过 PWM 信号精确控制旋转角度，最适合机器人关节的精确位置控制。",
            "score": 5.0,
            "tags": ["硬件", "电机"],
        },
    ]

    synced_count = 0
    skipped_count = 0
    for q_data in mock_questions:
        existing = db.query(Question).filter(
            Question.org_id == org_id,
            Question.bank_id == bank.id,
            Question.content == q_data["content"],
        ).first()
        if not existing:
            question = Question(
                bank_id=bank.id,
                org_id=org_id,
                external_id=None,
                type=q_data["type"],
                difficulty=q_data["difficulty"],
                subject=q_data["subject"],
                content=q_data["content"],
                options=q_data.get("options"),
                answer=q_data["answer"],
                answer_analysis=q_data.get("answer_analysis"),
                score=q_data.get("score", 5.0),
                tags=q_data.get("tags"),
                status=QuestionStatus.ACTIVE,
            )
            db.add(question)
            synced_count += 1
        else:
            skipped_count += 1

    bank.question_count = db.query(Question).filter(
        Question.bank_id == bank.id,
        Question.status == QuestionStatus.ACTIVE,
    ).count()
    bank.last_sync_at = datetime.utcnow()

    db.commit()

    logger.info("[EXAM] 外部题库同步完成 | org_id=%s | bank_id=%s | synced=%d | skipped=%d | total_questions=%d",
                org_id, bank.id, synced_count, skipped_count, bank.question_count)
    return {
        "message": f"同步完成，新增 {synced_count} 道试题",
        "synced_count": synced_count,
        "bank_id": bank.id,
    }


# ==================== 试卷管理 ====================

@router.get("/papers")
def get_exam_papers(
    status: Optional[str] = Query(None, description="状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取试卷列表"""
    _, org_id = ctx
    logger.info("[EXAM] 获取试卷列表 | org_id=%s | status=%s | skip=%d | limit=%d",
                org_id, status, skip, limit)

    query = db.query(ExamPaper).filter(ExamPaper.org_id == org_id)
    if status:
        status_val = _PAPER_STATUS_MAP.get(status, status)
        query = query.filter(ExamPaper.status == status_val)

    total = query.count()
    papers = query.order_by(ExamPaper.create_time.desc()).offset(skip).limit(limit).all()

    logger.info("[EXAM] 试卷列表查询完成 | org_id=%s | total=%d | returned=%d", org_id, total, len(papers))
    return {
        "papers": [p.to_dict() for p in papers],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/papers")
def create_exam_paper(
    title: str,
    description: Optional[str] = None,
    duration: int = 60,
    total_score: float = 100.0,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建试卷"""
    _, org_id = ctx
    user_id = ctx[0] if ctx else None
    logger.info("[EXAM] 创建试卷 | org_id=%s | title='%s' | duration=%d | total_score=%.1f | created_by=%s",
                org_id, title, duration, total_score, user_id)

    paper = ExamPaper(
        org_id=org_id,
        title=title,
        description=description,
        duration=duration,
        total_score=total_score,
        status=ExamPaperStatus.DRAFT,
        created_by=user_id,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    logger.info("[EXAM] 试卷创建成功 | paper_id=%s | org_id=%s | title='%s' | status=draft",
                paper.id, org_id, title)
    return {"paper": paper.to_dict()}


@router.get("/papers/{paper_id}")
def get_exam_paper_detail(
    paper_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取试卷详情（含题目列表）"""
    _, org_id = ctx
    logger.info("[EXAM] 获取试卷详情 | org_id=%s | paper_id=%s", org_id, paper_id)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")

    paper_questions = (
        db.query(PaperQuestion)
        .filter(PaperQuestion.paper_id == paper_id)
        .order_by(PaperQuestion.order_no)
        .all()
    )

    result = paper.to_dict()
    result["questions"] = [pq.to_dict() for pq in paper_questions]

    logger.info("[EXAM] 试卷详情获取成功 | paper_id=%s | question_count=%d | total_score=%.1f",
                paper_id, len(paper_questions), paper.total_score)
    return {"paper": result}


@router.put("/papers/{paper_id}")
def update_exam_paper(
    paper_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    duration: Optional[int] = None,
    total_score: Optional[float] = None,
    status: Optional[str] = None,
    format_settings: Optional[dict] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新试卷信息"""
    _, org_id = ctx
    logger.info("[EXAM] 更新试卷 | org_id=%s | paper_id=%s | status=%s", org_id, paper_id, status)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 更新失败：试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")

    changed_fields = []
    if title is not None:
        paper.title = title
        changed_fields.append("title")
    if description is not None:
        paper.description = description
        changed_fields.append("description")
    if duration is not None:
        paper.duration = duration
        changed_fields.append("duration")
    if total_score is not None:
        paper.total_score = total_score
        changed_fields.append("total_score")
    if status is not None:
        paper.status = status
        changed_fields.append("status")
    if format_settings is not None:
        paper.format_settings = format_settings
        changed_fields.append("format_settings")

    db.commit()
    db.refresh(paper)

    logger.info("[EXAM] 试卷更新成功 | paper_id=%s | changed_fields=%s", paper_id, changed_fields)
    return {"paper": paper.to_dict()}


@router.delete("/papers/{paper_id}")
def delete_exam_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除试卷"""
    _, org_id = ctx
    logger.info("[EXAM] 删除试卷 | org_id=%s | paper_id=%s", org_id, paper_id)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 删除失败：试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")
    if paper.status == ExamPaperStatus.PUBLISHED:
        logger.warning("[EXAM] 删除失败：试卷已发布 | paper_id=%s | status=%s", paper_id, paper.status.value)
        raise HTTPException(status_code=400, detail="已发布试卷需先归档再删除")

    db.delete(paper)
    db.commit()

    logger.info("[EXAM] 试卷删除成功 | paper_id=%s | org_id=%s | title='%s'", paper_id, org_id, paper.title)
    return {"message": "试卷已删除"}


# ==================== 试卷-试题关联 ====================

@router.post("/papers/{paper_id}/questions")
def add_question_to_paper(
    paper_id: int,
    question_id: int,
    order_no: Optional[int] = None,
    score: float = 5.0,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """向试卷添加试题"""
    _, org_id = ctx
    logger.info("[EXAM] 向试卷添加试题 | org_id=%s | paper_id=%s | question_id=%s | score=%.1f | section=%s",
                org_id, paper_id, question_id, score, section)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 添加失败：试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")

    question = db.query(Question).filter(
        Question.id == question_id,
        Question.org_id == org_id,
    ).first()
    if not question:
        logger.warning("[EXAM] 添加失败：试题不存在 | org_id=%s | question_id=%s", org_id, question_id)
        raise HTTPException(status_code=404, detail="试题不存在")

    if order_no is None:
        max_order = db.query(func.max(PaperQuestion.order_no)).filter(
            PaperQuestion.paper_id == paper_id
        ).scalar() or 0
        order_no = max_order + 1

    pq = PaperQuestion(
        paper_id=paper_id,
        question_id=question_id,
        order_no=order_no,
        score=score,
        section=section,
    )
    db.add(pq)
    paper.total_score = (paper.total_score or 0) + score
    db.commit()
    db.refresh(pq)

    logger.info("[EXAM] 试题添加成功 | pq_id=%s | paper_id=%s | question_id=%s | order_no=%d | paper_total=%.1f",
                pq.id, paper_id, question_id, order_no, paper.total_score)
    return {"paper_question": pq.to_dict()}


@router.delete("/papers/{paper_id}/questions/{pq_id}")
def remove_question_from_paper(
    paper_id: int,
    pq_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """从试卷移除试题"""
    _, org_id = ctx
    logger.info("[EXAM] 从试卷移除试题 | org_id=%s | paper_id=%s | pq_id=%s", org_id, paper_id, pq_id)

    pq = db.query(PaperQuestion).filter(
        PaperQuestion.id == pq_id,
        PaperQuestion.paper_id == paper_id,
    ).first()
    if not pq:
        logger.warning("[EXAM] 移除失败：关联不存在 | paper_id=%s | pq_id=%s", paper_id, pq_id)
        raise HTTPException(status_code=404, detail="关联不存在")

    paper = db.query(ExamPaper).filter(ExamPaper.id == paper_id).first()
    if paper:
        paper.total_score = (paper.total_score or 0) - (pq.score or 0)

    db.delete(pq)
    db.commit()

    logger.info("[EXAM] 试题移除成功 | pq_id=%s | paper_id=%s | question_id=%s | paper_total=%.1f",
                pq_id, paper_id, pq.question_id, paper.total_score if paper else 0)
    return {"message": "试题已从试卷中移除"}


@router.post("/papers/{paper_id}/random-select")
def random_select_questions(
    paper_id: int,
    q_type: str = "single_choice",
    count: int = 10,
    difficulty: Optional[str] = None,
    subject: Optional[str] = None,
    section: Optional[str] = None,
    score: float = 5.0,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """随机抽取试题添加到试卷"""
    _, org_id = ctx
    logger.info("[EXAM] 随机抽取试题 | org_id=%s | paper_id=%s | type=%s | count=%d | difficulty=%s | subject=%s",
                org_id, paper_id, q_type, count, difficulty, subject)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 随机抽取失败：试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")

    # 获取已添加的试题ID
    existing_ids = [
        pq[0] for pq in db.query(PaperQuestion.question_id).filter(
            PaperQuestion.paper_id == paper_id
        ).all()
    ]

    # 随机筛选试题
    query = db.query(Question).filter(
        Question.org_id == org_id,
        Question.type == q_type,
        Question.status == QuestionStatus.ACTIVE,
        ~Question.id.in_(existing_ids) if existing_ids else True,
    )
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if subject:
        query = query.filter(Question.subject == subject)

    candidates = query.all()
    logger.info("[EXAM] 随机抽取候选池 | org_id=%s | candidates=%d | requested=%d | existing_ids=%s",
                org_id, len(candidates), count, existing_ids)

    if len(candidates) < count:
        logger.warning("[EXAM] 随机抽取不足：候选池不够 | candidates=%d | requested=%d | 将使用全部候选",
                       len(candidates), count)
        count = len(candidates)

    selected = random.sample(candidates, count) if count > 0 else []

    max_order = db.query(func.max(PaperQuestion.order_no)).filter(
        PaperQuestion.paper_id == paper_id
    ).scalar() or 0

    added = 0
    for i, question in enumerate(selected):
        pq = PaperQuestion(
            paper_id=paper_id,
            question_id=question.id,
            order_no=max_order + i + 1,
            score=score,
            section=section,
        )
        db.add(pq)
        paper.total_score = (paper.total_score or 0) + score
        added += 1

    db.commit()

    logger.info("[EXAM] 随机抽取完成 | paper_id=%s | added=%d | candidates=%d | paper_total=%.1f",
                paper_id, added, len(candidates), paper.total_score)
    return {
        "message": f"随机抽取并添加了 {added} 道试题",
        "added_count": added,
    }


@router.put("/papers/{paper_id}/reorder")
def reorder_paper_questions(
    paper_id: int,
    question_ids: List[int],
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """重新排序试卷题目"""
    _, org_id = ctx
    logger.info("[EXAM] 重新排序试卷题目 | org_id=%s | paper_id=%s | question_count=%d",
                org_id, paper_id, len(question_ids))

    for i, qid in enumerate(question_ids):
        pq = db.query(PaperQuestion).filter(
            PaperQuestion.paper_id == paper_id,
            PaperQuestion.question_id == qid,
        ).first()
        if pq:
            pq.order_no = i + 1
    db.commit()

    logger.info("[EXAM] 排序更新完成 | paper_id=%s | reordered=%d", paper_id, len(question_ids))
    return {"message": "排序已更新"}


# ==================== 考试任务管理 ====================

@router.get("/tasks")
def get_exam_tasks(
    status: Optional[str] = Query(None, description="状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试任务列表"""
    _, org_id = ctx
    logger.info("[EXAM] 获取考试任务列表 | org_id=%s | status=%s | skip=%d | limit=%d",
                org_id, status, skip, limit)

    query = db.query(ExamTask).filter(ExamTask.org_id == org_id)
    if status:
        status_val = _TASK_STATUS_MAP.get(status, status)
        query = query.filter(ExamTask.status == status_val)

    total = query.count()
    tasks = query.order_by(ExamTask.create_time.desc()).offset(skip).limit(limit).all()

    logger.info("[EXAM] 考试任务列表查询完成 | org_id=%s | total=%d | returned=%d", org_id, total, len(tasks))
    return {
        "tasks": [t.to_dict() for t in tasks],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/tasks")
def create_exam_task(
    title: str,
    paper_id: int,
    start_time: str,
    end_time: str,
    duration: int = 60,
    mode: str = "online",
    student_ids: Optional[List[int]] = None,
    class_ids: Optional[List[int]] = None,
    submit_type: str = "online",
    auto_grade: bool = True,
    allow_late: bool = True,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建考试任务"""
    _, org_id = ctx
    user_id = ctx[0] if ctx else None
    logger.info("[EXAM] 创建考试任务 | org_id=%s | title='%s' | paper_id=%s | mode=%s | start=%s | end=%s | duration=%d | auto_grade=%s",
                org_id, title, paper_id, mode, start_time, end_time, duration, auto_grade)

    paper = db.query(ExamPaper).filter(
        ExamPaper.id == paper_id,
        ExamPaper.org_id == org_id,
    ).first()
    if not paper:
        logger.warning("[EXAM] 创建失败：试卷不存在 | org_id=%s | paper_id=%s", org_id, paper_id)
        raise HTTPException(status_code=404, detail="试卷不存在")

    try:
        parsed_start = datetime.fromisoformat(start_time)
        parsed_end = datetime.fromisoformat(end_time)
    except ValueError as e:
        logger.error("[EXAM] 创建失败：时间格式错误 | start=%s | end=%s | error=%s", start_time, end_time, str(e))
        raise HTTPException(status_code=400, detail=f"时间格式错误: {str(e)}")

    task = ExamTask(
        org_id=org_id,
        paper_id=paper_id,
        title=title,
        mode=mode,
        start_time=parsed_start,
        end_time=parsed_end,
        duration=duration,
        student_ids=student_ids or [],
        class_ids=class_ids or [],
        submit_type=submit_type,
        auto_grade=auto_grade,
        allow_late=allow_late,
        status=ExamTaskStatus.PENDING,
        created_by=user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    logger.info("[EXAM] 考试任务创建成功 | task_id=%s | org_id=%s | title='%s' | paper_id=%s | student_count=%d | class_count=%d",
                task.id, org_id, title, paper_id, len(task.student_ids or []), len(task.class_ids or []))
    return {"task": task.to_dict()}


@router.get("/tasks/{task_id}")
def get_exam_task_detail(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试任务详情"""
    _, org_id = ctx
    logger.info("[EXAM] 获取考试任务详情 | org_id=%s | task_id=%s", org_id, task_id)

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 考试任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")

    logger.info("[EXAM] 考试任务详情获取成功 | task_id=%s | status=%s | paper_id=%s",
                task_id, task.status.value, task.paper_id)
    return {"task": task.to_dict()}


@router.put("/tasks/{task_id}/publish")
def publish_exam_task(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """发布考试任务"""
    _, org_id = ctx
    logger.info("[EXAM] 发布考试任务 | org_id=%s | task_id=%s", org_id, task_id)

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 发布失败：考试任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")

    old_status = task.status.value if isinstance(task.status, ExamTaskStatus) else task.status
    task.status = ExamTaskStatus.PENDING
    db.commit()

    logger.info("[EXAM] 考试任务已发布 | task_id=%s | old_status=%s -> pending | title='%s'",
                task_id, old_status, task.title)
    return {"message": "考试任务已发布", "task": task.to_dict()}


@router.put("/tasks/{task_id}/cancel")
def cancel_exam_task(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """取消考试任务"""
    _, org_id = ctx
    logger.info("[EXAM] 取消考试任务 | org_id=%s | task_id=%s", org_id, task_id)

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 取消失败：考试任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")
    if task.status != ExamTaskStatus.PENDING:
        logger.warning("[EXAM] 取消失败：非待开始状态 | task_id=%s | status=%s",
                       task_id, task.status.value if isinstance(task.status, ExamTaskStatus) else task.status)
        raise HTTPException(status_code=400, detail="仅待开始状态的考试可取消")

    db.delete(task)
    db.commit()

    logger.info("[EXAM] 考试任务已取消 | task_id=%s | org_id=%s | title='%s'", task_id, org_id, task.title)
    return {"message": "考试任务已取消"}


# ==================== 学生考试 ====================

@router.get("/tasks/{task_id}/start")
def start_exam(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学生开始考试（获取试卷内容）"""
    user_id, org_id = ctx
    logger.info("[EXAM] 学生开始考试 | org_id=%s | user_id=%s | task_id=%s", org_id, user_id, task_id)

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 开始考试失败：任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")

    now = datetime.utcnow()
    if now < task.start_time and not task.allow_late:
        logger.warning("[EXAM] 开始考试失败：考试尚未开始 | task_id=%s | start=%s | now=%s",
                       task_id, task.start_time.isoformat(), now.isoformat())
        raise HTTPException(status_code=400, detail="考试尚未开始")
    if now > task.end_time:
        logger.warning("[EXAM] 开始考试失败：考试已结束 | task_id=%s | end=%s | now=%s",
                       task_id, task.end_time.isoformat(), now.isoformat())
        raise HTTPException(status_code=400, detail="考试已结束")

    # 检查或创建考试结果
    result = db.query(ExamResult).filter(
        ExamResult.exam_id == task_id,
        ExamResult.student_id == user_id,
    ).first()

    if not result:
        result = ExamResult(
            exam_id=task_id,
            student_id=user_id,
            org_id=org_id,
            status=ExamResultStatus.IN_PROGRESS,
            start_time=now,
        )
        db.add(result)
        db.flush()
        logger.info("[EXAM] 创建考试记录 | result_id=%s | task_id=%s | student_id=%s", result.id, task_id, user_id)
    elif result.status == ExamResultStatus.SUBMITTED:
        logger.warning("[EXAM] 开始考试失败：已提交 | result_id=%s | task_id=%s | student_id=%s",
                       result.id, task_id, user_id)
        raise HTTPException(status_code=400, detail="您已提交本次考试")

    # 获取试卷题目（不包含答案）
    paper_questions = (
        db.query(PaperQuestion)
        .filter(PaperQuestion.paper_id == task.paper_id)
        .order_by(PaperQuestion.order_no)
        .all()
    )

    questions_data = []
    for pq in paper_questions:
        q = pq.question
        q_dict = {
            "pq_id": pq.id,
            "order_no": pq.order_no,
            "score": pq.score,
            "section": pq.section,
            "question_id": q.id,
            "type": q.type.value if isinstance(q.type, QuestionType) else q.type,
            "content": q.content,
            "options": q.options,
        }
        questions_data.append(q_dict)

    logger.info("[EXAM] 考试开始成功 | result_id=%s | task_id=%s | student_id=%s | question_count=%d",
                result.id, task_id, user_id, len(questions_data))
    return {
        "result_id": result.id,
        "task": task.to_dict(),
        "questions": questions_data,
        "started_at": result.start_time.isoformat() if result.start_time else None,
    }


@router.post("/tasks/{task_id}/submit")
def submit_exam(
    task_id: int,
    answers: dict,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """学生提交考试答案"""
    user_id, org_id = ctx
    logger.info("[EXAM] 学生提交考试 | org_id=%s | user_id=%s | task_id=%s | answer_count=%d",
                org_id, user_id, task_id, len(answers))

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 提交失败：考试任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")

    result = db.query(ExamResult).filter(
        ExamResult.exam_id == task_id,
        ExamResult.student_id == user_id,
    ).first()
    if not result:
        logger.warning("[EXAM] 提交失败：考试记录不存在 | org_id=%s | task_id=%s | student_id=%s",
                       org_id, task_id, user_id)
        raise HTTPException(status_code=404, detail="考试记录不存在")
    if result.status == ExamResultStatus.SUBMITTED or result.status == ExamResultStatus.GRADED:
        logger.warning("[EXAM] 提交失败：重复提交 | result_id=%s | status=%s",
                       result.id, result.status.value)
        raise HTTPException(status_code=400, detail="您已提交本次考试")

    now = datetime.utcnow()
    result.answers = answers
    result.submit_time = now
    result.status = ExamResultStatus.SUBMITTED

    # 自动批改客观题
    if task.auto_grade:
        objective_score = 0.0
        graded_count = 0
        for pq_id_str, student_answer in answers.items():
            try:
                pq_id = int(pq_id_str)
            except ValueError:
                logger.warning("[EXAM] 自动批改：跳过无效 pq_id | pq_id_str=%s", pq_id_str)
                continue

            pq = db.query(PaperQuestion).filter(PaperQuestion.id == pq_id).first()
            if pq and pq.question:
                q = pq.question
                if q.type.value in ("single_choice", "true_false"):
                    if student_answer and student_answer.upper() == q.answer.upper():
                        objective_score += pq.score or 0
                        graded_count += 1
                elif q.type.value == "multi_choice":
                    correct = set(q.answer.upper().split(",")) if q.answer else set()
                    student = set(student_answer.upper().split(",")) if student_answer else set()
                    if correct == student:
                        objective_score += pq.score or 0
                        graded_count += 1

        result.objective_score = objective_score
        result.score = objective_score  # 主观题需手动批改后更新
        logger.info("[EXAM] 自动批改完成 | result_id=%s | objective_score=%.1f | auto_graded=%d",
                    result.id, objective_score, graded_count)

    db.commit()

    logger.info("[EXAM] 考试提交成功 | result_id=%s | task_id=%s | student_id=%s | score=%.1f | submit_time=%s",
                result.id, task_id, user_id, result.score or 0, now.isoformat())
    return {
        "message": "提交成功",
        "result": result.to_dict(),
    }


@router.post("/tasks/{task_id}/save-progress")
def save_exam_progress(
    task_id: int,
    answers: dict,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """保存答题进度（自动保存）"""
    user_id, org_id = ctx
    logger.info("[EXAM] 保存答题进度 | org_id=%s | user_id=%s | task_id=%s | answer_count=%d",
                org_id, user_id, task_id, len(answers))

    result = db.query(ExamResult).filter(
        ExamResult.exam_id == task_id,
        ExamResult.student_id == user_id,
    ).first()
    if not result:
        logger.warning("[EXAM] 保存失败：考试记录不存在 | org_id=%s | task_id=%s | student_id=%s",
                       org_id, task_id, user_id)
        raise HTTPException(status_code=404, detail="考试记录不存在")
    if result.status == ExamResultStatus.SUBMITTED or result.status == ExamResultStatus.GRADED:
        logger.warning("[EXAM] 保存失败：考试已提交 | result_id=%s | status=%s",
                       result.id, result.status.value)
        raise HTTPException(status_code=400, detail="考试已提交")

    result.answers = answers
    db.commit()

    logger.info("[EXAM] 答题进度保存成功 | result_id=%s | task_id=%s | student_id=%s", result.id, task_id, user_id)
    return {"message": "进度已保存"}


# ==================== 阅卷与成绩 ====================

@router.get("/tasks/{task_id}/results")
def get_exam_results(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试结果列表（教师端）"""
    _, org_id = ctx
    logger.info("[EXAM] 获取考试结果列表 | org_id=%s | task_id=%s", org_id, task_id)

    results = db.query(ExamResult).filter(
        ExamResult.exam_id == task_id,
        ExamResult.org_id == org_id,
    ).all()

    logger.info("[EXAM] 考试结果列表查询完成 | task_id=%s | count=%d", task_id, len(results))
    return {"results": [r.to_dict() for r in results]}


@router.get("/results/{result_id}")
def get_exam_result_detail(
    result_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试结果详情（含答案对比）"""
    user_id, org_id = ctx
    logger.info("[EXAM] 获取考试结果详情 | org_id=%s | user_id=%s | result_id=%s", org_id, user_id, result_id)

    result = db.query(ExamResult).filter(
        ExamResult.id == result_id,
        ExamResult.org_id == org_id,
    ).first()
    if not result:
        logger.warning("[EXAM] 考试结果不存在 | org_id=%s | result_id=%s", org_id, result_id)
        raise HTTPException(status_code=404, detail="考试结果不存在")

    task = result.exam_task
    detail = result.to_dict()

    # 获取题目与正确答案对比
    paper_questions = (
        db.query(PaperQuestion)
        .filter(PaperQuestion.paper_id == task.paper_id)
        .order_by(PaperQuestion.order_no)
        .all()
    )

    questions_detail = []
    for pq in paper_questions:
        q = pq.question
        student_answer = None
        if result.answers:
            student_answer = result.answers.get(str(pq.id))

        questions_detail.append({
            "pq_id": pq.id,
            "order_no": pq.order_no,
            "score": pq.score,
            "section": pq.section,
            "question_content": q.content,
            "question_type": q.type.value if isinstance(q.type, QuestionType) else q.type,
            "options": q.options,
            "correct_answer": q.answer if user_id != result.student_id else (
                q.answer if result.status == ExamResultStatus.GRADED else None
            ),
            "answer_analysis": q.answer_analysis if result.status == ExamResultStatus.GRADED else None,
            "student_answer": student_answer,
        })

    detail["questions_detail"] = questions_detail

    logger.info("[EXAM] 考试结果详情获取成功 | result_id=%s | status=%s | score=%.1f | question_count=%d",
                result_id, result.status.value, result.score or 0, len(questions_detail))
    return {"result": detail}


@router.put("/results/{result_id}/grade")
def grade_exam_result(
    result_id: int,
    subjective_score: Optional[float] = None,
    feedback: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """教师批改主观题"""
    user_id, org_id = ctx
    logger.info("[EXAM] 教师批改 | org_id=%s | grader_id=%s | result_id=%s | subjective_score=%s",
                org_id, user_id, result_id, subjective_score)

    result = db.query(ExamResult).filter(
        ExamResult.id == result_id,
        ExamResult.org_id == org_id,
    ).first()
    if not result:
        logger.warning("[EXAM] 批改失败：考试结果不存在 | org_id=%s | result_id=%s", org_id, result_id)
        raise HTTPException(status_code=404, detail="考试结果不存在")

    if subjective_score is not None:
        result.subjective_score = subjective_score
        result.score = (result.objective_score or 0) + subjective_score
    if feedback is not None:
        result.feedback = feedback

    result.status = ExamResultStatus.GRADED
    result.graded_by = user_id
    result.graded_at = datetime.utcnow()

    db.commit()

    logger.info("[EXAM] 批改完成 | result_id=%s | objective=%.1f | subjective=%s | total=%.1f | graded_by=%s",
                result_id, result.objective_score or 0, subjective_score, result.score or 0, user_id)
    return {"message": "批改完成", "result": result.to_dict()}


@router.get("/tasks/{task_id}/stats")
def get_exam_stats(
    task_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取考试成绩统计"""
    _, org_id = ctx
    logger.info("[EXAM] 获取考试成绩统计 | org_id=%s | task_id=%s", org_id, task_id)

    task = db.query(ExamTask).filter(
        ExamTask.id == task_id,
        ExamTask.org_id == org_id,
    ).first()
    if not task:
        logger.warning("[EXAM] 统计失败：考试任务不存在 | org_id=%s | task_id=%s", org_id, task_id)
        raise HTTPException(status_code=404, detail="考试任务不存在")

    results = db.query(ExamResult).filter(
        ExamResult.exam_id == task_id,
    ).all()

    scores = [r.score for r in results if r.score is not None]
    total_students = len(results)
    submitted = len([r for r in results if r.status in (ExamResultStatus.SUBMITTED, ExamResultStatus.GRADED)])
    graded = len([r for r in results if r.status == ExamResultStatus.GRADED])

    stats = {
        "total_students": total_students,
        "submitted_count": submitted,
        "graded_count": graded,
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "max_score": max(scores) if scores else 0,
        "min_score": min(scores) if scores else 0,
        "pass_rate": round(
            len([s for s in scores if s >= task.paper.total_score * 0.6]) / len(scores) * 100, 1
        ) if scores else 0,
        "score_distribution": {
            "90-100": len([s for s in scores if 90 <= s <= 100]),
            "80-89": len([s for s in scores if 80 <= s < 90]),
            "70-79": len([s for s in scores if 70 <= s < 80]),
            "60-69": len([s for s in scores if 60 <= s < 70]),
            "0-59": len([s for s in scores if s < 60]),
        },
    }

    logger.info("[EXAM] 成绩统计完成 | task_id=%s | total_students=%d | submitted=%d | graded=%d | avg=%.2f | pass_rate=%.1f%%",
                task_id, total_students, submitted, graded, stats["average_score"], stats["pass_rate"])
    return {"stats": stats}


# ==================== 学生端：我的考试 ====================

@router.get("/my-exams")
def get_my_exams(
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取学生个人的考试列表"""
    user_id, org_id = ctx
    logger.info("[EXAM] 获取我的考试列表 | org_id=%s | student_id=%s | status=%s", org_id, user_id, status)

    results = db.query(ExamResult).filter(
        ExamResult.student_id == user_id,
        ExamResult.org_id == org_id,
    ).all()

    exam_ids = [r.exam_id for r in results]
    tasks = db.query(ExamTask).filter(
        ExamTask.id.in_(exam_ids),
    ).all() if exam_ids else []

    task_map = {t.id: t for t in tasks}
    result_map = {r.exam_id: r for r in results}

    my_exams = []
    for r in results:
        task = task_map.get(r.exam_id)
        if task:
            item = {
                "task": task.to_dict(),
                "result": r.to_dict(),
            }
            if status:
                if status == "pending" and r.status == ExamResultStatus.PENDING:
                    my_exams.append(item)
                elif status == "in_progress" and r.status == ExamResultStatus.IN_PROGRESS:
                    my_exams.append(item)
                elif status == "completed" and r.status in (ExamResultStatus.SUBMITTED, ExamResultStatus.GRADED):
                    my_exams.append(item)
            else:
                my_exams.append(item)

    logger.info("[EXAM] 我的考试列表查询完成 | student_id=%s | total=%d | filtered=%d",
                user_id, len(results), len(my_exams))
    return {"exams": my_exams}