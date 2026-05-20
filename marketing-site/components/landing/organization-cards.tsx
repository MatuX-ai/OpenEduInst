"use client";

import { motion } from "framer-motion";
import { Bot, Factory, Code2, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

const organizations = [
  {
    icon: Bot,
    title: "K12科创中心",
    description: "管理 Arduino/Raspberry Pi 设备、学生创客作品、机器人竞赛培训",
    color: "blue",
  },
  {
    icon: Factory,
    title: "职业学校实训",
    description: "PLC 控制系统、CNC 机床、工业机器人等实训设备管理",
    color: "green",
  },
  {
    icon: Code2,
    title: "编程培训机构",
    description: "Python/C++ 课程、物联网应用开发、AI 教学辅助",
    color: "purple",
  },
  {
    icon: Building2,
    title: "教育局监管",
    description: "区内学校 STEM 教育数据统计、设备资源调配、师资培训",
    color: "orange",
  },
];

export default function OrganizationCards() {
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
            适用于各类 STEM 教育机构
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            无论您是 K12 学校、职业培训机构还是教育监管部门，OpenMT 都能满足您的需求
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {organizations.map((org, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-lg bg-${org.color}-500/10 flex items-center justify-center mb-4 group-hover:bg-${org.color}-500/20 transition-colors`}>
                <org.icon className={`w-7 h-7 text-${org.color}-500`} />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-slate-100">
                {org.title}
              </h3>
              
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                {org.description}
              </p>
              
              <Link
                href={`/demo?type=${org.title}`}
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                进入 Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
