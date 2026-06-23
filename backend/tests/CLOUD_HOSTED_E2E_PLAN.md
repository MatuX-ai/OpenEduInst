# OpenMT 机构管理 · 云托管版 —— 端到端验收测试计划

> **文档版本** 1.0 · 编写日期 2026-06-23 · **适用版本** Cloud 1.0.0
> **执行者** QA / 交付工程团队 · **执行环境** Staging（镜像生产配置）
>
> 本计划依据用户提出的 6 大项要求编写，并同时给出可自动化的 Python 测试脚本
> `tests/test_cloud_hosted_e2e.py` 以便 CI/CD 中回归执行。

---

## 0. 环境规范（Test Environment Specifications）

### 0.1 软件/基础设施

| 组件 | 要求 |
|---|---|
| 操作系统 | Ubuntu 22.04 / macOS 14 / Windows 11（开发机）；生产同构 |
| Python | 3.12+ |
| FastAPI | 0.110+ |
| 数据库 | PostgreSQL 16（Staging 独立 DB，不能指向生产）|
| Redis | 7+（限流 + Celery Broker/Backend，3 个 DB）|
| Celery Worker/Beat | 各 1 实例，`CELERY_ENABLED=1` |
| 邮件服务 | 测试环境设 `EMAIL_PROVIDER=log`（所有 mail 写入 `logs/emails.log`），用于断言验证邮件被正确发送 |
| 反向代理 | Nginx 1.27，生产配置，但测试可直接 `http://127.0.0.1:8000` |

### 0.2 浏览器/设备兼容性矩阵（由前端测试补齐，后端验收依赖此矩阵）

| 浏览器 | 版本 | 平台 | 优先级 |
|---|---|---|---|
| Chrome | 最新 2 个稳定版 | Windows / macOS | P0 |
| Firefox | 最新 2 个稳定版 | Windows / macOS | P1 |
| Safari | 最新版 | macOS / iOS | P1 |
| Edge Chromium | 最新版 | Windows | P1 |
| iOS Safari / Chrome Android | 最新版 | 移动 | P2 |

### 0.3 环境隔离与数据重置

1. **测试数据库**：Staging 使用独立库 `openmt_edu_staging`，且在每次回归执行前由 `scripts/reset_demo_data.py` 或等价脚本清空。
2. **测试账号**：测试脚本中使用 `e2e_test+<uuid>@openmt.example.com` 邮箱，前缀为 `e2e_test` 的一律视为测试数据，可在 `teardown` 中整体删除。
3. **Redis**：所有测试 Key 带 `e2e_test:` 前缀，teardown 调用 `FLUSHDB` 或前缀匹配 `DELETE`。
4. **隔离**：每轮测试使用新的测试组织，绝不与其他开发者共享 org_id。
5. **失败保护**：若测试脚本发现 `ENV=prod` 或 `DATABASE_URL` 指向生产库，立即 `sys.exit(2)` 并打印告警。

### 0.4 关键环境变量（在 `.env.test` 或 CI 中显式设置）

```
ENV=dev
SECRET_KEY=test-secret-key-for-unit-tests-only-1234567890
DATABASE_URL=sqlite:///./openmt_e2e_test.db   # 或者独立 PG
REDIS_URL=redis://127.0.0.1:6379/0
CELERY_ENABLED=0                              # Celery 任务用同步模式测试
EMAIL_PROVIDER=log                            # 邮件走日志降级
FRONTEND_BASE_URL=http://127.0.0.1:4200
DEMO_MODE=0
CORS_ALLOW_ORIGINS=http://127.0.0.1:4200
SEND_WELCOME_EMAIL=0                          # 测试中改由脚本显式控制
```

---

## 1. 账号注册流程（Account Registration Process）

**测试模块**：`tests/test_cloud_hosted_e2e.py::TestAccountRegistration`

### 1.1 用例矩阵

