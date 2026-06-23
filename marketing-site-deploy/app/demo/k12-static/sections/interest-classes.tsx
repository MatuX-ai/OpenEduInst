import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Star,
  Plus,
  Search,
  Filter
} from "lucide-react";

// Mock data for interest classes
const interestClasses = [
  {
    id: 1,
    name: "Python编程启蒙",
    category: "编程类",
    instructor: "张老师",
    students: 24,
    maxStudents: 30,
    schedule: "每周三 16:00-17:30",
    location: "计算机教室A",
    price: 800,
    rating: 4.8,
    status: "进行中"
  },
  {
    id: 2,
    name: "机器人创客",
    category: "机器人类",
    instructor: "李老师",
    students: 18,
    maxStudents: 25,
    schedule: "每周五 15:30-17:00",
    location: "创客空间",
    price: 1200,
    rating: 4.9,
    status: "进行中"
  },
  {
    id: 3,
    name: "3D打印设计",
    category: "设计类",
    instructor: "王老师",
    students: 15,
    maxStudents: 20,
    schedule: "每周二 16:00-17:30",
    location: "3D打印室",
    price: 900,
    rating: 4.7,
    status: "进行中"
  },
  {
    id: 4,
    name: "电子电路基础",
    category: "电子类",
    instructor: "赵老师",
    students: 20,
    maxStudents: 25,
    schedule: "每周四 15:30-17:00",
    location: "电子实验室",
    price: 750,
    rating: 4.6,
    status: "即将开始"
  },
  {
    id: 5,
    name: "无人机飞行",
    category: "航空类",
    instructor: "陈老师",
    students: 12,
    maxStudents: 15,
    schedule: "每周六 09:00-10:30",
    location: "操场",
    price: 1000,
    rating: 4.8,
    status: "已满员"
  }
];

const categories = ["全部", "编程类", "机器人类", "设计类", "电子类", "航空类"];

export default function InterestClasses() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">兴趣班管理</h1>
          <p className="text-slate-600 mt-1">管理学校各类兴趣班课程，监控报名情况和教学质量</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          新建兴趣班
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">总兴趣班数</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">在班学生</p>
              <p className="text-2xl font-bold text-slate-900">156</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">本月收入</p>
              <p className="text-2xl font-bold text-slate-900">¥48,600</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均评分</p>
              <p className="text-2xl font-bold text-slate-900">4.7</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索兴趣班..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  category === "全部" 
                    ? "bg-emerald-600 text-white" 
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <button className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {/* Interest Classes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {interestClasses.map((classItem) => (
          <div key={classItem.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-5 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{classItem.name}</h3>
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                    {classItem.category}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  classItem.status === "进行中" ? "bg-emerald-100 text-emerald-700" : 
                  classItem.status === "即将开始" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                }`}>
                  {classItem.status}
                </span>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">授课教师：</span>
                  <span className="font-medium">{classItem.instructor}</span>
                </div>
                <div>
                  <span className="text-slate-600">上课时间：</span>
                  <span className="font-medium">{classItem.schedule}</span>
                </div>
                <div>
                  <span className="text-slate-600">上课地点：</span>
                  <span className="font-medium">{classItem.location}</span>
                </div>
                <div>
                  <span className="text-slate-600">课程费用：</span>
                  <span className="font-medium text-emerald-600">¥{classItem.price}/期</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">报名人数</span>
                  <span className="font-medium">{classItem.students}/{classItem.maxStudents}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${(classItem.students / classItem.maxStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{classItem.rating}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                    查看详情
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    管理
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}