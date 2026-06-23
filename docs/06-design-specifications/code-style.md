# 代码风格与命名规范

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [TypeScript/Angular 规范](#typescriptangular-规范)
2. [Python/FastAPI 规范](#pythonfastapi-规范)
3. [数据库命名规范](#数据库命名规范)
4. [API 设计规范](#api-设计规范)
5. [版本历史](#版本历史)

---

## TypeScript/Angular 规范

### 文件命名

| 文件类型 | 命名规范 | 示例 |
|---------|---------|------|
| 组件 | `{feature}.component.ts` | `student-list.component.ts` |
| 服务 | `{feature}.service.ts` | `auth.service.ts` |
| 接口/类型 | `{feature}.interface.ts` | `student.interface.ts` |
| 路由模块 | `{feature}-routing.module.ts` | `student-routing.module.ts` |

### 变量命名

- 变量/方法: camelCase (`studentName`, `getStudentList`)
- 类/接口/枚举: PascalCase (`StudentService`, `UserRole`)
- 常量: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_LIMIT`)
- 布尔值前缀: `is`, `has`, `can`, `should` (`isActive`, `hasPermission`)

### 代码格式化

- 使用 Prettier 统一代码风格
- 2 空格缩进
- 单引号字符串
- 分号必须

---

## Python/FastAPI 规范

### 文件命名

| 文件类型 | 命名规范 | 示例 |
|---------|---------|------|
| 路由 | `{feature}.py` | `students.py` |
| 模型 | `models/{feature}.py` | `models/student.py` |
| Schema | `schemas/{feature}.py` | `schemas/student.py` |
| 服务 | `services/{feature}.py` | `services/auth_service.py` |

### 变量命名

- 变量/函数: snake_case (`student_name`, `get_student_list`)
- 类: PascalCase (`StudentService`, `UserRole`)
- 常量: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_LIMIT`)
- 私有成员: 单下划线前缀 (`_internal_method`)

### 代码格式化

- 使用 Black 格式化代码
- 4 空格缩进 (PEP 8)
- 行长度 88 字符 (Black 默认)
- 使用 isort 管理 import 顺序

---

## 数据库命名规范

- 表名: 小写 + 下划线，复数形式 (`students`, `enrollments`)
- 列名: 小写 + 下划线 (`created_at`, `phone_number`)
- 主键: 统一为 `id` (UUID 类型)
- 外键: `{referenced_table}_id` (`student_id`, `course_id`)
- 索引: `idx_{table}_{columns}`
- 布尔列前缀: `is_` (`is_active`, `is_deleted`)

---

## API 设计规范

### 路由命名

```
# 列表
GET    /api/v1/students

# 创建
POST   /api/v1/students

# 获取单个
GET    /api/v1/students/{student_id}

# 更新
PUT    /api/v1/students/{student_id}

# 删除
DELETE /api/v1/students/{student_id}

# 子资源
POST   /api/v1/students/{student_id}/enrollments
GET    /api/v1/students/{student_id}/orders
```

### HTTP 状态码使用

| 状态码 | 用途 |
|--------|------|
| 200 | 查询/更新/删除成功 |
| 201 | 创建成功 |
| 204 | 无返回内容 (如登出) |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过多 (速率限制) |
| 500 | 服务器错误 |

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，代码风格与命名规范 |

---

**上一级**：[README.md](README.md)
