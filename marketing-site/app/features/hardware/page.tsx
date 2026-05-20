"use client";

import { motion } from "framer-motion";
import { Cpu, Check, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";

export default function HardwareFeature() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Cpu className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-400">STEM 核心功能</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            硬件设备全生命周期管理
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            从采购到报废，一站式管理 Arduino、Raspberry Pi、传感器等 STEM 教学设备。
            扫码借出、押金管理、维护记录、损耗追踪，让设备管理更高效。
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
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                <Play className="w-10 h-10 text-blue-500 ml-1" />
              </div>
              <p className="text-slate-400">点击播放演示视频</p>
              <p className="text-sm text-slate-500 mt-2">
                扫码借出流程 · 3分钟
              </p>
            </div>

            {/* 装饰性网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
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
                title: "设备库存管理",
                description:
                  "管理 Arduino、Raspberry Pi、传感器套件、3D 打印机等各类 STEM 设备。支持批量导入、分类标签、库存预警。",
                icon: "📦",
              },
              {
                title: "租赁与归还流程",
                description:
                  "扫码借出设备，自动计算押金（按设备价值）。归还时检查设备状态，损坏自动触发赔偿流程。",
                icon: "🔄",
              },
              {
                title: "维护记录追踪",
                description:
                  "记录每次维修历史、更换零件、耗材使用情况。自动生成维护报告，预测设备寿命。",
                icon: "🔧",
              },
              {
                title: "使用统计分析",
                description:
                  "热门设备排行、闲置预警、损耗率统计。帮助优化设备采购决策，提高资源利用率。",
                icon: "📊",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
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
          className="max-w-3xl mx-auto p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/30 mb-16"
        >
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            💡 用户场景案例
          </h3>
          <blockquote className="text-slate-300 leading-relaxed mb-4">
            "使用 OpenMT 后，我们 K12 科创中心的设备管理效率提升了
            80%。学生扫码即可借出 Arduino 套件，系统自动记录使用情况。期末盘点时，设备损耗率从 15%
            降低到 5%，节省了数千元的维修成本。"
          </blockquote>
          <cite className="text-sm text-slate-400 not-italic">
            — 张老师，星海机器人培训中心
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
      </main>
    </div>
  );
}
