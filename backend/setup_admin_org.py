from utils.database import SessionLocal
from models.base_models import User
from models.license import Organization, OrganizationType
from models.user_organization import UserOrganization, UserOrganizationRole

db = SessionLocal()

try:
    # 创建组织
    org = Organization(
        name='演示机构',
        org_type=OrganizationType.TRAINING,
        contact_email='demo@test.com',
        max_users=100,
        is_active=True
    )
    db.add(org)
    db.flush()
    
    # 获取admin用户
    user = db.query(User).filter(User.username == 'admin').first()
    
    if user:
        # 关联用户和组织
        user_org = UserOrganization(
            user_id=user.id,
            org_id=org.id,
            role=UserOrganizationRole.ADMIN,
            is_primary=True
        )
        db.add(user_org)
        db.commit()
        print(f'✅ Created org {org.id} and linked to admin user {user.id}')
    else:
        print('❌ Admin user not found')
        
finally:
    db.close()
