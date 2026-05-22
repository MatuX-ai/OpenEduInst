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
  Filter,
  BookOpen,
  Award,
  Activity
} from "lucide-react";

// Mock data for STEM academic management
const stemCourses = [
  {
    id: 1,
    name: "STEM综合实践",
    grade: "七年级",
    instructor: "刘老师",
    students: 32,
    maxStudents: 35,
    schedule: "每周二、四 14:00-15:30",
    location: "STEM实验室",
    progress: 75,
    status: "进行中"
  },
  {
    id: 2,
    name: "人工智能基础",
    grade: "八年级",
    instructor: "张老师",
    students: 28,
    maxStudents: 30,
    schedule: "每周一、三 15:30-17:00",
    location: "AI实验室",
    progress: 60,
    status: "进行中"
  },
  {
    id: 3,
    name: "工程设计思维",
    grade: "九年级",
    instructor: "王老师",
    students: 25,
    maxStudents: 28,
    schedule: "每周三、五 14:00-15:30",
    location: "设计工作室",
    progress: 45,
    status: "进行中"
  },
  {
    id: 4,
    name: "科学探究方法",
    grade: "六年级",
    instructor: "李老师",
    students: 30,
    maxStudents: 32,
    schedule: "每周二、四 15:30-17:00",
    location: "科学实验室",
    progress: 80,
    status: "即将结束"
  }
];

const upcomingEvents = [
  {
    id: 1,
    title: "STEM项目展示日",
    date: "2026-06-15",
    type: "展示活动",
    participants: 120
  },
  {
    id: 2,
    title: "教师培训工作坊",
    date: "2026-06-20",
    type: "培训",
    participants: 15
  },
  {
    id: 3,
    title: "家长开放日",
    date: "2026-06-25",
    type: "开放活动",
    participants: 80
  }
];

export default function StemAcademic() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">STEM教务管理</h1>
          <p className="text-slate-600 mt-1">管理STEM课程安排、教学进度和学术活动</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          新建课程
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">STEM课程数</p>
                <p className="text-2xl font-bold text-slate-900">8</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">在读学生</p>
                <p className="text-2xl font-bold text-slate-900">248</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">本月活动</p>
                <p className="text-2xl font-bold text-slate-900">5</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">平均进度</p>
                <p className="text-2xl font-bold text-slate-900">65%</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>STEM课程管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stemCourses.map((course) => (
                  <div key={course.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{course.name}</h3>
                        <p className="text-sm text-slate-600">{course.grade} · {course.instructor}</p>
                      </div>
                      <Badge 
                        variant={course.status === "进行中" ? "default" : "outline"}
                      >
                        {course.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-600">上课时间：</span>
                        <span className="font-medium">{course.schedule}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">上课地点：</span>
                        <span className="font-medium">{course.location}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">教学进度</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-slate-600">学生人数：</span>
                        <span className="font-medium">{course.students}/{course.maxStudents}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">查看详情</Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          管理
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                近期活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-emerald-500 pl-4 py-2">
                    <h4 className="font-medium text-slate-900">{event.title}</h4>
                    <p className="text-sm text-slate-600">{event.date}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">{event.type}</Badge>
                      <span className="text-xs text-slate-500">{event.participants}人参与</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                查看全部活动
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                添加新课程
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                安排教学活动
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Award className="w-4 h-4 mr-2" />
                学生成果记录
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                教师培训计划
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}