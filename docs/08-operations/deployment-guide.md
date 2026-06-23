# 部署指南

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [Docker Compose 快速部署](#docker-compose-快速部署)
2. [配置环境变量](#配置环境变量)
3. [初始化数据库](#初始化数据库)
4. [首次启动与验证](#首次启动与验证)
5. [HTTPS 与 SSL 证书配置](#https-与-ssl-证书配置)
6. [版本历史](#版本历史)

---

## Docker Compose 快速部署

### 步骤 1: 克隆项目代码

```bash
git clone https://github.com/your-org/edu-institution-platform.git
cd edu-institution-platform
```

### 步骤 2: 创建环境变量文件

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 步骤 3: 启动服务

```bash
docker-compose up -d
```

### 步骤 4: 查看运行状态

```bash
docker-compose ps
# 所有服务状态应为 Up
```

### 步骤 5: 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec backend alembic upgrade head

# 创建初始机构和管理员账户
docker-compose exec backend python -m app.initial_data
```

### 步骤 6: 访问系统

```
前端: http://your-domain.com
后端 API: http://your-domain.com/api
API 文档: http://your-domain.com/docs
```

---

## 配置环境变量

### .env 文件主要配置项

```env
# ===== 数据库 =====
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_strong_password_here
DB_NAME=platform_db

# ===== Redis =====
REDIS_HOST=cache
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# ===== 应用 =====
SECRET_KEY=your_jwt_secret_key_here_please_change
ENV=production
BACKEND_CORS_ORIGINS=["http://localhost","https://your-domain.com"]

# ===== 外部服务 (云托管版) =====
AI_API_KEY=your_openai_or_claude_api_key
OPENSCIED_API_URL=https://api.openscied.org
STORAGE_ENDPOINT=https://your-oss-endpoint.com
STORAGE_ACCESS_KEY=xxx
STORAGE_SECRET_KEY=xxx
STORAGE_BUCKET=backups

# ===== 备份 =====
BACKUP_SCHEDULE=daily
BACKUP_KEEP_DAYS=30
```

---

## 初始化数据库

### 首次部署初始化流程

```bash
# 1. 运行迁移创建表结构
alembic upgrade head

# 2. 创建初始机构 (名称/许可证类型)
python -m app.commands.create_institution \
    --name "阳光教育机构" \
    --plan standard \
    --admin-email "admin@sunshine.edu" \
    --admin-password "Initial@123"

# 3. 导入示例数据 (可选)
python -m app.commands.seed_sample_data
```

### 版本升级时的数据库迁移

```bash
# 1. 备份当前数据库
# 2. 拉取最新 Docker 镜像
docker-compose pull

# 3. 运行迁移
docker-compose exec backend alembic upgrade head

# 4. 重启服务
docker-compose up -d
```

---

## 首次启动与验证

### 功能验证清单

| 验证项 | 操作步骤 | 预期结果 |
|--------|---------|---------|
| 管理员登录 | 访问登录页，输入 admin 账户 | 成功进入仪表板 |
| 创建学员 | 学员管理 → 新增学员 | 学员创建成功，编号生成 |
| 创建课程 | 课程管理 → 新增课程 | 课程保存成功 |
| 创建班级 | 班级管理 → 新增班级 | 班级创建成功 |
| 学员报名 | 班级详情 → 添加学员 | 学员加入成功 |
| 创建排课 | 日历视图 → 新建课时 | 课时显示在日历中 |
| 标记考勤 | 课时详情 → 标记出勤 | 考勤状态正确保存 |
| 创建订单 | 财务 → 新增订单 | 订单创建，金额正确 |
| 数据备份 | 设置 → 手动备份 | 备份文件生成 |

---

## HTTPS 与 SSL 证书配置

### Let's Encrypt 免费证书

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 其他配置...
}
```

### 证书自动续期

```bash
# 使用 Certbot 自动申请和续期
certbot certonly --webroot -w /var/www/letsencrypt \
    -d your-domain.com --email admin@your-domain.com

# 配置定时任务每日检查
0 3 * * * certbot renew --quiet && docker-compose restart nginx
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，Docker Compose 部署指南 |

---

**上一级**：[README.md](README.md)
