"""
OpenMT Demo 数据种子脚本 — STEM 完整演示版
在已有的基础数据之上，补充 STEM 教育管理所需的完整演示数据（社团、耗材、设备、项目等）
"""

from datetime import datetime, date, timedelta
import random

from sqlalchemy.orm import Session
from models.license import Organization, OrganizationType
from models.base_models import User
from models.student import Student, StudentStatus, Gender
from models.club import (
    Club, ClubMember, ClubActivity, ClubAttendance, ClubRecruitment, ClubApplication,
    ClubCategory, ClubStatus, ClubMemberRole, ClubMemberStatus,
    ActivityType, AttendanceStatus, ApplicationStatus,
)
from models.consumable import (
    Consumable, ConsumableUsage, ConsumablePurchaseRequest, PurchaseRequestItem,
    ConsumableCategory, PurchaseRequestStatus,
)
from models.hardware_device import HardwareDevice, DeviceStatus, DeviceCategory
from models.stem_project import STEMProject, ProjectStatus, ProjectCategory, ProjectDifficulty
from models.competition import Competition, CompetitionRegistration, CompetitionLevel, CompetitionCategory, CompetitionStatus
from models.maker_space import MakerSpace, SpaceBooking, SpaceType, SpaceStatus, BookingStatus
from utils.database import SessionLocal
from scripts.seed_demo_data import (
    create_demo_organizations, create_classrooms, create_users,
    create_licenses_and_assign, create_token_packages, create_user_token_balances,
    create_teachers, create_courses, create_schedules, DEMO_PASSWORD,
)
from utils.auth_utils import hash_password

# ---------- STEM 演示数据配置 ----------

STEM_CLUB_CONFIG = [
    {
        "name": "机器人挑战社团",
        "category": ClubCategory.ROBOTICS,
        "description": "学习机器人搭建与编程，参加 FLL、VEX 等竞赛。每周四下午 15:30-17:00 活动。",
        "grade_range_min": 3, "grade_range_max": 6,
        "max_members": 25, "require_interview": True,
        "leader_teacher_name": "林老师",
        "semester": "2026-spring", "school_year": "2025-2026",
    },
    {
        "name": "Python 编程社",
        "category": ClubCategory.PROGRAMMING,
        "description": "从 Scratch 过渡到 Python，学习编程基础、算法和游戏开发。",
        "grade_range_min": 4, "grade_range_max": 8,
        "max_members": 30,
        "leader_teacher_name": "黄老师",
        "semester": "2026-spring", "school_year": "2025-2026",
    },
    {
        "name": "3D 打印创客工坊",
        "category": ClubCategory.PRINTING_3D,
        "description": "使用 Tinkercad 和 Fusion 360 设计模型，用 3D 打印机实现创意。",
        "grade_range_min": 3, "grade_range_max": 7,
        "max_members": 20,
        "leader_teacher_name": "林老师",
        "semester": "2026-spring", "school_year": "2025-2026",
    },
    {
        "name": "科学实验探索社",
        "category": ClubCategory.SCIENCE_EXP,
        "description": "动手做物理、化学、生物实验，培养科学思维和探究能力。",
        "grade_range_min": 2, "grade_range_max": 5,
        "max_members": 28,
        "leader_teacher_name": "徐老师",
        "semester": "2026-spring", "school_year": "2025-2026",
    },
    {
        "name": "无人机飞行俱乐部",
        "category": ClubCategory.DRONE,
        "description": "学习无人机原理、组装、编程飞行，参与无人机竞速和航拍。",
        "grade_range_min": 4, "grade_range_max": 8,
        "max_members": 15, "require_interview": True,
        "leader_teacher_name": "黄老师",
        "semester": "2026-spring", "school_year": "2025-2026",
    },
]

