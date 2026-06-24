"""
剩余表数据填充脚本 - 为所有组织生成演示数据
主入口: create_all_remaining_demo_data(db, organizations)
"""

import random
from datetime import datetime, date, timedelta

from models.license import Organization, OrganizationType
from models.base_models import User, Teacher, Course
from models.student import Student, Gender, StudentStatus, Enrollment, AttendanceRecord
from models.classroom import Classroom, ClassSchedule
from models.club import (
    Club, ClubMember, ClubActivity, ClubAttendance,
    ClubRecruitment, ClubApplication,
    ClubCategory, ClubStatus, ClubMemberRole, ClubMemberStatus,
    ActivityType, AttendanceStatus, ApplicationStatus,
)
from models.consumable import (
    Consumable, ConsumableUsage, ConsumablePurchaseRequest,
    PurchaseRequestItem, PurchaseRequestStatus, ConsumableCategory,
)
from models.hardware_device import (
    HardwareDevice, DeviceMaintenanceRecord, DeviceUsageLog,
    DeviceCategory, DeviceStatus,
)
from models.hardware_device import MaintenanceType  # noqa: F401
from models.stem_project import (
    STEMProject, ProjectStudent, ProjectMilestone, ProjectResource,
    ProjectStatus, ProjectCategory, ProjectDifficulty,
)
from models.maker_space import (
    MakerSpace, SpaceBooking, EquipmentSlot,
    SpaceType, SpaceStatus, BookingStatus,
)
from models.marketing import (
    MarketingCampaign, SocialMediaAccount, Coupon,
    CampaignType, CampaignStatus, SocialPlatform,
)
from models.parent_portal import (
    ClassFeedback, StudentAchievement, ParentMessage,
    FeedbackRating,
)
from models.competition import (
    Competition, CompetitionRegistration, Certification, ExamRegistration,
    CompetitionLevel, CompetitionCategory, CompetitionStatus,
)
from models.backup import (
    BackupSnapshot, RestoreOperation,
    BackupType, BackupStatus, RestoreStatus,
)
from models.token_billing import (
    TokenPackage, TokenBalance, TokenTransaction, TokenUsageLog, TokenOrder,
    TokenTransactionType, TokenType, TokenOrderStatus, PaymentMethod,
)
from models.tenant import TenantConfig, TenantFeatureFlag
from models.notification import Notification, NotificationType, NotificationPriority
from models.resource import (
    TeachingResource, ResourceCategory, ResourceType as ResType, ResourceFormat,
)
from models.schedule import (
    Lead, LeadFollowUp, Settlement, Schedule,
    LeadStatus, LeadSource, ScheduleStatus,
)
from models.bureau_models import (
    EquipmentAllocation, AllocationType, AllocationStatus,
    BureauSchool, BureauEquipmentPool, EquipmentRequest,
)
from models.license import License, LicenseActivityLog, LicenseValidationAttempt
from models.user_license import (
    LegacyTokenPackage, TokenRechargeRecord, TokenUsageRecord,
    UserTokenBalance, TokenPackageType,
)


# ================== 辅助工具 ==================

def _pick_teacher_for_org(db, org_id):
    """获取组织的教师记录"""
    teacher = db.query(Teacher).filter(Teacher.org_id == org_id).first()
    if not teacher:
        users = db.query(User).all()
        teacher_name = users[0].full_name if users and users[0].full_name else "张老师"
        teacher = Teacher(
            org_id=org_id, name=teacher_name, email="teacher@demo.org",
            specialty="STEM 教学", hourly_rate=200, is_active=True,
        )
        db.add(teacher)
        db.flush()
    return teacher


def _ensure_students_for_org(db, org_id, count=6):
    """确保组织有足够的学员记录，返回学员列表"""
    existing = db.query(Student).filter(Student.org_id == org_id).all()
    students = list(existing)
    need = count - len(students)
    if need <= 0:
        return students

    name_pool = [
        ("李小明", "male"), ("王芳", "female"), ("张强", "male"),
        ("陈思", "female"), ("刘洋", "male"), ("赵雅", "female"),
        ("孙磊", "male"), ("周婷", "female"), ("吴昊", "male"),
        ("郑欣怡", "female"), ("冯浩然", "male"), ("卫小雨", "female"),
    ]
    grade_pool = ["三年级", "四年级", "五年级", "六年级", "七年级", "八年级"]
    start_idx = len(students)
    for i in range(need):
        name, gender = name_pool[(start_idx + i) % len(name_pool)]
        gender_enum = Gender.MALE if gender == "male" else Gender.FEMALE
        sn = f"DEMO-{org_id}-{start_idx + i + 1:04d}"
        birth = datetime(2015 + ((start_idx + i) % 4), 3 + (i % 6), 1 + (i * 3) % 27)
        student = Student(
            org_id=org_id,
            student_number=sn,
            name=name,
            gender=gender_enum,
            birth_date=birth,
            age=2026 - birth.year,
            phone=f"1380000{1000 + start_idx + i:04d}",
            email=f"student_{start_idx + i}@demo.org",
            address="示范市示范街 1 号",
            guardian_name=f"{name}家长",
            guardian_phone=f"1390000{1000 + start_idx + i:04d}",
            guardian_relationship="父亲" if (i % 2 == 0) else "母亲",
            enrollment_date=datetime(2025, 9, 1),
            status=StudentStatus.ACTIVE,
            grade_level=grade_pool[(start_idx + i) % len(grade_pool)],
            class_name=f"{grade_pool[(start_idx + i) % len(grade_pool)]} 1 班",
            emergency_contact_name=f"{name}家长",
            emergency_contact_phone=f"1390000{2000 + start_idx + i:04d}",
            notes="演示数据，由 seed_remaining_tables 生成",
        )
        db.add(student)
        students.append(student)
    db.flush()
    return students


def _ensure_courses_for_org(db, org_id):
    """确保组织有课程记录，返回课程列表"""
    courses = db.query(Course).filter(Course.org_id == org_id).all()
    if courses:
        return courses

    course_templates = [
        ("Arduino 创意电子", "硬件编程", "beginner"),
        ("Python 编程入门", "软件编程", "beginner"),
        ("3D 打印创客工坊", "创客", "beginner"),
        ("机器人竞赛集训", "机器人", "intermediate"),
        ("人工智能探索", "AI", "advanced"),
    ]
    created = []
    for title, category, difficulty in course_templates:
        c = Course(
            org_id=org_id, title=title, description=f"{category} - {title}",
            category=category, difficulty=difficulty, duration_hours=2,
            price=1200, is_active=True,
        )
        db.add(c)
        created.append(c)
    db.flush()
    return created


def _ensure_classrooms_for_org(db, org_id):
    """确保组织有教室资源"""
    classrooms = db.query(Classroom).filter(Classroom.org_id == org_id).all()
    if classrooms:
        return classrooms
    room_templates = [
        ("ROOM-A101", "综合楼 A", 1, 30, "多媒体教室", True, True, True),
        ("ROOM-A102", "综合楼 A", 1, 25, "创客空间", True, True, True),
        ("ROOM-B201", "综合楼 B", 2, 40, "编程教室", True, True, False),
        ("ROOM-B202", "综合楼 B", 2, 20, "机器人实验室", True, True, True),
    ]
    created = []
    for rn, building, floor, cap, rtype, proj, pc, audio in room_templates:
        room = Classroom(
            org_id=org_id, room_number=rn, building=building, floor=floor,
            capacity=cap, room_type=rtype,
            has_projector=proj, has_computer=pc, has_audio_system=audio,
            has_whiteboard=True, is_available=True,
        )
        db.add(room)
        created.append(room)
    db.flush()
    return created


# ================== 1. STEM 社团 ==================

