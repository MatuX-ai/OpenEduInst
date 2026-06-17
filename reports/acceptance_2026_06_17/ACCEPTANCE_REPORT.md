# 部署验收报告 - 2026-06-17 机构管理/总览后端 API 扩展 + 前端 SCSS 路径修复

**验收环境**: https://jigou.matux.tech  
**验收账号**: zhao_admin / demo123456 (培训机构 - 星海机器人培训中心, org_id=50, user_id=159)  
**验收时间**: 2026-06-17 16:30~16:42 CST  
**总体结论**: ❌ **验收不通过**（4 个 500 错误 + 1 个跨租户安全漏洞 + 部署 hash 不匹配）

---

## 一、验收方法

按 [2026-06-17-deployment-acceptance.md](2026-06-17-deployment-acceptance.md) 计划执行：

1. **后端 API 验证**：Python + urllib 调真实接口，记录 HTTP code + 响应体（不依赖浏览器）
2. **前端 dist 静态校验**：curl 下载 index.html / main.js / styles.css 做 hash 校验 + 字符串反编译
3. **浏览器访问**：原计划用 Browser subagent 截图，**触发降级**（DevTools 协议全超时，subagent 重试 20+ 次失败）
4. **降级验收**：改用 WebFetch + 静态反编译 + 已有验收脚本

---

## 二、任务 1: 后端 API 实际可调用性

### 任务 1.1 登录 - ✓ 通过

```
POST /api/v1/auth/token  (form-encoded grant_type=password)
  → HTTP 200
  → access_token len=168
GET /api/v1/auth/me
  → HTTP 200
  → {"user_id": 159, "username": "zhao_admin", "email": "zhao@starrobotics.edu.cn",
     "full_name": "赵敏", "org_id": 50, "role": "admin"}
```

**注意**: 实际登录端点是 `POST /api/v1/auth/token`（不是 `/auth/login`，OpenAPI 文档里 `/auth/login` 不存在），本计划文档里写的 `auth/login` 是错的。

### 任务 1.2 org_scoped_router 8 路由 - ❌ 5/8 通过，3 个 500 错误

| 路由 | 期望 | 实际 | 字段校验 | 结论 |
|------|------|------|----------|------|
| `GET /api/v1/educational_institution/org/50/overview` | 200 | 200 ✓ | data = `{studentCount, teacherCount, activeCourses, activeMembers}` | ⚠️ 数据结构**不匹配** — 返回的是旧 `get_org_overview` 字段，**没有** `_build_overview` 的 `website/created_at/updated_at/statistics` 字段 |
| `GET /api/v1/educational_institution/org/50/metrics` | 200 | 200 ✓ | - | ✓ |
| `GET /api/v1/educational_institution/org/50/courses?page=1&page_size=5` | 200 | 200 ✓ | - | ✓ |
| `GET /api/v1/educational_institution/org/50/course/stats` | 200 | 200 ✓ | - | ✓ |
| `GET /api/v1/educational_institution/org/50/teachers` | 200 | **500** | - | ❌ **Internal Server Error** |
| `GET /api/v1/educational_institution/org/50/students` | 200 | **500** | - | ❌ **Internal Server Error** |
| `GET /api/v1/educational_institution/org/50/enrollment/stats` | 200 | **500** | - | ❌ **Internal Server Error** |
| `GET /api/v1/educational_institution/org/50/dashboard` | 200 | 200 ✓ | data = `{overview, courses, teachers, students, enrollmentStats, courseStats, recentActivities, alerts, lastUpdated}` | ⚠️ 数据结构**不匹配** — 是旧版 dashboard 结构，**没有** `_build_dashboard` 的 `organization/statistics/charts` |

### 任务 1.3 org_overview_routes 4 路由 - ❌ 3/4 通过

| 路由 | 期望 | 实际 | 结论 |
|------|------|------|------|
| `GET /api/v1/org/overview` | 200 | 200 ✓ | ✓ 字段含 website/created_at/updated_at（_build_overview） |
| `GET /api/v1/org/50/overview` | 200 | 200 ✓ | ✓ 字段同上一致 |
| `GET /api/v1/org/50/dashboard` | 200 | 200 ✓ | ✓ 字段含 organization/statistics/charts/recentActivities/alerts（_build_dashboard） |
| `GET /api/v1/org/50/licenses/statistics` | 200 | **500** | ❌ **Internal Server Error** |

### 任务 1.4 tenant 路径变体 4 路由 - ✓ 4/4 通过

| 路由 | 期望 | 实际 | 结论 |
|------|------|------|------|
| `GET /api/v1/tenant/menu` | 200 | 200 ✓ | ✓ |
| `GET /api/v1/tenant/menu/50` | 200 | 200 ✓ | ✓ 内容与无 org_id 变体**完全一致** |
| `GET /api/v1/tenant/config` | 200 | 200 ✓ | ✓ |
| `GET /api/v1/tenant/config/50` | 200 | 200 ✓ | ✓ |

