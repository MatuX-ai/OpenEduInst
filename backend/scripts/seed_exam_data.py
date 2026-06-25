"""
考试管理 Mock 数据种子脚本
为题库获取、试卷排版、线上考试等模块填充演示数据
用法: python scripts/seed_exam_data.py
"""

import sys
import os
import random
from datetime import datetime, timedelta

# 确保 backend 目录在 sys.path 中
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.license import Organization, OrganizationType
from models.base_models import User
from models.student import Student, StudentStatus, Gender
from models.exam import (
    QuestionBank, Question, ExamPaper, PaperQuestion,
    ExamTask, ExamResult,
    QuestionType, QuestionDifficulty, QuestionBankSource, QuestionStatus,
    ExamPaperStatus, ExamMode, ExamTaskStatus, ExamResultStatus, SubmitType,
)
from utils.database import SessionLocal, Base, engine
from utils.auth_utils import hash_password

# ──────────────────── 枚举值映射 ────────────────────

_TYPE_MAP = {
    "single_choice": QuestionType.SINGLE_CHOICE,
    "multi_choice": QuestionType.MULTI_CHOICE,
    "true_false": QuestionType.TRUE_FALSE,
    "fill_blank": QuestionType.FILL_BLANK,
    "short_answer": QuestionType.SHORT_ANSWER,
    "essay": QuestionType.ESSAY,
    "coding": QuestionType.CODING,
}

_DIFFICULTY_MAP = {
    "easy": QuestionDifficulty.EASY,
    "medium": QuestionDifficulty.MEDIUM,
    "hard": QuestionDifficulty.HARD,
}

# ──────────────────── 模拟试题数据 ────────────────────

