"use client";

import { motion } from "framer-motion";
import { Bot, Factory, Code2, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const organizations = [
  {
    id: "k12",
    type: "k12",
    icon: Bot,
    title: "K12 STEM科创中心",
    description: "管理 Arduino/Raspberry Pi 设备、学生创客作品、机器人竞赛培训",
    features: ["硬件设备管理", "学生作品归档", "竞赛报名追踪"],
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  {
    id: "vocational",
    type: "vocational",
    icon: Factory,
    title: "职业学校STEM实训",
    description: "PLC 控制系统、CNC 机床、工业机器人等实训设备管理",
    features: ["实训设备调度", "校企合作跟踪", "技能认证管理"],
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "training",
    type: "training",
    icon: Code2,
    title: "STEM培训机构",
    description: "Python/C++ 课程、物联网应用开发、AI 教学辅助、硬件设备管理",
    features: ["Token AI 功能", "硬件设备管理", "创客项目追踪"],
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "bureau",
    type: "bureau",
    icon: Building2,
    title: "教育局STEM监管",
    description: "区内学校 STEM 教育数据统计、设备资源调配、师资培训",
    features: ["区域数据看板", "跨校资源共享", "STEM师资培训"],
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
];

function DemoEntryContent() {
  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type");

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-100">
            OpenMT
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            选择您的组织类型
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            选择不同的组织类型，体验对应的 Demo 环境和功能
          </p>
        </motion.div>

        {/* 组织类型卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {organizations.map((org, index) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                selectedType === org.type
                  ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20"
                  : "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${org.iconBg}`}
                >
                  <org.icon className={`w-8 h-8 ${org.iconColor}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-slate-100">
                    {org.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {org.description}
                  </p>

                  <ul className="space-y-2 mb-4">
                    {org.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/demo/${org.type}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    进入 Demo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/demo/create-org"
                    className="inline-flex items-center gap-2 px-4 py-2 ml-2 border border-blue-500 text-blue-400 hover:bg-blue-500/10 text-sm font-semibold rounded-lg transition-colors"
                  >
                    云托管创建
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 演示说明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto p-6 rounded-xl bg-slate-800/30 border border-slate-700"
        >
          <h3 className="text-lg font-semibold mb-3 text-slate-100">
            💡 演示环境说明
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• 所有演示账号为只读模式，无法修改数据</li>
            <li>• 数据每天凌晨 3:00 自动重置到初始状态</li>
            <li>• 如需完整功能，请下载本地版或注册云服务</li>
            <li>• 统一密码：<code className="px-2 py-1 bg-slate-700 rounded text-slate-200">demo123456</code></li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}

export default function DemoEntry() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <DemoEntryContent />
    </Suspense>
  );
}
