"""
PostgreSQL Schema 级多租户隔离工具

提供能力：
- 根据 org_id 切换 search_path，实现物理层数据隔离
- 自动为新组织创建独立 Schema 并初始化表结构
- 通过 SQLAlchemy event 机制透明注入，无需业务层手工 SET search_path

注意：
- SQLite 不支持 Schema，本模块在 SQLite 下退化为行级过滤（已有中间件保障）
- Schema 名称格式：``org_{org_id}``，仅允许数字和下划线
"""

from __future__ import annotations

import logging
import re
import threading
from typing import Optional

from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Schema 名称最大长度（PostgreSQL identifier 限制 63）
_MAX_SCHEMA_NAME_LEN = 63
_SCHEMA_NAME_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]{0,62}$")

# 公共 Schema 名（保留共享表，例如 organizations、licenses 等）
PUBLIC_SCHEMA = "public"

# 线程局部变量，存储当前请求上下文中的 org_id
_local = threading.local()


def _normalize_schema_name(org_id: int) -> str:
    """将 org_id 转换为合法的 Schema 名称"""
    name = f"org_{org_id}"
    if not _SCHEMA_NAME_RE.match(name):
        raise ValueError(f"非法 org_id，无法生成合法 Schema 名称: {org_id}")
    return name


def set_current_org_id(org_id: Optional[int]) -> None:
    """在请求开始时由中间件调用，绑定当前 org_id 到线程局部变量"""
    _local.org_id = org_id


def get_current_org_id() -> Optional[int]:
    """获取当前线程绑定的 org_id（供 Session 执行时使用）"""
    return getattr(_local, "org_id", None)


def get_current_schema_name() -> Optional[str]:
    org_id = get_current_org_id()
    if org_id is None:
        return None
    return _normalize_schema_name(org_id)


# ------------------------------------------------------------
# SQLAlchemy 事件钩子
# ------------------------------------------------------------

def _is_postgres_engine(engine: Engine) -> bool:
    return engine.dialect.name in ("postgresql", "postgres")


def _ensure_org_schema(engine: Engine, org_id: int) -> str:
    """确保 org_id 对应的 Schema 存在；不存在则创建"""
    schema = _normalize_schema_name(org_id)
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
    logger.info("Schema 已就绪: %s", schema)
    return schema


def _switch_search_path(connection, org_id: Optional[int]) -> None:
    """在连接 checkout 时切换 search_path"""
    if org_id is None:
        return
    schema = _normalize_schema_name(org_id)
    # 同时保留 public 便于跨组织共享表（如 organizations、licenses 元数据）
    connection.execute(text(f'SET search_path TO "{schema}", "{PUBLIC_SCHEMA}"'))


def _checkout_listener(connection, connection_record, connection_proxy):  # noqa: ARG001
    """engine 连接 checkout 事件：按当前线程 org_id 切 search_path"""
    engine = getattr(connection, "engine", None)
    if engine is None or not _is_postgres_engine(engine):
        return
    org_id = get_current_org_id()
    if org_id is None:
        return
    try:
        _switch_search_path(connection, org_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("切换 search_path 失败: org=%s err=%s", org_id, exc)


def init_schema_isolation(engine: Engine) -> None:
    """注册 SQLAlchemy 事件，启用 Schema 隔离

    - 仅对 PostgreSQL 引擎生效
    - 在每个连接 checkout 时自动应用 search_path
    - 业务层无需手动 SET search_path
    """
    if not _is_postgres_engine(engine):
        logger.info("非 PostgreSQL 引擎，跳过 Schema 隔离初始化: %s", engine.dialect.name)
        return

    event.listen(engine, "checkout", _checkout_listener)
    logger.info("✅ PostgreSQL Schema 级多租户隔离已启用")


def create_schema_for_org(engine: Engine, org_id: int) -> str:
    """为新组织创建独立 Schema，并复制 public 中的全部表结构"""
    if not _is_postgres_engine(engine):
        raise RuntimeError("Schema 隔离仅支持 PostgreSQL 引擎")

    schema = _ensure_org_schema(engine, org_id)

    # 将 public 中的表结构克隆到目标 Schema
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT tablename FROM pg_tables
                WHERE schemaname = :schema
                """
            ),
            {"schema": PUBLIC_SCHEMA},
        ).fetchall()

        for (table,) in rows:
            # 注意：CREATE TABLE LIKE 会复制约束/索引，但不会复制外键指向
            conn.execute(
                text(
                    f'CREATE TABLE IF NOT EXISTS "{schema}"."{table}" '
                    f'(LIKE "{PUBLIC_SCHEMA}"."{table}" INCLUDING ALL)'
                )
            )
    logger.info("Schema %s 表结构初始化完成，共 %d 张表", schema, len(rows))
    return schema


def drop_schema_for_org(engine: Engine, org_id: int) -> None:
    """删除组织 Schema（慎用：会丢失该组织所有数据）"""
    if not _is_postgres_engine(engine):
        return
    schema = _normalize_schema_name(org_id)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
    logger.warning("Schema 已删除: %s", schema)


def list_all_org_schemas(engine: Engine) -> list[str]:
    """列出所有组织 Schema（调试用）"""
    if not _is_postgres_engine(engine):
        return []
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                "SELECT schema_name FROM information_schema.schemata "
                "WHERE schema_name LIKE 'org_%' ORDER BY schema_name"
            )
        ).fetchall()
    return [r[0] for r in rows]

