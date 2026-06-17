# OpenMT 云托管版 - 产品需求规格说明书（PRD）

**版本**: v1.1  
**日期**: 2026-06-17  
**状态**: 📋 需求定义完成 + 实现状态审计  
**产品定位**: 项目核心交付产品（P0 优先级）

> **文档说明**: 本文档采用「两层分离」结构——每个功能模块均标注 **✅ 当前实现状态** 和 **🎯 规划目标** 两层描述，以明确区分已完成实现与待交付需求。

---

## 1. 文档概述

### 1.1 产品愿景

OpenMT 云托管版是专为 STEM 教育机构打造的 SaaS 管理平台，面向不具备 IT 运维能力但希望专注于教学业务的培训机构、K12 学校及职业学校，提供**免运维、高可用、智能化**的一站式教育管理解决方案。

### 1.2 目标用户

| 用户角色 | 典型画像 | 核心诉求 |
|---------|---------|---------|
| **培训机构负责人** | 星海机器人培训中心校长，管理 3 个校区、300+ 学员 | 营收增长、学员续费、设备资产管控 |
| **K12 教务主任** | XX 实验小学科创中心负责人，全校 1250 名学生 | 排课效率、家校沟通、学生成果展示 |
| **职业学校管理员** | 梅山县职业技术学校实训主任，856 名在训学生 | 实训安全、技能认证、就业对接 |
| **教育局监管者** | 梅山县教育局 STEM 教育管理部门 | 区域均衡、安全监管、资源调配 |
| **授课教师** | Arduino 专家、Python 导师、机器人教练 | 课堂反馈、学员评价、课时统计 |
| **家长/学员** | K12 学生家长 | 查看学习进度、课堂反馈、续费报名 |

### 1.3 核心价值主张

1. **开箱即用**: 注册即可使用，无需服务器、数据库、运维团队
2. **STEM 专属**: 硬件设备管理、实验项目管理、Token 计费、创客空间调度等差异化功能
3. **数据安全**: 企业级 SSL/TLS 加密、多租户物理隔离、符合教育行业合规标准
4. **智能驱动**: 云端大模型赋能的 AI 助教、智能排课、学情分析
5. **多端同步**: Web/平板/手机端数据秒级同步，随时随地管理

### 1.4 与开源社区版的关系

云托管版是在开源社区版基础上的**增值服务层**，二者共享同一套代码基座，通过许可证（License）和功能开关（Feature Flag）实现差异化控制。

> **实现状态**: ✅ 许可证体系和功能开关已在后端完整实现（`LicenseType` 枚举含 7 种类型、`TenantFeatureFlag` 模型和 `TenantInitService` 均已落地）；前端 Angular 路由守卫尚未实现。

---

## 2. 功能特性详细说明

### 2.1 基础管理功能（两版本共有）

以下功能在开源社区版和云托管版中均可使用：

| 功能模块 | 说明 | 涉及 API |
|---------|------|---------|
| **硬件设备管理** | Arduino/Raspberry Pi/传感器等设备的入库、借用、状态跟踪、维护记录 | `/api/v1/hardware/*` |
| **Token 计费系统** | 基于 AI 调用量的 Token 消耗统计与账单生成 | `/api/v1/token/*` |
| **创客空间预约** | 实验室、教室的时段预约与冲突检测 | `/api/v1/space/*` |
| **学员管理** | 学员档案、课时追踪、续费提醒 | `/api/v1/students/*` |
| **智能排课** | 课程表管理、教室调度、冲突检测 | `/api/v1/schedules/*` |
| **项目管理** | STEM 项目全生命周期管理 | `/api/v1/projects/*` |
| **竞赛认证** | 白名单赛事报名、等级考试、获奖管理 | `/api/v1/competitions/*` |
| **教学资源库** | 课件、代码、视频等教学资源共享 | `/api/v1/resources/*` |
| **营销中心** | 拼团活动、优惠券、招生推广工具 | `/api/v1/marketing/*` |
| **财务结算** | 课时费结算、教师工资、营收分析 | `/api/v1/finance/*` |
| **消息中心** | 审批提醒、续费预警、活动通知 | `/api/v1/notifications/*` |

### 2.2 云托管专属功能

以下功能仅在云托管版（LicenseType: `CLOUD_HOSTED`）中开启：

#### 2.2.1 云端自动备份（Auto Backup）

**功能概述**: 为机构数据提供全自动、零运维的备份保护，确保数据安全不丢失。

**✅ 当前实现状态**:
- 备份数据模型已建立（`BackupSnapshot` / `RestoreOperation`，见 `backend/models/backup.py`）
- 备份服务已实现（`CloudBackupService`，见 `backend/services/cloud_backup_service.py`）
- RESTful API 已注册（`/api/v1/cloud/backup/*`，见 `backend/routes/cloud_backup_routes.py`）
- 保留策略已实现：每日增量 30 天 + 每周全量 12 周（`DAILY_RETENTION_DAYS=30`, `WEEKLY_RETENTION_WEEKS=12`）
- 回滚前自动创建安全快照已实现
- 过期快照清理逻辑已实现
- **未实现**: 定时调度（Celery Beat）、实际 S3/MinIO 上传（当前为模拟）、每月备份恢复演练、备份成功/失败通知推送

**🎯 规划目标（待实现）**:

