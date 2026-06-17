"use client";

import { motion } from "framer-motion";
import { Coins, Check, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function TokenFeature() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Coins className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-400">STEM 核心功能</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            Token 智能计费系统
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            AI 助教、代码自动评测、课程生成等高级功能按需付费。灵活的 Token 套餐，
            从免费试用到企业级配额，满足不同规模机构的需求。
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
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
                <Play className="w-10 h-10 text-purple-500 ml-1" />
              </div>
              <p className="text-slate-400">点击播放演示视频</p>
              <p className="text-sm text-slate-500 mt-2">
                Token 充值与使用流程 · 3分钟
              </p>
            </div>

            {/* 装饰性网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)",
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
                title: "AI 智能助教",
                description:
                  "学生编程遇到问题时，AI 助教提供实时指导（非直接给答案）。按对话次数消耗 Token，教师可查看交互记录。",
                icon: "🤖",
              },
              {
                title: "代码自动评测",
                description:
                  "提交 Arduino/Python 代码后，AI 分析代码质量、给出优化建议、检测潜在 bug。每次评测消耗少量 Token。",
                icon: "✅",
              },
              {
                title: "个性化课程生成",
                description:
                  "根据学生水平和兴趣，AI 自动生成定制化学习路径和练习题目。每月赠送基础额度，超额部分按需购买。",
                icon: "📝",
              },
              {
                title: "灵活计费模式",
                description:
                  "Free（每月 100 Tokens）、Standard（¥99/月，1000 Tokens）、Premium（¥299/月，5000 Tokens）、Enterprise（定制配额）。",
                icon: "💰",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all duration-300"
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

        {/* 价格方案 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-100">
            Token 套餐方案
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                name: "Free",
                price: "¥0",
                period: "/月",
                tokens: "100",
                features: ["AI 助教（限次）", "基础代码评测", "社区支持"],
                highlight: false,
              },
              {
                name: "Standard",
                price: "¥99",
                period: "/月",
                tokens: "1,000",
                features: [
                  "AI 助教无限次",
                  "高级代码评测",
                  "课程生成功能",
                  "邮件支持",
                ],
                highlight: false,
              },
              {
                name: "Premium",
                price: "¥299",
                period: "/月",
                tokens: "5,000",
                features: [
                  "所有 Standard 功能",
                  "优先响应",
                  "API 访问权限",
                  "数据分析报告",
                ],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "定制",
                period: "",
                tokens: "无限",
                features: [
                  "专属客服",
                  "私有化部署",
                  "SLA 保障",
                  "定制开发",
                ],
                highlight: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 ${
                  plan.highlight
                    ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/50 border-slate-700"
                }`}
              >
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-100">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <div className="text-sm text-slate-300 mb-4">
                  {plan.tokens} Tokens/月
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-400 flex items-center gap-2"
                    >
                      <Check className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                  }`}
                >
                  {plan.name === "Enterprise" ? "联系我们" : "选择方案"}
                </button>
              </motion.div>
            ))}
          </div>
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
