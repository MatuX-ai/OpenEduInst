"""
许可证续费/到期提醒定时任务

调度频率：
- 每天 08:00（Asia/Shanghai）扫描即将到期（剩余 ≤ 7 天）的 ACTIVE 许可证，向机构联系邮箱发送提醒邮件。

实现细节：
- 使用项目既有的 DB session 工厂（utils.database）查询 License 模型
- 使用 EmailService 发送邮件，未配置 SMTP/SendGrid 时自动降级到 logs/emails.log
- 每条 license 一天内只提醒一次（通过 custom_metadata.last_reminder_sent_at 去重）
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Tuple

from config.settings import settings
from services.email_service import get_email_service
from utils.database import SessionLocal

from models.license import License, LicenseStatus, Organization

logger = logging.getLogger(__name__)

# 提醒阈值：距离到期 ≤ 此天数即开始提醒
UPCOMING_THRESHOLD_DAYS = 7

# 提醒间隔：同一许可证至少间隔多少小时发送一次提醒
REMINDER_INTERVAL_HOURS = 23

# 前台续费链接地址（可通过环境变量覆盖）
RENEW_URL_TEMPLATE = "{frontend_base}/admin/organizations/{org_id}/licenses"


def _frontend_base() -> str:
    import os
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:4200")


def _run_async(coro):
    """在同步 Celery task 中安全运行异步 email_service.send()"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Nesting 环境中退化为同步线程执行
            import threading
            result = {}

            def worker():
                try:
                    result["value"] = asyncio.run(coro)
                except Exception as exc:  # noqa: BLE001
                    logger.exception("email worker 异常: %s", exc)
                    result["value"] = False

            t = threading.Thread(target=worker, daemon=True)
            t.start()
            t.join(timeout=60)
            return result.get("value", False)
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)
    except Exception:  # noqa: BLE001
        logger.exception("异步邮件发送失败，回退到同步方式")
        try:
            return asyncio.run(coro)
        except Exception:  # noqa: BLE001
            return False


def find_upcoming_licenses(db) -> List[Tuple[License, Organization, int]]:
    """查找 ``剩余天数 ≤ UPCOMING_THRESHOLD_DAYS`` 的 ACTIVE/未过期许可证列表。

    返回 ``[(License, Organization, days_remaining), ...]``
    """
    now = datetime.utcnow()
    cutoff = now + timedelta(days=UPCOMING_THRESHOLD_DAYS)

    rows = (
        db.query(License, Organization)
        .join(Organization, License.organization_id == Organization.id)
        .filter(
            License.status == LicenseStatus.ACTIVE,
            License.is_active.is_(True),
            License.expires_at > now,
            License.expires_at <= cutoff,
        )
        .order_by(License.expires_at.asc())
        .all()
    )

    result = []
    for license_obj, org in rows:
        days_remaining = max(0, (license_obj.expires_at - now).days)
        result.append((license_obj, org, days_remaining))
    return result


def _sendable_today(license_obj: License, now: datetime) -> bool:
    """去重：同一天内对同一个 license 不重复提醒。"""
    meta = license_obj.custom_metadata or {}
    last_sent = meta.get("last_reminder_sent_at")
    if not last_sent:
        return True
    try:
        last_dt = datetime.fromisoformat(last_sent) if isinstance(last_sent, str) else last_sent
        delta_hours = (now - last_dt).total_seconds() / 3600.0
        return delta_hours >= REMINDER_INTERVAL_HOURS
    except Exception:  # noqa: BLE001
        return True


def _mark_sent(db, license_obj: License) -> None:
    meta = dict(license_obj.custom_metadata or {})
    meta["last_reminder_sent_at"] = datetime.utcnow().isoformat()
    license_obj.custom_metadata = meta
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("记录 reminder 发送时间失败 license_id=%s err=%s", license_obj.id, exc)
        db.rollback()


def send_renewal_reminders(db=None) -> int:
    """Celery 任务入口：扫描即将到期的许可证并发送提醒邮件。

    ``db`` 参数允许调用方（如测试）注入 session，便于隔离测试数据。
    返回发送成功的 license 数量。
    """
    email_service = get_email_service()
    # 若未传 db，使用项目默认 SessionLocal（指向 settings.DATABASE_URL）
    _db = db
    _owns_session = False
    if _db is None:
        _db = SessionLocal()
        _owns_session = True
    sent_count = 0
    now = datetime.utcnow()
    try:
        rows = find_upcoming_licenses(_db)
        logger.info("到期提醒扫描：发现 %s 条待提醒 license", len(rows))

        for license_obj, org, days_remaining in rows:
            if not _sendable_today(license_obj, now):
                logger.debug(
                    "跳过（间隔不足 %sh）license_id=%s org=%s",
                    REMINDER_INTERVAL_HOURS,
                    license_obj.id,
                    org.name,
                )
                continue

            to_addr = org.contact_email
            renew_url = RENEW_URL_TEMPLATE.format(
                frontend_base=_frontend_base(), org_id=org.id
            )
            ok = _run_async(
                email_service.send_license_expiring(
                    to=to_addr,
                    org_name=org.name,
                    days_remaining=days_remaining,
                    renew_url=renew_url,
                )
            )
            if ok:
                _mark_sent(_db, license_obj)
                sent_count += 1
                logger.info(
                    "提醒邮件已发送 org=%s license=%s days_remaining=%s",
                    org.name,
                    license_obj.id,
                    days_remaining,
                )
            else:
                logger.error(
                    "提醒邮件发送失败 org=%s license=%s to=%s",
                    org.name,
                    license_obj.id,
                    to_addr,
                )
    finally:
        if _owns_session:
            _db.close()

    logger.info("到期提醒任务完成：共发送 %s 封", sent_count)
    return sent_count


if __name__ == "__main__":
    # 开发调试：直接 python -m tasks.license_tasks
    count = send_renewal_reminders()
    print(f"已发送 {count} 封提醒邮件")
