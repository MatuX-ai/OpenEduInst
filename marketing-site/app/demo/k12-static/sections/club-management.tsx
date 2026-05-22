import { Users, UserCheck, FileText, Plus, Search } from "lucide-react";
import { mockData } from "../_data";

// Mock data for club members
const clubMembers = [
  { id: 1, name: "张三", grade: "七年级", club: "机器人社团", role: "社长", joinDate: "2025-09" },
  { id: 2, name: "李四", grade: "八年级", club: "编程社团", role: "副社长", joinDate: "2025-09" },
  { id: 3, name: "王五", grade: "九年级", club: "3D打印社", role: "成员", joinDate: "2026-03" },
  { id: 4, name: "赵六", grade: "七年级", club: "电子创客社", role: "成员", joinDate: "2026-03" },
  { id: 5, name: "陈七", grade: "八年级", club: "机器人社团", role: "成员", joinDate: "2025-09" },
];

// Mock data for teachers
const teachers = [
  { id: 1, name: "刘老师", subject: "信息技术", clubs: ["机器人社团", "编程社团"], type: "专职" },
  { id: 2, name: "张老师", subject: "物理", clubs: ["电子创客社"], type: "专职" },
  { id: 3, name: "王老师", subject: "美术", clubs: ["3D打印社"], type: "兼职" },
  { id: 4, name: "李老师", subject: "数学", clubs: ["编程社团"], type: "兼职" },
  { id: 5, name: "赵老师", subject: "科学", clubs: ["机器人社团"], type: "兼职" },
  { id: 6, name: "陈老师", subject: "通用技术", clubs: ["电子创客社"], type: "兼职" },
];

// Mock data for club projects
const projects = [
  { id: 1, name: "智能垃圾分类机器人", club: "机器人社团", leader: "张三", members: 8, status: "进行中", progress: 75 },
  { id: 2, name: "校园气象站", club: "电子创客社", leader: "赵六", members: 6, status: "进行中", progress: 60 },
  { id: 3, name: "3D打印校徽设计", club: "3D打印社", leader: "王五", members: 5, status: "已完成", progress: 100 },
  { id: 4, name: "Python数据分析平台", club: "编程社团", leader: "李四", members: 10, status: "进行中", progress: 45 },
];

export default function ClubManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">社团管理</h1>
          <p className="text-slate-600 mt-1">管理社团成员、指导教师和社团项目</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          新建社团
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">社团总数</p>
              <p className="text-2xl font-bold text-slate-900">{mockData.institution.clubCount}</p>
              <p className="text-xs text-slate-500 mt-1">{mockData.institution.clubNames}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">社员总数</p>
              <p className="text-2xl font-bold text-slate-900">{mockData.stats.totalStudents}</p>
              <p className="text-xs text-slate-500 mt-1">来自3个社团</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">指导教师</p>
              <p className="text-2xl font-bold text-slate-900">{mockData.stats.totalTeachers}</p>
              <p className="text-xs text-slate-500 mt-1">专职2人·兼职4人</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Club Members Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">社员管理</h2>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索社员..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              添加社员
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">姓名</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">年级</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">所属社团</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">职务</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">加入时间</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clubMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{member.name}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{member.grade}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{member.club}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      member.role === "社长" ? "bg-emerald-100 text-emerald-700" :
                      member.role === "副社长" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{member.joinDate}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    <button className="text-emerald-600 hover:text-emerald-700 mr-3">编辑</button>
                    <button className="text-red-600 hover:text-red-700">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">指导教师</h2>
          </div>
          <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加教师
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                  <p className="text-sm text-slate-600">{teacher.subject}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  teacher.type === "专职" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {teacher.type}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600">指导社团：</span>
                <p className="text-slate-900 mt-1">{teacher.clubs.join("、")}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                  查看详情
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">社团项目</h2>
          </div>
          <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
          {projects.map((project) => (
            <div key={project.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <p className="text-sm text-slate-600">{project.club} · 负责人：{project.leader}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  project.status === "进行中" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">项目进度</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-slate-600">参与人数：</span>
                  <span className="font-medium">{project.members}人</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                    详情
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    管理
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
