"use client";

import { Settings, Shield, Key, Brain, Globe, Cpu } from "lucide-react";
import { mockData } from "../_data";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">演示账号信息</h3>
            <p className="text-xs text-slate-500">当前 Demo 环境可用账号</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "管理员", user: "admin", pass: "demo123456", color: "blue" },
              { role: "教师", user: "teacher", pass: "demo123456", color: "emerald" },
              { role: "学生", user: "student", pass: "demo123456", color: "purple" },
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
              { label: "系统角色", value: "3 种", desc: "管理员/教师/学生" },
              { label: "当前在线", value: "—", desc: "演示模式无实时数据" },
              { label: "操作日志保留", value: "90 天" },
            ],
          },
          {
            icon: Brain, title: "Token 配置",
            items: [
              { label: "Token 余额", value: "12,580 点" },
              { label: "计费模式", value: "按量付费" },
              { label: "本月消耗", value: "12,580 点" },
            ],
          },
          {
            icon: Cpu, title: "机构信息",
            items: [
              { label: "机构名称", value: mockData.institution.fullName },
              { label: "在训学员", value: `${mockData.stats.totalStudents} 人` },
              { label: "本月营收", value: `¥${(mockData.stats.monthlyRevenue / 10000).toFixed(1)}万` },
            ],
          },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-blue-600" />
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
          <p className="text-xs text-amber-600 mt-0.5">当前为只读演示环境，数据 24h 自动重置。</p>
        </div>
      </div>
    </div>
  );
}
