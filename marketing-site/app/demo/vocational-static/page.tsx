"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Home, Users, Wrench, Trophy, LayoutDashboard, Calendar, Settings,
  GraduationCap, UserCheck, BarChart3, Bell, AlertCircle, TrendingUp, FileText,
  Clock, Building2, Briefcase, ShoppingBag, Plus, AlertTriangle, BookOpen,
  Rocket, Lightbulb, Heart,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ====== 梅山县职业技术学校 —— 县城 STEM 实训基地 ======
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

const mockData = {
  institution: { name: "梅山县职业技术学校", fullName: "梅山县职业技术学校 · STEM 实训中心", type: "vocational", location: "中部某县城", departments: 3, annualBudget: 1800000, note: "县级职教中心 · 服务本地产业升级 · 学生实训即上岗" },
  user: { name: "刘建国", role: "实训中心主任", subRole: "电子技术高级讲师", avatar: "刘", yearsTeaching: 16, bio: "从教16年，带学生做过工厂自动化改造，拿过省级技能竞赛奖" },
  stats: { totalStudents: 826, studentChange: 8.3, activeTeachers: 42, teacherChange: 2.4, totalDevices: 203, deviceChange: 12.5, employmentRate: 94.5, employmentChange: 2.1, enterprisePartners: 23, partnerChange: 5, incubatingProjects: 6, projectChange: 50 },
  deviceUsage: [{ month: "9月", inUse: 178, total: 203 }, { month: "10月", inUse: 185, total: 203 }, { month: "11月", inUse: 192, total: 203 }, { month: "12月", inUse: 180, total: 203 }, { month: "1月", inUse: 196, total: 203 }, { month: "2月", inUse: 188, total: 203 }],
  deviceTypes: [{ name: "嵌入式开发板", value: 60 }, { name: "电工电子实训台", value: 45 }, { name: "传感器实验台", value: 30 }, { name: "焊接工作台", value: 25 }, { name: "小型PLC套件", value: 20 }, { name: "3D打印机", value: 6 }, { name: "其他设备", value: 17 }],
  equipment: [
    { id: 1, name: "嵌入式开发板", model: "STM32F103 / ESP32", total: 60, available: 48, inUse: 12, status: "正常", lab: "嵌入式实验室 201" },
    { id: 2, name: "电工电子实训台", model: "通用型 YL-135", total: 45, available: 38, inUse: 7, status: "正常", lab: "电工电子实训中心" },
    { id: 3, name: "传感器实验台", model: "YL-998 型", total: 30, available: 25, inUse: 5, status: "正常", lab: "传感技术实验室 203" },
    { id: 4, name: "焊接工作台", model: "恒温焊台 936型", total: 25, available: 20, inUse: 5, status: "正常", lab: "电子工艺实训室 102" },
    { id: 5, name: "小型PLC套件", model: "FX3U-24MR", total: 20, available: 16, inUse: 4, status: "正常", lab: "自动化实训室 301" },
    { id: 6, name: "3D打印机", model: "Creality Ender-3", total: 6, available: 4, inUse: 2, status: "1台待维修", lab: "创客工坊 101" },
    { id: 7, name: "示波器", model: "RIGOL DS1054Z", total: 12, available: 10, inUse: 2, status: "正常", lab: "电子测量实验室 202" },
  ],
  consumables: {
    totalItems: 48, lowStockCount: 7,
    inventory: [
      { id: 1, name: "焊锡丝", spec: "0.8mm 含松香", stock: 12, safetyStock: 20, unit: "卷", status: "紧缺" },
      { id: 2, name: "电子元器件包", spec: "电阻/电容/二极管", stock: 60, safetyStock: 50, unit: "套", status: "正常" },
      { id: 3, name: "PLA 3D打印耗材", spec: "1.75mm 各色", stock: 5, safetyStock: 12, unit: "卷", status: "紧缺" },
      { id: 4, name: "覆铜板", spec: "单面 10x15cm", stock: 150, safetyStock: 100, unit: "片", status: "正常" },
      { id: 5, name: "杜邦线套装", spec: "公母/母母", stock: 18, safetyStock: 25, unit: "套", status: "紧缺" },
      { id: 6, name: "继电器模块", spec: "5V/12V 单路", stock: 40, safetyStock: 30, unit: "个", status: "正常" },
      { id: 7, name: "步进电机驱动", spec: "A4988", stock: 8, safetyStock: 15, unit: "个", status: "紧缺" },
      { id: 8, name: "传感器模块套装", spec: "温湿度/超声波/红外", stock: 35, safetyStock: 25, unit: "套", status: "正常" },
      { id: 9, name: "面包板", spec: "830孔", stock: 12, safetyStock: 20, unit: "块", status: "紧缺" },
      { id: 10, name: "LED灯珠套装", spec: "红/绿/蓝 5mm", stock: 350, safetyStock: 200, unit: "颗", status: "正常" },
      { id: 11, name: "热缩管套装", spec: "各规格", stock: 5, safetyStock: 10, unit: "盒", status: "紧缺" },
      { id: 12, name: "接线端子", spec: "5mm间距", stock: 15, safetyStock: 20, unit: "包", status: "紧缺" },
    ],
    borrowRecords: [
      { id: 1, borrower: "李明", role: "学生", class: "电子2101", items: "焊锡丝x2、电子元器件x8", purpose: "毕业设计·温控系统", date: "2月18日", status: "使用中", avatar: "李" },
      { id: 2, borrower: "张老师", role: "教师", class: "—", items: "杜邦线x5、传感器模块x3", purpose: "电子工艺课程", date: "2月16日", status: "已归还", avatar: "张" },
      { id: 3, borrower: "王磊", role: "学生", class: "机电2101", items: "步进电机驱动x2、继电器x8", purpose: "孵化器·自动分拣样机", date: "2月15日", status: "使用中", avatar: "王" },
      { id: 4, borrower: "陈静", role: "学生", class: "电子2102", items: "覆铜板x15、传感器x3", purpose: "孵化器·水位报警器", date: "2月14日", status: "已归还", avatar: "陈" },
      { id: 5, borrower: "刘老师", role: "教师", class: "—", items: "面包板x6、LED灯珠x100", purpose: "技能竞赛集训", date: "2月12日", status: "使用中", avatar: "刘" },
    ],
    purchaseRequests: [
      { id: 1, item: "焊锡丝 0.8mm", quantity: 30, cost: 420, requester: "张老师", reason: "库存低于安全线，影响实训进度", status: "待审批" },
      { id: 2, item: "PLA耗材 各色套装", quantity: 15, cost: 900, requester: "刘主任", reason: "孵化器项目3D打印打样急需", status: "已批准" },
      { id: 3, item: "步进电机驱动 A4988", quantity: 12, cost: 360, requester: "王磊(学生)", reason: "孵化器·自动分拣样机配套", status: "待审批" },
      { id: 4, item: "面包板 830孔", quantity: 15, cost: 120, requester: "刘老师", reason: "竞赛集训日常消耗补充", status: "已批准" },
    ],
  },
  // ====== 校企合作（本地民企，缺研发能力，合作空间大）======
  enterprises: [
    { id: 1, name: "永利电子厂", type: "电子元器件组装", projects: 3, students: 25, logo: "永", color: "from-blue-500 to-blue-700", desc: "缺自动化检测方案" },
    { id: 2, name: "华丰机械加工厂", type: "五金零件加工", projects: 2, students: 18, logo: "华", color: "from-orange-500 to-orange-700", desc: "缺数控编程人员" },
    { id: 3, name: "鑫达自动化设备", type: "小型非标设备", projects: 2, students: 15, logo: "鑫", color: "from-green-500 to-green-700", desc: "缺嵌入式开发" },
    { id: 4, name: "绿源新能源科技", type: "太阳能设备安装", projects: 1, students: 12, logo: "绿", color: "from-teal-500 to-teal-700", desc: "缺智能监控系统" },
    { id: 5, name: "瑞恒智能安防", type: "安防监控工程", projects: 1, students: 10, logo: "瑞", color: "from-purple-500 to-purple-700", desc: "缺物联网方案" },
  ],
  cooperationProjects: [
    { id: 1, name: "电子元件自动分拣装置", enterprise: "永利电子厂", progress: 65, students: 8, stage: "样机调试", painPoint: "靠人工分拣效率低，出错率高", value: "学生做嵌入式控制+传感器方案，厂方提供物料和试用场景" },
    { id: 2, name: "数控车床自动上下料改造", enterprise: "华丰机械加工厂", progress: 40, students: 6, stage: "方案设计", painPoint: "3台老式车床靠人工上下料，效率低", value: "学生设计PLC+气缸自动送料，厂方给设备练手" },
    { id: 3, name: "小型冲压件计数分装系统", enterprise: "鑫达自动化设备", progress: 75, students: 5, stage: "现场试运行", painPoint: "小批量冲压件统计靠手数", value: "学生做红外计数+传送带分装，已出样机" },
    { id: 4, name: "光伏板倾斜角度自动调节", enterprise: "绿源新能源科技", progress: 30, students: 4, stage: "原型开发", painPoint: "固定式光伏板效率低，需低成本追光方案", value: "学生做光敏传感器+步进电机方案" },
    { id: 5, name: "车间环境智能监测终端", enterprise: "瑞恒智能安防", progress: 55, students: 5, stage: "样机测试", painPoint: "需低成本温湿度+烟感一体化方案", value: "学生做传感器网络+数据回传，厂方给安装机会" },
  ],
  // ====== 双创孵化器（学生团队创新创业）======
  incubator: {
    active: 6, totalFunding: 85000, mentored: 28,
    stages: [{ name: "创意提交", count: 12, color: "#94a3b8" }, { name: "原型开发", count: 6, color: "#3b82f6" }, { name: "样机测试", count: 4, color: "#f59e0b" }, { name: "推向市场", count: 2, color: "#10b981" }],
    projects: [
      { id: 1, team: "智控未来", leader: "李明", members: 4, className: "电子2101", name: "校园智能浇灌系统", stage: "样机测试", progress: 80, desc: "土壤湿度传感器+电磁阀自动浇花，已在学校花圃实测", mentor: "刘主任", funding: 3000, avatar: "智" },
      { id: 2, team: "创想工作室", leader: "王磊", members: 5, className: "机电2101", name: "小型零件自动分拣机", stage: "原型开发", progress: 60, desc: "为本地五金厂开发低成本分拣装置，已获永利电子意向订单", mentor: "张老师", funding: 5000, avatar: "创" },
      { id: 3, team: "绿芯小队", leader: "陈静", members: 3, className: "电子2102", name: "家庭水位报警器", stage: "推向市场", progress: 92, desc: "低成本液位检测+短信告警，已做出50套在乡镇推广试用", mentor: "刘主任", funding: 2000, avatar: "绿" },
      { id: 4, team: "极光技术社", leader: "赵伟", members: 6, className: "计算机2101", name: "宿舍智能电表抄表系统", stage: "原型开发", progress: 45, desc: "ESP32+电流互感器实现宿舍用电远程抄表与超功率预警", mentor: "王老师", funding: 4000, avatar: "极" },
      { id: 5, team: "匠芯团队", leader: "周强", members: 4, className: "电子2101", name: "老人跌倒检测手环", stage: "创意提交", progress: 25, desc: "加速度传感器做跌倒检测+GSM一键呼救，面向农村留守老人", mentor: "张老师", funding: 0, avatar: "匠" },
      { id: 6, team: "启明星", leader: "吴敏", members: 3, className: "机电2101", name: "教室智能照明控制", stage: "创意提交", progress: 15, desc: "光照传感器+人体红外实现教室人来灯亮人走灯灭", mentor: "刘主任", funding: 0, avatar: "启" },
    ],
  },
  // ====== 技能竞赛 ======
  competitions: [
    { id: 1, name: "全省职业院校技能大赛", subTitle: "电子电路装调与应用", level: "省级", status: "备赛中", date: "2026年5月", students: 4, coach: "张老师", awards: "上届：二等奖" },
    { id: 2, name: "市级中职技能竞赛", subTitle: "单片机控制装置安装与调试", level: "市级", status: "集训中", date: "2026年4月", students: 6, coach: "刘主任", awards: "往届：团体一等奖" },
    { id: 3, name: "县级创新创业大赛", subTitle: "中职学生发明制作", level: "县级", status: "作品提交", date: "2026年3月", students: 8, coach: "王老师", awards: "去年：1金2银" },
  ],
  // ====== 实习就业 ======
  employmentStats: {
    rate2025: 94.5, rate2024: 92.8, rate2023: 90.1, avgSalary: 4200, salaryNote: "本地就业",
    topEnterprises: [
      { name: "永利电子厂", hires: 28, note: "电子组装/质检" }, { name: "华丰机械加工厂", hires: 22, note: "数控操作/维修" },
      { name: "县电力公司", hires: 15, note: "配电运维" }, { name: "县电信公司", hires: 12, note: "装维/机房值守" },
      { name: "省内电子企业", hires: 38, note: "SMT操作/调试" },
    ],
    destinations: [{ name: "本地就业", value: 55 }, { name: "省内其他城市", value: 30 }, { name: "升学深造", value: 10 }, { name: "自主创业", value: 5 }],
  },
  // ====== STEM 教务管理（STEM 实训课程排课/教师工作量，非学籍管理）======
  academic: {
    currentSemester: "2025-2026学年第二学期", totalClasses: 18, weeklySessions: 432,
    note: "仅管理STEM实训课程，不含文化课/学籍等通用教务",
    courses: [
      { name: "电子技术基础", grade: "2024级", students: 156, sessions: 6, teacher: "张老师", room: "电子理论教室 201", labHours: 2, type: "理论+实训" },
      { name: "单片机原理与应用", grade: "2023级", students: 128, sessions: 8, teacher: "刘主任", room: "嵌入式实验室 201", labHours: 4, type: "纯实训" },
      { name: "电工电子实训", grade: "2024级", students: 156, sessions: 4, teacher: "王老师", room: "电工电子实训中心", labHours: 4, type: "纯实训" },
      { name: "PLC控制技术", grade: "2023级", students: 85, sessions: 6, teacher: "李老师", room: "自动化实训室 301", labHours: 4, type: "纯实训" },
      { name: "传感器技术与应用", grade: "2023级", students: 128, sessions: 4, teacher: "张老师", room: "传感技术实验室 203", labHours: 3, type: "理论+实训" },
      { name: "电子CAD制图", grade: "2024级", students: 156, sessions: 4, teacher: "陈老师", room: "计算机机房 401", labHours: 2, type: "理论+实训" },
    ],
    // STEM实训室排课统计
    labSchedule: [
      { lab: "嵌入式实验室 201", weeklySlots: 28, usedSlots: 22, utilization: 79, note: "单片机/嵌入式课程" },
      { lab: "电工电子实训中心", weeklySlots: 32, usedSlots: 26, utilization: 81, note: "电工电子/焊接实训" },
      { lab: "自动化实训室 301", weeklySlots: 24, usedSlots: 18, utilization: 75, note: "PLC/气动控制" },
      { lab: "传感技术实验室 203", weeklySlots: 20, usedSlots: 14, utilization: 70, note: "传感器/测量技术" },
      { lab: "创客工坊 101", weeklySlots: 16, usedSlots: 8, utilization: 50, note: "3D打印/孵化器项目" },
    ],
    teacherWorkload: [
      { name: "刘主任", courses: 4, weeklyHours: 18, classes: "电子2101/2102", load: "适中" },
      { name: "张老师", courses: 5, weeklyHours: 22, classes: "电子2201/机电2201", load: "偏重" },
      { name: "王老师", courses: 3, weeklyHours: 14, classes: "机电2101/2102", load: "适中" },
      { name: "李老师", courses: 3, weeklyHours: 16, classes: "机电2201", load: "适中" },
      { name: "陈老师", courses: 2, weeklyHours: 10, classes: "电子2201", load: "轻松" },
    ],
  },
  // ====== 今日实训课表 ======
  todaySchedule: [
    { time: "08:20", title: "单片机原理与应用", room: "嵌入式实验室 201", teacher: "刘主任", class: "电子2101", type: "嵌入式" },
    { time: "10:10", title: "电工电子实训", room: "电工电子实训中心", teacher: "王老师", class: "机电2201", type: "电工" },
    { time: "14:00", title: "PLC控制技术", room: "自动化实训室 301", teacher: "李老师", class: "机电2101", type: "PLC" },
    { time: "15:40", title: "双创孵化·项目辅导", room: "创客工坊 101", teacher: "张老师", class: "孵化器团队", type: "双创" },
  ],
  // ====== 教师团队 ======
  teacherTeam: [
    { name: "刘建国", role: "实训中心主任", skills: ["嵌入式开发", "PLC编程", "竞赛指导"], avatar: "刘", status: "在职", bio: "16年教龄", color: "from-purple-500 to-purple-700" },
    { name: "张志明", role: "电子技术讲师", skills: ["PCB设计", "传感器应用", "嵌入式"], avatar: "张", status: "上课中", bio: "12年教龄", color: "from-blue-500 to-blue-700" },
    { name: "王德华", role: "电工电子讲师", skills: ["电工基础", "焊接工艺", "电气维修"], avatar: "王", status: "在职", bio: "8年教龄", color: "from-green-500 to-green-700" },
    { name: "李永刚", role: "PLC/自动化讲师", skills: ["PLC编程", "气动控制", "组态"], avatar: "李", status: "在职", bio: "10年教龄", color: "from-orange-500 to-orange-700" },
    { name: "陈小燕", role: "计算机/CAD讲师", skills: ["CAD制图", "3D建模", "Python"], avatar: "陈", status: "在职", bio: "6年教龄", color: "from-teal-500 to-teal-700" },
    { name: "永利电子·刘工", role: "企业兼职讲师", skills: ["电子产品工艺", "质检规范", "产线管理"], avatar: "工", status: "每周1天驻校", bio: "永利电子技术主管", color: "from-slate-500 to-slate-700" },
  ],
  recentActivities: [
    { id: 1, type: "incubator", text: "绿芯小队「家庭水位报警器」首批50套试产，在3个乡镇推广中", time: "2小时前", icon: "🚀" },
    { id: 2, type: "cooperation", text: "永利电子厂将一条闲置流水线搬到学校，供学生实训和样机测试", time: "6小时前", icon: "🏭" },
    { id: 3, type: "achievement", text: "电子2101班李明团队获县创新创业大赛发明制作组一等奖", time: "1天前", icon: "🏆" },
    { id: 4, type: "equipment", text: "新到10套ESP32开发板，优先拨给孵化器团队使用", time: "2天前", icon: "📦" },
    { id: 5, type: "meeting", text: "与华丰机械加工厂商讨下阶段合作：学生参与机床数字化改造", time: "3天前", icon: "🤝" },
    { id: 6, type: "enrollment", text: "春季招生宣讲会：展示学生孵化产品水位报警器，反响热烈", time: "4天前", icon: "🎓" },
  ],
  budgetOverview: {
    annual: 1800000, spent: 1380000, remaining: 420000,
    items: [
      { name: "设备采购与维护", amount: 650000, percentage: 47 }, { name: "实训耗材", amount: 380000, percentage: 27 },
      { name: "校企合作及孵化器", amount: 180000, percentage: 13 }, { name: "竞赛与师资培训", amount: 120000, percentage: 9 }, { name: "其他", amount: 50000, percentage: 4 },
    ],
  },
};

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "实训仪表盘", badge: null },
  { id: "equipment", icon: Wrench, label: "实训设备", badge: "203台" },
  { id: "consumables", icon: ShoppingBag, label: "实训耗材", badge: "7项预警" },
  { id: "cooperation", icon: Building2, label: "校企合作", badge: "23家" },
  { id: "incubator", icon: Rocket, label: "双创孵化", badge: "6个项目" },
  { id: "competitions", icon: Trophy, label: "技能竞赛", badge: "3场备赛" },
  { id: "academic", icon: BookOpen, label: "STEM教务", badge: null },
  { id: "employment", icon: Briefcase, label: "实习就业", badge: "94.5%" },
  { id: "students", icon: Users, label: "学生管理", badge: "826人" },
  { id: "teachers", icon: UserCheck, label: "教师管理", badge: "42人" },
  { id: "analytics", icon: BarChart3, label: "数据分析", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];

