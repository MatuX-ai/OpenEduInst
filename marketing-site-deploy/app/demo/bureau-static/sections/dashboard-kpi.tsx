import { School, GraduationCap, UserCheck, BarChart3, Wrench, Award, TrendingUp } from "lucide-react";
import { mockData } from "../_data";

export default function DashboardKpi() {
  const kpis = [
    { icon: School, bg: "bg-blue-100", ic: "text-blue-600", v: mockData.stats.totalSchools, c: "+" + mockData.stats.schoolChange, l: "管辖学校", b: "" },
    { icon: GraduationCap, bg: "bg-purple-100", ic: "text-purple-600", v: mockData.stats.stemStudents.toLocaleString(), c: "+" + mockData.stats.studentChange + "%", l: "STEM学生数", b: "" },
    { icon: UserCheck, bg: "bg-amber-100", ic: "text-amber-600", v: mockData.stats.stemTeachers, c: "+" + mockData.stats.teacherChange + "%", l: "STEM教师", b: "" },
    { icon: BarChart3, bg: "bg-green-100", ic: "text-green-600", v: mockData.stats.stemCoverage + "%", c: "+" + mockData.stats.coverageChange + "%", l: "STEM覆盖率", b: "border-l-4 border-l-green-400" },
    { icon: Wrench, bg: "bg-orange-100", ic: "text-orange-600", v: mockData.equipmentPool.crossSchoolShare.thisMonth + "次", c: "累计" + mockData.equipmentPool.crossSchoolShare.total + "次", l: "跨校设备共享/月", b: "" },
    { icon: Award, bg: "bg-red-100", ic: "text-red-600", v: mockData.stats.competitionAwards, c: "+" + mockData.stats.awardChange, l: "年度竞赛获奖", b: "" },
  ];

  return (
    <div id="section-dashboard" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((k, i) => (
        <div key={i} className={"bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow " + k.b}>
          <div className="flex items-center justify-between mb-3">
            <div className={"w-10 h-10 " + k.bg + " rounded-lg flex items-center justify-center"}>
              <k.icon className={"w-5 h-5 " + k.ic} />
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
