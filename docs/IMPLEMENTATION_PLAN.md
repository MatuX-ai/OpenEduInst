# OpenMTEduInst 培训机构系统 - 完整实施计划

## 📋 现状分析

### ✅ 已有后端功能（FastAPI）

| 模块 | Model文件 | Route文件 | Service文件 | 状态 |
|------|----------|-----------|-------------|------|
| **多租户管理** | `tenant.py` | `tenant_routes.py` | `tenant_init_service.py` | ✅ 完成 |
| **授权许可** | `license.py` | `license_routes.py` | `license_service.py` | ✅ 完成 |
| **用户组织** | `user_organization.py` | `user_organization_routes.py` | `user_organization_service.py` | ✅ 完成 |
| **Token计费** | `user_license.py` | `user_license_routes.py` | `user_license_service.py` | ✅ 完成 |
| **课程排课** | `schedule.py` (Schedule/Lead/Settlement) | `schedule_routes.py` | `schedule_service.py` | ⚠️ 基础完成 |
| **教室管理** | `classroom.py` | - | - | ✅ Model完成 |
| **财务管理** | `finance.py` (TuitionRecord/TeacherSalary/CourseConsumption) | - | - | ⚠️ Model完成，缺Route |
| **硬件租赁** | `hardware_module.py` | - | - | ⚠️ Model完成，缺Route |
| **内容商店** | `content_store.py` | - | - | ⚠️ Model完成，缺Route |
| **学习记录** | `unified_learning_record.py` | - | - | ⚠️ Model完成，缺Route |

### ❌ 缺失的后端模块

| 模块 | 需要创建的文件 | 优先级 |
|------|--------------|--------|
| **学员管理** | `models/student.py`, `routes/student_routes.py`, `services/student_service.py` | P0 |
| **项目管理** | `models/project.py`, `routes/project_routes.py`, `services/project_service.py` | P0 |
| **竞赛认证** | `models/competition.py`, `routes/competition_routes.py` | P1 |
| **教学资源** | `models/resource.py`, `routes/resource_routes.py` | P1 |
| **营销活动** | `models/campaign.py`, `routes/campaign_routes.py` | P2 |
| **消息通知** | `models/notification.py`, `routes/notification_routes.py` | P2 |
| **教师绩效** | `models/teacher_performance.py`, `routes/teacher_routes.py` | P2 |

### ✅ 已有前端组件（Angular）

- `TrainingDashboardComponent` - 培训机构Dashboard（861行，完整UI）
- 位置：`frontend/src/app/organization-management/organization-portal/components/dashboard-overview/`

### ⚠️ Next.js营销网站原型

- 位置：`marketing-site/app/demo/training-static/`
- 状态：17个静态页面（已完成）
- 任务：需要改造为调用真实API的动态页面

---

## 🎯 实施路线图

### Phase 1: 补充核心后端API（2周）

#### Week 1: 学员管理 + 项目管理

**Day 1-2: 学员管理模块**
```python
# 创建文件
backend/models/student.py
backend/routes/student_routes.py  
backend/services/student_service.py

# 实现接口
GET    /api/v1/students              # 学员列表（分页/筛选）
POST   /api/v1/students              # 创建学员
GET    /api/v1/students/{id}         # 学员详情
PUT    /api/v1/students/{id}         # 更新学员
POST   /api/v1/students/import       # 批量导入
GET    /api/v1/students/{id}/courses # 学员课程列表
```

**Day 3-4: 项目管理模块**
```python
# 创建文件
backend/models/project.py
backend/routes/project_routes.py
backend/services/project_service.py

# 实现接口
GET    /api/v1/projects              # 项目列表
POST   /api/v1/projects              # 创建项目
GET    /api/v1/projects/{id}         # 项目详情
PATCH  /api/v1/projects/{id}/progress # 更新进度
POST   /api/v1/projects/{id}/works   # 提交作品
```

**Day 5: 扩展现有排课API**
```python
# 完善 backend/routes/schedule_routes.py
GET    /api/v1/schedules             # 课表查询（已有Model）
POST   /api/v1/schedules             # 创建课程安排
POST   /api/v1/schedules/{id}/attendance # 签到
GET    /api/v1/leads                 # 线索列表（已有Model）
POST   /api/v1/leads/convert         # 线索转化（已有）
```