ROBOT_LEVEL1_QUESTIONS = [
    # 单选题
    {
        "type": "single_choice", "difficulty": "easy", "subject": "机器人1级",
        "content": "以下哪个传感器用于检测距离？",
        "options": [
            {"label": "A", "content": "温度传感器"},
            {"label": "B", "content": "超声波传感器"},
            {"label": "C", "content": "光敏传感器"},
            {"label": "D", "content": "湿度传感器"},
        ],
        "answer": "B",
        "answer_analysis": "超声波传感器通过发射超声波并接收回波来测量距离。",
        "score": 5.0, "tags": ["传感器", "机器人基础"],
    },
    {
        "type": "single_choice", "difficulty": "easy", "subject": "机器人1级",
        "content": "机器人的'大脑'通常指的是什么？",
        "options": [
            {"label": "A", "content": "电机"}, {"label": "B", "content": "传感器"},
            {"label": "C", "content": "控制器/主板"}, {"label": "D", "content": "电池"},
        ],
        "answer": "C",
        "answer_analysis": "控制器（如 Arduino、micro:bit）是机器人的核心，负责接收传感器信号并控制执行器。",
        "score": 5.0, "tags": ["机器人基础", "硬件"],
    },
    {
        "type": "single_choice", "difficulty": "medium", "subject": "机器人1级",
        "content": "机器人编程中，循环结构的作用是？",
        "options": [
            {"label": "A", "content": "执行一次特定操作"},
            {"label": "B", "content": "重复执行一段代码"},
            {"label": "C", "content": "定义变量类型"},
            {"label": "D", "content": "结束程序运行"},
        ],
        "answer": "B",
        "answer_analysis": "循环结构（如 for、while）用于重复执行一段代码，直到满足特定条件。",
        "score": 5.0, "tags": ["编程基础", "循环"],
    },
    {
        "type": "single_choice", "difficulty": "medium", "subject": "机器人1级",
        "content": "以下哪种电机最适合需要精确位置控制的机器人关节？",
        "options": [
            {"label": "A", "content": "直流电机"}, {"label": "B", "content": "步进电机"},
            {"label": "C", "content": "舵机"}, {"label": "D", "content": "无刷电机"},
        ],
        "answer": "C",
        "answer_analysis": "舵机（Servo Motor）可通过 PWM 信号精确控制旋转角度，最适合机器人关节。",
        "score": 5.0, "tags": ["硬件", "电机"],
    },
    {
        "type": "single_choice", "difficulty": "hard", "subject": "机器人1级",
        "content": "PID 控制算法中，哪个参数主要影响系统的响应速度？",
        "options": [
            {"label": "A", "content": "P（比例）"}, {"label": "B", "content": "I（积分）"},
            {"label": "C", "content": "D（微分）"}, {"label": "D", "content": "以上都是"},
        ],
        "answer": "A",
        "answer_analysis": "P（比例）参数决定了系统对误差的即时响应强度，增大 P 可加快响应速度但可能引起振荡。",
        "score": 5.0, "tags": ["算法", "PID"],
    },
    # 判断题
    {
        "type": "true_false", "difficulty": "easy", "subject": "机器人1级",
        "content": "机器人只能由程序控制，不能手动操作。",
        "answer": "false",
        "answer_analysis": "机器人可通过手动遥控和程序控制两种方式操作，如遥控车和编程小车。",
        "score": 3.0, "tags": ["机器人基础"],
    },
    {
        "type": "true_false", "difficulty": "easy", "subject": "机器人1级",
        "content": "红外传感器可以检测障碍物的距离。",
        "answer": "true",
        "answer_analysis": "红外传感器通过发射红外线并检测反射信号来判断前方是否有障碍物及大致距离。",
        "score": 3.0, "tags": ["传感器"],
    },
    {
        "type": "true_false", "difficulty": "medium", "subject": "机器人1级",
        "content": "直流电机可以直接连接到 Arduino 的数字引脚上驱动。",
        "answer": "false",
        "answer_analysis": "直流电机需要较大电流，不可直接连接 Arduino 引脚，需通过电机驱动板（如 L298N）驱动。",
        "score": 3.0, "tags": ["硬件", "Arduino"],
    },
    # 填空题
    {
        "type": "fill_blank", "difficulty": "easy", "subject": "机器人1级",
        "content": "在 Arduino 编程中，`_____` 函数用于初始化设置，只在程序开始时执行一次。",
        "answer": "setup",
        "answer_analysis": "setup() 函数在 Arduino 程序启动时执行一次，用于初始化引脚模式和串口通信等。",
        "score": 3.0, "tags": ["Arduino", "编程基础"],
    },
    {
        "type": "fill_blank", "difficulty": "medium", "subject": "机器人1级",
        "content": "PWM 的全称是 _____，用于控制电机的转速和舵机的角度。",
        "answer": "脉宽调制",
        "answer_analysis": "PWM（Pulse Width Modulation，脉宽调制）通过改变方波的占空比来模拟不同的电压输出。",
        "score": 3.0, "tags": ["硬件", "PWM"],
    },
    # 多选题
    {
        "type": "multi_choice", "difficulty": "medium", "subject": "机器人1级",
        "content": "以下哪些是机器人常用的传感器类型？（多选）",
        "options": [
            {"label": "A", "content": "超声波传感器"}, {"label": "B", "content": "红外传感器"},
            {"label": "C", "content": "温度传感器"}, {"label": "D", "content": "光敏传感器"},
        ],
        "answer": "A,B,C,D",
        "answer_analysis": "以上四种传感器都是机器人常用的传感器，分别用于测距、避障、测温和检测光线。",
        "score": 5.0, "tags": ["传感器"],
    },
    {
        "type": "multi_choice", "difficulty": "hard", "subject": "机器人1级",
        "content": "设计一个巡线机器人时，需要考虑哪些因素？（多选）",
        "options": [
            {"label": "A", "content": "传感器的数量和布局"},
            {"label": "B", "content": "PID 参数的调节"},
            {"label": "C", "content": "电机的速度控制"},
            {"label": "D", "content": "电池的续航能力"},
        ],
        "answer": "A,B,C,D",
        "answer_analysis": "巡线机器人设计需要综合考虑传感器布局、PID 参数、电机控制和电池续航等多个因素。",
        "score": 5.0, "tags": ["综合", "巡线"],
    },
]

