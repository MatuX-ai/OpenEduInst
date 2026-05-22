# OpenMTEduInst 培训机构管理系统 - 数据库设计

## 1. 数据库选型

- **主数据库**：PostgreSQL 15+（支持JSONB、全文检索）
- **缓存**：Redis 7+（会话、KPI缓存）
- **文件存储**：MinIO/S3（教学资源、课堂照片）

---

## 2. 核心表结构

### 2.1 机构与用户

```sql
-- 机构表（支持多校区）
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,           -- 机构名称
    type VARCHAR(20) NOT NULL,            -- 类型：training/k12/bureau
    address TEXT,                         -- 地址
    phone VARCHAR(20),                    -- 联系电话
    logo_url TEXT,                        -- Logo URL
    status VARCHAR(20) DEFAULT 'active',  -- active/inactive
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 校区表
CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,           -- 校区名称
    address TEXT,                         -- 详细地址
    manager_id UUID,                      -- 校区负责人ID
    status VARCHAR(20) DEFAULT 'operating', -- operating/preparing
    created_at TIMESTAMP DEFAULT NOW()
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    campus_id UUID REFERENCES campuses(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,            -- admin/director/teacher/consultant/parent
    full_name VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 教师档案表
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    level VARCHAR(20),                    -- senior/middle/junior
    specialty VARCHAR(100),               -- 专长：Arduino专家/Python导师
    hourly_rate DECIMAL(10, 2),           -- 课时费单价
    total_teaching_hours INT DEFAULT 0,   -- 累计授课时长
    rating DECIMAL(3, 2) DEFAULT 0,       -- 平均评分
    renewal_rate DECIMAL(5, 2) DEFAULT 0, -- 续费率
    satisfaction_rate DECIMAL(5, 2) DEFAULT 0, -- 满意度
    achievements JSONB,                   -- 荣誉记录
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 学员管理

```sql
-- 学员表
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    campus_id UUID REFERENCES campuses(id),
    name VARCHAR(50) NOT NULL,
    grade VARCHAR(20),                    -- 年级
    gender VARCHAR(10),                   -- male/female
    birth_date DATE,
    parent_name VARCHAR(50),
    parent_phone VARCHAR(20),
    enroll_date DATE,                     -- 入学日期
    status VARCHAR(20) DEFAULT 'active',  -- active/expiring/graduated
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 学员课程关联表
CREATE TABLE student_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    total_hours INT NOT NULL,             -- 总课时
    remaining_hours INT NOT NULL,         -- 剩余课时
    enrolled_at TIMESTAMP DEFAULT NOW(),
    expires_at DATE,                      -- 课程有效期
    status VARCHAR(20) DEFAULT 'active'   -- active/completed/expired
);

-- 学员荣誉表
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,          -- 荣誉名称
    type VARCHAR(20),                     -- competition/certification/award
    issued_by VARCHAR(100),               -- 颁发机构
    issue_date DATE,
    certificate_url TEXT,                 -- 证书图片
    created_at TIMESTAMP DEFAULT NOW()
);

-- 学员项目参与表
CREATE TABLE student_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    role VARCHAR(20),                     -- leader/member
    joined_at TIMESTAMP DEFAULT NOW(),
    contribution TEXT                     -- 贡献描述
);
```

### 2.3 招生线索

```sql
-- 线索表
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    parent_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    source VARCHAR(20),                   -- offline/referral/online/introduction
    interest_course VARCHAR(100),
    student_grade VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- pending/scheduled/enrolled/no_answer
    assigned_to UUID REFERENCES users(id), -- 负责顾问
    follow_up_time TIMESTAMP,             -- 下次跟进时间
    notes TEXT,                           -- 跟进记录
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 试听课预约表
CREATE TABLE trial_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    course_id UUID REFERENCES courses(id),
    scheduled_at TIMESTAMP NOT NULL,
    classroom_id UUID REFERENCES classrooms(id),
    teacher_id UUID REFERENCES teachers(id),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled/completed/cancelled
    feedback TEXT,                        -- 试听反馈
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 课程与排课