def _seed_clubs(db, org_id, teachers, students):
    club_templates = [
        ("机器人探索社团", ClubCategory.ROBOTICS, "学习机器人搭建、编程和竞赛", 4, 8, 30),
        ("Python 编程社", ClubCategory.PROGRAMMING, "从基础到项目实战的编程学习", 4, 8, 30),
        ("3D 打印创意工坊", ClubCategory.PRINTING_3D, "模型设计、切片与 3D 打印", 3, 6, 20),
        ("无人机飞行俱乐部", ClubCategory.DRONE, "无人机组装、编程飞行与竞速", 5, 8, 25),
        ("科学实验探索社", ClubCategory.SCIENCE_EXP, "物理、化学、生物趣味实验", 2, 6, 28),
        ("人工智能启蒙社", ClubCategory.AI, "图像识别、语音交互初体验", 5, 8, 20),
    ]
    clubs = []
    for name, category, desc, min_g, max_g, max_mem in club_templates:
        leader = teachers[len(clubs) % len(teachers)] if teachers else None
        club = Club(
            org_id=org_id, name=name, description=desc, category=category,
            grade_range_min=min_g, grade_range_max=max_g, max_members=max_mem,
            current_members=0, require_interview=(category == ClubCategory.ROBOTICS),
            is_recruiting=True, status=ClubStatus.ACTIVE,
            leader_teacher_id=getattr(leader, "id", None),
            leader_teacher_name=getattr(leader, "name", "李老师") if teachers else "李老师",
            semester="2026-spring", school_year="2025-2026",
            is_active=True,
        )
        db.add(club)
        clubs.append(club)
    db.flush()

    # 社团成员
    for cidx, club in enumerate(clubs):
        member_count = min(5 + (cidx % 3), len(students), club.max_members)
        for i in range(member_count):
            student = students[(cidx + i) % len(students)]
            role = ClubMemberRole.LEADER if i == 0 else (ClubMemberRole.VICE_LEADER if i == 1 else ClubMemberRole.MEMBER)
            cm = ClubMember(
                club_id=club.id, org_id=org_id, student_id=student.id,
                student_name=student.name, grade=student.grade_level,
                class_name=student.class_name, role=role, status=ClubMemberStatus.ACTIVE,
                joined_at=datetime(2026, 2, 15) + timedelta(days=i),
                evaluation_score=4 + (i % 2),
                evaluation_comment="表现积极，团队合作良好。",
            )
            db.add(cm)
        club.current_members = member_count

    # 社团活动
    activity_types = [ActivityType.REGULAR, ActivityType.WORKSHOP,
                      ActivityType.COMPETITION, ActivityType.SHOWCASE]
    locations = ["活动室 A", "创客空间", "机器人实验室", "多功能厅", "编程教室"]
    for cidx, club in enumerate(clubs):
        act_count = 3 + (cidx % 3)
        for i in range(act_count):
            activity_date = date.today() - timedelta(days=(act_count - i) * 7 - 5)
            start_dt = datetime(activity_date.year, activity_date.month, activity_date.day, 15, 30)
            end_dt = start_dt + timedelta(hours=1, minutes=30)
            teacher = teachers[(cidx + i) % len(teachers)] if teachers else None
            activity = ClubActivity(
                club_id=club.id, org_id=org_id,
                title=f"{club.name} - 常规活动 #{i + 1}",
                description=f"社团第 {i + 1} 次活动，主题为{activity_types[i % len(activity_types)].value}",
                activity_type=activity_types[i % len(activity_types)],
                activity_date=activity_date,
                start_time=f"{start_dt.hour:02d}:{start_dt.minute:02d}",
                end_time=f"{end_dt.hour:02d}:{end_dt.minute:02d}",
                location=locations[(cidx + i) % len(locations)],
                teacher_id=getattr(teacher, "id", None),
                teacher_name=getattr(teacher, "name", club.leader_teacher_name),
                expected_count=club.current_members,
                actual_count=max(2, club.current_members - 1),
                is_cancelled=False,
            )
            db.add(activity)
            db.flush()
            # 考勤
            members = db.query(ClubMember).filter(ClubMember.club_id == club.id).all()
            for mi, m in enumerate(members):
                statuses = [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
                            AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED]
                att = ClubAttendance(
                    activity_id=activity.id, club_id=club.id, org_id=org_id,
                    student_id=m.student_id, student_name=m.student_name,
                    status=statuses[mi % len(statuses)],
                    check_in_time=start_dt + timedelta(minutes=mi * 2),
                    notes="正常出勤" if mi % 3 != 0 else "",
                )
                db.add(att)

    # 招募公告 + 申请
    for cidx, club in enumerate(clubs[:3]):
        rec = ClubRecruitment(
            club_id=club.id, org_id=org_id,
            title=f"{club.name} 2026 春季招新",
            description=f"{club.name}欢迎感兴趣的同学报名参加！",
            requirements="热爱科技，愿意团队合作。",
            start_date=date.today() - timedelta(days=7 + cidx),
            end_date=date.today() + timedelta(days=30 + cidx * 2),
            interview_date=date.today() + timedelta(days=20),
            applicant_count=3 + cidx, accepted_count=0,
            is_published=True, is_closed=False,
        )
        db.add(rec)
        db.flush()
        for si in range(3 + cidx):
            student = students[(cidx * 3 + si) % len(students)]
            statuses = [ApplicationStatus.PENDING, ApplicationStatus.APPROVED,
                        ApplicationStatus.WAITLIST, ApplicationStatus.REJECTED]
            app = ClubApplication(
                recruitment_id=rec.id, club_id=club.id, org_id=org_id,
                student_id=student.id, student_name=student.name,
                grade=student.grade_level, class_name=student.class_name,
                reason="对 STEM 领域非常感兴趣，希望学习更多知识。",
                experience=f"曾参加 {random.choice(['学校创客活动', '编程兴趣班', '机器人比赛', '无'])}",
                guardian_phone=student.guardian_phone,
                status=statuses[si % len(statuses)],
                review_comment="通过面试" if si % 4 != 3 else "暂不符合，候补",
                reviewed_by=None, reviewed_at=datetime.utcnow() - timedelta(days=si),
            )
            db.add(app)

    db.flush()
    print(f"  [OK] STEM 社团: {len(clubs)} 个社团、活动及成员已创建")


# ================== 2. 耗材管理 ==================

def _seed_consumables(db, org_id, students):
    con_templates = [
        ("PLA 3D 打印耗材（白色）", ConsumableCategory.FILAMENT_3D, "PLA 1.75mm 白色 1kg", 98.0, 10, 25, 3, 30, "京东耗材"),
        ("Arduino UNO 开发板", ConsumableCategory.ELECTRONIC, "Arduino UNO R3", 45.0, 5, 20, 5, 40, "创客商城"),
        ("杜邦线（公对母）", ConsumableCategory.ELECTRONIC, "20cm 40 根/包", 3.5, 1, 50, 8, 100, "电子元器件批发"),
        ("LED 灯珠（彩色）", ConsumableCategory.ELECTRONIC, "5mm 红黄蓝绿白 100 颗/盒", 8.0, 1, 15, 3, 30, "电子批发"),
        ("HC-SR04 超声波传感器", ConsumableCategory.SENSOR, "HC-SR04 5V", 6.0, 2, 18, 2, 30, "创客商城"),
        ("M3 螺丝螺母套装", ConsumableCategory.STRUCTURAL, "M3 不锈钢 50 套", 12.0, 1, 10, 3, 30, "五金商城"),
        ("锂电池 18650", ConsumableCategory.SENSOR, "3.7V 3000mAh（2 节）", 25.0, 3, 12, 4, 30, "电池专营店"),
    ]
    consumables = []
    for name, cat, spec, price, tprice, cur, mn, mx, sup in con_templates:
        c = Consumable(
            org_id=org_id, name=name, category=cat, specification=spec,
            description=f"{name} - 教学/实验耗材",
            unit="个", unit_price=price, token_price=tprice,
            current_stock=cur, min_stock=mn, max_stock=mx, supplier=sup,
            is_low_stock=(cur < mn), is_active=True,
        )
        db.add(c)
        consumables.append(c)
    db.flush()

    # 领用记录
    for i, c in enumerate(consumables[:5]):
        for j in range(2):
            student = students[(i + j) % len(students)]
            qty = 1 + (i + j) % 3
            usage = ConsumableUsage(
                consumable_id=c.id, org_id=org_id, quantity=qty,
                token_cost=c.token_price * qty,
                user_id=student.id, user_name=student.name, user_type="student",
                purpose=random.choice(["项目制作", "社团活动", "实验探索", "机器人制作"]),
                created_at=datetime.utcnow() - timedelta(days=7 + i + j * 3),
            )
            db.add(usage)

    # 申购单
    for i in range(2):
        pr = ConsumablePurchaseRequest(
            org_id=org_id, title=f"月度耗材补充单 #{i + 1}",
            reason="日常教学消耗较大，需补充耗材库存。",
            status=[PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED][i],
            requester_id=None, requester_name="李老师",
            reviewer_id=None, reviewer_name="张管理员",
            review_comment="已审批，尽快采购",
            reviewed_at=datetime.utcnow() - timedelta(days=i + 1),
            estimated_total=800 + i * 200, actual_total=None,
            supplier="京东耗材旗舰店",
            ordered_at=datetime.utcnow() - timedelta(days=i) if i == 1 else None,
            received_at=None,
        )
        db.add(pr)
        db.flush()
        for j in range(3):
            cons = consumables[(i + j) % len(consumables)]
            db.add(PurchaseRequestItem(
                request_id=pr.id, consumable_id=cons.id,
                consumable_name=cons.name, specification=cons.specification,
                quantity=5 + j * 2, estimated_price=cons.unit_price,
            ))

    db.flush()
    print(f"  [OK] 耗材管理: {len(consumables)} 个耗材、领用及申购单已创建")


