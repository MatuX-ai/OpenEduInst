# 安全架构设计

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 架构设计完成

---

## 目录

1. [认证与授权](#认证与授权)
2. [数据加密](#数据加密)
3. [速率限制](#速率限制)
4. [审计日志](#审计日志)
5. [安全监控与告警](#安全监控与告警)
6. [版本历史](#版本历史)

---

## 认证与授权

### JWT Token 认证

```
用户登录 → 验证用户名密码 → 生成 JWT Token
    ↓
Token 结构:
├── Header: { "alg": "HS256", "typ": "JWT" }
├── Payload:
│   ├── sub: 用户 ID
│   ├── email: 用户邮箱
│   ├── institution_id: 机构 ID
│   ├── role: 用户角色
│   ├── iat: 签发时间
│   └── exp: 过期时间 (2 小时)
└── Signature: HMAC-SHA256(密钥, Header + Payload)
    ↓
后续请求携带: Authorization: Bearer <access_token>
```

### Token 刷新机制

```
Access Token: 2 小时有效期
Refresh Token: 7 天有效期

Token 过期:
  前端检测到 401 → 自动使用 Refresh Token 刷新
  → 重新获取 Access Token → 重试原始请求
  → Refresh Token 也过期 → 要求重新登录
```

### 角色权限模型 (RBAC)

```
角色层级:
├── sys_admin (系统管理员)
│   └─ 跨机构访问、许可证管理、系统配置、安全监控
│
├── admin (机构管理员)
│   ├─ 机构信息管理、用户与权限、学员与课程管理
│   ├─ 排课与考勤管理、财务订单管理
│   └─ 机构设置、数据备份
│
├── operator (教务主管)
│   ├─ 学员管理、课程管理、排课管理
│   └─ 考勤管理
│
├── teacher (教师)
│   ├─ 查看所授课程和班级
│   ├─ 查看学员信息（仅限所带学员）
│   ├─ 考勤标记
│   └─ 使用 AI 助手、浏览资源
│
├── finance (财务人员)
│   ├─ 订单管理、收入统计
│   └─ 发票管理
│
└── parent (家长/学员)
    ├─ 查看课程进度、查看作品
    └─ 接收通知
```

### 权限中间件流程

```
API 请求到达
    ↓
1. 验证 JWT Token 合法性
    ├─ 检查签名
    ├─ 检查过期时间 (exp)
    └─ 检查是否在黑名单中 (logout)
    ↓
2. 验证机构许可证
    ├─ 许可证状态是否为 active
    ├─ 是否在有效期内
    └─ 是否超出资源配额
    ↓
3. 验证角色权限
    ├─ 检查用户 role 是否在 endpoint 允许的角色列表中
    └─ 检查是否为机构内用户
    ↓
4. 速率限制检查
    ├─ 基于 IP 的速率限制
    ├─ 基于用户的速率限制
    └─ 基于机构的速率限制
    ↓
5. 允许访问 / 拒绝访问 (401/403)
    ↓
执行业务逻辑
```

---

## 数据加密

### 传输层加密 (TLS)

- 全站强制 HTTPS 访问
- 使用 TLS 1.2+ (推荐 TLS 1.3)
- HTTP 请求自动重定向到 HTTPS (301)
- HSTS 响应头: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- 禁用不安全的加密套件和协议版本

### 存储层加密

```
敏感字段加密存储 (AES-256-GCM):
├── 手机号 (phone_number)
├── 身份证号 (id_card)
├── 地址 (address)
├── 邮箱 (email - 仅部分显示, 不加密但脱敏)
└── API Key (第三方服务 API Key)

密码存储:
├── bcrypt 哈希算法
├── work factor: 12
└─ 密码格式: $2b$12$...

文件存储加密 (可选, 企业版):
└─ 对象存储启用服务端加密 (SSE)
```

### API Key 安全

- 所有第三方 API Key 仅存储于后端配置文件或环境变量
- 不在前端 bundle 中包含任何 API Key
- API Key 在日志中自动脱敏（显示为 `***` 或前 4 位）
- API Key 定期轮换机制（建议每 90 天）

---

## 速率限制

### 速率限制策略

| 维度 | 限制 | 时间窗口 | 用途 |
|------|------|----------|------|
| 登录 (按 IP) | 5 次尝试 | 10 分钟 | 防止暴力破解 |
| 登录失败后锁定 | - | 15 分钟 | 账户锁定 |
| API (按 IP) | 60 次 | 1 分钟 | 防止滥用 |
| API (按用户) | 300 次 | 1 分钟 | 防止过度使用 |
| 注册 (按 IP) | 10 次 | 1 小时 | 防止批量注册 |
| 密码重置 (按邮箱) | 3 次 | 1 小时 | 防止滥用 |

### 实现方式

```python
# 使用 Redis 实现滑动窗口计数
# app/middleware/rate_limit.py

class RateLimitMiddleware:
    async def dispatch(self, request, call_next):
        # 获取客户端 IP
        client_ip = get_client_ip(request)

        # 获取用户 ID (如果已认证)
        user_id = get_current_user_id(request)

        # 检查 IP 级别的速率限制
        ip_key = f"rate_limit:ip:{client_ip}:{endpoint}"
        ip_count = redis.incr(ip_key)
        if ip_count == 1:
            redis.expire(ip_key, 60)  # 1 分钟
        if ip_count > 60:
            return JSONResponse({"detail": "Too many requests"}, 429)

        # 检查用户级别的速率限制
        if user_id:
            user_key = f"rate_limit:user:{user_id}:{endpoint}"
            # ... 类似逻辑

        return await call_next(request)
```

---

## 审计日志

### 审计日志记录的操作

| 操作类别 | 记录内容 | 保留时间 |
|----------|---------|----------|
| 用户管理 | 创建/修改/删除用户、修改密码、重置密码 | 1 年 |
| 学员管理 | 创建/修改/删除学员 | 1 年 |
| 课程报名 | 报名/续费/退课 | 1 年 |
| 财务操作 | 创建订单、退款、开票 | 1 年 |
| 排课变更 | 创建/修改/删除排课 | 1 年 |
| 数据导出 | 导出数据的操作人和时间 | 1 年 |
| 数据备份 | 手动/自动备份、一键回滚 | 1 年 |
| 权限变更 | 角色变更、权限调整 | 1 年 |
| 机构设置 | 集成配置变更、API Key 生成 | 1 年 |
| 登录事件 | 登录成功/失败、登出 | 30 天 |

### 审计日志字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 日志 ID |
| timestamp | datetime | 操作时间 |
| user_id | UUID | 操作人 ID |
| institution_id | UUID | 机构 ID |
| action | string | 操作类型 (e.g., 'user.create', 'order.refund') |
| target_type | string | 操作对象类型 |
| target_id | UUID | 操作对象 ID |
| ip_address | string | 客户端 IP |
| user_agent | string | 浏览器/客户端 UA |
| changes | JSON | 变更前/变更后的数据 |
| result | string | success / failed |
| error_message | string | 失败原因（如果失败） |

### 审计日志安全特性

- 审计日志不可修改、不可删除（机构管理员角色不能操作）
- 审计日志独立于业务数据，确保不可篡改
- 支持导出为 CSV 格式（需系统管理员审批）
- 支持按时间、操作人、操作类型筛选

---

## 安全监控与告警

### 安全事件监控

| 事件 | 检测方式 | 告警级别 |
|------|---------|----------|
| 多次登录失败 | 计数登录失败次数 | 警告 → 严重 |
| 超出速率限制 | 记录 429 响应 | 警告 |
| 敏感数据导出 | 数据导出操作记录 | 信息 |
| 大额退款 | 退款金额 > 阈值 | 警告 |
| 权限提升 | 用户角色变更 | 信息 |
| API Key 泄露风险 | 异常使用模式 | 严重 |
| 跨机构访问尝试 | 尝试访问其他机构数据 | 严重 |
| SQL 注入尝试 | WAF / 输入检测 | 严重 |
| DDoS 流量 | 速率限制 + WAF | 严重 |

### 告警通知方式

- 站内通知（系统管理员仪表板）
- 邮件通知
- Webhook（可集成到第三方监控系统）

### 安全仪表板

```
系统管理员安全仪表板展示:
├── 登录失败统计（按 IP、按用户）
├── 速率限制触发统计
├── 最近告警列表
├── 活跃用户数
├── 并发连接数
├── 许可证到期提醒
└── 安全事件时间线
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，认证授权、数据加密、速率限制、审计日志、安全监控 |

---

**上一级**：[README.md](README.md)
