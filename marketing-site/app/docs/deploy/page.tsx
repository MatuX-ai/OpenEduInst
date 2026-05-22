"use client";

import { motion } from "framer-motion";
import { Terminal, ArrowLeft, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function DeployGuide() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
            <Terminal className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-orange-400">部署指南</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            部署指南
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            多种部署方式详解，从 Docker 一键部署到手动安装配置。
          </p>

          {/* Docker 部署 */}
          <div className="mb-12 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">🐳 Docker 部署（推荐）</h2>
            <div className="space-y-4">
              {[
                "安装 Docker 20.10+ 和 Docker Compose v2",
                "克隆仓库：git clone https://github.com/OpenMTEduInst/OpenMTEduInst.git",
                "进入目录并启动：cd OpenMTEduInst && docker-compose up -d",
                "访问 http://localhost:8080 进入管理后台",
                "默认管理员账号：admin / demo123456",
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 本地安装 */}
          <div className="mb-12 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">💻 本地手动安装</h2>
            <div className="space-y-4">
              {[
                "确保已安装 Python 3.9+ 和 Node.js 18+",
                "后端：cd backend && pip install -r requirements.txt && uvicorn main:app --reload",
                "前端：cd frontend && npm install && ng serve",
                "营销站：cd marketing-site && npm install && npm run dev",
                "后端 API 默认运行在 http://localhost:8000",
                "前端应用默认运行在 http://localhost:4200",
                "营销站点默认运行在 http://localhost:3000",
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vercel 部署 */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">☁️ Vercel 部署（营销站点）</h2>
            <p className="text-sm text-slate-400 mb-4">
              将 Next.js 营销站点部署到 Vercel，享受自动 CI/CD、全球 CDN 和自定义域名。
            </p>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              部署到 Vercel
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
