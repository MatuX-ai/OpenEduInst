"use client";

import { motion } from "framer-motion";
import { HelpCircle, ArrowLeft, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";

const faqs = [
  {
    q: "OpenMT 是免费的吗？",
    a: "是的，OpenMT 采用 MIT 开源协议，完全免费使用。核心功能（设备管理、项目管理、创客空间调度）永久免费。Token 计费的 AI 功能（AI 助教、代码评测等）需要按量购买，但提供每月 100 Token 的免费额度。",
  },
  {
    q: "OpenMT 与普通教培系统有什么区别？",
    a: "OpenMT 专为 STEM 教育设计，提供硬件设备全生命周期管理（扫码借出、押金管理、损耗追踪）、实验项目与代码仓库集成、创客空间预约调度、Token AI 计费等普通教培系统不具备的功能。不适用于文化课、艺术类培训。",
  },
  {
    q: "支持哪些硬件设备？",
    a: "OpenMT 的硬件模块支持管理任何类型的 STEM 教学设备，包括但不限于：Arduino 开发板、Raspberry Pi、传感器模块、3D 打印机、激光切割机、CNC 机床、机器人套件、PLC 控制系统、无人机等。你可以自定义设备分类和属性。",
  },
  {
    q: "如何部署 OpenMT？",
    a: "推荐使用 Docker 一键部署，只需运行 docker-compose up -d 即可。也支持本地安装（需要 Python 3.9+ 和 Node.js 18+）。详见快速开始文档。",
  },
  {
    q: "支持哪些数据库？",
    a: "开发环境默认使用 SQLite（无需额外配置），生产环境推荐使用 PostgreSQL。Docker 部署默认包含 PostgreSQL 和 Redis。",
  },
  {
    q: "是否支持多租户/多机构？",
    a: "是的。OpenMT 支持多机构管理模式，每个机构有独立的数据隔离。教育局监管账号可以查看区域内所有学校的数据。",
  },
  {
    q: "Token 是怎么计算的？",
    a: "Token 是 AI 功能的计费单位。例如：AI 助教对话 1 次消耗 1 Token，代码自动评测 1 次消耗 5 Token，个性化课程生成 1 次消耗 20 Token。每月有免费额度，超额按套餐购买。",
  },
  {
    q: "有没有移动端 App？",
    a: "前端基于 Angular 构建，采用响应式设计，在手机和平板浏览器上都有良好的体验。原生移动 App 正在开发中。",
  },
  {
    q: "如何获取技术支持？",
    a: "可以通过 GitHub Issues 提交问题、加入 Discord 社区讨论，或发送邮件到 contact@matux.tech。企业版用户享受专属客服和 SLA 保障。",
  },
  {
    q: "数据安全如何保证？",
    a: "本地部署版数据完全存储在您的服务器上。演示环境使用只读账号，数据每天自动重置。API 使用 JWT 认证，支持 HTTPS 传输加密。",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文档中心
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
            <HelpCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-400">常见问题</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            常见问题 (FAQ)
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            关于 OpenMT 的常见疑问和解答。如果找不到答案，欢迎联系我们。
          </p>

          {/* FAQ 列表 */}
          <div className="space-y-4 mb-16">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/70 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-200 pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-5">
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 联系支持 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center p-8 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30"
          >
            <MessageCircle className="w-8 h-8 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2 text-slate-100">还有疑问？</h3>
            <p className="text-sm text-slate-400 mb-4">
              加入 Discord 社区或提交 GitHub Issue，我们随时为您解答。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://github.com/OpenMTEduInst/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                GitHub Issues
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