# ================== 3. 硬件设备 ==================

def _seed_hardware_devices(db, org_id, students):
    device_templates = [
        ("Ultimaker S3 3D 打印机", DeviceCategory.PRINTER_3D, "Ultimaker S3", DeviceStatus.AVAILABLE, "3D 打印实验室", 5800.0),
        ("DJI Tello EDU 无人机", DeviceCategory.DRONE, "Tello EDU", DeviceStatus.AVAILABLE, "无人机训练场", 999.0),
        ("树莓派 5 开发套件", DeviceCategory.ARDUINO, "Raspberry Pi 5 8GB", DeviceStatus.IN_USE, "编程教室 A", 599.0),
        ("Arduino 学习套装", DeviceCategory.ARDUINO, "Arduino Starter Kit", DeviceStatus.AVAILABLE, "创客空间", 320.0),
        ("VEX IQ 机器人竞赛套装", DeviceCategory.ROBOT, "VEX IQ Gen 2", DeviceStatus.IN_USE, "机器人实验室", 2999.0),
        ("Oculus Quest 2 VR 套装", DeviceCategory.OTHER, "Quest 2 128GB", DeviceStatus.AVAILABLE, "VR 体验室", 2299.0),
        ("激光切割机 K40", DeviceCategory.OTHER, "K40 40W CO2", DeviceStatus.MAINTENANCE, "激光工坊", 1800.0),
    ]
    devices = []
    for i, (name, cat, model, status, loc, price) in enumerate(device_templates):
        d = HardwareDevice(
            org_id=org_id, name=name, category=cat, model=model,
            serial_number=f"DEV-{org_id}-{i + 1:04d}",
            description=f"{name} - STEM 教学设备",
            purchase_date=datetime(2025, 9, 1) + timedelta(days=i * 14),
            purchase_price=price, supplier="供应商演示", warranty_period=24,
            status=status, location=loc,
            last_maintenance_date=datetime(2026, 3, 1 + i),
            is_active=True, notes="演示设备",
        )
        db.add(d)
        devices.append(d)
    db.flush()

    # 维护记录
    for i, d in enumerate(devices[:3]):
        m = DeviceMaintenanceRecord(
            device_id=d.id, org_id=org_id,
            maintenance_type="routine" if i == 0 else ("repair" if i == 1 else "upgrade"),
            description=f"{d.name} 定期维护与功能检查",
            performed_by=None, maintenance_date=datetime(2026, 3, 10 + i),
            cost=150.0 + i * 50, result="维护完成，设备运行正常",
            next_maintenance_date=datetime(2026, 9, 10 + i),
        )
        db.add(m)

    # 使用日志
    for i, d in enumerate(devices[:4]):
        student = students[i % len(students)]
        start = datetime.utcnow() - timedelta(days=5 + i, hours=i)
        end = start + timedelta(hours=2)
        log = DeviceUsageLog(
            device_id=d.id, org_id=org_id, user_id=student.id,
            start_time=start, end_time=end,
            purpose=random.choice(["课堂教学", "项目制作", "社团活动"]),
            project_id=None,
            condition_before="设备功能正常",
            condition_after="使用完毕，状态良好",
            issues_found=None,
        )
        db.add(log)

    db.flush()
    print(f"  [OK] 硬件设备: {len(devices)} 个设备、维护记录及使用日志已创建")


# ================== 4. STEM 项目 ==================

def _seed_stem_projects(db, org_id, teachers, students):
    project_templates = [
        ("智能温室监控系统", ProjectCategory.IOT, ProjectDifficulty.INTERMEDIATE,
         "使用 Arduino + 传感器实现自动浇水与环境监控", 4),
        ("垃圾分类识别机器人", ProjectCategory.AI_ML, ProjectDifficulty.ADVANCED,
         "基于 TensorFlow Lite 实现图像分类分拣", 3),
        ("校园气象站", ProjectCategory.IOT, ProjectDifficulty.INTERMEDIATE,
         "ESP32 连接多种传感器，数据上传云端实时展示", 5),
        ("3D 打印解谜魔方", ProjectCategory.OTHER, ProjectDifficulty.BEGINNER,
         "使用 Tinkercad 设计并 3D 打印解谜魔方", 3),
        ("Micro:bit 体感游戏手柄", ProjectCategory.ARDUINO, ProjectDifficulty.BEGINNER,
         "Micro:bit 制作无线体感游戏手柄", 6),
    ]
    projects = []
    for i, (name, cat, diff, desc, stu_count) in enumerate(project_templates):
        teacher = teachers[i % len(teachers)] if teachers else None
        start_offset = -(30 + i * 20)
        proj = STEMProject(
            org_id=org_id, name=name, description=desc, category=cat, difficulty=diff,
            status=[ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED,
                    ProjectStatus.PLANNING, ProjectStatus.SHOWCASE][i % 4],
            start_date=date.today() + timedelta(days=start_offset),
            end_date=date.today() + timedelta(days=start_offset + 60),
            estimated_hours=40, actual_hours=20 + i * 5,
            progress_percentage=(i + 1) * 15,
            mentor_id=getattr(teacher, "id", None),
            max_students=stu_count + 2, current_students=stu_count,
            technologies='["arduino","sensors","iot","programming"]',
            required_equipment='["3D打印机","传感器","开发板"]',
            evaluation_score=85.0 + i * 2,
            evaluation_comments="项目进展顺利，团队协作良好",
            is_active=True,
        )
        db.add(proj)
        projects.append(proj)
    db.flush()

    # 项目成员
    for pidx, proj in enumerate(projects):
        count = min(proj.current_students, len(students))
        for i in range(count):
            student = students[(pidx + i) % len(students)]
            ps = ProjectStudent(
                project_id=proj.id, student_id=student.id, org_id=org_id,
                role="leader" if i == 0 else "member",
                join_date=proj.start_date + timedelta(days=i),
                contribution_hours=10 + i * 3,
                performance_score=85.0 + i,
                performance_comments="积极参与，贡献突出",
                is_active=True,
            )
            db.add(ps)

    # 里程碑
    for pidx, proj in enumerate(projects[:3]):
        for i in range(3):
            planned = proj.start_date + timedelta(days=10 + i * 20)
            pm = ProjectMilestone(
                project_id=proj.id, org_id=org_id,
                title=f"里程碑 {i + 1}: {['需求分析', '原型开发', '成果展示'][i]}",
                description=f"项目 {proj.name} 的第 {i + 1} 阶段目标",
                status=["PENDING", "IN_PROGRESS", "COMPLETED"][i],
                planned_date=datetime(planned.year, planned.month, planned.day),
                actual_date=datetime(planned.year, planned.month, planned.day) + timedelta(days=i) if i < 2 else None,
                completion_percentage=[0, 50, 100][i],
            )
            db.add(pm)

    # 项目资源
    for pidx, proj in enumerate(projects[:2]):
        resource_types = ["PROJECT_DOC", "VIDEO", "CODE"]
        for i, rt in enumerate(resource_types):
            pr = ProjectResource(
                project_id=proj.id, org_id=org_id,
                name=f"{proj.name} - {['项目文档', '演示视频', '源代码'][i]}",
                description=f"项目相关{['文档资料', '视频资料', '源代码'][i]}",
                resource_type=rt,
                url=f"https://example.com/projects/{proj.id}/{rt}",
                file_size=1024 * (10 + i), mime_type=["application/pdf", "video/mp4", "text/plain"][i],
                is_active=True, created_by=None,
            )
            db.add(pr)

    db.flush()
    print(f"  [OK] STEM 项目: {len(projects)} 个项目、成员、里程碑及资源已创建")


# ================== 5. 创客空间 ==================

