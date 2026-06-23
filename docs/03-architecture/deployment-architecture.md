# 部署架构

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 架构设计完成

---

## 目录

1. [容器化部署](#容器化部署)
2. [Docker Compose 配置](#docker-compose-配置)
3. [高可用方案](#高可用方案)
4. [反向代理与负载均衡](#反向代理与负载均衡)
5. [版本历史](#版本历史)

---

## 容器化部署

### 服务组件

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (反向代理)                      │
│                 端口: 80 / 443, TLS 终止                  │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌──────────────────┐      ┌──────────────────┐
     │   前端 SPA       │      │   FastAPI 后端    │
     │   (Angular)      │      │   Python + Uvicorn│
     │   端口: 8080     │      │   端口: 8000      │
     └─────────┬────────┘      └─────────┬────────┘
               │                        │
               └────────────┬───────────┘
                            ▼
                   ┌──────────────────┐
                   │   PostgreSQL DB  │
                   │   主数据库       │
                   │   端口: 5432     │
                   └─────────┬────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                             ▼
     ┌──────────────────┐          ┌──────────────────┐
     │   Redis Cache    │          │   对象存储       │
     │   缓存/会话/队列  │          │   (OSS/S3兼容)  │
     │   端口: 6379     │          │   文件/备份存储  │
     └──────────────────┘          └──────────────────┘
```

### Docker 镜像结构

```
# 前端镜像 (frontend)
基于: nginx:1.25-alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080

# 后端镜像 (backend)
基于: python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# 数据库镜像 (db)
基于: postgres:15-alpine
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=${DB_PASSWORD}
ENV POSTGRES_DB=platform_db
VOLUME /var/lib/postgresql/data

# Redis 镜像 (cache)
基于: redis:7-alpine
CMD ["redis-server", "--requirepass", "${REDIS_PASSWORD}"]
VOLUME /data

# Nginx 反向代理 (nginx)
基于: nginx:1.25-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl/ /etc/nginx/ssl/
EXPOSE 80 443
```

---

## Docker Compose 配置

### docker-compose.yml 主要配置

```yaml
version: '3.8'

services:
  # 反向代理
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # 前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    expose:
      - "8080"
    restart: unless-stopped

  # 后端 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/platform_db
      - REDIS_URL=redis://:${REDIS_PASSWORD}@cache:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ENV=production
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    depends_on:
      - db
      - cache
    restart: unless-stopped

  # 数据库
  db:
    image: postgres:15-alpine
    expose:
      - "5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=platform_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/backups:/backups
    restart: unless-stopped

  # Redis
  cache:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    expose:
      - "6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 环境变量配置 (.env)

```env
# 数据库
DB_PASSWORD=your_strong_password_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# 应用
SECRET_KEY=your_jwt_secret_key_here
ENV=production

# SSL 证书路径
SSL_CERT_PATH=./nginx/ssl/cert.pem
SSL_KEY_PATH=./nginx/ssl/key.pem
```

---

## 高可用方案

### 生产环境推荐架构

```
                    ┌──────────┐
                    │   客户端  │
                    └─────┬────┘
                          │
                    ┌─────▼─────┐   (CDN/WAF 可选)
                    │   Cloud   │
                    │   Edge    │
                    └─────┬─────┘
                          │
              ┌───────────▼───────────┐
              │   负载均衡器 (Nginx)   │
              │   (主/备 Keepalived)  │
              └─────┬──────┬─────────┘
                    │      │
          ┌─────────▼──┐ ┌▼──────────┐
          │   Nginx 1  │ │  Nginx 2  │
          │   (主)      │ │  (备)     │
          └─────┬───────┘ └──┬────────┘
                │             │
     ┌──────────▼──┐   ┌────▼───────────┐
     │  Frontend 1 │   │  Backend API 1 │
     │  Frontend 2 │   │  Backend API 2 │
     │  Frontend N │   │  Backend API N │
     └──────┬──────┘   └──────┬─────────┘
            │                  │
            └────────┬─────────┘
                     ▼
             ┌──────────────────┐
             │   PostgreSQL     │
             │   (主从复制)      │
             │   Master/Standby │
             └──────┬──────────┘
                    ▼
             ┌──────────────────┐
             │   Redis Cluster  │
             │   (可选哨兵)      │
             └──────────────────┘
                    ▼
             ┌──────────────────┐
             │ 对象存储 (OSS)    │
             │ 文件/备份存储      │
             └──────────────────┘
```

### 数据库高可用

- **主从复制**: PostgreSQL Stream Replication
- **自动故障转移**: 使用 Repmgr 或 Patroni
- **读写分离**: 读请求路由到只读副本
- **数据备份**: 每日增量备份 + 每周全量备份
- **备份验证**: 定期恢复测试

---

## 反向代理与负载均衡

### Nginx 配置要点

```nginx
# 后端 API 代理
location /api/ {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 超时设置
    proxy_connect_timeout 30s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# WebSocket 专用路由
location /ws/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;  # 24 小时
    proxy_send_timeout 86400;
}

# 前端静态资源
location / {
    proxy_pass http://frontend:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # 静态资源缓存
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
}

# HTTPS 强制
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 负载均衡策略 (生产环境)

```nginx
upstream backend_servers {
    server backend1:8000 weight=3;
    server backend2:8000 weight=3;
    server backend3:8000 weight=2;
    keepalive 32;
}

upstream frontend_servers {
    server frontend1:8080 weight=3;
    server frontend2:8080 weight=3;
    keepalive 64;
}
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，容器化部署、高可用方案、Nginx 配置 |

---

**上一级**：[README.md](README.md)