SCRATCH_QUESTIONS = [
    {
        "type": "single_choice", "difficulty": "easy", "subject": "Scratch编程",
        "content": "Scratch 中，角色移动通常使用哪个积木块？",
        "options": [
            {"label": "A", "content": "'说你好'积木"}, {"label": "B", "content": "'移动10步'积木"},
            {"label": "C", "content": "'等待1秒'积木"}, {"label": "D", "content": "'播放声音'积木"},
        ],
        "answer": "B",
        "answer_analysis": "'移动10步'积木属于运动类别，用于控制角色在舞台上的移动。",
        "score": 5.0, "tags": ["Scratch", "基础"],
    },
    {
        "type": "single_choice", "difficulty": "easy", "subject": "Scratch编程",
        "content": "如果想让角色重复执行某个动作，应该使用什么结构？",
        "options": [
            {"label": "A", "content": "如果...那么..."}, {"label": "B", "content": "重复执行"},
            {"label": "C", "content": "广播消息"}, {"label": "D", "content": "克隆"},
        ],
        "answer": "B",
        "answer_analysis": "'重复执行'积木属于控制类别，可以让角色不断执行内部的代码块。",
        "score": 5.0, "tags": ["Scratch", "循环"],
    },
    {
        "type": "single_choice", "difficulty": "medium", "subject": "Scratch编程",
        "content": "Scratch 中，'克隆'功能的作用是什么？",
        "options": [
            {"label": "A", "content": "删除角色"}, {"label": "B", "content": "复制角色的副本"},
            {"label": "C", "content": "改变角色颜色"}, {"label": "D", "content": "切换背景"},
        ],
        "answer": "B",
        "answer_analysis": "'克隆'积木可以创建角色的副本，克隆体可以独立执行自己的脚本。",
        "score": 5.0, "tags": ["Scratch", "克隆"],
    },
    {
        "type": "true_false", "difficulty": "easy", "subject": "Scratch编程",
        "content": "Scratch 中的变量只能存储数字。",
        "answer": "false",
        "answer_analysis": "Scratch 变量可以存储数字、字符串等多种类型的数据。",
        "score": 3.0, "tags": ["Scratch", "变量"],
    },
    {
        "type": "fill_blank", "difficulty": "easy", "subject": "Scratch编程",
        "content": "Scratch 中，用于接收键盘输入的积木类别是 `_____`。",
        "answer": "侦测",
        "answer_analysis": "'侦测'类别中包含询问、回答、按键检测等输入相关积木。",
        "score": 3.0, "tags": ["Scratch", "侦测"],
    },
    {
        "type": "multi_choice", "difficulty": "medium", "subject": "Scratch编程",
        "content": "以下哪些是 Scratch 的事件积木？（多选）",
        "options": [
            {"label": "A", "content": "当绿旗被点击"}, {"label": "B", "content": "当角色被点击"},
            {"label": "C", "content": "当接收到广播"}, {"label": "D", "content": "移动10步"},
        ],
        "answer": "A,B,C",
        "answer_analysis": "A、B、C 都是事件积木，'移动10步'属于运动积木。",
        "score": 5.0, "tags": ["Scratch", "事件"],
    },
]

