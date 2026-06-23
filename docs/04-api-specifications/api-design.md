# REST API 接口设计

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ API 设计完成

---

## 目录

1. [通用规范](#通用规范)
2. [认证与用户管理 API](#认证与用户管理-api)
3. [学员管理 API](#学员管理-api)
4. [课程与班级管理 API](#课程与班级管理-api)
5. [排课与考勤管理 API](#排课与考勤管理-api)
6. [财务订单管理 API](#财务订单管理-api)
7. [AI 助手 API](#ai-助手-api)
8. [OpenSciEd 资源 API](#openscied-资源-api)
9. [版本历史](#版本历史)

---

## 通用规范

### 响应格式

所有 API 响应遵循以下统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1750680000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | integer | 0=成功，非 0=错误码 |
| message | string | 结果描述，成功时为 "success" |
| data | object/array | 响应数据主体 |
| timestamp | integer | 服务器时间戳 (秒) |

### 错误响应

```json
{
  "code": 40001,
  "message": "认证失败",
  "detail": "Invalid or expired JWT token",
  "data": null,
  "timestamp": 1750680000
}
```

### 错误码说明

| 错误码范围 | 类别 |
|------------|------|
| 0 | 成功 |
| 1000-1999 | 请求参数错误 |
| 2000-2999 | 认证与授权错误 |
| 3000-3999 | 业务逻辑错误 |
| 4000-4999 | 资源不存在 |
| 5000-5999 | 服务器内部错误 |

### 请求头规范

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
X-Institution-ID: <institution-uuid>  // 可选，从 Token 中解析
```

### 分页参数

列表接口统一使用以下分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码，从 1 开始 |
| page_size | integer | 20 | 每页条数，最大 100 |
| sort_by | string | created_at | 排序字段 |
| sort_order | string | desc | 排序方向 (asc/desc) |
| search | string | - | 搜索关键字 |

### 分页响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

## 认证与用户管理 API

### 登录

```
POST /api/v1/auth/login

请求:
{
  "email": "admin@school.edu",
  "password": "Password123"
}

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@school.edu",
      "name": "张管理",
      "role": "admin",
      "institution_id": "550e8400-e29b-41d4-a716-446655440001",
      "institution_name": "阳光教育机构",
      "license_plan": "standard",
      "license_expires_at": "2027-06-23T12:00:00Z"
    }
  }
}
```

### 刷新 Token

```
POST /api/v1/auth/refresh

请求:
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "<new_jwt_token>",
    "refresh_token": "<new_refresh_token>",
    "token_type": "bearer",
    "expires_in": 7200
  }
}
```

### 登出

```
POST /api/v1/auth/logout
需要认证: admin, operator, teacher, finance, parent

响应: 204 No Content
```

### 获取当前用户信息

```
GET /api/v1/auth/me
需要认证: admin, operator, teacher, finance, parent

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@school.edu",
    "name": "张管理",
    "role": "admin",
    "institution_id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### 创建机构用户

```
POST /api/v1/users
需要认证: admin

请求:
{
  "email": "teacher1@school.edu",
  "name": "李老师",
  "password": "Temp@1234",
  "role": "teacher",
  "phone": "13800138001"
}

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "email": "teacher1@school.edu",
    "name": "李老师",
    "role": "teacher",
    "is_active": true,
    "created_at": "2026-06-23T12:00:00Z"
  }
}
```

### 获取用户列表

```
GET /api/v1/users?page=1&page_size=20&role=teacher&search=李
需要认证: admin

响应 (分页格式)
```

---

## 学员管理 API

### 创建学员

```
POST /api/v1/students
需要认证: admin, operator

请求:
{
  "name": "小明",
  "english_name": "Tom",
  "gender": "male",
  "birth_date": "2018-05-15",
  "phone": "13812345678",
  "email": "parent@example.com",
  "school": "阳光小学",
  "grade": "三年级",
  "parent_name": "王先生",
  "parent_phone": "13987654321",
  "address": "北京市朝阳区...",
  "notes": "性格活泼，动手能力强"
}

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "小明",
    "student_no": "STU2026060001",
    "status": "active",
    "created_at": "2026-06-23T12:00:00Z"
  }
}
```

### 获取学员列表

```
GET /api/v1/students?page=1&page_size=20&status=active&search=小明
需要认证: admin, operator, teacher
```

### 获取单个学员详情

```
GET /api/v1/students/:student_id
需要认证: admin, operator, teacher
```

### 更新学员信息

```
PUT /api/v1/students/:student_id
需要认证: admin, operator
```

### 删除学员

```
DELETE /api/v1/students/:student_id
需要认证: admin
```

### 学员报名课程

```
POST /api/v1/students/:student_id/enrollments
需要认证: admin, operator

请求:
{
  "course_id": "550e8400-e29b-41d4-a716-446655440030",
  "enrollment_date": "2026-06-23",
  "amount": 3600,
  "payment_method": "cash",
  "notes": "暑期 STEM 课程"
}
```

---

## 课程与班级管理 API

### 创建课程

```
POST /api/v1/courses
需要认证: admin

请求:
{
  "name": "初级机器人 STEM 课程",
  "code": "ROBO-101",
  "category": "robotics",
  "description": "学习基础机器人搭建与编程",
  "duration_hours": 48,
  "price": 3600,
  "age_range": "7-10岁",
  "max_students_per_class": 15,
  "is_active": true,
  "curriculum": "基于 OpenSciEd 资源开发..."
}
```

### 创建班级

```
POST /api/v1/classes
需要认证: admin, operator

请求:
{
  "course_id": "550e8400-e29b-41d4-a716-446655440030",
  "name": "机器人初级班 (2026 暑期)",
  "teacher_ids": ["550e8400-e29b-41d4-a716-446655440010"],
  "classroom": "A201 教室",
  "start_date": "2026-07-01",
  "end_date": "2026-08-15",
  "max_students": 15,
  "schedule_pattern": "weekly_mon_wed"
}
```

---

## 排课与考勤管理 API

### 创建排课

```
POST /api/v1/schedules
需要认证: admin, operator

请求:
{
  "class_id": "550e8400-e29b-41d4-a716-446655440040",
  "class_date": "2026-07-01",
  "start_time": "09:00",
  "end_time": "11:00",
  "teacher_id": "550e8400-e29b-41d4-a716-446655440010",
  "classroom": "A201 教室",
  "topic": "第一课: 认识机器人"
}
```

### 标记考勤

```
POST /api/v1/schedules/:schedule_id/attendance
需要认证: admin, operator, teacher

请求:
{
  "attendance_records": [
    {"student_id": "uuid1", "status": "present"},
    {"student_id": "uuid2", "status": "absent"},
    {"student_id": "uuid3", "status": "late", "notes": "迟到 15 分钟"}
  ]
}
```

---

## 财务订单管理 API

### 创建订单

```
POST /api/v1/orders
需要认证: admin, finance

请求:
{
  "student_id": "550e8400-e29b-41d4-a716-446655440020",
  "items": [
    {
      "type": "course_enrollment",
      "description": "机器人初级班 (2026 暑期)",
      "amount": 3600,
      "course_id": "550e8400-e29b-41d4-a716-446655440030",
      "class_id": "550e8400-e29b-41d4-a716-446655440040"
    }
  ],
  "payment_method": "cash",
  "notes": "现金支付"
}
```

### 退款

```
POST /api/v1/orders/:order_id/refund
需要认证: admin, finance

请求:
{
  "reason": "学员退费",
  "refund_amount": 3600,
  "notes": "家庭原因退课"
}
```

---

## AI 助手 API

### 发送消息

```
POST /api/v1/ai/chat
需要认证: admin, operator, teacher

请求:
{
  "message": "帮我设计一节关于机械臂的课堂活动",
  "context": {
    "topic": "机器人 - 机械臂原理",
    "grade_level": "3-5",
    "duration_minutes": 60
  },
  "conversation_id": "optional-existing-conversation-id"
}

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440050",
    "message_id": "550e8400-e29b-41d4-a716-446655440051",
    "reply": "好的！以下是一个关于机械臂的 60 分钟课堂活动设计...",
    "suggested_resources": [
      {"type": "openscied", "title": "机械原理入门", "url": "/resources/xxx"}
    ],
    "tokens_used": 256
  }
}
```

---

## OpenSciEd 资源 API

### 搜索资源

```
GET /api/v1/resources?keyword=机械臂&grade_level=3-5&type=lesson_plan&page=1
需要认证: admin, operator, teacher

响应:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "res-001",
        "title": "机械臂原理与应用",
        "type": "lesson_plan",
        "grade_level": "3-5",
        "description": "一堂关于机械臂工作原理的课程",
        "duration_minutes": 60,
        "materials": ["硬纸板", "橡皮筋", "木棍"],
        "source": "openscied"
      }
    ],
    "total": 45,
    "page": 1,
    "page_size": 20
  }
}
```

### 获取资源详情

```
GET /api/v1/resources/:resource_id
需要认证: admin, operator, teacher
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，统一响应格式、认证接口、学员、课程、排课、财务、AI 助手、资源 API 规格 |

---

**上一级**：[README.md](README.md)
