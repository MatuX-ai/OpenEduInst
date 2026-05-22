# STEM 教育特色子页面原型设计

## 概述

本次设计为 OpenMT 教育机构管理系统创建了四个核心 STEM 教育特色子页面原型，突出系统的差异化功能和专业化特色。

## 设计理念

✅ **定位清晰**：每个页面都明确体现STEM教育特色  
✅ **差异化明显**：与普通教培系统形成鲜明对比  
✅ **功能突出**：硬件管理、Token计费、项目管理、空间调度  
✅ **内容专业**：Arduino、机器人、AI、物联网等真实场景  

## 子页面原型列表

### 1. 硬件设备管理 (Hardware Management)

**文件**: `hardware-management.component.ts`

**核心功能**:
- 设备分类统计（Arduino套件、Raspberry Pi、传感器模块、机器人底盘）
- 设备状态追踪（可用、使用中、维护中、损坏）
- 设备完好度监控
- 维护记录管理
- 设备借用与归还

**特色亮点**:
- 直观的设备分类卡片展示
- 实时设备状态可视化
- 维护历史记录追踪
- 设备损耗率分析

**适用场景**:
- K12科创中心设备管理
- 编程培训机构硬件租赁
- 职业学校实训设备维护

---

### 2. Token 计费管理 (Token Management)

**文件**: `token-management.component.ts`

**核心功能**:
- Token余额实时监控
- AI服务使用统计（AI助教、智能评测、课程生成、代码审查）
- 充值套餐选择
- 交易记录查询
- 使用趋势分析

**特色亮点**:
- 按需付费模式展示
- 多维度服务使用统计
- 灵活的充值套餐设计
- 7天使用趋势图表

**适用场景**:
- AI助教服务计费
- 智能评测系统使用
- 自动化课程生成
- 代码质量审查

---

### 3. 实验项目跟踪 (Project Management)

**文件**: `project-management.component.ts`

**核心功能**:
- 项目分类管理（机器人、编程、物联网、人工智能）
- 项目进度追踪
- 学生参与情况
- 作品展示管理
- 导师指导记录

**特色亮点**:
- 多分类项目组织
- 可视化进度条
- 作品展示标识
- 技术栈标签展示

**适用场景**:
- 机器人竞赛项目
- 创客作品开发
- IoT项目开发
- AI应用实践

---

### 4. 创客空间预约 (Space Scheduling)

**文件**: `space-scheduling.component.ts`

**核心功能**:
- 空间分类管理（实验室、创客空间、教室、工作坊）
- 实时空间状态
- 在线预约系统
- 今日预约列表
- 快速预约表单

**特色亮点**:
- 空间可用性实时显示
- 设备配置信息展示
- 冲突检测与提示
- 灵活的时间段选择

**适用场景**:
- 实验室预约使用
- 创客空间共享
- 工作坊活动安排
- 设备集中使用

---

## 统一容器组件

**文件**: `stem-features-container.component.ts`

将所有STEM特色功能整合到一个统一的标签页容器中，方便用户在不同功能间切换。

**特点**:
- 标签页导航
- 统一的视觉风格
- 响应式布局
- 模块化设计

---

## 技术实现

### 前端框架
- Angular 17+
- Angular Material UI组件库

### 核心组件
- MatCard - 卡片布局
- MatTable - 数据表格
- MatProgressBar - 进度条
- MatChips - 标签芯片
- MatTabs - 标签页
- MatIconModule - 图标

### 设计风格
- 现代化扁平设计
- 渐变色图标背景
- 清晰的视觉层次
- 响应式布局适配

---

## 集成到现有系统

### 1. 在培训仪表板中添加链接

已在 `training-dashboard.component.ts` 中的 `onStemFeatureClick` 方法添加了导航逻辑：

```typescript
onStemFeatureClick(feature: string): void {
  switch(feature) {
    case 'hardware':
      // Navigate to hardware management
      break;
    case 'projects':
      // Navigate to project management
      break;
    case 'token':
      // Navigate to token management
      break;
    case 'makerspace':
      // Navigate to space scheduling
      break;
  }
}
```

### 2. 路由配置建议

```typescript
const routes: Routes = [
  {
    path: 'stem-features',
    component: StemFeaturesContainerComponent,
    children: [
      { path: 'hardware', component: HardwareManagementComponent },
      { path: 'token', component: TokenManagementComponent },
      { path: 'projects', component: ProjectManagementComponent },
      { path: 'space', component: SpaceSchedulingComponent }
    ]
  }
];
```

---

## 后续优化建议

### 短期优化
1. **添加真实API集成** - 连接后端数据源
2. **完善表单验证** - 添加输入验证和错误提示
3. **增加搜索过滤** - 增强数据筛选功能
4. **添加导出功能** - 支持Excel/PDF导出

### 中期优化
1. **数据可视化增强** - 集成Chart.js或D3.js
2. **实时通知系统** - WebSocket实时更新
3. **移动端适配** - 优化移动设备体验
4. **权限控制** - 基于角色的访问控制

### 长期优化
1. **AI智能推荐** - 基于使用习惯推荐资源
2. **自动化报告** - 定期生成使用分析报告
3. **多语言支持** - 国际化适配
4. **离线模式** - PWA离线功能支持

---

## 文件清单

```
frontend/src/app/organization-management/organization-portal/components/dashboard-overview/
├── hardware-management.component.ts      # 硬件设备管理
├── token-management.component.ts         # Token计费管理
├── project-management.component.ts       # 项目管理
├── space-scheduling.component.ts         # 空间调度
├── stem-features-container.component.ts  # 统一容器
└── README_STEM_FEATURES.md               # 本文档
```

---

## 演示账号

所有原型页面均支持演示模式，使用以下账号登录：

- **管理员**: zhao_admin / demo123456
- **导师**: zhang_mentor / demo123456
- **学员**: student_001 / demo123456

---

## 联系方式

如有问题或建议，请联系开发团队。

**最后更新**: 2024-01-20