PYTHON_QUESTIONS = [
    {
        "type": "single_choice", "difficulty": "easy", "subject": "Python基础",
        "content": "Python 中，以下哪个是正确的变量命名？",
        "options": [
            {"label": "A", "content": "1_name"}, {"label": "B", "content": "my-name"},
            {"label": "C", "content": "my_name"}, {"label": "D", "content": "class"},
        ],
        "answer": "C",
        "answer_analysis": "Python 变量名不能以数字开头（A），不能包含连字符（B），不能使用关键字（D）。",
        "score": 5.0, "tags": ["Python", "变量"],
    },
    {
        "type": "single_choice", "difficulty": "easy", "subject": "Python基础",
        "content": "以下哪个函数用于输出信息到控制台？",
        "options": [
            {"label": "A", "content": "input()"}, {"label": "B", "content": "print()"},
            {"label": "C", "content": "len()"}, {"label": "D", "content": "type()"},
        ],
        "answer": "B",
        "answer_analysis": "print() 函数用于将内容输出到标准输出（控制台）。",
        "score": 5.0, "tags": ["Python", "基础"],
    },
    {
        "type": "single_choice", "difficulty": "medium", "subject": "Python基础",
        "content": "列表 list = [1, 2, 3, 4, 5]，执行 list[1:3] 的结果是？",
        "options": [
            {"label": "A", "content": "[1, 2]"}, {"label": "B", "content": "[2, 3]"},
            {"label": "C", "content": "[2, 3, 4]"}, {"label": "D", "content": "[1, 2, 3]"},
        ],
        "answer": "B",
        "answer_analysis": "列表切片 [1:3] 从索引 1（包含）到索引 3（不包含），即 [2, 3]。",
        "score": 5.0, "tags": ["Python", "列表"],
    },
    {
        "type": "true_false", "difficulty": "easy", "subject": "Python基础",
        "content": "Python 中，字典（dict）是有序的。",
        "answer": "true",
        "answer_analysis": "从 Python 3.7 开始，字典保持插入顺序，因此是有序的。",
        "score": 3.0, "tags": ["Python", "字典"],
    },
    {
        "type": "fill_blank", "difficulty": "medium", "subject": "Python基础",
        "content": "Python 中，用于遍历列表的循环关键字是 `_____`。",
        "answer": "for",
        "answer_analysis": "for 循环是 Python 中最常用的遍历结构，如 `for item in list:`。",
        "score": 3.0, "tags": ["Python", "循环"],
    },
    {
        "type": "multi_choice", "difficulty": "medium", "subject": "Python基础",
        "content": "以下哪些是 Python 的内置数据类型？（多选）",
        "options": [
            {"label": "A", "content": "int"}, {"label": "B", "content": "str"},
            {"label": "C", "content": "list"}, {"label": "D", "content": "dict"},
        ],
        "answer": "A,B,C,D",
        "answer_analysis": "int、str、list、dict 都是 Python 的内置数据类型，分别表示整数、字符串、列表和字典。",
        "score": 5.0, "tags": ["Python", "数据类型"],
    },
]


# ──────────────────── 试卷排版格式配置 ────────────────────

PAPER_FORMAT_SETTINGS = {
    "A4": {
        "page_size": "A4",
        "orientation": "portrait",
        "margins": {"top": 25, "bottom": 20, "left": 25, "right": 20},
        "font_size": 12,
        "line_spacing": 1.5,
        "question_spacing": 10,
    },
    "A3": {
        "page_size": "A3",
        "orientation": "landscape",
        "margins": {"top": 30, "bottom": 25, "left": 30, "right": 25},
        "font_size": 14,
        "line_spacing": 1.8,
        "question_spacing": 12,
    },
    "B4": {
        "page_size": "B4",
        "orientation": "portrait",
        "margins": {"top": 20, "bottom": 20, "left": 20, "right": 20},
        "font_size": 11,
        "line_spacing": 1.3,
        "question_spacing": 8,
    },
}

PAPER_HEADER_FOOTER = {
    "header": {
        "left": "{{school_name}}",
        "center": "{{paper_title}}",
        "right": "第 {{page}} 页 / 共 {{total_pages}} 页",
    },
    "footer": {
        "left": "班级：__________",
        "center": "姓名：__________",
        "right": "得分：__________",
    },
    "watermark": "CONFIDENTIAL",
    "show_score_table": True,
    "show_seal_area": True,
}


# ──────────────────── 主函数 ────────────────────