#### Week 2: 财务结算 + Token对接

**Day 6-7: 财务结算API**
```python
# 创建文件
backend/routes/finance_routes.py
backend/services/finance_service.py

# 实现接口（基于已有finance.py Model）
GET    /api/v1/bills                 # 账单列表
POST   /api/v1/bills/{id}/confirm    # 确认账单
GET    /api/v1/finance/revenue-stats # 营收统计
GET    /api/v1/teachers/salaries     # 教师工资列表
POST   /api/v1/teachers/salaries/pay # 发放工资
```

**Day 8-9: Token计费对接**
```python
# 完善 backend/routes/user_license_routes.py（已有）
GET    /api/v1/tokens/balance        # Token余额（已有）
POST   /api/v1/tokens/recharge       # Token充值（已有）
GET    /api/v1/tokens/usage          # 使用记录（已有）

# 新增AI功能调用示例
POST   /api/v1/ai/assistant          # AI助教（扣Token）
POST   /api/v1/ai/evaluate           # 智能评测（扣Token）
```

**Day 10: API测试与文档**
- 使用Postman测试所有新接口
- 更新 `docs/API_SPECIFICATION.md`
- 编写单元测试

---

### Phase 2: Angular前端对接（1.5周）

#### Week 3: Dashboard动态化

**Day 11-12: 创建API Service**
```typescript
// frontend/src/app/core/services/
training-api.service.ts      # 培训机构API封装
student.service.ts           # 学员管理
project.service.ts           # 项目管理
schedule.service.ts          # 排课管理
finance.service.ts           # 财务管理
```

**Day 13-14: 改造Dashboard组件**
```typescript
// 修改 TrainingDashboardComponent
- 替换Mock数据为API调用
- 添加加载状态（Loading Spinner）
- 添加错误处理（Error Toast）
- 实现指标卡片点击跳转

// 新增子组件
students-list.component.ts   # 学员列表页
projects-list.component.ts   # 项目列表页
schedules-calendar.component.ts # 课表日历
```

**Day 15: 路由配置**
```typescript
// frontend/src/app/app-routing.module.ts
const routes: Routes = [
  { path: 'training/dashboard', component: TrainingDashboardComponent },
  { path: 'training/students', component: StudentsListComponent },
  { path: 'training/projects', component: ProjectsListComponent },
  { path: 'training/schedules', component: SchedulesCalendarComponent },
  // ...更多路由
];
```

---

### Phase 3: Next.js原型改造（1.5周）

#### Week 4: 静态页面转动态

**Day 16-17: 创建API Client**
```typescript
// marketing-site/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加Token拦截器
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

**Day 18-19: 改造关键页面**

**学员管理页面** (`marketing-site/app/demo/training-static/sections/students.tsx`)
```tsx
// 修改前：使用mockData
import { mockData } from "../_data";
const students = mockData.students;

// 修改后：调用API
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    apiClient.get('/api/v1/students')
      .then(res => setStudents(res.data.items))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <LoadingSpinner />;
  // ...渲染逻辑
}
```

**类似改造其他页面：**
- `leads.tsx` → 调用 `/api/v1/leads`
- `projects.tsx` → 调用 `/api/v1/projects`
- `billing.tsx` → 调用 `/api/v1/bills`
- `competitions.tsx` → 调用 `/api/v1/competitions`（需先创建后端API）
- `resources.tsx` → 调用 `/api/v1/resources`（需先创建后端API）

**Day 20: 登录认证集成**
```tsx
// marketing-site/app/demo/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const handleLogin = async () => {
    const res = await apiClient.post('/auth/login', { username, password });
    localStorage.setItem('access_token', res.data.access_token);
    router.push('/demo/training-static');
  };
  
  return (
    // ...登录表单
  );
}
```

---

### Phase 4: 补充P1/P2功能（2周）

#### Week 5: 竞赛认证 + 教学资源

**Day 21-23: 竞赛认证后端**
```python
# 创建文件
backend/models/competition.py
backend/routes/competition_routes.py

# 数据库表
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organizations(id),
    name VARCHAR(200),
    organizer VARCHAR(100),
    level VARCHAR(20),
    register_deadline DATE,
    competition_date DATE,
    status VARCHAR(20)
);

