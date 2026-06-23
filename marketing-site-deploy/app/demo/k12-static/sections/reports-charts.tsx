import { Radio } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockData } from "../_data";

export default function ReportsCharts() {
  return (
    <div id="section-reports" className="grid grid-cols-1 lg:grid-cols-7 gap-4">
      {/* 设备使用趋势 */}
      <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">设备使用趋势</h3>
            <p className="text-xs text-slate-400 mt-0.5">全年保持高利用率——设备少、需求大</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />使用中</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />总量</span>
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockData.deviceUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 45]} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontSize: "12px" }} />
              <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="inUse" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-400 mt-3 text-center">4月赛前集训期间全设备满负荷运转</p>
        </div>
      </div>

      {/* 设备类型 + 经费 */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">设备类型分布</h3>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={mockData.deviceTypes} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value">
                    {mockData.deviceTypes.map((entry, index) => (
                      <Cell key={"cell-" + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              {mockData.deviceTypes.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700 text-[11px]">{item.value}台</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-100 text-slate-500 flex items-center gap-1">
                <Radio className="w-3 h-3" />
                共 {mockData.stats.totalDevices} 台
              </div>
            </div>
          </div>
        </div>

        {/* 年度经费 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">年度经费概览</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">总预算 ¥{(mockData.budgetOverview.annual / 10000).toFixed(1)}万</span>
              <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (mockData.budgetOverview.remaining > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                剩余 ¥{mockData.budgetOverview.remaining.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: (mockData.budgetOverview.spent / mockData.budgetOverview.annual) * 100 + "%" }} />
            </div>
            <div className="space-y-1">
              {mockData.budgetOverview.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-slate-500">¥{item.spent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
