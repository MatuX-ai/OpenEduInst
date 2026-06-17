import { Bell, CheckCircle, AlertTriangle, Calendar, FileText, DollarSign, Users, Clock } from "lucide-react";

// Mock data for notifications
const notifications = [
  {
    id: 1,
    type: "approval",
    title: "新课开设申请待审批",
    content: "张老师提交了《ESP32物联网开发》新课开设申请，等待您的审批。",
    time: "10分钟前",
    read: false,
    priority: "high",
    action: "去审批"
  },
  {
    id: 2,
    type: "renewal",
    title: "学员续费预警",
    content: "李小红（六年级）的机器人进阶课程剩余8课时，建议尽快联系家长续费。",
    time: "30分钟前",
    read: false,
    priority: "medium",
    action: "查看详情"
  },
  {
    id: 3,
    type: "activity",
    title: "蓝桥杯报名即将截止",
    content: "蓝桥杯青少年编程大赛报名将于6月15日截止，当前已有18名学员报名。",
    time: "2小时前",
    read: false,
    priority: "high",
    action: "查看报名"
  },
  {
    id: 4,
    type: "approval",
    title: "设备采购申请已通过",
    content: "您提交的15套Arduino传感器扩展板采购申请已通过审批，预计3天后到货。",
    time: "4小时前",
    read: true,
    priority: "low",
    action: null
  },
  {
    id: 5,
    type: "renewal",
    title: "批量续费提醒",
    content: "本月共有23名学员课程即将到期，其中8人剩余课时≤10节。",
    time: "1天前",
    read: true,
    priority: "medium",
    action: "发送提醒"
  },
  {
    id: 6,
    type: "activity",
    title: "暑期集训营开始报名",
    content: "「AI视觉识别」暑期集训营已开启报名，早鸟价优惠至6月15日。",
    time: "2天前",
    read: true,
    priority: "low",
    action: "查看活动"
  },
  {
    id: 7,
    type: "system",
    title: "系统维护通知",
    content: "系统将于今晚23:00-01:00进行例行维护，期间部分功能可能暂时不可用。",
    time: "3天前",
    read: true,
    priority: "low",
    action: null
  },
];

export default function NotificationsPage() {
  const typeIcons: Record<string, any> = {
    approval: FileText,
    renewal: DollarSign,
    activity: Calendar,
    system: Bell,
  };

  const typeColors: Record<string, string> = {
    approval: "bg-blue-50 text-blue-600 border-blue-200",
    renewal: "bg-amber-50 text-amber-600 border-amber-200",
    activity: "bg-emerald-50 text-emerald-600 border-emerald-200",
    system: "bg-purple-50 text-purple-600 border-purple-200",
  };

  const typeLabels: Record<string, string> = {
    approval: "审批提醒",
    renewal: "续费预警",
    activity: "活动通知",
    system: "系统通知",
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === "high" && !n.read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">消息中心</h1>
          <p className="text-sm text-slate-500 mt-1">审批提醒、续费预警、活动通知</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            全部已读
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            设置
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">未读消息</p>
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
              <p className="text-xs text-blue-600 mt-1">需及时处理</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">高优先级</p>
              <p className="text-2xl font-bold text-slate-900">{highPriorityCount}</p>
              <p className="text-xs text-red-600 mt-1">紧急处理</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">待审批</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-amber-600 mt-1">项申请</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">续费预警</p>
              <p className="text-2xl font-bold text-slate-900">23</p>
              <p className="text-xs text-slate-500 mt-1">名学员</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            全部 ({notifications.length})
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            未读 ({unreadCount})
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            审批提醒
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            续费预警
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            活动通知
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            return (
              <div 
                key={notification.id} 
                className={`p-5 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                        {notification.priority === "high" && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-200">
                            紧急
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{notification.time}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">{notification.content}</p>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${typeColors[notification.type]}`}>
                        {typeLabels[notification.type]}
                      </span>
                      {notification.action && (
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          {notification.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Load More */}
        <div className="p-5 border-t border-slate-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            加载更多消息
          </button>
        </div>
      </div>
    </div>
  );
}
