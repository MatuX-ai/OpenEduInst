import { mockData } from "../_data";

export default function TeachersActivities() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 教师技能团队 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">👨‍🏫 教师团队</h3>
          <p className="text-xs text-slate-500 mt-0.5">专业技能分布</p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {mockData.teacherTeam.map((teacher, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                  teacher.status === "授课中" ? "bg-blue-600" : "bg-slate-400"
                }`}>
                  {teacher.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{teacher.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === "授课中" ? "bg-emerald-400" : "bg-slate-300"}`} />
                  </div>
                  <p className="text-xs text-slate-500">{teacher.skill} · 教龄{teacher.experience}</p>
                </div>
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                  teacher.status === "授课中" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
                }`}>
                  {teacher.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近动态 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">📋 最近动态</h3>
            <p className="text-xs text-slate-500 mt-0.5">机构运营实时更新</p>
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">查看全部</button>
        </div>
        <div className="p-5">
          <div className="space-y-1">
            {mockData.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{activity.text}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{activity.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{activity.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