| # | 用例名称 | 操作步骤 | 预期结果 | 依赖 |
|---|---|---|---|---|
| TC-1.1 | 新机构管理员注册 | POST `/api/v1/auth/register`，提交 `username/e-mail/password/full_name` | 返回 HTTP 200，`user_id/username/email` 字段正确，密码不在响应中明文出现 | |
| TC-1.2 | 重复邮箱注册失败 | 同 TC-1.1，连续发送 2 次 | 第 1 次 200；第 2 次 4xx（409 Conflict 或 422），`detail` 字段提示"邮箱已注册" | TC-1.1 |
| TC-1.3 | 弱密码拒绝 | 使用 `password="123"` 或空密码 | 4xx，提示"密码长度不足"或等价校验失败 | |
| TC-1.4 | 非法邮箱拒绝 | `email="not-an-email"` | 4xx，提示"邮箱格式错误" | |
| TC-1.5 | 登录获取 Token | POST `/api/v1/auth/login`（OAuth2 form），`username/password` 与 TC-1.1 相同 | 200，返回 `access_token/refresh_token/token_type`；`access_token` 为合法 JWT | TC-1.1 |
| TC-1.6 | 错误密码登录失败 | 正确用户名 + 错误密码 | 401，`detail="用户名或密码错误"`；累计 5 次应触发限流（见 TC-7 安全项） | TC-1.1 |
| TC-1.7 | 邮箱验证码发送流程 | POST `/api/v1/auth/send-verification-code` | 200；且 `logs/emails.log` 或等价文件中出现对应 `verification_code`（云托管版必填）| |
| TC-1.8 | 邮箱验证码激活账号 | POST `/api/v1/auth/verify-code`（或等价端点） | 200，`verified=True`；错误验证码返回 4xx | TC-1.7 |
| TC-1.9 | 创建机构（组织注册） | 登录后 POST `/api/v1/organizations/`，提交 `name/contact_email/org_type/...` | 201 或 200，返回 `org_id`，当前用户自动成为该组织 owner | TC-1.5 |
| TC-1.10 | 机构资料完善 | PATCH `/api/v1/organizations/<org_id>`，补全 `phone/address/website/max_users` | 200，字段回读值与输入一致 | TC-1.9 |

### 1.2 通过/失败准则

- **Pass**：上述全部用例按顺序全部通过。
- **Fail**：任何一条失败（含状态码/响应字段不符合预期），立即终止后续流程。
- **可接受风险**：TC-1.7/TC-1.8 如果在项目早期未实现邮箱验证码，允许标记为 `SKIP` 并记录 TODO。

---

## 2. 成员管理功能（Member Management Functionality）

**测试模块**：`tests/test_cloud_hosted_e2e.py::TestMemberManagement`

### 2.1 角色模型与权限假设

- **owner**：机构拥有者，拥有所有权限。
- **admin**：管理员，可增删成员。
- **editor**：编辑者，可 CRUD 业务数据，但不能改成员/许可证。
- **viewer**：只读。

### 2.2 用例矩阵

| # | 用例 | 操作 | 预期结果 |
|---|---|---|---|
| TC-2.1 | 邀请 admin 角色成员 | POST `/api/v1/organizations/<org_id>/members`，`{"email":"e2e_admin@...","role":"admin"}` | 200，返回 `invite_id`；DB 中插入 `UserOrganization(role=ADMIN)` |
| TC-2.2 | 邀请 editor / viewer 角色 | 同上，改为 `editor/viewer` | 两条都成功，返回不同 `invite_id` |
| TC-2.3 | 被邀请者接受邀请 | 以被邀请者身份 POST `/api/v1/organizations/invitations/<invite_id>/accept` | 200；再次 GET `/me/organizations` 中可见新 org |
| TC-2.4 | 成员列表回读 | GET `/api/v1/organizations/<org_id>/members` | 200，包含 TC-2.1 ~ TC-2.2 的所有成员，角色字段正确 |
| TC-2.5 | 修改成员角色 | PATCH `.../members/<member_id>`，`{"role":"editor"}` | 200；再次 GET 可见角色已更新 |
| TC-2.6 | owner 不可自我降级为 viewer | 尝试将自己角色改为 viewer | 4xx / 403，字段不变 |
| TC-2.7 | viewer 尝试改角色（越权）| 使用 viewer 角色 Token 调用 PATCH | 403 Forbidden；角色不变 |
| TC-2.8 | 移除成员 | DELETE `.../members/<member_id>` | 200；GET 列表不再包含该成员；成员不再可通过原 Token 访问该 org 数据 |
| TC-2.9 | 使用不存在的 org_id 邀请 | 使用 `org_id=9999999`（不存在） | 404 |
| TC-2.10 | 邀请已存在的成员 | 对已在组织内的邮箱再次发起邀请 | 幂等：200 且不生成重复 `UserOrganization` |