STEM_CONSUMABLE_CONFIG = [
    {"name": "PLA 3D 打印耗材（白色）", "category": ConsumableCategory.FILAMENT_3D, "specification": "PLA 1.75mm 白色 1kg", "unit": "卷", "unit_price": 89.0, "token_price": 10, "current_stock": 15, "min_stock": 5, "max_stock": 30, "supplier": "京东耗材旗舰店"},
    {"name": "PLA 3D 打印耗材（黑色）", "category": ConsumableCategory.FILAMENT_3D, "specification": "PLA 1.75mm 黑色 1kg", "unit": "卷", "unit_price": 89.0, "token_price": 10, "current_stock": 3, "min_stock": 5, "max_stock": 30, "supplier": "京东耗材旗舰店", "is_low": True},
    {"name": "Arduino UNO 开发板", "category": ConsumableCategory.ELECTRONIC, "specification": "Arduino UNO R3", "unit": "块", "unit_price": 45.0, "token_price": 5, "current_stock": 25, "min_stock": 10, "max_stock": 50, "supplier": "创客商城"},
    {"name": "杜邦线公对母（40根）", "category": ConsumableCategory.WIRE_CABLE, "specification": "20cm 公对母 40根/包", "unit": "包", "unit_price": 3.5, "token_price": 1, "current_stock": 50, "min_stock": 20, "max_stock": 100, "supplier": "电子元器件批发"},
    {"name": "LED 灯珠（5mm 彩色）", "category": ConsumableCategory.ELECTRONIC, "specification": "5mm 红黄蓝绿白 100颗/盒", "unit": "盒", "unit_price": 8.0, "token_price": 1, "current_stock": 12, "min_stock": 5, "max_stock": 20, "supplier": "电子元器件批发"},
    {"name": "超声波传感器 HC-SR04", "category": ConsumableCategory.SENSOR, "specification": "HC-SR04 5V", "unit": "个", "unit_price": 6.0, "token_price": 2, "current_stock": 2, "min_stock": 5, "max_stock": 20, "supplier": "创客商城", "is_low": True},
    {"name": "Micro:bit 扩展板", "category": ConsumableCategory.ELECTRONIC, "specification": "Micro:bit IO扩展板", "unit": "块", "unit_price": 35.0, "token_price": 5, "current_stock": 18, "min_stock": 5, "max_stock": 30, "supplier": "Micro:bit 官方"},
    {"name": "M3 螺丝螺母套装", "category": ConsumableCategory.FASTENER, "specification": "M3*10mm 不锈钢 50套", "unit": "套", "unit_price": 12.0, "token_price": 1, "current_stock": 8, "min_stock": 5, "max_stock": 20, "supplier": "五金商城"},
    {"name": "面包板 830孔", "category": ConsumableCategory.ELECTRONIC, "specification": "830孔 透明面包板", "unit": "块", "unit_price": 8.0, "token_price": 1, "current_stock": 30, "min_stock": 10, "max_stock": 50, "supplier": "创客商城"},
    {"name": "锂电池 18650（2节）", "category": ConsumableCategory.BATTERY, "specification": "18650 3.7V 3000mAh 2节", "unit": "对", "unit_price": 25.0, "token_price": 3, "current_stock": 10, "min_stock": 5, "max_stock": 20, "supplier": "电池专营店"},
]

