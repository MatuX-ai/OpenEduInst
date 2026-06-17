import { Code, Users, Calendar, Clock, TrendingUp, Plus, Search, Filter, BookOpen, Award } from "lucide-react";
import { mockData } from "../_data";

// Mock data for projects
const projects = [
  {
    id: 1,
    name: "智能温室控制系统",
    category: "IoT",
    instructor: "张老师",
    students: 18,
    maxStudents: 20,
    status: "进行中",
    progress: 75,
    startDate: "2026-04-15",
    endDate: "2026-06-15",
    description: "使用Arduino + 传感器实现温湿度自动监测与控制",
    technologies: ["Arduino", "DHT11", "继电器", "LCD显示"],
    milestones: [
      { name: "硬件搭建", completed: true, date: "2026-04-20" },
      { name: "传感器调试", completed: true, date: "2026-05-05" },
      { name: "控制逻辑编程", completed: true, date: "2026-05-18" },
      { name: "系统集成测试", completed: false, date: "2026-06-01" },
      { name: "项目展示", completed: false, date: "2026-06-15" },
    ]
  },
  {
    id: 2,
    name: "AI视觉识别小车",
    category: "AI",
    instructor: "李老师",
    students: 15,
    maxStudents: 18,
    status: "已完成",
    progress: 100,
    startDate: "2026-03-01",
    endDate: "2026-05-10",
    description: "基于Python + OpenCV实现颜色识别与路径跟踪",
    technologies: ["Python", "OpenCV", "树莓派", "摄像头模块"],
    milestones: [
      { name: "环境搭建", completed: true, date: "2026-03-10" },
      { name: "图像采集", completed: true, date: "2026-03-25" },
      { name: "算法开发", completed: true, date: "2026-04-15" },
      { name: "实车测试", completed: true, date: "2026-05-01" },
      { name: "成果展示", completed: true, date: "2026-05-10" },
    ]
  },
  {
    id: 3,
    name: "物联网环境监测站",
    category: "IoT",
    instructor: "陈老师",
    students: 22,
    maxStudents: 25,
    status: "进行中",
    progress: 60,
    startDate: "2026-05-01",
    endDate: "2026-07-01",
    description: "ESP32 + MQTT实现远程环境监测数据上传云平台",
    technologies: ["ESP32", "MQTT", "阿里云IoT", "传感器套件"],
    milestones: [
      { name: "硬件选型", completed: true, date: "2026-05-08" },
      { name: "WiFi连接", completed: true, date: "2026-05-15" },
      { name: "MQTT通信", completed: true, date: "2026-05-22" },
      { name: "云平台对接", completed: false, date: "2026-06-10" },
      { name: "数据可视化", completed: false, date: "2026-06-25" },
    ]
  },
  {
    id: 4,
    name: "语音助手开发",
    category: "AI",
    instructor: "王老师",
    students: 12,
    maxStudents: 15,
    status: "进行中",
    progress: 45,
    startDate: "2026-05-10",
    endDate: "2026-06-30",
    description: "使用百度语音API实现智能家居语音控制",
    technologies: ["Python", "百度API", "麦克风模块", "继电器"],
    milestones: [
      { name: "API注册", completed: true, date: "2026-05-15" },
      { name: "语音识别", completed: true, date: "2026-05-25" },
      { name: "意图理解", completed: false, date: "2026-06-05" },
      { name: "设备控制", completed: false, date: "2026-06-20" },
      { name: "系统联调", completed: false, date: "2026-06-30" },
    ]
  },
  {
    id: 5,
    name: "无人机编程控制",
    category: "机器人",
    instructor: "赵老师",
    students: 9,
    maxStudents: 12,
    status: "规划中",
    progress: 20,
    startDate: "2026-06-01",
    endDate: "2026-08-01",
    description: "Scratch/Python编程控制无人机编队飞行",
    technologies: ["Tello无人机", "Python", "Scratch", "编队算法"],
    milestones: [
      { name: "设备采购", completed: true, date: "2026-05-20" },
      { name: "基础飞行", completed: false, date: "2026-06-15" },
      { name: "编程控制", completed: false, date: "2026-07-01" },
      { name: "编队训练", completed: false, date: "2026-07-20" },
      { name: "表演展示", completed: false, date: "2026-08-01" },
    ]
  },
];

export default function ProjectsPage() {
  const statusColors: Record<string, string> = {
    "进行中": "bg-blue-50 text-blue-600 border-blue-200",
    "已完成": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "规划中": "bg-slate-50 text-slate-600 border-slate-200",
  };

  const categoryColors: Record<string, string> = {
    "IoT": "bg-purple-50 text-purple-600",
    "AI": "bg-emerald-50 text-emerald-600",
    "机器人": "bg-amber-50 text-amber-600",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">项目管理</h1>
          <p className="text-sm text-slate-500 mt-1">STEM项目全生命周期管理与进度追踪</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">进行中项目</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-blue-600 mt-1">活跃开展中</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">参与学生</p>
              <p className="text-2xl font-bold text-slate-900">76</p>
              <p className="text-xs text-emerald-600 mt-1">覆盖5个项目</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">平均进度</p>
              <p className="text-2xl font-bold text-slate-900">60%</p>
              <p className="text-xs text-slate-500 mt-1">整体推进良好</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月完成</p>
              <p className="text-2xl font-bold text-slate-900">1</p>
              <p className="text-xs text-emerald-600 mt-1">AI视觉小车</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800">项目列表</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {projects.length} 个</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索项目名称..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
        
        <div className="p-5 space-y-5">
          {projects.map((project) => (
            <div key={project.id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">{project.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${categoryColors[project.category]}`}>
                      {project.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{project.description}</p>
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">指导教师</p>
                  <p className="text-sm font-medium text-slate-900">{project.instructor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">参与学生</p>
                  <p className="text-sm font-medium text-slate-900">{project.students} / {project.maxStudents} 人</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">开始日期</p>
                  <p className="text-sm font-medium text-slate-900">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">结束日期</p>
                  <p className="text-sm font-medium text-slate-900">{project.endDate}</p>
                </div>
              </div>

              {/* Technologies */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">技术栈</p>
                <div className="flex gap-2 flex-wrap">
                  {project.technologies.map((tech, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">项目进度</span>
                  <span className="font-semibold text-slate-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      project.progress === 100 ? "bg-emerald-500" :
                      project.progress >= 60 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">关键节点</p>
                <div className="space-y-2">
                  {project.milestones.slice(0, 3).map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${milestone.completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`flex-1 ${milestone.completed ? "text-slate-700" : "text-slate-400"}`}>
                        {milestone.name}
                      </span>
                      <span className="text-xs text-slate-500">{milestone.date}</span>
                    </div>
                  ))}
                  {project.milestones.length > 3 && (
                    <p className="text-xs text-slate-400 pl-5">+{project.milestones.length - 3} 个节点</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  管理项目
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  查看详情
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  教学资源
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
