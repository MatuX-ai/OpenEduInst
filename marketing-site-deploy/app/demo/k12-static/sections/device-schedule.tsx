import { AlertCircle } from "lucide-react";
import { mockData } from "../_data";

export default function DeviceSchedule() {
  const typeColorMap: Record<string, string> = {
    "硬件": "border-l-emerald-500 bg-emerald-50/50",
    "编程": "border-l-blue-500 bg-blue-50/50",
    "综合": "border-l-amber-500 bg-amber-50/50",
  };

  return (
    <div id="section-devices" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* 设备库存清单 */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">社团器材清单</h3>
            <p className="text-xs text-slate-400 mt-0.5">每台设备都是社团的宝贝</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate-500">设备名称</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">总量</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">可用</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">借出中</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">来源</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {mockData.devices.map((device, idx) => {
                const usagePercent = Math.round((device.borrowing / device.total) * 100);
                const isLow = device.available <= 3 && device.total > 1;
                const isCritical = device.available === 0;
                return (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs font-medium text-slate-700">{device.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-600 text-center">{device.total}</td>
                    <td className="px-5 py-3 text-xs text-emerald-600 font-semibold text-center">{device.available}</td>
                    <td className="px-5 py-3 text-xs text-amber-600 font-semibold text-center">{device.borrowing}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-500 text-center">{device.source}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5">
                          <div className={"h-1.5 rounded-full " + (isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500")} style={{ width: usagePercent + "%" }} />
                        </div>
                        <span className={"text-[10px] font-medium " + (isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500")}>
                          {usagePercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 今日社团活动 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">今日社团活动</h3>
          <p className="text-xs text-slate-400 mt-0.5">课后时间 · 3个社团轮流使用活动室</p>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {mockData.todaySchedule.map((item, idx) => (
              <div key={idx} className={"border-l-2 rounded-r-lg p-3 " + (typeColorMap[item.type] || "border-l-emerald-500 bg-emerald-50/50")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-slate-500">{item.time}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{item.grade}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">👨‍🏫 {item.teacher} · 📍{item.room}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>3个社团共用1间活动室，每个社团每周仅1次活动。如能扩容，可接纳更多学生报名。</span>
          </div>
        </div>
      </div>
    </div>
  );
}
