# OpenMTSciEd 集成需求规格说明书（PRD）

**版本**: v1.0  
**日期**: 2026-06-22  
**状态**: 📋 需求定义完成 · **M1–M6 已交付**  
**适用范围**: OpenMTEduInst 云托管版（`LicenseType.CLOUD_HOSTED`）  
**关联项目**: `I:\OpenMTSciEd`（开放 STEM 教育资源平台）

> 本文档采用「两层分离」结构——每个功能模块均标注 **✅ 当前实现状态** 和 **🎯 规划目标**。

---

## 1. 文档概述

### 1.1 背景

云托管版机构管理系统当前在 **教程、课件、硬件项目** 等 STEM 教学资源入口上使用本地 Mock 或机构自建 `/api/v1/resources`，**未接入** OpenMTSciEd 平台 API。后端虽预留 `opensciedu_*` 组织字段与环境变量，但无代理服务与前端客户端。

OpenMTSciEd 提供：

- REST API：`/api/v1/tutorials`、`/coursewares`、`/hardware-projects`、`/libraries/*`、`/knowledge-graph/*`
- 桌面端教师能力：课题工作室、统一资源库、知识图谱（**非可嵌入 npm 插件**，插件系统仍在 Phase 4 路线图）

### 1.2 集成目标

将 OpenMTSciEd 定位为云托管版的 **STEM 内容供给层**，使机构管理员与授课教师能在 EduInst 内浏览、检索、引用平台教程/课件/硬件项目，而机构设备台账（`/devices`）与 SciEd 硬件**项目库**职责分离。

### 1.3 目标用户与场景

| 角色 | 场景 | 集成后能力 |
|------|------|-----------|
| **授课教师** | 备课选资源 | 浏览教程/课件/硬件项目，收藏或关联排课 |
| **机构管理员** | 启用平台内容 | 配置 OpenMTSciEd API Key、测试连通性 |
| **培训机构负责人** | 仪表盘概览 | 资源数量来自 SciEd 真实统计 |
| **开发者** | 运维联调 | 代理健康检查、E2E 验收脚本 |

### 1.4 非目标（Out of Scope · v1.0）

- 嵌入 OpenMTSciEd desktop-manager 完整 UI（iframe 深链留 Phase 2）
- 课题工作室（Topic Studio）六步向导
- Blockly 可视化编程
- OpenMTSciEd 插件系统（尚未交付）
- 双向同步：EduInst 本地资源写入 SciEd 平台

### 1.5 关联文档

| 文档 | 说明 |
|------|------|
| [CLOUD_HOSTING_PRD.md](./CLOUD_HOSTING_PRD.md) | 云托管版总 PRD |
| [plans/openmtscied-integration-plan.md](./plans/openmtscied-integration-plan.md) | 分阶段实施计划 |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | EduInst API（含 `/opensciedu/*`） |
| OpenMTSciEd `backend-next/API_QUICK_REFERENCE.md` | 上游 API 速查 |
| OpenMTSciEd `FRONTEND_INTEGRATION_GUIDE.md` | 原始 Angular 集成参考 |

---

## 2. 架构设计

### 2.1 集成模式

```
┌─────────────────────────────────────────────────────────┐
│  OpenMTEduInst Angular（机构/教师 UI）                    │
│  openmt-scied.service → /api/v1/opensciedu/*            │
└───────────────────────────┬─────────────────────────────┘
                            │ JWT（机构上下文）
┌───────────────────────────▼─────────────────────────────┐
│  OpenMTEduInst FastAPI 代理层                             │
│  opensciedu_client.py · 机构 Key · CDN 重写 · 缓存(可选) │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS + API Key
┌───────────────────────────▼─────────────────────────────┐
│  OpenMTSciEd backend-next (:3000 / opensciedu.matux.tech)│
└─────────────────────────────────────────────────────────┘
```

**约束**：

1. 浏览器 **禁止** 直连 OpenMTSciEd（CORS、密钥安全）
2. API Key 仅存后端；机构级 Key 优先于平台级 `OPENSCIEDU_API_KEY`
3. CSP `connect-src` 仅允许 EduInst 同源

### 2.2 模块命名对照（避免混淆）

