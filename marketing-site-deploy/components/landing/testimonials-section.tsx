"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "使用 OpenMT 后，我们的设备管理效率提升了 80%。学生扫码即可借出 Arduino 套件，系统自动记录使用情况。期末盘点时设备损耗率从 15% 降到 5%。",
    author: "张老师",
    role: "星海机器人培训中心 · 教学主管",
    avatarBg: "bg-blue-500/20",
    avatarText: "text-blue-500",
    borderHover: "hover:border-blue-500/30",
    quoteColor: "text-blue-500/30",
  },
  {
    quote: "作为教育局，我们需要实时了解区域内各校的 STEM 教育推进情况。OpenMT 的区域数据看板让这项工作变得简单直观，STEM 覆盖率从 60% 提升到了 85%。",
    author: "王局长",
    role: "海淀区STEM教育局 · 局长",
    avatarBg: "bg-orange-500/20",
    avatarText: "text-orange-500",
    borderHover: "hover:border-orange-500/30",
    quoteColor: "text-orange-500/30",
  },
  {
    quote: "职业学校的实训设备管理一直是个难题。OpenMT 的设备共享池和预约系统完美解决了这个问题，10 间实验室的使用率提升了一倍。",
    author: "赵主任",
    role: "Advanced STEM 职业技术学院 · 实训中心主任",
    avatarBg: "bg-purple-500/20",
    avatarText: "text-purple-500",
    borderHover: "hover:border-purple-500/30",
    quoteColor: "text-purple-500/30",
  },
  {
    quote: "我们看重的不仅是功能，还有开源带来的灵活性。根据自己的需求二次开发，不用被厂商锁定。社区响应也很快，提的 PR 一周就合入了。",
    author: "陈老师",
    role: "阳光中学 · 科创中心主任",
    avatarBg: "bg-green-500/20",
    avatarText: "text-green-500",
    borderHover: "hover:border-green-500/30",
    quoteColor: "text-green-500/30",
  },
];

export default function TestimonialsSection() {
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
            他们都在用 OpenMT
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            来自不同 STEM 教育场景的真实反馈
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 transition-all duration-300 ${item.borderHover}`}
            >
              <Quote className={`w-8 h-8 mb-4 ${item.quoteColor}`} />
              <blockquote className="text-sm text-slate-300 leading-relaxed mb-6">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.avatarBg} ${item.avatarText}`}>
                  {item.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{item.author}</div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