| 需求项 | 规格说明 |
|-------|---------|
| **备份频率** | 每日凌晨 02:00（UTC+8）自动执行增量备份 |
| **全量备份** | 每周日凌晨 03:00 执行一次全量备份 |
| **快照保留** | 保留最近 30 天的每日快照 + 最近 12 周的每周快照 |
| **备份范围** | 机构配置、学员数据、课程数据、项目数据、财务记录、教学资源元数据 |
| **备份存储** | 云端对象存储（S3/MinIO），异地容灾 |
| **恢复方式** | 一键回滚至任意历史时间点（精确到每日快照） |
| **恢复时间** | 全量恢复 ≤ 30 分钟，增量恢复 ≤ 10 分钟 |
| **备份通知** | 备份成功/失败均推送通知至管理员邮箱/站内信 | 🎯 待实现 |
| **备份验证** | 每月自动执行一次备份恢复演练，验证数据完整性 | 🎯 待实现 |

**用户操作界面**:
- 备份状态看板：显示最近备份时间、下次备份计划、备份存储空间使用量
- 历史快照列表：按时间倒序显示所有可用快照，支持按日期筛选
- 一键回滚按钮：选择目标快照 → 确认弹窗 → 执行恢复 → 进度条 → 完成通知
- 手动备份：管理员可随时触发一次即时备份

**业务规则**:
- 回滚操作需超级管理员或机构管理员确认
- 回滚前自动创建当前状态的"安全快照"，防止回滚后数据丢失
- 回滚操作记录审计日志，包含操作人、时间、目标快照信息

#### 2.2.2 高级 AI 助教（Advanced AI Assistant）

**功能概述**: 集成云端大模型，为教师和管理员提供智能化教学辅助和运营决策支持。

**✅ 当前实现状态**:
- AI 助教服务已实现（`AIAssistantService`，见 `backend/services/ai_assistant_service.py`）
- RESTful API 已注册（`/api/v1/ai/*`，见 `backend/routes/ai_assistant_routes.py`）
- 三大子功能均已实现：智能排课（约束满足 + 贪心优化）、学情分析（雷达图 + 流失预警）、代码审查（Python/C/C++/Arduino/JavaScript）
- Token 消耗计费已集成（排课 1000、学情 300、代码审查 350 Token/次）
- **未实现**: 遗传算法优化排课、接入真实大模型 API、班级整体学情报告、Token 套餐购买

**🎯 规划目标（待实现）**:

**子功能 1: 智能排课建议**

| 需求项 | 规格说明 |
|-------|---------|
| **输入** | 教师列表、教室列表、课程列表、时间约束、历史排课数据 |
| **输出** | 最优排课方案（冲突最少、负载均衡、教室利用率最高） |
| **算法** | 约束满足 + 贪心优化（✅ 已实现）；规划升级为约束满足 + 遗传算法的多目标优化（🎯 待实现） |
| **交互** | 生成方案后，支持手动微调，AI 实时检测冲突并给出替代建议 |
| **Token 消耗** | 每次排课建议约消耗 500-2000 Token（取决于课程规模） |

**子功能 2: 学生学情分析**

| 需求项 | 规格说明 |
|-------|---------|
| **分析维度** | 出勤率、课时消耗速度、项目完成率、竞赛获奖、能力评估 |
| **输出格式** | 个人学情报告（雷达图 + 趋势图 + 文字建议） |
| **预警机制** | 识别"即将流失"学员（出勤率骤降/课时消耗停滞），推送预警 |
| **群体分析** | 班级整体学情报告、教师教学质量对比分析 |
| **Token 消耗** | 每份个人报告约 300 Token，班级报告约 800 Token |

**子功能 3: 代码自动审查**

| 需求项 | 规格说明 |
|-------|---------|
| **支持语言** | Python、C/C++（Arduino）、JavaScript、Scratch 伪代码 |
| **审查内容** | 语法错误、逻辑漏洞、代码风格、性能建议、安全提醒 |
| **评分体系** | 代码正确性（40%）+ 代码风格（20%）+ 逻辑结构（20%）+ 创新性（20%） |
| **反馈格式** | 逐行注释 + 总结评语 + 改进建议 |
| **Token 消耗** | 每次审查约 200-500 Token（取决于代码长度） |

**AI Token 额度**:
- 云托管版每月赠送 10,000 Token
- 超出部分按 ¥0.01/Token 计费
- 可通过 Token 中心购买额外套餐

#### 2.2.3 多租户物理隔离

**功能概述**: 确保不同机构的数据在物理层面完全隔离，杜绝数据泄露风险。

**✅ 当前实现状态**（行级过滤模式）:
- 多租户隔离中间件已实现（`TenantIsolationMiddleware`，见 `backend/middleware/tenant_isolation.py`）
- 从 JWT Token 提取 `org_id` 注入 `request.state`，路由层通过 `filter(Model.org_id == org_id)` 做行级过滤
- 所有业务路由均使用 `require_org_context` 依赖强制校验组织上下文
- 审计日志中间件记录所有请求的 org_id/user_id/IP
- **未实现**: PostgreSQL Schema 级隔离、Redis Key 前缀隔离、S3/MinIO Bucket 级隔离

**🎯 规划目标（待实现）—— Schema 级隔离**:

**隔离策略**:

