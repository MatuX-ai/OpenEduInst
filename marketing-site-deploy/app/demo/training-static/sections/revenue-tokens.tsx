import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockData } from "../_data";

export default function RevenueTokens() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
      {/* 月度营收趋势 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">月度营收趋势</h3>
              <p className="text-xs text-slate-500 mt-0.5">STEM课程 + 设备租赁 + Token充值</p>
            </div>
            <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
              <option>近 6 个月</option>
              <option>近 12 个月</option>
            </select>
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={mockData.revenueTrend}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value) => [`¥${(value as number).toLocaleString()}`, "营收"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token 消耗分布 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Token 消耗分布</h3>
          <p className="text-xs text-slate-500 mt-0.5">本月累计 12,580点</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={mockData.tokenConsumption} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {mockData.tokenConsumption.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${(value as number).toLocaleString()}点`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {mockData.tokenConsumption.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-700">{item.value.toLocaleString()}点</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
