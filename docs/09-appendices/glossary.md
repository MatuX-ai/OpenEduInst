# 术语表与缩写解释

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [核心概念术语](#核心概念术语)
2. [组织与用户术语](#组织与用户术语)
3. [技术架构术语](#技术架构术语)
4. [缩写解释](#缩写解释)
5. [版本历史](#版本历史)

---

## 核心概念术语

| 术语 | 定义 |
|------|------|
| 机构 (Institution) | 使用系统的教育培训机构、学校或创客空间，数据独立隔离 |
| 学员 (Student) | 在机构报名参加课程的学习者，系统管理的核心对象之一 |
| 课程 (Course) | 机构提供的教学产品，包含教学内容、时长、价格等信息 |
| 班级 (Class) | 课程的具体开班，有固定的教师、学员、时间安排 |
| 排课 (Schedule) | 具体课时的时间安排，对应单次课堂 |
| 报名 (Enrollment) | 学员加入某个班级的行为，是学员与班级的关联关系 |
| 出勤 (Attendance) | 学员在某节课是否到场的记录 |
| 订单 (Order) | 学员报名课程产生的财务记录 |
| 许可证 (License) | 机构使用系统的权限凭证，决定可用功能和资源配额 |

---

## 组织与用户术语

| 术语 | 定义 | 角色 |
|------|------|------|
| 机构管理员 (Admin) | 机构的最高权限管理者，管理用户、设置、数据等 | admin |
| 教务主管 (Operator) | 负责日常教学运营，管理学员、课程、排课 | operator |
| 教师 (Teacher) | 负责授课的人员，可管理自己的课程和考勤 | teacher |
| 财务 (Finance) | 负责财务相关操作，管理订单和收入统计 | finance |
| 家长/学员 (Parent) | 学员本人或其家长，查看课程进度和通知 | parent |
| 系统管理员 (SysAdmin) | 跨机构的系统级管理员，管理许可证和系统配置 | sys_admin |

---

## 技术架构术语

| 术语 | 定义 |
|------|------|
| 多租户 (Multi-Tenant) | 系统架构中，多个机构共享同一系统实例，但数据相互隔离 |
| Schema 隔离 | 使用 PostgreSQL 的 Schema 功能，每个机构的数据存储在独立的 Schema 中 |
| JWT | JSON Web Token，无状态的用户认证方式 |
| RBAC | 基于角色的访问控制 (Role-Based Access Control) |
| WebSocket | 全双工通信协议，用于实时数据同步 |
| ORM | 对象关系映射 (Object-Relational Mapping)，SQLAlchemy 2.0 |
| Alembic | SQLAlchemy 配套的数据库版本迁移工具 |
| FastAPI | 现代高性能 Python Web 框架，用于构建 API |
| Angular | 企业级前端框架，由 Google 维护 |
| PrimeNG | 基于 Angular 的企业级 UI 组件库 |
| ECharts | 百度开源的图表库，适合中文数据可视化 |

---

## 缩写解释

| 缩写 | 全称 | 中文解释 |
|------|------|---------|
| API | Application Programming Interface | 应用程序接口 |
| HTTP | Hypertext Transfer Protocol | 超文本传输协议 |
| HTTPS | HTTP Secure | 安全 HTTP |
| JSON | JavaScript Object Notation | JavaScript 对象表示法 |
| JWT | JSON Web Token | JSON Web 令牌 |
| REST | Representational State Transfer | 表述性状态转移 |
| UI | User Interface | 用户界面 |
| UX | User Experience | 用户体验 |
| RBAC | Role-Based Access Control | 基于角色的访问控制 |
| ORM | Object-Relational Mapping | 对象关系映射 |
| DB | Database | 数据库 |
| SQL | Structured Query Language | 结构化查询语言 |
| SQLi | SQL Injection | SQL 注入攻击 |
| XSS | Cross-Site Scripting | 跨站脚本攻击 |
| SSL | Secure Sockets Layer | 安全套接字层 |
| TLS | Transport Layer Security | 传输层安全 |
| HSTS | HTTP Strict Transport Security | HTTP 严格传输安全 |
| WAF | Web Application Firewall | Web 应用防火墙 |
| CORS | Cross-Origin Resource Sharing | 跨源资源共享 |
| E2E | End-to-End | 端到端 |
| MVP | Minimum Viable Product | 最小可行产品 |
| SaaS | Software as a Service | 软件即服务 |
| CRM | Customer Relationship Management | 客户关系管理 |
| PII | Personally Identifiable Information | 个人可识别信息 |
| SLA | Service Level Agreement | 服务等级协议 |
| SSO | Single Sign-On | 单点登录 |
| OSS | Object Storage Service | 对象存储服务 |

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，完整术语表 |

---

**上一级**：[README.md](README.md)
