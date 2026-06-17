# OpenMT 云托管版 vs 开源社区版 - 功能差异对照表

本文档详细说明了 OpenMT STEM 教育机构管理系统中“云托管版”与“开源社区版”的核心差异。

## 1. 核心定位对比

| 维度 | 开源社区版 (Open Source) | 云托管版 (Cloud Hosted) |
| :--- | :--- | :--- |
| **部署方式** | 本地化部署 (Windows/Linux) | SaaS 云端托管 |
| **维护成本** | 需自行维护服务器、数据库及备份 | 零运维，官方统一维护 |
| **适用对象** | 具备 IT 运维能力的机构或个人开发者 | 专注于教学业务的 STEM 培训机构、K12 学校 |
| **数据同步** | 单点存储，不支持跨设备实时同步 | 多端实时同步 (Web/App/Pad) |

## 2. 功能模块差异

### 2.1 基础管理功能
*   **硬件设备管理**：两版本均支持 Arduino、树莓派等设备的入库、借用与状态跟踪。
*   **Token 计费系统**：两版本均支持基于 AI 调用量的 Token 消耗统计与账单生成。
*   **创客空间预约**：两版本均支持实验室、教室的时段预约与冲突检测。

### 2.2 云托管专属功能
以下功能仅在云托管版（License Type: `CLOUD_HOSTED`）中开启：

1.  **云端自动备份 (Auto Backup)**
    *   **机制**：每日凌晨自动进行全量增量备份，保留最近 30 天快照。
    *   **恢复**：支持一键回滚至任意历史时间点。
2.  **高级 AI 助教 (Advanced AI Assistant)**
    *   **能力**：集成云端大模型，提供智能排课建议、学生学情深度分析及代码自动审查。
    *   **额度**：每月赠送更高额度的 AI Token 消耗包。
3.  **多租户物理隔离**
    *   **安全**：采用独立数据库 Schema 或实例隔离，确保机构间数据绝对安全。
4.  **企业级安全防护**
    *   **传输**：全站强制 HTTPS (SSL/TLS) 加密。
    *   **合规**：符合教育行业数据安全存储标准。

## 3. 技术实现细节

### 3.1 后端初始化逻辑
在创建组织时，系统通过 `TenantInitService` 进行差异化配置：

```python
# backend/services/tenant_init_service.py
if org_type in [OrganizationType.TRAINING, OrganizationType.K12]:
    # 云托管版自动发放 1 年有效期的高级许可证
    license = License(
        license_type=LicenseType.CLOUD_HOSTED,
        features=["ai_assistant", "auto_backup", "multi_device_sync"]
    )
    # 开启云端专属业务参数
    config_data['cloud_backup_enabled'] = True
```

### 3.2 前端模块化加载
云托管版特有的 UI 组件位于 Angular 项目的独立模块中，通过路由守卫控制访问：

*   **路径**：`frontend/src/app/features/stem-cloud/`
*   **组件**：
    *   `hardware-management.component.ts`
    *   `token-management.component.ts`
    *   `space-scheduling.component.ts`
    *   `project-management.component.ts`

## 4. 许可证 (License) 说明

| 属性 | 开源社区版 | 云托管版 |
| :--- | :--- | :--- |
| **类型标识** | `OPEN_SOURCE` / `WINDOWS_LOCAL` | `CLOUD_HOSTED` / `EDUCATION` |
| **有效期** | 永久 | 按年订阅 (默认赠送 1 年试用) |
| **最大用户数** | 受限 (通常 < 50) | 扩展性强 (默认 100+) |
| **AI 功能** | 基础版 (需自备 API Key) | 高级版 (内置云端算力) |

## 5. 总结建议

*   如果您希望**完全掌控数据**且拥有专门的 IT 团队，建议选择**开源社区版**。
*   如果您希望**开箱即用**，关注教学本身而非服务器运维，**云托管版**是更优的选择。

---

## 6. 相关文档

*   [OpenMT 云托管版 PRD（完整需求规格说明书）](./CLOUD_HOSTING_PRD.md)
*   [培训机构管理系统 PRD](./TRAINING_PLATFORM_PRD.md)
*   [机构驾驶舱 PRD](./INSTITUTION_DASHBOARD_PRD.md)

---
*文档最后更新时间：2026-06-17*
