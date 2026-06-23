import {
  Wrench, Code, Brain, Calendar, UserPlus, ClipboardCheck,
  DollarSign, FileSpreadsheet, PenTool, Radio, Megaphone, Wifi,
} from "lucide-react";

export default function FeatureActions() {
  const features = [
    { icon: Wrench, label: "硬件设备管理", desc: "Arduino/传感器/3D打印机", status: "5台待维护", statusColor: "bg-amber-50 text-amber-600" },
    { icon: Code, label: "实验项目管理", desc: "IoT/AI/机器人项目追踪", status: "3个进行中", statusColor: "bg-blue-50 text-blue-600" },
    { icon: Brain, label: "Token 计费", desc: "AI助教·智能评测·课程生成", status: "余额12,580点", statusColor: "bg-purple-50 text-purple-600" },
    { icon: Calendar, label: "创客空间调度", desc: "实验室预约·设备共享池", status: "今日4个时段", statusColor: "bg-emerald-50 text-emerald-600" },
  ];

  const quickActions = [
    { icon: UserPlus, label: "快速报名", color: "blue" },
    { icon: Wrench, label: "设备借出", color: "amber" },
    { icon: ClipboardCheck, label: "签到打卡", color: "emerald" },
    { icon: Code, label: "新建项目", color: "purple" },
    { icon: DollarSign, label: "续费提醒", color: "rose" },
    { icon: FileSpreadsheet, label: "导出报表", color: "slate" },
  ];

  const iconColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
    rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
    slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
  };

  const resources = [
    { icon: PenTool, label: "Arduino课件库", desc: "32套教学方案" },
    { icon: Radio, label: "传感器数据集", desc: "15组实验数据" },
    { icon: Megaphone, label: "竞赛通知", desc: "3场赛事报名中" },
    { icon: Wifi, label: "IoT代码模板", desc: "ESP32/MQTT等" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      {/* 功能模块 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">STEM 特色功能</h3>
          <p className="text-xs text-slate-500 mt-0.5">区别于普通教培的核心模块</p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {features.map((mod, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <mod.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{mod.label}</p>
                  <p className="text-xs text-slate-500">{mod.desc}</p>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${mod.statusColor}`}>
                  {mod.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 快捷操作 + 教学资源 */}
      <div className="space-y-4">
        {/* 快捷操作 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">快捷操作</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action, idx) => (
                <button key={idx} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[action.color]}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 教学资源中心 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">教学资源中心</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {resources.map((res, idx) => (
                <button key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <res.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{res.label}</p>
                    <p className="text-xs text-slate-400">{res.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
