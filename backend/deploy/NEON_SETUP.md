# ============================================================
# Neon PostgreSQL 云数据库集成测试指南
#
# Neon (neon.tech) 提供无服务器 PostgreSQL，冷启动 <500ms、
# 按使用付费、分支测试免费，适合 SaaS 场景。
# ============================================================

# ---------- 1. 注册 Neon 并创建项目 ----------
# 1) 打开 https://console.neon.tech 并注册（GitHub / 邮箱）
# 2) 新建项目：
#      - Name: openmt-edu-inst
#      - Postgres version: 16
#      - Region: 选离你用户最近的（国内用户可选择 aws ap-east-1 / 新加坡）
# 3) 项目创建完成后，复制 "Connection string"：
#      postgresql://neondb_owner:xxxxx@ep-xxx-pooler.xxx.aws.neon.tech/neondb?sslmode=require

# ---------- 2. 配置到本项目 ----------
# 在 backend/ 目录：
cp .env.production .env

# 把 DATABASE_URL 替换为刚才的连接串：
# DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-pooler.xxx.aws.neon.tech/neondb?sslmode=require

# ---------- 3. 执行集成测试脚本 ----------
# 脚本会创建测试表、写入测试数据、读出并清理，
# 用于验证 Neon 与后端项目的连通性与读写性能。
python deploy/neon_test.py

# 成功输出类似：
#   [INFO] 连接到 Neon: PostgreSQL 16.1 on x86_64-pc-linux-gnu ...
#   [OK]   写入测试记录 (org_id=42, user=teacher1@example.com)
#   [OK]   查询耗时 0.042s -> 20 records
#   [OK]   测试通过，数据库可用
#   [OK]   清理完毕

# ---------- 4. docker-compose 启动 ----------
cd ..
docker compose up -d --build

# 验证服务
curl http://127.0.0.1:8000/health
# {"status": "healthy"}

# ---------- 5. 性能指标参考（Neon Free Tier）--------
# 冷启动:      ~300-500ms (首次连接需拉起 Postgres 进程)
# 热查询:      <10ms
# 存储:        512MB free，足够 ~100 个机构的教学数据
# 连接池:      Neon 自带 PgBouncer (pooler 结尾的 hostname)

# ---------- 6. 常见问题 ----------
# 6.1 "the connection requires a valid client certificate"
#   → 必须使用 pooler 主机名 + sslmode=require
# 6.2 "the database does not exist"
#   → 检查连接串中的 /neondb 部分是否与实际库名一致
# 6.3 首次请求超时 / 502
#   → Neon 冷启动，通常 1-2 秒；可通过 Neon 控制台开启"Always On"
#   → 或在 Nginx 配置 proxy_connect_timeout 30s 放宽
# 6.4 速率限制
#   → Neon free tier 为 500 并发连接，生产需升级到 Pro
