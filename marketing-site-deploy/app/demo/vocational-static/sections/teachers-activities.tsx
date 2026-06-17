import { UserCheck } from "lucide-react";
import { mockData } from "../_data";

export default function TeachersActivities() {
  return (
    <div id="section-teachers" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 教师团队 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4.5 h-4.5 text-blue-500" />教师团队
          </h3>
          <span className="text-xs text-slate-500">{mockData.stats.activeTeachers} 人</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockData.teacherTeam.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>{t.avatar}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      t.status === "上课中" ? "bg-blue-50 text-blue-600" :
                      t.status === "每周1天驻校" ? "bg-amber-50 text-amber-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role} · {t.bio}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.skills.map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 近期动态 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">近期动态</h3>
          <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">查看全部</button>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {mockData.recentActivities.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="text-xl flex-shrink-0">{a.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
