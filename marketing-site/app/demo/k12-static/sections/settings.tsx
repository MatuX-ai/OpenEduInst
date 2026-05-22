"use client";

import { Settings, Shield, Users, Key, Database, Globe } from "lucide-react";
import { mockData } from "../_data";

export default function SettingsPage() {
  const settingsSections = [
    {
      icon: Shield,
      title: "账号与权限",
      items: [
        { label: "管理员账号", value: "admin@" + mockData.institution.name, desc: "超级管理员" },
        { label: "教师账号数", value: "6 个", desc: "含学科教师兼任" },
        { label: "学生账号数", value: "186 个", desc: "社团成员自动分配" },
      ],
    },
    {
      icon: Database,
      title: "数据与存储",
      items: [
        { label: "学生作品", value: "9 件", desc: "图片+文档存储" },
        { label: "设备记录", value: "41 条", desc: "含借还日志" },
        { label: "活动记录", value: "本学期新增 23 条" },
      ],
    },
    {
      icon: Globe,
      title: "机构信息",
      items: [
        { label: "学校名称", value: mockData.institution.fullName },
        { label: "所在地区", value: mockData.institution.location },
        { label: "实验室规模", value: mockData.institution.labSize },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* 演示账号 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">演示账号信息</h3>
            <p className="text-xs text-slate-500">当前 Demo 环境可用账号</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "管理员", user: "admin", pass: "demo123456", color: "emerald" },
              { role: "指导教师", user: "teacher_zhang", pass: "demo123456", color: "blue" },
              { role: "学生", user: "student_001", pass: "demo123456", color: "purple" },
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

      {/* 系统设置卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settingsSections.map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-emerald-600" />
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

      {/* 演示模式提示 */}
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
