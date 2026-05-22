import { mockData } from "../_data";

export default function Projects() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
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
                <div
                  className={"h-1.5 rounded-full " + (project.progress >= 80 ? "bg-emerald-500" : project.progress >= 60 ? "bg-blue-500" : "bg-amber-500")}
                  style={{ width: project.progress + "%" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
