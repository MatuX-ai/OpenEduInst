# 部署验收计划 - 机构管理/总览后端 API 扩展 + 前端 SCSS 路径修复

## Context（背景与目标）

本轮将以下变更推送到生产 `https://jigou.matux.tech`：

1. **后端 `backend/routes/educational_institution_routes.py` (+159)**：新增 `org_scoped_router` (prefix `/api/v1/educational_institution/org`)，共 12 个 `/{org_id}/...` 路径变体（overview / metrics / courses / course/stats / teachers / students / students/{id}/progress / enrollment/stats / dashboard / courses POST / courses/{id} PUT / teachers POST / students POST），在 `backend/main.py` 中已注册。
2. **后端 `backend/routes/org_overview_routes.py` (+116/-18)**：提取内部复用函数 `_build_overview` / `_build_dashboard`，新增字段 `website` / `created_at` / `updated_at`，并新增 `/{org_id}/dashboard` 与 `/{org_id}/licenses/statistics` 路由（`/api/v1/org/...`）。
3. **后端 `backend/routes/tenant_routes.py` (+20)**：在原 `/menu`、`/config` 上增加 `/menu/{org_id}` 和 `/config/{org_id}` 路径变体，org_id 优先取 URL 再回退到 Token。
4. **前端样式 SCSS `@use` 路径修复**（`../../../styles/...` → 直接 `design-tokens` / `shared/mixins`）：覆盖 `institution-management`、`stem-cloud`、`organization-portal` 三个目录共 20+ 个组件（institution-dashboard、institution-list、hardware-management、project-management、space-scheduling、token-management、activity-alert-panel、batch-operations-toolbar、safety-alert-panel、classroom-dashboard、competition-list、course-management-panel、bureau-dashboard、k12-dashboard、matux-* 多个组件、training-dashboard、vocational-dashboard、data-analytics-dashboard、education-stats-panel、finance-dashboard、billing、leads-management、marketing、multi-campus、notifications、organization-side-nav、parent-portal、permission-config-dialog、role-edit-dialog、role-list、user-assign-dialog、schedule-*、student-detail-dialog、student-edit-dialog、student-list、system-settings、teacher-*、teacher-student-panel、teaching-resources、organization-*、schedule-add-dialog 等）。
5. **前端 dist 重新构建**：`backend/deploy/frontend/main.db0cdf9b33859376.js` 已删除，新 dist 含 `main.d768ec8025095d91.js`；`environment.prod.ts` 新增 `mockDataDelay: 0`。
6. **营销站** `marketing-site/app/demo/{create-org,register,user-center}/page.tsx` 三页有修改（属营销站范畴，不影响机构管理主流程）。

通过 OpenAPI 探测已确认生产环境后端路由已全部上线（`/api/v1/educational_institution/org/{org_id}/...` 12 个 + `/api/v1/org/...` 4 个 + `/api/v1/tenant/{menu,config}/{org_id}` 4 个变体）。本次验收要做的就是验证这些后端路由"实际可调用 + 返回结构正确"，并结合浏览器子代理验证前端 SCSS 路径修复后机构管理/概览/详情页面无样式报错、dist 实际为新 hash。

## 关键文件 / 路径

- 后端路由：`backend/routes/educational_institution_routes.py`、`backend/routes/org_overview_routes.py`、`backend/routes/tenant_routes.py`、`backend/main.py`
- 前端组件：`frontend/src/app/admin/institution-management/*`、`frontend/src/app/features/stem-cloud/*`、`frontend/src/app/organization-management/organization-portal/**`
- 前端 dist：`backend/deploy/frontend/`（新 `main.d768ec8025095d91.js`，旧 `main.db0cdf9b33859376.js` 已删除）
- 生产环境：`https://jigou.matux.tech`
- 演示账号：`zhao_admin` / `demo123456`（培训机构 · 星海机器人培训中心）

## 验收任务（按顺序执行）