export default function DemoVocationalStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);
  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative"><div className="w-20 h-20 border-4 border-emerald-500/30 rounded-full" /><div className="absolute inset-0 w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        <p className="text-slate-400 mt-6 text-sm">正在加载演示环境...</p>
        <p className="text-slate-600 text-xs mt-2">梅山县职业技术学校 · STEM 实训中心</p>
      </div>
    </div>
  );

  const statusColor = (s: string) => s === "紧缺" || s === "使用中" ? "text-amber-600 bg-amber-50" : s === "正常" || s === "已归还" ? "text-green-600 bg-green-50" : s === "待维修" ? "text-orange-600 bg-orange-50" : "text-slate-500 bg-slate-100";
  const approvalColor = (s: string) => s === "已批准" ? "text-green-600 bg-green-50" : s === "待审批" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  const workloadColor = (s: string) => s === "偏重" ? "text-amber-600 bg-amber-50" : s === "适中" ? "text-blue-600 bg-blue-50" : "text-green-600 bg-green-50";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">MS</div>
            <div className="min-w-0"><h1 className="font-bold text-slate-800 text-sm truncate">梅山县职校</h1><p className="text-xs text-slate-500 truncate">STEM 实训平台</p></div>
          </div>
        </div>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{mockData.user.avatar}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{mockData.user.name}</p><p className="text-xs text-slate-500 truncate">{mockData.user.role}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeMenu === item.id ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" /><span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.badge.includes("预警") || item.badge.includes("备赛") ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Link href="/demo" className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><ArrowLeft className="w-4 h-4" />返回选择</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="px-6 py-3 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-800">{mockData.institution.fullName}</h2><p className="text-xs text-slate-500 mt-0.5">{mockData.institution.note}</p></div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />演示模式</div>
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"><Bell className="w-5 h-5 text-slate-600" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Home className="w-5 h-5 text-slate-600" /></Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Row1: KPI */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, bg: "bg-blue-100", ic: "text-blue-600", v: mockData.stats.totalStudents.toLocaleString(), c: `+${mockData.stats.studentChange}%`, l: "在校学生", b: "" },
              { icon: UserCheck, bg: "bg-purple-100", ic: "text-purple-600", v: mockData.stats.activeTeachers, c: `+${mockData.stats.teacherChange}%`, l: "在职教师", b: "" },
              { icon: Wrench, bg: "bg-orange-100", ic: "text-orange-600", v: mockData.stats.totalDevices, c: `+${mockData.stats.deviceChange}%`, l: "实训设备·台", b: "border-l-4 border-l-orange-400" },
              { icon: Briefcase, bg: "bg-green-100", ic: "text-green-600", v: `${mockData.stats.employmentRate}%`, c: `+${mockData.stats.employmentChange}%`, l: "应届就业率", b: "border-l-4 border-l-green-400" },
              { icon: Building2, bg: "bg-teal-100", ic: "text-teal-600", v: mockData.stats.enterprisePartners, c: `+${mockData.stats.partnerChange}`, l: "合作企业·家", b: "" },
              { icon: Rocket, bg: "bg-amber-100", ic: "text-amber-600", v: mockData.stats.incubatingProjects, c: `+${mockData.stats.projectChange}%`, l: "在孵项目", b: "" },
            ].map((k, i) => (
              <div key={i} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${k.b}`}>
                <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center`}><k.icon className={`w-5 h-5 ${k.ic}`} /></div><span className="text-xs font-medium text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{k.c}</span></div>
                <div className="text-2xl font-bold text-slate-800">{k.v}</div><div className="text-xs text-slate-500 mt-0.5">{k.l}</div>
              </div>
            ))}
          </div>

          {/* Row2: Trends + Pie + Budget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div><h3 className="text-base font-semibold text-slate-800">实训设备使用趋势</h3><p className="text-xs text-slate-500 mt-0.5">近6个月设备在用量 / 总拥有量</p></div>
                <div className="flex items-center gap-3 text-xs"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />在用量</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-200" />总拥有</span></div>
              </div>
              <div className="p-5"><ResponsiveContainer width="100%" height={250}><BarChart data={mockData.deviceUsage} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", fontSize: "13px" }} /><Bar dataKey="total" fill="#e2e8f0" radius={[4,4,0,0]} name="总拥有" /><Bar dataKey="inUse" fill="#10b981" radius={[4,4,0,0]} name="在用量" /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800">设备类型分布</h3></div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={210}><PieChart><Pie data={mockData.deviceTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">{mockData.deviceTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">{mockData.deviceTypes.slice(0,6).map((item, i) => <div key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-500 truncate">{item.name}</span><span className="text-slate-800 font-medium ml-auto">{item.value}</span></div>)}</div>
              </div>
            </div>
          </div>

          {/* Row3: Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 校企合作 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div><div><h4 className="text-sm font-semibold text-slate-800">校企合作</h4><p className="text-xs text-slate-500">23家本地民企</p></div></div>
              <div className="flex flex-wrap gap-1.5">{mockData.enterprises.slice(0,4).map(e => <span key={e.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{e.name}</span>)}<span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">+18家</span></div>
              <p className="text-xs text-slate-400 mt-2">缺研发的中小企业 → 学生的真项目</p>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">5个真实合作项目 →</div>
            </div>
            {/* 双创孵化 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-400">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Rocket className="w-5 h-5 text-white" /></div><div><h4 className="text-sm font-semibold text-slate-800">双创孵化器</h4><p className="text-xs text-slate-500">{mockData.stats.incubatingProjects}个项目在孵</p></div></div>
              <div className="space-y-2">{mockData.incubator.projects.slice(0,3).map(p => <div key={p.id} className="flex items-center justify-between text-xs"><span className="text-slate-600 truncate">{p.team}·{p.name}</span><span className={`font-semibold ${p.stage === "推向市场" ? "text-green-600" : p.stage === "样机测试" ? "text-amber-600" : "text-blue-600"}`}>{p.stage}</span></div>)}</div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">已拨孵化资金 ¥{mockData.incubator.totalFunding.toLocaleString()} →</div>
            </div>
            {/* 技能竞赛 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center"><Trophy className="w-5 h-5 text-white" /></div><div><h4 className="text-sm font-semibold text-slate-800">技能竞赛</h4><p className="text-xs text-slate-500">3场备赛中</p></div></div>
              <div className="space-y-2">{mockData.competitions.map(c => <div key={c.id} className="flex items-center gap-2 text-xs"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.level === "省级" ? "bg-red-50 text-red-600" : c.level === "市级" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>{c.level}</span><span className="text-slate-600 truncate">{c.subTitle}</span></div>)}</div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">查看竞赛详情 →</div>
            </div>
            {/* 实习就业 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div><div><h4 className="text-sm font-semibold text-slate-800">实习就业</h4><p className="text-xs text-slate-500">就业率 {mockData.stats.employmentRate}%</p></div></div>
              <div className="text-2xl font-bold text-slate-800 mb-1">¥{mockData.employmentStats.avgSalary.toLocaleString()}<span className="text-xs text-slate-500 font-normal ml-1">本地起薪/月</span></div>
              <p className="text-xs text-slate-500">55% 本地 · 5% 创业 · 10% 升学</p>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">查看就业报告 →</div>
            </div>
          </div>

          {/* Row4: Equipment List + Today Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Wrench className="w-4.5 h-4.5 text-orange-500" />实训设备清单</h3><span className="text-xs text-slate-500"><span className="font-semibold text-green-600">{mockData.equipment.reduce((s, e) => s + e.available, 0)}</span> 台可用 / {mockData.stats.totalDevices} 台</span></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50"><tr>{["设备名称","型号","总数","可用","使用中","状态","所在实验室"].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead><tbody>{mockData.equipment.map(eq => <tr key={eq.id} className="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors"><td className="px-4 py-3 text-sm font-medium text-slate-800">{eq.name}</td><td className="px-4 py-3 text-xs text-slate-500">{eq.model}</td><td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">{eq.total}</td><td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{eq.available}</td><td className="px-4 py-3 text-sm text-center text-orange-600 font-medium">{eq.inUse}</td><td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(eq.status)}`}>{eq.status}</span></td><td className="px-4 py-3 text-xs text-slate-500">{eq.lab}</td></tr>)}</tbody></table></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Clock className="w-4.5 h-4.5 text-emerald-500" />今日实训课表</h3></div>
              <div className="p-5"><div className="space-y-4">{mockData.todaySchedule.map((item, idx) => <div key={idx} className="flex gap-3"><div className="flex flex-col items-center"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{item.time}</span>{idx < mockData.todaySchedule.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}</div><div className="flex-1 pb-1"><div className="bg-slate-50 rounded-lg p-3 border border-slate-200"><p className="text-sm font-medium text-slate-800">{item.title}</p><div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500"><span>📍 {item.room}</span><span>👤 {item.teacher}</span></div><div className="flex items-center gap-2 mt-1.5"><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.type === "嵌入式" ? "bg-purple-50 text-purple-600" : item.type === "电工" ? "bg-blue-50 text-blue-600" : item.type === "PLC" ? "bg-orange-50 text-orange-600" : "bg-amber-50 text-amber-600"}`}>{item.type}</span><span className="text-xs text-slate-400">{item.class}</span></div></div></div></div>)}</div></div>
            </div>
          </div>

          {/* Row5: Teachers + Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><UserCheck className="w-4.5 h-4.5 text-blue-500" />教师团队</h3><span className="text-xs text-slate-500">{mockData.stats.activeTeachers} 人</span></div>
              <div className="p-5"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{mockData.teacherTeam.map((t, i) => <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"><div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>{t.avatar}</div><div className="min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-800">{t.name}</p><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${t.status === "上课中" ? "bg-blue-50 text-blue-600" : t.status === "每周1天驻校" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{t.status}</span></div><p className="text-xs text-slate-500 mt-0.5">{t.role} · {t.bio}</p><div className="flex flex-wrap gap-1 mt-2">{t.skills.map(s => <span key={s} className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">{s}</span>)}</div></div></div>)}</div></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800">近期动态</h3><button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">查看全部</button></div>
              <div className="p-5"><div className="space-y-3">{mockData.recentActivities.map(a => <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"><div className="text-xl flex-shrink-0">{a.icon}</div><div className="min-w-0 flex-1"><p className="text-xs text-slate-700 leading-relaxed">{a.text}</p><p className="text-xs text-slate-400 mt-1">{a.time}</p></div></div>)}</div></div>
            </div>
          </div>

          {/* Row6: Cooperations + Incubator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 校企真实项目 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Building2 className="w-4.5 h-4.5 text-blue-500" />校企真实项目</h3><span className="text-xs text-slate-500">5个进行中</span></div>
              <div className="p-5 space-y-4">{mockData.cooperationProjects.map(p => <div key={p.id} className="p-4 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors"><div className="flex items-start justify-between mb-2"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{p.name}</p><p className="text-xs text-slate-500 mt-0.5">{p.enterprise} · 👥 {p.students}名学生在做</p></div><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${p.stage === "现场试运行" ? "bg-green-50 text-green-600" : p.stage === "样机调试" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{p.stage}</span></div><div className="bg-red-50 rounded-lg p-2.5 mb-2"><p className="text-xs text-red-600"><span className="font-semibold">企业痛点：</span>{p.painPoint}</p></div><div className="bg-emerald-50 rounded-lg p-2.5 mb-2"><p className="text-xs text-emerald-700"><span className="font-semibold">合作价值：</span>{p.value}</p></div><div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-bold text-slate-600">{p.progress}%</span></div></div>)}</div>
            </div>
            {/* 双创孵化器 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Rocket className="w-4.5 h-4.5 text-amber-500" />学生双创孵化器</h3><span className="text-xs text-amber-600 font-medium">已拨 ¥{mockData.incubator.totalFunding.toLocaleString()}</span></div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-2 mb-5">{mockData.incubator.stages.map(s => <div key={s.name} className="text-center p-2 rounded-lg bg-slate-50"><div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div><div className="text-xs text-slate-500">{s.name}</div></div>)}</div>
                <div className="space-y-3">{mockData.incubator.projects.map(p => <div key={p.id} className="p-3 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors"><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{p.avatar}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-800">{p.name}</p><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.stage === "推向市场" ? "bg-green-50 text-green-600" : p.stage === "样机测试" ? "bg-amber-50 text-amber-600" : p.stage === "原型开发" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{p.stage}</span></div><p className="text-xs text-slate-500 mt-0.5">{p.team} · {p.leader}({p.className}) · {p.members}人</p><p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.desc}</p><div className="flex items-center gap-3 mt-2"><span className="text-xs text-slate-400">导师: {p.mentor}</span>{p.funding > 0 && <span className="text-xs text-amber-600 font-semibold">已拨 ¥{p.funding.toLocaleString()}</span>}</div><div className="flex items-center gap-2 mt-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-bold text-slate-600">{p.progress}%</span></div></div></div></div>)}</div>
              </div>
            </div>
          </div>

          {/* Row7: Consumables */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div className="flex items-center gap-3"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><ShoppingBag className="w-4.5 h-4.5 text-amber-500" />实训耗材管理</h3><span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{mockData.consumables.lowStockCount}项库存紧张</span></div><button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Plus className="w-3.5 h-3.5" />新增申购</button></div>
            <div className="grid grid-cols-4 gap-4 p-5 border-b border-slate-100">{[{ v: mockData.consumables.totalItems, l: "耗材种类" },{ v: mockData.consumables.lowStockCount, l: "库存预警", c: "text-red-600" },{ v: mockData.consumables.borrowRecords.filter(r => r.status === "使用中").length, l: "在借记录", c: "text-blue-600" },{ v: mockData.consumables.purchaseRequests.filter(r => r.status === "待审批").length, l: "待审批申购", c: "text-amber-600" }].map((k, i) => <div key={i} className="text-center"><div className={`text-2xl font-bold ${k.c || "text-slate-800"}`}>{k.v}</div><div className="text-xs text-slate-500 mt-1">{k.l}</div></div>)}</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <div className="lg:col-span-2 p-5 border-r border-slate-100"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50"><tr>{["物品名称","规格","库存","安全库存","状态"].map(h => <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead><tbody>{mockData.consumables.inventory.map(item => <tr key={item.id} className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${item.status === "紧缺" ? "bg-amber-50/30" : ""}`}><td className="px-3 py-2.5 text-sm font-medium text-slate-800">{item.name}</td><td className="px-3 py-2.5 text-xs text-slate-500">{item.spec}</td><td className={`px-3 py-2.5 text-sm text-center font-semibold ${item.stock < item.safetyStock ? "text-red-600" : "text-slate-800"}`}>{item.stock}{item.unit}</td><td className="px-3 py-2.5 text-sm text-center text-slate-500">{item.safetyStock}{item.unit}</td><td className="px-3 py-2.5 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>{item.status}</span></td></tr>)}</tbody></table></div></div>
              <div className="p-5 space-y-5">
                <div><h4 className="text-sm font-semibold text-slate-800 mb-3">最近领用记录</h4><div className="space-y-2.5">{mockData.consumables.borrowRecords.map(r => <div key={r.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{r.avatar}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="text-xs font-semibold text-slate-800">{r.borrower}</span><span className="text-xs text-slate-400">{r.role === "教师" ? r.role : r.class}</span></div><p className="text-xs text-slate-500 mt-0.5 truncate">{r.items} · {r.purpose}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs text-slate-400">{r.date}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span></div></div></div>)}</div></div>
                <div><h4 className="text-sm font-semibold text-slate-800 mb-3">申购审批</h4><div className="space-y-2">{mockData.consumables.purchaseRequests.map(req => <div key={req.id} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-800">{req.item}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${approvalColor(req.status)}`}>{req.status}</span></div><div className="flex items-center gap-3 mt-1.5 text-xs"><span className="text-slate-500">x{req.quantity}</span><span className="text-emerald-600 font-semibold">¥{req.cost}</span><span className="text-slate-400">{req.requester}</span></div><p className="text-xs text-slate-400 mt-0.5 truncate">原因：{req.reason}</p></div>)}</div><div className="mt-3 p-2.5 bg-emerald-50 rounded-lg flex items-center justify-between"><span className="text-xs text-emerald-700 font-medium">申购总金额</span><span className="text-sm font-bold text-emerald-700">¥{mockData.consumables.purchaseRequests.reduce((s, r) => s + r.cost, 0).toLocaleString()}</span></div></div>
              </div>
            </div>
          </div>

          {/* Row8: Competitions + Employment + Academic + Budget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 技能竞赛 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Trophy className="w-4.5 h-4.5 text-red-500" />技能竞赛</h3><span className="text-xs text-red-600 font-medium">3场备赛</span></div>
              <div className="p-5 space-y-3">{mockData.competitions.map(c => <div key={c.id} className="p-3 rounded-lg border border-slate-100 hover:border-purple-200 transition-colors"><div className="flex items-start justify-between mb-1.5"><p className="text-sm font-semibold text-slate-800">{c.name}</p><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${c.level === "省级" ? "bg-red-50 text-red-600" : c.level === "市级" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>{c.level}</span></div><p className="text-xs text-slate-500 mb-2">{c.subTitle}</p><div className="grid grid-cols-2 gap-1.5 text-xs"><div className="flex items-center gap-1 text-slate-500"><Users className="w-3 h-3" />{c.students}人</div><div className="flex items-center gap-1 text-slate-500"><UserCheck className="w-3 h-3" />教练：{c.coach}</div><div className="flex items-center gap-1 text-slate-500"><Calendar className="w-3 h-3" />{c.date}</div><div className="flex items-center gap-1 text-slate-500"><Trophy className="w-3 h-3" />{c.awards}</div></div><div className="mt-2 pt-2 border-t border-slate-50"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "集训中" ? "bg-red-50 text-red-600" : c.status === "备赛中" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{c.status}</span></div></div>)}</div>
            </div>
            {/* 就业统计 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Briefcase className="w-4.5 h-4.5 text-green-500" />就业去向分布</h3></div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={mockData.employmentStats.destinations.map((d, i) => ({ ...d, color: COLORS[i] }))} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">{mockData.employmentStats.destinations.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                <div className="text-center mb-3"><div className="text-xs text-slate-500 mt-2">近三年就业率</div><div className="flex items-center justify-center gap-2 mt-1">{["2023", "2024", "2025"].map((y, i) => <span key={y} className="text-xs font-bold text-green-600">{[mockData.employmentStats.rate2023, mockData.employmentStats.rate2024, mockData.employmentStats.rate2025][i]}%{i < 2 ? " →" : ""}</span>)}</div></div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">主要去向</div>
                {mockData.employmentStats.topEnterprises.map((e, i) => <div key={i} className="flex items-center justify-between text-xs py-0.5"><span className="text-slate-600">{e.name}</span><span className="text-slate-400">{e.note}</span><span className="text-slate-800 font-medium w-8 text-right">{e.hires}人</span></div>)}
              </div>
            </div>
            {/* STEM教务管理 + 实训室排课 + 经费 */}
            <div className="space-y-6">
              {/* STEM教务管理 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><BookOpen className="w-4.5 h-4.5 text-blue-500" />STEM 教务管理</h3><p className="text-xs text-slate-400 mt-0.5">仅管理STEM实训课程 · 不含文化课与学籍管理</p><p className="text-xs text-slate-500 mt-0.5">{mockData.academic.currentSemester} · {mockData.academic.totalClasses}个实训班 · 周课时{mockData.academic.weeklySessions}节</p></div>
                <div className="p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">STEM 实训课程排布</h4>
                  {mockData.academic.courses.map((co, i) => {
                    const sessionText = co.sessions + '节/周';
                    return (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-800 font-medium truncate">{co.name}</p>
                          <p className="text-slate-400">{co.grade} · {co.teacher} · {co.room}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-slate-600">{co.students}人</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400">{sessionText}</span>
                            <span className="text-xs px-1 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">实训{co.labHours}节</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 实训室排课统计 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Wrench className="w-4.5 h-4.5 text-orange-500" />实训室排课统计</h3></div>
                <div className="p-5 space-y-3">
                  {mockData.academic.labSchedule.map((lab, i) => {
                    const slotText = lab.usedSlots + '/' + lab.weeklySlots + '节';
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">{lab.lab}</span>
                          <span className="text-slate-400">{lab.note}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-orange-500" style={{ width: lab.utilization + '%' }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-8 text-right">{lab.utilization}%</span>
                        </div>
                        <span className="text-xs text-slate-400 w-16 text-right">{slotText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 教师工作量 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><UserCheck className="w-4.5 h-4.5 text-purple-500" />STEM教师工作量</h3></div>
                <div className="p-5 space-y-2">
                  {mockData.academic.teacherWorkload.map((w, i) => <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50"><span className="text-slate-700 font-medium">{w.name}</span><span className="text-slate-400">{w.courses}门课 · {w.classes}</span><span className="text-slate-600 font-medium">{w.weeklyHours + '节/周'}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${workloadColor(w.load)}`}>{w.load}</span></div>)}
                </div>
              </div>
              {/* 年度经费 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-200"><h3 className="text-base font-semibold text-slate-800">年度经费概览</h3></div>
                <div className="p-5">
                  <div className="text-center mb-4"><div className="text-3xl font-bold text-slate-800">¥{(mockData.budgetOverview.annual / 10000).toFixed(0)}万</div><div className="text-xs text-slate-500 mt-1">年度总预算</div></div>
                  <div className="space-y-2.5">{mockData.budgetOverview.items.map((item, i) => <div key={i} className="space-y-1"><div className="flex items-center justify-between text-xs"><span className="text-slate-600">{item.name}</span><span className="text-slate-800 font-semibold">¥{(item.amount / 10000).toFixed(1)}万</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${item.percentage}%` }} /></div></div>)}</div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs"><span className="text-slate-500">已支出 <span className="font-semibold text-slate-700">¥{(mockData.budgetOverview.spent / 10000).toFixed(0)}万</span></span><span className="text-emerald-600 font-semibold">剩余 ¥{(mockData.budgetOverview.remaining / 10000).toFixed(1)}万</span></div>
                </div>
              </div>
            </div>
          </div>

        </main>

        {/* Floating Demo Info */}
        <div className="fixed bottom-6 right-6 max-w-sm p-5 bg-white border border-slate-200 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-3"><span className="text-lg">🏭</span><h4 className="text-sm font-bold text-slate-800">演示账号信息</h4></div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">实训主任</span><code className="text-emerald-600 font-mono">liu_director / demo123456</code></div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">任课教师</span><code className="text-emerald-600 font-mono">zhang_teacher / demo123456</code></div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-600">学生账号</span><code className="text-emerald-600 font-mono">student_001 / demo123456</code></div>
          </div>
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"><div className="flex items-center gap-2 text-xs text-orange-700"><AlertCircle className="w-4 h-4" /><span className="font-medium">只读模式，无法修改数据</span></div></div>
        </div>
      </div>
    </div>
  );
}