def seed_exam_data():
    """主入口：填充考试管理 Mock 数据"""
    db: Session = SessionLocal()

    try:
        # 确保表已创建
        Base.metadata.create_all(bind=engine)

        # 1. 查找现有机构（优先使用培训机构和 K12 学校）
        orgs = db.query(Organization).filter(
            Organization.is_active == True,
            Organization.org_type.in_([
                OrganizationType.TRAINING,
                OrganizationType.K12,
                OrganizationType.VOCATIONAL,
            ])
        ).limit(3).all()

        if not orgs:
            print("[ERROR] 未找到活跃机构，请先运行 seed_demo_data.py")
            return

        print(f"[INFO] 找到 {len(orgs)} 个机构，将为每个机构创建考试数据")

        for org in orgs:
            print(f"\n{'='*60}")
            print(f"[INFO] 正在为机构【{org.name}】(ID={org.id}, type={org.org_type.value}) 创建考试数据")
            print(f"{'='*60}")

            # 2. 创建题库
            banks = _create_question_banks(db, org)
            print(f"  [OK] 题库: {len(banks)} 个")

            # 3. 创建试题
            total_questions = 0
            for bank in banks:
                count = _create_questions_for_bank(db, org, bank)
                total_questions += count
            print(f"  [OK] 试题: {total_questions} 道")

            # 4. 创建试卷
            papers = _create_exam_papers(db, org)
            print(f"  [OK] 试卷: {len(papers)} 份")

            # 5. 为试卷添加试题
            for paper in papers:
                _add_questions_to_paper(db, org, paper)

            # 6. 创建考试任务
            tasks = _create_exam_tasks(db, org, papers)
            print(f"  [OK] 考试任务: {len(tasks)} 个")

            # 7. 创建考试结果（模拟学生答题）
            _create_exam_results(db, org, tasks)

        db.commit()
        print(f"\n{'='*60}")
        print("[DONE] 考试管理 Mock 数据填充完成！")
        print(f"{'='*60}")
        _print_summary(db)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 数据填充失败: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def _create_question_banks(db: Session, org: Organization):
    """创建题库"""
    banks = []

    # 本地题库
    local_bank = db.query(QuestionBank).filter(
        QuestionBank.org_id == org.id,
        QuestionBank.source == QuestionBankSource.LOCAL,
    ).first()
    if not local_bank:
        local_bank = QuestionBank(
            org_id=org.id,
            name="本地题库",
            source=QuestionBankSource.LOCAL,
            subject="综合",
            description="教师手动录入的本地试题库",
        )
        db.add(local_bank)
        db.flush()
    banks.append(local_bank)

    # 外部题库（OpenSciEd）
    external_bank = db.query(QuestionBank).filter(
        QuestionBank.org_id == org.id,
        QuestionBank.source == QuestionBankSource.EXTERNAL,
    ).first()
    if not external_bank:
        external_bank = QuestionBank(
            org_id=org.id,
            name="OpenSciEd 外部题库",
            source=QuestionBankSource.EXTERNAL,
            source_url="https://opensciedu.matux.tech/",
            subject="机器人等级考试",
            description="从 OpenSciEd 平台同步的官方题库，涵盖机器人1级至6级考试内容",
        )
        db.add(external_bank)
        db.flush()
    banks.append(external_bank)

    db.flush()
    return banks