HARDWARE_DEVICE_CONFIG = [
    {"name": "Ultimaker S3 3D 打印机", "category": DeviceCategory.PRINTER_3D, "model": "Ultimaker S3", "status": DeviceStatus.AVAILABLE, "location": "3D 打印实验室"},
    {"name": "Ultimaker S3 3D 打印机 #2", "category": DeviceCategory.PRINTER_3D, "model": "Ultimaker S3", "status": DeviceStatus.IN_USE, "location": "3D 打印实验室"},
    {"name": "Glowforge Pro 激光切割机", "category": DeviceCategory.OTHER, "model": "Glowforge Pro", "status": DeviceStatus.AVAILABLE, "location": "激光切割工坊"},
    {"name": "Oculus Quest 2 VR 套装", "category": DeviceCategory.VR_DEVICE, "model": "Quest 2 128GB", "status": DeviceStatus.AVAILABLE, "location": "VR 体验室"},
    {"name": "Oculus Quest 2 VR 套装 #2", "category": DeviceCategory.VR_DEVICE, "model": "Quest 2 128GB", "status": DeviceStatus.MAINTENANCE, "location": "VR 体验室"},
    {"name": "DJI Mini 4 Pro 无人机", "category": DeviceCategory.DRONE, "model": "DJI Mini 4 Pro", "status": DeviceStatus.AVAILABLE, "location": "无人机训练场"},
    {"name": "DJI Mini 4 Pro 无人机 #2", "category": DeviceCategory.DRONE, "model": "DJI Mini 4 Pro", "status": DeviceStatus.IN_USE, "location": "无人机训练场"},
    {"name": "树莓派 5 开发套件", "category": DeviceCategory.RASPBERRY_PI, "model": "Raspberry Pi 5 8GB", "status": DeviceStatus.AVAILABLE, "location": "科学实验数据分析室"},
    {"name": "树莓派 5 开发套件 #2", "category": DeviceCategory.RASPBERRY_PI, "model": "Raspberry Pi 5 8GB", "status": DeviceStatus.IN_USE, "location": "科学实验数据分析室"},
    {"name": "VEX IQ 机器人竞赛套装", "category": DeviceCategory.ROBOT, "model": "VEX IQ 2代", "status": DeviceStatus.AVAILABLE, "location": "机器人竞赛室"},
    {"name": "LEGO Spike Prime 套装", "category": DeviceCategory.ROBOT, "model": "Spike Prime 45676", "status": DeviceStatus.AVAILABLE, "location": "Micro:bit 教室"},
    {"name": "Arduino 教学套件（10套）", "category": DeviceCategory.ARDUINO, "model": "Arduino STEM 教育套件", "status": DeviceStatus.IN_USE, "location": "Micro:bit 教室"},
]

STEM_PROJECT_CONFIG = [
    {"name": "智能温室监控系统", "category": ProjectCategory.IOT, "difficulty": ProjectDifficulty.INTERMEDIATE,
     "description": "使用 Arduino + 温湿度传感器 + 土壤湿度传感器搭建智能温室，实现自动浇水和远程监控。",
     "status": ProjectStatus.IN_PROGRESS, "students_count": 4},
    {"name": "垃圾分类识别机器人", "category": ProjectCategory.AI_ML, "difficulty": ProjectDifficulty.ADVANCED,
     "description": "基于 TensorFlow Lite 的图像分类，在树莓派上实现四种垃圾的自动识别和分拣。",
     "status": ProjectStatus.IN_PROGRESS, "students_count": 3},
    {"name": "Micro:bit 体感游戏手柄", "category": ProjectCategory.ARDUINO, "difficulty": ProjectDifficulty.BEGINNER,
     "description": "用 Micro:bit 制作无线体感游戏手柄，控制电脑上的 Scratch 游戏。",
     "status": ProjectStatus.COMPLETED, "students_count": 6},
    {"name": "无人机自动巡检系统", "category": ProjectCategory.ROBOTICS, "difficulty": ProjectDifficulty.ADVANCED,
     "description": "基于 DJI Tello 无人机 + Python 实现校园自动巡检路线规划和图像采集。",
     "status": ProjectStatus.PLANNING, "students_count": 2},
    {"name": "校园气象站", "category": ProjectCategory.IOT, "difficulty": ProjectDifficulty.INTERMEDIATE,
     "description": "用 ESP32 连接多种传感器采集温湿度、气压、风速等数据，上传到云端实时展示。",
     "status": ProjectStatus.SHOWCASE, "students_count": 5},
    {"name": "3D 打印解谜魔方", "category": ProjectCategory.OTHER, "difficulty": ProjectDifficulty.BEGINNER,
     "description": "使用 Tinkercad 设计并 3D 打印一套可组装的解谜魔方。",
     "status": ProjectStatus.COMPLETED, "students_count": 3},
]

