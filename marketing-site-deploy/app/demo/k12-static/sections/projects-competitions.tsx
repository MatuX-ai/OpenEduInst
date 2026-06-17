import { mockData } from "../_data";

export default function ProjectsCompetitions() {
  const competitionStatusColor: Record<string, string> = {
    "备赛中": "bg-amber-50 text-amber-600 border-amber-200",
    "已报名": "bg-blue-50 text-blue-600 border-blue-200",
    "报名中": "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  return (
    <div id="section-projects" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* 社团在读项目 */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">社团在读项目</h3>
          <span className="text-[11px] text-slate-500">{mockData.stats.completedProjects}个项目 · 完成率66%</span>
        </div>
        <div className="p-4 space-y-3">
          {mockData.projects.map((project, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-semibold text-slate-800">{project.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{project.category}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span>👥 {project.students}人团队</span>
                  <span>📍 {project.stage}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-semibold text-slate-700">{project.progress}%</span>
                <div className="w-20 bg-slate-100 rounded-full h-1.5">
                  <div className={"h-1.5 rounded-full " + (project.progress >= 80 ? "bg-emerald-500" : project.progress >= 60 ? "bg-blue-500" : "bg-amber-500")} style={{ width: project.progress + "%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 赛事倒计时 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">近期赛事</h3>
        </div>
        <div className="p-4 space-y-3">
          {mockData.competitions.map((comp, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-100 hover:border-amber-200 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-800 leading-snug">{comp.name}</h4>
                <span className={"text-[9px] px-1.5 py-0.5 rounded-full border font-medium " + (competitionStatusColor[comp.status] || "")}>
                  {comp.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">📅 {comp.date}</span>
                <span className="text-slate-500">👥 {comp.students}人</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={"text-[9px] px-1.5 py-0.5 rounded " + (comp.level === "市级" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}>
                  {comp.level}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700">
            🏆 去年获市级二等奖1项、区级一等奖3项——县城学校的骄傲。
          </div>
        </div>
      </div>
    </div>
  );
}
