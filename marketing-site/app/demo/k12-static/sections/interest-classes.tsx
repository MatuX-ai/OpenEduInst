import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          新建兴趣班
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">总兴趣班数</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">在班学生</p>
                <p className="text-2xl font-bold text-slate-900">156</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">本月收入</p>
                <p className="text-2xl font-bold text-slate-900">¥48,600</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">平均评分</p>
                <p className="text-2xl font-bold text-slate-900">4.7</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
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
                <Button
                  key={category}
                  variant={category === "全部" ? "default" : "outline"}
                  size="sm"
                  className={category === "全部" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interest Classes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {interestClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {classItem.category}
                  </Badge>
                </div>
                <Badge 
                  variant={classItem.status === "进行中" ? "default" : 
                          classItem.status === "即将开始" ? "outline" : "destructive"}
                >
                  {classItem.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Progress 
                  value={(classItem.students / classItem.maxStudents) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{classItem.rating}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">查看详情</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    管理
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}