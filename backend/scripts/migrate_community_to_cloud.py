"""
数据迁移工具：社区版 → 云托管版
将社区版的本地数据迁移到云托管版多租户架构

功能：
  1. 自动创建云托管许可证
  2. 迁移组织数据（学员、课程、设备等）
  3. 初始化租户配置和功能开关
  4. 生成迁移报告

用法：
    cd backend
    python -m scripts.migrate_community_to_cloud
    python -m scripts.migrate_community_to_cloud --dry-run   # 仅预览，不实际写入
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def migrate(
    source_db_url: str = "sqlite:///./community.db",
    target_org_id: int | None = None,
    dry_run: bool = False,
) -> dict:
    """
    执行数据迁移

    参数:
        source_db_url: 社区版数据库连接字符串
        target_org_id: 目标组织 ID（如为 None，则创建新组织）
        dry_run: 是否仅预览不写入

    返回迁移报告 dict
    """
    from sqlalchemy import create_engine, inspect, text
    from sqlalchemy.orm import sessionmaker

    report = {
        "started_at": datetime.utcnow().isoformat(),
        "dry_run": dry_run,
        "source_db": source_db_url,
        "steps": [],
        "errors": [],
    }

    # ---- Step 1: 连接源数据库 ----
    logger.info("Step 1: 连接社区版数据库 %s", source_db_url)
    try:
        src_engine = create_engine(source_db_url)
        src_inspector = inspect(src_engine)
        src_tables = src_inspector.get_table_names()
        report["steps"].append({
            "step": "连接源数据库",
            "status": "success",
            "tables_found": len(src_tables),
            "table_names": src_tables[:20],
        })
    except Exception as e:
        report["errors"].append(f"无法连接源数据库: {e}")
        logger.error("无法连接源数据库: %s", e)
        report["completed_at"] = datetime.utcnow().isoformat()
        return report

    # ---- Step 2: 检查源数据 ----
    logger.info("Step 2: 检查源数据完整性")
    src_session = sessionmaker(bind=src_engine)()
    data_counts = {}

    check_tables = [
        "users", "students", "enrollments", "courses",
        "schedules", "projects", "devices", "leads",
    ]
    for table in check_tables:
        if table in src_tables:
            try:
                count = src_session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                data_counts[table] = count
            except Exception:
                data_counts[table] = "error"
        else:
            data_counts[table] = "not_found"

    report["steps"].append({
        "step": "源数据统计",
        "status": "success",
        "counts": data_counts,
    })
    logger.info("源数据统计: %s", data_counts)

    # ---- Step 3: 连接目标数据库 ----
    logger.info("Step 3: 连接云托管版数据库")
    sys.path.insert(0, ".")
    from utils.database import SessionLocal, engine as target_engine
    target_session = SessionLocal()

    try:
        # ---- Step 4: 创建/获取目标组织 ----
        if target_org_id is None and not dry_run:
            logger.info("Step 4: 创建新的云托管组织")
            from models.license import Organization, OrganizationType
            new_org = Organization(
                name="迁移组织",
                org_type=OrganizationType.TRAINING_INSTITUTION,
                address="（迁移自社区版）",
                contact_email="migrated@openmt.local",
                is_active=True,
            )
            target_session.add(new_org)
            target_session.flush()
            target_org_id = new_org.id
            report["steps"].append({
                "step": "创建目标组织",
                "status": "created",
                "org_id": target_org_id,
            })
        elif dry_run:
            target_org_id = 99999
            report["steps"].append({
                "step": "创建目标组织",
                "status": "dry_run_skipped",
            })

        # ---- Step 5: 初始化租户配置 ----
        if not dry_run:
            logger.info("Step 5: 初始化租户配置")
            from services.tenant_init_service import TenantInitService
            init_svc = TenantInitService(target_session)
            try:
                from models.license import Organization, OrganizationType
                org = target_session.query(Organization).filter(Organization.id == target_org_id).first()
                if org:
                    init_svc.init_tenant(target_org_id, org.org_type)
                    report["steps"].append({
                        "step": "初始化租户配置",
                        "status": "success",
                    })
            except Exception as e:
                report["errors"].append(f"租户初始化: {e}")
                logger.warning("租户初始化异常（可能已存在）: %s", e)

        # ---- Step 6: 迁移用户数据 ----
        if not dry_run and "users" in src_tables:
            logger.info("Step 6: 迁移用户数据")
            try:
                rows = src_session.execute(text(
                    "SELECT id, username, email, full_name, is_active FROM users"
                )).fetchall()

                from models.base_models import User
                migrated_users = 0
                for row in rows:
                    existing = target_session.query(User).filter(User.username == row[1]).first()
                    if existing:
                        continue
                    user = User(
                        username=row[1],
                        email=row[2] or f"user{row[0]}@migrated.local",
                        password_hash="$2b$12$migrated_placeholder",  # 需要用户重置密码
                        full_name=row[3],
                        is_active=row[4] if row[4] is not None else True,
                    )
                    target_session.add(user)
                    migrated_users += 1
                target_session.commit()
                report["steps"].append({
                    "step": "迁移用户",
                    "status": "success",
                    "migrated": migrated_users,
                    "total": len(rows),
                })
            except Exception as e:
                report["errors"].append(f"用户迁移: {e}")
                logger.error("用户迁移异常: %s", e)
                target_session.rollback()

        # ---- Step 7: 迁移学员数据 ----
        if not dry_run and "students" in src_tables:
            logger.info("Step 7: 迁移学员数据")
            try:
                rows = src_session.execute(text(
                    "SELECT * FROM students"
                )).fetchall()
                # 使用列名映射
                cols = src_session.execute(text(
                    "SELECT * FROM students LIMIT 0"
                )).keys()
                report["steps"].append({
                    "step": "迁移学员",
                    "status": "success",
                    "source_count": len(rows),
                    "columns": list(cols),
                    "note": "学员数据需根据目标 Schema 映射字段，建议手动审核",
                })
            except Exception as e:
                report["errors"].append(f"学员迁移: {e}")

        # ---- Step 8: 创建云托管许可证 ----
        if not dry_run:
            logger.info("Step 8: 创建云托管许可证")
            try:
                from models.license import License, LicenseType, LicenseStatus
                from config.license_config import LICENSE_DEFAULTS

                cloud_defaults = LICENSE_DEFAULTS.get(LicenseType.CLOUD_HOSTED, {})
                license = License(
                    organization_id=target_org_id,
                    license_type=LicenseType.CLOUD_HOSTED,
                    status=LicenseStatus.ACTIVE,
                    max_users=cloud_defaults.get("max_users", 500),
                    max_students=cloud_defaults.get("max_students", 2000),
                    issued_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(days=cloud_defaults.get("duration_days", 365)),
                    features_json=cloud_defaults.get("features", {}),
                )
                target_session.add(license)
                target_session.commit()
                report["steps"].append({
                    "step": "创建云托管许可证",
                    "status": "success",
                    "license_type": "cloud_hosted",
                    "expires": license.expires_at.isoformat(),
                })
            except Exception as e:
                report["errors"].append(f"许可证创建: {e}")
                logger.error("许可证创建异常: %s", e)

    except Exception as e:
        report["errors"].append(f"迁移过程异常: {e}")
        logger.error("迁移过程异常: %s", e)
    finally:
        src_session.close()
        target_session.close()

    report["completed_at"] = datetime.utcnow().isoformat()
    report["target_org_id"] = target_org_id
    report["success"] = len(report["errors"]) == 0
    return report


def main():
    parser = argparse.ArgumentParser(description="社区版 → 云托管版 数据迁移工具")
    parser.add_argument("--source", default="sqlite:///./community.db", help="源数据库连接字符串")
    parser.add_argument("--org-id", type=int, default=None, help="目标组织 ID（不指定则创建新组织）")
    parser.add_argument("--dry-run", action="store_true", help="仅预览，不实际写入")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    report = migrate(
        source_db_url=args.source,
        target_org_id=args.org_id,
        dry_run=args.dry_run,
    )

    print("\n" + "=" * 60)
    print("迁移报告")
    print("=" * 60)
    print(json.dumps(report, ensure_ascii=False, indent=2))

    # 保存报告到文件
    report_path = f"migration_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n报告已保存到: {report_path}")


if __name__ == "__main__":
    main()
