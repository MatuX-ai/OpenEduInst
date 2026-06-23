# OpenMTEduInst 培训机构管理系统 - API接口规范

## 1. 接口概述

### 1.1 基础信息
- **Base URL**: `https://api.openmt-edu.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Bearer Token

### 1.2 通用响应格式

**成功响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**错误响应：**
```json
{
  "code": 400,
  "message": "参数错误",
  "error": {
    "field": "phone",
    "detail": "手机号格式不正确"
  }
}
```

### 1.3 分页参数

所有列表接口支持分页：
```
GET /api/students?page=1&pageSize=20&sortBy=enroll_date&order=desc
```

响应包含分页信息：
```json
{
  "code": 200,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

---

## 2. 认证接口

### 2.1 用户登录

**POST** `/auth/login`

**请求体：**
```json
{
  "username": "admin",
  "password": "encrypted_password"
}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "username": "admin",
      "role": "admin",
      "full_name": "赵校长"
    }
  }
}
```

### 2.2 刷新Token

**POST** `/auth/refresh`

**请求头：**
```
Authorization: Bearer <refresh_token>
```

---

## 3. 学员管理接口

### 3.1 获取学员列表

**GET** `/students`

**查询参数：**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20，最大100）
- `status`: 状态筛选（active/expiring/graduated）
- `grade`: 年级筛选
- `keyword`: 搜索关键词（姓名/电话）

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "王小明",
        "grade": "五年级",
        "parent_phone": "138****5678",
        "enroll_date": "2025-09-01",
        "status": "active",
        "courses": [
          {
            "course_name": "Arduino基础",
            "remaining_hours": 24,
            "total_hours": 48
          }
        ],
        "achievements_count": 3,
        "projects_count": 5
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 328,
      "totalPages": 17
    }
  }
}
```

### 3.2 创建学员

**POST** `/students`

**请求体：**
```json
{
  "name": "李小红",
  "grade": "六年级",
  "gender": "female",
  "birth_date": "2014-05-15",
  "parent_name": "李女士",
  "parent_phone": "13912345678",
  "enroll_date": "2026-05-22"
}
```

**响应：**
```json
{
  "code": 201,
  "message": "学员创建成功",
  "data": {
    "id": "uuid",
    "name": "李小红"
  }
}
```

### 3.3 获取学员详情

**GET** `/students/{id}`

**响应：**
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "name": "王小明",
    "grade": "五年级",
    "parent_name": "王先生",
    "parent_phone": "13812345678",
    "enroll_date": "2025-09-01",
    "status": "active",
    "courses": [
      {
        "id": "uuid",
        "name": "Arduino基础",
        "instructor": "张老师",
        "progress": 85,
        "remaining_hours": 8,
        "total_hours": 48,
        "next_class": "2026-05-25T14:00:00Z"
      }
    ],
    "achievements": [
      {
        "title": "蓝桥杯三等奖",
        "type": "competition",
        "issued_by": "工业和信息化部人才交流中心",
        "issue_date": "2026-05-10",
        "certificate_url": "https://..."
      }
    ],
    "projects": [
      {
        "id": "uuid",
        "name": "智能温室控制系统",
        "status": "ongoing",
        "progress": 75,
        "category": "IoT"
      }
    ],
    "attendance_rate": 95.5,
    "avg_rating": 4.8
  }
}
```

### 3.4 更新学员信息

**PUT** `/students/{id}`

**请求体：**
```json
{
  "parent_phone": "13912345678",
  "grade": "六年级"
}
```

### 3.5 批量导入学员

**POST** `/students/import`

**Content-Type**: `multipart/form-data`

**请求体：**
- `file`: Excel文件（.xlsx）

