"""Tasks 包入口（Celery 任务集合）"""
from tasks.celery_app import celery_app, run_inline_once  # noqa: F401
from tasks.backup_tasks import (  # noqa: F401
    run_daily_incremental_backup,
    run_weekly_full_backup,
    run_hourly_cleanup,
)
