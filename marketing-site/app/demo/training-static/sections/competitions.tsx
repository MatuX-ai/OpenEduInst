import { Award, Calendar, Users, Trophy, FileText, Plus, Search, Filter } from "lucide-react";

// Mock data for competitions
const competitions = [
  {
    id: 1,
    name: "全国青少年电子信息智能创新大赛",
    organizer: "中国电子学会",
    level: "国家级",
    category: "机器人",
    registerDeadline: "2026-06-30",
    competitionDate: "2026-08-15",
    participants: 12,
    status: "报名中",
    achievements: "往届获奖: 一等奖2名, 二等奖5名"
  },
  {
    id: 2,
    name: "蓝桥杯青少年编程大赛",
    organizer: "工业和信息化部人才交流中心",
    level: "国家级",
    category: "编程",
    registerDeadline: "2026-06-15",
    competitionDate: "2026-07-20",
    participants: 18,
    status: "报名中",
    achievements: "往届获奖: 省赛一等奖8名"
  },
  {
    id: 3,
    name: "世界机器人大会青少年挑战赛",
    organizer: "中国电子学会",
    level: "国际级",
    category: "机器人",
    registerDeadline: "2026-07-10",
    competitionDate: "2026-08-25",
    participants: 8,
    status: "筹备中",
    achievements: "首次参赛"
  },
  {
    id: 4,
    name: "中小学生创客大赛",
    organizer: "教育部教育装备研究发展中心",
    level: "国家级",
    category: "创客",
    registerDeadline: "2026-05-30",
    competitionDate: "2026-07-05",
    participants: 15,
    status: "已截止",
    achievements: "往届获奖: 特等奖1名, 一等奖3名"
  },
];

// Mock data for certifications
const certifications = [
  {
    id: 1,
    name: "全国青少年软件编程等级考试",
    organizer: "中国电子学会",
    type: "Python编程",
    levels: ["一级", "二级", "三级", "四级"],
    nextExamDate: "2026-06-22",
    registeredStudents: 25,
    passRate: "85%"
  },
  {
    id: 2,
    name: "Arduino官方认证工程师",
    organizer: "Arduino官方",
    type: "硬件开发",
    levels: ["基础认证", "进阶认证"],
    nextExamDate: "2026-07-15",
    registeredStudents: 12,
    passRate: "78%"
  },
  {
    id: 3,
    name: "青少年人工智能技术水平测试",
    organizer: "中国人工智能产业发展联盟",
    type: "AI应用",
    levels: ["初级", "中级", "高级"],
    nextExamDate: "2026-08-10",
    registeredStudents: 18,
    passRate: "82%"
  },
];

export default function CompetitionsPage() {
  const statusColors: Record<string, string> = {
    "报名中": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "筹备中": "bg-blue-50 text-blue-600 border-blue-200",
    "已截止": "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">竞赛与认证</h1>
          <p className="text-sm text-slate-500 mt-1">管理赛事报名、考级安排和获奖成果</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          添加赛事
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月参赛人数</p>
              <p className="text-2xl font-bold text-slate-900">53</p>
              <p className="text-xs text-emerald-600 mt-1">覆盖4项赛事</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">累计获奖</p>
              <p className="text-2xl font-bold text-slate-900">127</p>
              <p className="text-xs text-amber-600 mt-1">含金奖15个</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">考级通过率</p>
              <p className="text-2xl font-bold text-slate-900">82%</p>
              <p className="text-xs text-emerald-600 mt-1">高于平均</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">近期活动</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-blue-600 mt-1">未来30天</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-800">赛事报名</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {competitions.length} 项</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索赛事名称..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {competitions.map((comp) => (
            <div key={comp.id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">{comp.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[comp.status]}`}>
                      {comp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>主办: {comp.organizer}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{comp.level}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{comp.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">报名截止</p>
                  <p className="text-sm font-medium text-slate-900">{comp.registerDeadline}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">比赛日期</p>
                  <p className="text-sm font-medium text-slate-900">{comp.competitionDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">报名人数</p>
                  <p className="text-sm font-medium text-slate-900">{comp.participants} 人</p>
                </div>
              </div>
              
              {comp.achievements && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700">🏆 {comp.achievements}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  管理报名
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-slate-800">等级认证</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {certifications.length} 项</span>
          </div>
        </div>
        
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div key={cert.id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{cert.name}</h3>
                  <p className="text-sm text-slate-600">{cert.organizer}</p>
                </div>
                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                  {cert.type}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">认证级别</p>
                  <div className="flex gap-2 flex-wrap">
                    {cert.levels.map((level, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">下次考试</p>
                    <p className="text-sm font-medium text-slate-900">{cert.nextExamDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">报名人数</p>
                    <p className="text-sm font-medium text-slate-900">{cert.registeredStudents} 人</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">历史通过率</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: cert.passRate }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{cert.passRate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                  报名管理
                </button>
                <button className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
