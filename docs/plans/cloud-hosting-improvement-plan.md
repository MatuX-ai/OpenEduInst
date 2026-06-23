# OpenMT 云托管版 - PRD 对齐与 UI 优化改进计划

## Context

OpenMT 云托管版 PRD（`CLOUD_HOSTING_PRD.md` v1.1）与实际代码实现之间存在显著差距。PRD 已完成实现状态审计，标注了 ✅ 已实现 和 🎯 待实现 两层描述，但核心云托管差异化功能（Schema 级隔离、真实 S3 备份、LLM AI 助教、前端路由守卫、PWA 等）均未落地。同时，前端 UI 存在设计令牌未被广泛引用、`::ng-deep` 滥用、可访问性缺失、响应式断点不统一等技术债务。本计划旨在分5个阶段系统性地消除 PRD 与实现的差距，并在每个阶段建立量化验收机制，确保交付质量。

---

## 阶段一：安全加固与基础设施（第 1-2 周）

### 目标
消除生产环境硬性阻塞项，建立最小可交付安全基线。

### 开发任务

| # | 任务 | 关键文件 | 说明 |
|---|------|---------|------|
| 1.1 | PostgreSQL Schema 级隔离 | `backend/config/settings.py`, `backend/utils/database.py`, 新建 `backend/utils/schema_isolation.py` | 连接时执行 `SET search_path TO org_{org_id}`，Schema 自动创建迁移脚本 |
| 1.2 | CSP Header 注入 | `backend/main.py` L126-136 `_security_headers` | 添加 `Content-Security-Policy: default-src 'self'; script-src 'self'` |
| 1.3 | 敏感字段 AES-256 加密 | `backend/models/base_models.py`, `backend/models/student.py` | 创建 `EncryptedString` 自定义 SQLAlchemy Type，加密手机号/身份证 |
| 1.4 | 数据脱敏工具 | 新建 `backend/utils/data_masking.py` | `mask_phone("13812345678")` -> `138****5678`，序列化层调用 |
| 1.5 | Redis Key 前缀隔离 | 新建 `backend/utils/redis_cache.py` | 封装 `get/set/delete`，Key 格式 `{org_id}:{module}:{key}` |
| 1.6 | Celery + Beat 定时调度 | 新建 `backend/tasks/celery_app.py`, `backend/tasks/backup_tasks.py` | 每日 02:00 增量备份、每周日 03:00 全量备份 |
| 1.7 | S3/MinIO 真实上传 | `backend/services/cloud_backup_service.py` L101-113 | 引入 `boto3` 替换模拟逻辑，路径 `openmt-backups/{org_id}/{snapshot_id}.tar.gz` |
| 1.8 | 欢迎邮件发送 | 新建 `backend/services/email_service.py`, `backend/routes/auth_routes.py` 注册后调用 | 使用 `aiosmtplib` 或 SendGrid，注册后发送欢迎邮件 |

### 验收标准与方法

| 验收项 | 标准 | 验收方法 |
|--------|------|---------|
| Schema 隔离 | 新组织创建后 PostgreSQL 中存在独立 Schema `org_{id}` | `psql -c "\dn"` 列出 Schema；pytest 验证跨 Schema 数据不可见 |
| CSP Header | 所有响应包含 `Content-Security-Policy` 头 | `curl -I http://localhost:8000/health` |
| AES-256 加密 | 数据库中手机号为密文，API 返回脱敏格式 | 直连 DB `SELECT phone FROM users` 验密文；API 返回 `138****5678` |
| Celery Beat | 调度日志中显示每日/每周备份任务 | 启动 Beat 观察日志 |
| S3 上传 | MinIO Bucket 中出现 `.tar.gz` 备份文件 | `aws s3 ls s3://openmt-backups/ --endpoint-url http://localhost:9000` |
| 欢迎邮件 | 注册后收到欢迎邮件 | Mailhog 捕获验证 |

---

## 阶段二：前端工程化与 UI 一致性（第 3-4 周）

### 目标
统一视觉语言、消除技术债、建立可维护的样式体系。

### 开发任务

