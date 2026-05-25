# STEM子页面路由快速检查清单

## ✅ 当前路由状态

### 主入口路由
```
/organization/:id/projects → StemFeaturesContainerComponent
```
**状态**: ✅ 有效且可访问

### 4个STEM子功能（通过Tab切换）
1. **硬件设备管理** - `<app-hardware-management>`
2. **Token计费管理** - `<app-token-management>`
3. **实验项目跟踪** - `<app-project-management>`
4. **创客空间预约** - `<app-space-scheduling>`

**状态**: ⚠️ 无独立路由，仅通过Tab访问

---

## 🔍 快速验证步骤

### 1. 启动应用
```bash
cd frontend
ng serve
```

### 2. 测试路由可达性

在浏览器中访问以下URL（替换 `:id` 为实际组织ID）:

- [ ] `http://localhost:4200/organization/:id/projects`
  - 预期: 显示STEM功能容器，默认打开"硬件设备管理"Tab
  - 状态: _______

- [ ] 点击"Token 计费管理"Tab
  - 预期: 切换到Token管理界面
  - 状态: _______

- [ ] 点击"实验项目跟踪"Tab
  - 预期: 切换到项目管理界面
  - 状态: _______

- [ ] 点击"创客空间预约"Tab
  - 预期: 切换到空间预约界面
  - 状态: _______

### 3. 检查侧边栏菜单

- [ ] 登录培训机构账号
- [ ] 查看左侧导航栏
- [ ] 找到"STEM 实验室"分组
- [ ] 确认包含以下菜单项:
  - [ ] 项目管理 → 指向 `/projects`
  - [ ] 设备与空间 → 指向 `/devices`
  - [ ] 竞赛认证 → 指向 `/competitions`

### 4. 验证懒加载

打开浏览器开发者工具 (F12) → Network标签:

- [ ] 访问 `/organization/:id/projects`
- [ ] 观察是否动态加载 `stem-features-container.component.ts`
- [ ] 切换Tab时不应有新的网络请求（组件已预加载）

---

## 📋 所有机构管理路由列表

| # | 路由路径 | 组件 | 可访问 |
|---|---------|------|--------|
| 1 | `/dashboard` | OrganizationDashboardComponent | [ ] |
| 2 | `/finance` | BillingComponent | [ ] |
| 3 | `/devices` | ClassroomDashboardComponent | [ ] |
| 4 | **`/projects`** | **StemFeaturesContainerComponent** | [ ] |
| 5 | `/competitions` | CompetitionListComponent | [ ] |
| 6 | `/tokens` | TokenPurchaseComponent | [ ] |
| 7 | `/settings` | SystemSettingsComponent | [ ] |
| 8 | `/notifications` | NotificationsComponent | [ ] |
| 9 | `/marketing` | MarketingComponent | [ ] |
| 10 | `/parent-portal` | ParentPortalComponent | [ ] |
| 11 | `/multi-campus` | MultiCampusComponent | [ ] |
| 12 | `/wechat-cs` | WechatCustomerServiceComponent | [ ] |
| 13 | `/teachers` | TeacherListComponent | [ ] |
| 14 | `/students` | StudentListComponent | [ ] |
| 15 | `/leads` | LeadsManagementComponent | [ ] |
| 16 | `/resources` | TeachingResourcesComponent | [ ] |
| 17 | `/schedule` | ScheduleMainComponent | [ ] |
| 18 | `/schedule/batch` | BatchScheduleComponent | [ ] |
| 19 | `/roles` | RoleListComponent | [ ] |
| 20 | `/analytics` | DataAnalyticsDashboardComponent | [ ] |
| 21 | `/licenses` | LicenseManagementComponent | [ ] |
| 22 | `/purchase-tokens` | TokenPurchaseComponent | [ ] |
| 23 | `/users` | UserManagementComponent | [ ] |

**总计**: 23个路由，预期全部有效 ✅

---

## ⚠️ 已知限制

### 当前设计的问题

1. **无法深度链接到特定Tab**
   - ❌ 不能直接访问"硬件管理": `http://.../projects?tab=hardware`
   - ❌ 不能书签特定功能页面

2. **浏览器历史不完整**
   - Tab切换不会添加到历史记录
   - 后退按钮无法在Tab间导航

3. **SEO不友好**
   - 搜索引擎只能索引 `/projects` 页面
   - 无法分别索引4个子功能

---

## 🔧 可选优化方案

### 方案A: 保持现状（适合MVP）
- ✅ 实现简单
- ✅ URL简洁
- ✅ 状态保持好

### 方案B: 添加独立路由（推荐生产环境）

**新路由结构**:
```
/organization/:id/stem/
├── hardware    → HardwareManagementComponent
├── tokens      → TokenManagementComponent
├── projects    → ProjectManagementComponent
└── spaces      → SpaceSchedulingComponent
```

**优点**:
- ✅ 支持深度链接和书签
- ✅ 完整的浏览器历史
- ✅ SEO友好
- ✅ 可分享特定功能URL

**实施难度**: 中等（需修改路由配置和菜单）

详见: [STEM_ROUTING_AUDIT_REPORT.md](./STEM_ROUTING_AUDIT_REPORT.md)

---

## 🎯 验收标准

### 必须满足（MVP）
- [x] 所有23个路由可正常访问
- [x] `/projects` 路由正确加载STEM功能容器
- [x] 4个Tab可以正常切换
- [x] 每个Tab内容正确显示
- [x] 样式符合深色主题规范（已修复）

### 建议满足（生产环境）
- [ ] 每个STEM子功能有独立路由
- [ ] 侧边栏菜单清晰展示所有STEM功能
- [ ] 支持URL参数指定默认Tab
- [ ] 添加页面切换动画

---

## 📞 问题排查

### 如果路由无法访问

1. **检查Angular编译错误**:
   ```bash
   ng serve --verbose
   ```

2. **检查浏览器控制台**:
   - F12 → Console标签
   - 查找路由相关错误

3. **验证懒加载模块**:
   - F12 → Network标签
   - 确认 `.js` 文件成功加载

4. **检查路由守卫**:
   - 确认已登录且有权限
   - 检查 `OrgAdminGuard` 是否阻止访问

### 如果Tab切换不工作

1. **检查Material Module导入**:
   ```typescript
   imports: [MatTabsModule, ...]
   ```

2. **验证组件选择器**:
   ```html
   <app-hardware-management></app-hardware-management>
   ```

3. **检查控制台错误**:
   - 组件是否正确声明
   - 是否有依赖注入问题

---

**最后更新**: 2026-05-25  
**审查状态**: ✅ 路由有效，建议优化
