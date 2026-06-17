# OpenMT 前端 SCSS 修复部署验收方案

## Context（背景）

此前在 `https://jigou.matux.tech/app/organization/50/dashboard` 出现 **"文字看不见、图标看不见"** 的问题。

**根因**：Angular 17 默认 `inlineStyleLanguage: "css"`，但 45 个 .ts + 12 个 .scss 组件使用了 SCSS 变量（如 `color: $color-neutral-900`）。CSS 编译器对未知变量值会**静默忽略**，导致组件内联样式失效（字号、字色、背景均为默认空白）。

**本轮已完成的修改（无需再改）**：
1. `frontend/angular.json`：添加 `inlineStyleLanguage: "scss"` + `stylePreprocessorOptions.includePaths: ["src/styles"]`
2. `frontend/package.json`：添加 `sass: ^1.101.0` 依赖
3. 45 个 .ts + 12 个 .scss 文件：改 `@use` 引用为 `src/styles` 相对路径
4. `frontend/src/styles/design-tokens.scss`：补齐缺失变量（`$card-shadow`、`$btn-primary-bg` 等）
5. 新建 `frontend/src/styles/shared/_mixins.scss`

**部署状态**（用户已自动完成）：
- 服务器 `43.156.248.107` 的 `/opt/openmt/backend/deploy/frontend/` 已替换为新 dist
- 主入口已切到 `main.818029bea5bd6c2b.js`（旧版本 `main.b83064bc0fef5f05.js`）
- nginx 容器已重启
- 服务端 `main.js` 中 `"color:$"` 未解析变量计数 = 0（修复前 122）

**本轮目标**：用 Chromium 浏览器对生产环境做端到端验证，确认：
- 经营概览 / 数据分析 两个 Tab 的文字、图标、KPI 数字、卡片标题均正常可见
- 无 SCSS 编译时报错（`Undefined variable` 之类）
- 已加载的 JS hash 确为 `main.818029bea5bd6c2b.js`
- 其他 3 个路由（students、stem-projects、admin/users）无回归

## 本地预检（已确认通过）

- ✅ `frontend/angular.json` 第 23 行含 `"inlineStyleLanguage": "scss"`
- ✅ `frontend/angular.json` 第 24-26 行含 `stylePreprocessorOptions.includePaths: ["src/styles"]`
- ✅ `frontend/package.json` 第 36 行 `"sass": "^1.101.0"`
- ✅ `frontend/src/styles/design-tokens.scss` 包含 `$card-shadow`、`$btn-primary-bg`、`$color-neutral-900` 等所有组件引用到的令牌
- ✅ `frontend/src/styles/shared/_mixins.scss` 存在
- ✅ `frontend/dist/openmt-edu-inst/main.818029bea5bd6c2b.js` 存在（1.93 MB）
- ✅ `frontend/dist/openmt-edu-inst/styles.425b587c9d0eaa24.css` 存在（86 KB）
- ✅ dist `main.818029bea5bd6c2b.js` 中 `color:$` / `tokens.$` / 残余 SCSS 变量匹配数均为 **0**（编译干净）

## 验收执行步骤

### 任务 1：登录态预热
使用 Browser subagent 先访问登录页拿到有效 token（复用 `backend/test_login.py` 中的演示账号 `org_admin`），写入 `localStorage.openmt_token`，避免直接命中 dashboard 被重定向到登录页。

**关键路径**：
- 登录 API：`https://jigou.matux.tech/api/v1/auth/login`
- localStorage key：`openmt_token`
- 注：登录后跳回 `/app/organization/50/dashboard` 时若仍要再次注入 token，可在子代理 `evaluate` 步骤里加 `localStorage.setItem('openmt_token', '<token>')` 再 `location.reload()`

### 任务 2：主仪表盘"经营概览"截图与逐项检查
- 浏览器打开 `https://jigou.matux.tech/app/organization/50/dashboard`
- 模拟 `Ctrl+Shift+R` 硬刷新（通过 subagent 调 `page.reload({ waitUntil: 'networkidle0' })` 并清缓存 `Cache-Control: no-cache` header）
- 等待 `app-organization-dashboard` 元素可见，2 秒缓动
- **截图 1**：`g:\OpenMTEduInst\reports\verify_dashboard_overview.png`（视口 1440x900）
- 逐项核对（通过 `page.evaluate` 取计算样式 + `take_snapshot` 取 a11y 文本）：
  - a) 顶部 Tab 栏（"经营概览"、"数据分析"）：用 `getComputedStyle` 校验 `.tab-label span` 的 `color` 不为 `rgba(0, 0, 0, 0)`、字号 ≥ 12px
  - b) "STEM 特色功能" 模块：验证 `.feature-label`、`.feature-desc`、`.feature-icon-wrapper mat-icon` 均有 `color` 计算值
  - c) "核心经营指标" KPI 卡：验证 `.kpi-value`、`.kpi-unit` 字号 ≥ 20px 且 `color` 不为透明
  - d) "智能预警中心"：检查 `.alert-message` 文字与 `.alert-icon` 颜色
  - e) 左侧导航菜单：检查所有菜单项 `.nav-item` 文字色
- 截图保存到 `g:\OpenMTEduInst\reports\verify_dashboard_overview_zoom.png`（放大到 2x DPR 显示关键区域）

### 任务 3：切到"数据分析"Tab 截图
- 点击 "数据分析" Tab
- 等 `app-data-analytics-dashboard` 元素可见
- **截图 2**：`g:\OpenMTEduInst\reports\verify_dashboard_analytics.png`
- 逐项核对：
  - 图表卡片标题（"营收趋势"、"招生漏斗"、"课程分类"等）
  - 图表坐标轴文字
  - 数据卡片数字与单位
  - 任何加载状态（spinner）应已消失