| # | 任务 | 关键文件 | 说明 |
|---|------|---------|------|
| 2.1 | Angular Material 自定义品牌主题 | `frontend/angular.json` L32, 新建 `frontend/src/styles/_theme.scss` | 替换 `indigo-pink.css` 为 `mat.define-theme()`，品牌色 `#1976d2` |
| 2.2 | 全局 CSS Reset | 新建 `frontend/src/styles/_reset.scss` | Normalize.css + box-sizing + focus 样式，在 `styles.css` 首行引入 |
| 2.3 | 消除所有 `::ng-deep` | 约12个文件（最严重：`project-management.component.ts` 16处） | 替换为 ViewEncapsulation 策略 + CSS 变量覆盖 |
| 2.4 | 侧边栏 Design Token 统一 | `frontend/src/app/.../organization-layout.component.ts` | 将硬编码 Tailwind 色值（`#0F172A`/`#2563EB` 等）替换为 `$color-*` token |
| 2.5 | 响应式断点统一 | `frontend/src/styles/shared/_mixins.scss` + 各组件 | 统一使用 `$breakpoint-sm: 600px` / `$breakpoint-md: 960px` / `$breakpoint-lg: 1280px`，消除 768px/1024px/1200px 混用 |
| 2.6 | SCSS Mixins 库扩充 | `frontend/src/styles/shared/_mixins.scss`（当前仅3个 mixin） | 新增 `responsive($bp)`, `truncate-text`, `card-base`, `skeleton-loading`, `focus-ring`, `visually-hidden` 等 10+ mixin |
| 2.7 | ECharts/XLSX 按需加载 | 各使用 ECharts 的 `.component.ts` | `import * as echarts from 'echarts/core'` + 按需注册；XLSX 动态 `import()` |
| 2.8 | 包预算收紧 | `frontend/angular.json` L46-57 | initial: 2MB/3MB -> 1MB/1.5MB；anyComponentStyle: 14kb/16kb -> 6kb/8kb |

### 验收标准与方法

| 验收项 | 标准 | 验收方法 |
|--------|------|---------|
| 品牌主题 | Material 组件使用 #1976d2 品牌蓝 | 视觉截图对比；检查生成 CSS 中 `--mdc-theme-primary` 值 |
| `::ng-deep` 清零 | `grep -rn "::ng-deep" frontend/src/` = 0 结果 | grep 计数 |
| 断点统一 | 所有响应式仅在 600/960/1280/1920px 触发 | Chrome DevTools 设备模拟器逐步调宽度 |
| 包体积 | `ng build --configuration production` 初始包 < 1MB | 构建输出日志查看 initial chunk |
| ECharts 按需 | 生产构建中不含未使用 ECharts 模块 | `source-map-explorer` 分析 |
| Design Token 引用率 | SCSS 中 token 引用 >= 95%，硬编码色值 = 0 | grep 统计 |

---

## 阶段三：核心功能完整交付（第 5-7 周）

### 目标
实现 PRD 要求的全部云托管专属功能。

### 开发任务

| # | 任务 | 关键文件 | 说明 |
|---|------|---------|------|
| 3.1 | AI 助教接入真实 LLM | `backend/services/ai_assistant_service.py` | 引入 OpenAI/通义千问 API 替换规则返回，保留 Token 计费 |
| 3.2 | Token 充值 API | 新建 `backend/routes/token_purchase_routes.py`, 修改 `backend/routes/token_routes.py` | `/api/v1/token/purchase`，对接支付网关 |
| 3.3 | 许可证激活 API | `backend/routes/license_routes.py` | `/api/v1/licenses/activate`，验证密钥 -> 绑定组织 -> 开启功能 |
| 3.4 | 前端路由守卫 | 新建 `frontend/src/app/guards/license.guard.ts` | `CanActivate` 接口，按许可证类型和功能开关控制模块路由 |
| 3.5 | 备份管理 UI 看板 | 新建 `frontend/src/app/.../backup-management/` | 备份状态看板 + 历史快照列表 + 一键回滚 + 手动备份 |
| 3.6 | AI 助教交互界面 | 新建 `frontend/src/app/.../ai-assistant/` | 对话式 UI，排课/学情/代码审查三个 Tab，流式输出 |
| 3.7 | WebSocket 前端客户端 | 新建 `frontend/src/app/core/services/websocket.service.ts` | 连接 `/api/v1/ws/connect`，按事件类型分发推送 |
| 3.8 | 备份通知推送 | `backend/services/cloud_backup_service.py` + `backend/routes/notification_routes.py` | 备份结果通过 WebSocket 实时推送 + 站内信 |
| 3.9 | **OpenMTSciEd 集成 M1** | 新建 `backend/services/opensciedu_client.py`, `backend/routes/opensciedu_routes.py` | 代理教程/课件/硬件项目 API，详见 [openmtscied-integration-plan.md](./openmtscied-integration-plan.md) |
| 3.10 | **OpenMTSciEd 集成 M2–M3** | `teaching-resources.component.ts`, `teacher-portal/*` | 资源页接 API、教师工作台、系统设置 Tab |

