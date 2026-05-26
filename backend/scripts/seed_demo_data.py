"""
OpenMT Demo 数据种子脚本（Python 版本）
为 4 种组织类型创建完整的演示数据
"""

import asyncio
import bcrypt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.license import License, LicenseType, Organization, OrganizationType
from models.classroom import Classroom
from models.base_models import User
from models.user_organization import UserOrganization, UserOrganizationRole, UserOrganizationStatus
from models.user_license import UserLicense, UserLicenseStatus, UserRole, TokenPackage, TokenPackageType, UserTokenBalance
from utils.database import SessionLocal


# 演示账号统一密码
DEMO_PASSWORD = "demo123456"


def hash_password(password: str) -> str:
    """使用 bcrypt 加密密码"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_demo_organizations(db: Session):
    """创建 4 种演示组织"""
    
    organizations = [
        {
            "name": "星海机器人培训中心",
            "org_type": OrganizationType.TRAINING,
            "contact_email": "admin@starrobotics.edu.cn",
            "phone": "010-88886666",
            "address": "北京市海淀区中关村大街1号",
            "max_users": 500
        },
        {
            "name": "XX 实验小学科创中心",
            "org_type": OrganizationType.K12,
            "contact_email": "kechuang@xxprimary.edu.cn",
            "phone": "021-66668888",
            "address": "上海市浦东新区世纪大道100号",
            "max_users": 1000
        },
        {
            "name": "XX 职业技术学院实训基地",
            "org_type": OrganizationType.VOCATIONAL,
            "contact_email": "shixun@xxvocational.edu.cn",
            "phone": "020-88889999",
            "address": "广州市天河区高校路200号",
            "max_users": 500
        },
        {
            "name": "XX 区教育局科创监管平台",
            "org_type": OrganizationType.BUREAU,
            "contact_email": "kechuang@xxedu.gov.cn",
            "phone": "0755-28886666",
            "address": "深圳市福田区福中三路100号",
            "max_users": 2000
        }
    ]
    
    created_orgs = []
    for org_data in organizations:
        org = Organization(**org_data, is_active=True)
        db.add(org)
        db.flush()  # 获取 ID
        created_orgs.append(org)
        print(f"[OK] 创建组织: {org.name} (ID: {org.id})")
    
    db.commit()
    return created_orgs


def create_classrooms(db: Session, organization: Organization):
    """为组织创建教室/实验室"""
    
    classrooms_config = {
        OrganizationType.TRAINING: [
            {"name": "Arduino 实验室 A", "room_type": "LAB", "capacity": 30, 
             "description": "配备 30 套 Arduino 开发套件"},
            {"name": "机器人竞赛室", "room_type": "LAB", "capacity": 20,
             "description": "FLL/VEX 机器人训练场地"},
            {"name": "3D 打印工坊", "room_type": "MAKER_SPACE", "capacity": 15,
             "description": "3 台 3D 打印机，激光切割机 1 台"},
            {"name": "Python 编程教室", "room_type": "CLASSROOM", "capacity": 40,
             "description": "多媒体编程教学教室"},
            {"name": "物联网实验室", "room_type": "LAB", "capacity": 25,
             "description": "Raspberry Pi + 传感器实验区"}
        ],
        OrganizationType.K12: [
            {"name": "3D 打印实验室", "room_type": "MAKER_SPACE", "capacity": 20,
             "description": "5 台 Ultimaker S3 3D 打印机"},
            {"name": "激光切割工坊", "room_type": "MAKER_SPACE", "capacity": 15,
             "description": "2 台 Glowforge Pro 激光切割机"},
            {"name": "Micro:bit 教室", "room_type": "LAB", "capacity": 40,
             "description": "60 套 Micro:bit 开发板"},
            {"name": "VR 体验室", "room_type": "LAB", "capacity": 10,
             "description": "10 台 Oculus Quest 2"},
            {"name": "科学实验数据分析室", "room_type": "LAB", "capacity": 30,
             "description": "传感器数据采集与分析"}
        ],
        OrganizationType.VOCATIONAL: [
            {"name": "PLC 控制实验室", "room_type": "LAB", "capacity": 20,
             "description": "10 套西门子 S7-1200 PLC"},
            {"name": "CNC 加工车间", "room_type": "WORKSHOP", "capacity": 10,
             "description": "3 台三轴数控铣床"},
            {"name": "工业机器人实训室", "room_type": "LAB", "capacity": 15,
             "description": "2 台 ABB IRB 120 机器人"},
            {"name": "嵌入式开发实验室", "room_type": "LAB", "capacity": 30,
             "description": "STM32/ESP32 开发板 30 套"},
            {"name": "工业自动化仿真室", "room_type": "LAB", "capacity": 25,
             "description": "Factory IO 仿真软件"}
        ],
        OrganizationType.BUREAU: [
            {"name": "数据统计中心", "room_type": "OFFICE", "capacity": 10,
             "description": "全区 STEM 教育数据大屏"},
            {"name": "资源调配会议室", "room_type": "MEETING", "capacity": 20,
             "description": "跨校设备共享协调会议"},
            {"name": "师资培训教室", "room_type": "CLASSROOM", "capacity": 50,
             "description": "STEM 教师培训基地"}
        ]
    }
    
    config = classrooms_config.get(organization.org_type, [])
    classrooms = []
    
    for room_data in config:
        classroom = Classroom(
            org_id=organization.id,
            room_number=f"ROOM-{room_data['name'][:10]}",
            capacity=room_data["capacity"],
            room_type=room_data["room_type"],
            notes=room_data.get("description", ""),
            has_projector=True,
            has_audio_system=True
        )
        db.add(classroom)
        classrooms.append(classroom)
    
    db.commit()
    print(f"[OK] 为 {organization.name} 创建 {len(classrooms)} 个教室/实验室")
    return classrooms


def create_users(db: Session, organization: Organization):
    """为组织创建用户（管理员、教师、学生）"""
    
    users_config = {
        OrganizationType.TRAINING: {
            "admins": [
                {"username": "zhao_admin", "email": "zhao@starrobotics.edu.cn", 
                 "full_name": "赵敏", "phone": "13800138005"}
            ],
            "teachers": [
                {"username": "zhang_teacher", "email": "zhang@starrobotics.edu.cn",
                 "full_name": "张明华", "phone": "13800138001", "specialty": "Arduino 专家"},
                {"username": "li_python", "email": "li@starrobotics.edu.cn",
                 "full_name": "李思远", "phone": "13800138002", "specialty": "Python 导师"},
                {"username": "wang_robot", "email": "wang@starrobotics.edu.cn",
                 "full_name": "王建国", "phone": "13800138003", "specialty": "机器人教练"},
                {"username": "chen_iot", "email": "chen@starrobotics.edu.cn",
                 "full_name": "陈志强", "phone": "13800138004", "specialty": "物联网讲师"}
            ],
            "students_count": 10
        },
        OrganizationType.K12: {
            "admins": [
                {"username": "admin_k12", "email": "admin@xxprimary.edu.cn",
                 "full_name": "杨主任", "phone": "13900139004"}
            ],
            "teachers": [
                {"username": "teacher_k12_01", "email": "t01@xxprimary.edu.cn",
                 "full_name": "林老师", "phone": "13900139001"},
                {"username": "teacher_k12_02", "email": "t02@xxprimary.edu.cn",
                 "full_name": "黄老师", "phone": "13900139002"},
                {"username": "teacher_k12_03", "email": "t03@xxprimary.edu.cn",
                 "full_name": "徐老师", "phone": "13900139003"}
            ],
            "students_count": 20
        },
        OrganizationType.VOCATIONAL: {
            "admins": [
                {"username": "director_voc", "email": "director@xxvocational.edu.cn",
                 "full_name": "马主任", "phone": "13700137004"}
            ],
            "teachers": [
                {"username": "prof_plc", "email": "plc@xxvocational.edu.cn",
                 "full_name": "周教授", "phone": "13700137001", "certification": "西门子认证工程师"},
                {"username": "prof_cnc", "email": "cnc@xxvocational.edu.cn",
                 "full_name": "吴工程师", "phone": "13700137002", "certification": "CNC 高级技师"},
                {"username": "prof_robot", "email": "robot@xxvocational.edu.cn",
                 "full_name": "郑技师", "phone": "13700137003", "certification": "ABB 机器人认证"}
            ],
            "students_count": 15
        },
        OrganizationType.BUREAU: {
            "admins": [
                {"username": "bureau_director", "email": "director@xxedu.gov.cn",
                 "full_name": "钱局长", "phone": "13600136001"}
            ],
            "teachers": [
                {"username": "bureau_analyst", "email": "analyst@xxedu.gov.cn",
                 "full_name": "孙分析师", "phone": "13600136002"},
                {"username": "bureau_coordinator", "email": "coord@xxedu.gov.cn",
                 "full_name": "李协调员", "phone": "13600136003"}
            ],
            "students_count": 0  # 教育局没有学生
        }
    }
    
    config = users_config.get(organization.org_type, {})
    created_users = []
    
    # 创建管理员
    for admin_data in config.get("admins", []):
        user = User(
            username=admin_data["username"],
            email=admin_data["email"],
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=admin_data["full_name"],
            is_active=True
        )
        db.add(user)
        db.flush()  # 获取 user.id
        
        # 创建用户-组织关联
        user_org = UserOrganization(
            user_id=user.id,
            org_id=organization.id,
            role=UserOrganizationRole.ADMIN,
            status=UserOrganizationStatus.ACTIVE
        )
        db.add(user_org)
        created_users.append(user)
    
    # 创建教师
    for teacher_data in config.get("teachers", []):
        user = User(
            username=teacher_data["username"],
            email=teacher_data["email"],
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=teacher_data["full_name"],
            is_active=True
        )
        db.add(user)
        db.flush()
        
        # 创建用户-组织关联
        user_org = UserOrganization(
            user_id=user.id,
            org_id=organization.id,
            role=UserOrganizationRole.TEACHER,
            status=UserOrganizationStatus.ACTIVE
        )
        db.add(user_org)
        created_users.append(user)
    
    # 创建学生
    for i in range(1, config.get("students_count", 0) + 1):
        prefix_map = {
            OrganizationType.TRAINING: "student",
            OrganizationType.K12: "k12_s",
            OrganizationType.VOCATIONAL: "voc_s",
            OrganizationType.BUREAU: "bureau_s"
        }
        prefix = prefix_map.get(organization.org_type, "s")
        
        user = User(
            username=f"{prefix}_{i:03d}",
            email=f"{prefix}_{i:03d}@student.local",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=f"演示学生{i}",
            is_active=True
        )
        db.add(user)
        db.flush()
        
        # 创建用户-组织关联
        user_org = UserOrganization(
            user_id=user.id,
            org_id=organization.id,
            role=UserOrganizationRole.STUDENT,
            status=UserOrganizationStatus.ACTIVE
        )
        db.add(user_org)
        created_users.append(user)
    
    db.commit()
    print(f"[OK] 为 {organization.name} 创建 {len(created_users)} 个用户")
    return created_users


def create_licenses_and_assign(db: Session, organization: Organization, users: list):
    """创建许可证并分配给用户"""
    
    license_type_map = {
        OrganizationType.TRAINING: LicenseType.EDUCATION,
        OrganizationType.K12: LicenseType.EDUCATION,
        OrganizationType.VOCATIONAL: LicenseType.ENTERPRISE,
        OrganizationType.BUREAU: LicenseType.ENTERPRISE
    }
    
    license_type = license_type_map.get(organization.org_type, LicenseType.EDUCATION)
    
    # 创建许可证
    license_key = f"DEMO-{organization.org_type.value.upper()}-2026-001"
    license_obj = License(
        license_key=license_key,
        license_type=license_type,
        organization_id=organization.id,
        max_users=organization.max_users,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365),
        is_active=True
    )
    db.add(license_obj)
    db.flush()
    
    # 为所有用户分配许可证
    for user in users:
        user_license = UserLicense(
            user_id=user.id,
            license_id=license_obj.id,
            status=UserLicenseStatus.ACTIVE,
            assigned_at=datetime.utcnow()
        )
        db.add(user_license)
    
    db.commit()
    print(f"[OK] 为 {organization.name} 创建许可证并分配给 {len(users)} 个用户")


def create_token_packages(db: Session):
    """创建 Token 套餐（全局）"""
    
    packages = [
        {
            "name": "免费版",
            "package_type": TokenPackageType.FREE,
            "token_count": 100,
            "price": 0.0,
            "valid_days": 30,
            "bonus_features": ["基础 AI 助教"]
        },
        {
            "name": "STEM 教育标准包",
            "package_type": TokenPackageType.STANDARD,
            "token_count": 1000,
            "price": 299.0,
            "valid_days": 365,
            "bonus_features": ["AI 助教", "智能评测"]
        },
        {
            "name": "STEM 教育高级包",
            "package_type": TokenPackageType.PREMIUM,
            "token_count": 5000,
            "price": 999.0,
            "valid_days": 365,
            "bonus_features": ["AI 助教", "智能评测", "课程生成", "代码审查"]
        },
        {
            "name": "企业包",
            "package_type": TokenPackageType.ENTERPRISE,
            "token_count": 30000,
            "price": 4999.0,
            "valid_days": 365,
            "bonus_features": ["全部 AI 功能", "优先支持", "定制服务"]
        }
    ]
    
    for pkg_data in packages:
        # 检查是否已存在
        existing = db.query(TokenPackage).filter_by(name=pkg_data["name"]).first()
        if not existing:
            package = TokenPackage(**pkg_data, is_active=True)
            db.add(package)
    
    db.commit()
    print(f"[OK] 创建 {len(packages)} 个 Token 套餐")


def create_user_token_balances(db: Session, organization: Organization):
    """为管理员创建 Token 余额"""
    
    # 查找组织的管理员
    from models.user_organization import UserOrganization, UserOrganizationRole
    user_org = db.query(UserOrganization).filter_by(
        org_id=organization.id,
        role=UserOrganizationRole.ADMIN
    ).first()
    
    if user_org:
        balance = UserTokenBalance(
            user_id=user_org.user_id,
            total_tokens=1000,
            used_tokens=150,
            remaining_tokens=850,
            monthly_bonus_tokens=100
        )
        db.add(balance)
        db.commit()
        print(f"[OK] 为 {organization.name} 管理员创建 Token 余额")


def seed_demo_data():
    """主函数：执行所有种子数据创建"""
    from models.user_organization import UserOrganization, UserOrganizationRole
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("开始创建 OpenMT Demo 数据...")
        print("=" * 60)
        
        # 检查是否已有演示数据
        existing_orgs = db.query(Organization).filter(
            Organization.name.like("%星海%") | 
            Organization.name.like("%实验%") |
            Organization.name.like("%职业%") |
            Organization.name.like("%教育局%")
        ).all()
        
        if existing_orgs:
            print(f"\n发现 {len(existing_orgs)} 个已有演示组织，正在清除...")
            
            # 收集所有需要删除的用户ID
            all_user_ids = set()
            for org in existing_orgs:
                user_orgs = db.query(UserOrganization).filter_by(org_id=org.id).all()
                for uo in user_orgs:
                    all_user_ids.add(uo.user_id)
            
            # 删除所有关联数据（按依赖顺序）
            for org in existing_orgs:
                # 1. 删除用户-组织关联
                db.query(UserOrganization).filter_by(org_id=org.id).delete()
                
                # 2. 删除该组织的许可证关联的 UserLicense
                for lic in org.licenses:
                    db.query(UserLicense).filter_by(license_id=lic.id).delete()
                
                # 3. 删除 Token 余额
                for user_id in all_user_ids:
                    db.query(UserTokenBalance).filter_by(user_id=user_id).delete()
                
                # 4. 删除许可证
                db.query(License).filter_by(organization_id=org.id).delete()
                
                # 5. 删除教室
                db.query(Classroom).filter_by(org_id=org.id).delete()
            
            # 6. 删除用户
            for user_id in all_user_ids:
                db.query(User).filter_by(id=user_id).delete()
            
            # 7. 删除组织
            for org in existing_orgs:
                db.delete(org)
            
            db.commit()
            print("已清除旧数据")
        
        # 1. 创建组织
        print("\n步骤 1: 创建组织")
        organizations = create_demo_organizations(db)
        
        # 2. 为每个组织创建教室、用户、许可证
        for org in organizations:
            print(f"\n处理组织: {org.name}")
            
            # 创建教室
            create_classrooms(db, org)
            
            # 创建用户
            users = create_users(db, org)
            
            # 创建许可证并分配
            create_licenses_and_assign(db, org, users)
            
            # 为管理员创建 Token 余额
            create_user_token_balances(db, org)
        
        # 3. 创建 Token 套餐（全局）
        print("\n步骤 2: 创建 Token 套餐")
        create_token_packages(db)
        
        print("\n" + "=" * 60)
        print("Demo 数据创建完成！")
        print("=" * 60)
        print(f"\n演示账号密码统一为: {DEMO_PASSWORD}")
        print("\n登录示例:")
        for org in organizations:
            user_org = db.query(UserOrganization).filter_by(
                org_id=org.id,
                role=UserOrganizationRole.ADMIN
            ).first()
            if user_org:
                admin = db.query(User).get(user_org.user_id)
                if admin:
                    print(f"  - {org.name}: {admin.username} / {DEMO_PASSWORD}")
        
    except Exception as e:
        db.rollback()
        print(f"\n错误: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
