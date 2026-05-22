"use client";

import { motion } from "framer-motion";
import { Ship, Download, Cloud, Terminal, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";

export default function DownloadPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            下载与部署
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            选择适合您的部署方式，快速开始使用 OpenMT
          </p>
        </motion.div>

        {/* 部署方式选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {/* Docker 部署 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Ship className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  Docker 一键部署
                </h3>
                <p className="text-sm text-slate-400">推荐 · 5分钟快速启动</p>
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                自动配置数据库和缓存
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                易于升级和维护
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                支持 PostgreSQL + Redis
              </li>
            </ul>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">终端命令</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      "git clone https://github.com/OpenMTEduInst/OpenMTEduInst.git && cd OpenMTEduInst && docker-compose up -d",
                      "docker"
                    )
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copiedCommand === "docker" ? (
                    <>
                      <Check className="w-3 h-3" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              </div>
              <code className="text-xs text-slate-300 font-mono break-all">
                git clone https://github.com/OpenMTEduInst/OpenMTEduInst.git
                <br />
                cd OpenMTEduInst
                <br />
                docker-compose up -d
              </code>
            </div>

            <Link
              href="/docs/docker-deploy"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors w-full justify-center"
            >
              <Terminal className="w-4 h-4" />
              查看详细文档
            </Link>
          </motion.div>

          {/* 本地安装包 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-green-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  本地安装包
                </h3>
                <p className="text-sm text-slate-400">离线安装 · SQLite 数据库</p>
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                无需 Docker 环境
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                使用轻量级 SQLite
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                适合个人和小团队
              </li>
            </ul>

            <div className="space-y-3 mb-6">
              <a
                href="#"
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪟</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      Windows
                    </div>
                    <div className="text-xs text-slate-500">.exe 安装包</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>

              <a
                href="#"
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      macOS
                    </div>
                    <div className="text-xs text-slate-500">.dmg 安装包</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>

              <a
                href="#"
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐧</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      Linux
                    </div>
                    <div className="text-xs text-slate-500">.deb 安装包</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>
            </div>

            <p className="text-xs text-slate-500 text-center">
              ⚠️ 安装包正在构建中，敬请期待
            </p>
          </motion.div>
        </div>

        {/* 云服务（即将推出） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                云托管服务（即将推出）
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                无需自行部署，我们为您管理基础设施。享受自动备份、SSL 证书、性能优化等专业服务。
              </p>
              <form className="flex gap-3">
                <input
                  type="email"
                  placeholder="输入邮箱，获取上线通知"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  预约注册
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* 系统要求 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl mx-auto mt-12 p-6 rounded-xl bg-slate-800/30 border border-slate-700"
        >
          <h3 className="text-lg font-semibold mb-4 text-slate-100">
            📋 系统要求
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-slate-200">硬件要求</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• CPU: 2 核心及以上</li>
                <li>• 内存: 4GB RAM（推荐 8GB）</li>
                <li>• 磁盘: 20GB 可用空间</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-slate-200">软件依赖</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Python 3.9+</li>
                <li>• Node.js 18+</li>
                <li>• Docker 20+（Docker 部署）</li>
                <li>• 浏览器: Chrome/Firefox/Safari/Edge</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