def _seed_maker_space(db, org_id, students):
    space_templates = [
        ("Arduino 创客实验室", SpaceType.LAB_ARDUINO, "适合电子与编程实验", 20, "综合楼 A 201", 2, "ROOM-A201", SpaceStatus.AVAILABLE),
        ("物联网实验室", SpaceType.LAB_IOT, "物联网项目开发与测试", 25, "综合楼 B 105", 1, "ROOM-B105", SpaceStatus.AVAILABLE),
        ("机器人实验空间", SpaceType.LAB_ROBOTICS, "机器人搭建与调试", 30, "实验楼 C 301", 3, "ROOM-C301", SpaceStatus.AVAILABLE),
        ("3D 打印制作室", SpaceType.LAB_3D_PRINTING, "3D 打印与激光切割", 15, "创客空间 1F", 1, "MAKER-01", SpaceStatus.MAINTENANCE),
        ("通用创客空间", SpaceType.MAKER_SPACE, "综合创意与制作", 40, "创客空间 2F", 2, "MAKER-02", SpaceStatus.AVAILABLE),
    ]
    spaces = []
    for i, (name, stype, desc, cap, loc, floor, rn, status) in enumerate(space_templates):
        ms = MakerSpace(
            org_id=org_id, name=name, description=desc, space_type=stype,
            capacity=cap, current_occupancy=0, location=loc, floor=floor,
            room_number=rn, equipment_list='["3D打印机","激光切割机","工具台"]',
            status=status, open_time="09:00", close_time="20:00",
            max_booking_hours=4, advance_booking_days=7, cancellation_hours=24,
            is_active=True, notes="演示数据",
        )
        db.add(ms)
        spaces.append(ms)
    db.flush()

    # 预约
    booking_statuses = [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.COMPLETED]
    for i, sp in enumerate(spaces[:3]):
        student = students[i % len(students)]
        start = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=i)
        end = start + timedelta(hours=2)
        sb = SpaceBooking(
            space_id=sp.id, org_id=org_id, user_id=student.id,
            project_id=None, start_time=start, end_time=end,
            purpose=f"学生 {student.name} 使用 {sp.name} 进行项目制作",
            participant_count=1 + (i % 3), required_equipment='["工具","耗材"]',
            status=booking_statuses[i % len(booking_statuses)],
            approved_by=None, approved_at=None,
            actual_start_time=start if i != 1 else None,
            actual_end_time=end if i != 1 else None,
            feedback="空间设备齐全，环境良好。" if i != 1 else "",
            rating=5 - (i % 2),
        )
        db.add(sb)

    db.flush()
    print(f"  [OK] 创客空间: {len(spaces)} 个空间及预约已创建")


# ================== 6. 营销与优惠券 ==================

def _seed_marketing(db, org_id):
    # 社交媒体账号
    social_templates = [
        (SocialPlatform.WECHAT, "STEM 教育中心", "gh_stem_demo", 2500, 120, 30),
        (SocialPlatform.DOUYIN, "STEM 创意工坊", "stem_creative", 8000, 300, 80),
        (SocialPlatform.XIAOHONGSHU, "创客小姐姐", "maker_lady", 4500, 80, 50),
    ]
    for platform, name, acc_id, followers, posts, likes in social_templates:
        s = SocialMediaAccount(
            org_id=org_id, platform=platform, account_name=name, account_id=acc_id,
            followers_count=followers, total_posts=posts, total_likes=posts * likes,
            conversion_leads=posts // 5, is_active=True,
        )
        db.add(s)

    # 营销活动
    campaign_templates = [
        ("春季 STEM 课程大促", CampaignType.DISCOUNT, "限时优惠课程", CampaignStatus.ACTIVE, 150, 200, 8.5, 36000.0),
        ("好友推荐计划", CampaignType.REFERRAL, "老学员推荐新学员双方有礼", CampaignStatus.ACTIVE, 80, 100, 7.5, 18000.0),
        ("暑期创客营招生", CampaignType.GROUP_BUY, "3 人成团享 8 折", CampaignStatus.PLANNED, 0, 60, None, 0.0),
        ("新生早鸟优惠", CampaignType.EARLY_BIRD, "提前 2 个月报名立减 500 元", CampaignStatus.ENDED, 200, 250, 6.5, 98000.0),
    ]
    campaigns = []
    today = date.today()
    for i, (name, ctype, desc, status, parts, target, conv, revenue) in enumerate(campaign_templates):
        start = datetime(today.year, today.month, 1) - timedelta(days=i * 30)
        end = start + timedelta(days=60)
        c = MarketingCampaign(
            org_id=org_id, name=name, type=ctype, description=desc,
            start_date=start, end_date=end,
            participants_count=parts, target_participants=target,
            conversion_rate=conv, revenue=revenue, status=status,
        )
        db.add(c)
        campaigns.append(c)
    db.flush()

    # 优惠券
    coupon_templates = [
        ("新学员 500 元优惠券", "fixed", 500.0, 3000.0, "仅限新课程使用", 50, 10),
        ("老学员续费 9 折券", "percentage", 10.0, 2000.0, "续费课程可用", 100, 25),
        ("暑期课程立减 300 元", "fixed", 300.0, 2500.0, "暑期课程专享", 80, 15),
    ]
    for i, (name, dtype, dvalue, min_a, cond, total, used) in enumerate(coupon_templates):
        cp = campaigns[i % len(campaigns)]
        coupon = Coupon(
            org_id=org_id, campaign_id=cp.id,
            code=f"DEMO-{i + 1:03d}-{org_id}", name=name,
            discount_type=dtype, discount_value=dvalue, min_amount=min_a,
            condition_description=cond, total_quantity=total, used_quantity=used,
            expiry_date=datetime.utcnow() + timedelta(days=60), is_active=True,
        )
        db.add(coupon)

    db.flush()
    print(f"  [OK] 营销管理: 社交媒体、{len(campaigns)} 个活动及优惠券已创建")


# ================== 7. 家长中心 ==================

def _seed_parent_portal(db, org_id, students, courses):
    # 课堂反馈
    feedback_templates = [
        ("课堂表现积极，参与度高", "课后完成编程练习"),
        ("团队合作良好，动手能力强", "完成机器人搭建报告"),
        ("专注度高，问题解答清晰", "撰写实验报告"),
        ("创意十足，设计新颖", "完成 3D 模型设计"),
    ]
    for i, student in enumerate(students[:6]):
        course = courses[i % len(courses)]
        rating = [FeedbackRating.EXCELLENT, FeedbackRating.GOOD,
                  FeedbackRating.AVERAGE][i % 3]
        content, homework = feedback_templates[i % len(feedback_templates)]
        fb = ClassFeedback(
            org_id=org_id, student_id=student.id,
            course_name=course.title, teacher_name="李老师",
            content=content, homework=homework,
            rating=rating,
            class_date=datetime.utcnow() - timedelta(days=3 + i),
            feedback_time=datetime.utcnow() - timedelta(days=2 + i),
            is_read=(i % 2 == 0),
        )
        db.add(fb)

    # 学员成就
    achievement_templates = [
        ("机器人竞赛一等奖", "competition", "在市级机器人竞赛中荣获一等奖", "🏆"),
        ("Python 编程证书", "certificate", "通过 Python 编程等级考试（二级）", "📜"),
        ("3D 打印作品展示", "award", "作品《创意建筑》入选校园展示", "🎖"),
        ("优秀学员", "award", "学期综合评定优秀", "⭐"),
        ("科学实验技能认证", "skill", "完成 10 个科学实验并通过考核", "🔬"),
    ]
    for i, student in enumerate(students[:5]):
        name, atype, desc, icon = achievement_templates[i]
        ach = StudentAchievement(
            org_id=org_id, student_id=student.id, name=name, type=atype,
            description=desc, achieved_date=datetime(2026, 4, 1 + i),
            icon=icon, certificate_url=f"https://demo.org/cert/{student.id}/{i}",
        )
        db.add(ach)

    # 家长消息
    msg_templates = [
        ("本学期社团活动安排已发布，请查阅。", "general"),
        ("孩子本周课堂表现优秀，建议继续保持！", "achievement"),
        ("下周三将举办家长开放日，诚邀参与。", "general"),
        ("本学期学费即将到期，请及时办理续费。", "payment_reminder"),
        ("孩子的项目作品已完成，请查看成果展示。", "achievement"),
    ]
    for i, student in enumerate(students[:5]):
        content, mtype = msg_templates[i]
        pm = ParentMessage(
            org_id=org_id, student_id=student.id,
            sender_type="teacher", sender_name="李老师",
            content=content, message_type=mtype,
            is_read=(i % 2 == 1), read_time=datetime.utcnow() if i % 2 == 1 else None,
            parent_message_id=None,
        )
        db.add(pm)

    db.flush()
    print(f"  [OK] 家长中心: 课堂反馈、学员成就及家长消息已创建")


# ================== 8. 学员管理 ==================

