"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function CommunityPage() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 mb-6">
            <MessageCircle className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-teal-400">社区</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            社区支持
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            加入 OpenMT 社区，获取帮助、分享经验、贡献代码。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* GitHub */}
            <motion.a
              href="https://github.com/OpenMTEduInst"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0 }}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group text-center"
            >
              <div className="w-10 h-10 mx-auto mb-4 text-slate-400 group-hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">GitHub</h3>
              <p className="text-sm text-slate-400 mb-4">查看源码、提交 Issue、贡献代码</p>
              <ExternalLink className="w-4 h-4 mx-auto text-slate-500 group-hover:text-blue-400" />
            </motion.a>

            {/* Discord */}
            <motion.a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group text-center"
            >
              <MessageCircle className="w-10 h-10 mx-auto mb-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <h3 className="text-lg font-semibold mb-2 text-slate-100">Discord</h3>
              <p className="text-sm text-slate-400 mb-4">实时讨论、技术交流、社区活动</p>
              <ExternalLink className="w-4 h-4 mx-auto text-slate-500 group-hover:text-blue-400" />
            </motion.a>

            {/* Email */}
            <motion.a
              href="mailto:contact@matux.tech"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group text-center"
            >
              <Mail className="w-10 h-10 mx-auto mb-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <h3 className="text-lg font-semibold mb-2 text-slate-100">邮件</h3>
              <p className="text-sm text-slate-400 mb-4">商务合作、媒体咨询</p>
              <ExternalLink className="w-4 h-4 mx-auto text-slate-500 group-hover:text-blue-400" />
            </motion.a>
          </div>

          {/* 贡献指南 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 rounded-xl bg-slate-800/30 border border-slate-700"
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-100">🤝 贡献指南</h2>
            <div className="space-y-4 text-sm text-slate-400">
              <p>欢迎为 OpenMT 贡献代码、文档或创意！参与方式：</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Fork 仓库到你的 GitHub 账号</li>
                <li>创建功能分支：<code className="px-2 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">git checkout -b feature/your-feature</code></li>
                <li>提交你的修改（遵循 Conventional Commits 规范）</li>
                <li>推送到分支并创建 Pull Request</li>
                <li>等待 Code Review 和合并</li>
              </ol>
              <p className="pt-4 text-slate-500">
                所有贡献者需遵守我们的行为准则（Code of Conduct）。
                OpenMT 采用 MIT 协议，你的贡献也将以 MIT 协议开源。
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
