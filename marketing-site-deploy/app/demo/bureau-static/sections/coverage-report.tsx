import { AlertTriangle, MapPin } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockData } from "../_data";
import { COLORS } from "../_utils";

export default function CoverageReport() {
  return (
    <div id="section-reports" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">STEM 教育覆盖率趋势</h3>
            <p className="text-xs text-slate-500 mt-0.5">近6个月全县中小学校STEM课程开设率</p>
          </div>
          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">目标：85%</span>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockData.coverageTrend}>
              <defs>
                <linearGradient id="colorCov" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[50, 90]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Area type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCov)" name="覆盖率 %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">学校类型分布</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={mockData.schoolTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count">
                  {mockData.schoolTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              {mockData.schoolTypes.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500 truncate">{item.name}</span>
                  <span className="text-slate-800 font-medium ml-auto">{item.count}所</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-400">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-semibold text-slate-800">薄弱校预警</h3>
            </div>
            {mockData.schoolRanking
              .filter((s) => s.status === "薄弱")
              .map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-slate-700 font-medium">{s.name}</span>
                    <span className="text-slate-400 ml-2">{s.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold">{s.stemScore}分</span>
                    <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">{s.warning}</span>
                  </div>
                </div>
              ))}
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-amber-600 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" />龙湾乡、石桥乡为重点帮扶片区
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