COMPETITION_CONFIG = [
    {"name": "2026 年市青少年机器人竞赛", "level": CompetitionLevel.CITY, "category": CompetitionCategory.ROBOTICS,
     "description": "全市中小学生参与的 VEX/IQ 机器人工程挑战赛。", "status": CompetitionStatus.REGISTERING,
     "start_date": date(2026, 9, 15), "end_date": date(2026, 9, 16)},
    {"name": "全国青少年编程创意大赛", "level": CompetitionLevel.NATIONAL, "category": CompetitionCategory.PROGRAMMING,
     "description": "Python/Scratch 创意编程作品评比。", "status": CompetitionStatus.PREPARING,
     "start_date": date(2026, 10, 20), "end_date": date(2026, 11, 5)},
    {"name": "省级中小学生创客大赛", "level": CompetitionLevel.PROVINCIAL, "category": CompetitionCategory.MAKER,
     "description": "3D 打印、智能硬件、创新发明三大赛项。", "status": CompetitionStatus.COMPLETED,
     "start_date": date(2026, 3, 10), "end_date": date(2026, 3, 12)},
    {"name": "市青少年无人机竞速赛", "level": CompetitionLevel.CITY, "category": CompetitionCategory.ROBOTICS,
     "description": "无人机穿越障碍竞速，分小学组和初中组。", "status": CompetitionStatus.REGISTERING,
     "start_date": date(2026, 11, 1), "end_date": date(2026, 11, 2)},
]


def get_k12_org(db: Session) -> Organization:
    """获取 K12 演示组织"""
    org = db.query(Organization).filter(
        Organization.org_type == OrganizationType.K12,
        Organization.is_active.is_(True),
    ).first()
    if not org:
        raise RuntimeError("K12 演示组织不存在，请先运行 seed_demo_data.py")
    return org


def get_teachers_for_org(db: Session, org_id: int):
    """获取指定组织的教师用户"""
    from models.user_organization import UserOrganization, UserOrganizationRole
    teacher_links = db.query(UserOrganization).filter(
        UserOrganization.org_id == org_id,
        UserOrganization.role == UserOrganizationRole.TEACHER,
        UserOrganization.is_active.is_(True),
    ).all()
    teachers = []
    for link in teacher_links:
        user = db.query(User).filter(User.id == link.user_id).first()
        if user:
            teachers.append(user)
    return teachers


def get_or_create_student(db: Session, org_id: int, name: str, grade: str, class_name: str,
                          gender: Gender = Gender.MALE, student_number: str = None) -> Student:
    """获取或创建学员记录"""
    if not student_number:
        # 根据姓名生成学号
        count = db.query(Student).filter(Student.org_id == org_id).count()
        student_number = f"DEMO-{org_id}-{count + 1:03d}"

    existing = db.query(Student).filter(Student.student_number == student_number).first()
    if existing:
        return existing

    student = Student(
        org_id=org_id,
        student_number=student_number,
        name=name,
        gender=gender,
        grade_level=grade,
        class_name=class_name,
        status=StudentStatus.ACTIVE,
        enrollment_date=datetime(2025, 9, 1),
    )
    db.add(student)
    db.flush()
    return student


def create_stem_clubs(db: Session, org_id: int, teachers: list):
    """创建 STEM 社团"""
    clubs = []
    teacher_names = [t.full_name or t.username for t in teachers]

    for i, cfg in enumerate(STEM_CLUB_CONFIG):
        teacher_name = cfg.get("leader_teacher_name") or teacher_names[i % len(teacher_names)]
        club = Club(
            org_id=org_id,
            name=cfg["name"],
            description=cfg["description"],
            category=cfg["category"],
            grade_range_min=cfg["grade_range_min"],
            grade_range_max=cfg["grade_range_max"],
            max_members=cfg["max_members"],
            current_members=0,
            require_interview=cfg.get("require_interview", False),
            is_recruiting=True,
            status=ClubStatus.RECRUITING if i < 3 else ClubStatus.ACTIVE,
            leader_teacher_name=teacher_name,
            semester=cfg.get("semester", "2026-spring"),
            school_year=cfg.get("school_year", "2025-2026"),
        )
        db.add(club)
        db.flush()
        clubs.append(club)

    db.commit()
    print(f"[OK] 创建 {len(clubs)} 个 STEM 社团")
    return clubs


