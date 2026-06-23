# OpenMTSciEd 集成实施计划

**关联 PRD**: [OPENMTSCIED_INTEGRATION_PRD.md](../OPENMTSCIED_INTEGRATION_PRD.md)  
**创建日期**: 2026-06-22  
**当前阶段**: M6 已完成 · OpenMTSciEd 集成闭环

---

## 里程碑总览

| 里程碑 | 周期 | 交付物 | 状态 |
|--------|------|--------|------|
| **M1** 代理可用 | 第 1 周 | 后端代理 + 前端 Service + 健康检查脚本 | ✅ 已完成 |
| **M2** 资源库上线 | 第 2 周 | teaching-resources 接 API + 仪表盘导航 | ✅ 已完成 |
| **M3** 教师端 Alpha | 第 3–4 周 | teacher-portal + 系统设置 Tab | ✅ 已完成 |
| **M4** 生产就绪 | 第 5–6 周 | 缓存、E2E、监控 | ✅ |

---

## M1：基础设施（当前迭代）

### 任务清单

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 1.1 | OpenMTSciEd HTTP 客户端 | `backend/services/opensciedu_client.py` | ✅ |
| 1.2 | 代理路由 | `backend/routes/opensciedu_routes.py` | ✅ |
| 1.3 | 注册路由 | `backend/main.py` | ✅ |
| 1.4 | 前端环境变量 | `frontend/src/environments/environment*.ts` | ✅ |
| 1.5 | Angular Service | `frontend/src/app/core/services/openmt-scied.service.ts` | ✅ |
| 1.6 | 联调脚本 | `scripts/verify_opensciedu_integration.py` | ✅ |
| 1.7 | 单元测试 | `backend/tests/test_opensciedu_proxy.py` | ✅ |

### 验收命令

```bash
# 后端单元测试
cd backend && python -m pytest tests/test_opensciedu_proxy.py -v

# 联调（需 OpenMTSciEd 或 mock）
python scripts/verify_opensciedu_integration.py
```

---

## M2：教学资源页 + 仪表盘

| # | 任务 | 文件 |
|---|------|------|
| 2.1 | 移除 Mock，接入 SciEd API | `teaching-resources.component.ts` | ✅ |
| 2.2 | 资源详情组件 | `resource-detail-panel.component.ts` | ✅ |
| 2.3 | 仪表盘卡片点击 | `training-dashboard-v2.component.ts` | ✅ |
| 2.4 | 父组件导航 + 统计 | `organization-dashboard.component.ts` | ✅ |
| 2.5 | CDN URL 重写 | `opensciedu_client.py` |

---

## M3：教师工作台 + 配置 UI

| # | 任务 | 文件 |
|---|------|------|
| 3.1 | 教师守卫 | `guards/teacher.guard.ts` | ✅ |
| 3.2 | 教师工作台 | `teacher-portal/teacher-dashboard.component.ts` | ✅ |
| 3.3 | 教师路由 | `organization-routing.module.ts` | ✅ |
| 3.4 | 系统设置 Tab | `system-settings.component.ts` | ✅ |
| 3.5 | 菜单角色过滤 | `tenant-menu.service.ts`, `tenant_routes.py`, `organization-side-nav` | ✅ |

---

## M4：进阶与生产

| # | 任务 | 状态 |
|---|------|------|
| 4.1 | Celery 元数据同步 `opensciedu_sync_tasks.py` | ✅ |
| 4.2 | E2E `scripts/acceptance_opensciedu.py` | ✅ |
| 4.3 | Redis 缓存层 `utils/opensciedu_cache.py` | ✅ |
| 4.4 | 知识图谱只读页 `/knowledge-graph` | ✅ |

---

## M5：深链与统一检索

| # | 任务 | 状态 |
|---|------|------|
| 5.1 | 课题工作室深链 `/topic-studio` + `GET /topic-studio/links` | ✅ |
| 5.2 | 统一检索 `GET /opensciedu/search`（本地 + SciEd） | ✅ |
| 5.3 | 教学资源页搜索框接入统一检索 | ✅ |

---

## M6：共享 UI 组件库

| # | 任务 | 状态 |
|---|------|------|
| 6.1 | 创建 `projects/scied-ui` Angular library | ✅ |
| 6.2 | 7 个共享组件 + CSS 主题变量 | ✅ |
| 6.3 | `teaching-resources` 迁移至 `@openmt/scied-ui` | ✅ |
| 6.4 | `ng-packagr` 构建脚本 `npm run build:scied-ui` | ✅ |

---

## 依赖与环境

```env
# backend/.env
OPENSCIEDU_API_BASE=https://opensciedu.matux.tech/api
OPENSCIEDU_API_KEY=           # 平台级 Key（开发可填）
OPENSCIEDU_API_TIMEOUT=30
OPENSCIEDU_CDN_BASE=https://cdn.opensciedu.matux.tech
OPENSCIEDU_WEB_BASE=https://opensciedu.matux.tech
```

本地 OpenMTSciEd：

```bash
cd I:/OpenMTSciEd/backend-next && npm run dev
# OPENSCIEDU_API_BASE=http://localhost:3000/api
```

---

## 风险

| 风险 | 缓解 |
|------|------|
| SciEd API 基址不一致（`/api` vs `/api/v1`） | 客户端 `_normalize_api_root()` 统一 |
| 上游不可用 | 502 + 前端空态 |
| 教师端与管理员端菜单冲突 | 角色过滤 + 独立路由前缀 |
