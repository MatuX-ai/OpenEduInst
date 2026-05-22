"use client";

import { motion } from "framer-motion";
import { Cpu, FlaskConical, Coins, Warehouse, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Cpu,
    title: "硬件设备全生命周期管理",
    description: "从采购入库到报废回收，扫码借出、押金管理、维护记录、损耗追踪，Arduino/Raspberry Pi/3D打印机一站管理。",
    href: "/features/hardware",
    color: "blue",
    highlights: ["扫码借出/归还", "押金自动计算", "损耗率分析", "维护提醒"],
  },
  {
    icon: FlaskConical,
    title: "实验项目与课程管理",
    description: "机器人竞赛追踪、创客作品归档、代码仓库集成。支持里程碑管理、Peer Review 互评、多维度教师评分。",
    href: "/features/projects",
    color: "green",
    highlights: ["项目里程碑", "代码仓库", "作品展示墙", "Peer Review"],
  },
  {
    icon: Coins,
    title: "Token 智能计费",
    description: "AI 助教、代码评测、个性化课程生成按需付费。从免费额度到企业定制，灵活满足不同规模需求。",
    href: "/features/token",
    color: "purple",
    highlights: ["AI 智能助教", "代码自动评测", "课程生成", "灵活套餐"],
  },
  {
    icon: Warehouse,
    title: "创客空间智能调度",
    description: "实验室预约、贵重设备共享、安全准入认证、空间利用率分析。让每一平米创客空间发挥最大价值。",
    href: "/features/makerspace",
    color: "orange",
    highlights: ["可视化预约", "冲突检测", "安全认证", "热力图分析"],
  },
];

export default function FeaturesOverview() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
            四大核心能力，覆盖 STEM 教育全场景
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            从硬件到软件，从课堂到竞赛，从单机构到区域监管 —— OpenMT 为您提供完整的 STEM 教育管理方案。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const colorMap = {
              blue: { border: "border-blue-500/20 hover:border-blue-500/50", bg: "bg-blue-500/10", text: "text-blue-500", badge: "bg-blue-500/10 text-blue-400" },
              green: { border: "border-green-500/20 hover:border-green-500/50", bg: "bg-green-500/10", text: "text-green-500", badge: "bg-green-500/10 text-green-400" },
              purple: { border: "border-purple-500/20 hover:border-purple-500/50", bg: "bg-purple-500/10", text: "text-purple-500", badge: "bg-purple-500/10 text-purple-400" },
              orange: { border: "border-orange-500/20 hover:border-orange-500/50", bg: "bg-orange-500/10", text: "text-orange-500", badge: "bg-orange-500/10 text-orange-400" },
            };
            const c = colorMap[feature.color as keyof typeof colorMap];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`p-6 rounded-xl bg-slate-800/30 border ${c.border} transition-all duration-300 group`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className={`w-7 h-7 ${c.text}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {feature.highlights.map((h, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${c.badge} border ${c.border}`}>
                      {h}
                    </span>
                  ))}
                </div>

                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  了解详情
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
