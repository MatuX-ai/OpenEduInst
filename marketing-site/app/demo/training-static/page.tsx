"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Users,
  BookOpen,
  Code,
  Cpu,
  LayoutDashboard,
  Calendar,
  Settings,
  UserCheck,
  BarChart3,
  Bell,
  AlertCircle,
  TrendingUp,
  Brain,
  Clock,
  Wrench,
  DollarSign,
  Radio,
  PenTool,
  Video,
  Megaphone,
  ClipboardCheck,
  UserPlus,
  FileSpreadsheet,
  Wifi,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const mockData = {
  institution: {
    name: "星海机器人",
    fullName: "星海机器人培训中心",
    type: "training",
  },
  user: {
    name: "赵校长",
    role: "机构负责人",
    avatar: "赵",
  },
  stats: {
    totalStudents: 328,
    monthlyRevenue: 125000,
    courseCompletion: 92,
    deviceUsage: 78,
  },
  revenueTrend: [
    { month: "9月", revenue: 98000 },
    { month: "10月", revenue: 105000 },
    { month: "11月", revenue: 112000 },
    { month: "12月", revenue: 118000 },
    { month: "1月", revenue: 122000 },
    { month: "2月", revenue: 125000 },
  ],
  tokenConsumption: [
    { name: "AI助教", value: 4800, color: "#3b82f6" },
    { name: "智能评测", value: 3500, color: "#8b5cf6" },
    { name: "课程生成", value: 2800, color: "#10b981" },
    { name: "代码审查", value: 1480, color: "#f59e0b" },
  ],
  deviceInventory: [
    { name: "Arduino Uno", total: 50, available: 8, usageRate: 84, status: "需补充" },
    { name: "Raspberry Pi 4B", total: 20, available: 6, usageRate: 70, status: "正常" },
    { name: "传感器套件", total: 30, available: 12, usageRate: 60, status: "正常" },
    { name: "电机驱动模块", total: 25, available: 5, usageRate: 80, status: "需补充" },
    { name: "3D 打印机", total: 3, available: 1, usageRate: 67, status: "正常" },
  ],
  stemProjects: [
    { name: "智能温室控制系统", students: 18, status: "进行中", progress: 75, category: "IoT", deadline: "2026-06-15" },
    { name: "AI视觉识别小车", students: 15, status: "已完成", progress: 100, category: "AI", deadline: "2026-05-10" },
    { name: "物联网环境监测站", students: 22, status: "进行中", progress: 60, category: "IoT", deadline: "2026-07-01" },
    { name: "语音助手开发", students: 12, status: "进行中", progress: 45, category: "AI", deadline: "2026-06-30" },
    { name: "无人机编程控制", students: 9, status: "规划中", progress: 20, category: "机器人", deadline: "2026-08-01" },
  ],
  teacherTeam: [
    { name: "张老师", skill: "Arduino 专家", experience: "5年", status: "授课中", avatar: "张" },
    { name: "李老师", skill: "Python 导师", experience: "3年", status: "空闲", avatar: "李" },
    { name: "王老师", skill: "机器人教练", experience: "6年", status: "授课中", avatar: "王" },
    { name: "陈老师", skill: "IoT 工程师", experience: "4年", status: "空闲", avatar: "陈" },
  ],
  recentActivities: [
    { id: 1, icon: "🤖", text: "新购入 15 套 Arduino 传感器扩展板", time: "30分钟前", type: "设备" },
    { id: 2, icon: "🏆", text: "《AI视觉识别小车》项目通过最终评审", time: "2小时前", type: "项目" },
    { id: 3, icon: "💰", text: "Token余额充值 5,000点（¥1,500）", time: "4小时前", type: "Token" },
    { id: 4, icon: "🔧", text: "3D打印机 #002 完成喷嘴更换维护", time: "1天前", type: "设备" },
    { id: 5, icon: "📋", text: "「物联网开发实战」新班次开班通知", time: "2天前", type: "课程" },
  ],
  todaySchedule: [
    { time: "09:00-10:30", title: "Arduino 传感器实战", room: "创客空间 A区", teacher: "张老师", students: 20, type: "硬件" },
    { time: "10:30-12:00", title: "Python 物联网开发", room: "编程教室 201", teacher: "李老师", students: 18, type: "编程" },
    { time: "14:00-15:30", title: "机器人避障算法", room: "创客空间 B区", teacher: "王老师", students: 15, type: "机器人" },
    { time: "15:30-17:00", title: "AI模型训练入门", room: "AI实验室 301", teacher: "陈老师", students: 12, type: "AI" },
  ],
};

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "管理后台", badge: null },
  { id: "leads", icon: UserPlus, label: "招生线索", badge: "15位待跟进" },
  { id: "schedule", icon: Calendar, label: "智能排课", badge: "本周42节" },
  { id: "devices", icon: Wrench, label: "设备管理", badge: "5台待维护" },
  { id: "projects", icon: Code, label: "项目管理", badge: "3个进行中" },
  { id: "tokens", icon: Brain, label: "Token中心", badge: "12,580点" },
  { id: "billing", icon: DollarSign, label: "课时结算", badge: "待确认8单" },
  { id: "reports", icon: BarChart3, label: "数据报表", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];