### 验收标准与方法

| 验收项 | 标准 | 验收方法 |
|--------|------|---------|
| AI 排课 | 10教师+5教室+8课程输入，返回无冲突方案，< 30s | pytest 集成测试 + 手动验证 LLM 输出质量 |
| AI 代码审查 | 含语法错误的 Python/C/JS 代码，正确识别 >= 80% 错误 | pytest 参数化测试覆盖三种语言 |
| Token 充值 | 支付完成后余额正确增加 | 沙箱支付环境验证完整链路 |
| 许可证激活 | 有效密钥激活后，前端路由动态显示/隐藏模块 | pytest + Cypress E2E |
| 备份看板 | 展示最近30天每日备份状态，存储精确到 MB | 浏览器截图验证 UI 与 API 数据一致 |
| WebSocket 推送 | 排课变更后 < 2s 前端收到通知 | Chrome DevTools Network 面板查看 WebSocket 帧 |

---

## 阶段四：可访问性、PWA 与多端适配（第 8-9 周）

### 目标
达到 WCAG AA 标准，实现 PWA 离线支持，完善移动端体验。

### 开发任务

| # | 任务 | 关键文件 | 说明 |
|---|------|---------|------|
| 4.1 | 全局 aria-label 补全 | 所有 `.component.ts` | 所有交互元素添加 `aria-label` / `aria-labelledby`（当前仅3处） |
| 4.2 | 键盘导航支持 | 列表/表格/对话框组件 | Tab 键序 + Enter 激活 + Escape 关闭 + 方向键导航 |
| 4.3 | 焦点指示器 | `_mixins.scss` 新增 `focus-ring` mixin | 所有可聚焦元素可见焦点环 |
| 4.4 | 色彩对比度修正 | 各组件 `.scss` | 文字与背景对比度 >= 4.5:1（WCAG AA），使用语义化 token |
| 4.5 | PWA 支持 | 新建 `src/manifest.webmanifest`, 配置 `angular.json` | `@angular/pwa` schematic 生成 Service Worker |
| 4.6 | 移动端侧边栏 | `organization-layout.component.ts` | < 600px 侧边栏改为汉堡菜单 + overlay 模式 |
| 4.7 | 五断点适配测试 | 所有页面组件 | 375px / 768px / 1024px / 1280px / 1920px 验证布局 |

### 验收标准与方法

| 验收项 | 标准 | 验收方法 |
|--------|------|---------|
| WCAG AA | Lighthouse Accessibility >= 90 | `npx lighthouse --only-categories=accessibility` |
| aria-label 覆盖 | 所有交互元素均有 aria 属性 | grep 计数 >= 交互元素总数 |
| 键盘导航 | 仅用 Tab+Enter+Esc 完成核心操作 | 人工测试：不使用鼠标完成 4 个核心流程 |
| 色彩对比度 | 无对比度 < 4.5:1 的文字 | Chrome Lighthouse Accessibility 审计 |
| PWA 安装 | Chrome "添加到主屏幕" 出现；离线可加载缓存 | Lighthouse PWA 审计 + 手动断网 |
| 五断点适配 | 无溢出、无截断、可正常操作 | Percy/Chromatic 快照对比 |