### 任务 1：后端 API 实际可调用性 + 返回结构验证

- [ ] 1.1 用 `curl` 调用 `POST /api/v1/auth/login`（`zhao_admin / demo123456`）拿到 access_token，记录 token 和返回的 `org_id`
- [ ] 1.2 用 token 调通以下 8 个新路由（**任一失败立即停止并报告**）：
  - `GET /api/v1/educational_institution/org/{org_id}/overview` → 200，返回字段含 `website / created_at / updated_at / statistics`
  - `GET /api/v1/educational_institution/org/{org_id}/metrics` → 200
  - `GET /api/v1/educational_institution/org/{org_id}/courses?page=1&page_size=5` → 200，分页结构 `data + pagination`
  - `GET /api/v1/educational_institution/org/{org_id}/course/stats` → 200
  - `GET /api/v1/educational_institution/org/{org_id}/teachers` → 200
  - `GET /api/v1/educational_institution/org/{org_id}/students` → 200
  - `GET /api/v1/educational_institution/org/{org_id}/enrollment/stats` → 200
  - `GET /api/v1/educational_institution/org/{org_id}/dashboard` → 200，返回含 `organization / statistics / charts / recentActivities / alerts`
- [ ] 1.3 验证 `org_overview_routes` 重构后路由：
  - `GET /api/v1/org/overview` → 200（无 org_id 走 Token）
  - `GET /api/v1/org/{org_id}/overview` → 200（带 org_id 路径变体）
  - `GET /api/v1/org/{org_id}/dashboard` → 200
  - `GET /api/v1/org/{org_id}/licenses/statistics` → 200
- [ ] 1.4 验证 `tenant_routes` 路径变体：
  - `GET /api/v1/tenant/menu` → 200（原路径，org_id 来自 Token）
  - `GET /api/v1/tenant/menu/{org_id}` → 200（变体，org_id 来自 URL）
  - `GET /api/v1/tenant/config` → 200
  - `GET /api/v1/tenant/config/{org_id}` → 200
  - **对比无 org_id 变体 vs 带 org_id 变体的 JSON 是否一致**（应完全相同，因为 org_id 必须等于 token 中的 org_id，否则为 403）
- [ ] 1.5 异常路径检查：
  - `GET /api/v1/educational_institution/org/99999/overview`（跨 org）→ 期望 403 或 404，禁止跨租户读
  - `GET /api/v1/tenant/menu/99999`（跨 org）→ 期望 403 或 404

### 任务 2：前端 dist 静态校验

- [ ] 2.1 用 `curl https://jigou.matux.tech/app/`（按 memory: Angular 走 /app 子路径，nginx 挂载），下载 `index.html` 提取主入口 hash
- [ ] 2.2 **关键校验**：提取到的 `main` script 文件名必须包含 `d768ec8025095d91`（新 hash），且**不应**包含 `db0cdf9b33859376`（旧 hash）。如果还能看到旧 hash → 部署失败，需要立即报告
- [ ] 2.3 校验 `styles` 引用与 dist 中实际文件 hash 一致（无 404）
- [ ] 2.4 下载 dist 中所有 `*.js`，做以下静态检查：
  - 不应再残留 `'../../../styles/design-tokens'`、`'../../../styles/shared/mixins'` 字符串
  - 关键 SCSS 变量如 `$spacing-xl`、`$color-primary` 等应该出现在编译后的 styles.*.css 中
  - mockDataDelay 应在编译后 environment chunk 中可见
- [ ] 2.5 校验 `index.html` 中 `runtime.*.js`、`polyfills.*.js`、`main.*.js`、`styles.*.css` 四个 chunk 都能 HEAD 200

### 任务 3：浏览器实际访问（Browser subagent 主路径）

> 启动 Browser subagent 一次完成所有截图任务，按顺序执行。