def _create_questions_for_bank(db: Session, org: Organization, bank: QuestionBank):
    """为题库创建试题"""
    count = 0

    # 根据题库类型选择试题数据
    if bank.source == QuestionBankSource.EXTERNAL:
        question_sets = [ROBOT_LEVEL1_QUESTIONS]
    else:
        question_sets = [ROBOT_LEVEL1_QUESTIONS, SCRATCH_QUESTIONS, PYTHON_QUESTIONS]

    for q_set in question_sets:
        for q_data in q_set:
            existing = db.query(Question).filter(
                Question.org_id == org.id,
                Question.bank_id == bank.id,
                Question.content == q_data["content"],
            ).first()
            if existing:
                continue

            question = Question(
                bank_id=bank.id,
                org_id=org.id,
                type=_TYPE_MAP.get(q_data["type"], q_data["type"]),
                difficulty=_DIFFICULTY_MAP.get(q_data["difficulty"], q_data["difficulty"]),
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
            count += 1

    # 更新题库题目计数
    bank.question_count = db.query(func.count(Question.id)).filter(
        Question.bank_id == bank.id,
        Question.status == QuestionStatus.ACTIVE,
    ).scalar() or 0
    bank.last_sync_at = datetime.utcnow()

    db.flush()
    return count


def _create_exam_papers(db: Session, org: Organization):
    """创建试卷"""
    papers = []

    paper_configs = [
        {
            "title": "机器人1级 - 期中测试卷",
            "description": "机器人1级课程期中考试，涵盖传感器、电机、基础编程等知识点。考试时间60分钟，满分100分。",
            "duration": 60, "total_score": 100.0,
            "format_settings": {**PAPER_FORMAT_SETTINGS["A4"], **PAPER_HEADER_FOOTER},
        },
        {
            "title": "机器人1级 - 单元测试（传感器篇）",
            "description": "传感器专题单元测试，重点考察各类传感器原理与应用。",
            "duration": 30, "total_score": 50.0,
            "format_settings": {**PAPER_FORMAT_SETTINGS["A4"], **PAPER_HEADER_FOOTER},
        },
        {
            "title": "Scratch 编程 - 期末考核",
            "description": "Scratch 编程课程期末考核，包含基础概念、积木使用和逻辑思维题。",
            "duration": 45, "total_score": 100.0,
            "format_settings": {**PAPER_FORMAT_SETTINGS["A4"], **PAPER_HEADER_FOOTER},
        },
        {
            "title": "Python 基础 - 综合测试",
            "description": "Python 基础语法综合测试，涵盖变量、列表、循环和函数等核心知识点。",
            "duration": 60, "total_score": 100.0,
            "format_settings": {**PAPER_FORMAT_SETTINGS["A4"], **PAPER_HEADER_FOOTER},
        },
    ]

    for cfg in paper_configs:
        existing = db.query(ExamPaper).filter(
            ExamPaper.org_id == org.id,
            ExamPaper.title == cfg["title"],
        ).first()
        if existing:
            papers.append(existing)
            continue

        paper = ExamPaper(
            org_id=org.id,
            title=cfg["title"],
            description=cfg["description"],
            duration=cfg["duration"],
            total_score=cfg["total_score"],
            status=ExamPaperStatus.PUBLISHED,
            format_settings=cfg["format_settings"],
        )
        db.add(paper)
        db.flush()
        papers.append(paper)

    db.flush()
    return papers


def _add_questions_to_paper(db: Session, org: Organization, paper: ExamPaper):
    """为试卷自动抽取试题"""
    # 检查是否已有试题
    existing_count = db.query(func.count(PaperQuestion.id)).filter(
        PaperQuestion.paper_id == paper.id,
    ).scalar()
    if existing_count > 0:
        print(f"    [SKIP] 试卷 '{paper.title}' 已有 {existing_count} 道试题")
        return

    # 根据试卷标题确定科目
    if "机器人" in paper.title:
        subjects = ["机器人1级"]
    elif "Scratch" in paper.title:
        subjects = ["Scratch编程"]
    elif "Python" in paper.title:
        subjects = ["Python基础"]
    else:
        subjects = ["机器人1级"]

    # 从题库中按科目筛选试题
    questions = db.query(Question).filter(
        Question.org_id == org.id,
        Question.subject.in_(subjects),
        Question.status == QuestionStatus.ACTIVE,
    ).all()

    if not questions:
        print(f"    [WARN] 未找到科目 {subjects} 的试题，跳过")
        return

    # 随机选取 8-15 道题
    target_count = min(len(questions), random.randint(8, 15))
    selected = random.sample(questions, target_count)

    # 计算总分不应超过试卷总分
    total_score = 0
    paper_questions = []
    for i, q in enumerate(selected):
        score = q.score or 5.0
        if total_score + score > paper.total_score:
            continue
        pq = PaperQuestion(
            paper_id=paper.id,
            question_id=q.id,
            order_no=i + 1,
            score=score,
            section=_get_section_for_type(q.type),
        )
        paper_questions.append(pq)
        total_score += score

    db.add_all(paper_questions)
    paper.total_score = total_score

    db.flush()
    print(f"    [OK] 试卷 '{paper.title}' 添加 {len(paper_questions)} 道试题, 总分 {total_score}")


def _get_section_for_type(q_type) -> str:
    """根据题型返回所属版块"""
    type_value = q_type.value if hasattr(q_type, 'value') else str(q_type)
    section_map = {
        "single_choice": "一、单选题",
        "multi_choice": "二、多选题",
        "true_false": "三、判断题",
        "fill_blank": "四、填空题",
        "short_answer": "五、简答题",
        "essay": "六、论述题",
        "coding": "七、编程题",
    }
    return section_map.get(type_value, "其他")


def _create_exam_tasks(db: Session, org: Organization, papers: list):
    """创建考试任务"""
    tasks = []
    now = datetime.utcnow()

    for i, paper in enumerate(papers):
        paper_questions = db.query(func.count(PaperQuestion.id)).filter(
            PaperQuestion.paper_id == paper.id,
        ).scalar()
        if paper_questions == 0:
            continue

        # 第一个任务：即将开始（今天）
        # 第二个任务：正在进行中
        # 第三个任务：已结束
        # 后续任务：已安排在未来
        if i == 0:
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(minutes=paper.duration)
            status = ExamTaskStatus.PENDING
        elif i == 1:
            start_time = now - timedelta(minutes=30)
            end_time = start_time + timedelta(minutes=paper.duration)
            status = ExamTaskStatus.IN_PROGRESS
        elif i == 2:
            start_time = now - timedelta(days=2)
            end_time = start_time + timedelta(minutes=paper.duration)
            status = ExamTaskStatus.ENDED
        else:
            start_time = now + timedelta(days=7)
            end_time = start_time + timedelta(minutes=paper.duration)
            status = ExamTaskStatus.PENDING

        task = ExamTask(
            org_id=org.id,
            paper_id=paper.id,
            title=f"{paper.title} - 线上考试",
            mode=ExamMode.ONLINE,
            start_time=start_time,
            end_time=end_time,
            duration=paper.duration,
            student_ids=[],
            class_ids=[],
            submit_type=SubmitType.ONLINE,
            auto_grade=True,
            allow_late=True,
            status=status,
        )
        db.add(task)
        db.flush()
        tasks.append(task)

        status_cn = {"pending": "待开始", "in_progress": "进行中", "ended": "已结束"}.get(
            status.value, status.value
        )
        print(f"    [OK] 考试任务 '{task.title}' ({status_cn}): {start_time.strftime('%m-%d %H:%M')} - {end_time.strftime('%H:%M')}")

    db.flush()
    return tasks


def _create_exam_results(db: Session, org: Organization, tasks: list):
    """创建考试结果（模拟学生答题）"""
    # 获取或创建测试学生
    students = db.query(Student).filter(
        Student.org_id == org.id,
    ).limit(5).all()

    if not students:
        # 创建模拟学生
        student_names = ["张三", "李四", "王五", "赵六", "陈七"]
        for i, name in enumerate(student_names):
            student = Student(
                org_id=org.id,
                name=name,
                student_number=f"STU{org.id:04d}{i+1:04d}",
                gender=Gender.MALE,
                status=StudentStatus.ACTIVE,
            )
            db.add(student)
        db.flush()
        students = db.query(Student).filter(Student.org_id == org.id).limit(5).all()

    for task in tasks:
        if task.status == ExamTaskStatus.PENDING:
            continue  # 待开始的不生成结果

        for j, student in enumerate(students):
            existing = db.query(ExamResult).filter(
                ExamResult.exam_id == task.id,
                ExamResult.student_id == student.id,
            ).first()
            if existing:
                continue

            # 获取试卷题目
            paper_questions = db.query(PaperQuestion).filter(
                PaperQuestion.paper_id == task.paper_id,
            ).order_by(PaperQuestion.order_no).all()

            # 模拟答题
            answers = {}
            objective_score = 0.0
            for pq in paper_questions:
                q = pq.question
                if not q:
                    continue
                q_type = q.type.value if hasattr(q.type, 'value') else str(q.type)

                if q_type in ("single_choice", "true_false"):
                    # 70% 概率答对
                    if random.random() < 0.7:
                        answers[str(pq.id)] = q.answer
                        objective_score += pq.score or 0
                    else:
                        # 随机选一个错误答案
                        wrong_answers = ["A", "B", "C", "D"]
                        if q.answer in wrong_answers:
                            wrong_answers.remove(q.answer)
                        answers[str(pq.id)] = random.choice(wrong_answers) if wrong_answers else "X"
                elif q_type == "multi_choice":
                    if random.random() < 0.5:
                        answers[str(pq.id)] = q.answer
                        objective_score += pq.score or 0
                    else:
                        answers[str(pq.id)] = "A"
                elif q_type == "fill_blank":
                    if random.random() < 0.6:
                        answers[str(pq.id)] = q.answer
                        objective_score += pq.score or 0
                    else:
                        answers[str(pq.id)] = "（未作答）"

            # 计算主观题分数（模拟）
            subjective_score = round(random.uniform(0, 15), 1) if task.paper_id else 0
            total_score = objective_score + subjective_score

            # 状态：已结束的任务标记为已批改，进行中的标记为已提交
            if task.status == ExamTaskStatus.ENDED:
                result_status = ExamResultStatus.GRADED
            else:
                result_status = ExamResultStatus.SUBMITTED

            result = ExamResult(
                exam_id=task.id,
                student_id=student.id,
                org_id=org.id,
                answers=answers,
                score=total_score,
                objective_score=objective_score,
                subjective_score=subjective_score,
                start_time=task.start_time,
                submit_time=task.end_time - timedelta(minutes=random.randint(1, 10)),
                status=result_status,
                graded_by=None if result_status == ExamResultStatus.SUBMITTED else 1,
                graded_at=datetime.utcnow() if result_status == ExamResultStatus.GRADED else None,
                feedback="答题认真，继续保持！" if total_score >= 60 else "需要加强基础知识学习。",
            )
            db.add(result)

        db.flush()  # 确保 count 查询能读到新数据
        completed_count = db.query(func.count(ExamResult.id)).filter(
            ExamResult.exam_id == task.id,
        ).scalar()
        print(f"    [OK] 考试任务 '{task.title}' 生成 {completed_count} 份学生答卷")


def _print_summary(db: Session):
    """打印数据概览"""
    print(f"\n{'='*60}")
    print("Mock 数据概览")
    print(f"{'='*60}")

    bank_count = db.query(func.count(QuestionBank.id)).scalar()
    question_count = db.query(func.count(Question.id)).scalar()
    paper_count = db.query(func.count(ExamPaper.id)).scalar()
    task_count = db.query(func.count(ExamTask.id)).scalar()
    result_count = db.query(func.count(ExamResult.id)).scalar()

    print(f"  题库:    {bank_count} 个")
    print(f"  试题:    {question_count} 道")
    print(f"  试卷:    {paper_count} 份")
    print(f"  考试任务: {task_count} 个")
    print(f"  考试结果: {result_count} 份")

    # 按题型统计
    print(f"\n  试题类型分布:")
    for q_type in QuestionType:
        count = db.query(func.count(Question.id)).filter(
            Question.type == q_type,
        ).scalar()
        if count > 0:
            print(f"    - {q_type.value}: {count} 道")

    # 按难度统计
    print(f"\n  试题难度分布:")
    for diff in QuestionDifficulty:
        count = db.query(func.count(Question.id)).filter(
            Question.difficulty == diff,
        ).scalar()
        if count > 0:
            print(f"    - {diff.value}: {count} 道")


if __name__ == "__main__":
    seed_exam_data()