export default function DemoTrainingStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const loadTimer = setTimeout(() => setIsLoading(false), 600);
    return () => { clearTimeout(timer); clearTimeout(loadTimer); };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 mt-6 text-sm">正在加载演示环境...</p>
          <p className="text-slate-600 text-xs mt-2">{mockData.institution.fullName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ====== Left Sidebar ====== */}
      <aside className="w-60 bg-slate-900 flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">{mockData.institution.name}</h1>
              <p className="text-xs text-slate-400">培训中心管理</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-blue-500/30">
              {mockData.user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{mockData.user.name}</p>
              <p className="text-xs text-slate-400">{mockData.user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                activeMenu === item.id
                  ? "bg-blue-600/20 text-blue-400 font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  activeMenu === item.id
                    ? "bg-blue-600/30 text-blue-300"
                    : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Links */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            href="/demo"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回Demo选择
          </Link>
        </div>
      </aside>

      {/* ====== Main Content ====== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
          <div className="px-6 py-3 flex items-center justify-between">
            {/* Left: Simulated Device Info */}
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-slate-400 font-mono">{currentTime || "00:00"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-blue-500 rounded-full" />
                </div>
                <span className="text-slate-400">85%</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-md text-[11px] font-semibold">
                演示模式
              </div>
              <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Link
                href="/"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="返回首页"
              >
                <Home className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* ====== Row 1: 核心 KPI 卡片 ====== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: "在训学员", value: mockData.stats.totalStudents, unit: "人", icon: Users, color: "blue", trend: "+12.5%", trendUp: true },
              { label: "本月营收", value: "¥" + (mockData.stats.monthlyRevenue / 10000).toFixed(1), unit: "万", icon: DollarSign, color: "emerald", trend: "+8.3%", trendUp: true },
              { label: "本月消课率", value: mockData.stats.courseCompletion, unit: "%", icon: BookOpen, color: "purple", trend: "+2.1%", trendUp: true },
              { label: "设备使用率", value: mockData.stats.deviceUsage, unit: "%", icon: Cpu, color: "amber", trend: "-3.2%", trendUp: false },
            ].map((card, idx) => {
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                emerald: "bg-emerald-50 text-emerald-600",
                purple: "bg-purple-50 text-purple-600",
                amber: "bg-amber-50 text-amber-600",
              };
              const trendMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                emerald: "bg-emerald-50 text-emerald-600",
                purple: "bg-purple-50 text-purple-600",
                amber: "bg-amber-50 text-amber-600",
              };
              return (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? "text-emerald-600" : "text-red-500"}`}>
                      <TrendingUp className={`w-3 h-3 ${!card.trendUp ? "rotate-180" : ""}`} />
                      {card.trend}
                    </div>
                  </div>
                  <div className="text-[28px] font-bold text-slate-900 mb-0.5">
                    {card.value}
                    <span className="text-sm font-normal text-slate-400 ml-0.5">{card.unit}</span>
                  </div>
                  <div className="text-sm text-slate-500">{card.label}</div>
                </div>
              );
            })}
          </div>

          {/* ====== Row 2: 营收趋势 + Token消耗分布 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">月度营收趋势</h3>
                    <p className="text-xs text-slate-500 mt-0.5">STEM课程 + 设备租赁 + Token充值</p>
                  </div>
                  <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
                    <option>近 6 个月</option>
                    <option>近 12 个月</option>
                  </select>
                </div>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={mockData.revenueTrend}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value) => [`¥${(value as number).toLocaleString()}`, "营收"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#revGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-800">Token 消耗分布</h3>
                <p className="text-xs text-slate-500 mt-0.5">本月累计 12,580点</p>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={mockData.tokenConsumption} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {mockData.tokenConsumption.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${(value as number).toLocaleString()}点`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {mockData.tokenConsumption.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{item.value.toLocaleString()}点</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ====== Row 3: STEM 特色功能模块 + 快捷操作 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            {/* 功能模块（带实时状态）*/}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-800">STEM 特色功能</h3>
                <p className="text-xs text-slate-500 mt-0.5">区别于普通教培的核心模块</p>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {[
                    { icon: Wrench, label: "硬件设备管理", desc: "Arduino/传感器/3D打印机", status: "5台待维护", statusColor: "bg-amber-50 text-amber-600" },
                    { icon: Code, label: "实验项目管理", desc: "IoT/AI/机器人项目追踪", status: "3个进行中", statusColor: "bg-blue-50 text-blue-600" },
                    { icon: Brain, label: "Token 计费", desc: "AI助教·智能评测·课程生成", status: "余额12,580点", statusColor: "bg-purple-50 text-purple-600" },
                    { icon: Calendar, label: "创客空间调度", desc: "实验室预约·设备共享池", status: "今日4个时段", statusColor: "bg-emerald-50 text-emerald-600" },
                  ].map((mod, idx) => (
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
                    {[
                      { icon: UserPlus, label: "快速报名", color: "blue" },
                      { icon: Wrench, label: "设备借出", color: "amber" },
                      { icon: ClipboardCheck, label: "签到打卡", color: "emerald" },
                      { icon: Code, label: "新建项目", color: "purple" },
                      { icon: DollarSign, label: "续费提醒", color: "rose" },
                      { icon: FileSpreadsheet, label: "导出报表", color: "slate" },
                    ].map((action, idx) => {
                      const iconColors: Record<string, string> = {
                        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                        amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
                        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
                        purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
                        rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
                        slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                      };
                      return (
                        <button key={idx} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[action.color]}`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-slate-600">{action.label}</span>
                        </button>
                      );
                    })}
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
                    {[
                      { icon: PenTool, label: "Arduino课件库", desc: "32套教学方案" },
                      { icon: Radio, label: "传感器数据集", desc: "15组实验数据" },
                      { icon: Megaphone, label: "竞赛通知", desc: "3场赛事报名中" },
                      { icon: Wifi, label: "IoT代码模板", desc: "ESP32/MQTT等" },
                    ].map((res, idx) => (
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

          {/* ====== Row 4: 设备库存 + 今日课表 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            {/* 硬件设备库存 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">🔧 硬件设备库存</h3>
                  <p className="text-xs text-slate-500 mt-0.5">实时可借出状态</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">全部设备 →</button>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {mockData.deviceInventory.map((device, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${device.available <= 5 ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{device.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${device.status === "需补充" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {device.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>总量 {device.total}台</span>
                          <span className="text-emerald-600 font-medium">可借 {device.available}台</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-24">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${device.usageRate}%` }} />
                          </div>
                          <span>{device.usageRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 今日课表 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">📅 今日课表</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {mockData.todaySchedule.map((item, idx) => {
                    const typeColors: Record<string, string> = {
                      "硬件": "border-l-amber-500 bg-amber-50/30",
                      "编程": "border-l-blue-500 bg-blue-50/30",
                      "机器人": "border-l-purple-500 bg-purple-50/30",
                      "AI": "border-l-emerald-500 bg-emerald-50/30",
                    };
                    return (
                      <div key={idx} className={`pl-4 py-3 pr-4 rounded-lg border-l-2 ${typeColors[item.type]} flex items-center gap-3`}>
                        <div className="text-xs font-mono font-semibold text-slate-500 w-20 whitespace-nowrap">{item.time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            📍 {item.room} &nbsp; 👤 {item.teacher}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{item.students}人</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ====== Row 5: 教师团队 + 动态 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 教师技能团队 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-800">👨‍🏫 教师团队</h3>
                <p className="text-xs text-slate-500 mt-0.5">专业技能分布</p>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {mockData.teacherTeam.map((teacher, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                        teacher.status === "授课中" ? "bg-blue-600" : "bg-slate-400"
                      }`}>
                        {teacher.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{teacher.name}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === "授课中" ? "bg-emerald-400" : "bg-slate-300"}`} />
                        </div>
                        <p className="text-xs text-slate-500">{teacher.skill} · 教龄{teacher.experience}</p>
                      </div>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                        teacher.status === "授课中" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
                      }`}>
                        {teacher.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 最近动态 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">📋 最近动态</h3>
                  <p className="text-xs text-slate-500 mt-0.5">机构运营实时更新</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">查看全部</button>
              </div>
              <div className="p-5">
                <div className="space-y-1">
                  {mockData.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{activity.text}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400">{activity.time}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{activity.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Demo Info */}
        <div className="fixed bottom-6 right-6 max-w-xs p-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200">演示环境</h4>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
              <span className="text-slate-400">管理员</span>
              <code className="text-blue-400 font-mono">admin / demo123456</code>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
              <span className="text-slate-400">教师</span>
              <code className="text-blue-400 font-mono">teacher / demo123456</code>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
              <span className="text-slate-400">学生</span>
              <code className="text-blue-400 font-mono">student / demo123456</code>
            </div>
          </div>
          <div className="mt-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span>只读演示 · 数据24h自动重置</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
