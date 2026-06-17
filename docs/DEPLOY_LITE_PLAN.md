# OpenMT 入门型套餐 (2核 2GB) 部署指南

> 目标服务器：阿里云轻量 / 腾讯云轻量 / 华为云 / AWS Lightsail 入门型
> 规格：2 vCPU / 2 GB RAM / 40 GB SSD / 20 Mbps / 0.5 TB 月流量
> 系统：Ubuntu 22.04 LTS (推荐) / Debian 12

## 0. 总体思路

| 服务 | 部署位置 | 原因 |
|------|---------|------|
| 营销站 (Next.js) | **Vercel 免费版** | 释放 2GB 内存压力；全球 CDN 加速 |
| API 后端 (FastAPI) | **本机 Docker** | 数据私密性 + 自定义 Token 计费 |
| PostgreSQL | **Neon 免费版** | 节省 300MB 内存；自动备份 |
| Redis | **本机容器 (16MB)** | 限流 + 缓存 |
| 前端 (Angular) | **Nginx 静态托管** | 零额外内存 |
| SSL | **Let's Encrypt** | 免费自动续期 |

**总内存占用 ~1.0-1.2GB，留 800MB-1GB 给 OS 和突发流量。**

---

## 1. 一键部署流程

### 1.1 服务器初始化（首次，约 5 分钟）

```bash
# SSH 登录
ssh root@your-server-ip

# 上传初始化脚本
scp backend/deploy/init-lite-server.sh root@your-server-ip:/tmp/

# 执行
bash /tmp/init-lite-server.sh
```

脚本完成：
- 2GB Swap（防 OOM）
- UFW 防火墙（22/80/443）
- 时区设为 Asia/Shanghai
- Docker + Compose v2
- 容器日志轮转（10MB × 3 文件）

### 1.2 注册外部服务（并行操作，5 分钟）

| 服务 | URL | 用途 |
|------|-----|------|
| **Neon** | https://neon.tech | 免费 PostgreSQL 0.5GB |
| **Vercel** | https://vercel.com | 营销站部署 |
| **Cloudflare** | https://cloudflare.com | DNS + CDN（可选） |

**Neon 配置步骤：**
1. 注册 → New Project → 区域选 Singapore（与你服务器同区）
2. Connection Details → **Pooled connection** 复制连接串
3. 示例：`postgresql://neondb_owner:abc@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

### 1.3 上传项目（约 1 分钟）

```bash
# 在本地（本项目根目录）
rsync -avz --exclude='node_modules' --exclude='.angular' --exclude='__pycache__' \
    --exclude='.venv' --exclude='.git' --exclude='*.pyc' --exclude='.next' \
    ./backend/ root@your-server-ip:/opt/openmt/
```

### 1.4 配置环境变量

```bash
ssh root@your-server-ip
cd /opt/openmt

# 复制模板
cp .env.lite.example .env
chmod 600 .env

# 生成 JWT 密钥
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
# 复制输出，编辑 .env 替换 SECRET_KEY

vim .env
# 修改以下三项：
#   DATABASE_URL=postgresql://...neon...
#   SECRET_KEY=<上一步生成的>
#   CORS_ALLOW_ORIGINS=https://your-domain.com
```

### 1.5 启动后端（约 3 分钟）

```bash
cd /opt/openmt
docker compose -f docker-compose.lite.yml --env-file .env up -d --build

# 实时查看日志
docker compose -f docker-compose.lite.yml logs -f api
```

### 1.6 申请 SSL 证书

```bash
# 安装 certbot
apt-get install -y certbot

# 停掉 nginx 容器（certbot 需要占用 80）
docker compose -f docker-compose.lite.yml stop nginx

# 申请证书
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制到 nginx 挂载目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/openmt/deploy/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/openmt/deploy/nginx/ssl/privkey.pem

# 启动 nginx
docker compose -f docker-compose.lite.yml start nginx
```

### 1.7 部署营销站到 Vercel

```bash
# 本地执行（marketing-site 目录）
cd marketing-site
npx vercel login         # 首次会打开浏览器授权
npx vercel --prod        # 生产部署
# 按提示选择：Link to existing project? No -> Project name: openmt-marketing
```

部署完成后会得到 `https://openmt-marketing.vercel.app`，可在 Vercel 控制台绑定自定义域名。

### 1.8 修改前端 API 地址

```bash
# 在前端 dist 中找到 API 调用的 baseURL 配置
grep -r "localhost:8000" /opt/openmt/deploy/frontend/ 2>/dev/null
# 替换为 https://api.your-domain.com
```

> **更优做法**：构建时通过 `--configuration production` 注入环境变量。这里默认假设代码里已用 environment 文件管理。