### 2.3 通过/失败准则

- **Pass**：TC-2.1~TC-2.8 通过；TC-2.9/TC-2.10 预期失败路径正确拦截。
- **Fail**：任何角色权限放大、角色回读不一致、移除后仍可见。

---

## 3. 核心模块 CRUD（Feature Testing — C/R/U/D + Workflow）

> 云托管版核心模块列表由 `models/` 与 `routes/` 推断得到，**每个模块都要求独立走一遍 CRUD 闭环 + 权限验证 + 依赖校验**。
> 列表随产品迭代更新，当前版本覆盖以下模块：

### 模块清单

| 模块 | 路由前缀 | 对应模型 | 优先级 |
|---|---|---|---|
| 3.1 学员管理 | `/api/v1/students` | `Student / Enrollment / AttendanceRecord` | P0 |
| 3.2 排课管理 | `/api/v1/schedules` | `ClassSession / Schedule` | P0 |
| 3.3 设备/硬件 | `/api/v1/hardware` | `HardwareDevice / DeviceMaintenanceRecord` | P1 |
| 3.4 创客空间 | `/api/v1/spaces` | `MakerSpace / SpaceReservation` | P1 |
| 3.5 Token 包 / 用量 | `/api/v1/tokens` & `/api/v1/token-packages` | `TokenPackage / TokenOrder / TokenBalance` | P1 |
| 3.6 项目/课题 | `/api/v1/projects` | `StemProject` | P1 |
| 3.7 招生线索 | `/api/v1/leads` | `Lead` | P1 |
| 3.8 营销活动 | `/api/v1/marketing/campaigns` | `MarketingCampaign` | P2 |
| 3.9 竞赛 | `/api/v1/competitions` | `Competition` | P2 |
| 3.10 教学资源 | `/api/v1/resources` | `TeachingResource` | P2 |
| 3.11 通知 | `/api/v1/notifications` | `Notification` | P2 |
| 3.12 云端备份 | `/api/v1/cloud/backup` | `BackupSnapshot` | P0 |
| 3.13 许可证管理 | `/api/v1/licenses` | `License / LicenseActivityLog` | P0 |
| 3.14 租户功能开关 | `/api/v1/tenant/features` | `TenantFeatureFlag` | P0 |
| 3.15 AI 助教 | `/api/v1/ai-assistant` | — (无状态) | P1 |

### 3.x 通用 CRUD 用例模板（每个模块都要执行一次）