```sql
-- 课程表
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20),                 -- arduino/python/robotics/iot/ai
    description TEXT,
    price_per_hour DECIMAL(10, 2),        -- 每小时价格
    max_students INT,                     -- 最大学员数
    duration_weeks INT,                   -- 课程周期（周）
    total_hours INT,                      -- 总课时
    status VARCHAR(20) DEFAULT 'active',  -- active/inactive
    created_at TIMESTAMP DEFAULT NOW()
);

-- 教室表
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id),
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,                -- 容量
    equipment JSONB,                      -- 设备清单
    status VARCHAR(20) DEFAULT 'available'
);

-- 课表安排
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    teacher_id UUID REFERENCES teachers(id),
    classroom_id UUID REFERENCES classrooms(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    day_of_week INT,                      -- 1-7 (周一到周日)
    max_students INT,
    enrolled_students INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled/completed/cancelled
    created_at TIMESTAMP DEFAULT NOW()
);

-- 签到记录
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id),
    student_id UUID REFERENCES students(id),
    check_in_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'present', -- present/absent/late
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 项目管理

```sql
-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20),                 -- iot/ai/robotics
    instructor_id UUID REFERENCES teachers(id),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning', -- planning/ongoing/completed
    progress INT DEFAULT 0,               -- 进度百分比
    milestones JSONB,                     -- 里程碑数组
    technologies TEXT[],                  -- 技术栈标签
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目作品表
CREATE TABLE project_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    title VARCHAR(200),
    description TEXT,
    files JSONB,                          -- 作品文件（代码/图片/视频）
    submitted_at TIMESTAMP DEFAULT NOW(),
    score DECIMAL(3, 2),                  -- 评分
    feedback TEXT                         -- 教师评语
);
```

### 2.6 教学资源

```sql
-- 资源表
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    category VARCHAR(20),                 -- arduino/python/robotics/iot
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20),                     -- ppt/pdf/video/code
    format VARCHAR(10),                   -- PPT/PDF/MP4/ZIP/PY/INO
    file_url TEXT NOT NULL,
    file_size BIGINT,                     -- 文件大小（字节）
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    download_count INT DEFAULT 0,
    tags TEXT[],                          -- 标签
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 下载记录
CREATE TABLE resource_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id),
    user_id UUID REFERENCES users(id),
    downloaded_at TIMESTAMP DEFAULT NOW()
);
```

### 2.7 竞赛认证

```sql
-- 赛事表
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(200) NOT NULL,
    organizer VARCHAR(100),               -- 主办方
    level VARCHAR(20),                    -- national/provincial/international
    category VARCHAR(20),                 -- robotics/programming/maker
    register_deadline DATE,
    competition_date DATE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',    -- open/preparing/closed/completed
    created_at TIMESTAMP DEFAULT NOW()
);

-- 参赛报名表
CREATE TABLE competition_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES competitions(id),
    student_id UUID REFERENCES students(id),
    registered_at TIMESTAMP DEFAULT NOW(),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending/paid/refunded
    result VARCHAR(20),                   -- gold/silver/bronze/participation
    certificate_url TEXT
);

-- 等级考试表
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(200) NOT NULL,
    organizer VARCHAR(100),
    type VARCHAR(20),                     -- python/arduino/ai
    levels TEXT[],                        -- 级别数组
    next_exam_date DATE,
    pass_rate DECIMAL(5, 2),              -- 通过率
    created_at TIMESTAMP DEFAULT NOW()
);

-- 考级报名表
CREATE TABLE certification_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id UUID REFERENCES certifications(id),
    student_id UUID REFERENCES students(id),
    level VARCHAR(20),                    -- 报考级别
    registered_at TIMESTAMP DEFAULT NOW(),
    exam_result VARCHAR(20),              -- passed/failed/pending
    certificate_url TEXT
);
```

### 2.8 营销活动

```sql
-- 营销活动表
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20),                     -- group_buy/referral/coupon
    description TEXT,
    start_date DATE,
    end_date DATE,
    target_participants INT,              -- 目标参与人数
    current_participants INT DEFAULT 0,
    conversion_rate DECIMAL(5, 2),        -- 转化率
    revenue_generated DECIMAL(12, 2) DEFAULT 0, -- 带来营收
    status VARCHAR(20) DEFAULT 'active',  -- active/upcoming/ended
    created_at TIMESTAMP DEFAULT NOW()
);

-- 优惠券表
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    code VARCHAR(50) UNIQUE NOT NULL,     -- 优惠码
    name VARCHAR(100),
    discount_type VARCHAR(20),            -- fixed/percentage
    discount_value DECIMAL(10, 2),        -- 优惠金额或折扣
    min_purchase DECIMAL(10, 2),          -- 最低消费
    total_quantity INT,
    used_quantity INT DEFAULT 0,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 优惠券领取记录
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id),
    user_id UUID REFERENCES users(id),
    redeemed_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP,                    -- 使用时间
    order_id UUID                         -- 关联订单
);
```

### 2.9 财务管理

```sql
-- 订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    student_id UUID REFERENCES students(id),
    order_type VARCHAR(20),               -- enrollment/renewal/token
    amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    final_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20),           -- wechat/alipay/bank
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending/paid/refunded
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 账单表（消课记录）
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    course_id UUID REFERENCES courses(id),
    hours_consumed INT NOT NULL,          -- 消耗课时
    amount DECIMAL(10, 2) NOT NULL,
    consumption_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/paid
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 教师工资表
CREATE TABLE teacher_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id),
    month DATE NOT NULL,                  -- 工资月份
    teaching_hours INT,                   -- 授课时长
    hourly_rate DECIMAL(10, 2),           -- 课时单价
    base_salary DECIMAL(10, 2) DEFAULT 0, -- 底薪
    bonus DECIMAL(10, 2) DEFAULT 0,       -- 奖金
    total_amount DECIMAL(12, 2),          -- 应发总额
    status VARCHAR(20) DEFAULT 'pending', -- pending/approved/paid
    approved_by UUID REFERENCES users(id),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.10 Token计费