def _seed_student_mgmt(db, org_id, students, courses, classrooms, teachers):
    for i, student in enumerate(students[:6]):
        course = courses[i % len(courses)]
        status = ["active", "active", "active", "completed", "active", "cancelled"]
        e = Enrollment(
            org_id=org_id, student_id=student.id, course_id=course.id,
            enrollment_date=datetime(2025, 9, 1 + i),
            start_date=datetime(2025, 9, 1 + i),
            end_date=datetime(2026, 7, 1),
            status=status[i % len(status)],
            fee_amount=1200 + i * 100, payment_status=["paid", "pending"][i % 2],
            progress_percentage=(i + 1) * 15,
            last_attendance_date=datetime.utcnow() - timedelta(days=i),
        )
        db.add(e)
    db.flush()

    for i, student in enumerate(students[:6]):
        for j in range(3):
            att_date = datetime.utcnow() - timedelta(days=j * 3 + i)
            statuses = ["present", "present", "present", "late", "absent"]
            att = AttendanceRecord(
                org_id=org_id, student_id=student.id, schedule_id=None,
                attendance_date=att_date, status=statuses[(i + j) % len(statuses)],
                check_in_time=att_date.replace(hour=9, minute=0 + j),
                notes="正常" if j % 3 != 2 else "请假说明：身体不适",
            )
            db.add(att)

    # 课程排课（ClassSchedule）
    teacher = teachers[0] if teachers else None
    for i, course in enumerate(courses[:4]):
        classroom = classrooms[i % len(classrooms)]
        cs = ClassSchedule(
            org_id=org_id, classroom_id=classroom.id, course_id=course.id,
            teacher_id=getattr(teacher, "id", None) if teacher else None,
            day_of_week=(i % 6) + 1,
            start_time=datetime(2026, 6, 1, 9 + i, 0),
            end_time=datetime(2026, 6, 1, 11 + i, 0),
            duration_minutes=120,
            start_date=datetime(2026, 3, 1),
            end_date=datetime(2026, 7, 10),
            recurrence_pattern="weekly",
            is_active=True, is_confirmed=True,
        )
        db.add(cs)

    db.flush()
    print(f"  [OK] 学员管理: 报名记录、出勤记录及课程排课已创建")


# ================== 9. 竞赛与认证 ==================

def _seed_competitions(db, org_id, students):
    comp_templates = [
        ("2026 年市青少年机器人竞赛", CompetitionLevel.CITY, CompetitionCategory.ROBOTICS,
         "全市中小学生参与的机器人工程挑战赛", CompetitionStatus.REGISTERING, 80, 100),
        ("全国青少年编程创意大赛", CompetitionLevel.NATIONAL, CompetitionCategory.PROGRAMMING,
         "Python/Scratch 创意编程作品评比", CompetitionStatus.PREPARING, 0, 150),
        ("省级创客创新大赛", CompetitionLevel.PROVINCIAL, CompetitionCategory.MAKER,
         "3D 打印、智能硬件、创新发明三大赛项", CompetitionStatus.COMPLETED, 120, 200),
        ("市青少年无人机竞速赛", CompetitionLevel.CITY, CompetitionCategory.ROBOTICS,
         "无人机穿越障碍竞速比赛", CompetitionStatus.REGISTERING, 40, 80),
    ]
    competitions = []
    for name, lvl, cat, desc, status, parts, max_p in comp_templates:
        c = Competition(
            org_id=org_id, name=name, organizer="市教育局/科协",
            level=lvl, category=cat, description=desc,
            register_deadline=datetime.utcnow() + timedelta(days=30),
            competition_date=datetime.utcnow() + timedelta(days=60),
            participants_count=parts, max_participants=max_p,
            status=status, achievements="往届获奖记录丰富",
            rules="详细规则见活动官网",
        )
        db.add(c)
        competitions.append(c)
    db.flush()

    # 竞赛报名
    for i, comp in enumerate(competitions[:3]):
        for j in range(3):
            student = students[(i + j) % len(students)]
            reg_statuses = ["已报名", "已缴费", "已报名", "已报名"]
            pay_statuses = ["未缴费", "已缴费", "未缴费"]
            cr = CompetitionRegistration(
                org_id=org_id, competition_id=comp.id, student_id=student.id,
                student_name=student.name,
                parent_name=f"{student.name}家长",
                phone=student.guardian_phone or "13800000000",
                grade=student.grade_level,
                project_name=f"{comp.name[:10]} - 个人作品 {j + 1}",
                project_description=f"基于 {comp.category.value} 的创意项目作品",
                registration_status=reg_statuses[j % len(reg_statuses)],
                payment_status=pay_statuses[j % len(pay_statuses)],
                award_level=["一等奖", "二等奖", "三等奖"][j % 3] if comp.status == CompetitionStatus.COMPLETED else None,
                score=85.0 + j * 3 if comp.status == CompetitionStatus.COMPLETED else None,
                register_time=datetime.utcnow() - timedelta(days=10 + j),
            )
            db.add(cr)

    # 认证项目
    cert_templates = [
        ("Python 编程等级认证", "编程/Python", "一级,二级,三级", 50, 88.5, 300),
        ("青少年机器人技术等级", "机器人", "一级,二级,三级,四级", 80, 82.3, 500),
        ("3D 打印创意设计认证", "创客", "初级,中级,高级", 30, 90.0, 280),
        ("青少年人工智能技术水平", "AI", "一级,二级,三级", 40, 85.0, 400),
    ]
    certs = []
    for i, (name, atype, levels, reg_stu, pass_r, fee) in enumerate(cert_templates):
        cert = Certification(
            org_id=org_id, name=name, organizer="中国青少年 STEM 教育协会",
            certification_type=atype, levels=levels,
            next_exam_date=datetime.utcnow() + timedelta(days=60 + i * 10),
            exam_location=f"示范市考试中心 #{i + 1}",
            registered_students=reg_stu, pass_rate=pass_r, exam_fee=fee,
            description=f"{name} - 青少年 STEM 技能认证",
            requirements="需完成对应课程学习并通过考核",
        )
        db.add(cert)
        certs.append(cert)
    db.flush()

    # 考试报名
    for i, cert in enumerate(certs[:3]):
        for j in range(2):
            student = students[(i * 2 + j) % len(students)]
            er = ExamRegistration(
                org_id=org_id, certification_id=cert.id, student_id=student.id,
                student_name=student.name, parent_name=f"{student.name}家长",
                phone=student.guardian_phone or "13900000000",
                grade=student.grade_level,
                exam_level=["一级", "二级", "三级"][j % 3],
                exam_date=cert.next_exam_date,
                registration_status=["已报名", "已缴费"][j % 2],
                payment_status=["未缴费", "已缴费"][j % 2],
                exam_score=85.0 + j * 5 if j % 2 == 0 else None,
                passed=(j % 2 == 0),
                certificate_number=f"CERT-{org_id}-{i * 100 + j:04d}" if j % 2 == 0 else None,
                register_time=datetime.utcnow() - timedelta(days=15 + j),
            )
            db.add(er)

    db.flush()
    print(f"  [OK] 竞赛与认证: {len(competitions)} 个竞赛、报名及认证项目已创建")


# ================== 10. 备份与恢复 ==================

def _seed_backups(db, org_id):
    backup_templates = [
        (BackupType.DAILY_INCREMENTAL, BackupStatus.COMPLETED, 780, 2.5),
        (BackupType.DAILY_INCREMENTAL, BackupStatus.COMPLETED, 920, 3.1),
        (BackupType.WEEKLY_FULL, BackupStatus.COMPLETED, 15400, 52.0),
        (BackupType.DAILY_INCREMENTAL, BackupStatus.FAILED, 0, 0.0),
        (BackupType.MANUAL, BackupStatus.COMPLETED, 12000, 45.0),
    ]
    snapshots = []
    for i, (btype, status, record_count, size_mb) in enumerate(backup_templates):
        started = datetime.utcnow() - timedelta(days=i + 1, hours=i)
        snap = BackupSnapshot(
            org_id=org_id,
            snapshot_id=f"SNAP-{org_id}-{datetime.now().strftime('%Y%m%d')}-{i + 1:03d}",
            label=f"{btype.value} 备份 #{i + 1}",
            backup_type=btype, status=status,
            storage_path=f"s3://demo-backup/org-{org_id}/snap-{i + 1}",
            file_size_bytes=int(size_mb * 1024 * 1024),
            checksum=f"sha256-{org_id}-{i}",
            tables_included=["students", "courses", "clubs", "projects"],
            record_count=record_count,
            started_at=started,
            completed_at=started + timedelta(minutes=15),
            expires_at=started + timedelta(days=90),
            error_message="网络超时，备份失败" if status == BackupStatus.FAILED else None,
        )
        db.add(snap)
        snapshots.append(snap)
    db.flush()

    # 恢复操作
    if snapshots:
        ro = RestoreOperation(
            org_id=org_id, snapshot_id=snapshots[0].id,
            status=RestoreStatus.COMPLETED,
            safety_snapshot_id=snapshots[0].snapshot_id,
            initiated_by="admin", initiated_at=datetime.utcnow() - timedelta(days=3),
            completed_at=datetime.utcnow() - timedelta(days=3, hours=-1),
            records_restored=780, error_message=None,
        )
        db.add(ro)
        ro2 = RestoreOperation(
            org_id=org_id, snapshot_id=snapshots[2].id,
            status=RestoreStatus.PENDING,
            safety_snapshot_id=snapshots[2].snapshot_id,
            initiated_by="teacher_01", initiated_at=datetime.utcnow() - timedelta(hours=2),
            completed_at=None, records_restored=0,
        )
        db.add(ro2)

    db.flush()
    print(f"  [OK] 备份与恢复: {len(snapshots)} 个快照及恢复记录已创建")


