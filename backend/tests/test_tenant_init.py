"""
测试租户初始化服务
验证不同组织类型初始化时功能开关的正确性
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from utils.database import Base
from models.license import Organization, OrganizationType
from services.tenant_init_service import TenantInitService

# 使用内存数据库进行测试
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_tenant_initialization():
    """测试租户初始化逻辑"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. 创建一个模拟的培训机构组织
    org = Organization(name="Test Training Center", contact_email="test@example.com", org_type=OrganizationType.TRAINING)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # 2. 执行初始化
    TenantInitService.initialize_tenant(db, org.id, org.org_type)
    
    # 3. 验证功能开关是否已创建
    from models.tenant import TenantFeatureFlag
    flags = db.query(TenantFeatureFlag).filter(TenantFeatureFlag.org_id == org.id).all()
    
    assert len(flags) > 0, "功能开关未正确初始化"
    
    # 4. 验证业务配置是否已创建
    from models.tenant import TenantConfig
    config = db.query(TenantConfig).filter(TenantConfig.org_id == org.id).first()
    
    assert config is not None, "业务配置未正确初始化"
    assert 'currency' in config.config_data, "默认配置项缺失"
    
    db.close()

if __name__ == "__main__":
    test_tenant_initialization()
    print("Test passed!")
