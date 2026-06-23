import { Users, DollarSign, BookOpen, Cpu, TrendingUp } from "lucide-react";
import { mockData } from "../_data";

export default function DashboardKpi() {
  const kpis = [
    { label: "在训学员", value: mockData.stats.totalStudents, unit: "人", icon: Users, color: "blue", trend: "+12.5%", trendUp: true },
    { label: "本月营收", value: "¥" + (mockData.stats.monthlyRevenue / 10000).toFixed(1), unit: "万", icon: DollarSign, color: "emerald", trend: "+8.3%", trendUp: true },
    { label: "本月消课率", value: mockData.stats.courseCompletion, unit: "%", icon: BookOpen, color: "purple", trend: "+2.1%", trendUp: true },
    { label: "设备使用率", value: mockData.stats.deviceUsage, unit: "%", icon: Cpu, color: "amber", trend: "-3.2%", trendUp: false },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {kpis.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? "text-emerald-600" : "text-red-500"}`}>
              <TrendingUp className={`w-3 h-3 ${!card.trendUp ? "rotate-180" : ""}`} />
              {card.trend}
            </div>
          </div>
          <div className="text-[28px] font-bold text-slate-900 mb-0.5">
            {card.value}
            <span className="text-sm font-normal text-slate-400 ml-0.5">{card.unit}</span>
          </div>
          <div className="text-sm text-slate-500">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
