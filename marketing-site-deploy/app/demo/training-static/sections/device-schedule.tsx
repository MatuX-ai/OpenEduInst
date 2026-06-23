import { mockData } from "../_data";

export default function DeviceSchedule() {
  const typeColors: Record<string, string> = {
    "硬件": "border-l-amber-500 bg-amber-50/30",
    "编程": "border-l-blue-500 bg-blue-50/30",
    "机器人": "border-l-purple-500 bg-purple-50/30",
    "AI": "border-l-emerald-500 bg-emerald-50/30",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      {/* 硬件设备库存 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">🔧 硬件设备库存</h3>
            <p className="text-xs text-slate-500 mt-0.5">实时可借出状态</p>
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">全部设备 →</button>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {mockData.deviceInventory.map((device, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${device.available <= 5 ? "bg-amber-400" : "bg-emerald-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{device.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      device.status === "需补充" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>总量 {device.total}台</span>
                    <span className="text-emerald-600 font-medium">可借 {device.available}台</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-24">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${device.usageRate}%` }} />
                    </div>
                    <span>{device.usageRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 今日课表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">📅 今日课表</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {mockData.todaySchedule.map((item, idx) => (
              <div key={idx} className={`pl-4 py-3 pr-4 rounded-lg border-l-2 ${typeColors[item.type]} flex items-center gap-3`}>
                <div className="text-xs font-mono font-semibold text-slate-500 w-20 whitespace-nowrap">{item.time}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📍 {item.room} &nbsp; 👤 {item.teacher}
                  </p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{item.students}人</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
