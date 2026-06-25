# 02 - 产品需求规格 (PRD)

**文档版本**：v2.0
**最后更新**：2026-06-23

---

## 目录

1. [概述](#概述)
2. [文档结构说明](#文档结构说明)
3. [需求类型约定](#需求类型约定)
4. [模块文档清单](#模块文档清单)
5. [阅读建议](#阅读建议)

---

## 概述

本目录是 OpenMT 项目最核心的产品需求规格文档，定义了系统的全部功能需求、非功能需求、用户故事和验收标准。每个产品模块均采用统一的文档结构，便于开发、测试与评审。

所有需求均来源于以下原始文档：
- 云托管版 PRD（原 `docs/CLOUD_HOSTING_PRD.md`）
- OpenSciEd 集成 PRD（原 `docs/OPENMTSCIED_INTEGRATION_PRD.md`）
- 培训平台 PRD（原 `docs/TRAINING_PLATFORM_PRD.md`）
- 机构驾驶舱需求（原 `docs/INSTITUTION_DASHBOARD_PRD.md`）

---

## 文档结构说明

每个产品模块均由以下 4 类文档组成：

```
XX-module-name/
├── index.md                      ← 模块总览、架构设计、与其他模块关系
├── functional-requirements.md     ← 功能需求（FR），按功能点编号
├── non-functional-requirements.md ← 非功能需求（NFR），性能/安全/兼容等
├── user-stories.md               ← 用户故事（US），按角色组织
└── acceptance-criteria.md        ← 验收标准（AC），里程碑与通过条件
```

---

## 需求类型约定

所有需求文档均使用统一的标识前缀：

| 前缀 | 类型 | 含义 | 示例 |
|------|------|------|------|
| `FR-` | 功能需求 | Functional Requirement，描述系统应具备的功能行为 | `FR-BACKUP-01` |
| `NFR-` | 非功能需求 | Non-Functional Requirement，描述系统的质量属性 | `NFR-PERF-01` |
| `US-` | 用户故事 | User Story，从用户视角描述的需求 | `US-ADMIN-01` |
| `AC-` | 验收标准 | Acceptance Criteria，功能是否完成的判定标准 | `AC-BACKUP-01` |

### 编号规则

```
[前缀]-[模块代码]-[三位序号]
```

**模块代码**：
| 代码 | 模块 |
|------|------|
| `BACKUP` | 云端自动备份 |
| `AI` | AI 助教 |
| `AUTH` | 认证与权限 |
| `TENANT` | 多租户管理 |
| `STUDENT` | 学员管理 |
| `SCHEDULE` | 排课管理 |
| `PROJECT` | 项目管理 |
| `HARDWARE` | 硬件设备管理 |
| `TOKEN` | Token 计费 |
| `RESOURCE` | 教学资源 / OpenSciEd |
| `DASHBOARD` | 仪表盘 / 驾驶舱 |
| `FINANCE` | 财务结算 |
| `MARKETING` | 营销与招生 |
| `COMPETITION` | 竞赛认证 |
| `NOTIFY` | 消息通知 |
| `WS` | WebSocket 实时同步 |
| `PERF` | 性能 |
| `SEC` | 安全 |
| `AVAIL` | 可用性 |
| `COMPAT` | 兼容性 |
| `SCALE` | 可扩展性 |

---

## 模块文档清单

### 02-01 Cloud-Hosted — 云托管版

| 文档 | 说明 |
|------|------|
| [01-cloud-hosted/index.md](01-cloud-hosted/index.md) | 云托管版总览、产品定位、版本对比 |
| [01-cloud-hosted/functional-requirements.md](01-cloud-hosted/functional-requirements.md) | 功能需求：备份、AI 助教、多租户隔离、安全防护、OpenSciEd 集成、多端同步 |
| [01-cloud-hosted/non-functional-requirements.md](01-cloud-hosted/non-functional-requirements.md) | 非功能需求：性能、可用性、可扩展性、安全合规 |
| [01-cloud-hosted/user-stories.md](01-cloud-hosted/user-stories.md) | 用户故事：机构管理员、教师、家长、系统管理员 |
| [01-cloud-hosted/acceptance-criteria.md](01-cloud-hosted/acceptance-criteria.md) | 验收标准与里程碑 |

**内容来源**：原 `docs/CLOUD_HOSTING_PRD.md`

### 02-02 Institution Dashboard — 机构驾驶舱

| 文档 | 说明 |
|------|------|
| [02-institution-dashboard/index.md](02-institution-dashboard/index.md) | 驾驶舱总览、设计原则、通用规范 |
| [02-institution-dashboard/org-type-training.md](02-institution-dashboard/org-type-training.md) | 培训机构驾驶舱需求 |
| [02-institution-dashboard/org-type-k12.md](02-institution-dashboard/org-type-k12.md) | K12 学校驾驶舱需求 |
| [02-institution-dashboard/org-type-vocational.md](02-institution-dashboard/org-type-vocational.md) | 职业学校驾驶舱需求 |
| [02-institution-dashboard/org-type-bureau.md](02-institution-dashboard/org-type-bureau.md) | 教育局驾驶舱需求 |

**内容来源**：原 `docs/INSTITUTION_DASHBOARD_PRD.md`

### 02-03 OpenSciEd Integration — OpenSciEd 资源集成

| 文档 | 说明 |
|------|------|
| [03-openscied-integration/index.md](03-openscied-integration/index.md) | 集成总览、架构设计、目标 |
| [03-openscied-integration/functional-requirements.md](03-openscied-integration/functional-requirements.md) | 功能需求：API 代理、机构配置、前端资源、仪表盘入口、教师工作台、进阶能力 |
| [03-openscied-integration/non-functional-requirements.md](03-openscied-integration/non-functional-requirements.md) | 非功能需求：安全、性能、可用性、合规、可观测 |
| [03-openscied-integration/acceptance-criteria.md](03-openscied-integration/acceptance-criteria.md) | M1–M6 里程碑验收标准 |

**内容来源**：原 `docs/OPENMTSCIED_INTEGRATION_PRD.md`

### 02-04 Training Platform — 培训平台核心功能

| 文档 | 说明 |
|------|------|
| [04-training-platform/index.md](04-training-platform/index.md) | 产品定位、目标用户、业务流程总览 |
| [04-training-platform/functional-requirements.md](04-training-platform/functional-requirements.md) | 功能需求：学员管理、招生线索、智能排课、设备资产、项目管理、教学资源、竞赛认证、营销中心、Token 中心、财务结算、教师绩效、家长中心、多校区、消息中心 |
| [04-training-platform/non-functional-requirements.md](04-training-platform/non-functional-requirements.md) | 非功能需求：性能、安全、兼容性 |
| [04-training-platform/user-stories.md](04-training-platform/user-stories.md) | 用户故事：按角色分类 |

**内容来源**：原 `docs/TRAINING_PLATFORM_PRD.md`

### 02-05 Vocational School — 职业学校 STEM 实训教学管理

| 文档 | 说明 |
|------|------|
| [05-vocational-school/index.md](05-vocational-school/index.md) | 产品总览、核心价值、与云托管版关系、功能模块全景图 |
| [05-vocational-school/functional-requirements.md](05-vocational-school/functional-requirements.md) | 功能需求：实训设备管理、实训耗材、校企合作、双创孵化、技能竞赛、STEM 教务、实习就业、安全准入、技能评估、数据看板 |
| [05-vocational-school/user-stories.md](05-vocational-school/user-stories.md) | 用户故事：实训中心主任、实训导师、学生、企业管理员、区域管理员 |
| [05-vocational-school/acceptance-criteria.md](05-vocational-school/acceptance-criteria.md) | 验收标准：4 个阶段验收 + 通用验收标准 |

**内容来源**：原型站（梅山县职业技术学校）演示数据 + 现有 [VOCATIONAL_STEM_CLOUD_HOSTING_PRD.md](../VOCATIONAL_STEM_CLOUD_HOSTING_PRD.md)

### 02-06 Exam Management — 考试管理

| 文档 | 说明 |
|------|------|
| [06-exam-management/index.md](06-exam-management/index.md) | 考试管理总览、业务流程、角色权限、系统架构、数据结构设计、用户流程图、界面原型草图、实施优先级建议 |
| [06-exam-management/functional-requirements.md](06-exam-management/functional-requirements.md) | 功能需求：题库获取（FR-EXAM-01）、试卷排版与打印（FR-EXAM-02）、试题组织（FR-EXAM-03）、线上考试安排（FR-EXAM-04） |
| [06-exam-management/non-functional-requirements.md](06-exam-management/non-functional-requirements.md) | 非功能需求：性能、安全、可用性、用户体验、兼容性、数据规范 |
| [06-exam-management/user-stories.md](06-exam-management/user-stories.md) | 用户故事：授课教师、机构管理员、教务主管、学员、家长 |
| [06-exam-management/acceptance-criteria.md](06-exam-management/acceptance-criteria.md) | 验收标准：四大模块详细验收标准 + M1-M4 里程碑验收计划 |

**内容来源**：新建需求文档（2026-06-24），基于OpenMT教育平台考试管理业务需求。

### 模块代码表更新

在现有模块代码基础上，新增以下职业学校专用模块代码：

| 代码 | 模块 |
|------|------|
| `VEQ` | 实训设备管理 |
| `VCON` | 实训耗材管理 |
| `VCOOP` | 校企合作管理 |
| `VINC` | 双创孵化管理 |
| `VCOMP` | 技能竞赛管理 |
| `VACA` | STEM 教务管理 |
| `VEMP` | 实习就业跟踪 |
| `VSAF` | 安全监控与准入 |
| `VASS` | 技能评估体系 |
| `VDSH` | 数据看板与分析 |
| `EXAM` | 考试管理 |

---

## 阅读建议

| 目的 | 推荐阅读顺序 |
|------|-------------|
| **了解产品全貌** | 每个模块的 `index.md` → 功能需求 → 验收标准 |
| **开发前端界面** | 用户故事 → 功能需求 → 驾驶舱模块文档 |
| **开发后端 API** | 功能需求 → 非功能需求 → 验收标准 → API 规格 |
| **测试验证** | 验收标准 → 功能需求 → 非功能需求 |
| **产品评审** | index.md → 用户故事 → 功能需求 → 验收标准 |

---

**上一级**：[../README.md](../README.md)
