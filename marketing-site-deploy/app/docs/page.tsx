"use client";

import { motion } from "framer-motion";
import { BookOpen, Code, Rocket, HelpCircle, ArrowRight, FileText, Terminal, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

const docSections = [
  {
    icon: Rocket,
    title: "快速开始",
    description: "5 分钟快速部署 OpenMT，包含环境准备、Docker 启动、初始配置。",
    href: "/docs/quick-start",
    iconBg: "bg-green-500/10 group-hover:bg-green-500/20",
    iconColor: "text-green-500",
  },
  {
    icon: FileText,
    title: "用户手册",
    description: "完整的使用指南，涵盖硬件管理、项目管理、Token 计费、创客空间等全部功能。",
    href: "/docs/user-guide",
    iconBg: "bg-blue-500/10 group-hover:bg-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Code,
    title: "API 参考",
    description: "RESTful API 接口文档，包含认证、设备、项目、Token 等所有端点的详细说明。",
    href: "/docs/api",
    iconBg: "bg-purple-500/10 group-hover:bg-purple-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: Terminal,
    title: "部署指南",
    description: "Docker 部署、本地安装、云服务部署等不同环境的详细配置教程。",
    href: "/docs/deploy",
    iconBg: "bg-orange-500/10 group-hover:bg-orange-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: HelpCircle,
    title: "常见问题",
    description: "FAQ 合集，覆盖安装配置、功能使用、故障排除等常见疑问。",
    href: "/docs/faq",
    iconBg: "bg-red-500/10 group-hover:bg-red-500/20",
    iconColor: "text-red-500",
  },
  {
    icon: MessageCircle,
    title: "社区支持",
    description: "加入 Discord 社区、提交 GitHub Issues、贡献代码指南。",
    href: "/docs/community",
    iconBg: "bg-teal-500/10 group-hover:bg-teal-500/20",
    iconColor: "text-teal-500",
  },
];

export default function DocsIndex() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-400">文档中心</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            OpenMT 文档中心
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            从快速开始到深度集成，这里包含了使用 OpenMT 所需的一切文档。
            如果找不到需要的内容，欢迎在 GitHub Issues 中提问。
          </p>
        </motion.div>

        {/* 文档导航网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {docSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={section.href}
                className="block p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group h-full"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${section.iconBg}`}>
                  <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-100 group-hover:text-blue-400 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {section.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-blue-400 group-hover:text-blue-300">
                  阅读文档
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 外部资源 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto p-6 rounded-xl bg-slate-800/30 border border-slate-700"
        >
          <h3 className="text-lg font-semibold mb-4 text-slate-100">
            外部资源
          </h3>
          <div className="space-y-3">
            <a
              href="https://github.com/OpenMTEduInst"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-slate-200">GitHub 仓库</div>
                  <div className="text-xs text-slate-500">查看源码、提交 Issue、贡献代码</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </a>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