# ================== 11. Token 计费 ==================

def _seed_token_billing(db, org_id, students):
    # Token 套餐
    pkg_templates = [
        ("基础体验包", "适合个人学习和小项目", 1000, 299.0, 30, True),
        ("标准教育包", "学校/培训机构常用", 5000, 999.0, 365, True),
        ("高级开发者包", "团队项目、高级功能", 20000, 2999.0, 365, False),
    ]
    packages = []
    for i, (name, desc, tokens, price, days, popular) in enumerate(pkg_templates):
        p = TokenPackage(
            org_id=org_id, name=name, description=desc,
            token_amount=tokens, price=price, currency="CNY",
            validity_days=days, is_active=True, is_popular=popular,
        )
        db.add(p)
        packages.append(p)
    db.flush()

    # Token 余额
    tb = TokenBalance(
        org_id=org_id, balance=26500, total_purchased=26000,
        total_consumed=0, total_refunded=0, total_bonus=500,
        last_transaction_at=datetime.utcnow(),
    )
    db.add(tb)
    db.flush()

    # Token 交易
    for i in range(4):
        ttypes = [TokenTransactionType.PURCHASE, TokenTransactionType.PURCHASE,
                   TokenTransactionType.BONUS, TokenTransactionType.PURCHASE]
        tt = TokenTransaction(
            org_id=org_id, balance_id=tb.id,
            transaction_type=ttypes[i], token_type=TokenType.AI_TUTOR,
            amount=[1000, 5000, 500, 20000][i],
            description=f"{['初次购买', '续费充值', '平台奖励', '团队套餐'][i]}",
            reference_id=f"REF-{i + 1}", user_id=students[i % len(students)].id,
            unit_price=[0.3, 0.25, 0.0, 0.15][i],
            total_cost=[300.0, 1250.0, 0.0, 3000.0][i],
            created_at=datetime.utcnow() - timedelta(days=30 - i * 7),
        )
        db.add(tt)

    # Token 使用日志
    for i in range(8):
        student = students[i % len(students)]
        usage = TokenUsageLog(
            org_id=org_id, user_id=student.id,
            token_type=[TokenType.AI_TUTOR, TokenType.SMART_ASSESSMENT,
                        TokenType.CODE_REVIEW, TokenType.PROJECT_SUGGESTION][i % 4],
            amount=50 + i * 10,
            description=f"学生 {student.name} 使用 AI 助教功能",
            session_id=f"SESS-{org_id}-{i + 1:04d}",
            api_endpoint=["/api/ai/chat", "/api/ai/assess", "/api/ai/review", "/api/ai/suggest"][i % 4],
            input_tokens=200 + i * 30, output_tokens=150 + i * 20,
            processing_time=1.5 + i * 0.2,
            created_at=datetime.utcnow() - timedelta(days=15 - i),
        )
        db.add(usage)

    # Token 订单
    for i, pkg in enumerate(packages):
        order = TokenOrder(
            org_id=org_id,
            order_no=f"TK{datetime.now().strftime('%Y%m%d')}{org_id}{i + 1:04d}",
            package_id=pkg.id, user_id=students[i % len(students)].id,
            token_amount=pkg.token_amount, price=pkg.price, currency="CNY",
            payment_method=[PaymentMethod.WECHAT, PaymentMethod.ALIPAY, PaymentMethod.MOCK][i % 3],
            status=[TokenOrderStatus.SUCCESS, TokenOrderStatus.PENDING, TokenOrderStatus.CANCELLED][i % 3],
            transaction_id=f"TXN-{org_id}-{i + 1}",
            paid_at=datetime.utcnow() - timedelta(days=i + 1) if i != 1 else None,
            failure_reason="用户取消订单" if i == 2 else None,
            created_at=datetime.utcnow() - timedelta(days=i + 2),
            updated_at=datetime.utcnow() - timedelta(days=i + 1),
        )
        db.add(order)

    db.flush()
    print(f"  [OK] Token 计费: {len(packages)} 个套餐、交易及订单已创建")


# ================== 12. 租户配置 ==================

def _seed_tenant_config(db, org_id):
    # 租户业务配置
    tc = TenantConfig(
        org_id=org_id, is_active=True,
        config_data={
            "organization_type": "training_center",
            "default_language": "zh-CN",
            "timezone": "Asia/Shanghai",
            "currency": "CNY",
            "max_users": 1000,
            "features": {
                "student_management": True,
                "course_management": True,
                "ai_assistant": True,
                "parent_portal": True,
            },
            "payment_settings": {
                "wechat_pay": True,
                "alipay": True,
                "bank_transfer": True,
            },
        },
    )
    db.add(tc)

    # 功能开关
    feature_keys = [
        ("admissions", True, {"enabled": True, "module": "招生线索管理"}),
        ("live_streaming", True, {"enabled": True, "module": "直播授课"}),
        ("parent_portal", True, {"enabled": True, "module": "家长中心"}),
        ("ai_assistant", True, {"enabled": True, "module": "AI 助教"}),
        ("payment_gateway", True, {"enabled": True, "module": "在线支付"}),
        ("backup_auto", True, {"enabled": True, "module": "自动备份"}),
        ("reporting", True, {"enabled": True, "module": "数据报表"}),
    ]
    for key, enabled, cfg in feature_keys:
        ff = TenantFeatureFlag(
            org_id=org_id, feature_key=key, is_enabled=enabled,
            extra_config=cfg,
        )
        db.add(ff)

    db.flush()
    print(f"  [OK] 租户配置: 业务配置及 {len(feature_keys)} 个功能开关已创建")


# ================== 13. 消息通知 ==================

def _seed_notifications(db, org_id, students):
    notif_templates = [
        ("课程提醒", "您的课程将于明天上午 9:00 开始，请准时参加",
         NotificationType.SCHEDULE, NotificationPriority.MEDIUM),
        ("缴费提醒", "您有一笔课程费用待支付，请及时处理",
         NotificationType.PAYMENT, NotificationPriority.HIGH),
        ("系统维护通知", "系统将于本周日凌晨 2:00-4:00 进行维护",
         NotificationType.SYSTEM, NotificationPriority.LOW),
        ("竞赛报名开放", "2026 年度青少年机器人竞赛报名已开启",
         NotificationType.ACTIVITY, NotificationPriority.HIGH),
        ("家长公告", "本周五将举办家长开放日活动，欢迎参与",
         NotificationType.APPROVAL, NotificationPriority.MEDIUM),
        ("活动预告", "下月初举办创客成果展，欢迎参观",
         NotificationType.ACTIVITY, NotificationPriority.LOW),
        ("续费预警", "您的课程将于 30 天内结束，建议续费",
         NotificationType.RENEWAL, NotificationPriority.HIGH),
    ]
    for i, (title, content, ntype, prio) in enumerate(notif_templates):
        student = students[i % len(students)]
        n = Notification(
            org_id=org_id, title=title, content=content,
            type=ntype, priority=prio,
            is_read=(i % 2 == 0),
            read_time=datetime.utcnow() if i % 2 == 0 else None,
            related_type="student", related_id=student.id,
            action_label="查看详情", action_url="/notifications/demo",
            create_time=datetime.utcnow() - timedelta(days=10 - i),
            expire_time=datetime.utcnow() + timedelta(days=30),
        )
        db.add(n)

    db.flush()
    print(f"  [OK] 消息通知: {len(notif_templates)} 条通知已创建")


# ================== 14. 教学资源 ==================

