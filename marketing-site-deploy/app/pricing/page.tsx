"use client";

import { motion } from "framer-motion";
import { Check, Coins, Zap, HelpCircle, ArrowRight, Shield, Server, Headphones, GitBranch } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

const plans = [
  {
    name: "Free",
    subtitle: "适合个人体验",
    price: "¥0",
    period: "永久免费",
    tokens: "100 Tokens/月",
    description: "核心功能免费使用，适合个人和小团队",
    features: [
      "完整硬件设备管理",
      "实验项目管理",
      "创客空间基础调度",
      "AI 助教（限 100 Tokens）",
      "基础代码评测",
      "社区支持",
    ],
    cta: "免费开始",
    href: "/demo",
    highlight: false,
  },
  {
    name: "Standard",
    subtitle: "适合小型机构",
    price: "¥99",
    period: "/月",
    tokens: "1,000 Tokens/月",
    description: "解锁全部AI功能，支持小团队协作",
    features: [
      "所有 Free 功能",
      "AI 助教无限制",
      "高级代码评测",
      "个性化课程生成",
      "数据分析报告",
      "邮件技术支持",
    ],
    cta: "选择 Standard",
    href: "/demo",
    highlight: false,
  },
  {
    name: "Premium",
    subtitle: "适合中型机构",
    price: "¥299",
    period: "/月",
    tokens: "5,000 Tokens/月",
    description: "高级功能和优先支持，适合多校区管理",
    features: [
      "所有 Standard 功能",
      "多校区管理",
      "API 访问权限",
      "自定义品牌",
      "优先技术支持",
      "SLA 99.9% 保障",
    ],
    cta: "选择 Premium",
    href: "/demo",
    highlight: true,
  },
  {
    name: "Enterprise",
    subtitle: "适合大型机构",
    price: "定制",
    period: "",
    tokens: "无限 Tokens",
    description: "私有化部署、定制开发、专属服务",
    features: [
      "所有 Premium 功能",
      "私有化部署",
      "定制功能开发",
      "专属客户经理",
      "7×24 技术支持",
      "SLA 99.99%",
    ],
    cta: "联系我们",
    href: "mailto:contact@matux.tech",
    highlight: false,
  },
];

const faqItems = [
  {
    q: "Token 是什么？怎么计算？",
    a: "Token 是 AI 功能的计费单位。AI 助教对话 1 次 ≈ 1 Token，代码评测 1 次 ≈ 5 Token，课程生成 1 次 ≈ 20 Token。所有套餐每月 1 号自动重置 Token 额度。",
  },
  {
    q: "如何升级或降级套餐？",
    a: "随时在后台 Token 中心进行套餐变更。升级立即生效，降级在下一个计费周期生效。未使用的 Token 不累积到下月。",
  },
  {
    q: "数据安全如何保障？",
    a: "Free/Standard/Premium 套餐数据存储在加密云服务器。Enterprise 支持私有化部署，数据完全存储在您的服务器上。所有套餐均支持 HTTPS 加密传输。",
  },
  {
    q: "支持哪些支付方式？",
    a: "支持微信支付、支付宝、银行转账。Enterprise 套餐支持对公转账和发票开具。",
  },
];

export default function PricingPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Coins className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-400">灵活定价</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            简单透明的定价
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            核心功能永久免费，AI 功能按需付费。从个人到企业，找到适合您的方案。
          </p>
        </motion.div>

        {/* 价格卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col p-6 rounded-xl border-2 ${
                plan.highlight
                  ? "bg-gradient-to-b from-purple-500/10 to-blue-500/10 border-purple-500 shadow-lg shadow-purple-500/20"
                  : "bg-slate-800/30 border-slate-700 hover:border-blue-500/50"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  最受欢迎
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-100 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500">{plan.subtitle}</p>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-slate-100">{plan.price}</span>
                {plan.period && <span className="text-sm text-slate-400 ml-1">{plan.period}</span>}
              </div>
              <div className="text-sm font-medium text-purple-400 mb-4">{plan.tokens}</div>

              <p className="text-xs text-slate-500 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors ${
                  plan.highlight
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 为什么选择 OpenMT */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-100">
            所有套餐均包含
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "MIT 开源协议", desc: "自由使用、修改、分发" },
              { icon: Server, title: "自动更新", desc: "Docker 一键升级" },
              { icon: Headphones, title: "技术支持", desc: "GitHub Issues + Discord" },
              { icon: GitBranch, title: "源码开放", desc: "安全透明，可审计" },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 text-center">
                <item.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                <div className="text-sm font-semibold text-slate-200 mb-1">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-100 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            常见问题
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-800/30 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{item.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
