# P0 修复后验收 Prompt 模板

> **使用方法**：修复完成、CI 自动部署跑完后，将【部署状态】段的占位补上，复制整段到新窗口即可。

---

## 一、背景

- **项目**：OpenMT 教育机构管理平台 jigou.matux.tech
- **修复日期**：2026-06-17
- **测试账号**：zhao_admin / demo123456（培训机构 - 星海机器人培训中心，org_id=50，user_id=159）
- **上次验收报告**：`g:\OpenMTEduInst\reports\acceptance_2026_06_17\ACCEPTANCE_REPORT.md`（验收不通过，5 个 P0）
- **上次验收基准数据**：`g:\OpenMTEduInst\reports\acceptance_2026_06_17\`（17 个 JSON 响应样本）
- **上次 Browser subagent 状态**：DevTools 协议全超时（20+ 次），0 张截图

---

## 二、修改内容

### P0-1 跨租户安全漏洞
- **根因**：`org_scoped_router` 的 `/{org_id}/overview` 路由中 `org_id` 路径参数被完全忽略，scoped 函数直接委托给 `get_org_overview()`，后者只从 JWT Token 取 org_id，未对 URL 中的 org_id 做归属校验
- **修复前**：`GET /api/v1/educational_institution/org/99999/overview` 返回 HTTP 200 + `{studentCount:3, teacherCount:0, ...}`（任意登录用户可读取其他机构数据）
- **修复后期望**：HTTP 403 或 404
- **涉及文件**：`backend/routes/educational_institution_routes.py` 第 657-665 行

### P0-2 students 路由 500
- **根因**：`org_scoped_router` 的 `/{org_id}/students` scoped 函数未传递 page/page_size 参数（或底层查询异常）
- **修复前**：HTTP 500 Internal Server Error
- **修复后期望**：HTTP 200 + `{data: {items: [...], total: N}}`
- **涉及文件**：`backend/routes/educational_institution_routes.py` 第 754-761 行（scoped）、第 338-381 行（原函数）

### P0-3 teachers 路由 500
- **根因**：同 P0-2，scoped 函数未传递参数或底层查询异常
- **修复前**：HTTP 500 Internal Server Error
- **修复后期望**：HTTP 200 + `{data: {items: [...], total: N}}`
- **涉及文件**：`backend/routes/educational_institution_routes.py` 第 734-741 行（scoped）、第 255-296 行（原函数）

### P0-4 enrollment/stats 路由 500
- **根因**：`get_enrollment_stats()` 使用 `Enrollment.is_active == True`，但 `Enrollment` 模型无 `is_active` 字段（只有 `status` 字符串字段，值为 "active"/"completed"/"cancelled"）
- **修复前**：HTTP 500 Internal Server Error
- **修复后期望**：HTTP 200 + `{data: {totalEnrollments, activeEnrollments, ...}}`
- **涉及文件**：`backend/routes/educational_institution_routes.py` 第 459-461 行；`backend/models/student.py` 第 122-157 行

### P0-5 licenses/statistics 路由 500
- **根因**：`org_overview_routes.py` 的 `get_license_statistics()` 使用 `License.org_id`，但 `License` 模型字段名是 `organization_id`；同时 `License.status == "active"` 字符串比较与 `LicenseStatus` 枚举不兼容
- **修复前**：HTTP 500 Internal Server Error
- **修复后期望**：HTTP 200 + `{total_licenses, active_licenses, expired_licenses, ...}`
- **涉及文件**：`backend/routes/org_overview_routes.py` 第 128-150 行；`backend/models/license.py` 第 186-201 行

---

## 三、部署状态（⚠️ 部署完成后补充以下占位）

- **服务器 IP**：`{{SERVER_IP}}`
- **部署方式**：CI/CD 自动部署
- **前端 dist main hash**：`{{MAIN_HASH}}`（上次为 `818029bea5bd6c2b`）
- **容器重启时间**：`{{RESTART_TIME}}`
- **部署确认方法**：
  1. `GET /api/v1/openapi.json` 返回 200（路由在线）
  2. `GET /app/` 的 index.html 中 main.*.js hash 与 CI 构建产物一致

---

## 四、验收步骤

按以下顺序执行，优先级从高到低。每层通过后再进入下一层。

### Plan A — curl 最小验证（最高优先级，约 5 分钟）

用 PowerShell 逐条执行以下命令，验证 5 个 P0 修复状态：

```powershell
# 前置：获取 token
$loginResp = Invoke-RestMethod -Uri "https://jigou.matux.tech/api/v1/auth/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "username=zhao_admin&password=demo123456&grant_type=password"
$token = $loginResp.access_token
$headers = @{ "Authorization" = "Bearer $token" }

# P0-1 跨租户（修复后应 403/404）
Invoke-WebRequest -Uri "https://jigou.matux.tech/api/v1/educational_institution/org/99999/overview" -Headers $headers -UseBasicParsing | Select-Object StatusCode

# P0-2 students（修复后应 200）
Invoke-RestMethod -Uri "https://jigou.matux.tech/api/v1/educational_institution/org/50/students" -Headers $headers | ConvertTo-Json -Depth 3

# P0-3 teachers（修复后应 200）
Invoke-RestMethod -Uri "https://jigou.matux.tech/api/v1/educational_institution/org/50/teachers" -Headers $headers | ConvertTo-Json -Depth 3

# P0-4 enrollment/stats（修复后应 200）
Invoke-RestMethod -Uri "https://jigou.matux.tech/api/v1/educational_institution/org/50/enrollment/stats" -Headers $headers | ConvertTo-Json -Depth 3

