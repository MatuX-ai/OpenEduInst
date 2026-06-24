"""
OpenMT Demo 数据种子脚本（Python 版本）
为 4 种组织类型创建完整的演示数据
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.license import License, LicenseType, Organization, OrganizationType
from models.classroom import Classroom
# 预导入所有可能用到的模型文件（确保 Base.metadata.create_all 能创建所有表）
import models.club          # noqa: F401
import models.consumable   # noqa: F401
import models.hardware_device  # noqa: F401
import models.stem_project  # noqa: F401
import models.maker_space   # noqa: F401
import models.marketing   # noqa: F401
import models.parent_portal # noqa: F401
import models.student      # noqa: F401
import models.competition # noqa: F401
import models.backup       # noqa: F401
import models.token_billing # noqa: F401
import models.tenant     # noqa: F401
import models.notification # noqa: F401
import models.resource    # noqa: F401
from models.base_models import User, Teacher, Course
from models.schedule import Schedule, ScheduleStatus
from models.user_organization import UserOrganization, UserOrganizationRole, UserOrganizationStatus
from models.user_license import UserLicense, UserLicenseStatus, UserRole, LegacyTokenPackage, TokenPackageType, UserTokenBalance
from models.bureau_models import (  # noqa: F401
    BureauSchool, SchoolSTEMScore, SchoolRating, EquipmentStatus,
    BureauEquipmentPool, EquipmentRequest, EquipmentAllocation, AllocationStatus,
    CrossSchoolSharing, SharingStatus,
    TrainingSession, TrainingRegistration, TrainingSessionStatus, TrainingType,
    BureauCompetition, CompetitionResult, CompetitionLevel, AwardLevel,
    BudgetPlan, BudgetStatus, BudgetExpense, ExpenseCategory, ExpenseStatus,
    BureauCurriculumResource, CurriculumCategory, CurriculumStatus,
)
from utils.auth_utils import hash_password
from utils.database import SessionLocal, Base, engine


# 演示账号统一密码
DEMO_PASSWORD = "demo123456"


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
            {"name": "Arduino 实验室 A", "equipment_summary": "LAB", "capacity": 30, 
             "description": "配备 30 套 Arduino 开发套件"},
            {"name": "机器人竞赛室", "equipment_summary": "LAB", "capacity": 20,
             "description": "FLL/VEX 机器人训练场地"},
            {"name": "3D 打印工坊", "equipment_summary": "MAKER_SPACE", "capacity": 15,
             "description": "3 台 3D 打印机，激光切割机 1 台"},
            {"name": "Python 编程教室", "equipment_summary": "CLASSROOM", "capacity": 40,
             "description": "多媒体编程教学教室"},
            {"name": "物联网实验室", "equipment_summary": "LAB", "capacity": 25,
             "description": "Raspberry Pi + 传感器实验区"}
        ],
        OrganizationType.K12: [
            {"name": "3D 打印实验室", "equipment_summary": "MAKER_SPACE", "capacity": 20,
             "description": "5 台 Ultimaker S3 3D 打印机"},
            {"name": "激光切割工坊", "equipment_summary": "MAKER_SPACE", "capacity": 15,
             "description": "2 台 Glowforge Pro 激光切割机"},
            {"name": "Micro:bit 教室", "equipment_summary": "LAB", "capacity": 40,
             "description": "60 套 Micro:bit 开发板"},
            {"name": "VR 体验室", "equipment_summary": "LAB", "capacity": 10,
             "description": "10 台 Oculus Quest 2"},
            {"name": "科学实验数据分析室", "equipment_summary": "LAB", "capacity": 30,
             "description": "传感器数据采集与分析"}
        ],
        OrganizationType.VOCATIONAL: [
            {"name": "PLC 控制实验室", "equipment_summary": "LAB", "capacity": 20,
             "description": "10 套西门子 S7-1200 PLC"},
            {"name": "CNC 加工车间", "equipment_summary": "WORKSHOP", "capacity": 10,
             "description": "3 台三轴数控铣床"},
            {"name": "工业机器人实训室", "equipment_summary": "LAB", "capacity": 15,
             "description": "2 台 ABB IRB 120 机器人"},
            {"name": "嵌入式开发实验室", "equipment_summary": "LAB", "capacity": 30,
             "description": "STM32/ESP32 开发板 30 套"},
            {"name": "工业自动化仿真室", "equipment_summary": "LAB", "capacity": 25,
             "description": "Factory IO 仿真软件"}
        ],
        OrganizationType.BUREAU: [
            {"name": "数据统计中心", "equipment_summary": "OFFICE", "capacity": 10,
             "description": "全区 STEM 教育数据大屏"},
            {"name": "资源调配会议室", "equipment_summary": "MEETING", "capacity": 20,
             "description": "跨校设备共享协调会议"},
            {"name": "师资培训教室", "equipment_summary": "CLASSROOM", "capacity": 50,
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
            room_type=room_data.get("room_type", room_data.get("equipment_summary", "")),
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
            "purchase_price": 0.0,
            "valid_days": 30,
            "bonus_features": ["基础 AI 助教"]
        },
        {
            "name": "STEM 教育标准包",
            "package_type": TokenPackageType.STANDARD,
            "token_count": 1000,
            "purchase_price": 299.0,
            "valid_days": 365,
            "bonus_features": ["AI 助教", "智能评测"]
        },
        {
            "name": "STEM 教育高级包",
            "package_type": TokenPackageType.PREMIUM,
            "token_count": 5000,
            "purchase_price": 999.0,
            "valid_days": 365,
            "bonus_features": ["AI 助教", "智能评测", "课程生成", "代码审查"]
        },
        {
            "name": "企业包",
            "package_type": TokenPackageType.ENTERPRISE,
            "token_count": 30000,
            "purchase_price": 4999.0,
            "valid_days": 365,
            "bonus_features": ["全部 AI 功能", "优先支持", "定制服务"]
        }
    ]
    
    for pkg_data in packages:
        # 检查是否已存在
        existing = db.query(LegacyTokenPackage).filter_by(name=pkg_data["name"]).first()
        if not existing:
            package = LegacyTokenPackage(**pkg_data, is_active=True)
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


def create_teachers(db: Session, organization: Organization):
    """为组织创建教师记录（独立于 User 表）"""
    teachers_config = {
        OrganizationType.TRAINING: [
            {"name": "张明华", "email": "zhang@starrobotics.edu.cn", "phone": "13800138001",
             "specialty": "Arduino 专家", "hourly_rate": 200},
            {"name": "李思远", "email": "li@starrobotics.edu.cn", "phone": "13800138002",
             "specialty": "Python 导师", "hourly_rate": 250},
            {"name": "王建国", "email": "wang@starrobotics.edu.cn", "phone": "13800138003",
             "specialty": "机器人教练", "hourly_rate": 220},
            {"name": "陈志强", "email": "chen@starrobotics.edu.cn", "phone": "13800138004",
             "specialty": "物联网讲师", "hourly_rate": 180},
        ],
        OrganizationType.K12: [
            {"name": "林老师", "email": "t01@xxprimary.edu.cn", "phone": "13900139001",
             "specialty": "3D 打印", "hourly_rate": 150},
            {"name": "黄老师", "email": "t02@xxprimary.edu.cn", "phone": "13900139002",
             "specialty": "编程教学", "hourly_rate": 160},
            {"name": "徐老师", "email": "t03@xxprimary.edu.cn", "phone": "13900139003",
             "specialty": "科学实验", "hourly_rate": 140},
        ],
        OrganizationType.VOCATIONAL: [
            {"name": "周教授", "email": "plc@xxvocational.edu.cn", "phone": "13700137001",
             "specialty": "PLC 控制", "hourly_rate": 300},
            {"name": "吴工程师", "email": "cnc@xxvocational.edu.cn", "phone": "13700137002",
             "specialty": "CNC 加工", "hourly_rate": 280},
            {"name": "郑技师", "email": "robot@xxvocational.edu.cn", "phone": "13700137003",
             "specialty": "工业机器人", "hourly_rate": 320},
        ],
        OrganizationType.BUREAU: [
            {"name": "孙分析师", "email": "analyst@xxedu.gov.cn", "phone": "13600136002",
             "specialty": "数据分析", "hourly_rate": 200},
            {"name": "李协调员", "email": "coord@xxedu.gov.cn", "phone": "13600136003",
             "specialty": "资源调配", "hourly_rate": 180},
        ],
    }
    config = teachers_config.get(organization.org_type, [])
    teachers = []
    for t_data in config:
        teacher = Teacher(
            org_id=organization.id,
            name=t_data["name"],
            email=t_data.get("email", ""),
            phone=t_data.get("phone", ""),
            specialty=t_data.get("specialty", ""),
            hourly_rate=t_data.get("hourly_rate", 150),
            is_active=True,
        )
        db.add(teacher)
        teachers.append(teacher)
    db.commit()
    print(f"[OK] 为 {organization.name} 创建 {len(teachers)} 个教师记录")
    return teachers


def create_courses(db: Session, organization: Organization, teachers: list):
    """为组织创建课程记录"""
    courses_config = {
        OrganizationType.TRAINING: [
            {"title": "Arduino 入门", "category": "硬件编程", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 1200, "teacher_idx": 0},
            {"title": "Python 基础编程", "category": "软件编程", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 1500, "teacher_idx": 1},
            {"title": "机器人设计与搭建", "category": "机器人", "difficulty": "intermediate",
             "duration_hours": 3, "purchase_price": 2000, "teacher_idx": 2},
            {"title": "物联网实战", "category": "硬件编程", "difficulty": "advanced",
             "duration_hours": 2, "purchase_price": 1800, "teacher_idx": 3},
            {"title": "Python 进阶算法", "category": "软件编程", "difficulty": "advanced",
             "duration_hours": 2, "purchase_price": 2200, "teacher_idx": 1},
            {"title": "竞赛机器人训练", "category": "机器人", "difficulty": "advanced",
             "duration_hours": 3, "purchase_price": 2500, "teacher_idx": 2},
        ],
        OrganizationType.K12: [
            {"title": "3D 打印入门", "category": "创客", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 800, "teacher_idx": 0},
            {"title": "Micro:bit 编程", "category": "编程", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 900, "teacher_idx": 1},
            {"title": "科学实验探究", "category": "科学", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 700, "teacher_idx": 2},
            {"title": "VR 创意设计", "category": "创客", "difficulty": "intermediate",
             "duration_hours": 2, "purchase_price": 1000, "teacher_idx": 0},
        ],
        OrganizationType.VOCATIONAL: [
            {"title": "PLC 编程基础", "category": "自动化", "difficulty": "beginner",
             "duration_hours": 3, "purchase_price": 3000, "teacher_idx": 0},
            {"title": "CNC 数控加工", "category": "制造", "difficulty": "intermediate",
             "duration_hours": 4, "purchase_price": 3500, "teacher_idx": 1},
            {"title": "工业机器人操作", "category": "自动化", "difficulty": "advanced",
             "duration_hours": 4, "purchase_price": 4000, "teacher_idx": 2},
            {"title": "嵌入式系统开发", "category": "电子", "difficulty": "advanced",
             "duration_hours": 3, "purchase_price": 3200, "teacher_idx": 0},
        ],
        OrganizationType.BUREAU: [
            {"title": "STEM 教育政策解读", "category": "管理", "difficulty": "beginner",
             "duration_hours": 2, "purchase_price": 0, "teacher_idx": 0},
            {"title": "教育数据分析", "category": "管理", "difficulty": "intermediate",
             "duration_hours": 2, "purchase_price": 0, "teacher_idx": 1},
        ],
    }
    config = courses_config.get(organization.org_type, [])
    courses = []
    for c_data in config:
        teacher = teachers[c_data["teacher_idx"]] if c_data["teacher_idx"] < len(teachers) else None
        course = Course(
            org_id=organization.id,
            title=c_data["title"],
            description=f"{c_data['category']} - {c_data['title']}",
            category=c_data["category"],
            difficulty=c_data.get("difficulty", "beginner"),
            duration_hours=c_data.get("duration_hours", 2),
            price=c_data.get("price", 0),
            is_active=True,
        )
        db.add(course)
        course._teacher_ref = teacher  # 临时属性，用于后续排课关联
        courses.append(course)
    db.commit()
    print(f"[OK] 为 {organization.name} 创建 {len(courses)} 个课程记录")
    return courses


def create_schedules(db: Session, organization: Organization, courses: list, classrooms: list, teachers: list):
    """为组织创建排课记录"""
    if not courses or not classrooms or not teachers:
        print(f"[SKIP] {organization.name} 缺少课程/教室/教师，跳过排课")
        return []

    # 时间槽配置: (day_of_week, start_hour, start_min, end_hour, end_min)
    time_slots = [
        (1, 9, 0, 10, 30),   # 周一 09:00-10:30
        (1, 14, 0, 15, 30),  # 周一 14:00-15:30
        (2, 9, 0, 10, 30),   # 周二 09:00-10:30
        (2, 14, 0, 15, 30),  # 周二 14:00-15:30
        (3, 9, 0, 10, 30),   # 周三 09:00-10:30
        (3, 14, 0, 15, 30),  # 周三 14:00-15:30
        (4, 9, 0, 10, 30),   # 周四 09:00-10:30
        (5, 14, 0, 15, 30),  # 周五 14:00-15:30
        (6, 9, 0, 11, 0),    # 周六 09:00-11:00
        (6, 14, 0, 16, 0),   # 周六 14:00-16:00
    ]

    # 计算本周周一的日期
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())

    schedules = []
    num_schedules = min(len(courses), len(time_slots), 10)

    day_labels = {1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日'}

    for i in range(num_schedules):
        course = courses[i]
        classroom = classrooms[i % len(classrooms)]
        teacher = course._teacher_ref if hasattr(course, '_teacher_ref') and course._teacher_ref else teachers[i % len(teachers)]
        slot = time_slots[i % len(time_slots)]
        day, sh, sm, eh, em = slot

        # 从本周开始，持续 12 周
        start_date = monday + timedelta(days=day - 1)
        start_dt = start_date.replace(hour=sh, minute=sm, second=0, microsecond=0)
        end_dt = start_date.replace(hour=eh, minute=em, second=0, microsecond=0)

        recurrence_rule = f"weekly;12"

        schedule = Schedule(
            org_id=organization.id,
            course_id=course.id,
            teacher_id=teacher.id,
            classroom_id=classroom.id,
            start_time=start_dt,
            end_time=end_dt,
            recurrence_rule=recurrence_rule,
            status=ScheduleStatus.PUBLISHED,
            max_students=classroom.capacity,
        )
        db.add(schedule)
        schedules.append(schedule)

    db.commit()
    print(f"[OK] 为 {organization.name} 创建 {len(schedules)} 个排课记录")
    return schedules


def create_vocational_demo_data(db: Session, voc_org: Organization):
    """
    为职业学校创建 vocational 模块演示数据（Phase 2-4）
    包括：实训设备/安全认证/合作企业/竞赛/实习/孵化/技能评估
    """
    from datetime import date, timedelta
    from models.vocational_equipment import (
        VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance,
        VocFaultReport, VocEquipmentCategory, VocEquipmentStatus,
        VocSafetyLevel, VocBorrowStatus, VocMaintenanceType,
    )
    from models.vocational_safety import (
        VocSafetyCertification, VocSafetyChecklist, VocIncidentReport,
        VocCourse as VocCourseModel, VocTrainingRoom, VocTrainingSchedule,
        VocSafetyCertStatus, VocIncidentType,
    )
    from models.vocational_cooperation import (
        VocEnterprise, VocEnterpriseDemand, VocCooperationProject,
        VocProjectMilestone, VocCompetition, VocCompetitionRegistration,
        VocInternshipPosition, VocInternshipRecord, VocEmploymentRecord,
        VocIncubatorProject, VocIncubatorMember,
    )
    from models.vocational_assessment import (
        VocSkillStandard, VocSkillAssessment, VocCertificate,
    )
    from models.user_organization import UserOrganization, UserOrganizationRole
    from models.base_models import User, Teacher

    org_id = voc_org.id

    # ==================== 1. 实训设备 ====================
    equipment_data = [
        {"name": "西门子 S7-1200 PLC 训练台 #1", "category": VocEquipmentCategory.PLC, "model": "S7-1200", "serial_number": "PLC-2026-001", "location_room": "PLC 控制实验室", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.WARNING, "purchase_date": date(2025, 9, 1), "purchase_price": 18000.0},
        {"name": "西门子 S7-1200 PLC 训练台 #2", "category": VocEquipmentCategory.PLC, "model": "S7-1200", "serial_number": "PLC-2026-002", "location_room": "PLC 控制实验室", "status": VocEquipmentStatus.IN_USE, "safety_level": VocSafetyLevel.WARNING, "purchase_date": date(2025, 9, 1), "purchase_price": 18000.0},
        {"name": "三轴数控铣床 #1", "category": VocEquipmentCategory.CNC, "model": "XK7132", "serial_number": "CNC-2026-001", "location_room": "CNC 加工车间", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.DANGEROUS, "purchase_date": date(2025, 6, 15), "purchase_price": 85000.0},
        {"name": "三轴数控铣床 #2", "category": VocEquipmentCategory.CNC, "model": "XK7132", "serial_number": "CNC-2026-002", "location_room": "CNC 加工车间", "status": VocEquipmentStatus.MAINTENANCE, "safety_level": VocSafetyLevel.DANGEROUS, "purchase_date": date(2025, 6, 15), "purchase_price": 85000.0},
        {"name": "ABB IRB 120 工业机器人", "category": VocEquipmentCategory.INDUSTRIAL_ROBOT, "model": "IRB 120", "serial_number": "ROBOT-2026-001", "location_room": "工业机器人实训室", "status": VocEquipmentStatus.IN_USE, "safety_level": VocSafetyLevel.DANGEROUS, "purchase_date": date(2025, 8, 20), "purchase_price": 120000.0},
        {"name": "ABB IRB 120 工业机器人 #2", "category": VocEquipmentCategory.INDUSTRIAL_ROBOT, "model": "IRB 120", "serial_number": "ROBOT-2026-002", "location_room": "工业机器人实训室", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.DANGEROUS, "purchase_date": date(2025, 8, 20), "purchase_price": 120000.0},
        {"name": "STM32 开发套件 #01", "category": VocEquipmentCategory.EMBEDDED, "model": "STM32F407", "serial_number": "EMB-2026-001", "location_room": "嵌入式开发实验室", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.NORMAL, "purchase_date": date(2025, 10, 1), "purchase_price": 3500.0},
        {"name": "STM32 开发套件 #02", "category": VocEquipmentCategory.EMBEDDED, "model": "STM32F407", "serial_number": "EMB-2026-002", "location_room": "嵌入式开发实验室", "status": VocEquipmentStatus.IN_USE, "safety_level": VocSafetyLevel.NORMAL, "purchase_date": date(2025, 10, 1), "purchase_price": 3500.0},
        {"name": "Factory IO 仿真工作站", "category": VocEquipmentCategory.AUTO_CONTROL, "model": "FIO-Pro", "serial_number": "AUTO-2026-001", "location_room": "工业自动化仿真室", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.NORMAL, "purchase_date": date(2025, 11, 1), "purchase_price": 28000.0},
        {"name": "万用表/示波器套件", "category": VocEquipmentCategory.INSTRUMENT, "model": "DS1054Z", "serial_number": "MEA-2026-001", "location_room": "电子测量室", "status": VocEquipmentStatus.AVAILABLE, "safety_level": VocSafetyLevel.NORMAL, "purchase_date": date(2025, 7, 1), "purchase_price": 4200.0},
    ]
    equipments = []
    for eq_data in equipment_data:
        eq = VocEquipment(org_id=org_id, **eq_data)
        db.add(eq)
        equipments.append(eq)
    db.commit()
    print(f"  [OK] 创建 {len(equipments)} 个实训设备")

    # 设备借用/维修/故障
    student = db.query(User).filter(User.username == "voc_s_001").first()
    if student and len(equipments) >= 8:
        borrow = VocEquipmentBorrow(
            org_id=org_id, equipment_id=equipments[7].id,
            borrower_id=student.id, borrower_name=student.full_name or "演示学生1",
            borrow_date=date(2026, 6, 10), expected_return_date=date(2026, 6, 25),
            status=VocBorrowStatus.ACTIVE,
        )
        db.add(borrow)

    teacher = db.query(Teacher).filter(Teacher.org_id == org_id).first()
    if teacher and len(equipments) >= 4:
        maint = VocEquipmentMaintenance(
            org_id=org_id, equipment_id=equipments[3].id,
            maintenance_type=VocMaintenanceType.REPAIR,
            description="主轴轴承异响，需更换轴承",
            maintainer=teacher.name, cost=3200.0,
        )
        db.add(maint)
        fault = VocFaultReport(
            org_id=org_id, equipment_id=equipments[3].id,
            reporter_id=teacher.id, reporter_name=teacher.name,
            description="加工时主轴异常噪音，精度下降",
            status="processing",
        )
        db.add(fault)
    db.commit()

    # ==================== 2. 实训室 ====================
    room_data_list = [
        {"name": "PLC 控制实验室", "building": "实训楼 A", "floor": "2F", "capacity": 20, "equipment_summary": "电气自动化"},
        {"name": "CNC 加工车间", "building": "实训楼 A", "floor": "1F", "capacity": 10, "equipment_summary": "机械加工"},
        {"name": "工业机器人实训室", "building": "实训楼 B", "floor": "1F", "capacity": 15, "equipment_summary": "机器人"},
        {"name": "嵌入式开发实验室", "building": "实训楼 A", "floor": "3F", "capacity": 30, "equipment_summary": "电子"},
        {"name": "工业自动化仿真室", "building": "实训楼 B", "floor": "2F", "capacity": 25, "equipment_summary": "仿真"},
    ]
    rooms = []
    for rd in room_data_list:
        room = VocTrainingRoom(org_id=org_id, is_active=True, **rd)
        db.add(room)
        rooms.append(room)
    db.commit()
    print(f"  [OK] 创建 {len(rooms)} 个实训室")

    # ==================== 3. 实训课程 ====================
    course_data_list = [
        {"name": "PLC 编程与调试", "major": "电气自动化", "total_hours": 72, "description": "西门子 S7-1200 PLC 编程与调试实训"},
        {"name": "CNC 数控加工工艺", "major": "数控技术", "total_hours": 96, "description": "三轴数控铣床编程与操作"},
        {"name": "工业机器人编程", "major": "机器人技术", "total_hours": 64, "description": "ABB IRB 120 机器人编程与调试"},
        {"name": "嵌入式系统开发", "major": "电子信息技术", "total_hours": 80, "description": "STM32 嵌入式系统开发实战"},
        {"name": "工业自动化仿真", "major": "自动化", "total_hours": 48, "description": "Factory IO 工业自动化仿真"},
        {"name": "电工电子技术基础", "major": "电气自动化", "total_hours": 56, "description": "电工基础与电子测量"},
    ]
    for cd in course_data_list:
        vc = VocCourseModel(org_id=org_id, is_active=True, **cd)
        db.add(vc)
    db.commit()
    print(f"  [OK] 创建 {len(course_data_list)} 门实训课程")

    # ==================== 4. 安全教育与认证 ====================
    teachers_in_org = db.query(User).join(UserOrganization).filter(
        UserOrganization.org_id == org_id,
        UserOrganization.role == UserOrganizationRole.TEACHER,
    ).all()
    students_in_org = db.query(User).join(UserOrganization).filter(
        UserOrganization.org_id == org_id,
        UserOrganization.role == UserOrganizationRole.STUDENT,
    ).all()[:5]

    cert_users = teachers_in_org + students_in_org
    for i, u in enumerate(cert_users):
        level = VocSafetyLevel.DANGEROUS if i < len(teachers_in_org) else VocSafetyLevel.WARNING
        cert = VocSafetyCertification(
            org_id=org_id, user_id=u.id, user_name=u.full_name or u.username,
            safety_level=level, exam_score=80 + (i * 3) % 20,
            exam_date=date(2026, 3, 15), expire_date=date(2027, 3, 15),
            status=VocSafetyCertStatus.ACTIVE,
        )
        db.add(cert)
    if students_in_org:
        expired = VocSafetyCertification(
            org_id=org_id, user_id=students_in_org[0].id,
            user_name=students_in_org[0].full_name or "演示学生",
            safety_level=VocSafetyLevel.NORMAL, exam_score=65,
            exam_date=date(2024, 6, 1), expire_date=date(2025, 6, 1),
            status=VocSafetyCertStatus.EXPIRED,
        )
        db.add(expired)
    if teachers_in_org:
        checklist = VocSafetyChecklist(
            org_id=org_id, location_room="CNC 加工车间",
            checker_id=teachers_in_org[0].id, checker_name=teachers_in_org[0].full_name or "周教授",
            items={"防护眼镜": True, "急停按钮": True, "冷却液": True, "照明": True, "噪音": True},
            passed=True, check_date=date(2026, 6, 20),
        )
        db.add(checklist)
    db.commit()
    print(f"  [OK] 创建 {len(cert_users) + 1} 条安全认证/巡检记录")

    # ==================== 5. 合作企业 ====================
    enterprise_data = [
        {"name": "华为技术有限公司", "industry": "通信/IT", "contact_person": "李经理", "contact_phone": "0755-28550001", "description": "全球领先的 ICT 解决方案提供商", "cooperation_start": date(2021, 3, 1)},
        {"name": "大族激光科技", "industry": "智能制造", "contact_person": "王总监", "contact_phone": "0755-29770001", "description": "激光加工设备制造龙头", "cooperation_start": date(2023, 6, 1)},
        {"name": "广州数控设备有限公司", "industry": "数控装备", "contact_person": "陈部长", "contact_phone": "020-81990001", "description": "CNC 数控系统制造商", "cooperation_start": date(2022, 1, 15)},
        {"name": "汇川技术", "industry": "自动化", "contact_person": "张主管", "contact_phone": "0755-86370001", "description": "工业自动化产品供应商", "cooperation_start": date(2024, 3, 1)},
        {"name": "拓普联科电子", "industry": "电子制造", "contact_person": "刘经理", "contact_phone": "0769-88990001", "description": "SMT/PCBA 制造服务商", "cooperation_start": date(2025, 1, 1)},
    ]
    enterprises = []
    for ed in enterprise_data:
        ent = VocEnterprise(org_id=org_id, is_active=True, **ed)
        db.add(ent)
        enterprises.append(ent)
    db.commit()
    print(f"  [OK] 创建 {len(enterprises)} 家合作企业")

    # 企业需求
    if enterprises:
        for dd in [
            {"org_id": org_id, "enterprise_id": enterprises[0].id, "demand_type": "实习生", "title": "急需 10 名自动化工程师实习生", "description": "自动化测试部门需求", "status": "active"},
            {"org_id": org_id, "enterprise_id": enterprises[1].id, "demand_type": "技能培训", "title": "激光加工设备操作培训需求", "description": "每年 2 期培训", "status": "active"},
            {"org_id": org_id, "enterprise_id": enterprises[2].id, "demand_type": "项目合作", "title": "五轴联动数控系统联合研发", "description": "校企联合技术攻关", "status": "active"},
        ]:
            db.add(VocEnterpriseDemand(**dd))
        db.commit()
        print("  [OK] 创建企业需求")

    # ==================== 6. 联合项目 ====================
    if enterprises:
        projs_data = [
            {"enterprise_id": enterprises[0].id, "name": "基于华为云的工业数据采集平台", "description": "利用华为云 IoT 实现 PLC 数据采集", "tech_field": "云计算/IoT", "stage": "prototype", "progress": 60,
             "school_supervisor": "周教授", "enterprise_supervisor": "李经理", "start_date": date(2026, 2, 1), "expected_end": date(2026, 8, 31), "total_funding": 50000.0, "status": "active"},
            {"enterprise_id": enterprises[1].id, "name": "激光切割工艺参数优化研究", "description": "多种材料激光切割参数建模优化", "tech_field": "激光加工", "stage": "testing", "progress": 80,
             "school_supervisor": "吴工程师", "enterprise_supervisor": "王总监", "start_date": date(2025, 9, 1), "expected_end": date(2026, 6, 30), "total_funding": 80000.0, "status": "active"},
            {"enterprise_id": enterprises[2].id, "name": "CNC 加工中心智能诊断系统", "description": "基于振动分析的设备故障预测", "tech_field": "智能制造", "stage": "design", "progress": 30,
             "school_supervisor": "郑技师", "enterprise_supervisor": "陈部长", "start_date": date(2026, 4, 1), "expected_end": date(2026, 12, 31), "total_funding": 60000.0, "status": "active"},
        ]
        for pd in projs_data:
            p = VocCooperationProject(org_id=org_id, **pd)
            db.add(p)
            db.flush()
            # milestone for first project
            if pd == projs_data[0]:
                for md in [
                    {"project_id": p.id, "name": "需求分析完成", "deadline": date(2026, 3, 1), "completed_at": datetime(2026, 2, 28, 10, 0, 0), "is_completed": True},
                    {"project_id": p.id, "name": "原型系统上线", "deadline": date(2026, 6, 1), "deliverable": "原型系统 v1.0", "is_completed": False},
                    {"project_id": p.id, "name": "验收交付", "deadline": date(2026, 8, 31), "is_completed": False},
                ]:
                    db.add(VocProjectMilestone(**md))
        db.commit()
        print(f"  [OK] 创建 {len(projs_data)} 个联合项目及里程碑")

    # ==================== 7. 技能竞赛 ====================
    competition_data = [
        {"name": "全国职业院校技能大赛-工业机器人技术应用", "sub_title": "工业机器人技术应用", "level": "national", "competition_date": date(2026, 5, 15), "registration_deadline": date(2026, 4, 1), "organizer": "教育部", "location": "广州", "status": "registration"},
        {"name": "广东省数控技能大赛", "sub_title": "数控加工", "level": "provincial", "competition_date": date(2026, 7, 20), "registration_deadline": date(2026, 6, 15), "organizer": "广东省人社厅", "location": "广州", "status": "registration"},
        {"name": "西门子杯中国智能制造挑战赛", "sub_title": "智能制造", "level": "national", "competition_date": date(2026, 8, 1), "registration_deadline": date(2026, 6, 30), "organizer": "西门子", "location": "北京", "status": "registration"},
        {"name": "校技能节-电子设计竞赛", "sub_title": "嵌入式", "level": "city", "competition_date": date(2026, 4, 10), "registration_deadline": date(2026, 3, 25), "organizer": "校实训中心", "location": "本校", "status": "ended"},
    ]
    comps = []
    for cd in competition_data:
        c = VocCompetition(org_id=org_id, **cd)
        db.add(c)
        comps.append(c)
    db.commit()
    print(f"  [OK] 创建 {len(comps)} 个技能竞赛")

    # 报名记录
    if comps and students_in_org:
        for i, s in enumerate(students_in_org[:3]):
            db.add(VocCompetitionRegistration(
                org_id=org_id, competition_id=comps[3].id, student_id=s.id,
                student_name=s.full_name or s.username, teacher_name="郑技师",
                score=85 + i * 5, award_level=["一等奖", "二等奖", "三等奖"][i],
            ))
        db.commit()
        print("  [OK] 创建竞赛报名/成绩记录")

    # ==================== 8. 实习就业 ====================
    if enterprises:
        for pd2 in [
            {"org_id": org_id, "enterprise_id": enterprises[0].id, "title": "自动化工程师实习生", "headcount": 5, "skill_requirements": "PLC 编程与调试", "status": "open"},
            {"org_id": org_id, "enterprise_id": enterprises[1].id, "title": "激光加工操作员", "headcount": 3, "skill_requirements": "激光切割机操作", "status": "open"},
            {"org_id": org_id, "enterprise_id": enterprises[4].id, "title": "SMT 技术员", "headcount": 8, "skill_requirements": "SMT 生产线操作", "status": "open"},
        ]:
            db.add(VocInternshipPosition(**pd2))
        db.commit()
        print("  [OK] 创建实习岗位")

    if enterprises and students_in_org:
        for rd in [
            {"org_id": org_id, "student_id": students_in_org[0].id, "student_name": students_in_org[0].full_name or "演示学生1",
             "enterprise_id": enterprises[0].id, "position": "自动化工程师实习生",
             "start_date": date(2026, 6, 1), "end_date": date(2026, 8, 31), "enterprise_mentor": "李工", "status": "ongoing"},
            {"org_id": org_id, "student_id": students_in_org[1].id, "student_name": students_in_org[1].full_name or "演示学生2",
             "enterprise_id": enterprises[1].id, "position": "激光加工操作员",
             "start_date": date(2026, 5, 15), "end_date": date(2026, 8, 15), "enterprise_mentor": "陈工", "status": "ongoing"},
        ]:
            db.add(VocInternshipRecord(**rd))
        db.commit()
        print("  [OK] 创建实习记录")

    if enterprises and len(students_in_org) > 2:
        db.add(VocEmploymentRecord(org_id=org_id, student_id=students_in_org[2].id,
            student_name=students_in_org[2].full_name or "演示学生3", enterprise_id=enterprises[2].id,
            position="CNC 编程员", salary=6500, location="广州", employment_date=date(2026, 7, 1)))
        if len(students_in_org) > 3:
            db.add(VocEmploymentRecord(org_id=org_id, student_id=students_in_org[3].id,
                student_name=students_in_org[3].full_name or "演示学生4", enterprise_id=enterprises[0].id,
                position="自动化技术员", salary=7200, location="深圳", employment_date=date(2026, 7, 15)))
        db.commit()
        print("  [OK] 创建就业记录")

    # ==================== 9. 双创孵化 ====================
    if students_in_org:
        for ip in [
            {"name": "智能垃圾分类回收机", "description": "基于 STM32 的智能垃圾分类回收原型机",
             "leader_id": students_in_org[0].id, "leader_name": students_in_org[0].full_name or "演示学生1",
             "mentor_name": "郑技师", "total_funding": 15000.0, "patent_applied": False,
             "stage": "prototype", "progress": 40, "status": "active"},
            {"name": "CNC 刀具磨损检测系统", "description": "基于振动频谱分析的刀具磨损在线检测系统",
             "leader_id": students_in_org[1].id, "leader_name": students_in_org[1].full_name or "演示学生2",
             "mentor_name": "吴工程师", "total_funding": 25000.0, "patent_applied": True,
             "stage": "testing", "progress": 70, "status": "active"},
        ]:
            db.add(VocIncubatorProject(org_id=org_id, **ip))
        db.commit()
        print("  [OK] 创建孵化项目")

    # ==================== 10. 技能标准/评估/证书 ====================
    skill_standards = []
    for sd in [
        {"skill_name": "西门子 PLC 编程", "major": "电气自动化", "skill_level": "中级", "description": "西门子 S7-1200 基本指令与梯形图编程", "assessment_criteria": "60分以上通过"},
        {"skill_name": "CNC 数控编程与操作", "major": "数控技术", "skill_level": "中级", "description": "数控铣床编程与加工操作", "assessment_criteria": "70分以上通过"},
        {"skill_name": "工业机器人编程", "major": "机器人技术", "skill_level": "中级", "description": "ABB IRB 120 机器人示教与编程", "assessment_criteria": "65分以上通过"},
        {"skill_name": "STM32 嵌入式开发", "major": "电子信息技术", "skill_level": "初级", "description": "STM32 基本外设驱动开发", "assessment_criteria": "60分以上通过"},
        {"skill_name": "电工安全操作", "major": "通用", "skill_level": "初级", "description": "电工安全知识与规范操作", "assessment_criteria": "80分以上通过"},
    ]:
        ss = VocSkillStandard(org_id=org_id, is_active=True, **sd)
        db.add(ss)
        db.flush()
        skill_standards.append(ss)
    db.commit()
    print("  [OK] 创建 5 个技能标准")

    if students_in_org:
        for i, s in enumerate(students_in_org[:4]):
            db.add(VocSkillAssessment(
                org_id=org_id, student_id=s.id, student_name=s.full_name or s.username,
                skill_id=skill_standards[i].id, score=70 + (i * 7) % 25,
                comment=["基础扎实", "操作熟练", "理解良好", "有提高空间"][i],
                evaluator_name=teachers_in_org[i % len(teachers_in_org)].full_name if teachers_in_org else "周教授",
                assessment_date=date(2026, 5, 10 + i),
            ))
        for i, s in enumerate(students_in_org[:4]):
            db.add(VocCertificate(
                org_id=org_id, student_id=s.id, student_name=s.full_name or s.username,
                cert_name=["PLC 编程中级证书", "数控加工中级证书", "工业机器人操作证书", "嵌入式开发初级证书"][i],
                cert_number=f"CERT-2026-{1000 + i:04d}", cert_level="中级",
                issuing_authority="中国职业技能鉴定中心", issue_date=date(2026, 3 + i, 15),
            ))
        db.commit()
        print("  [OK] 创建技能评估和证书记录")


def create_bureau_demo_data(db: Session, bureau_org: Organization):
    """
    为教育局创建 bureau 模块演示数据
    包括：学校监管、设备调配、师资培训、竞赛管理、经费管理、课程资源共享
    """
    from datetime import date, timedelta
    from models.user_organization import UserOrganization, UserOrganizationRole
    from models.base_models import User

    org_id = bureau_org.id

    # ==================== 1. 创建管辖学校 ====================
    school_orgs_data = [
        {"name": "梅山第一中学", "contact_email": "school1@msedu.gov.cn", "phone": "0574-88880001", "org_type": OrganizationType.K12, "max_users": 2000, "current_users": 1850},
        {"name": "梅山实验小学", "contact_email": "school2@msedu.gov.cn", "phone": "0574-88880002", "org_type": OrganizationType.K12, "max_users": 1500, "current_users": 1280},
        {"name": "梅山第二小学", "contact_email": "school3@msedu.gov.cn", "phone": "0574-88880003", "org_type": OrganizationType.K12, "max_users": 1200, "current_users": 960},
        {"name": "梅山职业技术学校", "contact_email": "school4@msedu.gov.cn", "phone": "0574-88880004", "org_type": OrganizationType.VOCATIONAL, "max_users": 3000, "current_users": 2150},
        {"name": "梅山镇中心小学", "contact_email": "school5@msedu.gov.cn", "phone": "0574-88880005", "org_type": OrganizationType.K12, "max_users": 800, "current_users": 620},
    ]
    school_orgs = []
    for sd in school_orgs_data:
        existing = db.query(Organization).filter(Organization.contact_email == sd["contact_email"]).first()
        if not existing:
            org_rec = Organization(**sd, address="", is_active=True)
            db.add(org_rec)
            db.flush()
            school_orgs.append(org_rec)
        else:
            school_orgs.append(existing)
    db.commit()
    print(f"  [OK] 创建/确认 {len(school_orgs)} 所管辖学校组织")

    # 创建 BureauSchool 记录
    school_configs = [
        {"org_idx": 0, "area": "县城片区", "stem_students": 320, "stem_teachers": 8, "score": 85, "rating": SchoolRating.EXCELLENT, "equip": EquipmentStatus.SUFFICIENT, "desc": "STEM 教育示范校，设备齐全，师资力量雄厚"},
        {"org_idx": 1, "area": "县城片区", "stem_students": 280, "stem_teachers": 6, "score": 78, "rating": SchoolRating.GOOD, "equip": EquipmentStatus.BASIC, "desc": "创客教育特色校，Micro:bit 课程全覆盖"},
        {"org_idx": 2, "area": "县城片区", "stem_students": 180, "stem_teachers": 4, "score": 65, "rating": SchoolRating.NEED_IMPROVEMENT, "equip": EquipmentStatus.SUFFICIENT, "desc": "新开设 STEM 课程，设备已配发但师资不足"},
        {"org_idx": 3, "area": "城郊片区", "stem_students": 450, "stem_teachers": 12, "score": 72, "rating": SchoolRating.GOOD, "equip": EquipmentStatus.SUFFICIENT, "desc": "职业 STEM 实训基地，设备投入充足"},
        {"org_idx": 4, "area": "乡镇片区", "stem_students": 85, "stem_teachers": 2, "score": 45, "rating": SchoolRating.WEAK, "equip": EquipmentStatus.SEVERE, "desc": "农村薄弱校，设备严重不足，急需帮扶"},
    ]
    bureau_schools = []
    for sc in school_configs:
        school_org = school_orgs[sc["org_idx"]]
        existing_bs = db.query(BureauSchool).filter(
            BureauSchool.bureau_id == org_id, BureauSchool.org_id == school_org.id
        ).first()
        if not existing_bs:
            bs = BureauSchool(
                bureau_id=org_id, org_id=school_org.id,
                district_area=sc["area"],
                stem_student_count=sc["stem_students"],
                stem_teacher_count=sc["stem_teachers"],
                stem_score=sc["score"], rating=sc["rating"],
                equipment_status=sc["equip"],
                description=sc["desc"], is_active=True,
            )
            db.add(bs)
            db.flush()
            bureau_schools.append(bs)
        else:
            bureau_schools.append(existing_bs)
    db.commit()
    print(f"  [OK] 创建 {len(bureau_schools)} 个 BureauSchool 记录")

    # ==================== 2. 学校评分历史 ====================
    today = date.today()
    for bs in bureau_schools:
        for i in range(6):
            month_date = today.replace(day=1) - timedelta(days=30 * i)
            base = bs.stem_score
            variance = (i * 2) % 15 - 7
            score_val = max(30, min(100, base + variance))
            existing = db.query(SchoolSTEMScore).filter(
                SchoolSTEMScore.school_id == bs.id,
                SchoolSTEMScore.score_date == month_date,
            ).first()
            if not existing:
                ss = SchoolSTEMScore(
                    school_id=bs.id, score_date=month_date,
                    overall_score=score_val,
                    curriculum_score=max(30, min(100, score_val - 5 + (i % 10))),
                    equipment_score=max(30, min(100, score_val + 3 - (i % 8))),
                    teacher_score=max(30, min(100, score_val - 2 + (i % 12))),
                    competition_score=max(30, min(100, score_val + (i % 15) - 5)),
                    coverage_score=max(30, min(100, score_val - 3 + (i % 10))),
                    evaluation=f"{month_date.month}月评分记录",
                )
                db.add(ss)
    db.commit()
    print("  [OK] 创建评分历史记录")

    # ==================== 3. 设备配发池 ====================
    equipment_items = [
        {"name": "Arduino 入门套件", "category": "Arduino套件", "unit": "套", "unit_price": 280, "total_qty": 200, "allocated": 145, "stock": 50, "transit": 5, "min_stock": 20, "supplier": "深圳创客科技"},
        {"name": "Micro:bit V2 开发板", "category": "Micro:bit", "unit": "块", "unit_price": 120, "total_qty": 500, "allocated": 380, "stock": 100, "transit": 20, "min_stock": 50, "supplier": "英国 ARM 授权"},
        {"name": "3D 打印机 (FDM)", "category": "3D打印机", "unit": "台", "unit_price": 4500, "total_qty": 15, "allocated": 10, "stock": 4, "transit": 1, "min_stock": 2, "supplier": "拓竹科技"},
        {"name": "无人机教育套装 (Tello)", "category": "无人机", "unit": "套", "unit_price": 899, "total_qty": 30, "allocated": 18, "stock": 10, "transit": 2, "min_stock": 5, "supplier": "大疆教育"},
        {"name": "传感器实验箱", "category": "传感器箱", "unit": "箱", "unit_price": 1680, "total_qty": 50, "allocated": 28, "stock": 20, "transit": 2, "min_stock": 10, "supplier": "上海STEM教育"},
        {"name": "VEX IQ 机器人竞赛套装", "category": "机器人竞赛套装", "unit": "套", "unit_price": 3200, "total_qty": 20, "allocated": 10, "stock": 8, "transit": 2, "min_stock": 3, "supplier": "VEX Robotics"},
        {"name": "焊接工作台套装", "category": "焊接工作台", "unit": "台", "unit_price": 1280, "total_qty": 40, "allocated": 25, "stock": 12, "transit": 3, "min_stock": 5, "supplier": "广州正点"},
        {"name": "树莓派 5 套装", "category": "树莓派", "unit": "套", "unit_price": 580, "total_qty": 80, "allocated": 45, "stock": 30, "transit": 5, "min_stock": 10, "supplier": "深圳微雪"},
    ]
    pool_items = []
    for ei in equipment_items:
        existing = db.query(BureauEquipmentPool).filter(
            BureauEquipmentPool.bureau_id == org_id, BureauEquipmentPool.name == ei["name"]
        ).first()
        if not existing:
            item = BureauEquipmentPool(
                bureau_id=org_id, name=ei["name"], category=ei["category"],
                unit=ei["unit"], unit_price=ei["unit_price"],
                total_quantity=ei["total_qty"],
                allocated_quantity=ei["allocated"],
                in_stock_quantity=ei["stock"],
                in_transit_quantity=ei["transit"],
                min_stock=ei["min_stock"], supplier=ei["supplier"],
                is_active=True,
            )
            db.add(item)
            db.flush()
            pool_items.append(item)
        else:
            pool_items.append(existing)
    db.commit()
    print(f"  [OK] 创建 {len(pool_items)} 个设备品类")

    # ==================== 4-9: 设备申请/共享/培训/竞赛/经费/课程 ====================
    if len(bureau_schools) >= 2 and len(pool_items) >= 3:
        pending_reqs = [
            {"school_idx": 4, "item_idx": 2, "qty": 2, "reason": "STEM 课程刚起步，急需 3D 打印机开展教学", "priority": "紧急"},
            {"school_idx": 4, "item_idx": 4, "qty": 5, "reason": "传感器设备老化严重，需替换补充", "priority": "紧急"},
            {"school_idx": 2, "item_idx": 5, "qty": 3, "reason": "准备参加市级机器人竞赛，需训练套件", "priority": "一般"},
        ]
        for pr in pending_reqs:
            existing_req = db.query(EquipmentRequest).filter(
                EquipmentRequest.bureau_id == org_id,
                EquipmentRequest.school_id == bureau_schools[pr["school_idx"]].id,
                EquipmentRequest.equipment_item_id == pool_items[pr["item_idx"]].id,
                EquipmentRequest.status == AllocationStatus.PENDING,
            ).first()
            if not existing_req:
                req = EquipmentRequest(
                    bureau_id=org_id,
                    school_id=bureau_schools[pr["school_idx"]].id,
                    equipment_item_id=pool_items[pr["item_idx"]].id,
                    quantity=pr["qty"], reason=pr["reason"],
                    priority=pr["priority"],
                )
                db.add(req)
    db.commit()
    print("  [OK] 创建设备配发申请")

    # Cross-school sharing
    if len(bureau_schools) >= 4 and len(pool_items) >= 2:
        shares_data = [
            {"from_idx": 0, "to_idx": 4, "item_idx": 1, "qty": 30, "days": 30, "reason": "薄弱校帮扶：共享 Micro:bit 开展教学"},
            {"from_idx": 1, "to_idx": 4, "item_idx": 3, "qty": 5, "days": 45, "reason": "薄弱校帮扶：共享无人机套装"},
            {"from_idx": 3, "to_idx": 2, "item_idx": 5, "qty": 2, "days": 60, "reason": "竞赛训练用 VEX 套件借用"},
        ]
        for sd in shares_data:
            existing_share = db.query(CrossSchoolSharing).filter(
                CrossSchoolSharing.bureau_id == org_id,
                CrossSchoolSharing.from_school_id == bureau_schools[sd["from_idx"]].id,
                CrossSchoolSharing.to_school_id == bureau_schools[sd["to_idx"]].id,
                CrossSchoolSharing.equipment_item_id == pool_items[sd["item_idx"]].id,
            ).first()
            if not existing_share:
                share = CrossSchoolSharing(
                    bureau_id=org_id,
                    from_school_id=bureau_schools[sd["from_idx"]].id,
                    to_school_id=bureau_schools[sd["to_idx"]].id,
                    equipment_item_id=pool_items[sd["item_idx"]].id,
                    quantity=sd["qty"],
                    borrow_date=today - timedelta(days=sd["days"] // 2),
                    expected_return_date=today + timedelta(days=sd["days"] // 2),
                    reason=sd["reason"],
                    status=SharingStatus.IN_USE,
                )
                db.add(share)
    db.commit()
    print("  [OK] 创建跨校设备共享记录")

    # ==================== Training ====================
    training_data = [
        {"title": "Micro:bit 编程教学入门", "trainer": "陈教授", "trainer_org": "浙江大学教育学院",
         "date": today + timedelta(days=14), "type": TrainingType.OFFLINE,
         "location": "县教师进修学校", "max": 50, "area": "全县", "status": TrainingSessionStatus.REGISTERING,
         "desc": "面向全县 STEM 教师的 Micro:bit 编程教学入门培训"},
        {"title": "3D 打印在 STEM 课程中的应用", "trainer": "王工", "trainer_org": "拓竹科技",
         "date": today + timedelta(days=30), "type": TrainingType.ONLINE,
         "location": "线上直播", "max": 100, "area": "全县", "status": TrainingSessionStatus.REGISTERING,
         "desc": "3D 打印技术在各学科教学中的创新应用案例"},
        {"title": "VEX IQ 机器人竞赛指导教师培训", "trainer": "张教练", "trainer_org": "中国机器人教育联盟",
         "date": today - timedelta(days=20), "type": TrainingType.OFFLINE,
         "location": "梅山第一中学", "max": 30, "area": "县城片区", "status": TrainingSessionStatus.COMPLETED,
         "desc": "VEX IQ 竞赛规则解读与指导策略"},
        {"title": "STEM 教育政策解读与教学创新", "trainer": "李副局长", "trainer_org": "县教育局",
         "date": today - timedelta(days=60), "type": TrainingType.OFFLINE,
         "location": "教育局会议室", "max": 80, "area": "全县", "status": TrainingSessionStatus.COMPLETED,
         "desc": "新课标 STEM 教育政策解读与优秀案例分享"},
    ]
    training_sessions = []
    for td in training_data:
        existing = db.query(TrainingSession).filter(
            TrainingSession.bureau_id == org_id, TrainingSession.title == td["title"]
        ).first()
        if not existing:
            ts = TrainingSession(
                bureau_id=org_id, title=td["title"], trainer=td["trainer"],
                trainer_org=td["trainer_org"], date=td["date"],
                type=td["type"], location=td["location"],
                max_attendees=td["max"], coverage_area=td["area"],
                status=td["status"], description=td["desc"],
            )
            db.add(ts)
            db.flush()
            training_sessions.append(ts)
        else:
            training_sessions.append(existing)
    db.commit()
    print(f"  [OK] 创建 {len(training_sessions)} 个培训场次")

    # 培训报名
    teacher_names = ["李明", "王芳", "张伟", "刘洋", "陈静", "周杰", "吴婷", "郑华"]
    for ts in training_sessions[:2]:
        reg_count = 0
        for i, school in enumerate(bureau_schools):
            for j in range(2 - i % 2):
                if reg_count >= ts.max_attendees:
                    break
                tname = teacher_names[(i * 2 + j) % len(teacher_names)]
                existing_reg = db.query(TrainingRegistration).filter(
                    TrainingRegistration.session_id == ts.id,
                    TrainingRegistration.school_id == school.id,
                    TrainingRegistration.teacher_name == tname,
                ).first()
                if not existing_reg:
                    reg = TrainingRegistration(
                        session_id=ts.id, school_id=school.id,
                        teacher_name=tname,
                        teacher_phone=f"138{1380000 + i * 100 + j:06d}",
                        is_attended=ts.status == TrainingSessionStatus.COMPLETED or j % 2 == 0,
                        score=75 + (i * 5 + j * 3) % 25 if ts.status == TrainingSessionStatus.COMPLETED else None,
                        certificate_issued=ts.status == TrainingSessionStatus.COMPLETED and j % 2 == 0,
                    )
                    db.add(reg)
                    reg_count += 1
        ts.current_attendees = db.query(TrainingRegistration).filter(
            TrainingRegistration.session_id == ts.id
        ).count()
    db.commit()
    print("  [OK] 创建培训报名记录")

    # ==================== Competitions ====================
    competitions_data = [
        {"name": "2026 年梅山县青少年科技创新大赛", "level": "县级",
         "organizer": "县教育局、县科协", "cdate": today + timedelta(days=60),
         "deadline": today + timedelta(days=20), "location": "梅山第一中学",
         "status": "报名中", "desc": "面向全县中小学生科技创新作品评选"},
        {"name": "2026 年宁波市青少年机器人竞赛", "level": "市级",
         "organizer": "宁波市教育局", "cdate": today + timedelta(days=90),
         "deadline": today + timedelta(days=45), "location": "宁波科学探索中心",
         "status": "报名中", "desc": "VEX IQ / 机器人巡线赛项"},
        {"name": "2025 年浙江省青少年创客大赛", "level": "省级",
         "organizer": "浙江省教育厅", "cdate": today - timedelta(days=120),
         "deadline": today - timedelta(days=150), "location": "杭州",
         "status": "已结束", "desc": "省级创客作品评选"},
        {"name": "2025 年梅山县中小学编程竞赛", "level": "县级",
         "organizer": "县教育局教研室", "cdate": today - timedelta(days=60),
         "deadline": today - timedelta(days=90), "location": "梅山实验小学",
         "status": "已结束", "desc": "Scratch / Python 编程竞赛"},
    ]
    competitions = []
    for cd in competitions_data:
        existing = db.query(BureauCompetition).filter(
            BureauCompetition.bureau_id == org_id, BureauCompetition.name == cd["name"]
        ).first()
        if not existing:
            comp = BureauCompetition(
                bureau_id=org_id, name=cd["name"], level=cd["level"],
                organizer=cd["organizer"], competition_date=cd["cdate"],
                registration_deadline=cd["deadline"], location=cd["location"],
                status=cd["status"], description=cd["desc"],
            )
            db.add(comp)
            db.flush()
            competitions.append(comp)
        else:
            competitions.append(existing)
    db.commit()
    print(f"  [OK] 创建 {len(competitions)} 个竞赛")

    # Award Results
    award_data = [
        {"comp_idx": 2, "school_idx": 0, "aname": "创客作品-智能垃圾分类", "alevel": AwardLevel.SECOND, "atype": "团体", "student": "", "teacher": "张明华"},
        {"comp_idx": 2, "school_idx": 0, "aname": "创客作品-智能浇花系统", "alevel": AwardLevel.THIRD, "atype": "个人", "student": "赵小明", "teacher": "张明华"},
        {"comp_idx": 2, "school_idx": 1, "aname": "创客作品-校园气象站", "alevel": AwardLevel.FIRST, "atype": "团体", "student": "", "teacher": "王芳"},
        {"comp_idx": 2, "school_idx": 3, "aname": "创客作品-工业安全检测", "alevel": AwardLevel.SECOND, "atype": "团体", "student": "", "teacher": "周教授"},
        {"comp_idx": 3, "school_idx": 1, "aname": "Scratch 编程赛项", "alevel": AwardLevel.FIRST, "atype": "个人", "student": "钱朵朵", "teacher": "王芳"},
        {"comp_idx": 3, "school_idx": 2, "aname": "Python 编程赛项", "alevel": AwardLevel.SECOND, "atype": "个人", "student": "孙小美", "teacher": "陈志强"},
        {"comp_idx": 3, "school_idx": 0, "aname": "Scratch 编程赛项", "alevel": AwardLevel.THIRD, "atype": "个人", "student": "李雷", "teacher": "李明"},
    ]
    for ad in award_data:
        if ad["comp_idx"] < len(competitions) and ad["school_idx"] < len(bureau_schools):
            existing = db.query(CompetitionResult).filter(
                CompetitionResult.competition_id == competitions[ad["comp_idx"]].id,
                CompetitionResult.school_id == bureau_schools[ad["school_idx"]].id,
                CompetitionResult.award_name == ad["aname"],
            ).first()
            if not existing:
                cr = CompetitionResult(
                    competition_id=competitions[ad["comp_idx"]].id,
                    school_id=bureau_schools[ad["school_idx"]].id,
                    award_name=ad["aname"], award_level=ad["alevel"],
                    award_type=ad["atype"], student_name=ad["student"],
                    teacher_name=ad["teacher"],
                    award_date=competitions[ad["comp_idx"]].competition_date or today,
                )
                db.add(cr)
    db.commit()
    print(f"  [OK] 创建 {len(award_data)} 条竞赛获奖记录")

    # ==================== Budget ====================
    existing_plan = db.query(BudgetPlan).filter(
        BudgetPlan.bureau_id == org_id, BudgetPlan.fiscal_year == 2026,
    ).first()
    if not existing_plan:
        plan = BudgetPlan(
            bureau_id=org_id, fiscal_year=2026,
            total_amount=1250000.00, spent_amount=486000.00,
            status=BudgetStatus.ACTIVE,
            description="2026 年度 STEM 教育专项经费",
        )
        db.add(plan)
        db.flush()
    else:
        plan = existing_plan
    db.commit()

    expense_data = [
        {"cat": ExpenseCategory.EQUIPMENT, "name": "采购 Micro:bit 开发板 200 块", "amt": 24000.00, "school_idx": None, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.EQUIPMENT, "name": "采购 3D 打印机 5 台", "amt": 22500.00, "school_idx": 4, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.EQUIPMENT, "name": "VEX IQ 竞赛套装 5 套", "amt": 16000.00, "school_idx": None, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.LAB_BUILDING, "name": "梅山镇小创客实验室建设", "amt": 120000.00, "school_idx": 4, "status": ExpenseStatus.PENDING},
        {"cat": ExpenseCategory.LAB_BUILDING, "name": "梅山一中创客空间升级", "amt": 85000.00, "school_idx": 0, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.TRAINING, "name": "全县 STEM 教师培训（上半年）", "amt": 65000.00, "school_idx": None, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.TRAINING, "name": "送教下乡专项经费", "amt": 35000.00, "school_idx": None, "status": ExpenseStatus.PENDING},
        {"cat": ExpenseCategory.COMPETITION, "name": "县青少年科技创新大赛", "amt": 80000.00, "school_idx": None, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.COMPETITION, "name": "市机器人竞赛参赛费", "amt": 15000.00, "school_idx": None, "status": ExpenseStatus.PENDING},
        {"cat": ExpenseCategory.CURRICULUM, "name": "STEM 课程资源开发", "amt": 35000.00, "school_idx": None, "status": ExpenseStatus.PAID},
        {"cat": ExpenseCategory.OTHER, "name": "STEM 教育宣传物料", "amt": 8500.00, "school_idx": None, "status": ExpenseStatus.PAID},
    ]
    for ed in expense_data:
        existing_exp = db.query(BudgetExpense).filter(
            BudgetExpense.budget_plan_id == plan.id,
            BudgetExpense.item_name == ed["name"],
        ).first()
        if not existing_exp:
            expense = BudgetExpense(
                budget_plan_id=plan.id, category=ed["cat"],
                item_name=ed["name"], amount=ed["amt"],
                school_id=bureau_schools[ed["school_idx"]].id if ed["school_idx"] is not None else None,
                expense_date=today - timedelta(days=len(expense_data) * 10 - expense_data.index(ed) * 10),
                status=ed["status"],
            )
            db.add(expense)
    db.commit()
    print("  [OK] 创建经费预算及支出记录")

    # ==================== Curriculum Resources ====================
    curriculum_data = [
        {"title": "Micro:bit 趣味编程 12 课", "cat": CurriculumCategory.PROGRAMMING,
         "grade": "3-6年级", "author": "王芳", "school_idx": 1,
         "file_type": "教案", "desc": "含教案、课件、课后练习全套资源", "status": CurriculumStatus.PUBLISHED},
        {"title": "Arduino 智能家居项目式学习", "cat": CurriculumCategory.ELECTRONICS,
         "grade": "7-9年级", "author": "李明", "school_idx": 0,
         "file_type": "教案", "desc": "基于 Arduino 的智能家居项目，含源码和电路图", "status": CurriculumStatus.PUBLISHED},
        {"title": "3D 打印笔创意设计指南", "cat": CurriculumCategory.DESIGN_3D,
         "grade": "1-6年级", "author": "陈静", "school_idx": 1,
         "file_type": "课件", "desc": "3D 打印笔入门教学课件", "status": CurriculumStatus.PUBLISHED},
        {"title": "VEX IQ 机器人竞赛手册", "cat": CurriculumCategory.ROBOTICS,
         "grade": "5-9年级", "author": "张伟", "school_idx": 0,
         "file_type": "教案", "desc": "VEX IQ 竞赛搭建与编程指导", "status": CurriculumStatus.PUBLISHED},
        {"title": "传感器探究实验系列", "cat": CurriculumCategory.SCIENCE,
         "grade": "3-8年级", "author": "刘洋", "school_idx": 2,
         "file_type": "教案", "desc": "温度、湿度、光照、声音等传感器实验", "status": CurriculumStatus.PUBLISHED},
        {"title": "Scratch 与硬件交互入门", "cat": CurriculumCategory.PROGRAMMING,
         "grade": "3-6年级", "author": "郑老师", "school_idx": 4,
         "file_type": "课件", "desc": "Scratch 控制 Micro:bit 入门", "status": CurriculumStatus.PENDING},
    ]
    for cd in curriculum_data:
        if cd["school_idx"] < len(bureau_schools):
            existing_res = db.query(BureauCurriculumResource).filter(
                BureauCurriculumResource.bureau_id == org_id,
                BureauCurriculumResource.title == cd["title"],
            ).first()
            if not existing_res:
                res = BureauCurriculumResource(
                    bureau_id=org_id,
                    school_id=bureau_schools[cd["school_idx"]].id,
                    title=cd["title"], category=cd["cat"],
                    grade_range=cd["grade"], author=cd["author"],
                    file_type=cd["file_type"], description=cd["desc"],
                    download_count=20 + curriculum_data.index(cd) * 15,
                    rating=4.0 + (curriculum_data.index(cd) % 3) * 0.3,
                    status=cd["status"],
                )
                db.add(res)
    db.commit()
    print(f"  [OK] 创建 {len(curriculum_data)} 个课程资源")
    print(f"[OK] 教育局演示数据创建完成（{bureau_org.name}）")


def seed_demo_data():
    """主函数：执行所有种子数据创建"""
    from models.user_organization import UserOrganization, UserOrganizationRole

    # 确认所有表已创建（包括 bureau_models 新增的表）
    # 先删除所有表重建（之前 CASCADE drop 损坏了多个表的列）
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
    except Exception:
        pass
    Base.metadata.create_all(bind=engine)

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
            # 导入所有可能用到的 model
            from models.vocational_assessment import VocSkillAssessment, VocCertificate, VocSkillStandard
            from models.vocational_cooperation import VocIncubatorProject, VocEmploymentRecord, VocInternshipRecord, VocInternshipPosition, VocCompetitionRegistration, VocCompetition, VocCooperationProject, VocProjectMilestone, VocEnterpriseDemand, VocEnterprise, VocIncubatorMember
            from models.vocational_safety import VocSafetyCertification, VocSafetyChecklist, VocIncidentReport, VocCourse as VocCourseModel, VocTrainingRoom, VocTrainingSchedule
            from models.vocational_equipment import VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance, VocFaultReport, VocInventoryRecord
            from models.bureau_models import (
                BureauSchool, SchoolSTEMScore, BureauEquipmentPool, EquipmentRequest, EquipmentAllocation,
                CrossSchoolSharing, TrainingSession, TrainingRegistration, BureauCompetition, CompetitionResult,
                BudgetPlan, BudgetExpense, BureauCurriculumResource,
            )
            from models.club import Club, ClubMember, ClubActivity, ClubAttendance, ClubRecruitment, ClubApplication
            from models.student import Student, Enrollment, AttendanceRecord
            from models.hardware_device import HardwareDevice, DeviceMaintenanceRecord, DeviceUsageLog
            
            for org in existing_orgs:
                oid = org.id
                # Vocational
                db.query(VocSkillAssessment).filter_by(org_id=oid).delete()
                db.query(VocCertificate).filter_by(org_id=oid).delete()
                db.query(VocSkillStandard).filter_by(org_id=oid).delete()
                ip_ids = [p[0] for p in db.query(VocIncubatorProject.id).filter_by(org_id=oid).all()]
                if ip_ids:
                    db.query(VocIncubatorMember).filter(VocIncubatorMember.project_id.in_(ip_ids)).delete(synchronize_session=False)
                db.query(VocIncubatorProject).filter_by(org_id=oid).delete()
                db.query(VocEmploymentRecord).filter_by(org_id=oid).delete()
                db.query(VocInternshipRecord).filter_by(org_id=oid).delete()
                db.query(VocInternshipPosition).filter_by(org_id=oid).delete()
                db.query(VocCompetitionRegistration).filter_by(org_id=oid).delete()
                db.query(VocCompetition).filter_by(org_id=oid).delete()
                cp_ids = [p[0] for p in db.query(VocCooperationProject.id).filter_by(org_id=oid).all()]
                if cp_ids:
                    db.query(VocProjectMilestone).filter(VocProjectMilestone.project_id.in_(cp_ids)).delete(synchronize_session=False)
                db.query(VocCooperationProject).filter_by(org_id=oid).delete()
                db.query(VocEnterpriseDemand).filter_by(org_id=oid).delete()
                db.query(VocEnterprise).filter_by(org_id=oid).delete()
                db.query(VocSafetyCertification).filter_by(org_id=oid).delete()
                db.query(VocSafetyChecklist).filter_by(org_id=oid).delete()
                db.query(VocIncidentReport).filter_by(org_id=oid).delete()
                db.query(VocTrainingSchedule).filter_by(org_id=oid).delete()
                db.query(VocTrainingRoom).filter_by(org_id=oid).delete()
                db.query(VocCourseModel).filter_by(org_id=oid).delete()
                db.query(VocInventoryRecord).filter_by(org_id=oid).delete()
                db.query(VocFaultReport).filter_by(org_id=oid).delete()
                db.query(VocEquipmentMaintenance).filter_by(org_id=oid).delete()
                db.query(VocEquipmentBorrow).filter_by(org_id=oid).delete()
                db.query(VocEquipment).filter_by(org_id=oid).delete()
                
                # Bureau 模块
                db.query(BureauCurriculumResource).filter_by(bureau_id=oid).delete()
                db.query(BudgetExpense).filter(
                    BudgetExpense.budget_plan_id.in_(
                        db.query(BudgetPlan.id).filter_by(bureau_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(BudgetPlan).filter_by(bureau_id=oid).delete()
                db.query(CompetitionResult).filter(
                    CompetitionResult.competition_id.in_(
                        db.query(BureauCompetition.id).filter_by(bureau_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(BureauCompetition).filter_by(bureau_id=oid).delete()
                db.query(TrainingRegistration).filter(
                    TrainingRegistration.session_id.in_(
                        db.query(TrainingSession.id).filter_by(bureau_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(TrainingSession).filter_by(bureau_id=oid).delete()
                db.query(CrossSchoolSharing).filter_by(bureau_id=oid).delete()
                db.query(EquipmentAllocation).filter(
                    EquipmentAllocation.request_id.in_(
                        db.query(EquipmentRequest.id).filter_by(bureau_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(EquipmentRequest).filter_by(bureau_id=oid).delete()
                db.query(BureauEquipmentPool).filter_by(bureau_id=oid).delete()
                db.query(SchoolSTEMScore).filter(
                    SchoolSTEMScore.school_id.in_(
                        db.query(BureauSchool.id).filter_by(bureau_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(BureauSchool).filter_by(bureau_id=oid).delete()
                
                # STEM 社团 & 耗材
                db.query(ClubApplication).filter_by(org_id=oid).delete()
                db.query(ClubAttendance).filter_by(org_id=oid).delete()
                db.query(ClubRecruitment).filter_by(org_id=oid).delete()
                db.query(ClubActivity).filter_by(org_id=oid).delete()
                db.query(ClubMember).filter_by(org_id=oid).delete()
                db.query(Club).filter_by(org_id=oid).delete()
                
                # STEM 耗材
                from models.consumable import ConsumablePurchaseRequest, PurchaseRequestItem, ConsumableUsage, Consumable
                db.query(PurchaseRequestItem).filter(
                    PurchaseRequestItem.request_id.in_(
                        db.query(ConsumablePurchaseRequest.id).filter_by(org_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(ConsumablePurchaseRequest).filter_by(org_id=oid).delete()
                db.query(ConsumableUsage).filter_by(org_id=oid).delete()
                db.query(Consumable).filter_by(org_id=oid).delete()
                
                # STEM Token
                from models.token_billing import TokenBalance, TokenOrder, TokenPackage, TokenTransaction, TokenUsageLog
                db.query(TokenTransaction).filter_by(org_id=oid).delete()
                db.query(TokenUsageLog).filter_by(org_id=oid).delete()
                db.query(TokenOrder).filter_by(org_id=oid).delete()
                db.query(TokenBalance).filter_by(org_id=oid).delete()
                db.query(TokenPackage).filter_by(org_id=oid).delete()
                
                # STEM 项目
                from models.stem_project import STEMProject, ProjectStudent, ProjectResource, ProjectMilestone
                from models.maker_space import EquipmentSlot
                db.query(EquipmentSlot).filter_by(org_id=oid).delete()
                db.query(ProjectStudent).filter_by(org_id=oid).delete()
                db.query(ProjectResource).filter_by(org_id=oid).delete()
                db.query(ProjectMilestone).filter_by(org_id=oid).delete()
                db.query(STEMProject).filter_by(org_id=oid).delete()
                
                # 硬件设备
                db.query(DeviceMaintenanceRecord).filter_by(org_id=oid).delete()
                db.query(DeviceUsageLog).filter_by(org_id=oid).delete()
                db.query(EquipmentSlot).filter_by(org_id=oid).delete()
                db.query(HardwareDevice).filter_by(org_id=oid).delete()
                
                # 学生 + 相关
                from models.parent_portal import ClassFeedback, ParentMessage, StudentAchievement
                from models.competition import ExamRegistration
                db.query(ParentMessage).filter_by(org_id=oid).delete()
                db.query(StudentAchievement).filter_by(org_id=oid).delete()
                db.query(ExamRegistration).filter_by(org_id=oid).delete()
                db.query(ClassFeedback).filter_by(org_id=oid).delete()
                db.query(AttendanceRecord).filter_by(org_id=oid).delete()
                db.query(Enrollment).filter_by(org_id=oid).delete()
                db.query(Student).filter_by(org_id=oid).delete()
                
                # 证书（certifications）
                from models.competition import Certification
                db.query(Certification).filter_by(org_id=oid).delete()
                
                # 排课 & 结算
                from models.schedule import Settlement
                db.query(Settlement).filter(
                    Settlement.teacher_id.in_(
                        db.query(Teacher.id).filter_by(org_id=oid).subquery()
                    )
                ).delete(synchronize_session=False)
                db.query(Schedule).filter_by(org_id=oid).delete()
                
                # 教师 & 课程
                db.query(Teacher).filter_by(org_id=oid).delete()
                db.query(Course).filter_by(org_id=oid).delete()
                
                # 教室 & 空间
                from models.maker_space import MakerSpace, SpaceBooking
                db.query(SpaceBooking).filter_by(org_id=oid).delete()
                db.query(MakerSpace).filter_by(org_id=oid).delete()
                db.query(Classroom).filter_by(org_id=oid).delete()
                
                # 营销 & 通知 & 线索
                from models.schedule import Lead, LeadFollowUp
                from models.notification import Notification
                from models.marketing import MarketingCampaign, Coupon, SocialMediaAccount
                db.query(Coupon).filter_by(org_id=oid).delete()
                db.query(MarketingCampaign).filter_by(org_id=oid).delete()
                db.query(Notification).filter_by(org_id=oid).delete()
                db.query(LeadFollowUp).filter_by(org_id=oid).delete()
                db.query(Lead).filter_by(org_id=oid).delete()
                
                # 备份/恢复
                from models.backup import BackupSnapshot, RestoreOperation
                db.query(RestoreOperation).filter_by(org_id=oid).delete()
                db.query(BackupSnapshot).filter_by(org_id=oid).delete()
                
                # 资源 & 社交媒体
                from models.resource import TeachingResource, ResourceCategory
                db.query(ResourceCategory).filter_by(org_id=oid).delete()
                db.query(TeachingResource).filter_by(org_id=oid).delete()
                db.query(SocialMediaAccount).filter_by(org_id=oid).delete()
                
                # 租户配置
                from models.tenant import TenantConfig, TenantFeatureFlag
                db.query(TenantFeatureFlag).filter_by(org_id=oid).delete()
                db.query(TenantConfig).filter_by(org_id=oid).delete()
                
                # 许可证 & Token
                lic_ids = [l.id for l in org.licenses]
                if lic_ids:
                    db.query(UserLicense).filter(UserLicense.license_id.in_(lic_ids)).delete(synchronize_session=False)
                db.query(License).filter_by(organization_id=oid).delete()
                for uid in all_user_ids:
                    db.query(UserTokenBalance).filter_by(user_id=uid).delete()
                db.query(UserOrganization).filter_by(org_id=oid).delete()

            # 删除用户
            for uid in all_user_ids:
                db.query(User).filter_by(id=uid).delete()
            # 删除组织
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
            classrooms = create_classrooms(db, org)
            
            # 创建用户
            users = create_users(db, org)
            
            # 创建许可证并分配
            create_licenses_and_assign(db, org, users)
            
            # 为管理员创建 Token 余额
            create_user_token_balances(db, org)
            
            # 创建教师记录
            teachers = create_teachers(db, org)
            
            # 创建课程记录
            courses = create_courses(db, org, teachers)
            
            # 创建排课记录
            create_schedules(db, org, courses, classrooms, teachers)
        
        # 为职业学校创建 vocational 模块演示数据
        for org in organizations:
            if org.org_type == OrganizationType.VOCATIONAL:
                print(f"\n处理 Vocational 模块数据: {org.name}")
                create_vocational_demo_data(db, org)
        
        # 为教育局创建 bureau 模块演示数据
        for org in organizations:
            if org.org_type == OrganizationType.BUREAU:
                print(f"\n处理 Bureau 模块数据: {org.name}")
                create_bureau_demo_data(db, org)
        
        # 3. 为所有组织创建剩余表演示数据（社团/耗材/设备/项目/营销/家长/学生/竞赛/备份/Token/配置/通知/资源/线索）
        print("\n步骤 3: 创建其他模块演示数据")
        from scripts.seed_remaining_tables import create_all_remaining_demo_data
        create_all_remaining_demo_data(db, organizations)
        db.commit()
        
        print("\nDemo 数据创建完成！")
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
