import { UserPlus, Phone, Calendar, TrendingUp, Filter, Search, Plus, CheckCircle, XCircle, Clock } from "lucide-react";

// Mock data for leads
const leads = [
  { 
    id: 1, 
    name: "刘家长", 
    phone: "138****5678", 
    source: "地推活动", 
    interest: "Arduino基础班", 
    status: "待跟进",
    createTime: "2026-05-22",
    followUpTime: "2026-05-23",
    grade: "四年级",
    avatar: "刘"
  },
  { 
    id: 2, 
    name: "陈家长", 
    phone: "139****1234", 
    source: "老带新", 
    interest: "机器人进阶班", 
    status: "已预约试听",
    createTime: "2026-05-21",
    followUpTime: "2026-05-24",
    grade: "五年级",
    avatar: "陈"
  },
  { 
    id: 3, 
    name: "王家长", 
    phone: "137****9876", 
    source: "线上咨询", 
    interest: "Python编程", 
    status: "已报名",
    createTime: "2026-05-20",
    followUpTime: "-",
    grade: "六年级",
    avatar: "王"
  },
  { 
    id: 4, 
    name: "赵家长", 
    phone: "136****4567", 
    source: "转介绍", 
    interest: "AI视觉课程", 
    status: "待跟进",
    createTime: "2026-05-22",
    followUpTime: "2026-05-23",
    grade: "七年级",
    avatar: "赵"
  },
  { 
    id: 5, 
    name: "李家长", 
    phone: "135****2345", 
    source: "地推活动", 
    interest: "Scratch启蒙", 
    status: "未接通",
    createTime: "2026-05-19",
    followUpTime: "2026-05-20",
    grade: "三年级",
    avatar: "李"
  },
];

export default function LeadsPage() {
  const statusColors: Record<string, string> = {
    "待跟进": "bg-amber-50 text-amber-600 border-amber-200",
    "已预约试听": "bg-blue-50 text-blue-600 border-blue-200",
    "已报名": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "未接通": "bg-slate-50 text-slate-600 border-slate-200",
  };

  const sourceStats = [
    { source: "地推活动", count: 45, conversion: "32%" },
    { source: "老带新", count: 38, conversion: "68%" },
    { source: "线上咨询", count: 52, conversion: "28%" },
    { source: "转介绍", count: 23, conversion: "55%" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">招生线索</h1>
          <p className="text-sm text-slate-500 mt-1">管理潜在客户、跟进记录和转化分析</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          添加线索
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月新增线索</p>
              <p className="text-2xl font-bold text-slate-900">158</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +23% 较上月
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">待跟进</p>
              <p className="text-2xl font-bold text-slate-900">15</p>
              <p className="text-xs text-amber-600 mt-1">需尽快联系</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">试听课预约</p>
              <p className="text-2xl font-bold text-slate-900">28</p>
              <p className="text-xs text-blue-600 mt-1">本周安排</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">转化率</p>
              <p className="text-2xl font-bold text-slate-900">42%</p>
              <p className="text-xs text-emerald-600 mt-1">行业平均35%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lead Conversion Funnel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Lead List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-800">线索列表</h2>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {leads.length} 条</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索姓名/电话..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
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
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">家长信息</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">来源渠道</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">意向课程</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">跟进状态</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">创建时间</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {lead.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{lead.source}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm text-slate-700">{lead.interest}</p>
                          <p className="text-xs text-slate-500">{lead.grade}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded border ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                        {lead.createTime}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">跟进</button>
                        <button className="text-slate-600 hover:text-slate-700 text-sm">详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">显示 1-5 条，共 {leads.length} 条</p>
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

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Source Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">渠道转化分析</h3>
              <p className="text-xs text-slate-500 mt-1">本月数据</p>
            </div>
            <div className="p-5 space-y-4">
              {sourceStats.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.source}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.count} 条线索</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{item.conversion}</p>
                    <p className="text-xs text-slate-500">转化率</p>
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
                安排试听课
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600" />
                批量外呼
              </button>
              <button className="w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700">
                <UserPlus className="w-4 h-4 text-purple-600" />
                导入线索
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
