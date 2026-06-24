"""
教育局 STEM 教育监管平台数据模型
包含：学校评估、设备调配、师资培训、竞赛管理、经费管理、课程资源共享等模块
"""

from __future__ import annotations

from datetime import datetime
import enum

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer,
    String, Text, DECIMAL, Date,
)
from sqlalchemy.orm import relationship

from utils.database import Base


# ==================== 枚举定义 ====================

class SchoolRating(str, enum.Enum):
    """学校评级枚举"""
    EXCELLENT = "优秀"
    GOOD = "良好"
    NEED_IMPROVEMENT = "待提升"
    WEAK = "薄弱"


class EquipmentStatus(str, enum.Enum):
    """设备状态枚举"""
    SUFFICIENT = "充足"
    BASIC = "基本满足"
    SCARCE = "紧缺"
    SEVERE = "严重不足"


class AllocationType(str, enum.Enum):
    """配发类型枚举"""
    NEW = "新配发"
    SUPPLEMENT = "补充配发"
    TRANSFER = "调拨"


class AllocationStatus(str, enum.Enum):
    """配发状态枚举"""
    PENDING = "待审批"
    APPROVED = "已批准"
    DELIVERING = "配送中"
    RECEIVED = "已签收"


class SharingStatus(str, enum.Enum):
    """共享状态枚举"""
    IN_USE = "使用中"
    RETURNED = "已归还"
    OVERDUE = "逾期"


class TrainingType(str, enum.Enum):
    """培训类型枚举"""
    OFFLINE = "线下"
    ONLINE = "线上"


class TrainingSessionStatus(str, enum.Enum):
    """培训场次状态枚举"""
    REGISTERING = "报名中"
    UPCOMING = "即将开课"
    COMPLETED = "已结束"
    CANCELLED = "已取消"


class CompetitionLevel(str, enum.Enum):
    """竞赛级别枚举"""
    NATIONAL = "国家级"
    PROVINCIAL = "省级"
    CITY = "市级"
    COUNTY = "县级"


class AwardLevel(str, enum.Enum):
    """获奖等级枚举"""
    SPECIAL = "特等奖"
    FIRST = "一等奖"
    SECOND = "二等奖"
    THIRD = "三等奖"
    EXCELLENCE = "优秀奖"


class BudgetStatus(str, enum.Enum):
    """预算状态枚举"""
    DRAFT = "编制中"
    ACTIVE = "执行中"
    CLOSED = "已结束"


class ExpenseStatus(str, enum.Enum):
    """支出状态枚举"""
    PENDING = "审批中"
    PAID = "已拨付"
    RETURNED = "已退回"


class ExpenseCategory(str, enum.Enum):
    """支出类别枚举"""
    EQUIPMENT = "设备采购"
    LAB_BUILDING = "实验室建设"
    TRAINING = "师资培训"
    COMPETITION = "竞赛组织"
    CURRICULUM = "课程开发"
    OTHER = "其他"


class CurriculumCategory(str, enum.Enum):
    """课程分类枚举"""
    PROGRAMMING = "编程与计算思维"
    ELECTRONICS = "电子与电路"
    DESIGN_3D = "3D设计与制造"
    ROBOTICS = "机器人与自动化"
    SCIENCE = "科学探究与实验"


class CurriculumStatus(str, enum.Enum):
    """课程资源状态枚举"""
    PENDING = "待审核"
    PUBLISHED = "已发布"
    ARCHIVED = "已下架"


# ==================== 数据模型 ====================

class BureauSchool(Base):
    """教育局管辖学校（聚合自 Organization，存教育局视角的扩展字段）"""
    __tablename__ = "bureau_schools"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True, unique=True)

    # 教育局管理维度字段
    district_area = Column(String(100), default="")          # 所属片区
    stem_student_count = Column(Integer, default=0)          # 参与 STEM 学生数
    stem_teacher_count = Column(Integer, default=0)          # STEM 教师数
    stem_score = Column(Integer, default=0)                  # STEM 教育质量评分
    rating = Column(Enum(SchoolRating), default=SchoolRating.NEED_IMPROVEMENT)
    equipment_status = Column(Enum(EquipmentStatus), default=EquipmentStatus.BASIC)
    description = Column(Text, default="")                   # 学校简介/备注

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    scores = relationship("SchoolSTEMScore", back_populates="school", cascade="all, delete-orphan")
    equipment_requests = relationship("EquipmentRequest", back_populates="school")
    cross_school_shares_from = relationship("CrossSchoolSharing",
                                            foreign_keys="CrossSchoolSharing.from_school_id",
                                            back_populates="from_school")
    cross_school_shares_to = relationship("CrossSchoolSharing",
                                          foreign_keys="CrossSchoolSharing.to_school_id",
                                          back_populates="to_school")
    competition_results = relationship("CompetitionResult", back_populates="school")
    curriculum_resources = relationship("BureauCurriculumResource", back_populates="school")