| 层级 | 隔离方式 | 说明 |
|------|---------|------|
| **数据库层** | Schema 级隔离 | 每个机构分配独立的 PostgreSQL Schema，表结构相同但数据完全隔离 | 🎯 待实现（当前为行级 org_id 过滤） |
| **缓存层** | Key 前缀隔离 | Redis Key 格式为 `{org_id}:{module}:{key}`，确保缓存数据不交叉 | 🎯 待实现 |
| **文件存储** | Bucket 级隔离 | 每个机构在 S3/MinIO 中拥有独立的存储桶前缀 | 🎯 待实现 |
| **API 层** | 租户中间件 | 所有 API 请求自动注入 `org_id` 过滤，中间件层面强制执行 | ✅ 已实现 |

**技术实现**:
```python
# 多租户隔离中间件 (backend/middleware/tenant_isolation.py)
# 所有查询自动附加 org_id 过滤条件
# 数据库行级权限控制（RLS）
# 缓存 key 包含 org_id 前缀
```

**安全验证**:
- 用户只能访问所属机构的数据，跨机构访问返回 403
- 管理员审计日志记录所有数据访问行为
- 定期进行渗透测试验证隔离有效性

#### 2.2.4 企业级安全防护

**✅ 当前实现状态**:
- JWT Token + Refresh Token 双 Token 认证已实现（`auth_routes.py`）
- RBAC 角色权限 + 数据级隔离已实现（`UserOrganization` + `require_org_context`）
- 速率限制中间件已实现（`RateLimitMiddleware`）
- 审计日志中间件已实现（`AuditMiddleware`，记录至 `logs/audit.log`）
- HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy 安全响应头已配置（`main.py`）
- Demo 模式只读中间件已实现（`DemoReadOnlyMiddleware`）
- **未实现**: SSL/TLS 证书自动签发（Let's Encrypt）、敏感字段 AES-256 加密存储、XSS CSP Header、数据脱敏显示

**🎯 规划目标（待实现）**:

**安全体系**:

| 安全维度 | 实现方案 | 合规要求 |
|---------|---------|---------|
| **传输加密** | 全站强制 HTTPS（TLS 1.2+），HSTS 启用 | 教育行业数据传输标准 |
| **数据加密** | 敏感字段（手机号、身份证）AES-256 加密存储 | 个人信息保护法 |
| **认证机制** | JWT Token + Refresh Token 双 Token 机制 | OWASP 认证最佳实践 |
| **权限模型** | RBAC 角色权限 + 数据级隔离 | 最小权限原则 |
| **审计日志** | 所有关键操作记录审计日志（操作人、时间、IP、结果） | 可追溯性要求 |
| **速率限制** | 普通接口 100 次/分钟/IP，敏感接口 10 次/分钟/IP | 防 DDoS 和暴力破解 |
| **SQL 注入防护** | ORM 参数化查询，禁止原生 SQL 拼接 | OWASP Top 10 |
| **XSS 防护** | 前端输入过滤 + CSP Header 配置 | OWASP Top 10 |
| **数据脱敏** | 手机号显示为 `138****5678`，身份证号部分隐藏 | 个人信息保护法 |

**SSL/TLS 证书管理**:
- 使用 Let's Encrypt 自动签发和续期
- 证书到期前 30 天自动续期
- 证书状态监控看板

### 2.3 多端实时同步

**功能概述**: 云托管版数据在 Web、平板、手机端秒级同步。

**✅ 当前实现状态**:
- WebSocket 实时推送服务已实现（`ConnectionManager`，见 `backend/services/websocket_service.py`）
- WebSocket 端点已注册（`/api/v1/ws/connect`，见 `backend/routes/websocket_routes.py`）
- 支持按 `org_id` 分组广播、指定用户推送、连接统计
- 支持事件类型：排课变更、学员签到、续费预警、系统公告、备份完成、支付确认
- 前端响应式布局已通过 Angular Material 支持（桌面 1280px+ / 平板 768-1024px / 移动 <768px）
- **未实现**: PWA 离线支持、30s 轮询准实时数据、移动端离线缓存自动同步

**🎯 规划目标（待实现）**:

**同步机制**:
- **实时数据**（WebSocket 推送）：在训人数、在线教室、未读消息
- **准实时数据**（30s 轮询）：营收统计、消课率、设备使用率
- **离线支持**：移动端支持离线查看缓存数据，联网后自动同步

**支持终端**:
| 终端 | 技术方案 | 适配说明 |
|------|---------|---------|
| Web 浏览器 | Angular SPA | 1280px+ 桌面布局 |
| 平板 (iPad/Android) | Angular 响应式 | 768-1024px 平板布局 |
| 手机 | Angular 响应式 / PWA | <768px 移动布局 |

---