CREATE TABLE competition_registrations (
    id SERIAL PRIMARY KEY,
    competition_id INT REFERENCES competitions(id),
    student_id INT REFERENCES students(id),
    result VARCHAR(20)
);

# API接口
GET    /api/v1/competitions
POST   /api/v1/competitions
POST   /api/v1/competitions/{id}/register
```

**Day 24-25: 教学资源后端**
```python
# 利用已有的 content_store.py Model
# 创建 Route
backend/routes/resource_routes.py

GET    /api/v1/resources             # 资源列表
POST   /api/v1/resources/upload      # 上传资源（MinIO/S3）
GET    /api/v1/resources/{id}/download # 下载资源
```

#### Week 6: 营销活动 + 消息通知

**Day 26-28: 营销活动后端**
```python
# 创建文件
backend/models/campaign.py
backend/routes/campaign_routes.py

GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /api/v1/coupons
POST   /api/v1/coupons/generate
```

**Day 29-30: 消息通知后端**
```python
# 创建文件
backend/models/notification.py
backend/routes/notification_routes.py
backend/services/notification_service.py

GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/read
POST   /api/v1/notifications/read-all

# WebSocket实时推送（可选）
WS     /ws/notifications
```

---

## 📊 技术架构图

```
┌─────────────────────────────────────────────┐
│           Frontend Layer                     │
├──────────────────┬──────────────────────────┤
│  Angular Admin   │  Next.js Marketing Site  │
│  (管理后台)       │  (Demo演示)               │
└────────┬─────────┴────────────┬─────────────┘
         │                      │
         │  HTTP/WebSocket      │
         ▼                      ▼
┌─────────────────────────────────────────────┐
│         Backend API (FastAPI)                │
├─────────────────────────────────────────────┤
│  Auth | Students | Projects | Schedules     │
│  Finance | Tokens | Competitions | Resources│
│  Campaigns | Notifications | Teachers       │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL 15  │  │   Redis 7       │
│  (主数据库)      │  │  (缓存/会话)     │
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│   MinIO/S3      │
│  (文件存储)      │
└─────────────────┘
```

---

## 🔧 开发环境配置

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动
```bash
# Angular管理后台
cd frontend
npm install
ng serve --port 4200

# Next.js营销网站
cd marketing-site
npm install
npm run dev -- -p 3000
```

### 数据库初始化
```bash
# 创建数据库
createdb openmt_edu

# 运行迁移（如果有Alembic）
alembic upgrade head

# 或手动执行SQL
psql -d openmt_edu -f backend/scripts/init_db.sql
```

---

## ✅ 验收标准

### 后端API
- [ ] 所有接口返回统一格式 `{code, message, data}`
- [ ] JWT认证正常工作
- [ ] 多租户隔离（org_id）正确实现
- [ ] 单元测试覆盖率 > 70%
- [ ] API响应时间 < 500ms

### Angular前端
- [ ] Dashboard数据从API加载
- [ ] 学员列表支持分页/筛选
- [ ] 课表显示正常，无Console Error
- [ ] 表单提交有成功/失败提示
- [ ] 路由跳转流畅

### Next.js原型
- [ ] 所有页面改为动态数据
- [ ] 登录认证流程完整
- [ ] Loading状态友好
- [ ] 错误处理完善
- [ ] 部署到Vercel可访问

---

## 📅 时间表总览

| 阶段 | 时间 | 主要任务 | 交付物 |
|------|------|---------|--------|
| **Phase 1** | Week 1-2 | 补充核心后端API | 10+新接口，API文档更新 |
| **Phase 2** | Week 3 | Angular前端对接 | Dashboard动态化，3个子页面 |
| **Phase 3** | Week 4 | Next.js原型改造 | 17个页面全部动态化 |
| **Phase 4** | Week 5-6 | P1/P2功能补充 | 竞赛/资源/营销/通知模块 |
| **总计** | **6周** | **全栈开发** | **可上线MVP版本** |

---

## 🚀 下一步行动

**立即开始：**
1. 创建 `backend/models/student.py`（学员Model）
2. 创建 `backend/routes/student_routes.py`（学员API）
3. 在 `main.py` 中注册新路由
4. 测试接口可用性

**我可以立即开始编写代码，您希望我从哪个模块开始？**

选项：
- A: 学员管理（最核心，优先）
- B: 项目管理（STEM特色）
- C: 先完善现有排课API
- D: 其他指定模块