| # | 步骤 | 请求 | 预期结果 |
|---|---|---|---|
| TC-3.x.1 | Create | POST `{prefix}/` | 201/200；响应含 `id`，字段值与输入一致 |
| TC-3.x.2 | Read single | GET `{prefix}/{id}` | 200，字段与 Create 一致；敏感字段（phone/id_card/email）按 [TC-6] 脱敏 |
| TC-3.x.3 | Read list | GET `{prefix}/?page=1&page_size=10` | 200，含 `total/items`（或等价字段），长度 ≥ 1 |
| TC-3.x.4 | Update | PATCH `{prefix}/{id}`，修改 1~2 字段 | 200；回读值为新值，未修改字段不变 |
| TC-3.x.5 | Delete | DELETE `{prefix}/{id}` | 200/204；再次 GET 返回 404 |
| TC-3.x.6 | 越权（其他组织 Token） | 用 org-B 的 Token 访问 org-A 新建的 `id` | 403 / 404（必须不可见） |
| TC-3.x.7 | 空字段校验 | Create 时遗漏必填字段 | 422；`detail.errors` 中能定位到具体字段 |
| TC-3.x.8 | 依赖约束（如 FK） | 关联不存在的外键 ID 时 Create | 400/422；有可读错误信息 |

### 3.12 云端备份 · 特殊用例扩展

| # | 步骤 | 预期 |
|---|---|---|
| TC-3.12.1 | 手动创建备份 | POST `/api/v1/cloud/backup/create` | 200；`snapshot_id` 非空；`status in (completed/running)` |
| TC-3.12.2 | 列出快照 | GET `/api/v1/cloud/backup/list` | 200；列表含 TC-3.12.1 产生的 `snapshot_id` |
| TC-3.12.3 | 读取状态 | GET `/api/v1/cloud/backup/status` | 200；字段含 `total_snapshots / last_backup_at / storage_bytes` 等 |
| TC-3.12.4 | 数据完整性 - 回滚 | ① Create 一个 Student → ② 备份 → ③ Delete 该 Student → ④ POST `/api/v1/cloud/backup/restore?snapshot_id=...` | 200；回滚后 GET 该 Student id 可见（200） |
| TC-3.12.5 | 非法 snapshot 回滚 | 使用一个不存在的 `snapshot_id` | 404 |
| TC-3.12.6 | 其他组织 snapshot 不可见 | 新建 org-B，尝试 GET org-A snapshot | 404；体现多租户隔离 |

### 3.13 许可证管理 · 特殊用例扩展

| # | 步骤 | 预期 |
|---|---|---|
| TC-3.13.1 | 创建许可证（owner 角色） | POST `/api/v1/licenses` | 201；返回 `license_id` |
| TC-3.13.2 | 激活许可证 | POST `/api/v1/licenses/<id>/activate` | 200，`status=ACTIVE`；`TenantFeatureFlag` 中对应 feature 被写入/启用 |
| TC-3.13.3 | viewer 不能激活许可证 | 以 viewer 身份调用 TC-3.13.2 | 403；许可证状态不变 |
| TC-3.13.4 | features 与 FeatureFlag 联动 | 创建带 `features=["admissions","live_streaming"]` 的许可证 | GET `/api/v1/tenant/features` 返回上述 feature 均为 `enabled=True` |
| TC-3.13.5 | 续费/到期提醒（Celery 任务） | 手动调用 `send_renewal_reminders()`，预先插入 7 天内到期的 License | `logs/emails.log` 中出现 `org_name` 对应行，`renew_url` 字段存在 |

---

## 4. 测试文档与用例期望（Documented Expectations）

本章节将在 `tests/test_cloud_hosted_e2e.py` 文件顶部以 **docstring** 形式给出，并与上文保持一致。自动化脚本中：

- 每个测试用例使用 `pytest.mark.parametrize("case", [...])` 声明；
- `expected` 字段遵循统一结构：

```python
expected = {
    "status_code": 200,
    "response_fields": {"id": "truthy", "name": "exact_match"},
    "db_assert": lambda db, data: db.query(Student).filter_by(id=data["id"]).one(),
}
```

- 每条用例附带 `edge cases`：见 §3.x.7/TC-3.x.8。

### 4.1 错误处理场景清单