def create_students_and_members(db: Session, org_id: int, clubs: list):
    """创建演示学员并加入社团"""
    student_configs = [
        ("王小明", "三年级", "3年级1班", Gender.MALE),
        ("李小红", "三年级", "3年级1班", Gender.FEMALE),
        ("张小伟", "四年级", "4年级2班", Gender.MALE),
        ("陈小丽", "四年级", "4年级2班", Gender.FEMALE),
        ("刘小强", "五年级", "5年级1班", Gender.MALE),
        ("赵小芳", "五年级", "5年级1班", Gender.FEMALE),
        ("孙小龙", "五年级", "5年级2班", Gender.MALE),
        ("周小美", "六年级", "6年级1班", Gender.FEMALE),
        ("吴小飞", "六年级", "6年级1班", Gender.MALE),
        ("郑小雨", "六年级", "6年级2班", Gender.FEMALE),
        ("钱小轩", "四年级", "4年级1班", Gender.MALE),
        ("林小诗", "三年级", "3年级2班", Gender.FEMALE),
    ]

    students = []
    for name, grade, cls_name, gender in student_configs:
        student = get_or_create_student(db, org_id, name, grade, cls_name, gender)
        students.append(student)

    # 为每个社团分配成员
    all_members = []
    role_choices = [ClubMemberRole.LEADER, ClubMemberRole.VICE_LEADER, ClubMemberRole.MEMBER,
                    ClubMemberRole.MEMBER, ClubMemberRole.MEMBER, ClubMemberRole.MEMBER]

    for club_idx, club in enumerate(clubs):
        # 每个社团分配 4-8 名成员
        member_count = 4 + (club_idx * 1)  # 递增
        member_count = min(member_count, len(students))

        for i in range(member_count):
            student = students[(club_idx + i) % len(students)]
            role = role_choices[i % len(role_choices)] if i < 2 else ClubMemberRole.MEMBER

            existing = db.query(ClubMember).filter(
                ClubMember.club_id == club.id,
                ClubMember.student_id == student.id,
            ).first()
            if existing:
                continue

            member = ClubMember(
                club_id=club.id,
                org_id=org_id,
                student_id=student.id,
                student_name=student.name,
                grade=student.grade_level,
                class_name=student.class_name,
                role=role,
                status=ClubMemberStatus.ACTIVE,
                joined_at=datetime(2026, 2, 20) + timedelta(days=random.randint(0, 30)),
            )
            db.add(member)
            all_members.append(member)

        # 更新社团成员数
        club.current_members = member_count

    db.commit()
    print(f"[OK] 创建 {len(students)} 个学员记录，{len(all_members)} 条社团成员关联")
    return students


def create_club_activities(db: Session, org_id: int, clubs: list):
    """为社团创建活动记录"""
    activity_templates = [
        {"title": "社团常规活动", "type": ActivityType.REGULAR, "start": "15:30", "end": "17:00"},
        {"title": "专题工作坊", "type": ActivityType.WORKSHOP, "start": "14:00", "end": "16:30"},
        {"title": "竞赛集训", "type": ActivityType.COMPETITION, "start": "09:00", "end": "12:00"},
        {"title": "成果展示会", "type": ActivityType.SHOWCASE, "start": "10:00", "end": "15:00"},
    ]
    locations = ["3D 打印实验室", "机器人竞赛室", "Micro:bit 教室", "VR 体验室", "科学实验数据分析室"]

    all_activities = []
    today = date.today()

    for club in clubs:
        # 为每个社团创建 3-5 个活动（含过去和未来）
        num_activities = 3 + (hash(str(club.id)) % 3)
        for i in range(num_activities):
            template = activity_templates[i % len(activity_templates)]
            # 过去3周到现在+未来2周
            days_offset = -21 + (i * 7) + (hash(str(club.id) + str(i)) % 5)
            activity_date = today + timedelta(days=days_offset)

            mc = club.current_members or 5
            activity = ClubActivity(
                club_id=club.id,
                org_id=org_id,
                title=f"{club.name} - {template['title']}",
                description=f"{template['title']} - {club.description[:50]}",
                activity_type=template["type"],
                activity_date=activity_date,
                start_time=template["start"],
                end_time=template["end"],
                location=locations[i % len(locations)],
                teacher_name=club.leader_teacher_name,
                expected_count=random.randint(min(3, mc), mc),
                actual_count=random.randint(min(2, mc), mc),
                is_cancelled=(i == num_activities - 1 and club.category == ClubCategory.DRONE),
            )
            db.add(activity)
            all_activities.append(activity)

    db.commit()
    print(f"[OK] 创建 {len(all_activities)} 条社团活动记录")
    return all_activities