## 3. 技术实现规格

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    CDN / 负载均衡                      │
├─────────────────────────────────────────────────────┤
│                   前端层 (Angular)                     │
│   marketing-site (Next.js)  |  管理后台 (Angular 17)  │
├─────────────────────────────────────────────────────┤
│                  API 网关层 (Nginx)                    │
├─────────────────────────────────────────────────────┤
│                后端层 (FastAPI + Uvicorn)              │
│   ┌─────────┐ ┌──────────┐ ┌───────────────────┐    │
│   │ 认证模块 │ │ 租户隔离  │ │ 云托管功能模块     │    │
│   │ JWT/RBAC│ │ 中间件   │ │ 备份/AI/同步       │    │
│   └─────────┘ └──────────┘ └───────────────────┘    │
├─────────────────────────────────────────────────────┤
│                  数据层                               │
│   PostgreSQL 15+  |  Redis 7+  |  S3/MinIO           │
│   (Schema隔离)    | (缓存隔离)  | (文件隔离)          │
└─────────────────────────────────────────────────────┘
```

### 3.2 后端初始化逻辑

当创建新机构时，`TenantInitService` 根据组织类型自动执行差异化配置：

**源文件**: `backend/services/tenant_init_service.py`

**初始化流程**:
1. **功能开关初始化**: 根据 `OrganizationType` 写入 `TenantFeatureFlag` 表
2. **业务配置初始化**: 根据 `OrganizationType` 写入 `TenantConfig` 表
3. **云托管许可证自动发放**: 创建有效期 1 年的 `CLOUD_HOSTED` 许可证

**各组织类型默认功能开关**:

| 组织类型 | 默认功能列表 |
|---------|------------|
| **培训机构 (TRAINING)** | admissions, scheduling, finance, live_streaming, courseware, promotion, report, material |
| **K12 学校 (K12)** | student_records, schedule_query, home_school_comm, grade_analysis, attendance, teacher_mgmt |
| **职业学校 (VOCATIONAL)** | training_mgmt, internship_tracking, skill_cert, enterprise_docking, equipment_mgmt |
| **教育局 (BUREAU)** | district_stats, security_alert, resource_alloc, policy_publish, school_supervision |

**各组织类型默认业务配置**:

```python
# 培训机构
{
    'currency': 'CNY',
    'default_class_capacity': 20,
    'renewal_reminder_days': 7,
    'cloud_backup_enabled': True,        # 云托管专属
    'ai_assistant_level': 'advanced'     # 云托管专属
}

# K12 学校
{
    'semester_start_month': 9,
    'max_class_size': 50,
    'grading_system': 'percentage',
    'parent_portal_access': True
}

# 职业学校
{
    'internship_duration_months': 6,
    'certification_required': True,
    'enterprise_sync': True
}

# 教育局
{
    'reporting_frequency': 'monthly',
    'supervision_level': 'city',
    'data_visualization_dashboard': True
}
```

**自动发放许可证规格**:
- 许可证类型: `LicenseType.CLOUD_HOSTED`
- 有效期: 365 天（1 年）
- 最大用户数: 100
- 最大设备数: 50
- 包含功能: `["stem_management", "hardware_tracking", "token_billing", "ai_assistant", "auto_backup"]`
- 许可证密钥格式: `CLOUD-{12位随机十六进制}`

### 3.3 许可证体系

**许可证类型总览**:

| 类型标识 | 名称 | 定价 | 有效期 | 最大用户 | AI 功能 | 部署方式 |
|---------|------|------|--------|---------|--------|---------|
| `OPEN_SOURCE` | 开源社区版 | 免费 | 永久 | 50 | 基础版（自备 API Key） | 本地部署 |
| `WINDOWS_LOCAL` | Windows 本地版 | 免费安装 + Token 消耗 | 永久 | 50 | 基础版 | 本地安装 |
| `CLOUD_HOSTED` | 云托管版 | ¥300/年 + Token 消耗 | 按年订阅 | 100+ | 高级版（内置算力） | SaaS 云端 |
| `TRIAL` | 试用版 | 免费 | 30 天 | 20 | 高级版（限额） | SaaS 云端 |
| `COMMERCIAL` | 商业版 | 按需定制 | 按年 | 可配置 | 高级版 | 私有云/混合云 |
| `EDUCATION` | 教育版 | 按需定制 | 按年 | 可配置 | 高级版 | 本地/云端 |
| `ENTERPRISE` | 企业定制版 | 按需定制 | 按年 | 无限制 | 定制版 | 私有部署 |

**许可证状态流转**:
```
PENDING → ACTIVE → EXPIRED
                  ↘ REVOKED（违规使用）