---

## 阶段五：性能优化与生产交付（第 10 周）

### 目标
达到生产级性能指标，建立持续验收机制。

### 开发任务

| # | 任务 | 关键文件 | 说明 |
|---|------|---------|------|
| 5.1 | SSL/TLS 自动签发 | `backend/deploy/nginx/` 配置 | Nginx + Certbot Let's Encrypt 自动签发/续期 |
| 5.2 | Lighthouse CI 阈值 | 新建 `frontend/.lighthouserc.json` | Performance >= 80, Accessibility >= 90, Best Practices >= 90 |
| 5.3 | Docker Compose 生产编排 | `docker-compose.yml`（根目录） | FastAPI + Nginx + PostgreSQL + Redis + MinIO + Celery Worker + Beat = 7服务 |
| 5.4 | 端到端验收脚本 | 新建 `scripts/acceptance_cloud.py` | 注册 -> 激活 -> 创建学生 -> 备份 -> AI排课 -> WebSocket -> 隔离验证 |
| 5.5 | 跨租户泄露检测 | 新建 `scripts/tenant_isolation_test.py` | 两组织交叉访问所有 API，全部应返回 401/403 |
| 5.6 | 备份恢复演练 | `scripts/acceptance_cloud.py` | 备份 -> 写入新数据 -> 恢复 -> 验证新数据消失 |

### 验收标准与方法

| 验收项 | 标准 | 验收方法 |
|--------|------|---------|
| Lighthouse CI | 四项指标全部达标 | CI 管道 `lhci autorun` |
| SSL 证书 | HTTPS 访问无证书警告 | `curl -vI https://domain/health` |
| Docker 编排 | 7 个服务全部 healthy | `docker-compose ps` |
| 端到端验收 | 自动化脚本 100% 通过 | `python scripts/acceptance_cloud.py` 全绿 |
| 数据泄露检测 | 跨租户访问 100% 被拒绝 | `python scripts/tenant_isolation_test.py` 全绿 |
| 备份恢复 | 恢复后数据与备份时间点完全一致 | 记录数 + SHA-256 校验 |

---

## UI 优化验收量化指标汇总

### 视觉设计一致性

| 指标 | 标准 | 检测方法 |
|------|------|---------|
| 品牌色使用率 | 组件硬编码色值数量 = 0 | grep 内联样式硬编码色值 |
| Design Token 引用率 | SCSS 中 token 引用 >= 95% | grep `$color-*`/`$spacing-*` vs 硬编码 px/# |
| 字体层级 | 仅使用 6 级语义字号 | 编译后 CSS font-size 值集合检查 |
| 间距网格 | 所有间距为 4px 整数倍 | 编译后 CSS margin/padding 值检查 |

### 响应式适配

| 断点 | 宽度 | 验证设备 | 要求 |
|------|------|---------|------|
| Mobile S | 375px | iPhone SE | 汉堡菜单，单列，无水平滚动 |
| Tablet | 768px | iPad Mini | 侧边栏可展开/收起，两列 |
| Tablet L | 1024px | iPad Pro | 侧边栏常驻，三列 |
| Desktop | 1280px | 笔记本 | 完整布局 |
| Desktop L | 1920px | 大屏 | 最大宽度 1440px 居中 |

### 交互体验

| 指标 | 标准 |
|------|------|
| 按钮反馈 | hover/active 有颜色变深 + translateY |
| 加载状态 | 骨架屏而非空白/spinner |
| 过渡动画 | 0.25s ease-in-out，无闪烁 |
| 错误提示 | 实时显示在输入框下方，红色 + 图标 |

### 性能指标

| 指标 | 目标值 | 工具 |
|------|--------|------|
| Lighthouse Performance | >= 80 | lhci |
| Lighthouse Accessibility | >= 90 | lhci |
| FCP | < 1.8s | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TBT | < 200ms | Lighthouse |
| 初始包大小 | < 1MB / < 1.5MB | ng build |

---

## 核心功能专项验收方案

### 多租户隔离验证（`scripts/tenant_isolation_test.py`）

