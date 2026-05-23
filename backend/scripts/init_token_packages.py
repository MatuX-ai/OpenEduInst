"""
初始化 Token 套餐数据
"""
from sqlalchemy.orm import Session
from utils.database import SessionLocal
from models.token_billing import TokenPackage
from datetime import datetime

def init_token_packages():
    """初始化默认的 Token 套餐"""
    db = SessionLocal()
    
    try:
        # 获取或创建默认组织（org_id=1）
        from models.license import Organization
        org = db.query(Organization).filter(Organization.id == 1).first()
        if not org:
            print("❌ 未找到组织ID=1，请先运行 seed_demo_data.py")
            return
        
        # 检查是否已有套餐
        existing_count = db.query(TokenPackage).filter(TokenPackage.org_id == 1).count()
        if existing_count > 0:
            print(f"✅ 已存在 {existing_count} 个套餐，跳过初始化")
            return
        
        # 创建默认套餐
        packages = [
            TokenPackage(
                org_id=1,
                name="体验包",
                description="适合小规模试用",
                token_amount=1000,
                price=50.0,
                currency="CNY",
                validity_days=365,
                is_active=True,
                is_popular=False
            ),
            TokenPackage(
                org_id=1,
                name="标准包",
                description="适合日常教学使用",
                token_amount=5000,
                price=200.0,
                currency="CNY",
                validity_days=365,
                is_active=True,
                is_popular=True
            ),
            TokenPackage(
                org_id=1,
                name="专业包",
                description="适合大型培训机构",
                token_amount=20000,
                price=600.0,
                currency="CNY",
                validity_days=365,
                is_active=True,
                is_popular=False
            ),
            TokenPackage(
                org_id=1,
                name="企业包",
                description="无限使用，专属服务",
                token_amount=100000,
                price=2000.0,
                currency="CNY",
                validity_days=365,
                is_active=True,
                is_popular=False
            )
        ]
        
        for pkg in packages:
            db.add(pkg)
        
        db.commit()
        print(f"✅ 成功初始化 {len(packages)} 个 Token 套餐")
        
        for pkg in packages:
            print(f"   - {pkg.name}: {pkg.token_amount} Token, ¥{pkg.price}")
            
    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_token_packages()