ACTIVE → PENDING（续费等待期）
```

**许可证验证 API**:
- `POST /api/v1/licenses/validate` — 验证许可证有效性
- `POST /api/v1/licenses/activate` — 激活许可证
- `POST /api/v1/licenses/revoke` — 吊销许可证（管理员）
- `GET /api/v1/licenses/{org_id}` — 获取机构许可证信息

### 3.4 前端模块化加载

**架构**: Angular 17 + Angular Material + RxJS

**✅ 当前实现状态**:
- 云托管专属模块目录已建立：`frontend/src/app/features/stem-cloud/`
- 已实现 4 个组件：
  - `hardware-management.component.ts` — 硬件设备管理
  - `token-management.component.ts` — Token 计费管理
  - `space-scheduling.component.ts` — 创客空间调度
  - `project-management.component.ts` — 项目管理（PRD v1.0 未记录，实际已实现）
- **未实现**: Angular 路由守卫（检查许可证类型和功能开关动态加载模块）

**🎯 规划目标**:

**模块化策略**:
- 云托管版特有 UI 组件位于 Angular 项目的独立模块中
- 通过路由守卫（Route Guard）控制访问权限
- 根据许可证类型和功能开关动态加载对应模块

**路由守卫逻辑**:
```typescript
// 检查用户许可证是否支持云托管功能
canActivate(): boolean {
  const license = this.authService.getCurrentLicense();
  return license.license_type === 'cloud_hosted' 
      && license.status === 'active'
      && !license.is_expired;
}
```

**云托管专属模块路径**: `frontend/src/app/features/stem-cloud/`
- `hardware-management.component.ts` — 硬件设备管理（✅ 已实现）
- `token-management.component.ts` — Token 计费管理（✅ 已实现）
- `space-scheduling.component.ts` — 创客空间调度（✅ 已实现）
- `project-management.component.ts` — 项目管理（✅ 已实现，v1.0 未记录）

### 3.5 后端技术栈

| 组件 | 技术选型 | 版本要求 |
|------|---------|---------|
| Web 框架 | FastAPI | 0.100+ |
| ORM | SQLAlchemy | 2.0+ |
| 数据库 | PostgreSQL | 15+ |
| 缓存 | Redis | 7+ |
| 任务队列 | Celery | 5.3+ |
| 文件存储 | MinIO / AWS S3 | 最新版 |
| ASGI 服务器 | Uvicorn | 0.23+ |

### 3.6 前端技术栈

| 组件 | 技术选型 | 版本要求 |
|------|---------|---------|
| 管理后台框架 | Angular | 17+ |
| UI 组件库 | Angular Material | 17+ |
| 状态管理 | NgRx（可选） | 17+ |
| 响应式编程 | RxJS | 7+ |
| 营销站点 | Next.js (App Router) | 14+ |
| 营销站 UI | TailwindCSS + shadcn/ui | 最新版 |

---

## 4. 版本对比说明

### 4.1 核心定位对比

| 维度 | 开源社区版 | 云托管版 |
|------|-----------|---------|
| **部署方式** | 本地化部署（Windows/Linux） | SaaS 云端托管 |
| **维护成本** | 需自行维护服务器、数据库及备份 | 零运维，官方统一维护 |
| **适用对象** | 具备 IT 运维能力的机构或个人开发者 | 专注于教学业务的 STEM 培训机构、K12 学校 |
| **数据同步** | 单点存储，不支持跨设备实时同步 | 多端实时同步（Web/App/Pad） |
| **数据存储** | SQLite（本地）/ PostgreSQL（自建） | PostgreSQL（云端托管，Schema 隔离） |

### 4.2 功能差异对比表

| 功能特性 | 开源社区版 | 云托管版 |
|---------|-----------|---------|
| 硬件设备管理 | ✅ | ✅ |
| Token 计费系统 | ✅ | ✅ |
| 创客空间预约 | ✅ | ✅ |
| 学员管理 | ✅ | ✅ |
| 智能排课 | ✅ | ✅ |
| 项目管理 | ✅ | ✅ |
| 竞赛认证 | ✅ | ✅ |
| 教学资源库 | ✅ | ✅ |
| 营销中心 | ✅ | ✅ |
| 财务结算 | ✅ | ✅ |
| 消息中心 | ✅ | ✅ |
| **云端自动备份** | ❌ | ✅ 每日增量 + 30 天快照 |
| **高级 AI 助教** | 基础版（自备 API Key） | 高级版（内置算力，月赠 10,000 Token） |
| **多端实时同步** | ❌ | ✅ WebSocket + PWA |
| **多租户物理隔离** | ❌（单租户） | ✅ Schema 级隔离 |
| **企业级安全防护** | 基础（HTTPS 自理） | ✅ SSL/TLS + HSTS + WAF |
| **审计日志** | 基础 | ✅ 完整操作审计 + 追溯 |
| **优先技术支持** | 社区论坛 | ✅ 工单 + 在线客服 |
| **自动升级** | ❌（手动更新） | ✅ 无感热更新 |

### 4.3 许可证详细对比

| 属性 | 开源社区版 | 云托管版 |
|------|-----------|---------|
| **类型标识** | `OPEN_SOURCE` / `WINDOWS_LOCAL` | `CLOUD_HOSTED` |
| **有效期** | 永久 | 按年订阅（默认赠送 1 年试用） |
| **最大用户数** | ≤ 50 | 默认 100+，可扩展 |
| **最大设备数** | ≤ 10 | 默认 50+，可扩展 |
| **AI Token 月额度** | 0（自备 API Key） | 10,000 Token/月 |
| **备份保留天数** | 无 | 30 天每日 + 12 周每周 |
| **存储空间** | 本地磁盘 | 云端 10GB 起步 |
| **SLA 保障** | 无 | 99.5% 可用性 |
| **技术支持** | GitHub Issues | 工单系统 + 在线客服 |

---

## 5. 部署与运营要求

### 5.1 系统要求（云托管服务端）

**服务器配置（单节点最低配置）**:
| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 4 核 | 8 核 |
| 内存 | 8 GB | 16 GB |
| 系统盘 | 100 GB SSD | 200 GB SSD |
| 数据盘 | 200 GB SSD | 500 GB SSD |
| 网络带宽 | 10 Mbps | 50 Mbps |

**软件依赖**:
| 软件 | 版本 | 用途 |
|------|------|------|
| Python | 3.9+ | 后端运行时 |
| Node.js | 18+ | 前端构建 |
| PostgreSQL | 15+ | 主数据库 |
| Redis | 7+ | 缓存和会话管理 |
| Nginx | 1.24+ | 反向代理和负载均衡 |
| Docker | 24+ | 容器化部署 |
| Docker Compose | 2.20+ | 服务编排 |

**浏览器兼容性（客户端）**:
| 浏览器 | 最低版本 |
|--------|---------|
| Google Chrome | 90+ |
| Microsoft Edge | 90+ |
| Safari (macOS/iOS) | 14+ |
| Firefox | 90+ |

**移动端支持**:
| 平台 | 最低版本 |
|------|---------|
| iOS Safari | 14+ |
| Android Chrome | 90+ |

### 5.2 云服务注册流程

**用户获取路径**:

```
营销站点 (marketing-site)
    ├── 首页 Hero CTA → "立即免费试用"
    ├── 功能特性页 → "免费体验"  
    ├── 云托管对比页 → "立即注册"
    └── Demo 入口页 → 体验后转化
         │
         ▼