**响应：**
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "success_count": 45,
    "failed_count": 2,
    "errors": [
      {
        "row": 12,
        "reason": "手机号格式错误"
      }
    ]
  }
}
```

---

## 4. 招生线索接口

### 4.1 获取线索列表

**GET** `/leads`

**查询参数：**
- `status`: 状态筛选（pending/scheduled/enrolled/no_answer）
- `source`: 来源筛选（offline/referral/online/introduction）
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "parent_name": "刘家长",
        "phone": "138****5678",
        "source": "offline",
        "interest_course": "Arduino基础班",
        "student_grade": "四年级",
        "status": "pending",
        "assigned_to": {
          "id": "uuid",
          "name": "张顾问"
        },
        "follow_up_time": "2026-05-23T10:00:00Z",
        "created_at": "2026-05-22T09:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### 4.2 创建线索

**POST** `/leads`

**请求体：**
```json
{
  "parent_name": "陈家长",
  "phone": "13912345678",
  "source": "referral",
  "interest_course": "机器人进阶班",
  "student_grade": "五年级",
  "notes": "老学员推荐，意向强烈"
}
```

### 4.3 更新线索状态

**PATCH** `/leads/{id}/status`

**请求体：**
```json
{
  "status": "scheduled",
  "follow_up_time": "2026-05-24T14:00:00Z",
  "notes": "已预约周六试听课"
}
```

### 4.4 获取转化统计

**GET** `/leads/statistics`

**响应：**
```json
{
  "code": 200,
  "data": {
    "total_leads": 158,
    "by_source": [
      { "source": "offline", "count": 45, "conversion_rate": 32 },
      { "source": "referral", "count": 38, "conversion_rate": 68 },
      { "source": "online", "count": 52, "conversion_rate": 28 },
      { "source": "introduction", "count": 23, "conversion_rate": 55 }
    ],
    "by_status": {
      "pending": 15,
      "scheduled": 28,
      "enrolled": 42,
      "no_answer": 8
    },
    "overall_conversion_rate": 42
  }
}
```

---

## 5. 课程与排课接口

### 5.1 获取课表

**GET** `/schedules`

**查询参数：**
- `startDate`: 开始日期（YYYY-MM-DD）
- `endDate`: 结束日期
- `teacher_id`: 教师ID（可选）
- `classroom_id`: 教室ID（可选）

**响应：**
```json
{
  "code": 200,
  "data": [
    {
      "id": "uuid",
      "course": {
        "id": "uuid",
        "name": "Arduino传感器实战"
      },
      "teacher": {
        "id": "uuid",
        "name": "张老师"
      },
      "classroom": {
        "id": "uuid",
        "name": "创客空间 A区"
      },
      "start_time": "2026-05-25T09:00:00Z",
      "end_time": "2026-05-25T10:30:00Z",
      "enrolled_students": 20,
      "max_students": 25,
      "status": "scheduled"
    }
  ]
}
```

### 5.2 创建课程安排

**POST** `/schedules`

**请求体：**
```json
{
  "course_id": "uuid",
  "teacher_id": "uuid",
  "classroom_id": "uuid",
  "start_time": "2026-05-25T09:00:00Z",
  "end_time": "2026-05-25T10:30:00Z",
  "max_students": 25
}
```

**响应：**
```json
{
  "code": 201,
  "message": "课程安排成功",
  "data": {
    "id": "uuid"
  }
}
```

### 5.3 签到

**POST** `/schedules/{id}/attendance`

**请求体：**
```json
{
  "student_id": "uuid",
  "status": "present"
}
```

---

## 6. 项目管理接口

### 6.1 获取项目列表

**GET** `/projects`

**查询参数：**
- `status`: 状态筛选（planning/ongoing/completed）
- `category`: 类别筛选（iot/ai/robotics）

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "智能温室控制系统",
        "category": "IoT",
        "instructor": {
          "id": "uuid",
          "name": "张老师"
        },
        "students_count": 18,
        "status": "ongoing",
        "progress": 75,
        "start_date": "2026-04-15",
        "end_date": "2026-06-15",
        "technologies": ["Arduino", "DHT11", "继电器", "LCD显示"]
      }
    ],
    "pagination": { ... }
  }
}
```

### 6.2 创建项目

**POST** `/projects`

**请求体：**
```json
{
  "name": "AI视觉识别小车",
  "category": "AI",
  "instructor_id": "uuid",
  "description": "基于Python + OpenCV实现颜色识别",
  "start_date": "2026-06-01",
  "end_date": "2026-08-01",
  "milestones": [
    { "name": "环境搭建", "due_date": "2026-06-10" },
    { "name": "图像采集", "due_date": "2026-06-25" },
    { "name": "算法开发", "due_date": "2026-07-15" },
    { "name": "实车测试", "due_date": "2026-07-25" },
    { "name": "成果展示", "due_date": "2026-08-01" }
  ],
  "technologies": ["Python", "OpenCV", "树莓派", "摄像头模块"]
}
```

### 6.3 更新项目进度

**PATCH** `/projects/{id}/progress`

**请求体：**
```json
{
  "milestone_index": 2,
  "completed": true,
  "completion_date": "2026-07-15"
}
```

---

## 7. 财务接口

### 7.1 获取账单列表

**GET** `/bills`

**查询参数：**
- `status`: 状态筛选（pending/confirmed/paid）
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "student": {
          "id": "uuid",
          "name": "王小明"
        },
        "course": "Arduino基础",
        "hours_consumed": 8,
        "amount": 640,
        "consumption_date": "2026-05-20",
        "status": "pending"
      }
    ],
    "pagination": { ... }
  }
}
```

### 7.2 确认账单

**POST** `/bills/{id}/confirm`

**响应：**
```json
{
  "code": 200,
  "message": "账单已确认"
}
```

### 7.3 获取营收统计

**GET** `/finance/revenue-statistics`

**查询参数：**
- `period`: 时间周期（month/quarter/year）
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应：**
```json
{
  "code": 200,
  "data": {
    "total_revenue": 125000,
    "by_type": {
      "course_fee": 82000,
      "device_rent": 18000,
      "token_recharge": 25000
    },
    "monthly_trend": [
      { "month": "2026-01", "revenue": 122000 },
      { "month": "2026-02", "revenue": 125000 }
    ],
    "growth_rate": 8.3
  }
}
```

---

## 8. 消息通知接口

### 8.1 获取通知列表

**GET** `/notifications`

**查询参数：**
- `type`: 类型筛选（approval/renewal/activity/system）
- `is_read`: 是否已读（true/false）
- `page`: 页码
- `pageSize`: 每页数量

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "approval",
        "title": "新课开设申请待审批",
        "content": "张老师提交了《ESP32物联网开发》新课开设申请",
        "priority": "high",
        "is_read": false,
        "action_url": "/approvals/123",
        "action_label": "去审批",
        "created_at": "2026-05-22T10:00:00Z"
      }
    ],
    "pagination": { ... },
    "unread_count": 3
  }
}
```

