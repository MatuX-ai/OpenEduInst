"""
测试租户初始化服务
验证不同组织类型初始化时功能开关的正确性
"""

import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from utils.database import Base
from models.license import Organization, OrganizationType, License, LicenseType, LicenseStatus
from models.tenant import TenantConfig, TenantFeatureFlag
from models.base_models import Teacher, Course
import models.schedule  # noqa: F401 — 注册所有表确保外键可解析
from services.tenant_init_service import TenantInitService

# 使用内存数据库进行测试，确保每次运行隔离
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _unique_email():
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


def test_tenant_initialization():
    """测试培训机构租户初始化：功能开关 + 业务配置 + 云托管许可证"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        # 1. 创建一个模拟的培训机构组织
        org = Organization(
            name="Test Training Center",
            contact_email=_unique_email(),
            org_type=OrganizationType.TRAINING,
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # 2. 执行初始化
        TenantInitService.initialize_tenant(db, org.id, org.org_type)

        # 3. 验证功能开关
        flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org.id).all()
        expected_features = TenantInitService.DEFAULT_FEATURES[OrganizationType.TRAINING]
        assert len(flags) == len(expected_features), (
            f"功能开关数量不匹配: 期望 {len(expected_features)}, 实际 {len(flags)}"
        )
        flag_keys = {f.feature_key for f in flags}
        for key in expected_features:
            assert key in flag_keys, f"缺少功能开关: {key}"

        # 4. 验证业务配置
        config = db.query(TenantConfig).filter(TenantConfig.org_id == org.id).first()
        assert config is not None, "业务配置未正确初始化"
        assert config.config_data.get("currency") == "CNY", "默认货币配置错误"
        assert config.config_data.get("cloud_backup_enabled") is True, "云备份配置缺失"
        assert config.config_data.get("ai_assistant_level") == "advanced", "AI 助教等级配置错误"

        # 5. 验证自动发放的云托管许可证
        lic = db.query(License).filter(License.organization_id == org.id).first()
        assert lic is not None, "云托管许可证未自动发放"
        assert lic.license_type == LicenseType.CLOUD_HOSTED, "许可证类型错误"
        assert lic.status == LicenseStatus.ACTIVE, "许可证状态应为 ACTIVE"
        assert lic.max_users == 100, "默认最大用户数应为 100"
        assert lic.max_devices == 50, "默认最大设备数应为 50"
        assert "auto_backup" in lic.features, "许可证功能列表应包含 auto_backup"
        assert "ai_assistant" in lic.features, "许可证功能列表应包含 ai_assistant"
        assert lic.license_key.startswith("CLOUD-"), "许可证密钥应以 CLOUD- 开头"

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_k12_tenant_initialization():
    """测试 K12 学校租户初始化"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        org = Organization(
            name="Test K12 School",
            contact_email=_unique_email(),
            org_type=OrganizationType.K12,
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        TenantInitService.initialize_tenant(db, org.id, org.org_type)

        # 验证 K12 专属功能开关
        flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org.id).all()
        expected = TenantInitService.DEFAULT_FEATURES[OrganizationType.K12]
        assert len(flags) == len(expected)
        flag_keys = {f.feature_key for f in flags}
        assert "home_school_comm" in flag_keys, "K12 应包含家校互动功能"
        assert "grade_analysis" in flag_keys, "K12 应包含成绩分析功能"

        # 验证 K12 配置
        config = db.query(TenantConfig).filter(TenantConfig.org_id == org.id).first()
        assert config.config_data.get("semester_start_month") == 9
        assert config.config_data.get("parent_portal_access") is True

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_vocational_tenant_initialization():
    """测试职业学校租户初始化"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        org = Organization(
            name="Test Vocational School",
            contact_email=_unique_email(),
            org_type=OrganizationType.VOCATIONAL,
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        TenantInitService.initialize_tenant(db, org.id, org.org_type)

        flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org.id).all()
        flag_keys = {f.feature_key for f in flags}
        assert "internship_tracking" in flag_keys, "职校应包含实习跟踪功能"
        assert "skill_cert" in flag_keys, "职校应包含技能认证功能"

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_bureau_tenant_initialization():
    """测试教育局租户初始化"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        org = Organization(
            name="Test Education Bureau",
            contact_email=_unique_email(),
            org_type=OrganizationType.BUREAU,
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        TenantInitService.initialize_tenant(db, org.id, org.org_type)

        flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org.id).all()
        flag_keys = {f.feature_key for f in flags}
        assert "district_stats" in flag_keys, "教育局应包含辖区统计功能"
        assert "security_alert" in flag_keys, "教育局应包含安全预警功能"

        config = db.query(TenantConfig).filter(TenantConfig.org_id == org.id).first()
        assert config.config_data.get("reporting_frequency") == "monthly"

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

if __name__ == "__main__":
    test_tenant_initialization()
    test_k12_tenant_initialization()
    test_vocational_tenant_initialization()
    test_bureau_tenant_initialization()
    print("All tests passed!")