def _seed_resources(db, org_id):
    # 资源分类
    category_templates = [
        (f"Arduino 课件库 (Org{org_id})", "🔧", "Arduino 编程与电子制作相关课件", 1),
        (f"Python 教学资源 (Org{org_id})", "🐍", "Python 编程入门与进阶教学资料", 2),
        (f"3D 打印设计 (Org{org_id})", "🖨", "3D 模型设计与打印教学", 3),
        (f"机器人教学 (Org{org_id})", "🤖", "机器人搭建、编程与竞赛资料", 4),
        (f"科学实验手册 (Org{org_id})", "🔬", "物理、化学、生物趣味实验", 5),
        (f"AI 启蒙资源 (Org{org_id})", "🧠", "人工智能基础与实践资料", 6),
    ]
    categories = []
    for name, icon, desc, order in category_templates:
        cat = ResourceCategory(
            org_id=org_id, name=name, icon=icon, description=desc,
            sort_order=order, resource_count=2,
        )
        db.add(cat)
        categories.append(cat)
    db.flush()

    # 教学资源
    resource_templates = [
        ("Arduino 入门教程 V1.0", "Arduino 基础编程与电路实验", "PROJECT_DOC", "PDF", 5.2),
        ("LED 闪烁实验手册", "第一个 Arduino 项目实战指南", "PROJECT_DOC", "PDF", 2.1),
        ("Python 编程入门", "从零开始学 Python", "PROJECT_DOC", "PDF", 8.5),
        ("Python 项目演示视频", "基础项目实战视频教程", "VIDEO", "MP4", 120.0),
        ("Tinkercad 3D 建模教程", "在线 3D 设计入门教程", "PROJECT_DOC", "PDF", 6.8),
        ("3D 打印作品 STL 文件集", "教学用 3D 模型文件", "CODE", "ZIP", 45.0),
        ("机器人搭建手册", "VEX IQ 机器人搭建指南", "PROJECT_DOC", "PDF", 15.3),
        ("趣味物理实验合集", "10 个经典物理实验详解", "PROJECT_DOC", "PDF", 9.7),
        ("AI 图像识别实验", "使用 Teachable Machine 做图像识别", "VIDEO", "MP4", 80.0),
        ("创客项目源码集", "教学项目源代码", "CODE", "ZIP", 35.0),
    ]
    for i, (name, desc, rtype, fmt, size) in enumerate(resource_templates):
        cat = categories[i % len(categories)]
        res = TeachingResource(
            org_id=org_id, name=name, description=desc,
            category=cat.name,
            resource_type=rtype, format=fmt,
            file_size=size,
            file_path=f"/resources/org-{org_id}/{i + 1}.{fmt}",
            download_count=10 + i * 5,
            tags="STEM,教学,演示",
            difficulty_level=["初级", "中级", "高级"][i % 3],
            upload_time=datetime.utcnow() - timedelta(days=60 - i * 5),
            last_download_time=datetime.utcnow() - timedelta(days=i),
        )
        db.add(res)

    db.flush()
    print(f"  [OK] 教学资源: {len(categories)} 个分类、{len(resource_templates)} 份资源已创建")


# ================== 15. 招生线索与结算 ==================

def _seed_leads(db, org_id, teachers):
    lead_templates = [
        ("王家长", "13811110001", "三年级", "线上咨询", "Arduino 入门课程", LeadStatus.APPOINTED),
        ("李家长", "13811110002", "五年级", "老带新", "Python 编程入门", LeadStatus.ENROLLED),
        ("张家长", "13811110003", "四年级", "上门咨询", "3D 打印创客工坊", LeadStatus.PENDING),
        ("赵家长", "13811110004", "六年级", "广告投放", "机器人竞赛集训", LeadStatus.INVALID),
        ("钱家长", "13811110005", "七年级", "老带新", "人工智能探索", LeadStatus.APPOINTED),
        ("孙家长", "13811110006", "二年级", "地推活动", "科学实验探索", LeadStatus.PENDING),
    ]
    leads = []
    for i, (pname, phone, grade, source, course, status) in enumerate(lead_templates):
        lead = Lead(
            org_id=org_id, parent_name=pname, phone=phone,
            student_grade=grade, source=source, interest_course=course,
            status=status,
            create_time=datetime.utcnow() - timedelta(days=15 - i),
            follow_up_time=datetime.utcnow() + timedelta(days=i + 1),
            last_contact_time=datetime.utcnow() - timedelta(days=i),
        )
        db.add(lead)
        leads.append(lead)
    db.flush()

    for i, lead in enumerate(leads):
        for j in range(2):
            fu = LeadFollowUp(
                lead_id=lead.id, org_id=org_id,
                contact_method=["电话", "微信", "面谈"][(i + j) % 3],
                content=f"第 {j + 1} 次跟进：介绍课程详情，家长表示感兴趣。",
                result=["家长有意向，约定试听", "家长暂不考虑，保持联系",
                        "家长已报名缴费", "继续跟进"][(i + j) % 4],
                follow_up_time=datetime.utcnow() - timedelta(days=i + j * 2),
                next_follow_up_time=datetime.utcnow() + timedelta(days=i + j * 3 + 3),
            )
            db.add(fu)

    # 教师结算记录
    # 先查询已存在的 schedule 记录
    from models.schedule import Schedule as ScheduleModel
    existing_schedule = db.query(ScheduleModel).filter_by(org_id=org_id).first()
    schedule_id = existing_schedule.id if existing_schedule else 1

    for i, teacher in enumerate(teachers[:2]):
        teacher_id = getattr(teacher, "id", None) if teacher else 1
        if not teacher_id:
            continue
        hours = 40 + i * 10
        rate = 120
        s = Settlement(
            org_id=org_id,
            teacher_id=teacher_id,
            schedule_id=schedule_id,
            hours=hours,
            rate=rate,
            total_amount=hours * rate,
            is_confirmed=(i % 2 == 0),
            settlement_date=datetime.utcnow() - timedelta(days=i + 1),
        )
        db.add(s)

    db.flush()
    print(f"  [OK] 招生线索: {len(leads)} 条线索、{len(leads) * 2} 条跟进及结算记录已创建")


# ================== 主函数 ==================

def create_all_remaining_demo_data(db, organizations):
    """主函数：为所有组织创建剩余表的演示数据"""
    for org in organizations:
        if not hasattr(org, "id"):
            continue
        print(f"\n===== 为组织 {getattr(org, 'name', 'Org')} (ID: {org.id}) 创建演示数据 =====")
        teachers = [_pick_teacher_for_org(db, org.id)]
        students = _ensure_students_for_org(db, org.id, count=12)
        courses = _ensure_courses_for_org(db, org.id)
        classrooms = _ensure_classrooms_for_org(db, org.id)

        _seed_clubs(db, org.id, teachers, students)
        _seed_consumables(db, org.id, students)
        _seed_hardware_devices(db, org.id, students)
        _seed_stem_projects(db, org.id, teachers, students)
        _seed_maker_space(db, org.id, students)
        _seed_marketing(db, org.id)
        _seed_parent_portal(db, org.id, students, courses)
        _seed_student_mgmt(db, org.id, students, courses, classrooms, teachers)
        _seed_competitions(db, org.id, students)
        _seed_backups(db, org.id)
        _seed_token_billing(db, org.id, students)
        _seed_tenant_config(db, org.id)
        _seed_notifications(db, org.id, students)
        _seed_resources(db, org.id)
        _seed_leads(db, org.id, teachers)
        _seed_equipment_allocations(db, org.id)
        _seed_equipment_slots(db, org.id, students)
        _seed_license_logs(db, org.id)
        _seed_legacy_token_packages(db, org.id)
        _seed_voc_incidents(db, org.id)
        _seed_voc_inventory(db, org.id)
        _seed_voc_training_schedules(db, org.id)
        _seed_voc_incubator_members(db, org.id)

    print("\n===== 所有剩余表演示数据创建完成 =====")


# ================== 16. 设备分配（Bureau 模块） ==================

def _seed_equipment_allocations(db, org_id):
    # 查询已存在的学校、设备和请求
    schools = db.query(BureauSchool).filter_by(bureau_id=org_id).all()
    equipment_pool = db.query(BureauEquipmentPool).filter_by(bureau_id=org_id).all()
    requests = db.query(EquipmentRequest).filter_by(bureau_id=org_id).all()

    if not schools or not equipment_pool:
        return

    for i, (school, equipment) in enumerate(zip(schools[:2], equipment_pool[:4])):
        for j in range(2):
            allocation = EquipmentAllocation(
                bureau_id=org_id,
                equipment_item_id=equipment.id,
                school_id=school.id,
                request_id=requests[j % len(requests)].id if requests else None,
                quantity=5 + j * 3,
                allocation_type=[AllocationType.NEW, AllocationType.SUPPLEMENT][j % 2],
                status=[AllocationStatus.PENDING, AllocationStatus.APPROVED,
                        AllocationStatus.DELIVERING, AllocationStatus.RECEIVED][j % 4],
                approval_date=datetime.utcnow() - timedelta(days=10 - j * 2),
                delivery_date=datetime.utcnow() - timedelta(days=7 - j) if j % 2 == 0 else None,
                received_date=datetime.utcnow() - timedelta(days=5 - j) if j % 3 == 0 else None,
                approval_comment="符合配发标准，已批准" if j % 2 == 0 else "补充配发",
                operated_by=None,
            )
            db.add(allocation)
    db.flush()


# ================== 17. 设备时段预约 ==================

def _seed_equipment_slots(db, org_id, students):
    # 查询已存在的设备和项目
    from models.hardware_device import HardwareDevice
    from models.stem_project import STEMProject

    devices = db.query(HardwareDevice).filter_by(org_id=org_id).all()
    projects = db.query(STEMProject).filter_by(org_id=org_id).all()

    if not devices or not students:
        return

    for i, device in enumerate(devices[:3]):
        for j in range(3):
            start = datetime.utcnow() + timedelta(days=j + 1, hours=9)
            end = start + timedelta(hours=2)
            slot = EquipmentSlot(
                org_id=org_id,
                device_id=device.id,
                user_id=students[(i + j) % len(students)].id,
                project_id=projects[(i + j) % len(projects)].id if projects else None,
                start_time=start,
                end_time=end,
                purpose=f"{['项目实验', '课程学习', '竞赛准备'][j % 3]} - 使用 {device.name}",
                status=[BookingStatus.PENDING, BookingStatus.CONFIRMED,
                        BookingStatus.COMPLETED][j % 3],
            )
            db.add(slot)
    db.flush()