注册页面 (/demo/create-org)
    ├── Step 1: 选择组织类型（培训机构/K12/职业学校/教育局）
    ├── Step 2: 填写机构信息（名称、联系人、邮箱、电话）
    ├── Step 3: 创建管理员账号（用户名、密码）
    ├── Step 4: 邮箱验证（发送验证链接）
    └── Step 5: 自动初始化租户 + 发放试用许可证
         │
         ▼
进入管理后台 (Angular 应用)
    ├── 交互式引导 (Tour)
    ├── 预置 Demo 数据供体验
    └── 30 天免费试用期
```

**注册 API**:
```
POST /api/v1/organizations/create
{
    "name": "星海机器人培训中心",
    "contact_email": "admin@example.com",
    "phone": "13812345678",
    "org_type": "training_institution",
    "max_users": 100
}
```

> **注意**: 实际 API 路径为 `/api/v1/organizations/create`（见 `backend/routes/org_creation_routes.py`），而非 v1.0 记录的 `/api/v1/org-creation/create`。

**注册后自动执行**（✅ 已实现）:
1. ✅ 创建 Organization 记录
2. ✅ 调用 `TenantInitService.initialize_tenant()` 初始化功能开关和业务配置
3. ✅ 自动发放 `CLOUD_HOSTED` 许可证（有效期 365 天）
4. 🎯 发送欢迎邮件（包含登录链接和快速开始指南）—— **待实现**
5. ✅ 创建管理员用户账号（通过 `UserOrganization` 关联）

### 5.3 许可证管理与订阅机制

**订阅生命周期**:

```
注册 → 免费试用(30天) → 付费订阅(年费¥300) → 续费/升级
                  ↘ 试用到期 → 降级为只读 → 续费恢复
