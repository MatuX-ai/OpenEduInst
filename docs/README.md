# OpenMT 文档中心

**项目名称**：OpenMT - 开源 STEM 教育机构管理工具
**文档版本**：v2.0
**最后更新**：2026-06-23
**状态**：✅ 已重构，采用分类目录结构

---

## 目录

1. [文档结构说明](#文档结构说明)
2. [01 - 项目概述与愿景](#01---项目概述与愿景)
3. [02 - 产品需求规格 (PRD)](#02---产品需求规格-prd)
4. [03 - 系统架构与技术设计](#03---系统架构与技术设计)
5. [04 - API 规格与数据模型](#04---api-规格与数据模型)
6. [05 - 开发计划与路线图](#05---开发计划与路线图)
7. [06 - 设计规范](#06---设计规范)
8. [07 - 测试与质量保证](#07---测试与质量保证)
9. [08 - 运维与部署](#08---运维与部署)
10. [09 - 附录与参考](#09---附录与参考)
11. [文档约定与维护指南](#文档约定与维护指南)

---

## 文档结构说明

本项目文档采用**分类目录式结构**，按文档类型和主题进行逻辑分组，便于快速定位和后续扩展。

```
docs/
├── README.md                              ← 文档总目录（本文件）
│
├── 01-project-overview/                   项目概述、愿景、适用场景
│   ├── README.md
│   ├── project-overview.md
│   └── terminology.md
│
├── 02-product-requirements/               产品需求规格（PRD）
│   ├── README.md
│   ├── 01-cloud-hosted/                    云托管版 PRD
│   │   ├── index.md
│   │   ├── functional-requirements.md
│   │   ├── non-functional-requirements.md
│   │   ├── user-stories.md
│   │   └── acceptance-criteria.md
│   ├── 02-institution-dashboard/           机构驾驶舱 PRD
│   │   ├── index.md
│   │   ├── org-type-training.md            培训机构
│   │   ├── org-type-k12.md                 K12 学校
│   │   ├── org-type-vocational.md          职业学校
│   │   └── org-type-bureau.md              教育局
│   ├── 03-openscied-integration/          OpenSciEd 集成 PRD
│   │   ├── index.md
│   │   ├── functional-requirements.md
│   │   ├── non-functional-requirements.md
│   │   └── acceptance-criteria.md
│   └── 04-training-platform/              培训平台 PRD
│       ├── index.md
│       ├── functional-requirements.md
│       ├── non-functional-requirements.md
│       └── user-stories.md
│
├── 03-architecture/                        系统架构设计
│   ├── README.md
│   ├── system-architecture.md
│   ├── multi-tenancy.md
│   ├── license-model.md
│   └── data-flow.md
│
├── 04-api-specifications/                 API 规格
│   ├── README.md
│   ├── api-specification.md
│   └── database-schema.md
│
├── 05-development-plans/                  开发计划
│   ├── README.md
│   ├── implementation-roadmap.md
│   ├── dashboard-development-plan.md
│   └── demo-website-plan.md
│
├── 06-design-specifications/              设计规范
│   ├── README.md
│   └── figma-design-spec.md
│
├── 07-testing-qa/                         测试与 QA
│   ├── README.md
│   ├── testing-strategy.md
│   └── checklist.md
│
├── 08-operations/                         运维部署
│   ├── README.md
│   ├── deployment-plan.md
│   └── git-branching-strategy.md
│
└── 09-appendices/                         附录与参考
    ├── README.md
    ├── comparison-documents/
    │   ├── stem-features-comparison.md
    │   └── cloud-hosting-comparison.md
    └── reference-links.md
```

---

## 01 - 项目概述与愿景

**主题**：项目定位、核心价值、适用场景、术语定义

| 文档 | 说明 | 状态 |
|------|------|------|
| [01-project-overview/README.md](01-project-overview/README.md) | 项目概述目录 | ✅ |
| [01-project-overview/project-overview.md](01-project-overview/project-overview.md) | 项目愿景、目标用户、核心价值主张 | ✅ |
| [01-project-overview/terminology.md](01-project-overview/terminology.md) | 术语表与定义 | ✅ |

**内容来源**：根目录 `README.md`、各 PRD 文档的概述部分

---

## 02 - 产品需求规格 (PRD)

**主题**：各模块的功能需求、非功能需求、用户故事、验收标准

### 02.1 云托管版 PRD

| 文档 | 说明 | 状态 |
|------|------|------|
| [02-product-requirements/01-cloud-hosted/index.md](02-product-requirements/01-cloud-hosted/index.md) | 云托管版总览、产品定位、版本对比 | ✅ |
| [02-product-requirements/01-cloud-hosted/functional-requirements.md](02-product-requirements/01-cloud-hosted/functional-requirements.md) | 功能需求：备份、AI助教、多端同步、隔离、安全等 | ✅ |
| [02-product-requirements/01-cloud-hosted/non-functional-requirements.md](02-product-requirements/01-cloud-hosted/non-functional-requirements.md) | 性能、可用性、扩展性、安全合规等 | ✅ |
| [02-product-requirements/01-cloud-hosted/user-stories.md](02-product-requirements/01-cloud-hosted/user-stories.md) | 用户故事（按角色分类） | ✅ |
| [02-product-requirements/01-cloud-hosted/acceptance-criteria.md](02-product-requirements/01-cloud-hosted/acceptance-criteria.md) | 验收标准、里程碑 | ✅ |

**内容来源**：`docs/CLOUD_HOSTING_PRD.md`

### 02.2 机构驾驶舱 PRD

| 文档 | 说明 | 状态 |
|------|------|------|
| [02-product-requirements/02-institution-dashboard/index.md](02-product-requirements/02-institution-dashboard/index.md) | 驾驶舱总览、设计原则、通用规范 | ✅ |
| [02-product-requirements/02-institution-dashboard/org-type-training.md](02-product-requirements/02-institution-dashboard/org-type-training.md) | 培训机构驾驶舱需求 | ✅ |
| [02-product-requirements/02-institution-dashboard/org-type-k12.md](02-product-requirements/02-institution-dashboard/org-type-k12.md) | K12 学校驾驶舱需求 | ✅ |
| [02-product-requirements/02-institution-dashboard/org-type-vocational.md](02-product-requirements/02-institution-dashboard/org-type-vocational.md) | 职业学校驾驶舱需求 | ✅ |
| [02-product-requirements/02-institution-dashboard/org-type-bureau.md](02-product-requirements/02-institution-dashboard/org-type-bureau.md) | 教育局驾驶舱需求 | ✅ |

**内容来源**：`docs/INSTITUTION_DASHBOARD_PRD.md`

### 02.3 OpenSciEd 集成 PRD

| 文档 | 说明 | 状态 |
|------|------|------|
| [02-product-requirements/03-openscied-integration/index.md](02-product-requirements/03-openscied-integration/index.md) | 集成总览、架构设计、目标 | ✅ |
| [02-product-requirements/03-openscied-integration/functional-requirements.md](02-product-requirements/03-openscied-integration/functional-requirements.md) | API代理、配置、前端资源、仪表盘入口、教师工作台、进阶能力 | ✅ |
| [02-product-requirements/03-openscied-integration/non-functional-requirements.md](02-product-requirements/03-openscied-integration/non-functional-requirements.md) | 安全、性能、可用性、合规、可观测 | ✅ |
| [02-product-requirements/03-openscied-integration/acceptance-criteria.md](02-product-requirements/03-openscied-integration/acceptance-criteria.md) | M1–M6 里程碑验收标准 | ✅ |

**内容来源**：`docs/OPENMTSCIED_INTEGRATION_PRD.md`

### 02.4 培训平台 PRD

| 文档 | 说明 | 状态 |
|------|------|------|
| [02-product-requirements/04-training-platform/index.md](02-product-requirements/04-training-platform/index.md) | 产品定位、目标用户、业务流程 | ✅ |
| [02-product-requirements/04-training-platform/functional-requirements.md](02-product-requirements/04-training-platform/functional-requirements.md) | 学员管理、招生线索、智能排课、设备资产、项目管理、教学资源、竞赛认证、营销中心、Token中心、财务结算、教师绩效、家长中心、多校区、消息中心 | ✅ |
| [02-product-requirements/04-training-platform/non-functional-requirements.md](02-product-requirements/04-training-platform/non-functional-requirements.md) | 性能、安全、兼容性 | ✅ |
| [02-product-requirements/04-training-platform/user-stories.md](02-product-requirements/04-training-platform/user-stories.md) | 按角色分类的用户故事 | ✅ |

**内容来源**：`docs/TRAINING_PLATFORM_PRD.md`

---

## 03 - 系统架构与技术设计

**主题**：系统整体架构、技术选型、多租户设计、许可证体系

| 文档 | 说明 | 状态 |
|------|------|------|
| [03-architecture/README.md](03-architecture/README.md) | 架构文档目录 | ✅ |
| [03-architecture/system-architecture.md](03-architecture/system-architecture.md) | 系统整体架构、技术栈总览、前后端架构、数据流 | ✅ |
| [03-architecture/multi-tenancy.md](03-architecture/multi-tenancy.md) | 多租户隔离策略、Schema/行级隔离、租户初始化 | ✅ |
| [03-architecture/license-model.md](03-architecture/license-model.md) | 许可证类型、状态流转、验证机制 | ✅ |
| [03-architecture/data-flow.md](03-architecture/data-flow.md) | 核心业务流程图 | ✅ |

**内容来源**：各 PRD 中的架构章节、`docs/IMPLEMENTATION_PLAN.md`

---

## 04 - API 规格与数据模型

**主题**：API 接口规范、数据库设计

| 文档 | 说明 | 状态 |
|------|------|------|
| [04-api-specifications/README.md](04-api-specifications/README.md) | API 文档目录 | ✅ |
| [04-api-specifications/api-specification.md](04-api-specifications/api-specification.md) | RESTful API 规范、认证、错误码 | ✅ |
| [04-api-specifications/database-schema.md](04-api-specifications/database-schema.md) | 数据库表设计、核心模型说明 | ✅ |

**内容来源**：`docs/API_SPECIFICATION.md`、`docs/DATABASE_SCHEMA.md`

---

## 05 - 开发计划与路线图

**主题**：实施计划、开发路线图、任务分解

| 文档 | 说明 | 状态 |
|------|------|------|
| [05-development-plans/README.md](05-development-plans/README.md) | 开发计划目录 | ✅ |
| [05-development-plans/implementation-roadmap.md](05-development-plans/implementation-roadmap.md) | 总体实施路线图、Phase 1-4 任务分解 | ✅ |
| [05-development-plans/dashboard-development-plan.md](05-development-plans/dashboard-development-plan.md) | 机构驾驶舱开发计划、周任务分解、里程碑 | ✅ |
| [05-development-plans/demo-website-plan.md](05-development-plans/demo-website-plan.md) | Demo 网站开发计划、甘特图 | ✅ |

**内容来源**：`docs/IMPLEMENTATION_PLAN.md`、`docs/DASHBOARD_DEVELOPMENT_PLAN.md`、`docs/README_DEMO_PLAN.md`、`docs/demo-website-plan.md`、`docs/demo-website-gantt.md`

---

## 06 - 设计规范

**主题**：UI/UX 设计规范、视觉系统

| 文档 | 说明 | 状态 |
|------|------|------|
| [06-design-specifications/README.md](06-design-specifications/README.md) | 设计规范目录 | ✅ |
| [06-design-specifications/figma-design-spec.md](06-design-specifications/figma-design-spec.md) | 色彩系统、布局、组件规范 | ✅ |

**内容来源**：`docs/figma-design-spec.md`、`docs/STEM_POSITIONING_ADJUSTMENT.md`

---

## 07 - 测试与质量保证

**主题**：测试策略、检查清单

| 文档 | 说明 | 状态 |
|------|------|------|
| [07-testing-qa/README.md](07-testing-qa/README.md) | 测试文档目录 | ✅ |
| [07-testing-qa/testing-strategy.md](07-testing-qa/testing-strategy.md) | 测试策略、测试类型、测试范围 | ✅ |
| [07-testing-qa/checklist.md](07-testing-qa/checklist.md) | 功能检查清单、发布检查清单 | ✅ |

**内容来源**：各 PRD 中的验收标准章节、`docs/demo-website-checklist.md`

---

## 08 - 运维与部署

**主题**：部署方案、分支策略

| 文档 | 说明 | 状态 |
|------|------|------|
| [08-operations/README.md](08-operations/README.md) | 运维文档目录 | ✅ |
| [08-operations/deployment-plan.md](08-operations/deployment-plan.md) | 部署方案、环境要求 | ✅ |
| [08-operations/git-branching-strategy.md](08-operations/git-branching-strategy.md) | Git 分支管理策略 | ✅ |

**内容来源**：`docs/DEPLOY_LITE_PLAN.md`、`docs/GIT_BRANCHING_STRATEGY.md`

---

## 09 - 附录与参考

**主题**：对比文档、参考链接

| 文档 | 说明 | 状态 |
|------|------|------|
| [09-appendices/README.md](09-appendices/README.md) | 附录目录 | ✅ |
| [09-appendices/comparison-documents/stem-features-comparison.md](09-appendices/comparison-documents/stem-features-comparison.md) | OpenMT 与普通教培系统对比 | ✅ |
| [09-appendices/comparison-documents/cloud-hosting-comparison.md](09-appendices/comparison-documents/cloud-hosting-comparison.md) | 云托管版 vs 社区版对比 | ✅ |
| [09-appendices/reference-links.md](09-appendices/reference-links.md) | 外部参考链接、技术文档 | ✅ |

**内容来源**：`docs/stem-features-comparison.md`、`docs/CLOUD_HOSTING_COMPARISON.md`

---

## 文档约定与维护指南

### 标题层级

所有文档遵循统一的 Markdown 标题层级：

| 层级 | 用途 | 示例 |
|------|------|------|
| `#` (H1) | 文档主标题 | 每个文档仅一个 |
| `##` (H2) | 主要章节 | 需求类型、功能模块 |
| `###` (H3) | 子章节 | 功能点、需求项 |
| `####` (H4) | 详细条目 | 具体需求说明 |

### 需求分类标识

所有需求文件中的需求项使用以下分类标识：

| 标识 | 含义 | 格式 |
|------|------|------|
| `FR-` | 功能需求 (Functional Requirement) | `FR-模块-编号` |
| `NFR-` | 非功能需求 (Non-Functional Requirement) | `NFR-类别-编号` |
| `US-` | 用户故事 (User Story) | `US-角色-编号` |
| `AC-` | 验收标准 (Acceptance Criteria) | `AC-模块-编号` |

### 状态标记

| 标记 | 含义 |
|------|------|
| ✅ | 已完成 / 已交付 |
| 🔄 | 进行中 / 待完善 |
| 🎯 | 规划目标 / 待实现 |
| ❌ | 不包含 / 已废弃 |

### 更新维护

- **新增需求**：在对应模块的 PRD 文档中追加，按时间顺序记录版本历史
- **修改需求**：在文档末尾的版本历史中记录变更内容
- **重大变更**：需同步更新本目录 README 并通知相关开发人员
- **废弃文档**：标记为 `DEPRECATED`，不删除，保留历史追溯

### 文件命名规范

- 使用小写字母和连字符（kebab-case）
- 模块名使用数字前缀确保排序（如 `01-`, `02-`）
- 文件内容类型使用英文描述（如 `functional-requirements.md`）
- 避免中文文件名

---

**下一份文档** → [01-project-overview/README.md](01-project-overview/README.md)
