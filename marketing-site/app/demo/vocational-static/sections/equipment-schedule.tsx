import { Wrench, Clock } from "lucide-react";
import { mockData } from "../_data";
import { statusColor } from "../_utils";

export default function EquipmentSchedule() {
  return (
    <div id="section-equipment" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 实训设备清单 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4.5 h-4.5 text-orange-500" />实训设备清单
          </h3>
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-green-600">{mockData.equipment.reduce((s, e) => s + e.available, 0)}</span> 台可用 / {mockData.stats.totalDevices} 台
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {["设备名称","型号","总数","可用","使用中","状态","所在实验室"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockData.equipment.map(eq => (
                <tr key={eq.id} className="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{eq.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{eq.model}</td>
                  <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">{eq.total}</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{eq.available}</td>
                  <td className="px-4 py-3 text-sm text-center text-orange-600 font-medium">{eq.inUse}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(eq.status)}`}>{eq.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{eq.lab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 今日实训课表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-500" />今日实训课表
          </h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {mockData.todaySchedule.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{item.time}</span>
                  {idx < mockData.todaySchedule.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                      <span>📍 {item.room}</span>
                      <span>👤 {item.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.type === "嵌入式" ? "bg-purple-50 text-purple-600" :
                        item.type === "电工" ? "bg-blue-50 text-blue-600" :
                        item.type === "PLC" ? "bg-orange-50 text-orange-600" :
                        "bg-amber-50 text-amber-600"
                      }`}>{item.type}</span>
                      <span className="text-xs text-slate-400">{item.class}</span>
                    </div>
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
