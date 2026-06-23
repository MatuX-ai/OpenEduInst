# API 规格与数据库设计

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [模块说明](#模块说明)
2. [文档清单](#文档清单)
3. [API 设计原则](#api-设计原则)
4. [数据库设计原则](#数据库设计原则)
5. [阅读指引](#阅读指引)
6. [版本历史](#版本历史)

---

## 模块说明

本模块定义了系统的 REST API 接口规格与数据库 Schema 设计。遵循统一的接口设计和数据库设计规范，有助于确保 API 的一致性、可维护性和可扩展性。

---

## 文档清单

| 文件 | 说明 | 状态 |
|------|------|------|
| [README.md](README.md) | 本文档，模块总览 | ✅ 完成 |
| [api-design.md](api-design.md) | REST API 接口设计规格与示例 | ✅ 完成 |
| [database-schema.md](database-schema.md) | 数据库表结构设计 | ✅ 完成 |
| [websocket-api.md](websocket-api.md) | WebSocket 实时同步协议 | ✅ 完成 |

---

## API 设计原则

1. **RESTful 风格**
   - 使用标准 HTTP 方法: GET/POST/PUT/DELETE/PATCH
   - 资源作为名词，清晰表达操作对象
   - 统一的资源命名规范（小写、连字符、复数形式）

2. **版本管理**
   - URL 中包含版本号: `/api/v1/...`
   - 向后兼容的版本演进策略
   - 弃用 API 提供 6 个月的过渡期

3. **统一响应格式**
   - 所有 API 响应遵循统一的 JSON 结构
   - 包含 code、message、data 字段
   - 统一的错误码和错误信息

4. **认证与授权**
   - Bearer JWT Token 认证
   - 基于角色的权限控制 (RBAC)
   - 机构上下文隔离检查

5. **分页与过滤**
   - 列表接口统一使用 `page`、`page_size` 参数
   - 支持按字段过滤、排序、搜索

---

## 数据库设计原则

1. **Schema 隔离**
   - 每个机构拥有独立的 PostgreSQL Schema
   - 每个 Schema 包含完整的业务数据表
   - 全局数据（许可证、系统配置）存储于 public Schema

2. **命名规范**
   - 表名: 小写 + 下划线（snake_case），复数形式
   - 列名: 小写 + 下划线
   - 索引: `idx_<table>_<columns>`
   - 外键: `fk_<table>_<column>`
   - 主键: 统一使用 UUID 类型

3. **字段规范**
   - 所有表包含 `id`、`created_at`、`updated_at` 字段
   - 布尔字段使用 `is_` 前缀 (e.g., `is_active`)
   - 时间字段使用 timestamptz 类型
   - 金额字段使用 NUMERIC(10, 2)

4. **约束与索引**
   - 明确的外键约束
   - 业务逻辑相关的唯一约束
   - 常用查询字段创建索引
   - 避免过度索引影响写入性能

---

## 阅读指引

- **接口开发人员**: 先阅读 [api-design.md](api-design.md) 了解 API 设计规范
- **数据库开发人员**: 阅读 [database-schema.md](database-schema.md) 了解表结构设计
- **实时功能开发**: 阅读 [websocket-api.md](websocket-api.md) 了解实时同步协议

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，API 设计原则与数据库设计规范 |

---

**上一级**：[README.md](../README.md)