| EduInst 模块 | 含义 | SciEd 对应 |
|--------------|------|------------|
| `/devices` · `hardware-management` | 机构**物理设备**借还/维护 | ❌ 不同域 |
| `/resources` · 教学资源（改造后） | STEM **数字资源**浏览 | `/tutorials` · `/coursewares` |
| **新增** `/resources` Tab「硬件项目」 | SciEd 教学项目库 | `/hardware-projects` |
| `project-management` | 机构学员**实验项目**跟踪 | 可关联 SciEd 项目 ID |

---

## 3. 功能需求

### FR-OS-1 后端 API 代理（P0）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-1.1 | 提供 `/api/v1/opensciedu/tutorials` 列表与详情代理 | P0 | ✅ M1 |
| FR-OS-1.2 | 提供 `/api/v1/opensciedu/coursewares` 列表代理 | P0 | ✅ M1 |
| FR-OS-1.3 | 提供 `/api/v1/opensciedu/hardware-projects` 列表代理 | P0 | ✅ M1 |
| FR-OS-1.4 | 提供 `/api/v1/opensciedu/stats` 聚合统计 | P1 | ✅ M1 |
| FR-OS-1.5 | 提供 `/api/v1/opensciedu/health` 连通性检测 | P0 | ✅ M1 |
| FR-OS-1.6 | 所有代理路由需 `require_org_context` | P0 | ✅ M1 |
| FR-OS-1.7 | 未启用集成时返回 `403` + 错误码 `OPENSCIEDU_DISABLED` | P0 | ✅ M1 |
| FR-OS-1.8 | 上游超时/5xx 返回 `502` + 可读 message | P1 | ✅ M1 |
| FR-OS-1.9 | 响应中 `file_url`/`thumbnail_url` 经 `OPENSCIEDU_CDN_BASE` 规范化 | P1 | ✅ M1 |

**启用逻辑**：

- 机构 `opensciedu_api_enabled=true` 且（机构 Key 或平台 Key 存在）→ 允许
- 或：平台配置 `OPENSCIEDU_API_KEY` 且机构未显式禁用（开发/演示模式）

### FR-OS-2 机构集成配置（P1）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-2.1 | `GET /api/v1/opensciedu/config` 返回启用状态、同步状态、掩码 Key | P1 | ✅ M1 |
| FR-OS-2.2 | `PUT /api/v1/opensciedu/config` 管理员更新启用开关与 Key | P1 | ✅ M3 |
| FR-OS-2.3 | 系统设置页「OpenMTSciEd 集成」Tab | P1 | ✅ M3 |
| FR-OS-2.4 | 「测试连接」按钮调用 `/opensciedu/health` | P1 | ✅ M3 |

### FR-OS-3 前端教学资源（P0）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-3.1 | `OpenMtSciEdService` 调用 EduInst 代理而非直连 SciEd | P0 | ✅ M1 |
| FR-OS-3.2 | `teaching-resources` 移除 Mock，Tab：教程/课件/硬件项目 | P0 | ✅ M2 |
| FR-OS-3.3 | 分页、学科/年级筛选 | P1 | 🔄 M2（分页+搜索，学科筛选待补） |
| FR-OS-3.4 | 资源详情侧栏/页 | P1 | ✅ M2 |
| FR-OS-3.5 | 加载失败空态 + 重试 | P1 | ✅ M2 |
| FR-OS-3.6 | 集成未启用时展示引导文案 | P1 | ✅ M2 |

### FR-OS-4 仪表盘入口（P1）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-4.1 | `training-dashboard-v2` 资源卡片可点击跳转 `/resources` | P1 | ✅ M2 |
| FR-OS-4.2 | 资源描述数字来自 `/opensciedu/stats` | P2 | ✅ M2 |
| FR-OS-4.3 | K12 仪表盘「素材库」跳转教程 Tab | P2 | 🎯 M2 |

### FR-OS-5 教师工作台（P1）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-5.1 | 路由 `/organization/:id/teacher/*` | P1 | ✅ M3 |
| FR-OS-5.2 | 教师角色 `UserOrganizationRole.TEACHER` 守卫 | P1 | ✅ M3 |
| FR-OS-5.3 | 教师首页：推荐资源 + 快捷入口 | P2 | ✅ M3 |
| FR-OS-5.4 | 菜单按角色过滤（教师 vs 管理员） | P1 | ✅ M3 |

### FR-OS-6 进阶能力（P2–P3）