- [ ] 3.1 **登录页**：访问 `https://jigou.matux.tech/app/login`（或 marketing-site 引用的登录入口），先 `Ctrl+Shift+R` 硬刷新，截图 `01-login.png`
- [ ] 3.2 **登录**：填入 `zhao_admin / demo123456`，提交；等跳转，截图 `02-after-login.png`
- [ ] 3.3 **机构概览/详情页**（核心验收页）：跳转至 `https://jigou.matux.tech/app/admin/institution-management` 或机构 dashboard 入口，再硬刷新一次，**逐项截图**：
  - a) **顶部导航 + 侧边栏**：截图 `03-dashboard-overview.png`（检查 nav 文字、侧边栏菜单渲染、SCSS 颜色变量是否生效）
  - b) **机构概览卡片**：截图 `04-org-overview-card.png`（验证 `_build_overview` 新增的 `website` / `created_at` / `updated_at` 字段在 UI 正常显示）
  - c) **统计图表 / 数字区**：截图 `05-org-stats.png`（验证 `_build_dashboard` 返回的 `statistics / charts` 数据正确渲染）
  - d) **切换到 STEM/项目 Tab**（如果页面有）：等加载完成，截图 `06-stem-tab.png`
  - e) **错误边界 / 加载态**：检查无 404、无 SCSS 编译错误、无白屏
- [ ] 3.4 **路由抽查**（按用户选择：机构概览/详情系列），硬刷新后分别截图：
  - 抽查 1：`https://jigou.matux.tech/app/admin/institution-management/list`（机构列表）→ `07-institution-list.png`
  - 抽查 2：`https://jigou.matux.tech/app/features/stem-cloud/dashboard`（STEM Dashboard）→ `08-stem-dashboard.png`
  - 抽查 3：`https://jigou.matux.tech/app/organization-management/organization-portal`（组织管理 Portal）→ `09-org-portal.png`
- [ ] 3.5 **DevTools Console 截图** `10-console.png`，确认：
  - 无 `Failed to load resource: ... 404`
  - 无 `SassError: ... design-tokens`
  - 无 `Cannot find module '../../../styles/...'` 或类似 SCSS 路径解析失败报错
  - 无 5xx 红色 ERROR
- [ ] 3.6 **DevTools Network 截图** `11-network.png`，确认：
  - `main.d768ec8025095d91.js` 状态 200
  - `styles.*.css` 状态 200
  - 4 个新调用的 `org/{org_id}/...` 路由全部 200

### 任务 4：降级方案（仅当 Browser subagent 不可用时启用）

- [ ] 4.1 Browser subagent 截图超时 / 失败 → 改用 `take_snapshot` 获取 a11y 文本树
  - 对机构概览、详情、列表三个页面取 a11y 快照，核对文字内容（`机构概览` / `统计` / `教师` / `学员` / `项目` 等）
- [ ] 4.2 内嵌环境完全不可用 → 改用 `curl` 抓取已编译的 `main.d768ec8025095d91.js`，反编译/grep 关键字符串确认：
  - 组件名 `InstitutionDashboardComponent` 存在
  - 路由路径 `institution-management` 存在
  - SCSS 变量引用（如 `tokens.$spacing-xl`）编译后产物

## 验证标准（全部满足才视为通过）

- 任务 1 全部路由返回 200 且字段结构正确
- 任务 2 部署环境无旧 hash 残留，4 个 chunk 全部 200
- 任务 3 浏览器页面无 SCSS 编译错误、无 404，统计/概览/详情数据正常渲染，DevTools Console 无 ERROR 级日志
- 任务 4（仅在降级时）通过 a11y 文本或静态反编译确认页面无异常

## 返回给你的结果

执行完成后输出：
1. 每个截图的**绝对路径**
2. 上方检查项的**逐项结论**（通过/不通过 + 关键证据如 HTTP code、JSON 字段、hash 字符串）
3. DevTools Console 是否有任何 ERROR/WARN
4. 任何发现的问题（不省略）
