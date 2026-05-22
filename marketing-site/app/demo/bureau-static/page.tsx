"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Home, School, BarChart3, Award, LayoutDashboard, Settings, Bell, Search,
  AlertCircle, TrendingUp, Building2, GraduationCap, BookOpen, Wrench, DollarSign,
  Users, UserCheck, MapPin, AlertTriangle, Truck, Clock, FileText,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ====== 梅山县教育局 · STEM 教育监管平台 ======
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

const mockData = {
  institution: { name: "梅山县教育局", fullName: "梅山县教育局 · STEM 教育监管平台", type: "bureau", location: "中部某县城", note: "统筹全县中小学校STEM教育发展 · 推动教育资源均衡配置" },
  user: { name: "陈国华", role: "基教科科长", subRole: "分管STEM教育", avatar: "陈", yearsService: 12, bio: "从教研室做起，推动全县STEM教育从零起步到25所学校全覆盖" },
  stats: {
    totalSchools: 25, schoolChange: 3,
    stemStudents: 8470, studentChange: 12.5,
    stemTeachers: 186, teacherChange: 8.7,
    stemCoverage: 76, coverageChange: 8.3,
    annualBudget: 3800000, budgetUnit: "万元",
    competitionAwards: 34, awardChange: 6,
  },
  // 学校STEM教育质量评估
  schoolRanking: [
    { name: "梅山县第一中学", type: "高中", stemScore: 88, students: 620, status: "优秀", equipment: "充足", keyStrength: "机器人竞赛强校，省级获奖", warning: null },
    { name: "梅山县第二中学", type: "初中", stemScore: 85, students: 480, status: "优秀", equipment: "充足", keyStrength: "创客项目丰富，社团活跃", warning: null },
    { name: "梅山县实验小学", type: "小学", stemScore: 82, students: 350, status: "良好", equipment: "充足", keyStrength: "3D打印/编程启蒙领先", warning: null },
    { name: "梅山县职业技术学校", type: "职校", stemScore: 80, students: 826, status: "良好", equipment: "基本满足", keyStrength: "校企合作紧密，孵化器活跃", warning: null },
    { name: "城关镇初级中学", type: "初中", stemScore: 75, students: 420, status: "良好", equipment: "基本满足", keyStrength: "电子制作/焊接实训扎实", warning: null },
    { name: "梅山县第三中学", type: "高中", stemScore: 72, students: 380, status: "良好", equipment: "紧缺", keyStrength: "学科竞赛有突破", warning: "设备紧缺" },
    { name: "青山镇中心学校", type: "九年一贯制", stemScore: 65, students: 280, status: "待提升", equipment: "紧缺", keyStrength: "教师积极性高", warning: "设备紧缺" },
    { name: "龙湾乡中心学校", type: "九年一贯制", stemScore: 58, students: 180, status: "薄弱", equipment: "严重不足", keyStrength: "学生兴趣浓厚", warning: "重点帮扶" },
    { name: "白沙镇初级中学", type: "初中", stemScore: 62, students: 310, status: "待提升", equipment: "紧缺", keyStrength: "已申请设备配发", warning: "设备紧缺" },
    { name: "石桥乡中心小学", type: "小学", stemScore: 55, students: 150, status: "薄弱", equipment: "严重不足", keyStrength: "新配创客教室待启用", warning: "重点帮扶" },
  ],
  coverageTrend: [
    { month: "9月", rate: 62 }, { month: "10月", rate: 66 }, { month: "11月", rate: 68 },
    { month: "12月", rate: 71 }, { month: "1月", rate: 74 }, { month: "2月", rate: 76 },
  ],
  schoolTypes: [
    { name: "小学", count: 12, color: "#10b981" },
    { name: "初中", count: 8, color: "#3b82f6" },
    { name: "高中", count: 3, color: "#f59e0b" },
    { name: "职校", count: 2, color: "#8b5cf6" },
  ],
  // ====== STEM设备配发与跨校调配 ======
  equipmentPool: {
    totalValue: 4860000, allocated: 3520000, inTransit: 480000, toApprove: 860000,
    crossSchoolShare: { thisMonth: 8, total: 35, desc: "跨校借用次数" },
    items: [
      { id: 1, name: "Arduino教学套件", total: 85, allocated: 68, inStock: 17, unit: "套", unitPrice: 1200, target: "已配发12所学校" },
      { id: 2, name: "3D打印机", total: 22, allocated: 16, inStock: 6, unit: "台", unitPrice: 3500, target: "已配发8所学校" },
      { id: 3, name: "Micro:bit套装", total: 120, allocated: 95, inStock: 25, unit: "套", unitPrice: 380, target: "已配发15所学校" },
      { id: 4, name: "焊接工作台套装", total: 40, allocated: 30, inStock: 10, unit: "套", unitPrice: 2500, target: "已配发9所学校" },
      { id: 5, name: "传感器实验箱", total: 50, allocated: 35, inStock: 15, unit: "套", unitPrice: 3200, target: "已配发10所学校" },
      { id: 6, name: "无人机教学套装", total: 18, allocated: 10, inStock: 8, unit: "套", unitPrice: 4800, target: "已配发6所学校" },
      { id: 7, name: "机器人竞赛套装", total: 15, allocated: 12, inStock: 3, unit: "套", unitPrice: 8600, target: "已配发5所竞赛学校" },
    ],
    crossSchoolRecords: [
      { id: 1, from: "梅山县实验小学", to: "石桥乡中心小学", item: "3D打印机 x1", date: "2月16日", reason: "乡镇学校创客周活动", status: "使用中" },
      { id: 2, from: "梅山县第二中学", to: "龙湾乡中心学校", item: "Arduino套件 x3", date: "2月10日", reason: "支教交流·编程启蒙课", status: "已归还" },
      { id: 3, from: "梅山县职业技术学校", to: "青山镇中心学校", item: "焊接工作台 x2", date: "2月8日", reason: "电子制作社团支援", status: "使用中" },
      { id: 4, from: "梅山县第一中学", to: "白沙镇初级中学", item: "传感器实验箱 x1", date: "2月5日", reason: "物联网课程支援", status: "已归还" },
    ],
    pendingRequests: [
      { id: 1, school: "龙湾乡中心学校", item: "Arduino教学套件", qty: 5, reason: "新增STEM课程，零基础起步", priority: "紧急", date: "2月18日" },
      { id: 2, school: "石桥乡中心小学", item: "Micro:bit套装", qty: 10, reason: "编程启蒙课程扩班", priority: "紧急", date: "2月17日" },
      { id: 3, school: "青山镇中心学校", item: "传感器实验箱", qty: 3, reason: "九年级物理实验教学", priority: "一般", date: "2月15日" },
      { id: 4, school: "梅山县第三中学", item: "3D打印机", qty: 2, reason: "创客空间扩容", priority: "一般", date: "2月12日" },
    ],
  },
  // ====== 师资培训 ======
  teacherTraining: {
    trainedThisYear: 86, totalTarget: 186, completionRate: 46,
    sessions: [
      { id: 1, title: "Arduino编程入门培训", trainer: "市教研室·周教研员", date: "2月25日", attendees: 32, max: 40, status: "报名中", type: "线下" },
      { id: 2, title: "3D打印与创客教育", trainer: "县职校·刘主任", date: "3月5日", attendees: 28, max: 30, status: "即将开课", type: "线下" },
      { id: 3, title: "Python+Micro:bit编程教学", trainer: "省教科院·李老师", date: "3月15日", attendees: 45, max: 50, status: "报名中", type: "线上" },
    ],
    districtStats: [
      { area: "县城片区", schools: 8, trained: 42, coverage: 68 },
      { area: "城关镇片区", schools: 5, trained: 18, coverage: 52 },
      { area: "青山镇片区", schools: 4, trained: 12, coverage: 38 },
      { area: "龙湾乡片区", schools: 3, trained: 5, coverage: 22 },
      { area: "白沙镇片区", schools: 3, trained: 6, coverage: 30 },
      { area: "石桥乡片区", schools: 2, trained: 3, coverage: 20 },
    ],
  },
  // ====== 竞赛管理 ======
  competitions: {
    yearTotal: 34, national: 1, provincial: 8, municipal: 12, county: 13,
    upcoming: [
      { id: 1, name: "全县中小学生机器人竞赛", level: "县级", date: "3月20日", schools: 18, participants: 86, status: "报名中", venue: "县一中体育馆" },
      { id: 2, name: "全市青少年科技创新大赛", level: "市级", date: "4月10日", schools: 8, participants: 24, status: "作品准备", venue: "市教育局" },
      { id: 3, name: "全省中小学生信息素养提升活动", level: "省级", date: "5月15日", schools: 3, participants: 9, status: "集训中", venue: "省科技馆" },
    ],
    recentResults: [
      { id: 1, event: "全市无人机编程挑战赛", school: "梅山县第一中学", award: "一等奖", level: "市级", date: "1月" },
      { id: 2, event: "全县创客马拉松", school: "梅山县第二中学", award: "团体冠军", level: "县级", date: "1月" },
      { id: 3, event: "全市3D创意设计大赛", school: "梅山县实验小学", award: "二等奖", level: "市级", date: "12月" },
      { id: 4, event: "全省青少年机器人竞赛", school: "梅山县第一中学", award: "三等奖", level: "省级", date: "11月" },
    ],
  },
  // ====== 经费管理 ======
  budget: {
    annual: 380, spent: 212, remaining: 168, unit: "万元",
    allocation: [
      { name: "STEM设备采购配发", amount: 160, pct: 42, color: "#f59e0b" },
      { name: "创客实验室建设", amount: 80, pct: 21, color: "#3b82f6" },
      { name: "师资培训", amount: 60, pct: 16, color: "#10b981" },
      { name: "竞赛组织与资助", amount: 45, pct: 12, color: "#8b5cf6" },
      { name: "课程资源开发", amount: 25, pct: 6, color: "#ec4899" },
      { name: "其他支出", amount: 10, pct: 3, color: "#94a3b8" },
    ],
    recentExpenses: [
      { id: 1, item: "Arduino教学套件第四批采购", amount: 28, school: "配发5所学校", date: "2月", status: "已拨付" },
      { id: 2, item: "全县机器人竞赛经费", amount: 8, school: "全县18校参赛", date: "2月", status: "已拨付" },
      { id: 3, item: "青山镇学校创客实验室建设", amount: 15, school: "青山镇中心学校", date: "2月", status: "审批中" },
      { id: 4, item: "寒假STEM师资培训", amount: 12, school: "全县教师32人", date: "1月", status: "已拨付" },
    ],
  },
  // ====== 课程资源 ======
  curriculum: {
    totalCourses: 68, sharedSchools: 22,
    categories: [
      { name: "编程与计算思维", count: 18, color: "#3b82f6" },
      { name: "电子与电路", count: 14, color: "#10b981" },
      { name: "3D设计与制造", count: 12, color: "#f59e0b" },
      { name: "机器人与自动化", count: 10, color: "#ef4444" },
      { name: "科学探究与实验", count: 14, color: "#8b5cf6" },
    ],
    featured: [
      { id: 1, title: "Scratch编程·校园导航小助手", school: "梅山县实验小学", grade: "4-6年级", downloads: 156, rating: 4.8 },
      { id: 2, title: "Arduino温湿度监测系统", school: "梅山县第二中学", grade: "7-9年级", downloads: 128, rating: 4.6 },
      { id: 3, title: "3D打印·桥梁结构设计", school: "梅山县第一中学", grade: "10-12年级", downloads: 95, rating: 4.7 },
    ],
  },
  // ====== 近期动态 ======
  recentActivities: [
    { id: 1, type: "equipment", text: "第四批Arduino套件到货，配发至龙湾乡等5所学校", time: "2小时前", icon: "📦" },
    { id: 2, type: "competition", text: "全县机器人竞赛报名截止，18所学校86名学生参赛", time: "6小时前", icon: "🤖" },
    { id: 3, type: "training", text: "寒假STEM师资培训结业，32名教师通过考核", time: "1天前", icon: "🎓" },
    { id: 4, type: "cooperation", text: "石桥乡中心小学新配创客教室完成验收并投入使用", time: "2天前", icon: "🏫" },
    { id: 5, type: "report", text: "龙湾乡中心学校提交STEM设备紧急配发申请", time: "3天前", icon: "📋" },
    { id: 6, type: "achievement", text: "县一中获全市无人机编程挑战赛一等奖", time: "4天前", icon: "🏆" },
  ],
};

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "数据总览", badge: null },
  { id: "schools", icon: School, label: "学校监管", badge: "25所" },
  { id: "equipment", icon: Wrench, label: "设备调配", badge: "4待处理" },
  { id: "training", icon: UserCheck, label: "师资培训", badge: "46%" },
  { id: "competitions", icon: Award, label: "竞赛管理", badge: "3场" },
  { id: "budget", icon: DollarSign, label: "经费管理", badge: null },
  { id: "curriculum", icon: BookOpen, label: "课程资源", badge: "68门" },
  { id: "reports", icon: BarChart3, label: "数据报表", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];

