import { mockData } from "../_data";

export default function Competitions() {
  const competitionStatusColor: Record<string, string> = {
    "备赛中": "bg-amber-50 text-amber-600 border-amber-200",
    "已报名": "bg-blue-50 text-blue-600 border-blue-200",
    "报名中": "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  return (
    <div className="space-y-4">
      {/* 赛事列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">近期赛事</h3>
          <span className="text-[11px] text-slate-500">3场备赛中</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mockData.competitions.map((comp, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-100 hover:border-amber-200 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-800 leading-snug">{comp.name}</h4>
                  <span className={"text-[9px] px-1.5 py-0.5 rounded-full border font-medium " + (competitionStatusColor[comp.status] || "")}>
                    {comp.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{comp.level} · {comp.students}人参赛 · {comp.date}</p>
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
        </div>
      </div>

      {/* 荣誉墙 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">竞赛荣誉</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "市级二等奖", detail: "青少年科技创新大赛", year: "2025", icon: "🥈" },
              { title: "区级一等奖", detail: "机器人编程挑战赛", year: "2025", icon: "🥇" },
              { title: "区级一等奖 ×2", detail: "创客马拉松", year: "2024", icon: "🏆" },
            ].map((award, i) => (
              <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 text-center">
                <div className="text-2xl mb-2">{award.icon}</div>
                <p className="text-sm font-semibold text-amber-800">{award.title}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">{award.detail}</p>
                <p className="text-[10px] text-amber-400 mt-1">{award.year}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700">
            🏆 去年获市级二等奖1项、区级一等奖3项——县城学校的骄傲。
          </div>
        </div>
      </div>
    </div>
  );
}
