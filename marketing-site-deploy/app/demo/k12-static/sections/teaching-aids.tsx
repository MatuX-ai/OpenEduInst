import { ShoppingBag, AlertTriangle, ClipboardList, ShoppingCart, Plus } from "lucide-react";
import { mockData } from "../_data";

export default function TeachingAids() {
  const kpiCards = [
    { label: "教具种类", value: 47, unit: "种", icon: ShoppingBag, color: "violet" },
    { label: "库存预警", value: mockData.teachingAids.lowStockCount, unit: "项", icon: AlertTriangle, color: "amber" },
    { label: "领用中", value: 2, unit: "笔", icon: ClipboardList, color: "blue" },
    { label: "待审批申购", value: 3, unit: "项", icon: ShoppingCart, color: "emerald" },
  ];

  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const borrowStatusColorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  const purchaseStatusColorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  return (
    <div id="section-aids" className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-violet-500" />
            教具管理
          </h2>
          <p className="text-xs text-slate-500 mt-1">元器件、耗材与工具的库存管理，支持领用登记与申购审批</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            5项库存紧张
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" />
            新增申购
          </button>
        </div>
      </div>

      {/* 核心KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + colorMap[card.color]}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-500">{card.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-800">
              {card.value}<span className="text-sm font-normal text-slate-400 ml-1">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 库存清单 + 领用申购 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 库存清单表 */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">库存清单</h3>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500" />充足</span>
              <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-amber-500" />紧缺</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500">名称</th>
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500">类别</th>
                  <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">库存</th>
                  <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">安全线</th>
                  <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">单位</th>
                  <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockData.teachingAids.inventory.map((item, idx) => {
                  const isLow = item.stock < item.safetyStock;
                  return (
                    <tr key={idx} className={"border-t border-slate-100 hover:bg-slate-50/50 transition-colors " + (isLow ? "bg-amber-50/30" : "")}>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{item.name}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">{item.category}</td>
                      <td className="px-4 py-2.5 text-xs text-center">
                        <span className={"font-semibold " + (isLow ? "text-amber-600" : "text-slate-700")}>{item.stock}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-400 text-center">{item.safetyStock}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-400 text-center">{item.unit}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-medium " + (item.status === "充足" ? "bg-emerald-50 text-emerald-600" : item.status === "紧缺" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 领用记录 + 申购申请 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* 领用记录 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                领用记录
              </h3>
              <button className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">查看全部 →</button>
            </div>
            <div className="p-3 space-y-2">
              {mockData.teachingAids.borrowRecords.map((record, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold " + (idx % 2 === 0 ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600")}>
                    {record.borrower.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-medium text-slate-700 truncate">{record.borrower}</p>
                      <span className={"text-[9px] px-1 py-0.5 rounded-full border font-medium " + borrowStatusColorMap[record.statusColor]}>
                        {record.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{record.item}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400 truncate flex-1 mr-2">{record.purpose}</p>
                      <span className="text-[9px] text-slate-400 flex-shrink-0">{record.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 申购申请 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                申购申请
              </h3>
              <span className="text-[10px] text-slate-400">{mockData.teachingAids.purchaseRequests.length}项待处理</span>
            </div>
            <div className="p-3 space-y-2">
              {mockData.teachingAids.purchaseRequests.map((req, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-100 hover:border-violet-200 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">{req.item}</p>
                    <span className={"text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ml-2 " + purchaseStatusColorMap[req.statusColor]}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{req.quantity}</span>
                    <span className="text-slate-600 font-medium">¥{req.estimatedCost}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{req.reason}</p>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
                    <span>{req.requestedBy} · {req.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-3">
              <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-lg text-[10px] text-violet-700">
                💡 申购总预算约 ¥1,380——可申请学校科创专项经费或联系企业赞助。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