def create_recruitments(db: Session, org_id: int, clubs: list):
    """为招募中的社团创建招募公告"""
    recruitments = []
    today = date.today()

    for club in clubs:
        if not club.is_recruiting:
            continue

        rec = ClubRecruitment(
            club_id=club.id,
            org_id=org_id,
            title=f"{club.name} 春季招新",
            description=f"{club.description} 欢迎感兴趣的同学报名参加！",
            requirements="热爱科技，有好奇心，愿意团队合作。" if club.require_interview else "对 STEM 感兴趣即可。",
            start_date=today - timedelta(days=7),
            end_date=today + timedelta(days=23),
            interview_date=today + timedelta(days=14) if club.require_interview else None,
            applicant_count=random.randint(3, 10),
            accepted_count=0,
            is_published=True,
            is_closed=False,
        )
        db.add(rec)
        recruitments.append(rec)

    db.commit()
    print(f"[OK] 创建 {len(recruitments)} 条招募公告")


def create_consumables(db: Session, org_id: int):
    """创建耗材数据"""
    consumables = []
    for cfg in STEM_CONSUMABLE_CONFIG:
        consumable = Consumable(
            org_id=org_id,
            name=cfg["name"],
            category=cfg["category"],
            specification=cfg.get("specification"),
            unit=cfg.get("unit", "个"),
            unit_price=cfg.get("unit_price", 0.0),
            token_price=cfg.get("token_price", 0),
            current_stock=cfg.get("current_stock", 10),
            min_stock=cfg.get("min_stock", 5),
            max_stock=cfg.get("max_stock", 50),
            supplier=cfg.get("supplier"),
            is_low_stock=cfg.get("is_low", False),
            is_active=True,
        )
        db.add(consumable)
        consumables.append(consumable)

    db.commit()
    print(f"[OK] 创建 {len(consumables)} 个耗材")
    return consumables