export default function DemoBureauStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const scrollToSection = (id: string) => {
    setActiveMenu(id);
    const el = document.getElementById(`section-${id}`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);
  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative"><div className="w-20 h-20 border-4 border-amber-500/30 rounded-full" /><div className="absolute inset-0 w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        <p className="text-slate-400 mt-6 text-sm">正在加载演示环境...</p>
        <p className="text-slate-600 text-xs mt-2">{mockData.institution.name} · STEM 监管平台</p>
      </div>
    </div>
  );

  const statusColor = (s: string) => s === "薄弱" || s === "紧急" ? "text-red-600 bg-red-50" : s === "待提升" || s === "紧缺" ? "text-amber-600 bg-amber-50" : s === "优秀" || s === "已归还" ? "text-green-600 bg-green-50" : "text-blue-600 bg-blue-50";
  const priorityColor = (p: string) => p === "紧急" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">MS</div>
            <div className="min-w-0"><h1 className="font-bold text-slate-800 text-sm truncate">梅山县教育局</h1><p className="text-xs text-slate-500 truncate">STEM 监管平台</p></div>
          </div>
        </div>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{mockData.user.avatar}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{mockData.user.name}</p><p className="text-xs text-slate-500 truncate">{mockData.user.role}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => scrollToSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeMenu === item.id ? "bg-amber-50 text-amber-700 font-medium shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" /><span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.badge.includes("待处理") || item.badge.includes("46") ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Link href="/demo" className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><ArrowLeft className="w-4 h-4" />返回选择</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="px-6 py-3 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-800">{mockData.institution.fullName}</h2><p className="text-xs text-slate-500 mt-0.5">{mockData.institution.note}</p></div>
            <div className="flex items-center gap-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="搜索学校、教师、设备..." className="pl-10 pr-4 py-2 w-72 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />演示模式</div>
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"><Bell className="w-5 h-5 text-slate-600" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Home className="w-5 h-5 text-slate-600" /></Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Row1: KPI */}
          <div id="section-dashboard" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: School, bg: "bg-blue-100", ic: "text-blue-600", v: mockData.stats.totalSchools, c: `+${mockData.stats.schoolChange}`, l: "管辖学校", b: "" },
              { icon: GraduationCap, bg: "bg-purple-100", ic: "text-purple-600", v: mockData.stats.stemStudents.toLocaleString(), c: `+${mockData.stats.studentChange}%`, l: "STEM学生数", b: "" },
              { icon: UserCheck, bg: "bg-amber-100", ic: "text-amber-600", v: mockData.stats.stemTeachers, c: `+${mockData.stats.teacherChange}%`, l: "STEM教师", b: "" },
              { icon: BarChart3, bg: "bg-green-100", ic: "text-green-600", v: `${mockData.stats.stemCoverage}%`, c: `+${mockData.stats.coverageChange}%`, l: "STEM覆盖率", b: "border-l-4 border-l-green-400" },
              { icon: Wrench, bg: "bg-orange-100", ic: "text-orange-600", v: `${mockData.equipmentPool.crossSchoolShare.thisMonth}次`, c: `累计${mockData.equipmentPool.crossSchoolShare.total}次`, l: "跨校设备共享/月", b: "" },
              { icon: Award, bg: "bg-red-100", ic: "text-red-600", v: mockData.stats.competitionAwards, c: `+${mockData.stats.awardChange}`, l: "年度竞赛获奖", b: "" },
            ].map((k, i) => (
              <div key={i} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${k.b}`}>
                <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center`}><k.icon className={`w-5 h-5 ${k.ic}`} /></div><span className="text-xs font-medium text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{k.c}</span></div>
                <div className="text-2xl font-bold text-slate-800">{k.v}</div><div className="text-xs text-slate-500 mt-0.5">{k.l}</div>
              </div>
            ))}
          </div>

          {/* Row2: Coverage Trend + School Types + Weak Schools */}
          <div id="section-reports" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div><h3 className="text-base font-semibold text-slate-800">STEM 教育覆盖率趋势</h3><p className="text-xs text-slate-500 mt-0.5">近6个月全县中小学校STEM课程开设率</p></div>
                <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">目标：85%</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={mockData.coverageTrend}>
                    <defs><linearGradient id="colorCov" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} domain={[50, 90]} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", fontSize: "13px" }} />
                    <Area type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCov)" name="覆盖率 %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800">学校类型分布</h3></div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={150}><PieChart><Pie data={mockData.schoolTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count">{mockData.schoolTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">{mockData.schoolTypes.map((item, i) => <div key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-500 truncate">{item.name}</span><span className="text-slate-800 font-medium ml-auto">{item.count}所</span></div>)}</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-400">
                <div className="p-5"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-slate-800">薄弱校预警</h3></div>
                  {mockData.schoolRanking.filter(s => s.status === "薄弱").map(s => <div key={s.name} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0"><div><span className="text-slate-700 font-medium">{s.name}</span><span className="text-slate-400 ml-2">{s.type}</span></div><div className="flex items-center gap-2"><span className="text-red-600 font-semibold">{s.stemScore}分</span><span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">{s.warning}</span></div></div>)}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-amber-600 font-medium flex items-center gap-1"><MapPin className="w-3 h-3" />龙湾乡、石桥乡为重点帮扶片区</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row3: Feature Cards */}
          <div id="section-equipment" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wrench, bg: "from-orange-500 to-red-600", label: "设备调配", sub: `${mockData.equipmentPool.crossSchoolShare.thisMonth}次跨校共享`, desc: "全县设备统一采购 → 按需配发 → 跨校流转", highlight: `${mockData.equipmentPool.pendingRequests.length}所学校待配发`, color: "orange" },
              { icon: UserCheck, bg: "from-blue-500 to-blue-700", label: "师资培训", sub: `已完成${mockData.teacherTraining.completionRate}%`, desc: "县城集训 + 线上课程 + 送教下乡", highlight: `${mockData.teacherTraining.sessions.length}场培训进行中`, color: "blue" },
              { icon: Award, bg: "from-red-500 to-red-700", label: "竞赛组织", sub: `年度获奖${mockData.stats.competitionAwards}项`, desc: "县级选拔 → 市级推荐 → 省级参赛", highlight: `${mockData.competitions.upcoming.length}场赛事待办`, color: "red" },
              { icon: BookOpen, bg: "from-green-500 to-green-700", label: "课程共享", sub: `${mockData.curriculum.totalCourses}门共享课程`, desc: "优秀教案全县共享，薄弱校可直接使用", highlight: `${mockData.curriculum.sharedSchools}所学校在下载`, color: "green" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.bg} flex items-center justify-center`}><card.icon className="w-5 h-5 text-white" /></div><div><h4 className="text-sm font-semibold text-slate-800">{card.label}</h4><p className="text-xs text-slate-500">{card.sub}</p></div></div>
                <p className="text-xs text-slate-400">{card.desc}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-600 font-medium flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full bg-${card.color === "orange" ? "amber" : card.color}-500`} />{card.highlight} →</div>
              </div>
            ))}
          </div>

          {/* Row4: School Ranking + Today Activities */}
          <div id="section-schools" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><School className="w-4.5 h-4.5 text-blue-500" />学校 STEM 教育质量评估</h3><div className="flex gap-2 text-xs">{["全部","优秀","良好","待提升","薄弱"].map(t => <button key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700">{t}</button>)}</div></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50"><tr>{["排名","学校","学段","学生数","STEM评分","设备状态","评级","重点"].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                  <tbody>
                    {mockData.schoolRanking.map((school, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-3"><span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${idx < 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{idx + 1}</span></td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{school.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{school.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-center">{school.students}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${school.stemScore >= 80 ? "bg-green-500" : school.stemScore >= 65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: school.stemScore + '%' }} /></div><span className="text-sm font-semibold text-slate-800">{school.stemScore}</span></div></td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${school.equipment === "严重不足" ? "bg-red-50 text-red-600" : school.equipment === "紧缺" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{school.equipment}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(school.status)}`}>{school.status}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">{school.keyStrength}{school.warning && <span className="text-red-500 ml-1">⚠ {school.warning}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Clock className="w-4.5 h-4.5 text-amber-500" />近期动态</h3></div>
                <div className="p-5"><div className="space-y-3">{mockData.recentActivities.map(a => <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"><div className="text-xl flex-shrink-0">{a.icon}</div><div className="min-w-0 flex-1"><p className="text-xs text-slate-700 leading-relaxed">{a.text}</p><p className="text-xs text-slate-400 mt-1">{a.time}</p></div></div>)}</div></div>
              </div>
            </div>
          </div>

          {/* Row5: Equipment Allocation + Teacher Training */}
          <div id="section-training" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* STEM设备配发 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Wrench className="w-4.5 h-4.5 text-orange-500" />STEM 设备配发池</h3><p className="text-xs text-slate-500 mt-0.5">统一采购 · 按需配发 · 跨校流转</p></div>
                <div className="text-right"><div className="text-lg font-bold text-slate-800">¥{(mockData.equipmentPool.totalValue / 10000).toFixed(0)}万</div><div className="text-xs text-slate-500">设备总值</div></div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5 border-b border-slate-100">
                {[{ v: `¥${(mockData.equipmentPool.allocated / 10000).toFixed(0)}万`, l: "已配发" }, { v: `¥${(mockData.equipmentPool.inTransit / 10000).toFixed(0)}万`, l: "调拨中", c: "text-blue-600" }, { v: `¥${(mockData.equipmentPool.toApprove / 10000).toFixed(0)}万`, l: "待审批", c: "text-amber-600" }].map((k, i) => <div key={i} className="text-center"><div className={`text-xl font-bold ${k.c || "text-slate-800"}`}>{k.v}</div><div className="text-xs text-slate-500 mt-1">{k.l}</div></div>)}
              </div>
              <div className="p-5">
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50"><tr>{["物品名称","总量","已配发","库存","单价","覆盖学校"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead><tbody>{mockData.equipmentPool.items.map(item => <tr key={item.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors"><td className="px-3 py-2.5 text-sm font-medium text-slate-800">{item.name}</td><td className="px-3 py-2.5 text-sm text-center text-slate-600">{item.total}{item.unit}</td><td className="px-3 py-2.5 text-sm text-center text-green-600 font-semibold">{item.allocated}</td><td className={`px-3 py-2.5 text-sm text-center font-semibold ${item.inStock < 10 ? "text-red-600" : "text-slate-600"}`}>{item.inStock}</td><td className="px-3 py-2.5 text-xs text-slate-500">¥{item.unitPrice.toLocaleString()}</td><td className="px-3 py-2.5 text-xs text-slate-500">{item.target}</td></tr>)}</tbody></table></div>
              </div>
            </div>
            {/* 师资培训 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><UserCheck className="w-4.5 h-4.5 text-blue-500" />STEM 师资培训</h3><span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">{mockData.teacherTraining.trainedThisYear}/{mockData.teacherTraining.totalTarget}人</span></div>
              <div className="p-5 space-y-2">
                {mockData.teacherTraining.districtStats.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-700 font-medium">{d.area}</span><span className="text-slate-400">{d.trained}/{d.schools * 15}人参训</span></div>
                    <div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${d.coverage >= 50 ? "bg-green-500" : d.coverage >= 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: d.coverage + '%' }} /></div><span className="text-xs font-semibold text-slate-600 w-8 text-right">{d.coverage}%</span></div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2">
                <div className="border-t border-slate-100 pt-3"><h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">近期培训场次</h4></div>
                {mockData.teacherTraining.sessions.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{s.title}</p><p className="text-xs text-slate-500 mt-0.5">{s.trainer}</p></div><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${s.status === "报名中" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{s.status}</span></div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400"><span>{s.date}</span><span>{s.type}</span><span>{s.attendees}/{s.max}人</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row6: Cross-school Sharing + Pending Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Truck className="w-4.5 h-4.5 text-blue-500" />跨校设备共享流转</h3><span className="text-xs text-blue-600 font-medium">本月{mockData.equipmentPool.crossSchoolShare.thisMonth}次</span></div>
              <div className="p-5 space-y-3">{mockData.equipmentPool.crossSchoolRecords.map(r => <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">{r.id}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 text-xs"><span className="font-semibold text-slate-800">{r.from}</span><span className="text-slate-400">→</span><span className="font-semibold text-slate-800">{r.to}</span></div><p className="text-xs text-slate-600 mt-0.5">{r.item} · {r.reason}</p><div className="flex items-center gap-2 mt-1.5"><span className="text-xs text-slate-400">{r.date}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span></div></div></div>)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><AlertTriangle className="w-4.5 h-4.5 text-red-500" />设备配发待处理</h3><span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">{mockData.equipmentPool.pendingRequests.length}项待处理</span></div>
              <div className="p-5 space-y-3">{mockData.equipmentPool.pendingRequests.map(req => <div key={req.id} className="p-3 rounded-lg border border-slate-100 hover:border-red-200 transition-colors"><div className="flex items-start justify-between"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-800">{req.school}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityColor(req.priority)}`}>{req.priority}</span></div><p className="text-xs text-slate-500 mt-0.5">{req.item} x{req.qty} · {req.reason}</p></div><button className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex-shrink-0 ml-2">审批</button></div><div className="flex items-center gap-2 mt-2 text-xs"><span className="text-slate-400">{req.date}</span></div></div>)}</div>
            </div>
          </div>

          {/* Row7: Competitions + Budget */}
          <div id="section-competitions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Award className="w-4.5 h-4.5 text-red-500" />竞赛组织与管理</h3><div className="flex gap-2 text-xs">{["全部","县级","市级","省级","国家级"].map(t => <button key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600">{t}</button>)}</div></div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[{ v: mockData.competitions.national, l: "国家级" }, { v: mockData.competitions.provincial, l: "省级" }, { v: mockData.competitions.municipal, l: "市级" }, { v: mockData.competitions.county, l: "县级" }].map((k, i) => <div key={i} className="text-center p-3 rounded-lg bg-slate-50"><div className="text-xl font-bold text-slate-800">{k.v}</div><div className="text-xs text-slate-500 mt-0.5">{k.l}</div></div>)}
                </div>
                <div className="space-y-2 mb-4"><h4 className="text-xs font-semibold text-slate-500 uppercase">近期获奖</h4></div>
                <div className="space-y-2">{mockData.competitions.recentResults.map(r => <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{r.event}</p><p className="text-xs text-slate-400">{r.school}</p></div><div className="flex items-center gap-2 flex-shrink-0"><span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">{r.level}</span><span className="text-sm font-bold text-red-600">{r.award}</span></div></div>)}</div>
              </div>
            </div>
            <div id="section-budget" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><DollarSign className="w-4.5 h-4.5 text-amber-500" />STEM 经费管理</h3></div>
                <div className="p-5">
                  <div className="text-center mb-4"><div className="text-3xl font-bold text-slate-800">¥{mockData.budget.annual}万</div><div className="text-xs text-slate-500 mt-1">年度STEM教育总预算</div></div>
                  <div className="space-y-2.5">{mockData.budget.allocation.map((item, i) => <div key={i} className="space-y-1"><div className="flex items-center justify-between text-xs"><span className="text-slate-600">{item.name}</span><span className="text-slate-800 font-semibold">¥{item.amount}万</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: item.pct + '%', backgroundColor: item.color }} /></div></div>)}</div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs"><span className="text-slate-500">已支出 <span className="font-semibold text-slate-700">¥{mockData.budget.spent}万</span></span><span className="text-green-600 font-semibold">剩余 ¥{mockData.budget.remaining}万</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800">最近经费支出</h3></div>
                <div className="p-5 space-y-2">{mockData.budget.recentExpenses.map(e => <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50"><div className="min-w-0 flex-1"><span className="text-slate-700 font-medium">{e.item}</span><span className="text-slate-400 ml-2">{e.school}</span></div><div className="flex items-center gap-2 flex-shrink-0"><span className="text-slate-600 font-semibold">¥{e.amount}万</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${e.status === "已拨付" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{e.status}</span></div></div>)}</div>
              </div>
            </div>
          </div>

          {/* Row8: Curriculum Resources */}
          <div id="section-curriculum" className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><BookOpen className="w-4.5 h-4.5 text-green-500" />STEM 课程资源共享池</h3><span className="text-xs text-green-600 font-medium">{mockData.curriculum.totalCourses}门课程 · {mockData.curriculum.sharedSchools}所学校在共享</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <div className="lg:col-span-2 p-5 border-r border-slate-100">
                <div className="grid grid-cols-5 gap-3 mb-5">{mockData.curriculum.categories.map(c => <div key={c.name} className="text-center p-3 rounded-lg border border-slate-100 hover:border-green-200 transition-colors cursor-pointer"><div className="text-xl font-bold" style={{ color: c.color }}>{c.count}</div><div className="text-xs text-slate-500 mt-1">{c.name}</div></div>)}</div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">优秀课程教案</h4>
                <div className="space-y-3">{mockData.curriculum.featured.map(c => <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-green-200 transition-colors"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{c.title}</p><p className="text-xs text-slate-400">{c.school} · 适用{c.grade}</p></div><div className="flex items-center gap-3 flex-shrink-0 ml-3"><span className="text-xs text-slate-400">⬇ {c.downloads}次</span><span className="text-xs text-amber-500 font-medium">★ {c.rating}</span></div></div>)}</div>
              </div>
              <div className="p-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">薄弱校课程推荐</h4>
                <div className="space-y-2">{[
                  { title: "Scratch趣味编程·入门10课", from: "县实验小学", for: "小学" },
                  { title: "Arduino零基础·点亮第一颗LED", from: "县二中", for: "初中" },
                  { title: "3D打印·从建模到成品", from: "县职校", for: "通用" },
                ].map((r, i) => <div key={i} className="p-3 rounded-lg bg-green-50 border border-green-100"><p className="text-xs font-medium text-slate-800">{r.title}</p><div className="flex items-center justify-between mt-1"><span className="text-xs text-slate-400">来源：{r.from}</span><span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">{r.for}</span></div></div>)}</div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg"><p className="text-xs text-amber-700"><span className="font-semibold">💡 提示：</span>龙湾乡中心学校、石桥乡中心小学可优先从共享池下载课程资源，零基础可直接使用。</p></div>
              </div>
            </div>
          </div>

        </main>

        {/* Floating Demo Info */}
        <div className="fixed bottom-6 right-6 max-w-sm p-5 bg-white border border-slate-200 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-3"><span className="text-lg">🏛️</span><h4 className="text-sm font-bold text-slate-800">演示账号信息</h4></div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">科长</span><code className="text-amber-600 font-mono">chen_director / demo123456</code></div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">督导员</span><code className="text-amber-600 font-mono">li_inspector / demo123456</code></div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">教研员</span><code className="text-amber-600 font-mono">zhang_researcher / demo123456</code></div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"><div className="flex items-center gap-2 text-xs text-amber-700"><AlertCircle className="w-4 h-4" /><span className="font-medium">只读模式，无法修改数据</span></div></div>
        </div>
      </div>
    </div>
  );
}
