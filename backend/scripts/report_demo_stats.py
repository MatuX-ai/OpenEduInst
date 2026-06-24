
import os, sys
os.chdir('i:/OpenMTEduInst/backend')
sys.path.insert(0, 'i:/OpenMTEduInst/backend')

from sqlalchemy import func, text
from utils.database import Base, engine, SessionLocal
from models.license import Organization, License, LicenseType
from models.base_models import User, Teacher, Course
from models.classroom import Classroom
from models.schedule import Schedule
from models.user_organization import UserOrganization, UserOrganizationRole, UserOrganizationStatus
from models.user_license import UserLicense

from models.bureau_models import (
    BureauSchool, SchoolSTEMScore, BureauEquipmentPool, EquipmentRequest,
    EquipmentAllocation, CrossSchoolSharing, TrainingSession, TrainingRegistration,
    BureauCompetition, CompetitionResult, BudgetPlan, BudgetExpense,
    BureauCurriculumResource,
)

db = SessionLocal()

SEP = '=' * 72
DASH = '-' * 72

print(SEP)
print('  OpenMT 演示数据量统计报告')
print('  生成时间: 2026-06-24')
print(SEP)

# 1. 基础核心数据
print()
print('【一、基础核心数据】')
print(DASH)
orgs = db.query(Organization).order_by(Organization.id).all()
for org in orgs:
    user_count = db.query(UserOrganization).filter_by(org_id=org.id).count()
    room_count = db.query(Classroom).filter_by(org_id=org.id).count()
    t_count = db.query(Teacher).filter_by(org_id=org.id).count()
    c_count = db.query(Course).filter_by(org_id=org.id).count()
    s_count = db.query(Schedule).filter_by(org_id=org.id).count()
    lic_count = db.query(License).filter_by(organization_id=org.id).count()
    print(f'  组织: {org.name} ({org.org_type.value})')
    print(f'    用户: {user_count}  | 教室/实验室: {room_count}  | 教师: {t_count}  | 课程: {c_count}  | 排课: {s_count}  | 许可证: {lic_count}')

# 2. Vocational
print()
print('【二、职业实训模块数据】')
print(DASH)
for org in orgs:
    if 'vocational' in org.org_type.value:
        from models.vocational_equipment import VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance, VocFaultReport
        from models.vocational_safety import VocSafetyCertification, VocSafetyChecklist, VocIncidentReport, VocTrainingRoom
        from models.vocational_cooperation import (
            VocEnterprise, VocEnterpriseDemand, VocCooperationProject,
            VocProjectMilestone, VocCompetition, VocCompetitionRegistration,
            VocInternshipPosition, VocInternshipRecord, VocEmploymentRecord,
        )
        from models.vocational_assessment import VocSkillStandard, VocSkillAssessment, VocCertificate

        print(f'  组织: {org.name}')
        print(f'    实训设备: {db.query(VocEquipment).filter_by(org_id=org.id).count()}')
        print(f'    设备借用: {db.query(VocEquipmentBorrow).filter_by(org_id=org.id).count()}')
        print(f'    设备维护: {db.query(VocEquipmentMaintenance).filter_by(org_id=org.id).count()}')
        print(f'    故障报告: {db.query(VocFaultReport).filter_by(org_id=org.id).count()}')
        print(f'    实训室: {db.query(VocTrainingRoom).filter_by(org_id=org.id).count()}')
        print(f'    安全认证: {db.query(VocSafetyCertification).filter_by(org_id=org.id).count()}')
        print(f'    安全巡检: {db.query(VocSafetyChecklist).filter_by(org_id=org.id).count()}')
        print(f'    合作企业: {db.query(VocEnterprise).filter_by(org_id=org.id).count()}')
        print(f'    企业需求: {db.query(VocEnterpriseDemand).filter_by(org_id=org.id).count()}')
        print(f'    合作项目: {db.query(VocCooperationProject).filter_by(org_id=org.id).count()}')
        print(f'    技能竞赛: {db.query(VocCompetition).filter_by(org_id=org.id).count()}')
        print(f'    实习岗位: {db.query(VocInternshipPosition).filter_by(org_id=org.id).count()}')
        print(f'    实习记录: {db.query(VocInternshipRecord).filter_by(org_id=org.id).count()}')
        print(f'    就业记录: {db.query(VocEmploymentRecord).filter_by(org_id=org.id).count()}')
        print(f'    技能标准: {db.query(VocSkillStandard).filter_by(org_id=org.id).count()}')
        print(f'    技能评估: {db.query(VocSkillAssessment).filter_by(org_id=org.id).count()}')
        print(f'    技能证书: {db.query(VocCertificate).filter_by(org_id=org.id).count()}')

