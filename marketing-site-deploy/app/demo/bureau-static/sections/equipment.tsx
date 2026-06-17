import { Wrench } from "lucide-react";
import { mockData } from "../_data";

export default function Equipment() {
  const eq = mockData.equipmentPool;
  const edStats = [
    { v: "¥" + (eq.allocated / 10000).toFixed(0) + "万", l: "已配发" },
    { v: "¥" + (eq.inTransit / 10000).toFixed(0) + "万", l: "调拨中", c: "text-blue-600" },
    { v: "¥" + (eq.toApprove / 10000).toFixed(0) + "万", l: "待审批", c: "text-amber-600" },
  ];
  const eqHeaders = ["物品名称", "总量", "已配发", "库存", "单价", "覆盖学校"];

  return (
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
  );
}