| ID | 需求 | 优先级 | 状态 |
|----|------|--------|------|
| FR-OS-6.1 | 知识图谱只读视图 | P2 | ✅ M4 |
| FR-OS-6.2 | 课题工作室 iframe/深链 | P2 | ✅ M5 |
| FR-OS-6.3 | Celery 元数据缓存同步 | P2 | ✅ M4 |
| FR-OS-6.4 | 本地 `/resources` 与 SciEd 资源统一检索 | P2 | ✅ M5 |
| FR-OS-6.5 | `@openmt/scied-ui` 共享组件库 | P3 | ✅ M6 |

---

## 4. 非功能需求

| ID | 类别 | 要求 |
|----|------|------|
| NFR-OS-1 | 安全 | API Key 不得出现在前端 bundle 或日志 |
| NFR-OS-2 | 性能 | 列表代理 P95 < 2s（含上游）；可选 Redis 缓存 TTL=`OPENSCIEDU_CACHE_TTL` |
| NFR-OS-3 | 可用性 | 上游不可用时 UI 降级，不白屏 |
| NFR-OS-4 | 合规 | 仅云托管许可证机构可访问代理（可选 Phase 2 硬校验） |
| NFR-OS-5 | 可观测 | 代理失败记录 org_id、path、status_code |

---

## 5. 数据模型（已有）

`organizations` 表字段（见 `backend/models/license.py`）：

| 字段 | 说明 |
|------|------|
| `opensciedu_api_key` | 机构 API 密钥 |
| `opensciedu_api_enabled` | 是否启用 |
| `opensciedu_sync_enabled` | 自动同步开关 |
| `opensciedu_sync_interval` | 同步间隔（秒） |
| `opensciedu_last_sync` | 最后同步时间 |
| `opensciedu_sync_status` | idle / syncing / success / error |
| `opensciedu_api_config` | JSON 扩展配置 |

迁移脚本：`backend/scripts/migrate_opensciedu.py`

---

## 6. 验收标准

### M1 · 代理可用（第 1 周）

- [x] `GET /api/v1/opensciedu/health` 返回 `connected: true/false`
- [x] 已授权用户可拉取教程列表（需配置 Key）
- [x] 未启用机构收到 `403` + `OPENSCIEDU_DISABLED`
- [x] 前端 `OpenMtSciEdService.getTutorials()` 可用
- [x] `scripts/verify_opensciedu_integration.py` 可用
- [x] `pytest tests/test_opensciedu_proxy.py` 通过

### M2 · 资源库上线（第 2 周）

- [x] `/organization/:id/resources` 展示真实 SciEd 数据
- [x] Mock 数据移除
- [x] 仪表盘资源卡片可导航

### M3 · 教师端 Alpha（第 3–4 周）

- [x] 教师工作台路由 `/organization/:id/teacher/dashboard`
- [x] `TeacherGuard` 角色守卫（teacher / admin / staff）
- [x] 教师精简侧栏菜单
- [x] 系统设置 OpenMTSciEd 集成 Tab

### M4 · 生产就绪（第 5–6 周）

- [x] Redis/内存双层缓存 `opensciedu_cache.py`
- [x] Celery Beat 定时同步 + `POST /opensciedu/sync` 手动触发
- [x] `scripts/acceptance_opensciedu.py` E2E 验收
- [x] 知识图谱只读页 `/organization/:id/knowledge-graph`
- [x] `pytest tests/test_opensciedu_cache.py` / `test_opensciedu_sync.py`

### M5 · 深链与统一检索

- [x] 课题工作室深链 `/topic-studio` + `GET /topic-studio/links`
- [x] 统一检索 `GET /opensciedu/search`
- [x] 教学资源页搜索框接入

### M6 · 共享 UI（P3）

- [x] `projects/scied-ui` 库与 `@openmt/scied-ui` 路径别名
- [x] 7 个 standalone 组件 + CSS 主题变量
- [x] `teaching-resources` 全面迁移
- [x] `npm run build:scied-ui` 可构建发布包

---

## 7. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-06-22 | 初版：审计结论、FR-OS-1~6、里程碑 M1–M3 |
| v1.1 | 2026-06-22 | M1 交付：代理 API、OpenMtSciEdService、测试与联调脚本 |
| v1.2 | 2026-06-22 | M4 交付：Celery 同步、Redis 缓存、E2E、知识图谱只读页 |
| v1.3 | 2026-06-22 | M5 交付：课题工作室深链、本地+SciEd 统一检索 |
| v1.4 | 2026-06-22 | M6 交付：`@openmt/scied-ui` 共享组件库 |
