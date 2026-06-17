import { Users, Star, Clock, TrendingUp, Award, Calendar, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Mock data for teacher performance
const teachers = [
  {
    id: 1,
    name: "张老师",
    avatar: "张",
    level: "高级教师",
    specialty: "Arduino专家",
    teachingHours: 156,
    studentCount: 68,
    rating: 4.9,
    renewalRate: 92,
    satisfaction: 96,
    monthlyRevenue: 23400,
    courses: ["Arduino基础", "IoT开发实战"],
    achievements: ["年度优秀教师", "学员满意度第一"]
  },
  {
    id: 2,
    name: "李老师",
    avatar: "李",
    level: "中级教师",
    specialty: "Python导师",
    teachingHours: 142,
    studentCount: 54,
    rating: 4.7,
    renewalRate: 85,
    satisfaction: 91,
    monthlyRevenue: 17040,
    courses: ["Python编程", "AI视觉"],
    achievements: ["最佳新人奖"]
  },
  {
    id: 3,
    name: "王老师",
    avatar: "王",
    level: "高级教师",
    specialty: "机器人教练",
    teachingHours: 138,
    studentCount: 52,
    rating: 4.8,
    renewalRate: 88,
    satisfaction: 94,
    monthlyRevenue: 20700,
    courses: ["机器人进阶", "无人机编程"],
    achievements: ["竞赛指导金奖"]
  },
  {
    id: 4,
    name: "陈老师",
    avatar: "陈",
    level: "初级教师",
    specialty: "IoT工程师",
    teachingHours: 98,
    studentCount: 38,
    rating: 4.5,
    renewalRate: 78,
    satisfaction: 87,
    monthlyRevenue: 9800,
    courses: ["物联网入门"],
    achievements: []
  },
];

// Mock data for monthly teaching hours chart
const teachingHoursData = [
  { month: "9月", 张老师: 120, 李老师: 98, 王老师: 110, 陈老师: 75 },
  { month: "10月", 张老师: 135, 李老师: 105, 王老师: 118, 陈老师: 82 },
  { month: "11月", 张老师: 142, 李老师: 115, 王老师: 125, 陈老师: 88 },
  { month: "12月", 张老师: 148, 李老师: 125, 王老师: 130, 陈老师: 92 },
  { month: "1月", 张老师: 152, 李老师: 135, 王老师: 135, 陈老师: 95 },
  { month: "2月", 张老师: 156, 李老师: 142, 王老师: 138, 陈老师: 98 },
];

export default function TeacherPerformance() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">教师绩效</h1>
          <p className="text-sm text-slate-500 mt-1">授课时长、学员评价、续费率排行</p>
        </div>
        <div className="flex gap-3">
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>本月</option>
            <option>本季度</option>
            <option>本年度</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">教师总数</p>
              <p className="text-2xl font-bold text-slate-900">4</p>
              <p className="text-xs text-slate-500 mt-1">高级2人·中级1人·初级1人</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">平均评分</p>
              <p className="text-2xl font-bold text-slate-900">4.7</p>
              <p className="text-xs text-emerald-600 mt-1">优秀水平</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">平均续费率</p>
              <p className="text-2xl font-bold text-slate-900">86%</p>
              <p className="text-xs text-purple-600 mt-1">行业领先</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月总课时</p>
              <p className="text-2xl font-bold text-slate-900">534</p>
              <p className="text-xs text-slate-500 mt-1">小时</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Hours Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">教师授课时长趋势</h3>
          <p className="text-xs text-slate-500 mt-1">近6个月数据对比</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teachingHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend />
              <Bar dataKey="张老师" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="李老师" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="王老师" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="陈老师" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Teacher Ranking Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-800">教师绩效排行</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索教师..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">排名</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">教师信息</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">授课时长</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">学员数量</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">评分</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">续费率</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">满意度</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">月营收</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((teacher, index) => (
                <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? "bg-amber-100 text-amber-600" :
                      index === 1 ? "bg-slate-200 text-slate-600" :
                      index === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {teacher.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
                        <p className="text-xs text-slate-500">{teacher.level} · {teacher.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900">{teacher.teachingHours}h</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                    {teacher.studentCount}人
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-slate-900">{teacher.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      teacher.renewalRate >= 90 ? "text-emerald-600" :
                      teacher.renewalRate >= 80 ? "text-blue-600" : "text-amber-600"
                    }`}>
                      {teacher.renewalRate}%
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{teacher.satisfaction}%</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900">¥{teacher.monthlyRevenue.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">详情</button>
                    <button className="text-slate-600 hover:text-slate-700 text-sm">评价</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
