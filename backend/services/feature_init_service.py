"""
功能模块初始化服务
系统启动时自动插入预定义的功能模块列表到 feature_modules 表
"""

import logging

from sqlalchemy.orm import Session

from models.feature_flag import FeatureModule, OrgFeatureFlag, FeatureChangeLog

logger = logging.getLogger(__name__)

# 系统所有可配置功能模块定义
DEFAULT_FEATURE_MODULES = [
    # ===== 教务管理 =====
    {
        "feature_key": "student_management",
        "display_name": "学员管理",
        "description": "管理学员信息、学籍档案、学习进度追踪",
        "category": "academic",
        "icon": "people",
        "route_path": "students",
        "sort_order": 1,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "teacher_management",
        "display_name": "教师管理",
        "description": "管理教师信息、资质认证、课时统计",
        "category": "academic",
        "icon": "person",
        "route_path": "teachers",
        "sort_order": 2,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "schedule_management",
        "display_name": "排课管理",
        "description": "课程排期、教室分配、冲突检测",
        "category": "academic",
        "icon": "calendar_month",
        "route_path": "schedule",
        "sort_order": 3,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": ["student_management", "teacher_management"],
    },
    {
        "feature_key": "teaching_resources",
        "display_name": "教学资源",
        "description": "STEM 教程、课件资源库、教案管理",
        "category": "academic",
        "icon": "library_books",
        "route_path": "resources",
        "sort_order": 4,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "knowledge_graph",
        "display_name": "知识图谱",
        "description": "学科知识图谱与智能推荐",
        "category": "academic",
        "icon": "hub",
        "route_path": "knowledge-graph",
        "sort_order": 5,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "topic_studio",
        "display_name": "课题工作室",
        "description": "教研课题管理、跨平台备课协作",
        "category": "academic",
        "icon": "lightbulb",
        "route_path": "topic-studio",
        "sort_order": 6,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 招生营销 =====
    {
        "feature_key": "marketing_center",
        "display_name": "营销中心",
        "description": "营销活动、优惠券、推广渠道管理",
        "category": "marketing",
        "icon": "trending_up",
        "route_path": "marketing",
        "sort_order": 10,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "leads_management",
        "display_name": "招生线索",
        "description": "潜在学员线索跟进、转化率分析",
        "category": "marketing",
        "icon": "person_search",
        "route_path": "leads",
        "sort_order": 11,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 财务资产 =====
    {
        "feature_key": "finance_management",
        "display_name": "财务管理",
        "description": "收入支出记录、财务报表、对账管理",
        "category": "finance",
        "icon": "payments",
        "route_path": "finance",
        "sort_order": 15,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "token_management",
        "display_name": "许可证/Token",
        "description": "许可证管理、Token 充值消费、用量统计",
        "category": "finance",
        "icon": "vpn_key",
        "route_path": "tokens",
        "sort_order": 16,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 资产管理 =====
    {
        "feature_key": "classroom_management",
        "display_name": "教室管理",
        "description": "教室信息管理、设备分配、使用统计",
        "category": "asset",
        "icon": "meeting_room",
        "route_path": "classrooms",
        "sort_order": 20,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "equipment_management",
        "display_name": "设备与器材管理",
        "description": "硬件设备台账、维护记录、借用管理",
        "category": "asset",
        "icon": "devices",
        "route_path": "devices",
        "sort_order": 21,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 沟通协作 =====
    {
        "feature_key": "notifications",
        "display_name": "消息中心",
        "description": "系统消息推送、通知管理",
        "category": "communication",
        "icon": "notifications",
        "route_path": "notifications",
        "sort_order": 25,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "parent_portal",
        "display_name": "家长中心",
        "description": "家长互动、学生表现反馈、消息沟通",
        "category": "communication",
        "icon": "family_restroom",
        "route_path": "parent-portal",
        "sort_order": 26,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "multi_campus",
        "display_name": "多校区管理",
        "description": "多校区统一管理、数据汇总",
        "category": "communication",
        "icon": "business",
        "route_path": "multi-campus",
        "sort_order": 27,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== STEM 教育 =====
    {
        "feature_key": "stem_dashboard",
        "display_name": "STEM 看板",
        "description": "STEM 教育数据看板与分析",
        "category": "stem",
        "icon": "dashboard",
        "route_path": "stem/dashboard",
        "sort_order": 30,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "stem_clubs",
        "display_name": "STEM 社团管理",
        "description": "社团创建、成员管理、活动组织",
        "category": "stem",
        "icon": "group_work",
        "route_path": "stem/clubs",
        "sort_order": 31,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "stem_consumables",
        "display_name": "耗材管理",
        "description": "教学耗材库存、采购申请、领用记录",
        "category": "stem",
        "icon": "inventory_2",
        "route_path": "stem/consumables",
        "sort_order": 32,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "competition_management",
        "display_name": "竞赛认证",
        "description": "科技竞赛管理、认证考试安排",
        "category": "stem",
        "icon": "emoji_events",
        "route_path": "competitions",
        "sort_order": 33,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 考试管理 =====
    {
        "feature_key": "exam_management",
        "display_name": "考试管理",
        "description": "题库管理、试卷组卷、在线考试、成绩管理",
        "category": "exam",
        "icon": "quiz",
        "route_path": "exam",
        "sort_order": 35,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },

    # ===== 职业教育（仅职业学校） =====
    {
        "feature_key": "vocational_equipment",
        "display_name": "实训设备管理",
        "description": "职业实训设备台账、借用、维护管理",
        "category": "vocational",
        "icon": "hardware",
        "route_path": "vocational/equipment",
        "sort_order": 40,
        "is_enabled_by_default": True,
        "applicable_org_types": ["vocational_school"],
        "dependencies": [],
    },
    {
        "feature_key": "vocational_safety",
        "display_name": "安全准入管理",
        "description": "实训安全认证、安全检查、事故报告",
        "category": "vocational",
        "icon": "security",
        "route_path": "vocational/safety",
        "sort_order": 41,
        "is_enabled_by_default": True,
        "applicable_org_types": ["vocational_school"],
        "dependencies": [],
    },
    {
        "feature_key": "vocational_courses",
        "display_name": "实训课程管理",
        "description": "实训课程设置、实训室排课",
        "category": "vocational",
        "icon": "school",
        "route_path": "vocational/courses",
        "sort_order": 42,
        "is_enabled_by_default": True,
        "applicable_org_types": ["vocational_school"],
        "dependencies": [],
    },
    {
        "feature_key": "vocational_enterprise",
        "display_name": "校企合作管理",
        "description": "合作企业管理、联合项目、实习就业",
        "category": "vocational",
        "icon": "business_center",
        "route_path": "vocational/enterprises",
        "sort_order": 43,
        "is_enabled_by_default": True,
        "applicable_org_types": ["vocational_school"],
        "dependencies": [],
    },
    {
        "feature_key": "vocational_assessment",
        "display_name": "技能评估与证书",
        "description": "技能等级标准、评估考核、证书管理",
        "category": "vocational",
        "icon": "assignment_turned_in",
        "route_path": "vocational/assessments",
        "sort_order": 44,
        "is_enabled_by_default": True,
        "applicable_org_types": ["vocational_school"],
        "dependencies": [],
    },

    # ===== 系统设置 =====
    {
        "feature_key": "user_management",
        "display_name": "团队与权限",
        "description": "用户管理、角色分配、权限设置",
        "category": "system",
        "icon": "group",
        "route_path": "users",
        "sort_order": 50,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "backup_management",
        "display_name": "云端备份",
        "description": "数据云端自动备份与恢复",
        "category": "system",
        "icon": "backup",
        "route_path": "backup-management",
        "sort_order": 51,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "ai_assistant",
        "display_name": "AI 助教 · 小启",
        "description": "AI 智能排课、学情分析与代码审查",
        "category": "system",
        "icon": "psychology",
        "route_path": "ai-assistant",
        "sort_order": 52,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
    {
        "feature_key": "feature_management",
        "display_name": "功能管理",
        "description": "系统功能模块的启用/禁用配置",
        "category": "system",
        "icon": "toggle_on",
        "route_path": "settings/features",
        "sort_order": 53,
        "is_enabled_by_default": True,
        "applicable_org_types": [],
        "dependencies": [],
    },
]


def init_feature_modules(db: Session) -> None:
    """
    初始化系统功能模块定义。
    启动时调用，如果 feature_modules 表为空则插入默认数据。
    """
    existing = db.query(FeatureModule).count()
    if existing > 0:
        logger.info("功能模块已初始化 (%d 条)，跳过", existing)
        return

    for module_data in DEFAULT_FEATURE_MODULES:
        module = FeatureModule(**module_data)
        db.add(module)

    db.commit()
    logger.info("成功初始化 %d 个功能模块", len(DEFAULT_FEATURE_MODULES))


def get_default_feature_modules() -> list:
    """返回默认功能模块列表（供前端展示和初始化参考）"""
    return DEFAULT_FEATURE_MODULES