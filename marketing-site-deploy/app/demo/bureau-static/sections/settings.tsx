"use client";

import { Settings, Shield, Key, Database, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">演示账号信息</h3>
            <p className="text-xs text-slate-500">当前 Demo 环境可用账号</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "教育局管理员", user: "bureau_admin", pass: "demo123456", color: "amber" },
              { role: "学校校长", user: "school_principal", pass: "demo123456", color: "blue" },
              { role: "学科教研员", user: "researcher_01", pass: "demo123456", color: "purple" },
            ].map((acc, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                <div className={`text-xs font-semibold text-${acc.color}-600 mb-2`}>{acc.role}</div>
                <div className="text-xs text-slate-500 mb-1">用户名</div>
                <code className="text-sm font-mono text-slate-800">{acc.user}</code>
                <div className="text-xs text-slate-500 mt-2 mb-1">密码</div>
                <code className="text-sm font-mono text-slate-800">{acc.pass}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield, title: "权限与角色",
            items: [
              { label: "系统角色", value: "3 种", desc: "管理员/教研员/校级" },
              { label: "当前在线", value: "—", desc: "演示模式无实时数据" },
              { label: "操作日志保留", value: "90 天" },
            ],
          },
          {
            icon: Database, title: "数据与统计",
            items: [
              { label: "覆盖学校", value: "25 所" },
              { label: "设备记录", value: "1,203 条" },
              { label: "课程资源", value: "68 门共享课程" },
            ],
          },
          {
            icon: Globe, title: "系统信息",
            items: [
              { label: "管理区域", value: "梅山县教育局" },
              { label: "系统版本", value: "v2.6.0" },
              { label: "上次更新", value: "2026-05-15" },
            ],
          },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{section.title}</h4>
            </div>
            <div className="p-5 space-y-3">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">{item.label}</span>
                    {item.desc && <p className="text-[10px] text-slate-400">{item.desc}</p>}
                  </div>
                  <span className="text-xs font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <Settings className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">演示模式</p>
          <p className="text-xs text-amber-600 mt-0.5">当前为只读演示环境，系统配置不可修改。数据每 24 小时自动重置。</p>
        </div>
      </div>
    </div>
  );
}
