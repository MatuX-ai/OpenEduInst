"use client";

import { motion } from "framer-motion";
import { Cloud, Check, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function CloudHostingFeature() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Cloud className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-400">SaaS 云托管版</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            OpenMT 云托管版
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            专为 STEM 教育机构打造的 SaaS 管理平台。免运维、高可用、智能化，
            集成云端自动备份、高级 AI 助教和多端实时同步。
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
                云托管版功能总览 · 3分钟
              </p>
            </div>

            {/* 装饰性网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(59, 130, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 247, 0.1) 1px, transparent 1px)",
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
                title: "云端自动备份",
                description:
                  "系统每日自动增量备份至云端对象存储，支持一键回滚到任意历史版本。无需担心服务器故障导致的数据丢失。",
                icon: "☁️",
              },
              {
                title: "高级 AI 助教",
                description:
                  "集成云端大模型，提供智能排课建议、学生学情分析、代码自动评测和个性化学习路径生成。",
                icon: "🤖",
              },
              {
                title: "多端实时同步",
                description:
                  "Web 端、平板、手机端数据秒级同步。随时随地管理机构运营、查看学生进度、审批预约申请。",
                icon: "📱",
              },
              {
                title: "企业级安全防护",
                description:
                  "SSL 加密传输，多租户物理隔离，符合教育行业数据安全标准。SLA 99.9% 可用性保障。",
                icon: "🛡️",
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

        {/* 版本对比 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-100">
            版本对比
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/30">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="p-4 text-slate-300 font-semibold">功能特性</th>
                  <th className="p-4 text-slate-300 font-semibold text-center">开源社区版</th>
                  <th className="p-4 text-blue-400 font-bold text-center bg-blue-500/10">云托管版</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  { feature: "硬件设备管理", community: true, cloud: true },
                  { feature: "Token 计费系统", community: true, cloud: true },
                  { feature: "创客空间调度", community: true, cloud: true },
                  { feature: "实验项目管理", community: true, cloud: true },
                  { feature: "云端自动备份", community: false, cloud: true },
                  { feature: "AI 智能助教", community: "基础", cloud: "高级版" },
                  { feature: "多端实时同步", community: false, cloud: true },
                  { feature: "企业级安全防护", community: false, cloud: true },
                  { feature: "SLA 可用性保障", community: false, cloud: "99.9%" },
                  { feature: "技术支持", community: "社区", cloud: "专业团队" },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-700/50 ${
                      idx % 2 === 0 ? "bg-slate-900/20" : ""
                    }`}
                  >
                    <td className="p-4 text-sm">{row.feature}</td>
                    <td className="p-4 text-center text-sm text-slate-400">
                      {row.community === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : row.community === false ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        row.community
                      )}
                    </td>
                    <td className="p-4 text-center text-sm bg-blue-500/5">
                      {row.cloud === true ? (
                        <Check className="w-5 h-5 text-blue-400 mx-auto" />
                      ) : row.cloud === false ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="text-blue-400 font-medium">{row.cloud}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 用户案例 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 mb-16"
        >
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            💡 用户场景案例
          </h3>
          <blockquote className="text-slate-300 leading-relaxed mb-4">
            "我们是一家规模较小的科创培训机构，没有专职 IT 人员维护服务器。
            使用 OpenMT 云托管版后，注册即可开始运营，系统自动完成数据备份。
            AI 助教功能大大减轻了老师的负担，学生在课余时间也能获得实时指导。
            家长可以通过手机端随时看到孩子的学习进度，满意度显著提升。"
          </blockquote>
          <cite className="text-sm text-slate-400 not-italic">
            — 某科创教育连锁机构负责人
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
              href="/demo/create-org"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              立即免费试用
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
