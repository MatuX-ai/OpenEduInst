import { Calendar, FileText, Trophy, Cpu, Package, ClipboardCheck, Radio, Wrench } from "lucide-react";
import { mockData } from "../_data";

export default function FeatureModules() {
  const modules = [
    { title: "社团活动排期", desc: "3个社团共用1间活动室，课后分时段轮转，支持设备预约与安全准入", icon: Calendar, color: "emerald", status: { text: "今日3场活动", color: "emerald" } },
    { title: "社团项目管理", desc: "12个社团项目，从创意到竞赛的完整追踪", icon: FileText, color: "blue", status: { text: "12个进行中", color: "blue" } },
    { title: "竞赛组织", desc: "社团成员组队参赛、教师辅导排班、外出参赛审批", icon: Trophy, color: "amber", status: { text: "3场备赛中", color: "amber" } },
    { title: "社团器材台账", desc: "41台设备来源追踪，社员借还登记，维修历史", icon: Cpu, color: "purple", status: { text: "3台待维修", color: "red" } },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const statusColorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const quickActions = [
    { label: "器材借出", icon: Package },
    { label: "社团活动签到", icon: ClipboardCheck },
    { label: "项目立项", icon: FileText },
    { label: "竞赛报名", icon: Trophy },
    { label: "耗材申领", icon: Radio },
    { label: "报修申请", icon: Wrench },
  ];

  const resources = [
    { label: "Scratch入门课件（自编）", icon: "📘" },
    { label: "Arduino基础实验手册", icon: "📗" },
    { label: "往届竞赛获奖作品集", icon: "🏆" },
    { label: "张老师的社团活动笔记", icon: "📝" },
  ];

  return (
    <div id="section-clubs" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* 功能模块卡片 */}
      <div className="lg:col-span-3 grid grid-cols-2 gap-3">
        {modules.map((mod, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + colorMap[mod.color]}>
                <mod.icon className="w-4.5 h-4.5" />
              </div>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-medium " + statusColorMap[mod.status.color]}>
                {mod.status.text}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">{mod.title}</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">{mod.desc}</p>
          </div>
        ))}
      </div>

      {/* 快捷操作 + 资源 */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">快捷操作</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => (
              <button key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs text-slate-600 hover:text-emerald-700 transition-all">
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">社团资源</h3>
          <div className="space-y-1.5">
            {resources.map((res, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-xs text-slate-600 cursor-pointer transition-all">
                <span>{res.icon}</span>
                <span>{res.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