# 3. Bureau
print()
print('【三、教育局监管模块数据】')
print(DASH)
for org in orgs:
    if 'education_bureau' in org.org_type.value:
        print(f'  组织: {org.name}')
        schools = db.query(BureauSchool).filter_by(bureau_id=org.id).all()
        print(f'    管辖学校: {len(schools)}')
        # 打印学校详情
        for sc in schools:
            linked_org = db.query(Organization).filter_by(id=sc.org_id).first()
            sc_name = linked_org.name if linked_org else f'School-{sc.org_id}'
            print(f'      - {sc_name}  [学区: {sc.district_area or "-"}]  [学生: {sc.stem_student_count}]  [教师: {sc.stem_teacher_count}]  [评分: {sc.stem_score}]  [评级: {sc.rating.value}]')

        print(f'    评分历史: {db.query(SchoolSTEMScore).filter(SchoolSTEMScore.school_id.in_([s.id for s in schools])).count()}')
        print(f'    设备品类: {db.query(BureauEquipmentPool).filter_by(bureau_id=org.id).count()}')
        print(f'    设备申请: {db.query(EquipmentRequest).filter_by(bureau_id=org.id).count()}')
        print(f'    设备分配: {db.query(EquipmentAllocation).count()}')
        print(f'    跨校共享: {db.query(CrossSchoolSharing).filter_by(bureau_id=org.id).count()}')
        print(f'    培训场次: {db.query(TrainingSession).filter_by(bureau_id=org.id).count()}')
        print(f'    培训报名: {db.query(TrainingRegistration).count()}')
        comps = db.query(BureauCompetition).filter_by(bureau_id=org.id).all()
        print(f'    赛事活动: {len(comps)}')
        for c in comps:
            print(f'      - {c.name} [{c.level.value}] ({c.location or "-"})')
        print(f'    获奖记录: {db.query(CompetitionResult).filter(CompetitionResult.competition_id.in_([c.id for c in comps])).count()}')
        budgets = db.query(BudgetPlan).filter_by(bureau_id=org.id).all()
        total_budget = sum(b.total_amount or 0 for b in budgets) if budgets else 0
        total_spent = sum(b.spent_amount or 0 for b in budgets) if budgets else 0
        print(f'    预算计划: {len(budgets)} | 总预算: RMB {float(total_budget):,.2f} | 已支出: RMB {float(total_spent):,.2f}')
        print(f'    支出明细: {db.query(BudgetExpense).filter(BudgetExpense.budget_plan_id.in_([b.id for b in budgets])).count()} 条')
        print(f'    课程资源: {db.query(BureauCurriculumResource).filter_by(bureau_id=org.id).count()}')

# 4. 全局汇总
print()
print('【四、全局汇总】')
print(DASH)
total_users = db.query(User).count()
total_orgs = db.query(Organization).count()
total_courses = db.query(Course).count()
total_schedules = db.query(Schedule).count()
total_teachers = db.query(Teacher).count()
total_licenses = db.query(License).count()
total_user_orgs = db.query(UserOrganization).count()
total_user_licenses = db.query(UserLicense).count()

print(f'  组织总数: {total_orgs}')
print(f'  用户总数: {total_users}')
print(f'  用户-组织关联: {total_user_orgs}')
print(f'  教师总数: {total_teachers}')
print(f'  课程总数: {total_courses}')
print(f'  排课总数: {total_schedules}')
print(f'  许可证总数: {total_licenses}')
print(f'  用户许可证分配: {total_user_licenses}')

# 5. 表级别统计
print()
print('【五、数据库表记录数统计')
print(DASH)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT schemaname, tablename,
               (xpath('/row/cnt/text()', xml_count))[1]::text::int as cnt
        FROM (
            SELECT schemaname, tablename,
                   query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', schemaname, tablename), false, true, '') as xml_count
            FROM pg_tables
            WHERE schemaname = 'public'
        ) t
        ORDER BY cnt DESC
    """))
    rows = result.fetchall()
    for row in rows:
        schema, table, count = row
        print(f'  {table:<45} {count:>8} 条')

db.close()
print()
print(SEP)
print('  统计完成。所有演示数据已正确写入数据库。')
print(SEP)
