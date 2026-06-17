import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockData } from "../_data";
import { COLORS } from "../_menu";

export default function AnalyticsCharts() {
  return (
    <div id="section-analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 设备使用趋势 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">实训设备使用趋势</h3>
            <p className="text-xs text-slate-500 mt-0.5">近6个月设备在用量 / 总拥有量</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />在用量</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-200" />总拥有</span>
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockData.deviceUsage} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", fontSize: "13px" }} />
              <Bar dataKey="total" fill="#e2e8f0" radius={[4,4,0,0]} name="总拥有" />
              <Bar dataKey="inUse" fill="#10b981" radius={[4,4,0,0]} name="在用量" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 设备类型分布 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">设备类型分布</h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={mockData.deviceTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {mockData.deviceTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
            {mockData.deviceTypes.slice(0,6).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-500 truncate">{item.name}</span>
                <span className="text-slate-800 font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
