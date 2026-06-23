# 数据库 Schema 设计

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 设计完成

---

## 目录

1. [Schema 架构](#schema-架构)
2. [全局表 (public schema)](#全局表-public-schema)
3. [机构业务表 (institution schema)](#机构业务表-institution-schema)
4. [核心表结构](#核心表结构)
5. [数据库版本历史](#数据库版本历史)

---

## Schema 架构

```
database: platform_db
├── public schema (全局系统表)
│   ├── institutions
│   ├── institution_licenses
│   ├── users (系统管理员)
│   ├── audit_logs
│   └── global_settings
│
└── inst_{institution_id} (每个机构一个 schema)
    ├── users (机构内用户)
    ├── students
    ├── teachers
    ├── courses
    ├── classes
    ├── schedules
    ├── enrollments
    ├── orders
    ├── attendance_records
    ├── ai_conversations
    └── institution_settings
```

---

## 全局表 (public schema)

### 机构表 (institutions)

```sql
CREATE TABLE public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    type VARCHAR(50) NOT NULL,  -- training_school / after_school / maker_space
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    website VARCHAR(200),
    logo_url VARCHAR(500),
    description TEXT,
    schema_name VARCHAR(100) NOT NULL UNIQUE,  -- inst_{uuid}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 许可证表 (institution_licenses)

```sql
CREATE TABLE public.institution_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id),
    plan VARCHAR(50) NOT NULL,  -- trial / standard / enterprise / community
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / expired / suspended
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- 资源配额
    max_students INTEGER NOT NULL,
    max_teachers INTEGER NOT NULL,
    max_storage_gb NUMERIC(10,2) NOT NULL,
    max_ai_tokens_monthly INTEGER NOT NULL,
    max_concurrent_connections INTEGER NOT NULL,

    -- 功能开关
    features JSONB NOT NULL DEFAULT '{}',
    -- { "ai_assistant": true, "backup": true, "websocket_sync": true, ... }

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_license_institution (institution_id),
    INDEX idx_license_status (status)
);
```

### 系统用户表 (public.users)

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- sys_admin
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 审计日志表 (public.audit_logs)

```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id UUID,
    institution_id UUID,
    action VARCHAR(100) NOT NULL,  -- user.create / order.refund / ...
    target_type VARCHAR(50),
    target_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes JSONB,
    result VARCHAR(20) NOT NULL,  -- success / failed
    error_message TEXT,

    INDEX idx_audit_timestamp (timestamp DESC),
    INDEX idx_audit_action (action),
    INDEX idx_audit_institution (institution_id)
);
```

---

## 机构业务表 (institution schema)

### 机构用户表 (users)

```sql
CREATE TABLE {schema_name}.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- admin / operator / teacher / finance / parent
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (email)
);
```

### 学员表 (students)

```sql
CREATE TABLE {schema_name}.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    gender VARCHAR(10),
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    school VARCHAR(200),
    grade VARCHAR(50),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',  -- active / suspended / graduated

    -- 相关账户
    parent_user_id UUID REFERENCES {schema_name}.users(id),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_name (name),
    INDEX idx_student_status (status)
);
```

### 课程表 (courses)

```sql
CREATE TABLE {schema_name}.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),  -- robotics / programming / science / art
    description TEXT,
    curriculum TEXT,
    duration_hours INTEGER,
    price NUMERIC(10,2),
    age_range VARCHAR(50),
    max_students_per_class INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_course_category (category)
);
```

### 班级表 (classes)

```sql
CREATE TABLE {schema_name}.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES {schema_name}.courses(id),
    name VARCHAR(200) NOT NULL,
    classroom VARCHAR(100),
    start_date DATE,
    end_date DATE,
    max_students INTEGER,
    status VARCHAR(20) DEFAULT 'active',  -- active / completed / suspended
    schedule_pattern VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_class_course (course_id),
    INDEX idx_class_status (status)
);
```

### 班级-教师关联表 (class_teachers)

```sql
CREATE TABLE {schema_name}.class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES {schema_name}.classes(id) ON DELETE CASCADE,
    teacher_user_id UUID NOT NULL REFERENCES {schema_name}.users(id),
    role VARCHAR(20) DEFAULT 'main_teacher',  -- main_teacher / assistant
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (class_id, teacher_user_id)
);
```

### 排课表 (schedules)

```sql
CREATE TABLE {schema_name}.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES {schema_name}.classes(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_user_id UUID REFERENCES {schema_name}.users(id),
    classroom VARCHAR(100),
    topic VARCHAR(500),
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled / in_progress / completed / cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_schedule_class (class_id),
    INDEX idx_schedule_date (class_date)
);
```

### 报名表 (enrollments)

```sql
CREATE TABLE {schema_name}.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES {schema_name}.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES {schema_name}.classes(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active / completed / dropped / transferred
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (student_id, class_id),
    INDEX idx_enrollment_student (student_id),
    INDEX idx_enrollment_class (class_id)
);
```

### 考勤记录表 (attendance_records)

```sql
CREATE TABLE {schema_name}.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES {schema_name}.schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES {schema_name}.students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,  -- present / absent / late / excused
    checkin_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (schedule_id, student_id),
    INDEX idx_attendance_schedule (schedule_id),
    INDEX idx_attendance_student (student_id)
);
```

### 订单表 (orders)

```sql
CREATE TABLE {schema_name}.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) NOT NULL UNIQUE,
    student_id UUID REFERENCES {schema_name}.students(id),
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50),  -- cash / wechat / alipay / bank_transfer
    payment_status VARCHAR(20) DEFAULT 'pending',  -- pending / paid / partially_refunded / refunded
    status VARCHAR(20) DEFAULT 'confirmed',  -- confirmed / cancelled
    notes TEXT,
    created_by UUID REFERENCES {schema_name}.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order_student (student_id),
    INDEX idx_order_status (status),
    INDEX idx_order_created (created_at)
);
```

### 订单项表 (order_items)

```sql
CREATE TABLE {schema_name}.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES {schema_name}.orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- course_enrollment / material / other
    description TEXT,
    amount NUMERIC(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    course_id UUID REFERENCES {schema_name}.courses(id),
    class_id UUID REFERENCES {schema_name}.classes(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 退款记录表 (refund_records)

```sql
CREATE TABLE {schema_name}.refund_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES {schema_name}.orders(id),
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT,
    notes TEXT,
    refunded_by UUID REFERENCES {schema_name}.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### AI 对话表 (ai_conversations)

```sql
CREATE TABLE {schema_name}.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES {schema_name}.users(id),
    title VARCHAR(200),
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ai_user (user_id)
);
```

### AI 消息表 (ai_messages)

```sql
CREATE TABLE {schema_name}.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES {schema_name}.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- user / assistant
    content TEXT NOT NULL,
    tokens_used INTEGER,
    suggested_resources JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_msg_conversation (conversation_id)
);
```

### 数据备份表 (backups)

```sql
CREATE TABLE {schema_name}.backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,  -- manual / auto
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),
    file_size_bytes BIGINT,
    schema_snapshot JSONB,  -- 备份时的 Schema 版本信息
    status VARCHAR(20) DEFAULT 'completed',  -- in_progress / completed / failed
    notes TEXT,
    created_by UUID REFERENCES {schema_name}.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_backup_created (created_at DESC)
);
```

---

## 核心表结构

### Schema 路由机制

```
每次请求的处理流程:
1. 从 JWT Token 解析出 institution_id
2. 根据 institution_id 找到对应的 schema_name
3. 将数据库连接的 search_path 设置为该 schema_name
4. 所有 SQL 查询自动作用于该机构的 Schema
5. public schema 作为搜索路径的 fallback (查询系统表)
```

### 示例: 数据隔离的保证

```sql
-- 创建新机构时动态生成 Schema
CREATE SCHEMA inst_550e8400e29b41d4a716446655440001;

-- 使用模板创建新机构的数据表结构
-- 所有业务表按照机构 Schema 独立创建，确保数据物理隔离

-- 查询时自动路由:
SET search_path TO inst_550e8400e29b41d4a716446655440001, public;

-- 查询当前机构的学员 (自动路由到该机构的 students 表)
SELECT * FROM students;

-- 查询全局许可证表 (自动路由到 public)
SELECT * FROM public.institution_licenses WHERE institution_id = ...;
```

---

## 数据库版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，完成核心业务表结构设计，含多租户 Schema 隔离 |

---

**上一级**：[README.md](README.md)
