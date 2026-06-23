import { School, Clock } from "lucide-react";
import { mockData } from "../_data";
import { statusColor } from "../_utils";

export default function SchoolRanking() {
  const schoolHeaders = ["排名", "学校", "学段", "学生数", "STEM评分", "设备状态", "评级", "重点"];

  return (
    <div id="section-schools" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <School className="w-4.5 h-4.5 text-blue-500" />
            学校 STEM 教育质量评估
          </h3>
          <div className="flex gap-2 text-xs">
            {["全部", "优秀", "良好", "待提升", "薄弱"].map((t) => (
              <button key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700">
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {schoolHeaders.map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockData.schoolRanking.map((school, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={"w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold " + (idx < 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{school.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{school.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-center">{school.students}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={"h-1.5 rounded-full " + (school.stemScore >= 80 ? "bg-green-500" : school.stemScore >= 65 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: school.stemScore + "%" }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{school.stemScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        "text-xs px-1.5 py-0.5 rounded-full font-medium " +
                        (school.equipment === "严重不足"
                          ? "bg-red-50 text-red-600"
                          : school.equipment === "紧缺"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-green-50 text-green-600")
                      }
                    >
                      {school.equipment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " + statusColor(school.status)}>{school.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">
                    {school.keyStrength}
                    {school.warning && <span className="text-red-500 ml-1">⚠ {school.warning}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
              近期动态
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {mockData.recentActivities.map((a) => (
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
    </div>
  );
}