### 任务 4：其他路由回归抽查
- 依次访问并截图：
  - `https://jigou.matux.tech/app/organization/50/students` → `verify_students.png`
  - `https://jigou.matux.tech/app/organization/50/stem-projects` → `verify_stem_projects.png`
  - `https://jigou.matux.tech/app/admin/users` → `verify_admin_users.png`
- 每个页面验证：导航栏 + 主体内容文字 / 图标 / 表格表头均可见

### 任务 5：DevTools Console 检查
- 收集 `page.on('console', ...)` 期间的所有输出
- 收集 `page.on('pageerror', ...)` 未捕获异常
- **关键判定**：
  - ❌ 出现 "Undefined variable"、"Undefined mixin"、"Failed to compile" → 不通过
  - ❌ 出现 "404" 指向 `main.*.js` 或 `styles.*.css` → 不通过
  - ❌ 任何 "TypeError: Cannot read property of null" 与样式相关 → 不通过
  - ✅ 只剩 API 业务错误 / Angular 调试信息 → 通过

### 任务 6：DevTools Network 检查
- 监听 `request` 事件，匹配 `main\.[a-f0-9]+\.js` 的 URL
- 校验：实际请求的 JS 路径 = `/app/main.818029bea5bd6c2b.js`
- 若 hash 不等于 `818029bea5bd6c2b` → 不通过
- 同时验证 `styles.*.css` 的 `Content-Type: text/css` 与 HTTP 200

### 任务 7：兜底 - take_snapshot a11y 文本树
- 如果 Browser subagent 在任务 2 截图超时，改用 `take_snapshot` 取 4 个页面的 a11y 树
- 校验关键字存在：
  - 经营概览：`经营概览`、`数据分析`、`STEM 特色功能`、`核心经营指标`、`在训学员`、`本月营收`、`本月消课率`、`设备使用率`、`AI助教`、`智能评测`、`课程生成`、`代码审查`
  - 左侧菜单：`概览`、`学员`、`教师`、`课程`、`资源`、`STEM 特色`
  - 任意路由：`<title>` 标签 + 至少 5 个 h1/h2/h3 标签
- 通过 a11y 文字可推断 "文字是否在 DOM 中"，但**无法**确认颜色/字号渲染效果，所以仅作兜底

## 验收结果输出

完成后以 Markdown 报告形式返回（写入 `g:\OpenMTEduInst\reports\scss_fix_verification_report.md`），并把每条检查的结论粘贴到对话里。报告结构：

| # | 验收项 | 结论 | 关键证据（截图路径 / DOM 选择器 / JS hash） |
|---|--------|------|------------------------------------------|
| 1 | 顶部 Tab 文字可见 | ✅/❌ | `verify_dashboard_overview.png` |
| 2 | STEM 特色功能模块 | ✅/❌ | |
| 3 | KPI 数字与单位 | ✅/❌ | |
| 4 | 智能预警中心 | ✅/❌ | |
| 5 | 左侧导航菜单 | ✅/❌ | |
| 6 | 数据分析 Tab | ✅/❌ | `verify_dashboard_analytics.png` |
| 7 | /students 路由 | ✅/❌ | `verify_students.png` |
| 8 | /stem-projects 路由 | ✅/❌ | `verify_stem_projects.png` |
| 9 | /admin/users 路由 | ✅/❌ | `verify_admin_users.png` |
| 10 | Console 无 SCSS 报错 | ✅/❌ | 日志附后 |
| 11 | main.js hash 正确 | ✅/❌ | `main.818029bea5bd6c2b.js` |

## 关键文件路径参考

- 部署脚本：`g:\OpenMTEduInst\frontend\redeploy.ps1`
- 仪表盘组件：`g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\organization-dashboard.component.ts`
- 经营概览子组件：`g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\dashboard-overview\training-dashboard-v2.component.ts`
- 数据分析子组件：`g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\data-analytics\data-analytics-dashboard.component.ts`
- 设计令牌：`g:\OpenMTEduInst\frontend\src\styles\design-tokens.scss`
- Mixin：`g:\OpenMTEduInst\frontend\src\styles\shared\_mixins.scss`
- Angular 构建配置：`g:\OpenMTEduInst\frontend\angular.json`
- 登录测试（复用）：`g:\OpenMTEduInst\backend\test_login.py`

## 验证总时长预估

- 登录态预热：~10s
- 主仪表盘 2 个 Tab 截图：~30s
- 3 个回归路由：~30s
- Console / Network 收集：~10s
- 报告生成：~5s
- **合计 ~90s**（如出现 subagent 超时，则降级为 a11y 文本核对，约 30s）

## 风险与回退

- **风险 1**：Browser subagent 在内嵌网络受限环境下访问 `jigou.matux.tech` 失败  
  - 回退：先 `curl -I https://jigou.matux.tech/app/` 验证可达性；仍不可达则只输出"网络不可达，本地 dist 自检通过"结论
- **风险 2**：演示账号 token 失效（`test_login.py` 中的密码可能已变更）  
  - 回退：使用 `curl` 直接调 `/api/v1/auth/login` 拿 token 再注入 localStorage
- **风险 3**：用户实际页面已重构（如 `50/dashboard` 已改路由）  
  - 回退：截图失败时通过 HTML `<title>` 和首个 `<h1>` 文本推断页面是否成功加载
