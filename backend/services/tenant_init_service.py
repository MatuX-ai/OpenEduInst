"""
租户初始化服务
负责在创建组织时根据组织类型自动配置默认的功能开关和业务参数
"""

from typing import Dict, Any
from sqlalchemy.orm import Session

from models.license import OrganizationType
from models.tenant import TenantConfig, TenantFeatureFlag


class TenantInitService:
    """租户初始化服务"""

    # 定义不同组织类型的默认功能开关
    DEFAULT_FEATURES: Dict[OrganizationType, list[str]] = {
        OrganizationType.TRAINING: [
            'admissions', 'scheduling', 'finance', 'live_streaming', 
            'courseware', 'promotion', 'report', 'material'
        ],
        OrganizationType.K12: [
            'student_records', 'schedule_query', 'home_school_comm', 
            'grade_analysis', 'attendance', 'teacher_mgmt'
        ],
        OrganizationType.VOCATIONAL: [
            'training_mgmt', 'internship_tracking', 'skill_cert', 
            'enterprise_docking', 'equipment_mgmt'
        ],
        OrganizationType.BUREAU: [
            'district_stats', 'security_alert', 'resource_alloc', 
            'policy_publish', 'school_supervision'
        ]
    }

    # 定义不同组织类型的默认业务配置
    DEFAULT_CONFIGS: Dict[OrganizationType, Dict[str, Any]] = {
        OrganizationType.TRAINING: {
            'currency': 'CNY',
            'default_class_capacity': 20,
            'renewal_reminder_days': 7
        },
        OrganizationType.K12: {
            'semester_start_month': 9,
            'max_class_size': 50,
            'grading_system': 'percentage'
        },
        OrganizationType.VOCATIONAL: {
            'internship_duration_months': 6,
            'certification_required': True
        },
        OrganizationType.BUREAU: {
            'reporting_frequency': 'monthly',
            'supervision_level': 'city'
        }
    }

    @staticmethod
    def initialize_tenant(db: Session, org_id: int, org_type: OrganizationType) -> None:
        """初始化租户配置和功能开关"""
        
        # 1. 初始化功能开关
        features = TenantInitService.DEFAULT_FEATURES.get(org_type, [])
        for feature_key in features:
            flag = TenantFeatureFlag(
                org_id=org_id,
                feature_key=feature_key,
                is_enabled=True
            )
            db.add(flag)

        # 2. 初始化业务配置
        config_data = TenantInitService.DEFAULT_CONFIGS.get(org_type, {})
        config = TenantConfig(
            org_id=org_id,
            config_data=config_data
        )
        db.add(config)

        db.commit()