### 任务 1.5 跨租户校验 - ❌ 1/3 通过（**存在安全漏洞**）

| 路由 | 期望 | 实际 | 结论 |
|------|------|------|------|
| `GET /api/v1/educational_institution/org/99999/overview` | 403/404 | **200** | ❌ **严重安全漏洞** — 返回了 org_id=99999 的真实数据 `{studentCount: 3, teacherCount: 0, activeCourses: 0, activeMembers: 3}`！任何 zhao_admin 可读取其他机构数据 |
| `GET /api/v1/tenant/menu/99999` | 403/404 | 404 ✓ | ✓ |
| `GET /api/v1/org/99999/overview` | 403/404 | 404 ✓ | ✓ |

---

## 三、任务 2: 前端 dist 静态校验

### 任务 2.1-2.2 chunk 列表与 hash 对比

| Chunk | 部署 hash | 用户描述新 hash | 旧 hash 残留 | 状态 |
|-------|-----------|----------------|-------------|------|
| main | `818029bea5bd6c2b` | `d768ec8025095d91` (不匹配) | `db0cdf9b33859376` (无) | ⚠️ |
| runtime | `931a70b388358e1c` | - | - | - |
| polyfills | `4795f4e8543b81a2` | - | - | - |
| styles | `425b587c9d0eaa24` | - | - | - |

**关键发现**: 部署服务器上的 main hash 是 **`818029bea5bd6c2b`**，与用户在验收模板里描述的 `d768ec8025095d91` **不匹配**。本地工作区未追踪的 `main.d768ec8025095d91.js` 是用户本机构建的 dist，但服务器部署的是另一版本（CI/部署工具出的）。**请确认到底哪个是目标版本**。

### 任务 2.3 4 个 chunk HEAD 200 ✓

```
main       /app/main.818029bea5bd6c2b.js          HTTP 200 size=1928678
runtime    /app/runtime.931a70b388358e1c.js       HTTP 200 size=3308
polyfills  /app/polyfills.4795f4e8543b81a2.js     HTTP 200 size=34818
styles     /app/styles.425b587c9d0eaa24.css       HTTP 200 size=86486
```

### 任务 2.4 SCSS 路径修复验证 - ✓ 通过

部署 dist 中**不**含 SCSS 相对路径残留：
- `'../../../styles/design-tokens'`: count=0 ✓
- `'../../../styles/shared/mixins'`: count=0 ✓
- `"../../../styles/design-tokens"`: count=0 ✓
- `"../../../styles/shared/mixins"`: count=0 ✓

关键功能/路径存在性：
- `mockDataDelay: 0` ✓ (在编译产物中确认)
- `InstitutionDashboardComponent` ✓ (3 处)
- `tenant/menu` ✓ (1 处)
- `tenant/config` ✓ (1 处)
- `licenses/statistics` ✓ (1 处)
- `institution-management` ⚠️ (count=0，angular 编译后路径被改写为 `:id` 形式)
- `educational_institution/org` ⚠️ (count=0，但 OpenAPI 确认路由已上线)
- `org/overview` ⚠️ (count=0，被改写为短 hash)
- `org/dashboard` ⚠️ (count=0，同上)

### 任务 2.5-2.7 营销站 / SPA 入口 ✓

- `GET /` → 200 (77KB, 营销站首页)
- `GET /demo` → 200 (16KB)
- `GET /features` → 404 (不在营销站)
- `GET /pricing` → 200 (43KB)
- `GET /app/login` → 200, 含 `<app-root>` 标签 ✓
- `GET /app/admin/institution-management` → 200, 含 `<app-root>` 标签 ✓
- `GET /app/features/stem-cloud/dashboard` → 200, 含 `<app-root>` 标签 ✓

---

## 四、任务 3: Browser subagent 浏览器访问 - ❌ 降级

**Browser subagent 状态**：
- ✅ `navigate_page` 首次成功跳转到 `https://jigou.matux.tech/app/login`
- ❌ 之后所有工具（snapshot / screenshot / evaluate_script / wait_for / click / fill 等）连续 20+ 次超时（10~15s timeout）
- ✅ 仅 `list_pages` 能工作，证明扩展进程活着但 DevTools 协议已断
- ❌ 即使重定向到 `about:blank` 也仍超时

**结论**: Browser subagent 内嵌 DevTools 协议挂死，无法执行任何交互或截图操作。

**已生成的截图**: 0 张（`reports/acceptance_2026_06_17/` 目录下无 PNG 文件）

---

## 五、任务 4: 降级方案 - 静态反编译 + API 复现

### 5.1 4 个 BUG 再次复现确认

