"""
租户初始化服务
负责在创建组织时根据组织类型自动配置默认的功能开关和业务参数
"""

from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from models.license import OrganizationType, License, LicenseType, LicenseStatus
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
            'renewal_reminder_days': 7,
            'cloud_backup_enabled': True,  # 云托管专属：开启自动备份
            'ai_assistant_level': 'advanced' # 云托管专属：高级 AI 助教
        },
        OrganizationType.K12: {
            'semester_start_month': 9,
            'max_class_size': 50,
            'grading_system': 'percentage',
            'parent_portal_access': True
        },
        OrganizationType.VOCATIONAL: {
            'internship_duration_months': 6,
            'certification_required': True,
            'enterprise_sync': True
        },
        OrganizationType.BUREAU: {
            'reporting_frequency': 'monthly',
            'supervision_level': 'city',
            'data_visualization_dashboard': True
        }
    }

    @staticmethod
    def initialize_tenant(db: Session, org_id: int, org_type: OrganizationType) -> None:
        """初始化租户配置、功能开关及云托管许可证"""
        
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

        # 3. 自动发放初始云托管许可证 (有效期1年)
        license_key = f"CLOUD-{uuid.uuid4().hex[:12].upper()}"
        initial_license = License(
            license_key=license_key,
            organization_id=org_id,
            license_type=LicenseType.CLOUD_HOSTED,
            status=LicenseStatus.ACTIVE,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=365),
            activated_at=datetime.utcnow(),
            max_users=100,
            max_devices=50,
            features=["stem_management", "hardware_tracking", "token_billing", "ai_assistant", "auto_backup"]
        )
        db.add(initial_license)
        
        db.commit()
