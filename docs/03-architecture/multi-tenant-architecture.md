# 多租户架构设计

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 架构设计完成

---

## 目录

1. [多租户隔离模型](#多租户隔离模型)
2. [机构许可证模型](#机构许可证模型)
3. [配额管理](#配额管理)
4. [数据路由机制](#数据路由机制)
5. [版本历史](#版本历史)

---

## 多租户隔离模型

### Schema 级隔离

采用 **Database-Per-Tenant with Shared Schema** 策略，每个机构在 PostgreSQL 中拥有独立的 Schema：

```
database: platform_db
├── public                 # 共享 Schema（用户、机构元数据）
│   ├── users
│   ├── institutions
│   └── licenses
├── inst_001_schema        # 机构 1 的 Schema
│   ├── students
│   ├── courses
│   ├── classes
│   ├── orders
│   └── ... 其他业务表
├── inst_002_schema        # 机构 2 的 Schema
│   ├── students
│   ├── courses
│   ├── classes
│   ├── orders
│   └── ... 其他业务表
└── inst_N_schema          # 机构 N 的 Schema
```

**优点**：
- 物理隔离，机构间数据互不干扰
- 便于单独备份/恢复某一机构数据
- 便于性能扩展和资源分配

**缺点**：
- Schema 数量多时，数据库管理稍复杂
- 跨机构查询（系统管理员）需要额外处理

### 用户与机构关联

```
public.users 表
├── id
├── email (全局唯一)
├── password_hash
├── institution_id (关联机构)
├── role (admin/teacher/finance/parent/sys_admin)
└── status (active/locked/suspended)

public.institutions 表
├── id
├── name
├── schema_name (e.g., 'inst_001_schema')
├── license_id (关联许可证)
└── status
```

### 数据路由机制

```
用户请求 (携带 JWT Token)
    ↓
FastAPI Dependency 提取当前用户 → institution_id
    ↓
根据 institution_id 查找对应的 schema_name
    ↓
SQLAlchemy 设置当前会话的 search_path:
  SET search_path = inst_001_schema, public;
    ↓
后续 ORM 查询自动路由到对应 Schema
```

**关键实现代码结构**：

```python
# app/middleware/tenant_middleware.py
class TenantMiddleware:
    async def dispatch(self, request, call_next):
        # 从 JWT 提取 institution_id
        institution_id = get_current_user_institution(request)
        # 根据 institution_id 获取 schema 名称
        schema_name = get_tenant_schema(institution_id)
        # 设置当前请求上下文的 tenant schema
        request.state.tenant_schema = schema_name
        return await call_next(request)

# app/core/tenant.py
def set_tenant_schema(db: Session, schema_name: str):
    """设置当前数据库会话的 schema"""
    db.execute(text(f"SET search_path = {schema_name}, public"))

# app/api/dependencies.py
def get_db(tenant_schema: str = Depends(get_tenant_schema)):
    db = SessionLocal()
    set_tenant_schema(db, tenant_schema)
    try:
        yield db
    finally:
        db.close()
```

---

## 机构许可证模型

### 许可证结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 许可证唯一 ID |
| institution_id | UUID | 关联的机构 |
| license_type | enum | trial / standard / enterprise |
| start_date | datetime | 许可证生效时间 |
| end_date | datetime | 许可证到期时间 |
| max_students | integer | 学员数量上限 |
| max_storage_mb | integer | 存储空间上限 (MB) |
| token_quota | integer | AI Token 配额 |
| features | JSON | 功能开关 (enable_ai, enable_backup, etc.) |
| status | enum | active / expired / revoked |
| is_auto_renew | boolean | 是否自动续费 |

### 许可证类型对比

| 特性 | 试用版 (Trial) | 标准版 (Standard) | 企业版 (Enterprise) |
|------|:----------------:|:-------------------:|:-------------------:|
| 有效期 | 30 天 | 1 年 | 1 年 / 3 年 |
| 学员上限 | 50 人 | 500 人 | 无限制 |
| 教师账号 | 3 个 | 20 个 | 无限制 |
| 存储空间 | 1 GB | 20 GB | 200 GB+ |
| AI Token 配额 | 5,000 / 月 | 50,000 / 月 | 自定义 |
| 数据备份 | 仅手动 | 自动备份 | 自动备份 + 一键回滚 |
| 审计日志 | 保留 30 天 | 保留 1 年 | 保留 3 年 |
| OpenSciEd 集成 | ✅ | ✅ | ✅ |
| WebSocket 实时同步 | ✅ | ✅ | ✅ |
| 自定义证书模板 | ❌ | ✅ | ✅ |
| 高级报表 | ❌ | ✅ | ✅ |
| API 访问 | ❌ | ✅ | ✅ |
| 技术支持 | 社区 | 工单 + 邮件 | 7x24 专属支持 |
| SSL 证书 | 共享 | 共享 | 自定义证书 |

### 许可证验证流程

```
用户发起请求 → 提取 JWT Token → 获取 institution_id
    ↓
查询机构许可证状态和配额
    ↓
验证:
  ├─ 许可证是否有效 (status = 'active')
  ├─ 是否在有效期内 (start_date <= now <= end_date)
  └─ 是否超出资源配额
    ↓
通过 → 继续处理请求
    ↓
拒绝 → 返回 HTTP 403 Forbidden + 详细原因
```

---

## 配额管理

### 学员数配额

```python
# 计算机构当前学员数
SELECT COUNT(*) FROM {schema}.students WHERE status = 'active';

# 对比许可证 max_students
if current_students >= max_students:
    raise QuotaExceeded("学员数量已达上限，请升级许可证")
```

### 存储空间配额

```
机构存储使用量 =
  对象存储中该机构的所有文件大小总和
+
  数据库中该机构 Schema 的数据量

超出配额时：
- 禁止上传新文件
- 提示清理空间或升级许可证
```

### AI Token 配额

```
月度 Token 重置日：每月 1 日

Token 余额 =
  当月初始配额 + 购买的额外 Token
- 当月已消耗 Token
```

### 并发连接配额

```
单个机构 WebSocket 并发连接上限：
- 试用版: 20 连接
- 标准版: 200 连接
- 企业版: 2000+ 连接

超出时提示: 连接数过多，请稍后重试或升级许可证
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，多租户隔离模型、许可证模型、配额管理 |

---

**上一级**：[README.md](README.md)
