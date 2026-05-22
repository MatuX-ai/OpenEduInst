"use client";

import { motion } from "framer-motion";
import { Rocket, Copy, Check, Terminal, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";

export default function QuickStart() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCmd = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <Rocket className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-400">5 分钟上手</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            快速开始
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            通过 Docker 在 5 分钟内启动 OpenMT 完整服务。
          </p>

          {/* 前置要求 */}
          <div className="mb-12 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">前置要求</h2>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Docker 20.10+ 和 Docker Compose v2
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                至少 4GB 可用内存
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                20GB 可用磁盘空间
              </li>
            </ul>
          </div>

          {/* 步骤 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">1</div>
              <h3 className="text-lg font-semibold text-slate-100">克隆仓库</h3>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">终端命令</span>
                <button
                  onClick={() => copyCmd("git clone https://github.com/OpenMTEduInst/OpenMTEduInst.git", "clone")}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copied === "clone" ? <><Check className="w-3 h-3" />已复制</> : <><Copy className="w-3 h-3" />复制</>}
                </button>
              </div>
              <code className="text-sm text-slate-300 font-mono">git clone https://github.com/OpenMTEduInst/OpenMTEduInst.git</code>
            </div>
          </div>

          {/* 步骤 2 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">2</div>
              <h3 className="text-lg font-semibold text-slate-100">进入项目目录</h3>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <code className="text-sm text-slate-300 font-mono">cd OpenMTEduInst</code>
            </div>
          </div>

          {/* 步骤 3 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">3</div>
              <h3 className="text-lg font-semibold text-slate-100">启动服务</h3>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Docker Compose</span>
                <button
                  onClick={() => copyCmd("docker-compose up -d", "docker")}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copied === "docker" ? <><Check className="w-3 h-3" />已复制</> : <><Copy className="w-3 h-3" />复制</>}
                </button>
              </div>
              <code className="text-sm text-slate-300 font-mono">docker-compose up -d</code>
            </div>
          </div>

          {/* 步骤 4 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">4</div>
              <h3 className="text-lg font-semibold text-slate-100">访问系统</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "管理后台", url: "http://localhost:8080", desc: "Angular 前端" },
                { label: "API 文档", url: "http://localhost:8000/docs", desc: "Swagger UI" },
                { label: "营销站点", url: "http://localhost:3000", desc: "Next.js" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group"
                >
                  <div className="text-sm font-semibold text-slate-200 mb-1 group-hover:text-blue-400">{item.label}</div>
                  <div className="text-xs text-slate-500 mb-2">{item.desc}</div>
                  <code className="text-xs text-blue-400 font-mono">{item.url}</code>
                </a>
              ))}
            </div>
          </div>

          {/* 默认账号 */}
          <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-12">
            <h3 className="text-lg font-semibold mb-3 text-slate-100">默认演示账号</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <span className="text-slate-400">管理员</span>
                <code className="text-blue-400 font-mono">admin / demo123456</code>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <span className="text-slate-400">教师</span>
                <code className="text-blue-400 font-mono">teacher / demo123456</code>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <span className="text-slate-400">学生</span>
                <code className="text-blue-400 font-mono">student / demo123456</code>
              </div>
            </div>
          </div>

          {/* 下一步 */}
          <div className="text-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              <Terminal className="w-5 h-5" />
              在线体验 Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
