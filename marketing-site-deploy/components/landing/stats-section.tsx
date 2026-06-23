"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Building2, Users, Wrench, Trophy } from "lucide-react";

const stats = [
  { icon: Building2, value: 1200, suffix: "+", label: "注册机构", iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
  { icon: Users, value: 85000, suffix: "+", label: "服务师生", iconBg: "bg-purple-500/10", iconColor: "text-purple-500" },
  { icon: Wrench, value: 50000, suffix: "+", label: "管理设备", iconBg: "bg-green-500/10", iconColor: "text-green-500" },
  { icon: Trophy, value: 3200, suffix: "+", label: "竞赛项目", iconBg: "bg-orange-500/10", iconColor: "text-orange-500" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (time: number) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function StatsSection() {
  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      {/* 装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-green-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
            被 STEM 教育者信赖
          </h2>
          <p className="text-lg text-slate-400">
            越来越多的机构选择 OpenMT 管理 STEM 教育
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-slate-100 mb-1">
                <AnimatedCounter target={stat.value} />
                {stat.suffix}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
