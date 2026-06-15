# -*- coding: utf-8 -*-
"""
Neon PostgreSQL 云数据库集成测试脚本
运行方式:
    cd backend/
    export DATABASE_URL=postgres://.....
    python deploy/neon_test.py
"""

from __future__ import annotations

import os
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    MetaData,
    Table,
    create_engine,
    text,
)
from sqlalchemy.orm import Session, declarative_base

# ---------- 准备连接 ----------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:CHANGE_ME@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
)

if "CHANGE_ME" in DATABASE_URL or "xxx" in DATABASE_URL:
    print("[WARN] 检测到占位符连接串，请先在环境变量中配置真实 DATABASE_URL")
    print("       export DATABASE_URL=postgresql://user:pass@host/db?sslmode=require")
    sys.exit(2)

print(f"[INFO] 目标: {DATABASE_URL.split('@')[-1]}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=2,
    max_overflow=5,
    connect_args={"connect_timeout": 15},
)

Base = declarative_base()

# 一张简单测试表，用于验证读写 + 多租户过滤（带 org_id 字段）
test_orgs = Table(
    "neon_test_orgs",
    Base.metadata,
    Column("id", Integer, primary_key=True),
    Column("org_id", Integer, nullable=False, index=True),
    Column("name", String(120), nullable=False),
    Column("created_by", String(120), nullable=False),
    Column("created_at", DateTime, server_default=text("CURRENT_TIMESTAMP")),
)

# ---------- 1. 连接测试 ----------
try:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT version()")).scalar()
        print(f"[OK]   Postgres 版本: {row.split(',')[0]}")
        now = conn.execute(text("SELECT NOW()")).scalar()
        print(f"[OK]   服务器时间: {now}")
except Exception as exc:
    print(f"[ERR]  无法连接: {exc}")
    sys.exit(1)

# ---------- 2. 创建表 ----------
print("[INFO] 创建测试表 neon_test_orgs ...")
Base.metadata.create_all(engine, checkfirst=True)
print("[OK]   表已就绪")

# ---------- 3. 写入测试 ----------
N = 20
org_id = 42
user = f"teacher{random.randint(1,9999)}@example.com"
print(f"[INFO] 写入 {N} 条测试记录 (org_id={org_id}, user={user}) ...")

t0 = time.perf_counter()
with Session(engine) as sess:
    for i in range(N):
        sess.execute(
            test_orgs.insert().values(
                org_id=org_id,
                name=f"demo-org-{i}-{random.randint(1000,9999)}",
                created_by=user,
            )
        )
    sess.commit()
print(f"[OK]   写入 {N} 条，耗时 {(time.perf_counter() - t0)*1000:.1f}ms")

# ---------- 4. 读取（模拟多租户过滤）----------
t0 = time.perf_counter()
with Session(engine) as sess:
    rows = sess.execute(
        test_orgs.select().where(test_orgs.c.org_id == org_id).limit(N)
    ).all()
print(f"[OK]   查询耗时 {(time.perf_counter() - t0)*1000:.1f}ms -> {len(rows)} records")

# 验证跨 org_id 隔离
other_org = org_id + 1
with Session(engine) as sess:
    rows_other = sess.execute(
        test_orgs.select().where(test_orgs.c.org_id == other_org).limit(1)
    ).all()
assert not rows_other, f"多租户隔离失败: org_id={other_org} 居然有数据"
print(f"[OK]   多租户隔离验证通过 (org_id={other_org} 无数据)")

# ---------- 5. 清理 ----------
print("[INFO] 清理测试数据 ...")
with Session(engine) as sess:
    sess.execute(test_orgs.delete().where(test_orgs.c.org_id == org_id))
    sess.commit()
print("[OK]   清理完毕")

print("\n===== Neon PostgreSQL 集成测试: PASS =====")
print("可继续执行: docker compose up -d --build")
