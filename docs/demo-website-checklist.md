# OpenMT Demo 网站 - 快速执行清单

## 🎯 核心目标
打造专业的 **STEM 教育机构管理工具** Demo 展示网站，用于需求对齐、产品营销和开源推广

**核心差异化**：硬件设备管理、实验项目管理、创客空间调度、Token 计费系统  
**参考对标**：https://www.matux.tech/institution-dashboard（普通教培）→ 我们要突出 **STEM 特色**  
**预计周期**：8-10 周

---

## 📋 优先级任务（P0 - 必须完成）

### 第 1 周：原型设计
- [ ] 完成 MatuX 竞品分析（记录功能模块、文案策略）
- [ ] **对比分析：普通教培 vs STEM 教育的差异点**
- [ ] 确定 4 种组织类型的核心价值主张（K12科创中心/职业学校实训/编程培训/教育局监管）
- [ ] Figma 设计首页原型（Hero + 场景卡片 + **硬件管理/实验项目/Token计费/创客空间**）
- [ ] Figma 设计 Demo 入口页原型（组织类型选择器）

### 第 2 周：技术搭建
- [ ] 初始化 Next.js 项目：`npx create-next-app@latest openmt-marketing`
- [ ] 安装依赖：TailwindCSS、shadcn/ui、Framer Motion
- [ ] 配置 Vercel 自动部署（连接 GitHub）
- [ ] 注册域名：eduInst.matux.tech

### 第 3 周：演示环境
- [ ] 创建 4 种组织类型的演示数据（SQL 种子脚本）
- [ ] 后端添加只读账号中间件（禁止 POST/PUT/DELETE）
- [ ] 配置每天凌晨 3:00 自动重置数据（Cron 任务）

### 第 4-5 周：首页开发
- [ ] Hero 区域（标题 + CTA 按钮 + 动态背景）
- [ ] 场景卡片（4 种组织类型网格布局）
- [ ] 核心功能预览（6-8 个图标 + 描述）
- [ ] Footer（GitHub 链接 + 文档入口）

### 第 6 周：Demo 集成
- [ ] 组织类型选择器页面
- [ ] iframe 嵌入主应用（跨域通信配置）
- [ ] Intro.js 交互式导览（5-7 步引导流程）
  - **重点演示**：硬件借出流程、实验项目创建、Token 充值

### 第 7 周：功能详情页
- [ ] **硬件设备全生命周期管理页面**（⭐ STEM 核心）
- [ ] **实验项目与课程管理页面**（⭐ STEM 核心）
- [ ] **Token 计费系统页面**（⭐ STEM 核心）
- [ ] **创客空间调度页面**（⭐ STEM 核心）
- [ ] 智能排课系统页面（GIF 演示）
- [ ] 财务与课时结算页面（图表展示 + **硬件租赁收入**）
- [ ] 下载与部署页（Docker + 本地安装包）

### 第 8 周：文档与 SEO
- [ ] 快速开始文档（5 分钟上手指南）
- [ ] 安装部署文档（Docker + 本地安装）
- [ ] Meta 标签优化（标题、描述、关键词）
- [ ] Google Analytics 集成

### 第 9 周：测试优化
- [ ] 跨浏览器测试（Chrome/Firefox/Safari/Edge）
- [ ] 响应式测试（移动端/平板/桌面）
- [ ] Lighthouse 性能优化（目标 90+）
- [ ] 可用性测试（5-10 位目标用户）

### 第 10 周：上线发布
- [ ] GitHub README 更新（添加官网链接）
- [ ] 社交媒体宣传（知乎/掘金/Twitter）
- [ ] Product Hunt 提交
- [ ] 监控 Analytics 数据并迭代

---

## 🔧 技术栈速查

```bash
# 1. 创建项目
npx create-next-app@latest openmt-marketing --typescript --tailwind --app
cd openmt-marketing

# 2. 安装 UI 组件库
npx shadcn-ui@latest init
npm install framer-motion lucide-react intro.js

# 3. 启动开发服务器
npm run dev
```

**推荐结构**：
```
openmt-marketing/
├── app/
│   ├── page.tsx              # 首页
│   ├── demo/page.tsx         # Demo 入口
│   ├── features/[slug]/      # 功能详情页
│   ├── download/page.tsx     # 下载页
│   └── docs/                 # 文档
├── components/
│   ├── landing/              # 首页组件
│   ├── demo/                 # Demo 组件
│   └── ui/                   # shadcn 组件
└── public/
    ├── screenshots/          # 产品截图
    └── images/               # 图片资源
```

---

## 📊 关键指标（KPI）

| 指标 | 目标（1个月） | 目标（3个月） |
|------|--------------|--------------|
| 网站访问量 | 1000 UV/月 | 5000 UV/月 |
| Demo 试用率 | > 20% | > 25% |
| 下载转化率 | > 10% | > 15% |
| GitHub Stars | +100 | +300 |

---

## ⚠️ 注意事项

1. **Demo 数据安全**：使用只读账号，禁止修改操作
2. **性能优化**：首屏加载 < 2秒，使用 CDN 加速
3. **SEO 友好**：每个页面配置 Meta 标签，生成 sitemap.xml
4. **响应式设计**：确保移动端体验流畅
5. **Analytics 追踪**：监控 CTA 点击、Demo 启动、下载转化

---

## 🚀 快速启动命令

```bash
# 克隆现有主应用（如果需要参考）
git clone <your-repo> OpenMTEduInst

# 创建营销站点
cd OpenMTEduInst
mkdir marketing-site && cd marketing-site
npx create-next-app@latest . --typescript --tailwind --app

# 安装依赖
npm install framer-motion lucide-react intro.js recharts
npx shadcn-ui@latest init

# 启动开发
npm run dev
# 访问 http://localhost:3000
```

---

## 📞 需要协助？

- 原型设计 → 使用 Figma，参考 MatuX 布局
- 技术问题 → 查阅 Next.js 官方文档
- 内容撰写 → 参考竞品文案，突出差异化优势
- 部署问题 → Vercel 文档非常详细

---

**最后更新**：2026-05-20  
**状态**：计划已制定，等待执行
