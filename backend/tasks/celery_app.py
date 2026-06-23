"""
Celery 定时任务配置（云端自动备份 + OpenMTSciEd 元数据同步）

调度计划（使用 crontab 语法，UTC+8 时区）：
- 每日 02:00：增量备份（每个机构）
- 每周日 03:00：全量备份（每个机构）
- 每小时：清理过期快照
- 每 OPENSCIEDU_SYNC_INTERVAL 秒：OpenMTSciEd 元数据同步（启用机构）

启动方式：
    celery -A tasks.celery_app worker --loglevel=info
    celery -A tasks.celery_app beat   --loglevel=info

开发模式（无 Celery 环境）：
    python -m tasks.celery_app run_inline
    （立即同步执行一次所有任务）
"""

from __future__ import annotations

import logging
import os
from datetime import timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# 是否启用 Celery（开发环境可设为 0）
CELERY_ENABLED = os.getenv("CELERY_ENABLED", "0").lower() in ("1", "true", "yes")

# 调度计划（小时为 UTC+8，需根据时区配置调整）
SCHEDULE_DAILY_INCREMENTAL = {
    "hour": 2,  # 02:00
    "minute": 0,
}

SCHEDULE_WEEKLY_FULL = {
    "hour": 3,  # 03:00
    "minute": 0,
    "day_of_week": "sun",  # 仅周日
}

SCHEDULE_HOURLY_CLEANUP = {
    "minute": 0,  # 每小时整点
}


def make_celery_app():
    """创建 Celery 应用实例（延迟导入以避免开发环境无 celery 时崩溃）"""
    try:
        from celery import Celery
        from celery.schedules import crontab
    except ImportError:
        logger.warning("celery 未安装，定时任务不可用")
        return None

    from config.settings import settings

    app = Celery(
        "openmt",
        broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1"),
        backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2"),
        include=[
            "tasks.backup_tasks",
            "tasks.opensciedu_sync_tasks",
            "tasks.license_tasks",
        ],
    )

    # 时区配置
    app.conf.timezone = os.getenv("CELERY_TIMEZONE", "Asia/Shanghai")
    app.conf.enable_utc = True

    # Beat 调度
    app.conf.beat_schedule = {
        "daily-incremental-backup": {
            "task": "tasks.backup_tasks.run_daily_incremental_backup",
            "schedule": crontab(
                hour=SCHEDULE_DAILY_INCREMENTAL["hour"],
                minute=SCHEDULE_DAILY_INCREMENTAL["minute"],
            ),
        },
        "weekly-full-backup": {
            "task": "tasks.backup_tasks.run_weekly_full_backup",
            "schedule": crontab(
                hour=SCHEDULE_WEEKLY_FULL["hour"],
                minute=SCHEDULE_WEEKLY_FULL["minute"],
                day_of_week=SCHEDULE_WEEKLY_FULL["day_of_week"],
            ),
        },
        "hourly-cleanup": {
            "task": "tasks.backup_tasks.run_hourly_cleanup",
            "schedule": crontab(minute=SCHEDULE_HOURLY_CLEANUP["minute"]),
        },
        "opensciedu-metadata-sync": {
            "task": "tasks.opensciedu_sync_tasks.run_opensciedu_sync_all",
            "schedule": timedelta(seconds=settings.OPENSCIEDU_SYNC_INTERVAL),
        },
        # 每天 08:00 扫描即将到期的许可证并发送提醒邮件
        "daily-license-renewal-reminder": {
            "task": "tasks.license_tasks.send_renewal_reminders",
            "schedule": crontab(hour=8, minute=0),
        },
    }

    # 将普通函数注册为 Celery 任务（与 backup_tasks 相同模式）
    from tasks import backup_tasks, opensciedu_sync_tasks, license_tasks

    app.task(name="tasks.backup_tasks.run_daily_incremental_backup")(
        backup_tasks.run_daily_incremental_backup
    )
    app.task(name="tasks.backup_tasks.run_weekly_full_backup")(
        backup_tasks.run_weekly_full_backup
    )
    app.task(name="tasks.backup_tasks.run_hourly_cleanup")(backup_tasks.run_hourly_cleanup)
    app.task(name="tasks.opensciedu_sync_tasks.run_opensciedu_sync_all")(
        opensciedu_sync_tasks.run_opensciedu_sync_all
    )
    app.task(name="tasks.opensciedu_sync_tasks.sync_opensciedu_for_org")(
        opensciedu_sync_tasks.sync_opensciedu_for_org
    )
    app.task(name="tasks.license_tasks.send_renewal_reminders")(
        license_tasks.send_renewal_reminders
    )

    app.conf.task_acks_late = True
    app.conf.worker_prefetch_multiplier = 1
    app.conf.task_default_retry_delay = 60  # 失败重试间隔（秒）

    return app


# 全局 Celery 实例
celery_app: Optional[object] = None
if CELERY_ENABLED:
    celery_app = make_celery_app()


def schedule_now(when: str) -> str:
    """辅助方法：返回人类可读的下次执行时间描述"""
    return f"下次执行：{when}（请确保 Celery Beat 已启动）"


def run_inline_once(task_name: str) -> None:
    """开发模式：同步执行一次任务（不依赖 Celery）"""
    if celery_app is not None:
        celery_app.send_task(task_name)
        return

    logger.info("Celery 未启用，直接同步执行 %s", task_name)
    from tasks.backup_tasks import (  # type: ignore
        run_daily_incremental_backup,
        run_weekly_full_backup,
        run_hourly_cleanup,
    )
    from tasks.opensciedu_sync_tasks import (  # type: ignore
        run_opensciedu_sync_all,
        sync_opensciedu_for_org,
    )
    from tasks.license_tasks import send_renewal_reminders as _send_renewals  # type: ignore

    mapping = {
        "tasks.backup_tasks.run_daily_incremental_backup": run_daily_incremental_backup,
        "tasks.backup_tasks.run_weekly_full_backup": run_weekly_full_backup,
        "tasks.backup_tasks.run_hourly_cleanup": run_hourly_cleanup,
        "tasks.opensciedu_sync_tasks.run_opensciedu_sync_all": run_opensciedu_sync_all,
        "tasks.opensciedu_sync_tasks.sync_opensciedu_for_org": sync_opensciedu_for_org,
        "tasks.license_tasks.send_renewal_reminders": _send_renewals,
    }
    fn = mapping.get(task_name)
    if fn is None:
        logger.error("未知任务: %s", task_name)
        return
    try:
        fn()
    except Exception as exc:  # noqa: BLE001
        logger.error("任务执行失败: %s err=%s", task_name, exc)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == "run_inline":
        run_inline_once(sys.argv[2])
    else:
        print("用法: python -m tasks.celery_app run_inline <task_name>")