class SchoolSTEMScore(Base):
    """学校 STEM 教育质量评分记录"""
    __tablename__ = "school_stem_scores"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False, index=True)
    score_date = Column(Date, nullable=False)

    # 各维度评分
    overall_score = Column(Integer, default=0)                # 综合评分
    curriculum_score = Column(Integer, default=0)             # 课程开设分
    equipment_score = Column(Integer, default=0)              # 设备配置分
    teacher_score = Column(Integer, default=0)                # 师资配置分
    competition_score = Column(Integer, default=0)            # 竞赛成果分
    coverage_score = Column(Integer, default=0)               # 覆盖普及分

    evaluation = Column(Text, default="")                     # 综合评语
    evaluator_id = Column(Integer, nullable=True)             # 评估人用户ID

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    school = relationship("BureauSchool", back_populates="scores")


class BureauEquipmentPool(Base):
    """教育局设备品类（配发池中的设备目录）"""
    __tablename__ = "bureau_equipment_pool"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(200), nullable=False)                # 设备名称
    category = Column(String(100), nullable=False)            # 设备分类
    unit = Column(String(20), default="套")                   # 单位（套/台/个）
    unit_price = Column(DECIMAL(10, 2), default=0)            # 单价
    total_quantity = Column(Integer, default=0)               # 总量
    allocated_quantity = Column(Integer, default=0)           # 已配发数量
    in_stock_quantity = Column(Integer, default=0)            # 库存数量
    in_transit_quantity = Column(Integer, default=0)          # 调拨中数量
    min_stock = Column(Integer, default=0)                    # 库存预警下限
    supplier = Column(String(200), default="")                # 供应商

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    allocations = relationship("EquipmentAllocation", back_populates="equipment_item")
    shares = relationship("CrossSchoolSharing", back_populates="equipment_item")
    requests = relationship("EquipmentRequest", back_populates="equipment_item")


class EquipmentRequest(Base):
    """设备配发申请"""
    __tablename__ = "equipment_requests"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False, index=True)
    equipment_item_id = Column(Integer, ForeignKey("bureau_equipment_pool.id"), nullable=False)

    quantity = Column(Integer, nullable=False)
    reason = Column(Text, default="")
    priority = Column(String(20), default="一般")             # 紧急/一般
    status = Column(Enum(AllocationStatus), default=AllocationStatus.PENDING)
    approval_comment = Column(Text, default="")
    approver_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    school = relationship("BureauSchool", back_populates="equipment_requests")
    equipment_item = relationship("BureauEquipmentPool", back_populates="requests")


class EquipmentAllocation(Base):
    """设备配发记录"""
    __tablename__ = "equipment_allocations"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    equipment_item_id = Column(Integer, ForeignKey("bureau_equipment_pool.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False, index=True)
    request_id = Column(Integer, ForeignKey("equipment_requests.id"), nullable=True)

    quantity = Column(Integer, nullable=False)
    allocation_type = Column(Enum(AllocationType), default=AllocationType.NEW)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.PENDING)
    approval_date = Column(DateTime, nullable=True)
    delivery_date = Column(DateTime, nullable=True)
    received_date = Column(DateTime, nullable=True)
    approval_comment = Column(Text, default="")
    operated_by = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    equipment_item = relationship("BureauEquipmentPool", back_populates="allocations")


class CrossSchoolSharing(Base):
    """跨校设备共享记录"""
    __tablename__ = "cross_school_sharings"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    from_school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False)
    to_school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False)
    equipment_item_id = Column(Integer, ForeignKey("bureau_equipment_pool.id"), nullable=False)

    quantity = Column(Integer, nullable=False)
    borrow_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=True)
    actual_return_date = Column(Date, nullable=True)
    reason = Column(Text, default="")
    status = Column(Enum(SharingStatus), default=SharingStatus.IN_USE)
    operated_by = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    equipment_item = relationship("BureauEquipmentPool", back_populates="shares")
    from_school = relationship("BureauSchool", foreign_keys=[from_school_id],
                               back_populates="cross_school_shares_from")
    to_school = relationship("BureauSchool", foreign_keys=[to_school_id],
                             back_populates="cross_school_shares_to")