| 场景 | 期望 HTTP 状态 | 期望 body 关键字段 |
|---|---|---|
| 未登录访问受保护接口 | 401 | `detail = "未授权"` |
| 已登录但角色不足 | 403 | `detail = "权限不足"` |
| 资源不存在 | 404 | `detail = "未找到"` |
| 字段校验失败（非空/格式） | 422 | `detail.errors` 字段级 |
| 跨组织访问他人数据 | 403 或 404（对外"不存在"） | 敏感资源统一 404 |
| 唯一键冲突（邮箱重复） | 409 / 422 | `detail = "xxx 已存在"` |
| 超出限流（登录失败 >5 次） | 429 | `Retry-After` 或 `detail` 提示 |

---

## 5. 测试环境与隔离流程

已在 §0 中给出基础环境。以下列出脚本化隔离流程：

1. **`setup_package()`**（pytest 会话级钩子，`tests/conftest.py`）
   - 初始化 DB 表结构（SQLite 内存库或独立 staging PG）。
   - 创建 Redis 连接并清空前缀 `e2e_test:*`。
   - 初始化 `TenantInitService`，创建 2 个测试组织 `org-A / org-B`（用于跨组织隔离断言）。

2. **`@pytest.fixture(scope="function")`**
   - 每次测试自动清理 `org-A` 的相关表（通过 SQLAlchemy 级联或显式 DELETE）。

3. **`teardown` 清理**
   - 删除所有 `e2e_test+*` 前缀的用户/机构；
   - 对 `logs/emails.log` 清空（仅测试用）。

4. **CI 集成**
   - 在 GitHub Actions / GitLab CI 中增加 `pytest backend/tests/test_cloud_hosted_e2e.py -v` 步骤；
   - 失败时上传 `logs/` 与 `pytest` 日志工件。

---

## 6. 测试报告与缺陷分级（Reporting Requirements）

### 6.1 输出形式

测试脚本执行后会自动生成一份 Markdown 报告，写入 `tests/reports/cloud_hosted_e2e_<timestamp>.md`，包含：

1. **总体通过率**：`passed / (passed+failed+skipped)`
2. **各模块通过矩阵**：按 §1 ~ §3 分块列出百分比。
3. **缺陷清单**：按严重级别分级（CRITICAL / HIGH / MEDIUM / LOW）。
4. **改进建议**：由脚本根据失败类型自动建议（例如"加密字段缺失 EncryptedString"、"跨组织可见"、"限流未生效"）。

### 6.2 缺陷分级标准

| 级别 | 描述 | 示例 |
|---|---|---|
| CRITICAL | 可被未授权用户窃取他人数据 / 绕过许可 / 执行任意 SQL | org-A 的 Token 能看到 org-B 数据；JWT 可伪造 |
| HIGH | 权限越权（editor 可改成员）；核心功能 CRUD 失败；备份回滚失败 | TC-2.5/TC-3.12.4 失败 |
| MEDIUM | 字段校验不完善、响应体字段命名不一致、日志含有明文敏感数据 | TC-3.x.7 失败 |
| LOW | UI 样式、非核心文案、帮助链接错误 | 非 API 级别 |

### 6.3 准出条件（Go-Live Gate）

- CRITICAL / HIGH 缺陷必须归零；
- MEDIUM ≤ 2；
- 自动测试整体通过率 ≥ 95%；
- 安全自检 `runtime_safety_check()` 在生产环境变量下不抛异常；
- 手动冒烟（见附录 A）全量通过。

---

## 附录 A · 手动冒烟清单（作为自动化的补充）

1. 使用不同浏览器（Chrome / Firefox / Safari）按 §1 流程完成机构注册。
2. 邀请外部邮箱作为 admin，在新浏览器中登录接受邀请 → 验证成员列表同步。
3. 在一个模块（如学生管理）中创建 100 条数据，验证分页/搜索正常。
4. 手动触发备份 → 删除数据 → 回滚，验证业务不受影响。
5. 使用生产级 secret key 重启服务，调用 `runtime_safety_check()` 观察日志是否通过。

---

**本计划由交付团队在 Staging 环境每发布一次候选版本后执行一次，并归档报告到项目文档 `docs/tests/reports/` 目录。**
