import { Building2, Users, DollarSign, TrendingUp, MapPin, Calendar, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

// Mock data for campuses
const campuses = [
  {
    id: 1,
    name: "总部校区",
    address: "北京市海淀区中关村大街1号",
    manager: "赵校长",
    students: 328,
    teachers: 12,
    monthlyRevenue: 125000,
    renewalRate: 82,
    utilization: 88,
    status: "运营中"
  },
  {
    id: 2,
    name: "朝阳分校",
    address: "北京市朝阳区建国路88号",
    manager: "孙主任",
    students: 215,
    teachers: 8,
    monthlyRevenue: 86000,
    renewalRate: 78,
    utilization: 82,
    status: "运营中"
  },
  {
    id: 3,
    name: "海淀分校",
    address: "北京市海淀区学院路56号",
    manager: "周主任",
    students: 186,
    teachers: 7,
    monthlyRevenue: 72000,
    renewalRate: 80,
    utilization: 75,
    status: "运营中"
  },
  {
    id: 4,
    name: "通州分校",
    address: "北京市通州区新华大街120号",
    manager: "待定",
    students: 0,
    teachers: 0,
    monthlyRevenue: 0,
    renewalRate: 0,
    utilization: 0,
    status: "筹备中"
  },
];

// Mock data for revenue comparison
const revenueComparison = [
  { campus: "总部校区", revenue: 125000, students: 328 },
  { campus: "朝阳分校", revenue: 86000, students: 215 },
  { campus: "海淀分校", revenue: 72000, students: 186 },
  { campus: "通州分校", revenue: 0, students: 0 },
];

// Mock data for resource allocation
const resources = [
  { name: "Arduino套件", total: 150, allocated: { "总部校区": 60, "朝阳分校": 50, "海淀分校": 40, "通州分校": 0 } },
  { name: "树莓派开发板", total: 45, allocated: { "总部校区": 20, "朝阳分校": 15, "海淀分校": 10, "通州分校": 0 } },
  { name: "3D打印机", total: 8, allocated: { "总部校区": 3, "朝阳分校": 3, "海淀分校": 2, "通州分校": 0 } },
  { name: "传感器套件", total: 80, allocated: { "总部校区": 35, "朝阳分校": 25, "海淀分校": 20, "通州分校": 0 } },
];

export default function MultiCampusPage() {
  const statusColors: Record<string, string> = {
    "运营中": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "筹备中": "bg-amber-50 text-amber-600 border-amber-200",
  };

  const totalRevenue = campuses.reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const totalStudents = campuses.reduce((sum, c) => sum + c.students, 0);
  const totalTeachers = campuses.reduce((sum, c) => sum + c.teachers, 0);
  const avgRenewalRate = Math.round(campuses.filter(c => c.renewalRate > 0).reduce((sum, c) => sum + c.renewalRate, 0) / 3);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">多校区管理</h1>
          <p className="text-sm text-slate-500 mt-1">分校数据汇总、资源调配、统一管理</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Building2 className="w-4 h-4" />
          添加校区
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">校区总数</p>
              <p className="text-2xl font-bold text-slate-900">{campuses.length}</p>
              <p className="text-xs text-slate-500 mt-1">运营中 {campuses.filter(c => c.status === "运营中").length} 个</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">总营收</p>
              <p className="text-2xl font-bold text-slate-900">¥{(totalRevenue / 10000).toFixed(1)}万</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15.2% 较上月
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
              <p className="text-xs text-slate-500 mb-1">在训学员</p>
              <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
              <p className="text-xs text-slate-500 mt-1">跨{campuses.filter(c => c.students > 0).length}个校区</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">平均续费率</p>
              <p className="text-2xl font-bold text-slate-900">{avgRenewalRate}%</p>
              <p className="text-xs text-blue-600 mt-1">行业优秀水平</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campus List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">校区列表</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {campuses.length} 个</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索校区..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>
        
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campuses.map((campus) => (
            <div key={campus.id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">{campus.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[campus.status]}`}>
                      {campus.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {campus.address}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">校区负责人</p>
                  <p className="text-sm font-medium text-slate-900">{campus.manager}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">教师团队</p>
                  <p className="text-sm font-medium text-slate-900">{campus.teachers} 人</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">在训学员</p>
                  <p className="text-sm font-medium text-slate-900">{campus.students} 人</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">本月营收</p>
                  <p className="text-sm font-semibold text-emerald-600">¥{campus.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>
              
              {campus.status === "运营中" && (
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">续费率</span>
                      <span className="font-semibold text-slate-900">{campus.renewalRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${campus.renewalRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">教室利用率</span>
                      <span className="font-semibold text-slate-900">{campus.utilization}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full" 
                        style={{ width: `${campus.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  查看详情
                </button>
                <button className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  管理
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">各校区营收对比</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="campus" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value) => [`¥${(value as number).toLocaleString()}`, "营收"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Allocation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">设备资源分配</h3>
          </div>
          <div className="p-5 space-y-4">
            {resources.map((resource, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">{resource.name}</h4>
                  <span className="text-xs text-slate-500">总计 {resource.total} 台</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(resource.allocated).map(([campus, count]) => (
                    <div key={campus} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{campus}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${(count / resource.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-700 font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
