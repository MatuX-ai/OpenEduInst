# 术语表

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [项目核心术语](#项目核心术语)
2. [组织与用户术语](#组织与用户术语)
3. [技术与架构术语](#技术与架构术语)
4. [业务功能术语](#业务功能术语)
5. [缩略语表](#缩略语表)

---

## 项目核心术语

| 术语 | 英文 / 缩写 | 定义与说明 |
|------|-------------|-----------|
| **STEM** | Science, Technology, Engineering, Mathematics | 科学、技术、工程、数学的综合教育理念，强调跨学科融合与实践 |
| **OpenMT** | Open Management Tool | 本项目名称，专为 STEM 教育设计的开源机构管理系统 |
| **云托管版** | Cloud-Hosted Edition | SaaS 模式的云端部署版本，提供 AI 助教、自动备份、多端同步等高级能力 |
| **开源社区版** | Open-Source Edition | 免费本地部署的基础版本，提供核心管理功能 |
| **商业定制版** | Commercial Edition | 根据机构特定需求定制的付费版本，支持私有部署 |

---

## 组织与用户术语

| 术语 | 英文 / 缩写 | 定义与说明 |
|------|-------------|-----------|
| **组织 / 机构** | Organization / Org | 系统中的基本业务实体，每个组织有独立的业务数据和功能配置 |
| **组织类型** | Organization Type | 四种组织类型：培训机构 (Training)、K12 学校 (K12)、职业学校 (Vocational)、教育局 (Bureau) |
| **租户** | Tenant | 多租户架构中的独立业务实体，与"组织"含义相近，强调数据隔离 |
| **机构负责人** | Organization Owner | 组织的最高权限管理者，拥有所有业务功能的访问权限 |
| **教务主管** | Academic Director | 负责课程编排、教师调度、学员档案管理的管理人员 |
| **授课教师** | Instructor / Teacher | 负责授课、学员评价、课时记录的教学人员 |
| **招生顾问** | Admissions Counselor | 负责潜在客户管理、活动推广、转化跟踪的业务人员 |
| **家长** | Parent | 学员的监护人，可查看学习进度、课堂反馈、进行续费操作 |
| **学员 / 学生** | Student | 接受 STEM 教育培训的学习者 |

---

## 技术与架构术语

| 术语 | 英文 / 缩写 | 定义与说明 |
|------|-------------|-----------|
| **多租户** | Multi-Tenancy | 多个组织共享同一系统实例，数据互相隔离的架构设计 |
| **Schema 隔离** | Schema Isolation | 在 PostgreSQL 中为每个租户创建独立的 Schema，实现物理级数据隔离 |
| **行级隔离** | Row-Level Isolation | 通过 `org_id` 字段在数据库表中实现的数据隔离方式（当前实现） |
| **功能开关** | Feature Flag | 控制特定功能模块是否对用户可见/可用的开关机制 |
| **许可证** | License | 组织使用系统的授权凭证，包含类型、有效期、功能范围等信息 |
| **Token** | Token | AI 服务等增值功能的计费单位，每次调用 AI 功能消耗一定数量的 Token |
| **RESTful API** | REST API | 基于 HTTP 协议的无状态接口设计风格 |
| **WebSocket** | WS | 支持服务器主动推送的长连接通信协议，用于实时数据同步 |
| **JWT** | JSON Web Token | 用于用户身份验证的令牌格式 |
| **RBAC** | Role-Based Access Control | 基于角色的访问控制，通过角色分配权限 |
| **SLA** | Service Level Agreement | 服务等级协议，定义系统可用性承诺 |
| **RTO** | Recovery Time Objective | 故障恢复时间目标，指从故障发生到系统恢复可用的最长时间 |
| **RPO** | Recovery Point Objective | 数据恢复点目标，指可接受的最大数据丢失量对应的时间点 |
| **PWA** | Progressive Web App | 渐进式 Web 应用，支持离线使用和安装到桌面 |

---

## 业务功能术语

| 术语 | 英文 / 缩写 | 定义与说明 |
|------|-------------|-----------|
| **消课率** | Course Consumption Rate | 已消耗课时占总购买课时的比例，衡量学员活跃度的核心指标 |
| **续费预警** | Renewal Alert | 当学员剩余课时低于阈值时触发的提醒机制 |
| **创客空间** | Makerspace | 提供工具设备（如 3D 打印机、激光切割机）的创新实践空间 |
| **硬件设备** | Hardware Device | Arduino、Raspberry Pi、传感器、PLC、CNC 等用于 STEM 教学的物理设备 |
| **设备资产** | Equipment Asset | 机构拥有的硬件设备清单，包含借用、维护、损耗记录 |
| **实验项目** | Project | 学员完成的 STEM 项目，包含项目描述、里程碑、成果展示、技术栈标签 |
| **竞赛认证** | Competition / Certification | 机器人竞赛、编程比赛、技能认证考试等活动及其报名管理 |
| **教学资源** | Teaching Resource | 课件、代码、视频等教学材料，支持版本管理和下载统计 |
| **Token 余额** | Token Balance | 机构当前可用的 Token 数量，用于调用 AI 功能 |
| **AI 助教** | AI Assistant | 基于大模型的教学辅助功能，包含智能排课、学情分析、代码审查等 |
| **驾驶舱** | Dashboard | 各组织类型的数据可视化管理界面，展示核心指标和常用操作 |
| **线索** | Lead | 潜在客户信息，包含联系方式、意向课程、跟进状态 |
| **转化率** | Conversion Rate | 线索转化为正式学员的比例 |

---

## 缩略语表

| 缩略语 | 全称 | 含义 |
|--------|------|------|
| **STEM** | Science, Technology, Engineering, Mathematics | 科学、技术、工程、数学 |
| **K12** | Kindergarten through 12th Grade | 从幼儿园到 12 年级的基础教育阶段 |
| **API** | Application Programming Interface | 应用程序编程接口 |
| **REST** | Representational State Transfer | 一种 Web API 设计风格 |
| **HTTP** | Hypertext Transfer Protocol | 超文本传输协议 |
| **HTTPS** | HTTP Secure | 加密的 HTTP 协议 |
| **JWT** | JSON Web Token | JSON Web 令牌 |
| **RBAC** | Role-Based Access Control | 基于角色的访问控制 |
| **SQL** | Structured Query Language | 结构化查询语言 |
| **DB** | Database | 数据库 |
| **SaaS** | Software as a Service | 软件即服务 |
| **PaaS** | Platform as a Service | 平台即服务 |
| **IaaS** | Infrastructure as a Service | 基础设施即服务 |
| **SLA** | Service Level Agreement | 服务等级协议 |
| **RTO** | Recovery Time Objective | 恢复时间目标 |
| **RPO** | Recovery Point Objective | 恢复点目标 |
| **PWA** | Progressive Web App | 渐进式 Web 应用 |
| **HSTS** | HTTP Strict Transport Security | HTTP 严格传输安全 |
| **TLS** | Transport Layer Security | 传输层安全协议 |
| **SSD** | Solid-State Drive | 固态硬盘 |
| **CNC** | Computer Numerical Control | 计算机数值控制（数控机床） |
| **PLC** | Programmable Logic Controller | 可编程逻辑控制器 |
| **IoT** | Internet of Things | 物联网 |
| **AI** | Artificial Intelligence | 人工智能 |
| **ML** | Machine Learning | 机器学习 |
| **IDE** | Integrated Development Environment | 集成开发环境 |
| **UI** | User Interface | 用户界面 |
| **UX** | User Experience | 用户体验 |
| **QA** | Quality Assurance | 质量保证 |
| **DevOps** | Development + Operations | 开发运维一体化 |
| **CI/CD** | Continuous Integration / Continuous Deployment | 持续集成 / 持续部署 |

---

**上一级**：[README.md](README.md)
**文档体系根目录**：[../README.md](../README.md)
