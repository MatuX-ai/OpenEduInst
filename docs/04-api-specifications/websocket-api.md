# WebSocket 实时同步协议

**文档版本**：v1.0
**最后更新**：2026-06-23
**状态**：✅ 协议设计完成

---

## 目录

1. [连接建立](#连接建立)
2. [消息格式](#消息格式)
3. [事件类型](#事件类型)
4. [实时同步场景](#实时同步场景)
5. [心跳与重连](#心跳与重连)
6. [版本历史](#版本历史)

---

## 连接建立

### 连接地址

```
wss://<domain>/ws/connect?token=<jwt_token>

参数:
- token: JWT Token (必填，通过 URL Query 或 Header 传递)
- device_id: 客户端设备标识 (可选)
- client_version: 客户端版本 (可选)
```

### 连接流程

```
Client                                        Server
  │                                              │
  │    1. WebSocket 握手请求                     │
  │── GET /ws/connect?token=<jwt> ─────────────▶│
  │                                              │
  │    2. 验证 JWT + 机构许可证                  │
  │                                              │
  │    3. 建立连接，发送欢迎消息                  │
  │◀──────── {"type":"connected", ...} ──────────│
  │                                              │
  │    4. 客户端订阅感兴趣的频道                 │
  │── {"action":"subscribe", "channels": [...]} ─▶│
  │                                              │
  │    5. 数据变更触发实时推送                    │
  │◀────────── {event, payload} ─────────────────│
  │                                              │
  │    6. 定期心跳 (每 30 秒)                    │
  │◀────── {"type":"ping","ts":1750680000} ─────│
  │── {"type":"pong","ts":1750680000} ──────────▶│
  │                                              │
```

### 连接成功响应

```json
{
  "type": "connected",
  "connection_id": "ws_conn_550e8400_e29b_41d4",
  "server_ts": 1750680000,
  "institution_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_role": "admin",
  "available_channels": [
    "students",
    "classes",
    "schedules",
    "attendance",
    "orders"
  ]
}
```

---

## 消息格式

### 客户端发送消息

```json
{
  "action": "subscribe",
  "request_id": "req_001",
  "ts": 1750680000,
  "data": {
    "channels": ["students", "attendance"]
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型: subscribe / unsubscribe / ping / custom |
| request_id | string | 否 | 请求 ID，用于匹配响应 |
| ts | integer | 否 | 客户端时间戳 |
| data | object | 否 | 请求附加数据 |

### 服务器推送消息

```json
{
  "type": "event",
  "event": "student.created",
  "channel": "students",
  "ts": 1750680000,
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "小明",
    "status": "active",
    "action_by": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 事件类型

| 频道 | 事件名 | 说明 | 触发场景 |
|------|--------|------|---------|
| students | student.created | 学员创建 | 添加新学员 |
| students | student.updated | 学员信息更新 | 修改学员信息 |
| students | student.deleted | 学员删除 | 删除学员 |
| classes | class.created | 班级创建 | 新建班级 |
| classes | class.updated | 班级更新 | 修改班级信息 |
| classes | class.student_added | 学员加入班级 | 学员报名课程 |
| classes | class.student_removed | 学员退出班级 | 学员退课 |
| schedules | schedule.created | 排课创建 | 新增课时安排 |
| schedules | schedule.updated | 排课更新 | 修改课时安排 |
| schedules | schedule.status_changed | 排课状态变更 | 开始上课、结束、取消 |
| attendance | attendance.marked | 考勤标记 | 教师标记出勤 |
| attendance | attendance.bulk_updated | 批量考勤更新 | 批量标记出勤 |
| orders | order.created | 订单创建 | 新订单生成 |
| orders | order.status_changed | 订单状态变更 | 付款、退款 |
| backup | backup.completed | 备份完成 | 自动备份完成 |
| ai | ai.assistant_response | AI 响应 | AI 助手返回结果 |

---

## 实时同步场景

### 场景 1: 多终端同步排课变更

```
场景: 教务主管在办公室 PC 端更新排课，教室 Pad 实时显示

时序:
1. 教务主管 (PC):
   POST /api/v1/schedules/:id → 更新排课时间
   ↓
2. 后端:
   写入数据库成功
   ↓
3. 后端 → Redis Pub/Sub:
   PUBLISH channel:inst_{id}:schedules
   MESSAGE: { event: "schedule.updated", payload: {...} }
   ↓
4. WebSocket 服务器 (订阅 Pub/Sub):
   接收到消息，验证客户端订阅状态
   ↓
5. 所有在线客户端 (教室 Pad、PC 等):
   WebSocket 推送: { type: "event", event: "schedule.updated", payload: {...} }
   ↓
6. 前端:
   检测到排课变更事件，自动刷新对应排课项
   可选提示用户: "排课信息已更新"
```

### 场景 2: 课堂实时考勤标记

```
场景: 教师在课堂上标记学员出勤，机构管理员端实时看到

时序:
1. 教师 (Pad/手机):
   POST /api/v1/schedules/:id/attendance
   ↓
2. 后端:
   写入多条考勤记录
   ↓
3. 后端 → Redis Pub/Sub:
   PUBLISH channel:inst_{id}:attendance
   MESSAGE: { event: "attendance.marked", payload: {...} }
   ↓
4. 所有在线客户端:
   接收实时考勤数据
   ↓
5. 前端:
   更新考勤表格
   学员家长端: 推送"已上课"通知
```

---

## 心跳与重连

### 心跳机制

- 服务器每 30 秒发送 `ping` 消息
- 客户端需在 5 秒内回复 `pong`
- 连续 3 次无响应 → 关闭连接

```
服务器 → 客户端:
{ "type": "ping", "ts": 1750680000 }

客户端 → 服务器:
{ "type": "pong", "ts": 1750680000 }
```

### 重连机制

```
断线检测与重连策略:
1. 客户端检测到连接断开 (onclose)
2. 立即尝试第一次重连
3. 若失败，采用指数退避策略:
   - 第 1 次: 等待 1 秒
   - 第 2 次: 等待 2 秒
   - 第 3 次: 等待 4 秒
   - 第 4 次: 等待 8 秒
   - 最大等待: 60 秒
4. 重连成功后:
   - 发送 { "action": "reconnect", "last_event_id": "xxx" }
   - 服务器根据 last_event_id 推送丢失的事件
5. JWT Token 过期时:
   - 先通过 refresh_token 获取新 token
   - 再使用新 token 重连
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，WebSocket 连接协议、事件类型定义、心跳重连机制 |

---

**上一级**：[README.md](README.md)
