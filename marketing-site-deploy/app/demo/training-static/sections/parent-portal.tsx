import { Users, Star, MessageSquare, Calendar, TrendingUp, Award, BookOpen, Bell } from "lucide-react";

// Mock data for student performance
const studentPerformance = {
  name: "王小明",
  grade: "五年级",
  avatar: "王",
  courses: [
    { 
      name: "Arduino基础", 
      instructor: "张老师", 
      progress: 85, 
      nextClass: "2026-05-25 14:00",
      remainingHours: 8,
      rating: 4.8
    },
    { 
      name: "Python编程", 
      instructor: "李老师", 
      progress: 72, 
      nextClass: "2026-05-27 15:30",
      remainingHours: 12,
      rating: 4.6
    }
  ],
  achievements: [
    { name: "蓝桥杯三等奖", date: "2026-05-10", icon: "🏆" },
    { name: "电子学会一级认证", date: "2026-04-20", icon: "📜" },
    { name: "优秀学员", date: "2026-03-15", icon: "⭐" }
  ],
  projects: [
    { name: "智能温室控制系统", status: "进行中", progress: 75, category: "IoT" },
    { name: "LED呼吸灯实验", status: "已完成", progress: 100, category: "硬件" }
  ]
};

// Mock data for class feedback
const classFeedbacks = [
  {
    id: 1,
    date: "2026-05-22",
    course: "Arduino基础",
    instructor: "张老师",
    content: "今天学习了PWM控制原理，小明表现积极，成功完成了LED亮度调节实验。建议课后复习analogWrite函数的使用方法。",
    homework: "完成3种不同亮度的LED程序",
    rating: 5,
    photos: ["课堂照片1", "作品照片"]
  },
  {
    id: 2,
    date: "2026-05-20",
    course: "Python编程",
    instructor: "李老师",
    content: "学习了列表和循环的使用，小明能够独立完成猜数字游戏。逻辑思维能力强，继续保持！",
    homework: "编写一个简易计算器程序",
    rating: 5,
    photos: ["代码截图"]
  },
  {
    id: 3,
    date: "2026-05-18",
    course: "Arduino基础",
    instructor: "张老师",
    content: "传感器数据采集实验，小明对DHT11温湿度传感器的使用掌握较快。团队协作能力有待提升。",
    homework: "记录一周室内温湿度数据",
    rating: 4,
    photos: ["实验照片"]
  }
];

export default function ParentPortal() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">家长中心</h1>
          <p className="text-sm text-slate-500 mt-1">学员成长档案、课堂反馈、家校互动</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Bell className="w-4 h-4" />
          消息通知
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
            {studentPerformance.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{studentPerformance.name}</h2>
            <p className="text-blue-100">{studentPerformance.grade} · 在训2门课程</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-xl font-bold">4.7</span>
            </div>
            <p className="text-sm text-blue-100">综合评分</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">剩余课时</p>
              <p className="text-2xl font-bold text-slate-900">20</p>
              <p className="text-xs text-slate-500 mt-1">2门课程</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">完成项目</p>
              <p className="text-2xl font-bold text-slate-900">5</p>
              <p className="text-xs text-emerald-600 mt-1">2个进行中</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">获得荣誉</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-amber-600 mt-1">本月新增1项</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">下次上课</p>
              <p className="text-lg font-bold text-slate-900">5月25日</p>
              <p className="text-xs text-blue-600 mt-1">14:00 Arduino</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Course Progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Current Courses */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">在学课程</h3>
            </div>
            <div className="p-5 space-y-4">
              {studentPerformance.courses.map((course, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{course.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">教师：{course.instructor}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-slate-700">{course.rating}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">学习进度</span>
                      <span className="font-semibold text-slate-900">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">剩余 {course.remainingHours} 课时</span>
                    <span className="text-blue-600 font-medium">下次：{course.nextClass}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-800">课堂反馈</h3>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">最近3次</span>
            </div>
            <div className="p-5 space-y-4">
              {classFeedbacks.map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-3 pr-4 bg-slate-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{feedback.course}</p>
                      <p className="text-xs text-slate-500">{feedback.date} · {feedback.instructor}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{feedback.content}</p>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-1">📝 课后作业</p>
                    <p className="text-sm text-slate-800">{feedback.homework}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">🏆 荣誉墙</h3>
            </div>
            <div className="p-5 space-y-3">
              {studentPerformance.achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{achievement.name}</p>
                    <p className="text-xs text-slate-500">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">💻 项目作品</h3>
            </div>
            <div className="p-5 space-y-3">
              {studentPerformance.projects.map((project, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900">{project.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      project.status === "已完成" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${project.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">快捷操作</h3>
            </div>
            <div className="p-5 space-y-3">
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                预约调课
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                联系老师
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <BookOpen className="w-4 h-4 text-purple-600" />
                续费课程
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
