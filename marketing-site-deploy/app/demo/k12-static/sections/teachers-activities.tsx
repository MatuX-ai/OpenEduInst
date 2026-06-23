import { mockData } from "../_data";

export default function TeachersActivities() {
  const avatarColors = ["bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];

  const activityTypeColors: Record<string, string> = {
    "社团": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "竞赛": "bg-amber-50 text-amber-600 border-amber-200",
    "设备": "bg-blue-50 text-blue-600 border-blue-200",
    "培训": "bg-purple-50 text-purple-600 border-purple-200",
    "招新": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "维护": "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div id="section-teachers" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* 指导教师团队 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">社团指导教师</h3>
            <span className="text-[10px] text-slate-400">6人 · 专2兼4</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {mockData.teacherTeam.map((teacher, idx) => {
            const colorInit = teacher.name.charCodeAt(0) % 5;
            return (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={"w-9 h-9 " + avatarColors[colorInit] + " rounded-full flex items-center justify-center text-white text-xs font-semibold"}>
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800">{teacher.name}</p>
                    <span className={"w-1.5 h-1.5 rounded-full " + (teacher.status === "在线" ? "bg-emerald-500" : teacher.status === "上课中" ? "bg-amber-500" : "bg-slate-300")} />
                    <span className="text-[10px] text-slate-500">{teacher.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{teacher.role}</p>
                  <div className="flex gap-1 mt-1.5">
                    {teacher.skills.map((skill, si) => (
                      <span key={si} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700">
            💡 Token计费让AI助教触手可及——师资薄弱地区的学生也能获得个性化学习指导。
          </div>
        </div>
      </div>

      {/* 近期动态 */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">近期动态</h3>
        </div>
        <div className="p-4 space-y-3">
          {mockData.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-xl flex-shrink-0">{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-relaxed">{activity.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-400">{activity.time}</span>
                  <span className={"text-[9px] px-1.5 py-0.5 rounded-full border font-medium " + (activityTypeColors[activity.type] || "bg-slate-100 text-slate-500 border-slate-200")}>
                    {activity.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
