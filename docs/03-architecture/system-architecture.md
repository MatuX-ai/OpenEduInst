# 系统架构总览

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 架构设计完成

---

## 目录

1. [分层架构](#分层架构)
2. [模块架构](#模块架构)
3. [核心数据流](#核心数据流)
4. [设计原则](#设计原则)
5. [版本历史](#版本历史)

---

## 分层架构

### 1. 表示层 (Presentation Layer)

```
前端应用 (Angular SPA)
├── 机构管理仪表板
├── 教师工作台
└── 家长/学员端
```

**职责**：
- 提供用户交互界面
- 数据展示和可视化
- 前端路由和导航
- 表单验证和用户输入处理
- 通过 HTTP API 与后端通信
- 通过 WebSocket 接收实时事件

**技术**：Angular 17, TypeScript, Angular Material, RxJS

---

### 2. 应用层 (Application Layer)

```
后端 API 服务 (FastAPI + Python)
├── 用户与角色模块
├── 机构管理模块
├── 学员管理模块
├── 课程与班级模块
├── 排课与考勤模块
├── 财务与订单模块
├── 作品与成果模块
├── 通知系统模块
├── AI 助手服务
├── WebSocket 实时服务
└── OpenSciEd 资源代理
```

**职责**：
- 提供 RESTful API 接口
- 业务逻辑处理
- 认证与授权
- 数据验证和转换
- 调用外部服务（AI API、OpenSciEd API）

**技术**：FastAPI, Python 3.11, Pydantic, SQLAlchemy

---

### 3. 数据访问层 (Data Access Layer)

```
数据访问层 (SQLAlchemy ORM)
├── Model 定义
├── Repository 模式
├── 事务管理
└── 数据库迁移 (Alembic)
```

**职责**：
- 数据库操作抽象
- 数据持久化
- 查询优化
- 多租户 Schema 路由

**技术**：SQLAlchemy 2.0, Alembic

---

### 4. 数据存储层 (Data Storage Layer)

```
数据存储层
├── PostgreSQL (关系型数据库)
│   ├── 用户与权限数据
│   ├── 机构与业务数据
│   └── 审计日志
├── Redis (缓存 / 会话 / 消息队列)
│   ├── 会话缓存
│   ├── API 响应缓存
│   ├── 速率限制计数器
│   └── 消息队列
└── 对象存储 (OSS / S3)
    ├── 用户文件和作品
    └── 数据备份文件
```

**职责**：
- 数据持久化存储
- 缓存加速访问
- 文件存储和管理

**技术**：PostgreSQL 15, Redis 7, 兼容 S3 协议的对象存储

---

## 模块架构

### 后端模块组织结构

```
app/
├── api/                      # API 路由层
│   ├── v1/
│   │   ├── auth.py          # 认证相关 API
│   │   ├── users.py         # 用户管理 API
│   │   ├── institutions.py  # 机构管理 API
│   │   ├── students.py      # 学员管理 API
│   │   ├── teachers.py      # 教师管理 API
│   │   ├── courses.py       # 课程管理 API
│   │   ├── classes.py       # 班级管理 API
│   │   ├── scheduling.py    # 排课管理 API
│   │   ├── orders.py        # 订单财务 API
│   │   ├── works.py         # 作品成果 API
│   │   ├── notifications.py # 通知管理 API
│   │   ├── ai.py            # AI 助手 API
│   │   ├── resources.py     # OpenSciEd 资源代理 API
│   │   ├── ws.py            # WebSocket 入口
│   │   └── admin.py         # 系统管理 API
│   └── dependencies.py      # 依赖注入（DB 会话、当前用户等）
├── core/                     # 核心配置和工具
│   ├── config.py            # 配置管理
│   ├── security.py          # 安全工具（JWT、密码哈希等）
│   ├── exceptions.py        # 异常定义
│   └── logging.py           # 日志配置
├── models/                   # 数据模型（SQLAlchemy Models）
│   ├── user.py              # 用户与角色模型
│   ├── institution.py       # 机构模型
│   ├── student.py           # 学员模型
│   ├── teacher.py           # 教师模型
│   ├── course.py            # 课程/班级模型
│   ├── schedule.py          # 排课模型
│   ├── order.py             # 订单/财务模型
│   ├── work.py              # 作品模型
│   ├── notification.py      # 通知模型
│   ├── audit.py             # 审计模型
│   └── backup.py            # 备份模型
├── schemas/                  # 请求/响应数据结构（Pydantic）
│   ├── user.py
│   ├── institution.py
│   ├── student.py
│   ├── ... 其他模块
│   └── common.py            # 通用响应结构
├── services/                 # 业务服务层
│   ├── user_service.py
│   ├── institution_service.py
│   ├── student_service.py
│   ├── ai_service.py        # AI 助手服务
│   ├── backup_service.py    # 数据备份服务
│   ├── notification_service.py
│   └── resource_proxy_service.py  # OpenSciEd 代理服务
├── middleware/               # 中间件
│   ├── auth.py              # 认证中间件
│   ├── rate_limit.py        # 速率限制中间件
│   ├── request_id.py        # 请求追踪中间件
│   └── audit_log.py         # 审计日志中间件
├── utils/                    # 工具函数
│   ├── datetime_utils.py
│   ├── string_utils.py
│   └── cache_utils.py
└── main.py                   # FastAPI 应用入口
```

### 前端模块组织结构

```
src/
├── app/
│   ├── core/                 # 核心模块
│   │   ├── auth/            # 认证模块
│   │   ├── guards/          # 路由守卫
│   │   ├── interceptors/    # HTTP 拦截器
│   │   └── services/        # 核心服务（API、WebSocket）
│   ├── modules/             # 业务模块
│   │   ├── dashboard/       # 仪表板首页
│   │   ├── student/         # 学员管理
│   │   ├── teacher/         # 教师管理
│   │   ├── course/          # 课程管理
│   │   ├── class/           # 班级管理
│   │   ├── scheduling/      # 排课管理
│   │   ├── finance/         # 财务订单
│   │   ├── work/            # 作品成果
│   │   ├── ai-assistant/    # AI 助手
│   │   ├── resource-center/ # 资源中心
│   │   ├── settings/        # 系统设置
│   │   └── teacher-portal/  # 教师工作台
│   ├── shared/              # 共享组件
│   │   ├── components/      # 通用组件
│   │   ├── models/          # 数据模型（TypeScript interfaces）
│   │   ├── pipes/           # 管道（格式化）
│   │   ├── directives/      # 指令
│   │   └── validators/      # 验证器
│   └── layout/              # 布局组件
│       ├── admin-layout/    # 管理员布局
│       ├── teacher-layout/  # 教师布局
│       └── common-layout/   # 通用布局
├── assets/                  # 静态资源
├── environments/            # 环境配置
│   ├── environment.ts       # 开发环境
│   └── environment.prod.ts  # 生产环境
└── styles/                  # 全局样式
```

---

## 核心数据流

### 1. 用户登录数据流

```
用户输入用户名密码
    ↓
前端: POST /api/v1/auth/login
    ↓
后端: 验证用户凭证
    ├─ 查询数据库（users 表）
    ├─ 验证密码哈希（bcrypt）
    ├─ 检查账户状态（锁定/停用）
    └─ 生成 JWT Token
    ↓
返回 Access Token + Refresh Token
    ↓
前端: 存储 Token，跳转到工作台首页
    ↓
后续请求: 携带 Authorization: Bearer <token>
```

### 2. 学员报名课程数据流

```
机构管理员在仪表板选择学员和课程
    ↓
前端: POST /api/v1/students/{id}/enroll
    │  { "course_id": "...", "class_id": "...", "hours": "..." }
    ↓
后端: 处理报名请求
    ├─ 验证机构权限
    ├─ 验证课程和班级是否存在
    ├─ 检查剩余名额
    ├─ 创建订单记录
    ├─ 为学员分配课时
    ├─ 记录审计日志
    └─ 发送通知
    ↓
返回: 报名成功 / 失败原因
```

### 3. 排课变更数据流

```
教务主管调整课程时间
    ↓
前端: PATCH /api/v1/schedules/{id}
    │  { "new_time": "...", "new_teacher_id": "...", "new_room_id": "..." }
    ↓
后端: 处理调课请求
    ├─ 检查时间冲突
    ├─ 更新排课记录
    ├─ 自动扣减课时
    ├─ 记录审计日志
    ├─ 通过 WebSocket 广播事件给机构内相关用户
    └─ 发送通知（站内 + 可选短信/邮件）
    ↓
前端: WebSocket 接收实时事件 → 更新 UI
    ↓
教师和家长: 在工作台和通知中心看到调课信息
```

### 4. AI 助手请求数据流

```
教师 / 管理员在仪表板使用 AI 功能
    ↓
前端: POST /api/v1/ai/...
    │  { "prompt": "...", "context": {...} }
    ↓
后端: 处理 AI 请求
    ├─ 检查机构 Token 余额
    ├─ 构建请求上下文
    ├─ 调用外部 AI API（如 OpenAI、Claude 等）
    ├─ 消耗 Token 计数
    ├─ 记录 Token 消耗日志
    └─ 整理返回结果
    ↓
返回: AI 生成的分析结果
```

### 5. OpenSciEd 资源代理数据流

```
教师浏览资源中心
    ↓
前端: GET /api/v1/resources?type=tutorial&page=1
    ↓
后端: 代理服务处理
    ├─ 检查机构是否启用 OpenSciEd 集成
    ├─ 检查 Redis 缓存是否有匹配响应
    │  ├─ 命中缓存 → 直接返回
    │  └─ 未命中缓存 → 转发请求到 OpenSciEd 上游 API
    ├─ 附加机构 API Key
    ├─ 记录请求日志（审计）
    └─ 将响应缓存并返回给前端
    ↓
返回: 资源列表（JSON）
```

---

## 设计原则

### 1. 关注点分离 (Separation of Concerns)

- 表示层、应用层、数据访问层、存储层职责清晰
- 每个模块有明确的边界和责任
- 组件之间通过明确定义的接口通信

### 2. 依赖倒置 (Dependency Inversion)

- 高层模块不依赖低层模块，二者都依赖抽象
- 抽象不依赖细节，细节依赖抽象
- 使用依赖注入（DI）管理对象生命周期

### 3. 可扩展性设计

- 模块间解耦，便于替换和扩展
- API 版本化设计（`/api/v1/...`）
- 功能开关配置驱动（Feature Flags）

### 4. 安全性第一

- 认证鉴权在所有 API 调用前验证
- 敏感数据加密存储
- 审计日志记录关键操作
- 遵循最小权限原则（Least Privilege）

### 5. 可观测性设计

- 结构化日志（JSON Logging）
- 请求 ID 全链路追踪
- 关键指标监控
- 错误告警

### 6. 面向失败的设计

- 外部服务调用超时和重试机制
- 数据库连接池和自动重连
- 熔断降级策略（上游服务不可用时的处理）
- 数据备份和回滚机制

### 7. 多租户隔离设计

- 机构数据 Schema 级隔离
- 机构配额限制（学员数上限、存储空间、Token 配额）
- 机构许可证功能开关

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，系统分层、模块架构、数据流和设计原则 |

---

**上一级**：[README.md](README.md)
