import { Users, UserCheck, Wrench, Briefcase, Building2, Rocket, TrendingUp } from "lucide-react";
import { mockData } from "../_data";

export default function DashboardKpi() {
  const kpis = [
    { icon: Users, bg: "bg-blue-100", ic: "text-blue-600", v: mockData.stats.totalStudents.toLocaleString(), c: `+${mockData.stats.studentChange}%`, l: "在校学生", b: "" },
    { icon: UserCheck, bg: "bg-purple-100", ic: "text-purple-600", v: mockData.stats.activeTeachers, c: `+${mockData.stats.teacherChange}%`, l: "在职教师", b: "" },
    { icon: Wrench, bg: "bg-orange-100", ic: "text-orange-600", v: mockData.stats.totalDevices, c: `+${mockData.stats.deviceChange}%`, l: "实训设备·台", b: "border-l-4 border-l-orange-400" },
    { icon: Briefcase, bg: "bg-green-100", ic: "text-green-600", v: `${mockData.stats.employmentRate}%`, c: `+${mockData.stats.employmentChange}%`, l: "应届就业率", b: "border-l-4 border-l-green-400" },
    { icon: Building2, bg: "bg-teal-100", ic: "text-teal-600", v: mockData.stats.enterprisePartners, c: `+${mockData.stats.partnerChange}`, l: "合作企业·家", b: "" },
    { icon: Rocket, bg: "bg-amber-100", ic: "text-amber-600", v: mockData.stats.incubatingProjects, c: `+${mockData.stats.projectChange}%`, l: "在孵项目", b: "" },
  ];

  return (
    <div id="section-dashboard" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((k, i) => (
        <div key={i} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${k.b}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center`}>
              <k.icon className={`w-5 h-5 ${k.ic}`} />
            </div>
            <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />{k.c}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{k.v}</div>
          <div className="text-xs text-slate-500 mt-0.5">{k.l}</div>
        </div>
      ))}
    </div>
  );
}