def create_consumable_usages(db: Session, org_id: int, consumables: list):
    """创建耗材领用记录"""
    usages = []
    purposes = ["机器人制作", "3D 打印模型", "电子实验", "项目制作", "日常教学"]

    for i, consumable in enumerate(consumables[:6]):  # 前6个耗材有领用记录
        for j in range(random.randint(1, 3)):
            qty = random.randint(1, consumable.max_stock // 10)
            if qty > consumable.current_stock:
                qty = max(1, consumable.current_stock // 2)
            usage = ConsumableUsage(
                consumable_id=consumable.id,
                org_id=org_id,
                quantity=qty,
                token_cost=consumable.token_price * qty,
                user_id=1,
                user_name="王小明",
                user_type="student",
                purpose=purposes[i % len(purposes)],
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            )
            db.add(usage)
            usages.append(usage)

    db.commit()
    print(f"[OK] 创建 {len(usages)} 条耗材领用记录")


def create_hardware_devices(db: Session, org_id: int):
    """创建设备数据"""
    devices = []
    for cfg in HARDWARE_DEVICE_CONFIG:
        device = HardwareDevice(
            org_id=org_id,
            name=cfg["name"],
            category=cfg["category"],
            model=cfg.get("model"),
            status=cfg["status"],
            location=cfg.get("location"),
            purchase_date=datetime(2025, 9, 1) + timedelta(days=random.randint(0, 180)),
            is_active=True,
        )
        db.add(device)
        devices.append(device)

    db.commit()
    print(f"[OK] 创建 {len(devices)} 个硬件设备")


def create_stem_projects(db: Session, org_id: int):
    """创建 STEM 项目"""
    projects = []
    today = date.today()

    for cfg in STEM_PROJECT_CONFIG:
        start_offset = random.randint(-90, 0)
        project = STEMProject(
            org_id=org_id,
            name=cfg["name"],
            description=cfg["description"],
            category=cfg["category"],
            difficulty=cfg["difficulty"],
            status=cfg["status"],
            technologies='["arduino", "sensors", "iot", "programming"]',
            current_students=cfg["students_count"],
            start_date=today + timedelta(days=start_offset),
            end_date=today + timedelta(days=start_offset + random.randint(30, 90)) if cfg["status"] != ProjectStatus.PLANNING else None,
            is_active=True,
        )
        db.add(project)
        projects.append(project)

    db.commit()
    print(f"[OK] 创建 {len(projects)} 个 STEM 项目")


def create_competitions(db: Session, org_id: int):
    """创建竞赛数据"""
    competitions = []
    for cfg in COMPETITION_CONFIG:
        comp = Competition(
            org_id=org_id,
            name=cfg["name"],
            description=cfg["description"],
            level=cfg["level"],
            category=cfg["category"],
            status=cfg["status"],
            organizer="教育局/科协",
            register_deadline=cfg["start_date"] - timedelta(days=14),
            competition_date=cfg["start_date"],
            max_participants=50,
        )
        db.add(comp)
        competitions.append(comp)

    db.commit()
    print(f"[OK] 创建 {len(competitions)} 个竞赛")


def seed_stem_demo_data():
    """主函数：创建 STEM 演示数据"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("开始创建 STEM 完整演示数据...")
        print("=" * 60)

        # 获取 K12 组织
        org = get_k12_org(db)
        org_id = org.id
        print(f"\n目标组织: {org.name} (ID: {org_id})")

        # 获取教师
        teachers = get_teachers_for_org(db, org_id)
        print(f"找到 {len(teachers)} 名教师用户")

        # 1. 创建社团
        print("\n1. 创建 STEM 社团...")
        clubs = create_stem_clubs(db, org_id, teachers)

        # 2. 创建学员和社团成员
        print("\n2. 创建学员和社团成员...")
        students = create_students_and_members(db, org_id, clubs)

        # 3. 创建社团活动
        print("\n3. 创建社团活动...")
        activities = create_club_activities(db, org_id, clubs)

        # 4. 创建招募公告
        print("\n4. 创建招募公告...")
        create_recruitments(db, org_id, clubs)

        # 5. 创建耗材
        print("\n5. 创建耗材...")
        consumables = create_consumables(db, org_id)

        # 6. 创建耗材领用记录
        print("\n6. 创建耗材领用记录...")
        create_consumable_usages(db, org_id, consumables)

        # 7. 创建硬件设备
        print("\n7. 创建硬件设备...")
        create_hardware_devices(db, org_id)

        # 8. 创建 STEM 项目
        print("\n8. 创建 STEM 项目...")
        create_stem_projects(db, org_id)

        # 9. 创建竞赛
        print("\n9. 创建竞赛...")
        create_competitions(db, org_id)

        print("\n" + "=" * 60)
        print("STEM 演示数据创建完成！")
        print("=" * 60)

        # 打印演示账号信息
        print(f"\n演示账号密码统一为: {DEMO_PASSWORD}")
        print("\n推荐登录方式（一键体验）:")
        print("  K12 学校管理员: admin_k12 / demo123456")
        print("  K12 教师: teacher_k12_01 / demo123456")

    except Exception as e:
        db.rollback()
        print(f"\n[错误] {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_stem_demo_data()