---

## 2. 运维命令速查

```bash
# 查看容器状态
docker compose -f /opt/openmt/docker-compose.lite.yml ps

# 重启 API（不中断数据库）
docker compose -f /opt/openmt/docker-compose.lite.yml restart api

# 查看 API 实时日志
docker compose -f /opt/openmt/docker-compose.lite.yml logs -f --tail=100 api

# 查看内存占用
docker stats --no-stream

# 清理 Docker 缓存（释放磁盘）
docker system prune -af

# 手动备份数据库（Neon 已自动备份，此为本地留存）
docker exec openmt-api sh -c "pg_dump \$DATABASE_URL > /tmp/backup-$(date +%F).sql"
```

---

## 3. 监控与告警（可选但推荐）

### 3.1 健康检查脚本

```bash
cat > /opt/openmt/healthcheck.sh <<'EOF'
#!/bin/bash
STATUS=$(docker inspect --format='{{.State.Health.Status}}' openmt-api 2>/dev/null)
if [ "$STATUS" != "healthy" ]; then
    echo "[$(date)] API unhealthy: $STATUS" >> /var/log/openmt-health.log
    # 可在此处接入企业微信/钉钉 webhook
fi
EOF
chmod +x /opt/openmt/healthcheck.sh

# 加入 crontab：每 5 分钟检查一次
echo "*/5 * * * * /opt/openmt/healthcheck.sh" | crontab -
```

### 3.2 UptimeRobot 免费监控
- 登录 https://uptimerobot.com → Add New Monitor
- 类型：HTTP(s)
- 监控 URL：`https://api.your-domain.com/health`
- 间隔：5 分钟
- 告警：邮件 / Telegram / 钉钉

---

## 4. 升级到更高规格

当业务增长到需要时，可平滑升级到 **4核 4GB 套餐**：
1. 阿里云控制台 → 升降配 → 选 4核 4GB
2. 重启服务器（Swap 会自动生效）
3. 把 `docker-compose.lite.yml` 换成 `docker-compose.yml`
4. WORKERS 改回 4，本地 PostgreSQL 重新启用

---

## 5. 常见问题

### Q1: OOM Killed 怎么办？
**症状**：API 容器突然消失，`docker ps -a` 显示 `Exited (137)`
**原因**：超内存限制
**解决**：
- 短期：检查是否被攻击（`docker logs openmt-nginx | grep -E "POST /api" | tail`）
- 长期：把 `deploy.resources.limits.memory` 从 600M 调到 800M
- 终极：升级到 4GB 套餐

### Q2: 20Mbps 带宽够吗？
20Mbps ≈ 2.5MB/s，能支持约 200-500 并发用户同时访问。
- 静态资源（JS/CSS/图片）由 Nginx 直接提供，已启用 `gzip` + 1年缓存
- 大文件下载请走对象存储 OSS（不占服务器流量）

### Q3: 月流量 0.5TB 怎么算？
按每用户访问 20 个页面、每页 2MB 算：
- 0.5TB ≈ 25,000 次访问
- 适合**演示、试用、内部使用**
- 生产环境请升级到 1TB 或 2TB 套餐

### Q4: SSL 证书过期怎么办？
Let's Encrypt 证书 90 天有效。配置自动续期：
```bash
echo "0 3 * * * certbot renew --quiet --pre-hook 'docker compose -f /opt/openmt/docker-compose.lite.yml stop nginx' --post-hook 'docker compose -f /opt/openmt/docker-compose.lite.yml start nginx && cp /etc/letsencrypt/live/*/fullchain.pem /opt/openmt/deploy/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/*/privkey.pem /opt/openmt/deploy/nginx/ssl/privkey.pem'" | crontab -
```

### Q5: 怎么从其他云迁移过来？
1. 在新服务器按本指南完整部署
2. 备份旧数据库：`pg_dump $OLD_DB_URL > backup.sql`
3. 导入新数据库：`psql $NEW_NEON_URL < backup.sql`
4. 修改 DNS 指向新服务器（TTL 提前 24h 调到 300）
5. 观察 24-48 小时后停止旧服务器

---

## 6. 成本估算（入门型套餐）

| 项目 | 月费用（人民币） |
|------|----------------|
| 2核 2GB 40GB 云服务器 | ~60-100 |
| Neon 免费版 | 0 |
| Vercel 免费版 | 0 |
| 域名（.com） | ~60/年 = 5/月 |
| Cloudflare 免费版 | 0 |
| **合计** | **~65-105 / 月** |

对比：同等 SaaS 教培系统通常 500+ /月，OpenMT 自托管节省 80%+ 成本。
