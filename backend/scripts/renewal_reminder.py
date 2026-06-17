"""
续费提醒定时任务
每日扫描即将过期的许可证，自动创建续费通知
用法：
    python -m scripts.renewal_reminder         # 立即执行一次
    # 生产环境配合 cron 每天 09:00 执行
"""

import logging
import sys
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# 提醒时间窗口
REMINDER_DAYS = [30, 14, 7, 3, 1]  # 距过期这些天时发送提醒


def run_renewal_check(db: Session):
    """扫描即将过期的许可证并创建续费通知"""
    from models.license import License, LicenseStatus
    from models.notification import Notification, NotificationType, NotificationPriority

    today = datetime.utcnow().date()
    total_sent = 0

    for days in REMINDER_DAYS:
        target_date = today + timedelta(days=days)

        # 查找在 target_date 当天过期的活跃许可证
        expiring = (
            db.query(License)
            .filter(
                License.status == LicenseStatus.ACTIVE,
                License.expires_at.isnot(None),
            )
            .all()
        )

        for lic in expiring:
            # 兼容 date 和 datetime
            exp = lic.expires_at
            if hasattr(exp, 'date'):
                exp_date = exp.date()
            else:
                exp_date = exp

            if exp_date != target_date:
                continue

            # 检查今天是否已经发过同类型通知
            existing = (
                db.query(Notification)
                .filter(
                    Notification.org_id == lic.organization_id,
                    Notification.type == NotificationType.RENEWAL,
                    Notification.related_type == "license",
                    Notification.related_id == lic.id,
                    Notification.create_time > datetime.utcnow() - timedelta(hours=20),
                )
                .first()
            )
            if existing:
                continue

            # 确定优先级
            if days <= 3:
                priority = NotificationPriority.HIGH
            elif days <= 7:
                priority = NotificationPriority.MEDIUM
            else:
                priority = NotificationPriority.LOW

            # 创建通知
            notification = Notification(
                org_id=lic.organization_id,
                title=f"许可证即将到期提醒（{days}天后）",
                content=(
                    f"您的云托管许可证将于 {exp_date} 到期（还剩 {days} 天）。"
                    f"请及时续费以确保服务不中断。"
                    f"许可证类型：{lic.license_type.value if hasattr(lic.license_type, 'value') else lic.license_type}"
                ),
                type=NotificationType.RENEWAL,
                priority=priority,
                related_type="license",
                related_id=lic.id,
                action_label="立即续费",
                action_url="/settings/license",
            )
            db.add(notification)
            total_sent += 1
            logger.info(
                "续费提醒: org=%d license=%d 过期日=%s 剩余=%d天",
                lic.organization_id, lic.id, exp_date, days,
            )

    db.commit()
    logger.info("续费提醒完成: 本次发送 %d 条通知", total_sent)
    return total_sent


def run_overdue_check(db: Session):
    """扫描已过期的许可证，标记状态并通知管理员"""
    from models.license import License, LicenseStatus
    from models.notification import Notification, NotificationType, NotificationPriority

    now = datetime.utcnow()
    overdue = (
        db.query(License)
        .filter(
            License.status == LicenseStatus.ACTIVE,
            License.expires_at < now,
        )
        .all()
    )

    for lic in overdue:
        lic.status = LicenseStatus.EXPIRED
        notification = Notification(
            org_id=lic.organization_id,
            title="许可证已过期",
            content=(
                f"您的云托管许可证已于 {lic.expires_at.strftime('%Y-%m-%d')} 过期。"
                f"部分功能已被限制，请尽快续费恢复。"
            ),
            type=NotificationType.RENEWAL,
            priority=NotificationPriority.HIGH,
            related_type="license",
            related_id=lic.id,
            action_label="立即续费",
            action_url="/settings/license",
        )
        db.add(notification)
        logger.warning("许可证过期: org=%d license=%d", lic.organization_id, lic.id)

    db.commit()
    logger.info("过期检查完成: %d 个许可证已标记过期", len(overdue))
    return len(overdue)


def main():
    """入口函数：执行续费检查 + 过期检查"""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    sys.path.insert(0, ".")
    from utils.database import SessionLocal

    db = SessionLocal()
    try:
        sent = run_renewal_check(db)
        overdue = run_overdue_check(db)
        print(f"续费提醒: {sent} 条 | 过期标记: {overdue} 个")
    except Exception as e:
        logger.error("续费检查失败: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
