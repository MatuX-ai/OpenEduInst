# OpenMT - 开源 STEM 教育机构管理工具

## 🎯 项目概述

**OpenMT** 是一个专为 **STEM 教育**（科学、技术、工程、数学）设计的开源机构管理系统。

与普通教培系统不同，OpenMT 专注于：
- 🔧 **硬件设备全生命周期管理**（Arduino/Raspberry Pi/传感器租赁、维护、损耗追踪）
- 🧪 **实验项目与课程管理**（机器人竞赛、创客作品、编程项目归档）
- 💰 **Token 计费系统**（AI 助教、智能评测、课程生成按需付费）
- 🏭 **创客空间调度**（实验室预约、设备共享、安全准入管理）

**🌐 官方网站与 Demo**：[访问演示网站](https://eduInst.matux.tech)（建设中）

## 📢 最新公告

### 🚀 Demo 网站开发计划启动

我们正在建设一个专业的 Demo 展示网站，用于：
- ✅ 在线体验 **STEM 特色功能**（硬件管理、实验项目、Token 计费、创客空间）
- ✅ 了解与普通教培系统的差异化优势
- ✅ 下载本地安装包或 Docker 部署
- ✅ 查阅完整文档与 API 参考

详细开发计划请查看：[docs/README_DEMO_PLAN.md](./docs/README_DEMO_PLAN.md)  
**⭐ 必读**：[docs/stem-features-comparison.md](./docs/stem-features-comparison.md) - OpenMT vs 普通教培系统对比

## 项目结构
```
OpenMTEduInst/
├── backend/                 # 后端服务 (FastAPI)
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由
│   ├── services/           # 业务逻辑服务
│   ├── scripts/            # 演示数据脚本
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端应用 (Angular)
│   └── src/
│       └── app/
│           └── organization-management/  # 机构管理模块
├── marketing-site/         # 营销站点 (Next.js) 🆕
│   ├── app/                # 页面组件
│   └── components/         # UI 组件
└── docs/                   # 文档
```

## 🎓 适用场景

| 组织类型 | 典型用例 |
|---------|----------|
| **K12 科创中心** | 管理 Arduino/Raspberry Pi 设备、学生创客作品、机器人竞赛培训 |
| **职业学校实训基地** | PLC 控制系统、CNC 机床、工业机器人等实训设备管理 |
| **编程培训机构** | Python/C++ 课程、物联网应用开发、AI 教学辅助 |
| **教育局监管平台** | 区内学校 STEM 教育数据统计、设备资源调配、师资培训 |

## ⚠️ 重要说明

**OpenMT 不是通用教培系统**，如果您需要的是：
- ❌ 文化课培训管理（数学、英语、语文等）
- ❌ 艺术兴趣班管理（钢琴、舞蹈、美术等）
- ❌ 体育培训管理（篮球、游泳、武术等）

建议使用其他通用教培系统。OpenMT 专为 **STEM 教育** 设计，提供：
- ✅ 硬件设备管理（扫码借出、押金管理、损耗追踪）
- ✅ 实验项目管理（代码仓库、作品展示、竞赛报名）
- ✅ Token 计费（AI 助教、智能评测、课程生成）
- ✅ 创客空间调度（实验室预约、安全准入、设备共享）

## 技术栈
- **后端**: FastAPI + SQLAlchemy + PostgreSQL/SQLite
- **前端**: Angular 17 + Angular Material
- **营销站点**: Next.js 16 + TailwindCSS + Framer Motion
- **缓存**: Redis
- **部署**: Docker / Vercel

## 🚀 快速开始

### ⚡ 当前开发状态

**Demo 网站开发中** - 预计 2026 年 Q3 上线

- ✅ 完成 STEM 定位调整与需求分析
- ✅ 完成 Figma 设计规范文档
- ✅ 完成演示数据种子脚本
- ✅ 完成只读账号中间件
- ✅ 完成 Next.js 营销站点初始化
- ✅ 完成首页、Demo 入口、4个功能详情页、下载页
- 🔄 正在进行：Vercel 部署配置
- ⬜ 待完成：域名绑定、SEO 优化

详细进度请查看：[docs/DEV_PROGRESS_REPORT.md](./docs/DEV_PROGRESS_REPORT.md)

### 后端
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 前端
```bash
cd frontend
npm install
ng serve
```

### 营销站点
```bash
cd marketing-site
npm run dev
# 访问 http://localhost:3000
```

## 许可证
MIT License
