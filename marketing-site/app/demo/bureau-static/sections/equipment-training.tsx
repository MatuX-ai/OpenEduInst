import { Wrench, UserCheck } from "lucide-react";
import { mockData } from "../_data";

export default function EquipmentTraining() {
  const eq = mockData.equipmentPool;
  const edStats = [
    { v: "¥" + (eq.allocated / 10000).toFixed(0) + "万", l: "已配发" },
    { v: "¥" + (eq.inTransit / 10000).toFixed(0) + "万", l: "调拨中", c: "text-blue-600" },
    { v: "¥" + (eq.toApprove / 10000).toFixed(0) + "万", l: "待审批", c: "text-amber-600" },
  ];

  const eqHeaders = ["物品名称", "总量", "已配发", "库存", "单价", "覆盖学校"];

  return (
    <div id="section-training" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* STEM设备配发 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-orange-500" />
              STEM 设备配发池
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">统一采购 · 按需配发 · 跨校流转</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-800">¥{(eq.totalValue / 10000).toFixed(0)}万</div>
            <div className="text-xs text-slate-500">设备总值</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 p-5 border-b border-slate-100">
          {edStats.map((k, i) => (
            <div key={i} className="text-center">
              <div className={"text-xl font-bold " + (k.c || "text-slate-800")}>{k.v}</div>
              <div className="text-xs text-slate-500 mt-1">{k.l}</div>
            </div>
          ))}
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {eqHeaders.map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eq.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-2.5 text-sm text-center text-slate-600">{item.total + item.unit}</td>
                    <td className="px-3 py-2.5 text-sm text-center text-green-600 font-semibold">{item.allocated}</td>
                    <td className={"px-3 py-2.5 text-sm text-center font-semibold " + (item.inStock < 10 ? "text-red-600" : "text-slate-600")}>{item.inStock}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">¥{item.unitPrice.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{item.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 师资培训 */}
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
        <div className="p-5 space-y-2">
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
    </div>
  );
}