```sql
-- Token账户表
CREATE TABLE token_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    balance INT NOT NULL DEFAULT 0,       -- 余额
    total_recharged INT DEFAULT 0,        -- 累计充值
    total_consumed INT DEFAULT 0,         -- 累计消耗
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Token充值记录
CREATE TABLE token_recharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES token_accounts(id),
    amount INT NOT NULL,                  -- 充值点数
    price DECIMAL(10, 2),                 -- 支付金额
    payment_method VARCHAR(20),
    recharged_at TIMESTAMP DEFAULT NOW()
);

-- Token消耗记录
CREATE TABLE token_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES token_accounts(id),
    service_type VARCHAR(20),             -- ai_assistant/evaluation/generation/review
    amount INT NOT NULL,                  -- 消耗点数
    related_id UUID,                      -- 关联业务ID
    related_type VARCHAR(20),             -- 关联业务类型
    consumed_at TIMESTAMP DEFAULT NOW()
);
```

### 2.11 消息通知

```sql
-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20),                     -- approval/renewal/activity/system
    title VARCHAR(200) NOT NULL,
    content TEXT,
    priority VARCHAR(10) DEFAULT 'normal', -- urgent/high/normal/low
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,                      -- 点击跳转链接
    action_label VARCHAR(50),             -- 操作按钮文字
    created_at TIMESTAMP DEFAULT NOW()
);

-- 设备表
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20),                 -- arduino/raspberry/sensor/printer
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    usage_rate DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'normal',  -- normal/maintenance/low_stock
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 设备借用记录
CREATE TABLE device_borrowings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    borrower_id UUID REFERENCES users(id),
    borrowed_at TIMESTAMP DEFAULT NOW(),
    returned_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'borrowed', -- borrowed/returned/overdue
    notes TEXT
);
```

---

## 3. 索引优化

```sql
-- 常用查询字段索引
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX idx_schedules_time ON schedules(start_time, end_time);
CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_competitions_deadline ON competitions(register_deadline);

-- 复合索引
CREATE INDEX idx_student_courses_active ON student_courses(student_id, status) WHERE status = 'active';
CREATE INDEX idx_schedules_conflict ON schedules(teacher_id, start_time, end_time);
```

---

## 4. 视图与统计

```sql
-- 学员课时统计视图
CREATE VIEW v_student_hours AS
SELECT 
    s.id as student_id,
    s.name,
    SUM(sc.total_hours) as total_hours,
    SUM(sc.remaining_hours) as remaining_hours,
    COUNT(CASE WHEN sc.status = 'active' THEN 1 END) as active_courses
FROM students s
LEFT JOIN student_courses sc ON s.id = sc.student_id
GROUP BY s.id, s.name;

-- 教师绩效统计视图
CREATE VIEW v_teacher_performance AS
SELECT 
    t.id as teacher_id,
    t.full_name,
    t.level,
    COUNT(DISTINCT sch.id) as total_classes,
    SUM(EXTRACT(EPOCH FROM (sch.end_time - sch.start_time)) / 3600) as teaching_hours,
    AVG(t.rating) as avg_rating,
    COUNT(DISTINCT att.student_id) as unique_students
FROM teachers t
LEFT JOIN schedules sch ON t.id = sch.teacher_id
LEFT JOIN attendances att ON sch.id = att.schedule_id
GROUP BY t.id, t.full_name, t.level;

-- 月度营收统计视图
CREATE VIEW v_monthly_revenue AS
SELECT 
    DATE_TRUNC('month', o.paid_at) as month,
    SUM(o.final_amount) as total_revenue,
    COUNT(*) as order_count,
    AVG(o.final_amount) as avg_order_value
FROM orders o
WHERE o.payment_status = 'paid'
GROUP BY DATE_TRUNC('month', o.paid_at)
ORDER BY month DESC;
```

---

## 5. 数据字典说明

### 状态枚举值

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `student.status` | active/expiring/graduated | 在读/即将到期/已结课 |
| `lead.status` | pending/scheduled/enrolled/no_answer | 待跟进/已预约/已报名/未接通 |
| `project.status` | planning/ongoing/completed | 规划中/进行中/已完成 |
| `schedule.status` | scheduled/completed/cancelled | 已安排/已完成/已取消 |
| `order.payment_status` | pending/paid/refunded | 待支付/已支付/已退款 |
| `notification.priority` | urgent/high/normal/low | 紧急/高/普通/低 |

---

**设计版本：** V1.0  
**最后更新：** 2026-05-22  
**数据库架构师：** Lingma AI Assistant
