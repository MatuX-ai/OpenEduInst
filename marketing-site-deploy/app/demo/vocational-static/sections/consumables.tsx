import { ShoppingBag, Plus, AlertTriangle } from "lucide-react";
import { mockData } from "../_data";
import { statusColor, approvalColor } from "../_utils";

export default function Consumables() {
  const stats = [
    { v: mockData.consumables.totalItems, l: "耗材种类" },
    { v: mockData.consumables.lowStockCount, l: "库存预警", c: "text-red-600" },
    { v: mockData.consumables.borrowRecords.filter(r => r.status === "使用中").length, l: "在借记录", c: "text-blue-600" },
    { v: mockData.consumables.purchaseRequests.filter(r => r.status === "待审批").length, l: "待审批申购", c: "text-amber-600" },
  ];

  return (
    <div id="section-consumables" className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* 标题栏 */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-amber-500" />实训耗材管理
          </h3>
          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{mockData.consumables.lowStockCount}项库存紧张
          </span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />新增申购
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 p-5 border-b border-slate-100">
        {stats.map((k, i) => (
          <div key={i} className="text-center">
            <div className={`text-2xl font-bold ${k.c || "text-slate-800"}`}>{k.v}</div>
            <div className="text-xs text-slate-500 mt-1">{k.l}</div>
          </div>
        ))}
      </div>

      {/* 详情区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* 库存列表 */}
        <div className="lg:col-span-2 p-5 border-r border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {["物品名称","规格","库存","安全库存","状态"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockData.consumables.inventory.map(item => (
                  <tr key={item.id} className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${item.status === "紧缺" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{item.spec}</td>
                    <td className={`px-3 py-2.5 text-sm text-center font-semibold ${item.stock < item.safetyStock ? "text-red-600" : "text-slate-800"}`}>
                      {item.stock}{item.unit}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-center text-slate-500">{item.safetyStock}{item.unit}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 领用记录 + 申购审批 */}
        <div className="p-5 space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">最近领用记录</h4>
            <div className="space-y-2.5">
              {mockData.consumables.borrowRecords.map(r => (
                <div key={r.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{r.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800">{r.borrower}</span>
                      <span className="text-xs text-slate-400">{r.role === "教师" ? r.role : r.class}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{r.items} · {r.purpose}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{r.date}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">申购审批</h4>
            <div className="space-y-2">
              {mockData.consumables.purchaseRequests.map(req => (
                <div key={req.id} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{req.item}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${approvalColor(req.status)}`}>{req.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-slate-500">x{req.quantity}</span>
                    <span className="text-emerald-600 font-semibold">¥{req.cost}</span>
                    <span className="text-slate-400">{req.requester}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">原因：{req.reason}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-medium">申购总金额</span>
              <span className="text-sm font-bold text-emerald-700">
                ¥{mockData.consumables.purchaseRequests.reduce((s, r) => s + r.cost, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
