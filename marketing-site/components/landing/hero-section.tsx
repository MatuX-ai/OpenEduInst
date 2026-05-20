"use client";

import { motion } from "framer-motion";
import { Cpu, FlaskConical, Coins, Warehouse, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* 装饰性电路板纹理 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo + 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <Cpu className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-300">开源 STEM 教育管理系统</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-blue-400 to-green-500 bg-clip-text text-transparent">
              OpenMT
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-4">
              硬件管理 · 实验项目 · 创客空间 · 免费开源
            </p>
            
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              专为 K12科创中心、职业学校实训、编程培训机构设计的 STEM 教育管理系统。
              从 Arduino 到 IoT，一站式管理创客教育。
            </p>
          </motion.div>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link
              href="/demo"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-green-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              立即试用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 hover:border-blue-500 transition-all duration-300"
            >
              下载本地版
            </Link>
            
            <a
              href="https://github.com/OpenMTEduInst"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 text-slate-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              <span>GitHub</span>
            </a>
          </motion.div>

          {/* 核心功能预览 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { icon: Cpu, label: "硬件设备管理", desc: "Arduino/Raspberry Pi" },
              { icon: FlaskConical, label: "实验项目管理", desc: "机器人竞赛/创客作品" },
              { icon: Coins, label: "Token 计费", desc: "AI 助教/智能评测" },
              { icon: Warehouse, label: "创客空间调度", desc: "实验室预约/设备共享" },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
              >
                <feature.icon className="w-8 h-8 mx-auto mb-2 text-blue-500 group-hover:text-green-500 transition-colors" />
                <div className="text-sm font-semibold text-slate-200">{feature.label}</div>
                <div className="text-xs text-slate-400 mt-1">{feature.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 滚动提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-slate-400 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}
