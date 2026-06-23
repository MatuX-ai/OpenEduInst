"use client";

import { motion } from "framer-motion";
import { Cpu, FlaskConical, Coins, Warehouse, Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";

const comparisons = [
  {
    feature: "硬件设备全生命周期管理",
    openmt: true,
    generic: false,
    detail: "扫码借出/归还、押金管理、维护记录、损耗追踪",
  },
  {
    feature: "实验项目与代码仓库集成",
    openmt: true,
    generic: false,
    detail: "机器人竞赛、创客作品、代码版本管理、Peer Review",
  },
  {
    feature: "AI Token 智能计费",
    openmt: true,
    generic: false,
    detail: "AI助教、代码评测、课程生成按需付费，灵活套餐",
  },
  {
    feature: "创客空间智能调度",
    openmt: true,
    generic: false,
    detail: "实验室预约、设备共享池、安全准入认证、利用率分析",
  },
  {
    feature: "学生/课程/排课管理",
    openmt: true,
    generic: true,
    detail: "基础教务功能，满足日常运营需求",
  },
  {
    feature: "Arduino/Raspberry Pi 专用管理",
    openmt: true,
    generic: false,
    detail: "设备型号库、传感器套件、固件版本追踪",
  },
  {
    feature: "竞赛报名与成绩追踪",
    openmt: true,
    generic: false,
    detail: "FLL/VEX/WRO 赛事管理，区域赛-国赛晋级追踪",
  },
  {
    feature: "多机构数据监管（教育局）",
    openmt: true,
    generic: false,
    detail: "跨校数据看板、资源调配、STEM覆盖率分析",
  },
];

export default function ComparisonSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
            为什么 STEM 教育需要专用系统？
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            通用教培系统无法满足硬件管理、创客空间、竞赛追踪等 STEM 特有需求。
            OpenMT 从第一天起就为 STEM 场景而生。
          </p>
        </motion.div>

        {/* 对比表格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 w-1/2">功能</th>
                <th className="text-center py-4 px-4 text-sm font-semibold">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-blue-400">OpenMT</span>
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-500" />
                    <span className="text-slate-400">通用系统</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-slate-200">{row.feature}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.detail}</div>
                  </td>
                  <td className="text-center py-3 px-4">
                    {row.openmt ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    {row.generic ? (
                      <Check className="w-5 h-5 text-slate-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-slate-600 mx-auto" />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            亲自体验差异
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