```
GET /api/v1/educational_institution/org/50/students       -> HTTP 500 (Internal Server Error)
GET /api/v1/educational_institution/org/50/teachers       -> HTTP 500 (Internal Server Error)
GET /api/v1/educational_institution/org/50/enrollment/stats -> HTTP 500 (Internal Server Error)
GET /api/v1/org/50/licenses/statistics                     -> HTTP 500 (Internal Server Error)
GET /api/v1/educational_institution/org/99999/overview     -> HTTP 200 (返回非授权数据)
```

### 5.2 main.js 编译产物分析 (818029bea5bd6c2b)

- 文件大小 1.9MB (1928678 chars)
- 包含 `InstitutionDashboardComponent` 3 处
- 包含 `environment.prod.ts` 编译产物：`{production:!0,apiUrl:"",useMockData:!1,mockDataDelay:0}` ✓
- 路由 lazy-load 形式: `path:":id",loadComponent:()=>Promise.resolve().then(p.bind(p,6118)).then(yt=>yt.InstitutionDashboardComponent)`
- SCSS 编译到 styles.css：86KB，包含颜色变量（`#616161`/`#e53935`/`#46a35e` 等已编译为 hex）

### 5.3 styles.css 编译产物

- 86KB
- 颜色变量已编译（如 `#46a35e` 绿色主色）
- 间距变量已编译（`padding:16px` / `padding-top:24px` 等）

---

## 六、关键问题汇总

| 严重度 | 问题 | 影响 |
|--------|------|------|
| 🔴 **P0 安全** | `/api/v1/educational_institution/org/{任意 org_id}/overview` **不校验 org_id 归属**，任何登录用户可读取其他机构数据 | **多租户隔离失败**，违反 STEM 教育数据隐私合规要求 |
| 🔴 **P0 后端 500** | `/api/v1/educational_institution/org/{org_id}/students` 500 | 机构概览页面加载学员列表会直接报错 |
| 🔴 **P0 后端 500** | `/api/v1/educational_institution/org/{org_id}/teachers` 500 | 机构概览页面加载教师列表会直接报错 |
| 🔴 **P0 后端 500** | `/api/v1/educational_institution/org/{org_id}/enrollment/stats` 500 | 机构概览招生统计不可用 |
| 🔴 **P0 后端 500** | `/api/v1/org/{org_id}/licenses/statistics` 500 | 许可证统计功能不可用 |
| 🟡 **P1 实现重复** | org_scoped_router 调用的是 `get_org_overview` (educational_institution_routes.py)，而 `/api/v1/org/...` 调用的 `_build_overview` (org_overview_routes.py) — **两套路由数据源不同**，响应结构也不一致 | 前端不同位置调不同路径会拿到不同数据 |
| 🟡 **P1 部署不一致** | 部署服务器 main hash `818029bea5bd6c2b` 与用户描述的 `d768ec8025095d91` 不匹配 | 无法确认服务器上跑的是用户期望的 dist 哪个版本 |
| 🟢 **P2 浏览器** | Browser subagent DevTools 协议挂死（20+ 次超时） | 无法做实际页面截图验证 |

---

## 七、详细产物文件清单

所有文件均在 `g:\OpenMTEduInst\reports\acceptance_2026_06_17\`：

| 文件 | 用途 |
|------|------|
| `api_test.log` | 任务 1 后端 API 测试日志（含原始 8 路由响应汇总） |
| `dist_test.log` | 任务 2 dist 静态校验日志 |
| `task4_degraded.log` | 任务 4 降级验收日志（含 BUG 复现 + 静态反编译） |
| `index.html` | 部署服务器 index.html (66KB) |
| `main.js` | 部署 main.818029bea5bd6c2b.js (1.9MB) |
| `styles.css` | 部署 styles.425b587c9d0eaa24.css (86KB) |
| `login.json` | 登录响应 |
| `me.json` | /auth/me 响应 |
| `scoped_50_*.json` (8 个) | org_scoped_router 8 个路由响应 |
| `overview__api_v1_org_*.json` (4 个) | org_overview_routes 4 个路由响应 |
| `tenant__api_v1_tenant_*.json` (4 个) | tenant 路径变体 4 个路由响应 |

**截图清单**: 0 个 PNG（Browser subagent 不可用，未生成任何截图）

---

## 八、建议下一步

1. **P0 紧急修复**：
   - 修复 4 个 500 错误（查 backend/logs/server.log 的 stack trace）
   - 修复 `org_scoped_router` 的 org_id 校验（添加 `effective_org_id = org_id if org_id==token_org_id else 403`）
2. **确认部署版本**：
   - 服务器 main hash 是 `818029bea5bd6c2b`，本地未追踪的是 `d768ec8025095d91`，请确认 CI 出的是哪个 hash
3. **重启 Browser**：
   - 浏览器 DevTools 协议挂死需手动关闭 jigou.matux.tech 标签页或重启浏览器，再做实际页面截图
4. **修完后**：
   - 重跑 `python scripts/acceptance_2026_06_17.py` 和 `acceptance_2026_06_17_dist.py`
   - 浏览器验收建议直接在终端用户本机做（不依赖 Browser subagent）
