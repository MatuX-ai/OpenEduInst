"use client";

import { motion } from "framer-motion";
import { FlaskConical, Check, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function ProjectsFeature() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <FlaskConical className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-400">STEM 核心功能</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            实验项目与课程管理
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            从机器人竞赛到创客作品，完整追踪学生项目进度。代码仓库集成、作品展示墙、
            peer review 互评系统，让学习成果可视化。
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
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                <Play className="w-10 h-10 text-green-500 ml-1" />
              </div>
              <p className="text-slate-400">点击播放演示视频</p>
              <p className="text-sm text-slate-500 mt-2">
                项目创建与提交流程 · 3分钟
              </p>
            </div>

            {/* 装饰性网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)",
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
                title: "项目档案管理",
                description:
                  "机器人竞赛（FLL/VEX/WRO）、创客作品、编程项目完整归档。包含需求文档、代码仓库、演示视频、评分标准。",
                icon: "📁",
              },
              {
                title: "课程资源库",
                description:
                  "Arduino 教程、Python 课程、电路设计图纸集中管理。支持版本控制、在线预览、批量下载。",
                icon: "📚",
              },
              {
                title: "学生作品展示墙",
                description:
                  "作品集画廊展示，支持 peer review 同学互评、点赞评论。教师多维度评分（创新性、完成度、技术难度）。",
                icon: "🖼️",
              },
              {
                title: "项目进度追踪",
                description:
                  "里程碑管理（需求分析 → 原型设计 → 编码实现 → 测试调试 → 成果展示）。甘特图可视化项目时间线。",
                icon: "📈",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-green-500/50 transition-all duration-300"
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
          className="max-w-3xl mx-auto p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 mb-16"
        >
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            💡 用户场景案例
          </h3>
          <blockquote className="text-slate-300 leading-relaxed mb-4">
            "李同学团队使用 OpenMT 管理'校园智能灌溉系统'创客项目。从需求文档到 Arduino
            代码，每个阶段都有记录。老师在线评审给出建议，最终作品获得市级创客大赛二等奖。整个流程清晰透明，家长也能看到孩子的成长轨迹。"
          </blockquote>
          <cite className="text-sm text-slate-400 not-italic">
            — XX 实验小学科创中心
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
      </div>
    </PageLayout>
  );
}
