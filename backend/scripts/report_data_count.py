"""
数据量统计报告 - 统计数据库中所有表的记录数
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import SessionLocal, Base
from sqlalchemy import text, inspect
from models import *  # 确保所有模型被导入


def get_all_tables(db):
    """获取数据库中所有表名"""
    inspector = inspect(db.bind)
    return inspector.get_table_names()


def get_table_count(db, table_name):
    """获取表的记录数"""
    try:
        result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        return result.scalar()
    except Exception:
        return -1


def get_tables_by_org(db, table_name):
    """如果表有 org_id 字段，按组织分组统计"""
    try:
        result = db.execute(text(
            f"SELECT org_id, COUNT(*) as cnt FROM {table_name} "
            f"WHERE org_id IS NOT NULL GROUP BY org_id ORDER BY org_id"
        ))
        return result.fetchall()
    except Exception:
        return None


def generate_report():
    """生成完整的数据量统计报告"""
    db = SessionLocal()
    try:
        # 获取组织信息
        organizations = db.execute(
            text("SELECT id, name FROM organizations ORDER BY id")
        ).fetchall()

        print("=" * 80)
        print("  OpenMT 演示数据量统计报告")
        print("=" * 80)
        print(f"  生成时间: {os.popen('date /t').read().strip()}")
        print(f"  组织数量: {len(organizations)}")
        print()

        # 组织摘要
        print("-" * 80)
        print("  组织概览")
        print("-" * 80)
        for org_id, org_name in organizations:
            print(f"  ID: {org_id:<3} 名称: {org_name}")
        print()

        # 获取所有表
        all_tables = get_all_tables(db)
        all_tables.sort()

        # 统计各表数据量
        print("-" * 80)
        print("  表数据量统计 (按表名排序)")
        print("-" * 80)

        total_records = 0
        tables_with_data = 0
        tables_empty = 0

        # 按数据量排序
        table_counts = []
        for table in all_tables:
            count = get_table_count(db, table)
            table_counts.append((table, count))
            total_records += max(0, count)
            if count > 0:
                tables_with_data += 1
            else:
                tables_empty += 1

        # 按数据量降序排列
        table_counts.sort(key=lambda x: x[1], reverse=True)

        # 打印
        print(f"  {'#':<4} {'表名':<50} {'记录数':<10}")
        print(f"  {'-'*3} {'-'*50} {'-'*10}")
        for idx, (table, count) in enumerate(table_counts, 1):
            if count == -1:
                status = "ERROR"
            elif count == 0:
                status = "空表"
            else:
                status = str(count)
            print(f"  {idx:<4} {table:<50} {status:<10}")

        print()
        print("-" * 80)
        print(f"  总表数: {len(all_tables)}")
        print(f"  有数据表: {tables_with_data}")
        print(f"  空表数: {tables_empty}")
        print(f"  总记录数: {total_records:,}")
        print("-" * 80)
        print()

        # 按组织分组统计
        print("-" * 80)
        print("  按组织分组统计 (主要业务表)")
        print("-" * 80)

        # 关键业务表（有 org_id 的表）
        key_tables = [
            "classrooms", "users", "teachers", "courses", "schedules",
            "students", "stem_clubs", "club_members", "club_activities",
            "consumables", "consumable_usage_records", "consumable_purchase_orders",
            "hardware_devices", "device_maintenance_records", "device_usage_logs",
            "stem_projects", "project_members", "project_milestones", "project_resources",
            "maker_spaces", "space_bookings",
            "marketing_campaigns", "coupons", "social_media_accounts",
            "parent_messages", "student_achievements", "class_feedback",
            "enrollments", "attendance_records", "class_schedules",
            "competitions", "competition_registrations",
            "certifications", "certification_registrations",
            "backup_snapshots", "restore_operations",
            "token_packages", "stem_token_balances", "stem_token_transactions",
            "token_usage_logs", "token_orders",
            "tenant_configs", "tenant_feature_flags",
            "notifications",
            "teaching_resources", "resource_categories",
            "leads", "lead_follow_ups", "settlements",
        ]

        # 打印组织表头
        org_header = "  "
        org_cols = []
        for org_id, org_name in organizations:
            short_name = org_name[:12] if len(org_name) > 12 else org_name
            col = f" Org{org_id:<3}"
            org_cols.append(col)
            org_header += f"{col:<10}"

        print(f"  {'表名':<40}" + org_header)
        print(f"  {'-'*40}" + '-'*(len(org_cols) * 10))

        for table in key_tables:
            if table not in [t[0] for t in table_counts]:
                continue

            # 尝试获取按 org_id 统计
            org_stats = get_tables_by_org(db, table)

            if org_stats is None:
                # 没有 org_id 字段，跳过
                continue

            # 构造组织统计列
            stats_by_org = {org_id: 0 for org_id, _ in organizations}
            for org_id, cnt in org_stats:
                if org_id in stats_by_org:
                    stats_by_org[org_id] = cnt

            org_cells = ""
            for org_id, _ in organizations:
                cnt = stats_by_org.get(org_id, 0)
                org_cells += f" {cnt:<9}"

            print(f"  {table:<40}" + org_cells)

        print()

        # 零记录表
        print("-" * 80)
        print("  零记录表详情")
        print("-" * 80)
        empty_tables = [t for t in table_counts if t[1] == 0]
        if empty_tables:
            for idx, (table, _) in enumerate(empty_tables, 1):
                print(f"  {idx}. {table}")
        else:
            print("  [OK] 所有表均有数据！")

        print()
        print("=" * 80)
        print("  统计报告生成完成")
        print("=" * 80)

    finally:
        db.close()


if __name__ == "__main__":
    generate_report()