class TrainingSession(Base):
    """师资培训场次"""
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    title = Column(String(200), nullable=False)               # 培训标题
    trainer = Column(String(100), default="")                 # 讲师
    trainer_org = Column(String(200), default="")             # 讲师单位
    date = Column(Date, nullable=True)                        # 培训日期
    type = Column(Enum(TrainingType), default=TrainingType.OFFLINE)
    location = Column(String(200), default="")                # 培训地点
    max_attendees = Column(Integer, default=0)                # 限额人数
    current_attendees = Column(Integer, default=0)            # 已报名人数
    coverage_area = Column(String(100), default="")           # 覆盖片区
    status = Column(Enum(TrainingSessionStatus), default=TrainingSessionStatus.REGISTERING)
    description = Column(Text, default="")                    # 培训内容描述

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    registrations = relationship("TrainingRegistration", back_populates="session",
                                 cascade="all, delete-orphan")


class TrainingRegistration(Base):
    """培训报名记录"""
    __tablename__ = "training_registrations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False)
    teacher_name = Column(String(100), nullable=False)        # 参训教师姓名
    teacher_phone = Column(String(20), default="")
    is_attended = Column(Boolean, default=False)              # 是否出勤
    score = Column(Integer, nullable=True)                    # 考核成绩
    certificate_issued = Column(Boolean, default=False)       # 是否发放证书

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    session = relationship("TrainingSession", back_populates="registrations")


class BureauCompetition(Base):
    """竞赛信息（教育局视角的竞赛管理）"""
    __tablename__ = "bureau_competitions"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(200), nullable=False)                # 竞赛名称
    level = Column(Enum(CompetitionLevel, name="bureau_competition_level"), default=CompetitionLevel.COUNTY)
    organizer = Column(String(200), default="")               # 主办方
    competition_date = Column(Date, nullable=True)
    registration_deadline = Column(Date, nullable=True)
    location = Column(String(200), default="")
    status = Column(String(20), default="报名中")              # 报名中/备赛中/已结束
    description = Column(Text, default="")
    total_budget = Column(DECIMAL(10, 2), default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    results = relationship("CompetitionResult", back_populates="competition",
                           cascade="all, delete-orphan")


class CompetitionResult(Base):
    """竞赛获奖结果"""
    __tablename__ = "competition_results"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("bureau_competitions.id"), nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False, index=True)

    award_name = Column(String(200), default="")              # 获奖名称/赛项
    award_level = Column(Enum(AwardLevel), default=AwardLevel.THIRD)
    award_type = Column(String(20), default="团体")           # 团体/个人
    student_name = Column(String(100), default="")            # 获奖学生（个人奖）
    teacher_name = Column(String(100), default="")            # 指导老师
    certificate_url = Column(String(500), default="")         # 证书扫描件 URL
    award_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    competition = relationship("BureauCompetition", back_populates="results")
    school = relationship("BureauSchool", back_populates="competition_results")


class BudgetPlan(Base):
    """经费预算计划"""
    __tablename__ = "budget_plans"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    fiscal_year = Column(Integer, nullable=False)             # 财年（如 2026）
    total_amount = Column(DECIMAL(12, 2), default=0)          # 总预算金额
    spent_amount = Column(DECIMAL(12, 2), default=0)          # 已支出金额
    status = Column(Enum(BudgetStatus), default=BudgetStatus.ACTIVE)
    description = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    expenses = relationship("BudgetExpense", back_populates="budget_plan",
                            cascade="all, delete-orphan")


class BudgetExpense(Base):
    """经费支出记录"""
    __tablename__ = "budget_expenses"

    id = Column(Integer, primary_key=True, index=True)
    budget_plan_id = Column(Integer, ForeignKey("budget_plans.id"), nullable=False, index=True)

    category = Column(Enum(ExpenseCategory), default=ExpenseCategory.OTHER)
    item_name = Column(String(200), nullable=False)           # 支出项目
    amount = Column(DECIMAL(10, 2), default=0)                # 金额
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=True)
    expense_date = Column(Date, nullable=True)
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    description = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    budget_plan = relationship("BudgetPlan", back_populates="expenses")


class BureauCurriculumResource(Base):
    """课程资源共享"""
    __tablename__ = "bureau_curriculum_resources"

    id = Column(Integer, primary_key=True, index=True)
    bureau_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("bureau_schools.id"), nullable=False)

    title = Column(String(200), nullable=False)               # 资源标题
    category = Column(Enum(CurriculumCategory), default=CurriculumCategory.PROGRAMMING)
    grade_range = Column(String(50), default="")              # 适用年级
    author = Column(String(100), default="")                  # 作者
    file_type = Column(String(20), default="教案")            # 教案/课件/视频/习题/其他
    file_url = Column(String(500), default="")
    description = Column(Text, default="")
    download_count = Column(Integer, default=0)               # 下载次数
    rating = Column(DECIMAL(2, 1), default=0.0)              # 评分（1.0-5.0）
    status = Column(Enum(CurriculumStatus), default=CurriculumStatus.PENDING)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    school = relationship("BureauSchool", back_populates="curriculum_resources")