| 用例 | 操作 | 预期 |
|------|------|------|
| TC-01 Schema 隔离 | 创建 A/B 组织分别写入数据 | 跨 Schema 数据不可见 |
| TC-02 Token 越权 | A 的 JWT 伪造 B 的 org_id | 返回 401/403 |
| TC-03 缓存隔离 | A 设缓存，B 尝试读 | B 无法读取 |
| TC-04 文件隔离 | A 上传 S3，B 尝试列 A 的 Bucket | B 无权限 |
| TC-05 SQL 注入 | 搜索参数注入 `' OR 1=1 --` | 无数据泄露 |
| TC-06 ID 遍历 | A 请求属于 B 的学生 ID | 返回 404 |

### 备份与恢复验证

| 用例 | 操作 | 预期 |
|------|------|------|
| BK-01 定时备份 | Beat 触发 | MinIO 出现快照，DB 新增记录 |
| BK-02 手动备份 | POST create | 201 + COMPLETED |
| BK-03 增量恢复 | 创建 -> 备份 -> 删除 -> 恢复 | 数据恢复 |
| BK-04 全量恢复 | 大量写入 -> 全备 -> 清空 -> 恢复 | SHA-256 一致，< 30min |
| BK-05 安全快照 | 执行恢复 | 自动创建安全快照 |
| BK-06 通知推送 | 备份完成/失败 | WebSocket + 站内信 |

### AI 助教质量评估

| 维度 | 方法 | 标准 |
|------|------|------|
| 排课准确性 | 10 组不同规模测试 | 无冲突率 >= 95% |
| 学情分析 | 20 个模拟学生 | 含 5 维度 + 合理建议 |
| 代码审查 | 30 段已知问题代码（Py/C/JS 各10） | 识别 >= 80% 错误 |
| 响应延迟 | P95 | 排课 < 30s, 学情 < 10s, 审查 < 15s |

---

## 验收工具链

| 工具 | 用途 | 命令 |
|------|------|------|
| pytest + httpx | 后端单元/集成测试 | `PYTHONPATH=. pytest backend/tests/` |
| Jasmine + Karma | 前端单元测试 | `ng test` |
| Cypress | 前端 E2E | `npx cypress run` |
| Lighthouse CI | 性能/可访问性 | `lhci autorun` |
| Chromatic/Percy | UI 截图对比 | `npx chromatic --project-token=xxx` |
| Bandit | Python 安全扫描 | `bandit -r backend/` |
| npm audit | 前端依赖漏洞 | `cd frontend && npm audit --production` |
| OWASP ZAP | API 动态安全 | `zap-cli quick-scan http://localhost:8000` |
| tenant_isolation_test.py | 跨租户泄露检测 | `python scripts/tenant_isolation_test.py` |

---

## 时间线总览

| 阶段 | 时间 | 核心交付 | 验收里程碑 |
|------|------|---------|-----------|
| 阶段一 | 第1-2周 | 安全加固 + Schema 隔离 + Celery + S3 | 安全基线通过、备份真实可用 |
| 阶段二 | 第3-4周 | UI 一致性 + 消除技术债 + 包优化 | 视觉统一、`::ng-deep` 清零、Lighthouse P>=80 |
| 阶段三 | 第5-7周 | AI 助教 + Token 充值 + 许可证 + 备份看板 + WS | 全功能集成测试通过 |
| 阶段四 | 第8-9周 | WCAG AA + PWA + 移动端适配 | 可访问性达标、五断点适配通过 |
| 阶段五 | 第10周 | SSL + Docker + 端到端验收 | 生产就绪、自动化验收全绿 |

**总计**: 10 周（2.5 个月）

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| Schema 隔离迁移复杂（27个路由文件） | 双模式（行级 + Schema）并行，验证后切换 |
| LLM API 成本不可控 | Token 配额硬上限 + 每日告警 + 请求排队 |
| `::ng-deep` 替换引发样式回归 | 阶段二前建立 Chromatic 基线快照 |
| Celery 增加运维复杂度 | Docker Compose 统一编排，开发用单进程模式 |
| PWA 离线数据冲突 | 仅缓存只读数据，写操作强制在线 |
