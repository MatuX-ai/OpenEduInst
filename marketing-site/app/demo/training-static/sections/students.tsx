import { Users, Search, Plus, Filter, BookOpen, Award, Clock, TrendingUp } from "lucide-react";
import { mockData } from "../_data";

// Mock data for students
const students = [
  { 
    id: 1, 
    name: "王小明", 
    grade: "五年级", 
    courses: ["Arduino基础", "Python编程"], 
    remainingHours: 24,
    totalHours: 48,
    projects: 3,
    achievements: ["蓝桥杯三等奖", "电子学会一级"],
    lastClass: "2026-05-20",
    status: "在读",
    avatar: "王"
  },
  { 
    id: 2, 
    name: "李小红", 
    grade: "六年级", 
    courses: ["机器人进阶", "AI视觉"], 
    remainingHours: 8,
    totalHours: 36,
    projects: 5,
    achievements: ["创客大赛二等奖"],
    lastClass: "2026-05-21",
    status: "即将到期",
    avatar: "李"
  },
  { 
    id: 3, 
    name: "张小强", 
    grade: "四年级", 
    courses: ["Scratch编程"], 
    remainingHours: 40,
    totalHours: 40,
    projects: 2,
    achievements: [],
    lastClass: "2026-05-19",
    status: "在读",
    avatar: "张"
  },
  { 
    id: 4, 
    name: "赵小美", 
    grade: "七年级", 
    courses: ["IoT开发实战", "3D建模"], 
    remainingHours: 0,
    totalHours: 32,
    projects: 6,
    achievements: ["电子学会二级", "科技创新奖"],
    lastClass: "2026-05-15",
    status: "已结课",
    avatar: "赵"
  },
  { 
    id: 5, 
    name: "陈小华", 
    grade: "五年级", 
    courses: ["Arduino传感器"], 
    remainingHours: 16,
    totalHours: 24,
    projects: 2,
    achievements: [],
    lastClass: "2026-05-22",
    status: "在读",
    avatar: "陈"
  },
];

export default function StudentsPage() {
  const statusColors: Record<string, string> = {
    "在读": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "即将到期": "bg-amber-50 text-amber-600 border-amber-200",
    "已结课": "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">学员管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理学员档案、学习进度和续费提醒</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          添加学员
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">在训学员</p>
              <p className="text-2xl font-bold text-slate-900">{mockData.stats.totalStudents}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12.5% 较上月
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
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
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">即将到期</p>
              <p className="text-2xl font-bold text-slate-900">23</p>
              <p className="text-xs text-amber-600 mt-1">需跟进续费</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">续费率</p>
              <p className="text-2xl font-bold text-slate-900">78%</p>
              <p className="text-xs text-emerald-600 mt-1">行业领先</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800">学员列表</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {students.length} 人</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索学员姓名..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">学员信息</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">报读课程</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">剩余课时</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">项目成果</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">最近上课</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {student.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.grade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {student.courses.map((course, idx) => (
                        <span key={idx} className="inline-block text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded mr-1">
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{student.remainingHours} / {student.totalHours}</p>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            student.remainingHours === 0 ? "bg-slate-400" :
                            student.remainingHours <= 10 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${(student.remainingHours / student.totalHours) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700">{student.projects} 个项目</span>
                      {student.achievements.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                          {student.achievements.length} 项荣誉
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                    {student.lastClass}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[student.status]}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">详情</button>
                    <button className="text-slate-600 hover:text-slate-700 text-sm">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">显示 1-5 条，共 {students.length} 条</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>
              上一页
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