# ================== 18. 许可证活动日志和验证尝试 ==================

def _seed_license_logs(db, org_id):
    # 查询组织的许可证
    licenses = db.query(License).filter_by(organization_id=org_id).all()
    if not licenses:
        return

    for i, lic in enumerate(licenses):
        # 活动日志
        for j in range(3):
            log = LicenseActivityLog(
                license_key=lic.license_key,
                organization_id=org_id,
                activity_type=["validate", "activate", "revoke", "check"][j % 4],
                activity_description=["许可证验证", "激活许可证", "撤销许可证", "检查许可证状态"][j % 4],
                ip_address=f"192.168.{i + 1}.{j + 10}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpenMT/1.0",
                details={"success": True, "version": "1.0.0", "instance": f"org-{org_id}"},
                created_at=datetime.utcnow() - timedelta(days=30 - j * 7),
            )
            db.add(log)

        # 验证尝试
        for j in range(4):
            attempt = LicenseValidationAttempt(
                license_key=lic.license_key,
                ip_address=f"192.168.{i + 1}.{j + 100}",
                user_agent="Mozilla/5.0 OpenMT/1.0",
                is_valid=(j % 3 != 0),  # 1/3 无效
                validation_result={
                    "valid": j % 3 != 0,
                    "license_type": lic.license_type.value if hasattr(lic.license_type, 'value') else str(lic.license_type),
                    "max_users": lic.max_users,
                },
                created_at=datetime.utcnow() - timedelta(days=25 - j * 5),
            )
            db.add(attempt)
    db.flush()


# ================== 19. 旧版 Token 套餐与充值/使用记录 ==================

def _seed_legacy_token_packages(db, org_id):
    # 创建 Token 套餐
    packages = []
    pkg_templates = [
        ("免费版（月度赠送）", TokenPackageType.FREE, 0, 0.0, 30),
        ("标准套餐", TokenPackageType.STANDARD, 5000, 199.0, 365),
        ("高级套餐", TokenPackageType.PREMIUM, 20000, 599.0, 365),
        ("企业版套餐", TokenPackageType.ENTERPRISE, 100000, 2999.0, 365),
    ]
    for name, ptype, tokens, price, days in pkg_templates:
        pkg = LegacyTokenPackage(
            name=name,
            package_type=ptype,
            token_count=tokens,
            price=price,
            valid_days=days,
            is_active=True,
            bonus_features=["优先客服", "技术支持", "专属顾问"] if ptype == TokenPackageType.ENTERPRISE else [],
        )
        db.add(pkg)
        packages.append(pkg)
    db.flush()

    # 查询用户 Token 余额
    user_balances = db.query(UserTokenBalance).all()
    if not user_balances:
        return

    # Token 充值记录
    for i, ub in enumerate(user_balances[:3]):
        pkg = packages[(i + 1) % len(packages)]  # 不使用免费版
        for j in range(2):
            recharge = TokenRechargeRecord(
                user_balance_id=ub.id,
                package_id=pkg.id,
                token_amount=pkg.token_count,
                payment_amount=pkg.price,
                payment_method=["wechat", "alipay"][j % 2],
                payment_status=["success", "success", "pending"][j % 3],
                payment_time=datetime.utcnow() - timedelta(days=60 - j * 30),
                order_no=f"ORD{org_id}{datetime.now().strftime('%Y%m%d%H%M%S')}{i}{j}",
            )
            db.add(recharge)

    # Token 使用记录
    for i, ub in enumerate(user_balances[:4]):
        for j in range(3):
            usage = TokenUsageRecord(
                user_balance_id=ub.id,
                token_amount=100 + j * 50,
                usage_type=["ai_teacher", "course_generation", "code_review",
                             "project_assessment", "auto_grading"][j % 5],
                usage_description=f"{['AI 助教答疑', '智能生成课程', '代码评审', '项目评估', '智能评分'][j % 5]}",
                resource_id=None,
                resource_type=None,
            )
            db.add(usage)
    db.flush()


# ================== 20. 实训事故报告 ==================

def _seed_voc_incidents(db, org_id):
    from models.vocational_safety import VocIncidentReport, VocIncidentType

    incident_templates = [
        (VocIncidentType.EQUIPMENT_DAMAGE, "3D 打印机喷嘴损坏", "minor", "设备老化导致"),
        (VocIncidentType.PERSONAL_INJURY, "学生手指轻微割伤", "minor", "操作不当导致"),
        (VocIncidentType.ELECTRIC_SHOCK, "电路短路，无人员受伤", "major", "设备漏电保护触发"),
        (VocIncidentType.CHEMICAL_LEAK, "化学试剂瓶盖未拧紧", "minor", "及时发现并处理"),
        (VocIncidentType.OTHER, "实训室门锁损坏", "minor", "需要维修"),
    ]

    for i, (itype, desc, severity, handling) in enumerate(incident_templates):
        incident = VocIncidentReport(
            org_id=org_id,
            incident_type=itype,
            location_room=f"实训室{i + 1}",
            description=desc,
            severity=severity,
            reporter_id=None,
            reporter_name=f"教师{i + 1}",
            incident_date=datetime.utcnow() - timedelta(days=60 - i * 10),
            handling=handling,
            status=["pending", "handling", "resolved"][i % 3],
            resolved_at=datetime.utcnow() - timedelta(days=50 - i * 8) if i % 2 == 0 else None,
        )
        db.add(incident)
    db.flush()


# ================== 21. 实训设备盘点记录 ==================

def _seed_voc_inventory(db, org_id):
    from models.vocational_equipment import VocEquipment, VocInventoryRecord

    # 查询实训室
    from models.vocational_safety import VocTrainingRoom
    rooms = db.query(VocTrainingRoom).filter_by(org_id=org_id).all()
    equipment = db.query(VocEquipment).filter_by(org_id=org_id).all()

    if not rooms or not equipment:
        return

    for i, room in enumerate(rooms[:2]):
        total = len(equipment) + i * 2
        inventory = VocInventoryRecord(
            org_id=org_id,
            inventory_date=date.today() - timedelta(days=30 - i * 15),
            inventory_area=room.name,
            checker_id=None,
            checker_name=f"管理员{i + 1}",
            total_count=total,
            scanned_count=total,
            matched_count=total - 1 - i,
            missing_count=i + 1,
            surplus_count=0,
            damaged_count=i,
            details=[{
                "equipment_name": eq.name,
                "equipment_code": f"EQ-{eq.id}",
                "scanned": True,
                "condition": "good",
            } for eq in equipment[:5]],
            status=["draft", "completed"][i % 2],
            notes=f"第 {i + 1} 次定期盘点",
        )
        db.add(inventory)
    db.flush()


# ================== 22. 实训排课 ==================

def _seed_voc_training_schedules(db, org_id):
    from models.vocational_safety import VocTrainingSchedule, VocTrainingRoom, VocCourse

    courses = db.query(VocCourse).filter_by(org_id=org_id).all()
    rooms = db.query(VocTrainingRoom).filter_by(org_id=org_id).all()

    if not courses or not rooms:
        return

    for i, course in enumerate(courses[:3]):
        for j in range(2):
            schedule = VocTrainingSchedule(
                org_id=org_id,
                course_id=course.id,
                room_id=rooms[(i + j) % len(rooms)].id,
                teacher_id=None,
                teacher_name=f"实训教师 {i + 1}-{j + 1}",
                weekday=(i + j) % 5 + 1,  # 1-5
                start_time=["08:00", "10:00", "14:00", "16:00"][j % 4],
                end_time=["09:30", "11:30", "15:30", "17:30"][j % 4],
                semester="2026-2027学年第一学期",
                max_students=20 + j * 5,
                status="active",
            )
            db.add(schedule)
    db.flush()


# ================== 23. 孵化项目成员 ==================

def _seed_voc_incubator_members(db, org_id):
    from models.vocational_cooperation import VocIncubatorProject, VocIncubatorMember

    projects = db.query(VocIncubatorProject).filter_by(org_id=org_id).all()
    if not projects:
        return

    for i, proj in enumerate(projects):
        for j in range(3):
            member = VocIncubatorMember(
                project_id=proj.id,
                student_id=None,
                student_name=f"成员 {j + 1}（项目{i + 1}）",
                role=["leader", "member", "member"][j % 3],
                contribution=50 - j * 10 + i * 5,
            )
            db.add(member)
    db.flush()