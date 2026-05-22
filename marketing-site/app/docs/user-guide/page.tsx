"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

const sections = [
  {
    title: "仪表盘与数据总览",
    items: [
      "查看机构整体运营数据：学生数、教师数、设备数、课程数",
      "数据可视化图表：招生趋势、设备使用率、课程完成率",
      "实时动态信息流：新注册、设备变更、课程更新通知",
    ],
  },
  {
    title: "硬件设备管理",
    items: [
      "设备入库：支持手动添加和批量导入（CSV/Excel）",
      "设备分类：自定义分类标签（Arduino、传感器、3D打印等）",
      "扫码借出/归还：生成设备二维码，扫码快速操作",
      "押金管理：按设备价值自动计算押金，支持多种支付方式",
      "维护记录：记录每次维修、更换零件、保养信息",
      "损耗追踪：统计分析设备损耗率、寿命预测",
    ],
  },
  {
    title: "实验项目管理",
    items: [
      "创建项目：设置项目名称、描述、成员、截止日期",
      "里程碑管理：分解项目为多个阶段，甘特图可视化",
      "作品提交：支持代码、文档、图片、视频等多种格式",
      "Peer Review：同学互评，点赞评论互动",
      "教师评分：多维度评价（创新性、完成度、技术难度）",
    ],
  },
  {
    title: "Token 计费系统",
    items: [
      "Token 余额查看：实时显示可用 Token 数量",
      "充值记录：历史充值和消费明细",
      "AI 功能接入：AI 助教对话、代码评测、课程生成",
      "套餐管理：Free/Standard/Premium/Enterprise 灵活切换",
    ],
  },
  {
    title: "创客空间调度",
    items: [
      "实验室预约：可视化日历选择时间段",
      "冲突检测：自动检测时间冲突并提示",
      "安全认证：学生需通过培训才能操作危险设备",
      "设备共享：贵重设备在线排队预约",
      "使用率统计：热力图分析空间利用效率",
    ],
  },
];

export default function UserGuide() {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-400">使用指南</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            用户手册
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            详细的 OpenMT 功能使用指南，帮助您快速上手各个模块。
          </p>

          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700"
              >
                <h2 className="text-xl font-semibold mb-4 text-slate-100">
                  {index + 1}. {section.title}
                </h2>
                <ul className="space-y-3">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                      <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
