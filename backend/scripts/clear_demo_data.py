"""清理演示数据脚本"""
import sys
sys.path.insert(0, 'g:\\OpenMTEduInst\\backend')

from utils.database import SessionLocal
from models.base_models import User
from models.license import Organization
from models.user_organization import UserOrganization
from models.classroom import Classroom
from models.license import License
from models.user_license import UserLicense, UserTokenBalance

db = SessionLocal()

try:
    print("开始清理演示数据...")
    
    # 找到所有演示组织
    demo_orgs = db.query(Organization).filter(
        Organization.name.like("%星海%") | 
        Organization.name.like("%实验%") |
        Organization.name.like("%职业%") |
        Organization.name.like("%教育局%")
    ).all()
    
    print(f"找到 {len(demo_orgs)} 个演示组织")
    
    # 收集所有演示用户ID
    demo_user_ids = set()
    for org in demo_orgs:
        user_orgs = db.query(UserOrganization).filter_by(org_id=org.id).all()
        for uo in user_orgs:
            demo_user_ids.add(uo.user_id)
    
    print(f"找到 {len(demo_user_ids)} 个演示用户")
    
    # 按顺序删除
    print("删除 UserTokenBalance...")
    for uid in demo_user_ids:
        db.query(UserTokenBalance).filter_by(user_id=uid).delete(synchronize_session=False)
    
    print("删除 UserLicense...")
    for org in demo_orgs:
        for lic in org.licenses:
            db.query(UserLicense).filter_by(license_id=lic.id).delete(synchronize_session=False)
    
    print("删除 UserOrganization...")
    for org in demo_orgs:
        db.query(UserOrganization).filter_by(org_id=org.id).delete(synchronize_session=False)
    
    print("删除 License...")
    for org in demo_orgs:
        db.query(License).filter_by(organization_id=org.id).delete(synchronize_session=False)
    
    print("删除 Classroom...")
    for org in demo_orgs:
        db.query(Classroom).filter_by(org_id=org.id).delete(synchronize_session=False)
    
    print("删除 User...")
    for uid in demo_user_ids:
        db.query(User).filter_by(id=uid).delete(synchronize_session=False)
    
    print("删除 Organization...")
    for org in demo_orgs:
        db.delete(org)
    
    db.commit()
    print("✓ 清理完成!")
    
except Exception as e:
    db.rollback()
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
