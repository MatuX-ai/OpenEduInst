import { UserCheck } from "lucide-react";
import { mockData } from "../_data";

export default function Training() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-4.5 h-4.5 text-blue-500" />
          STEM 师资培训
        </h3>
        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
          {mockData.teacherTraining.trainedThisYear}/{mockData.teacherTraining.totalTarget}人
        </span>
      </div>

      {/* 各片区培训覆盖率 */}
      <div className="p-5 space-y-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">各片区培训覆盖率</h4>
        {mockData.teacherTraining.districtStats.map((d, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">{d.area}</span>
              <span className="text-slate-400">{d.trained}/{d.schools * 15}人参训</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className={"h-1.5 rounded-full " + (d.coverage >= 50 ? "bg-green-500" : d.coverage >= 30 ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: d.coverage + "%" }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600 w-8 text-right">{d.coverage}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* 近期培训场次 */}
      <div className="px-5 pb-5 space-y-2">
        <div className="border-t border-slate-100 pt-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">近期培训场次</h4>
        </div>
        {mockData.teacherTraining.sessions.map((s) => (
          <div key={s.id} className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.trainer}</p>
              </div>
              <span
                className={"text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 " + (s.status === "报名中" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}
              >
                {s.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{s.date}</span>
              <span>{s.type}</span>
              <span>{s.attendees}/{s.max}人</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
