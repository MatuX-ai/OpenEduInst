import { DollarSign, TrendingUp, Users, Clock, FileText, Download, Search, Filter, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Mock data for revenue trend
const revenueData = [
  { month: "9月", courseFee: 68000, deviceRent: 12000, tokenRecharge: 18000, total: 98000 },
  { month: "10月", courseFee: 72000, deviceRent: 13500, tokenRecharge: 19500, total: 105000 },
  { month: "11月", courseFee: 75000, deviceRent: 15000, tokenRecharge: 22000, total: 112000 },
  { month: "12月", courseFee: 78000, deviceRent: 16000, tokenRecharge: 24000, total: 118000 },
  { month: "1月", courseFee: 80000, deviceRent: 17000, tokenRecharge: 25000, total: 122000 },
  { month: "2月", courseFee: 82000, deviceRent: 18000, tokenRecharge: 25000, total: 125000 },
];

// Mock data for teacher payments
const teacherPayments = [
  { id: 1, name: "张老师", level: "高级教师", hours: 48, rate: 150, amount: 7200, status: "待确认" },
  { id: 2, name: "李老师", level: "中级教师", hours: 42, rate: 120, amount: 5040, status: "待确认" },
  { id: 3, name: "王老师", level: "高级教师", hours: 45, rate: 150, amount: 6750, status: "已发放" },
  { id: 4, name: "陈老师", level: "初级教师", hours: 38, rate: 100, amount: 3800, status: "待确认" },
  { id: 5, name: "赵老师", level: "中级教师", hours: 40, rate: 120, amount: 4800, status: "已发放" },
];

// Mock data for pending bills
const pendingBills = [
  { id: 1, student: "王小明", course: "Arduino基础", hours: 8, amount: 640, date: "2026-05-20", status: "待确认" },
  { id: 2, student: "李小红", course: "机器人进阶", hours: 6, amount: 720, date: "2026-05-21", status: "待确认" },
  { id: 3, student: "张小强", course: "Scratch编程", hours: 4, amount: 320, date: "2026-05-19", status: "已确认" },
  { id: 4, student: "陈小华", course: "Arduino传感器", hours: 6, amount: 480, date: "2026-05-22", status: "待确认" },
];

export default function BillingPage() {
  const statusColors: Record<string, string> = {
    "待确认": "bg-amber-50 text-amber-600 border-amber-200",
    "已确认": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "已发放": "bg-blue-50 text-blue-600 border-blue-200",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">财务结算</h1>
          <p className="text-sm text-slate-500 mt-1">课时费结算、教师工资、营收分析</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            新建账单
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月营收</p>
              <p className="text-2xl font-bold text-slate-900">¥12.5万</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.3% 较上月
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">待确认账单</p>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-xs text-amber-600 mt-1">需尽快处理</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月消课</p>
              <p className="text-2xl font-bold text-slate-900">1,248</p>
              <p className="text-xs text-slate-500 mt-1">课时</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">教师工资</p>
              <p className="text-2xl font-bold text-slate-900">¥2.8万</p>
              <p className="text-xs text-slate-500 mt-1">待发放3人</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">营收趋势分析</h3>
                  <p className="text-xs text-slate-500 mt-1">课程费 + 设备租赁 + Token充值</p>
                </div>
                <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
                  <option>近 6 个月</option>
                  <option>近 12 个月</option>
                </select>
              </div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [`¥${(value as number).toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="total" name="总营收" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#totalGradient)" />
                  <Area type="monotone" dataKey="courseFee" name="课程费" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="deviceRent" name="设备租赁" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Bills */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-slate-800">待确认账单</h3>
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full">{pendingBills.length} 笔</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索学员..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">学员</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">课程</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">课时</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">金额</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">日期</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">状态</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{bill.student}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{bill.course}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{bill.hours} 课时</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">¥{bill.amount}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{bill.date}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded border ${statusColors[bill.status]}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">确认</button>
                        <button className="text-slate-600 hover:text-slate-700 text-sm">详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Teacher Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">教师课时费</h3>
              <p className="text-xs text-slate-500 mt-1">本月待结算</p>
            </div>
            <div className="p-5 space-y-3">
              {teacherPayments.map((teacher) => (
                <div key={teacher.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
                      <p className="text-xs text-slate-500">{teacher.level}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[teacher.status]}`}>
                      {teacher.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{teacher.hours}课时 × ¥{teacher.rate}/时</span>
                    <span className="font-semibold text-slate-900">¥{teacher.amount}</span>
                  </div>
                </div>
              ))}
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                批量发放
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">快捷操作</h3>
            </div>
            <div className="p-5 space-y-3">
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <FileText className="w-4 h-4 text-blue-600" />
                生成月度报表
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                续费提醒发送
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <Download className="w-4 h-4 text-purple-600" />
                导出对账单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