```

**续费提醒策略**:
| 时间节点 | 提醒方式 |
|---------|---------|
| 到期前 30 天 | 站内通知 + 邮件提醒 |
| 到期前 7 天 | 每日站内弹窗 + 邮件 |
| 到期前 1 天 | 紧急通知 + 短信提醒 |
| 到期当天 | 功能降级为只读模式 |
| 到期后 30 天 | 数据保留，不可访问 |
| 到期后 90 天 | 数据归档，可申请导出 |
| 到期后 180 天 | 数据永久删除 |

**升级路径**:
- 云托管版 → 商业版：联系销售团队，定制功能
- 开源社区版 → 云托管版：注册云服务账号，数据迁移工具辅助导入
- Token 套餐升级：Token 中心内直接购买（5000/10000/20000 点档位）

---

## 6. 非功能性需求

### 6.1 性能要求

| 指标 | 目标值 |
|------|--------|
| 页面首屏加载时间 | < 2 秒 |
| API 平均响应时间 | < 500ms |
| API P99 响应时间 | < 2 秒 |
| 并发用户数支持 | ≥ 500 |
| 数据库查询响应 | < 200ms |
| WebSocket 消息延迟 | < 100ms |

### 6.2 可用性要求

| 指标 | 目标值 |
|------|--------|
| 系统可用性 (SLA) | ≥ 99.5%（月度） |
| 计划内维护窗口 | 每月 1 次，凌晨 02:00-04:00 |
| 故障恢复时间 (RTO) | ≤ 4 小时 |
| 数据恢复点 (RPO) | ≤ 24 小时 |

### 6.3 可扩展性

| 指标 | 目标值 |
|------|--------|
| 支持机构数量 | 1000+ 机构 |
| 单机构学员数 | 10,000+ |
| 总数据量 | TB 级 |
| 水平扩展 | 支持通过增加应用服务器实例扩展 |

### 6.4 安全合规

| 合规项 | 要求 |
|-------|------|
| 个人信息保护法 | 敏感数据加密存储，用户有权删除个人数据 |
| 教育行业数据安全 | 学生数据不出境，符合教育部信息化安全规范 |
| OWASP Top 10 | 防止 SQL 注入、XSS、CSRF 等常见漏洞 |
| 审计合规 | 关键操作审计日志保留 ≥ 1 年 |

---

## 7. 用户角色与权限矩阵

| 功能模块 | 超级管理员 | 机构负责人 | 教务主管 | 授课教师 | 招生顾问 | 家长 |
|---------|-----------|-----------|---------|---------|---------|------|
| 系统设置 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 机构概览 | ✅ | ✅ | ✅ | 仅自己 | 仅自己 | ❌ |
| 学员管理 | ✅ | ✅ | ✅ | 仅教学班 | ❌ | 仅自己孩子 |
| 招生线索 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 智能排课 | ✅ | ✅ | ✅ | 查看自己 | ❌ | ❌ |
| 设备管理 | ✅ | ✅ | ✅ | 借用 | ❌ | ❌ |
| 项目管理 | ✅ | ✅ | ✅ | ✅ | ❌ | 查看 |
| 财务结算 | ✅ | ✅ | 查看 | 查看自己 | ❌ | ❌ |
| Token 管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 营销中心 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 消息中心 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 云端备份 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI 助教 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 8. 交付里程碑

### Phase 1: 基础平台（第 1-4 周）

| 任务 | 交付物 |
|------|--------|
| 多租户框架搭建 | Schema 隔离中间件、租户初始化服务 |
| 许可证系统完善 | CLOUD_HOSTED 许可证类型、自动发放、验证 API |
| 用户注册流程 | 注册页面、邮箱验证、自动初始化 |
| 基础安全防护 | HTTPS 强制、JWT 认证、速率限制 |

### Phase 2: 核心功能（第 5-8 周）

| 任务 | 交付物 |
|------|--------|
| 云端自动备份 | 备份服务、快照管理、一键回滚 |
| 高级 AI 助教 | 智能排课、学情分析、代码审查 |
| 多端同步 | WebSocket 推送、PWA 支持 |
| 培训机构驾驶舱 | 完整 Dashboard 及功能模块 |

### Phase 3: 扩展功能（第 9-12 周）

| 任务 | 交付物 |
|------|--------|
| K12 学校驾驶舱 | 家校互动、作品展示、成长档案 |
| 职业学校驾驶舱 | 实训管理、安全监控、企业对接 |
| 教育局驾驶舱 | 辖区统计、资源调配、质量监测 |
| 营销站点 | Next.js 官网、Demo 入口、功能详情页 |

### Phase 4: 上线与运营（第 13-14 周）

| 任务 | 交付物 |
|------|--------|
| 性能优化 | Lighthouse 90+、API < 500ms |
| 安全审计 | 渗透测试报告、漏洞修复 |
| 数据迁移工具 | 开源社区版 → 云托管版数据导入 |
| 上线发布 | 生产部署、监控告警、客服系统 |

---

## 9. 关键 API 接口清单

> 以下路径均基于实际代码实现（以 `backend/routes/*.py` 为准），已修正 v1.0 中的错误路径。

| 模块 | 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|------|
| 认证 | `/api/v1/auth/login` | POST | 用户登录 | ✅ |
| 认证 | `/api/v1/auth/refresh` | POST | 刷新 Token | ✅ |
| 机构 | `/api/v1/organizations/create` | POST | 创建机构（注册） | ✅ |
| 机构 | `/api/v1/org-overview/{org_id}` | GET | 获取机构概览 | ✅ |
| 租户 | `/api/v1/tenant/menu/{org_id}` | GET | 获取动态菜单 | ✅ |
| 租户 | `/api/v1/tenant/config/{org_id}` | GET | 获取组织配置 | ✅ |
| 许可证 | `/api/v1/licenses/{license_key}/validate` | POST | 验证许可证 | ✅ |
| 许可证 | `/api/v1/organizations/{org_id}/licenses` | GET | 获取机构许可证 | ✅ |
| 许可证 | `/api/v1/licenses/{license_key}/revoke` | POST | 撤销许可证 | ✅ |
| 许可证 | `/api/v1/licenses/activate` | POST | 激活许可证 | 🎯 待实现 |
| 备份 | `/api/v1/cloud/backup/status` | GET | 获取备份状态概览 | ✅ |
| 备份 | `/api/v1/cloud/backup/list` | GET | 获取备份快照列表 | ✅ |
| 备份 | `/api/v1/cloud/backup/create` | POST | 手动创建备份 | ✅ |
| 备份 | `/api/v1/cloud/backup/restore` | POST | 一键回滚 | ✅ |
| AI | `/api/v1/ai/scheduling/suggest` | POST | 智能排课建议 | ✅ |
| AI | `/api/v1/ai/student/analyze` | POST | 学情分析报告 | ✅ |
| AI | `/api/v1/ai/code/review` | POST | 代码自动审查 | ✅ |
| AI | `/api/v1/ai/token-balance` | GET | AI Token 余额查询 | ✅ |
| 学员 | `/api/v1/students` | GET/POST | 学员列表/创建 | ✅ |
| 排课 | `/api/v1/schedules` | GET/POST | 课表查询/创建 | ✅ |
| 项目 | `/api/v1/projects` | GET/POST | 项目列表/创建 | ✅ |
| Token | `/api/v1/token/balance` | GET | Token 余额查询 | ✅ |
| Token | `/api/v1/token/recharge` | POST | Token 充值 | 🎯 待实现 |
| WebSocket | `/api/v1/ws/connect` | WS | 实时推送连接 | ✅ |
| WebSocket | `/api/v1/ws/stats` | GET | 连接统计 | ✅ |
| WebSocket | `/api/v1/ws/broadcast` | POST | 发送系统公告 | ✅ |

---

## 10. 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| 云端服务宕机 | 低 | 高 | 多可用区部署 + 自动故障转移 |
| 数据泄露 | 低 | 极高 | Schema 隔离 + 加密 + 审计 + 渗透测试 |
| AI 服务不可用 | 中 | 中 | 降级为基础版 + 缓存常用建议 |
| 备份恢复失败 | 低 | 高 | 定期恢复演练 + 异地容灾 |
| 并发用户激增 | 中 | 中 | 自动扩缩容 + 速率限制 |
| 用户流失（不续费） | 中 | 高 | 试用期内主动跟进 + 功能价值展示 |

---

## 11. 成功指标（KPI）

### 上线后 3 个月
| 指标 | 目标值 |
|------|--------|
| 注册机构数 | ≥ 50 |
| 活跃机构数 | ≥ 20 |
| 试用转付费率 | ≥ 15% |
| 系统可用性 | ≥ 99.5% |
| 用户满意度 | ≥ 4.0/5.0 |

### 上线后 6 个月
| 指标 | 目标值 |
|------|--------|
| 注册机构数 | ≥ 200 |
| 付费机构数 | ≥ 30 |
| MRR（月经常性收入） | ≥ ¥10,000 |
| 客户流失率 | ≤ 5%/月 |

---

## 附录

### A. 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 多租户 | Multi-Tenancy | 多个机构共享同一套系统实例，数据互相隔离 |
| Schema 隔离 | Schema Isolation | 在 PostgreSQL 中为每个租户创建独立的 Schema |
| 功能开关 | Feature Flag | 控制特定功能是否对用户可见的开关机制 |
| Token | Token | AI 服务等增值功能的计费单位 |
| SLA | Service Level Agreement | 服务等级协议，定义系统可用性承诺 |
| RTO | Recovery Time Objective | 故障恢复时间目标 |
| RPO | Recovery Point Objective | 数据恢复点目标 |
| PWA | Progressive Web App | 渐进式 Web 应用，支持离线和安装到桌面 |

### B. 参考文档

- [培训机构管理系统 PRD](./TRAINING_PLATFORM_PRD.md)
- [机构驾驶舱 PRD](./INSTITUTION_DASHBOARD_PRD.md)
- [云托管版 vs 社区版对比](./CLOUD_HOSTING_COMPARISON.md)
- [Demo 网站开发计划](./demo-website-plan.md)
- [数据库设计](./DATABASE_SCHEMA.md)
- [API 接口规范](./API_SPECIFICATION.md)

### C. 关键源文件索引

| 文件 | 说明 | 状态 |
|------|------|------|
| `backend/services/tenant_init_service.py` | 租户初始化服务 | ✅ 已实现 |
| `backend/models/license.py` | 许可证数据模型 | ✅ 已实现 |
| `backend/models/tenant.py` | 多租户配置与功能开关模型 | ✅ 已实现 |
| `backend/models/backup.py` | 云端备份数据模型 | ✅ 已实现 |
| `backend/middleware/tenant_isolation.py` | 多租户隔离中间件 | ✅ 已实现 |
| `backend/middleware/auth_middleware.py` | 认证授权中间件 | ✅ 已实现 |
| `backend/middleware/audit_middleware.py` | 审计日志中间件 | ✅ 已实现 |
| `backend/middleware/rate_limit_middleware.py` | 速率限制中间件 | ✅ 已实现 |
| `backend/middleware/demo_readonly.py` | Demo 只读中间件 | ✅ 已实现 |
| `backend/config/license_config.py` | 许可证配置 | ✅ 已实现 |
| `backend/services/license_service.py` | 许可证业务逻辑 | ✅ 已实现 |
| `backend/services/cloud_backup_service.py` | 云端备份服务 | ✅ 已实现 |
| `backend/services/ai_assistant_service.py` | AI 助教服务 | ✅ 已实现 |
| `backend/services/websocket_service.py` | WebSocket 实时推送服务 | ✅ 已实现 |
| `backend/services/email_verification_service.py` | 邮箱验证服务 | ✅ 已实现 |
| `backend/routes/cloud_backup_routes.py` | 云端备份 API 路由 | ✅ 已实现 |
| `backend/routes/ai_assistant_routes.py` | AI 助教 API 路由 | ✅ 已实现 |
| `backend/routes/websocket_routes.py` | WebSocket API 路由 | ✅ 已实现 |
| `backend/routes/org_creation_routes.py` | 组织创建 API 路由 | ✅ 已实现 |
| `frontend/src/app/features/stem-cloud/` | 云托管专属 Angular 组件目录 | ✅ 已实现 |
| `marketing-site/app/features/cloud-hosting/page.tsx` | 云托管功能展示页 | ✅ 已实现 |
| `marketing-site/app/demo/create-org/page.tsx` | 创建机构/注册页 | ✅ 已实现 |

### D. 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-06-15 | 初始版本，完成云托管版完整需求定义 | Product Team |
| v1.1 | 2026-06-17 | 全面审计实现状态与文档一致性：修正 API 路径（org-creation → organizations、ai/scheduling-suggest → ai/scheduling/suggest 等）；新增 EDUCATION 许可证类型；新增 project-management 组件；采用「两层分离」描述结构（✅ 当前实现 / 🎯 规划目标）；标注多租户隔离实际为行级过滤（非 Schema 级）；标注备份/AI/同步等模块的具体实现状态；新增 WebSocket API 接口 | Product Team |

---

**文档状态**: ✅ 需求定义完成 + 实现状态审计（v1.1）  
**下一步**: 🎯 待实现功能开发（Schema 级隔离、PWA、备份定时调度、欢迎邮件、路由守卫等）  
**产品负责人**: 项目经理
