# 系统架构与技术设计

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 架构设计完成

---

## 目录

1. [总体架构](#总体架构)
2. [文档清单](#文档清单)
3. [技术选型](#技术选型)
4. [阅读指引](#阅读指引)
5. [版本历史](#版本历史)

---

## 总体架构

本系统采用经典的前后端分离 + 多租户 SaaS 架构，配合现代化的技术栈，提供高可用、可扩展、易维护的 STEM 教育管理平台服务。

```
┌─────────────────────────────────────────────────────────────┐
│                        用户接入层                             │
│  Web浏览器 (Angular SPA)  ·  移动浏览器  ·  未来移动App       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 网关 / 负载均衡                        │
│              Nginx  ·  SSL Termination  ·  限流               │
└──────────────────────────────┬──────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   后端 API 服务   │  │ WebSocket 服务   │  │  OpenSciEd 代理    │
│  FastAPI + Python│  │  FastAPI WebSocket│  │  API Proxy         │
│  RESTful API    │  │  实时消息推送       │  │  资源列表/详情      │
│  认证鉴权        │  │  事件广播           │  │  缓存优化           │
└─────────┬────────┘  └──────────┬────────┘  └─────────┬────────┘
          │                       │                      │
          └───────────────────────┼──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │    数据访问层 (SQLAlchemy)    │
                    └──────────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL 数据库│  │  Redis 缓存       │  │ 对象存储 (OSS/S3) │
│  业务数据         │  │  Session / Cache  │  │  备份文件          │
│  Multi-Tenant     │  │  速率限制          │  │  课程资源          │
│  (Schema隔离)      │  │  消息队列           │  │  作品文件          │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## 文档清单

| 文档 | 文件名 | 说明 | 优先级 |
|------|--------|------|--------|
| 系统架构总览 | [system-architecture.md](system-architecture.md) | 系统分层、模块架构、数据流 | P0 |
| 多租户架构 | [multi-tenant-architecture.md](multi-tenant-architecture.md) | 租户隔离、许可证模型、配额管理 | P0 |
| 安全架构 | [security-architecture.md](security-architecture.md) | 认证鉴权、数据加密、安全监控 | P0 |
| 部署架构 | [deployment-architecture.md](deployment-architecture.md) | 容器化部署、高可用方案、备份策略 | P1 |
| 数据备份架构 | [backup-architecture.md](backup-architecture.md) | 自动备份、一键回滚、备份验证 | P1 |
| AI 集成架构 | [ai-integration-architecture.md](ai-integration-architecture.md) | AI助手服务、Token计费、模型接入 | P1 |
| 实时消息架构 | [websocket-architecture.md](websocket-architecture.md) | WebSocket 服务设计、事件模型 | P1 |

## 技术选型

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Angular | 17+ | SPA 框架 |
| Angular Material | 17+ | UI 组件库 |
| TypeScript | 5+ | 语言 |
| RxJS | 7+ | 响应式编程 |
| SCSS | — | 样式预处理 |
| ESLint | — | 代码质量检查 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 主要编程语言 |
| FastAPI | 0.100+ | Web API 框架 |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.0+ | 数据验证 |
| PostgreSQL | 15+ | 关系型数据库 |
| Redis | 7+ | 缓存、会话、速率限制 |
| Alembic | — | 数据库迁移 |
| JWT | — | 认证令牌 |

### DevOps 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Docker | 24+ | 容器化 |
| Docker Compose | 2+ | 本地编排 |
| Nginx | 1.25+ | Web 服务器 / 反向代理 |
| Gunicorn / Uvicorn | — | ASGI Server |

## 阅读指引

1. **架构新入门**：建议从 `system-architecture.md` 开始，了解系统的整体分层和模块划分
2. **核心特性关注**：阅读 `multi-tenant-architecture.md` 和 `security-architecture.md`，了解系统的多租户隔离和安全防护机制
3. **部署与运维**：关注 `deployment-architecture.md` 和 `backup-architecture.md`，了解系统的部署方式和备份策略
4. **集成扩展**：`ai-integration-architecture.md` 和 `websocket-architecture.md` 介绍系统的 AI 集成能力和实时消息架构

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，架构设计文档目录 |

---

**上一级**：[README.md](../README.md)
