import { Users, UserCheck, Cpu, Trophy, TrendingUp } from "lucide-react";
import { mockData } from "../_data";

export default function DashboardKpi() {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const kpis = [
    { label: "社团成员", value: mockData.stats.totalStudents, unit: "人", icon: Users, color: "blue", trend: "+12%", trendUp: true, sub: "来自3个社团" },
    { label: "指导教师", value: mockData.stats.totalTeachers, unit: "人", icon: UserCheck, color: "purple", trend: null, trendUp: null, sub: "专职2人+兼职4人" },
    { label: "社团器材", value: mockData.stats.totalDevices, unit: "台", icon: Cpu, color: "emerald", trend: "+14%", trendUp: true, sub: "获批新增中" },
    { label: "竞赛获奖", value: mockData.stats.competitionAwards, unit: "项", icon: Trophy, color: "amber", trend: null, trendUp: null, sub: "市级2·区级5" },
  ];

  return (
    <div id="section-dashboard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className={"w-10 h-10 rounded-lg flex items-center justify-center " + colorMap[card.color]}>
              <card.icon className="w-5 h-5" />
            </div>
            {card.trend && card.trendUp === true && card.trend.startsWith("+") && (
              <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                {card.trend}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-800 mb-0.5">
            {card.value}<span className="text-base font-normal text-slate-400 ml-1">{card.unit}</span>
          </div>
          <div className="text-xs text-slate-500">
            {card.label}
            {card.sub && <span className="ml-2 text-slate-400">({card.sub})</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
