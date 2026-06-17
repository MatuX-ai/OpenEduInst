import { BookOpen, FileCode, Video, Download, Search, Filter, Plus, Folder } from "lucide-react";

// Mock data for teaching resources
const resourceCategories = [
  {
    id: 1,
    name: "Arduino课件库",
    icon: "📚",
    count: 32,
    description: "传感器/通信/控制等教学方案",
    resources: [
      { id: 1, name: "Arduino基础入门教程", type: "课件", format: "PPT", size: "15MB", downloads: 156, uploadDate: "2026-05-10" },
      { id: 2, name: "传感器应用实验指导", type: "实验手册", format: "PDF", size: "8MB", downloads: 203, uploadDate: "2026-05-08" },
      { id: 3, name: "PWM控制原理讲解", type: "视频", format: "MP4", size: "125MB", downloads: 89, uploadDate: "2026-05-05" },
      { id: 4, name: "智能小车项目完整代码", type: "代码", format: "ZIP", size: "2MB", downloads: 312, uploadDate: "2026-04-28" },
    ]
  },
  {
    id: 2,
    name: "Python编程资源",
    icon: "💻",
    count: 28,
    description: "基础语法/AI应用/数据分析",
    resources: [
      { id: 5, name: "Python零基础教程", type: "课件", format: "PPT", size: "20MB", downloads: 245, uploadDate: "2026-05-12" },
      { id: 6, name: "AI图像识别示例代码", type: "代码", format: "PY", size: "5MB", downloads: 178, uploadDate: "2026-05-09" },
      { id: 7, name: "数据处理实战案例", type: "实验手册", format: "PDF", size: "12MB", downloads: 134, uploadDate: "2026-05-06" },
    ]
  },
  {
    id: 3,
    name: "机器人课程包",
    icon: "🤖",
    count: 18,
    description: "结构搭建/运动控制/算法设计",
    resources: [
      { id: 8, name: "乐高EV3基础课程", type: "课件", format: "PPT", size: "25MB", downloads: 167, uploadDate: "2026-05-11" },
      { id: 9, name: "巡线算法详解", type: "视频", format: "MP4", size: "98MB", downloads: 145, uploadDate: "2026-05-07" },
      { id: 10, name: "机械臂控制程序", type: "代码", format: "INO", size: "3MB", downloads: 198, uploadDate: "2026-05-03" },
    ]
  },
  {
    id: 4,
    name: "IoT物联网项目",
    icon: "🌐",
    count: 15,
    description: "ESP32/MQTT/云平台接入",
    resources: [
      { id: 11, name: "ESP32 WiFi连接教程", type: "课件", format: "PPT", size: "18MB", downloads: 189, uploadDate: "2026-05-13" },
      { id: 12, name: "MQTT通信协议实例", type: "代码", format: "ZIP", size: "4MB", downloads: 223, uploadDate: "2026-05-10" },
      { id: 13, name: "智能家居监控系统", type: "项目文档", format: "PDF", size: "10MB", downloads: 156, uploadDate: "2026-05-04" },
    ]
  },
];

export default function ResourcesPage() {
  const formatIcons: Record<string, string> = {
    "PPT": "📊",
    "PDF": "📄",
    "MP4": "🎥",
    "ZIP": "📦",
    "PY": "🐍",
    "INO": "⚙️",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">教学资源库</h1>
          <p className="text-sm text-slate-500 mt-1">课件、代码、视频等教学资源共享平台</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          上传资源
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">资源总数</p>
              <p className="text-2xl font-bold text-slate-900">93</p>
              <p className="text-xs text-slate-500 mt-1">覆盖4大类别</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月下载</p>
              <p className="text-2xl font-bold text-slate-900">1,247</p>
              <p className="text-xs text-emerald-600 mt-1">+18% 较上月</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">视频时长</p>
              <p className="text-2xl font-bold text-slate-900">48h</p>
              <p className="text-xs text-slate-500 mt-1">累计录制</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">代码示例</p>
              <p className="text-2xl font-bold text-slate-900">156</p>
              <p className="text-xs text-slate-500 mt-1">个项目</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <FileCode className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Resource Categories */}
      <div className="space-y-5">
        {resourceCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">{category.name}</h2>
                    <p className="text-xs text-slate-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                    {category.count} 个资源
                  </span>
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    查看全部
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.resources.map((resource) => (
                  <div key={resource.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{formatIcons[resource.format] || "📄"}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{resource.name}</p>
                          <p className="text-xs text-slate-500">{resource.type} · {resource.format}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>{resource.size}</span>
                      <span>下载 {resource.downloads}次</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{resource.uploadDate}</span>
                      <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Download className="w-3 h-3" />
                        下载
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Upload Area */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">拖拽文件到此处上传</h3>
          <p className="text-sm text-slate-600 mb-4">支持 PPT、PDF、视频、代码文件等多种格式</p>
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            选择文件
          </button>
        </div>
      </div>
    </div>
  );
}