# P0-5 licenses/statistics（修复后应 200）
Invoke-RestMethod -Uri "https://jigou.matux.tech/api/v1/org/50/licenses/statistics" -Headers $headers | ConvertTo-Json -Depth 3
```

**判定标准**：
- P0-1：HTTP 状态码为 403 或 404 → PASS
- P0-2 至 P0-5：HTTP 200 + 响应结构正确 → PASS
- **5 项全部 PASS 才进入 Plan B；任何 FAIL 立即停止并报告**

### Plan B — Python 完整回归（约 10 分钟）

```powershell
cd g:\OpenMTEduInst
python scripts/acceptance_2026_06_17_post_fix.py
```

脚本覆盖：
- 登录 + 5 个 P0 目标路由验证
- org_scoped 8 路由 + org_overview 4 路由 + tenant 4 路由（全量回归）
- 跨租户 7 条路径校验（org_id=99999）
- dist hash + SCSS 残留 + SPA 路由可达性
- 结果与 `reports/acceptance_2026_06_17/` 基准数据对比

**输出**：`reports/acceptance_2026_06_17_post_fix/`（日志 + JSON + Markdown 报告）

### Plan C — Browser subagent 浏览器验收（可选，最低优先级）

> ⚠️ 上次 Browser subagent DevTools 协议全超时（20+ 次），如果本次仍不可用，直接跳过，标记 BROWSER_UNAVAILABLE。

**C-1 登录 + 硬刷新**：
1. 用 Chromium 打开 `https://jigou.matux.tech/app/login`
2. 输入 zhao_admin / demo123456 登录
3. 硬刷新（Ctrl+Shift+R）机构管理页面
4. 截图保存到 `g:\OpenMTEduInst\reports\acceptance_2026_06_17_post_fix\`

**C-2 DevTools Console/Network 检查**：
1. 打开 Console，检查是否有红色 JS 错误
2. 切到 Network，检查 API 调用是否有 500/4xx 错误
3. 截图 Console 和 Network 面板

**C-3 跨租户 PoC（前端维度）**：
在已登录的浏览器 Console 中执行：
```javascript
fetch('/api/v1/educational_institution/org/99999/overview', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
}).then(r => {
  console.log('Cross-tenant HTTP status:', r.status);
  // 修复后期望: 403 或 404
  // 修复前实际: 200（安全漏洞）
  return r.text();
}).then(d => console.log('Cross-tenant response:', d));
```

---

## 五、结果要求

### 必要条件（全部满足才算 PASS）

| 检查项 | 通过标准 |
|--------|----------|
| P0-1 跨租户 | HTTP 403 或 404（任何 200 都是 FAIL） |
| P0-2 students | HTTP 200 + `data.items` 为数组 |
| P0-3 teachers | HTTP 200 + `data.items` 为数组 |
| P0-4 enrollment/stats | HTTP 200 + `data.totalEnrollments` 存在 |
| P0-5 licenses/statistics | HTTP 200 + `total_licenses` 存在 |
| 跨租户 7 路径 | 全部 403/404（任何 200 都是安全漏洞） |
| 全量 16 路由回归 | 全部 HTTP 200 |
| dist 4 chunk | 全部 HTTP 200 可达 |
| SCSS 残留 | 无 `../../../styles/` 相对路径 |

### 输出要求

- 逐项 PASS/FAIL 表格
- 与 `reports/acceptance_2026_06_17/` 基准数据对比的差异说明
- 所有 JSON 响应保存到 `reports/acceptance_2026_06_17_post_fix/`
- 如有截图，也保存到同目录

---

## 六、备注（含降级策略）

### 降级策略

| 层级 | 触发条件 | 操作 |
|------|----------|------|
| **Plan A** | 默认首选 | curl / PowerShell 5+1 条命令，5 分钟内完成 |
| **Plan B** | Plan A 通过后 | `python scripts/acceptance_2026_06_17_post_fix.py`，10 分钟 |
| **Plan C** | A+B 均通过 + Browser 可用 | Chromium 截图 + Console + 前端 fetch PoC |
| **降级** | Browser subagent 超时 | 跳过 Plan C，标记 BROWSER_UNAVAILABLE，不影响整体验收结论 |

### 已知陷阱

1. **登录端点**：正确路径是 `POST /api/v1/auth/token`（form-encoded `username/password/grant_type=password`），不是 `/auth/login`
2. **PowerShell curl 别名**：PowerShell 中 `curl` 是 `Invoke-WebRequest` 的别名，不支持 `-H` 等 curl 参数，需使用 `Invoke-RestMethod` 或 `curl.exe`
3. **org_id 获取**：Token 中没有 org_id，需要从 `GET /api/v1/auth/me` 获取
4. **跨租户 PoC 双维度**：必须同时从后端（curl/Python）和前端（browser fetch）两个维度验证，确保修复彻底

### 参考数据

- 上次验收报告：`g:\OpenMTEduInst\reports\acceptance_2026_06_17\ACCEPTANCE_REPORT.md`
- 上次 17 个 JSON 响应：`g:\OpenMTEduInst\reports\acceptance_2026_06_17\*.json`
- 上次降级验收日志：`g:\OpenMTEduInst\reports\acceptance_2026_06_17\task4_degraded.log`
- 验收脚本源码：`g:\OpenMTEduInst\scripts\acceptance_2026_06_17_post_fix.py`