### 8.2 标记已读

**POST** `/notifications/{id}/read`

**响应：**
```json
{
  "code": 200,
  "message": "已标记为已读"
}
```

### 8.3 全部已读

**POST** `/notifications/read-all`

---

## 9. 错误码定义

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复报名） |
| 422 | 业务逻辑错误 |
| 500 | 服务器内部错误 |

---

## 10. 速率限制

- **普通接口**：100次/分钟/IP
- **敏感接口**（登录、支付）：10次/分钟/IP
- **超出限制**：返回429 Too Many Requests

---

## 11. Webhook事件

系统支持以下Webhook事件推送：

| 事件名 | 触发时机 | 推送数据 |
|--------|---------|---------|
| `student.enrolled` | 学员报名成功 | 学员ID、课程ID、订单ID |
| `bill.confirmed` | 账单确认 | 账单ID、学员ID、金额 |
| `competition.registered` | 竞赛报名成功 | 赛事ID、学员ID |
| `token.low_balance` | Token余额低于阈值 | 账户ID、当前余额 |

**Webhook配置：**
```
POST /webhooks/configure
{
  "url": "https://your-server.com/webhook",
  "events": ["student.enrolled", "bill.confirmed"],
  "secret": "your_secret_key"
}
```

---

## 12. OpenMTSciEd 代理接口

> 详细需求见 [OPENMTSCIED_INTEGRATION_PRD.md](./OPENMTSCIED_INTEGRATION_PRD.md)  
> 所有接口需 JWT + 机构上下文；浏览器禁止直连 OpenMTSciEd。

**Base Path**: `/api/v1/opensciedu`

### 12.1 健康检查

**GET** `/opensciedu/health`

**响应**:
```json
{
  "connected": true,
  "upstream": "https://opensciedu.matux.tech/api/v1",
  "latency_ms": 120
}
```

### 12.2 集成配置

**GET** `/opensciedu/config`

**响应**:
```json
{
  "enabled": true,
  "sync_status": "idle",
  "last_sync": null,
  "api_key_masked": "****abcd",
  "platform_fallback": true
}
```

**PUT** `/opensciedu/config`（需管理员角色）

**请求体**:
```json
{
  "opensciedu_api_enabled": true,
  "opensciedu_api_key": "optional-org-key"
}
```

### 12.3 教程

**GET** `/opensciedu/tutorials?page=1&size=20&subject=physics&grade_level=9-12`

**GET** `/opensciedu/tutorials/{id}`

### 12.4 课件

**GET** `/opensciedu/coursewares?page=1&size=20&subject=physics&type=pdf`

### 12.5 硬件项目（SciEd 教学项目库，非机构设备台账）

**GET** `/opensciedu/hardware-projects?page=1&size=20&difficulty=beginner&category=robotics`

### 12.6 统计

**GET** `/opensciedu/stats`

**响应**:
```json
{
  "tutorials": 120,
  "coursewares": 340,
  "hardware_projects": 45
}
```

### 12.7 知识图谱推荐（只读）

**GET** `/opensciedu/recommendations?limit=10&subject=physics`

返回上游 `/knowledge-graph/recommend` 代理结果（数组或 `{ items: [...] }`）。

### 12.8 手动同步（管理员）

**POST** `/opensciedu/sync`

触发单机构元数据同步，更新 `opensciedu_last_sync` 与 `opensciedu_api_config.cached_stats`。

### 12.9 统一检索

**GET** `/opensciedu/search?q=robot&type=all&limit=20&include_local=true&include_scied=true`

合并机构本地 `teaching_resources` 与 OpenMTSciEd `/libraries/search` 结果，按 `score` 降序。

### 12.10 课题工作室深链

**GET** `/opensciedu/topic-studio/links?draft_id=optional`

返回 `list_url`、`new_draft_url` 等 OpenMTSciEd Web SPA 地址（环境变量 `OPENSCIEDU_WEB_BASE`）。

### 12.11 错误码

| HTTP | code | 说明 |
|------|------|------|
| 403 | `OPENSCIEDU_DISABLED` | 机构未启用集成且无平台 Key |
| 502 | `OPENSCIEDU_UPSTREAM_ERROR` | OpenMTSciEd 上游不可用 |

---

**API版本：** V1.1  
**最后更新：** 2026-06-22  
**API设计师：** Lingma AI Assistant
