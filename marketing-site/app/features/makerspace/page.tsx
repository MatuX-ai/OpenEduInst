"use client";

import { motion } from "framer-motion";
import { Warehouse, Check, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function MakerspaceFeature() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
            <Warehouse className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-orange-400">STEM 核心功能</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            创客空间智能调度
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            实验室预约、设备共享池、安全准入认证，一站式管理创客空间资源。
            可视化日历视图，冲突自动检测，让空间利用率最大化。
          </p>
        </motion.div>

        {/* 产品演示图 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto mb-16 rounded-xl overflow-hidden border border-slate-700 shadow-2xl"
        >
          <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/30 transition-colors">
                <Play className="w-10 h-10 text-orange-500 ml-1" />
              </div>
              <p className="text-slate-400">点击播放演示视频</p>
              <p className="text-sm text-slate-500 mt-2">
                实验室预约流程 · 3分钟
              </p>
            </div>

            {/* 装饰性网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* 功能亮点 */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-100">
            功能亮点
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "实验室预约系统",
                description:
                  "可视化日历视图，支持按教室、时间段筛选。冲突自动检测，预约审批流程（教师 → 管理员）。",
                icon: "📅",
              },
              {
                title: "设备共享池",
                description:
                  "3D 打印机、激光切割机、CNC 机床等贵重设备集中管理。在线排队预约，使用时长统计。",
                icon: "🔧",
              },
              {
                title: "安全准入认证",
                description:
                  "学生需通过安全培训考试后才能预约高危设备（电烙铁、激光切割等）。证书有效期管理，到期自动提醒续期。",
                icon: "🛡️",
              },
              {
                title: "空间利用率分析",
                description:
                  "各实验室使用率热力图、高峰时段分析、闲置预警。帮助优化空间配置，提高资源利用效率。",
                icon: "📊",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 用户案例 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 mb-16"
        >
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            💡 用户场景案例
          </h3>
          <blockquote className="text-slate-300 leading-relaxed mb-4">
            "职业学校的实训基地有 10 间实验室和 20+ 台 CNC 机床。以前手工登记经常冲突，现在学生在线预约，系统自动检测时间冲突和设备可用性。安全认证功能确保只有经过培训的学生才能操作危险设备，大大降低了事故风险。"
          </blockquote>
          <cite className="text-sm text-slate-400 not-italic">
            — XX 职业技术学院实训基地
          </cite>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link
              href="/demo"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              立即试用 Demo
              <Check className="w-5 h-5" />
            </Link>
            <Link
              href="/download"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 hover:border-blue-500 transition-all inline-flex items-center gap-2"
            >
              下载本地版
            </Link>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
