# OpenMT Demo 页面完善报告

## 完成时间
2026-05-21

## 问题背景
原 Demo 页面依赖 Angular 前端项目（localhost:4200），但该项目存在大量缺失文件和编译错误，无法正常启动。

## 解决方案
创建了 **4 个独立的静态演示页面**，不依赖 Angular 编译，直接使用 Mock 数据展示专业级 Demo 效果。

## 创建的文件

### 1. 职业教育 Demo
- **路径**: `/marketing-site/app/demo/vocational-static/page.tsx`
- **机构**: Advanced Technical College（高级技术学院）
- **特色功能**:
  - 学生/教师/课程/就业率统计卡片
  - 招生趋势图表（AreaChart）
  - 课程完成状态饼图（PieChart）
  - 近期动态列表
  - 今日课程表
  - 左侧导航菜单
  - 顶部搜索和通知功能

### 2. K12 科创中心 Demo
- **路径**: `/marketing-site/app/demo/k12-static/page.tsx`
- **机构**: 阳光中学科创中心
- **特色功能**:
  - 参与学生/教学设备/指导教师/竞赛获奖统计
  - 设备使用趋势图表
  - 设备类型分布饼图（Arduino、Raspberry Pi、3D打印机等）
  - 竞赛管理（国家级、省级、市级）
  - 设备借用管理
  - 创客空间课程表

### 3. 编程培训机构 Demo
- **路径**: `/marketing-site/app/demo/training-static/page.tsx`
- **机构**: 星海机器人培训中心
- **特色功能**:
  - 在学学员/授课教师/开设课程/完成率统计
  - 招生趋势图表
  - 课程类型分布（Python、C++、机器人、AI）
  - 热门课程排行榜（带评分和进度条）
  - 今日直播课程表
  - 学员作品展示区

### 4. 教育局监管 Demo
- **路径**: `/marketing-site/app/demo/bureau-static/page.tsx`
- **机构**: 北京市海淀区教育局
- **特色功能**:
  - 管辖学校/在校学生/在职教师/STEM覆盖率统计
  - STEM 教育覆盖率趋势图
  - 学校类型分布（小学、初中、高中）
  - 学校 STEM 教育排名
  - 资源调配情况（预算和使用率）
  - 区域教育数据汇总

## 技术实现

### 使用的技术栈
- **Next.js 16.2.6** (Turbopack)
- **React 18** (use client)
- **Tailwind CSS** (样式)
- **Recharts** (数据可视化图表)
- **Lucide React** (图标库)
- **Framer Motion** (动画效果)

### 页面结构
每个 Demo 页面包含：
1. **左侧边栏**: 机构 Logo、用户信息、导航菜单
2. **顶部导航栏**: 搜索框、演示模式标识、通知、返回按钮
3. **标签页切换**: 总览、特定功能模块、数据分析
4. **统计卡片**: 4 个核心指标，带趋势变化
5. **数据图表**: 趋势图（AreaChart）+ 分布图（PieChart）
6. **列表区域**: 动态/课程/排名等
7. **浮动信息框**: 演示账号信息和只读提示

### 设计特点
- 统一的浅色主题（bg-slate-50）
- 每个组织类型有独立的主题色（purple/green/blue/orange）
- 响应式布局（grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4）
- 悬停效果和平滑过渡
- 专业的数据可视化

## 访问方式

### 通过 Demo 选择页面
1. 访问 `http://localhost:3000/demo`
2. 点击任意组织类型的"进入 Demo"按钮
3. 自动重定向到对应的静态演示页面

### 直接访问
- 职业教育: `http://localhost:3000/demo/vocational` 或 `/demo/vocational-static`
- K12: `http://localhost:3000/demo/k12` 或 `/demo/k12-static`
- 培训机构: `http://localhost:3000/demo/training` 或 `/demo/training-static`
- 教育局: `http://localhost:3000/demo/bureau` 或 `/demo/bureau-static`

## 演示账号信息

### 职业教育
- 实训主任: `zhao_director / demo123456`
- 企业导师: `liu_mentor / demo123456`
- 学生: `student_voc_001 / demo123456`

### K12
- 校长: `liu_principal / demo123456`
- 教务主任: `wang_director / demo123456`
- 教师: `chen_teacher / demo123456`

### 培训机构
- 管理员: `zhao_admin / demo123456`
- 教师: `zhang_teacher / demo123456`
- 学生: `student_001 / demo123456`

### 教育局
- 局长: `wang_director / demo123456`
- 督导员: `li_inspector / demo123456`
- 教研员: `zhang_researcher / demo123456`

## 后续优化建议

1. **添加更多交互**: 表格排序、筛选、分页
2. **数据导出**: 支持 CSV/Excel 导出
3. **深色模式**: 添加主题切换
4. **移动端适配**: 优化小屏幕显示
5. **真实数据接入**: 后续可连接后端 API
6. **权限演示**: 不同角色看到不同内容

## 注意事项
- 所有页面为**只读模式**，无法修改数据
- 数据为静态 Mock 数据，刷新后重置
- 已安装 `recharts` 依赖（`npm install recharts`）
- 开发服务器运行在 `http://localhost:3000`
