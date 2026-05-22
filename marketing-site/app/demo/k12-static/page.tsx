"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Users,
  Cpu,
  Trophy,
  LayoutDashboard,
  Calendar,
  Settings,
  GraduationCap,
  UserCheck,
  BarChart3,
  Bell,
  AlertCircle,
  TrendingUp,
  Wrench,
  FileText,
  Clock,
  ClipboardCheck,
  Radio,
  Package,
  Heart,
  MessageCircle,
  Eye,
  Star,
  Send,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  ShoppingBag,
  Plus,
} from "lucide-react";
import {
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

// ====== 梅山县第二中学 —— 五六线县城中学科创社团 ======
// STEM教育在这里以第二课堂、兴趣班、学生社团的形式开展
// 2023年政府拨款建起全县唯一一间创客活动室，41台设备，6位指导教师（多数为学科教师兼任）
// 186名学生因热爱而来，在课后追逐科创梦想，屡获市级奖项
const mockData = {
  institution: {
    name: "梅山二中",
    fullName: "梅山县第二中学",
    type: "k12",
    location: "河洛省·梅山县",
    clubCount: "3个社团",
    clubNames: "机器人社 · Arduino创客社 · 编程兴趣班",
    labSize: "1间活动室（60㎡）",
    labFunding: "县政府科创教育专项资金 ¥12万",
    note: "全县唯一中学科创社团基地",
  },
  user: {
    name: "张永志",
    role: "科创社团指导老师",
    subRole: "信息技术教师 · Arduino创客社负责人",
    avatar: "张",
    yearsTeaching: 18,
    bio: "原数学教师，2018年自学 Arduino 后在校发起第一个编程兴趣班。六年过去，带出了3个社团、186个孩子。",
  },
  // 真实反映资源匮乏：设备少、教师兼职、获奖以市/区级为主
  stats: {
    totalStudents: 186,
    studentChange: 12.0,
    studentNote: "来自3个社团",
    totalTeachers: 6,
    teacherChange: 0,
    teacherNote: "专职2人 + 兼职4人",
    totalDevices: 41,
    deviceChange: 14.0,
    completedProjects: 12,
    projectChange: 33.3,
    competitionAwards: 7,
    awardBreakdown: "市级2项 · 区级5项",
  },
  // 设备使用率全年都很高——设备太少，社团活动抢着用
  deviceUsage: [
    { month: "11月", inUse: 29, total: 41 },
    { month: "12月", inUse: 31, total: 41 },
    { month: "1月", inUse: 26, total: 41 },
    { month: "2月", inUse: 24, total: 41 },
    { month: "3月", inUse: 35, total: 41 },
    { month: "4月", inUse: 38, total: 41 }, // 赛前集训，满负荷
  ],
  deviceTypes: [
    { name: "Arduino Uno", value: 15, color: "#10b981" },
    { name: "Micro:bit", value: 20, color: "#3b82f6" },
    { name: "Raspberry Pi", value: 5, color: "#f59e0b" },
    { name: "3D打印机", value: 1, color: "#8b5cf6" },
  ],
  // 社团项目都很接地气——解决身边问题
  projects: [
    { name: "校园智能灌溉系统", students: 6, progress: 75, stage: "测试调试", category: "Arduino社" },
    { name: "教室灯光节能控制", students: 4, progress: 90, stage: "成果展示", category: "Arduino社" },
    { name: "简易气象数据采集站", students: 5, progress: 55, stage: "编码实现", category: "机器人社" },
    { name: "食堂厨余分类提醒器", students: 3, progress: 40, stage: "原型设计", category: "编程兴趣班" },
  ],
  // 真实赛事——市/区级为主，社团成员组队参加
  competitions: [
    { name: "全市青少年科技创新大赛", level: "市级", status: "备赛中", students: 8, date: "2026-06-20" },
    { name: "梅山县创客马拉松", level: "区级", status: "已报名", students: 12, date: "2026-05-30" },
    { name: "全市中小学生机器人挑战赛", level: "市级", status: "报名中", students: 6, date: "2026-07-10" },
  ],
  // 社团活动全在课后——只有一间活动室，各社团轮流使用
  todaySchedule: [
    { time: "16:00-17:30", title: "Arduino创客社·LED流水灯", room: "创客活动室", teacher: "张老师", grade: "初一成员", type: "硬件" },
    { time: "16:00-17:30", title: "编程兴趣班·Micro:bit传感器", room: "机房", teacher: "刘老师", grade: "初二成员", type: "编程" },
    { time: "17:00-18:30", title: "机器人社·智能小车集训", room: "创客活动室", teacher: "张老师", grade: "竞赛组", type: "综合" },
  ],
  devices: [
    { name: "Arduino Uno R3", total: 15, available: 5, borrowing: 10, source: "政府拨款" },
    { name: "Micro:bit v2", total: 20, available: 8, borrowing: 12, source: "企业捐赠" },
    { name: "Raspberry Pi 4B", total: 5, available: 2, borrowing: 3, source: "教师自筹" },
    { name: "3D打印机(教育版)", total: 1, available: 1, borrowing: 0, source: "教育局配发" },
  ],
  teacherTeam: [
    { name: "张老师", skills: ["Arduino", "C++", "机器人"], status: "在线", role: "Arduino创客社" },
    { name: "刘老师", skills: ["Micro:bit", "Scratch"], status: "在线", role: "编程兴趣班" },
    { name: "陈老师", skills: ["3D建模", "Python"], status: "上课中", role: "机器人社(数学组兼)" },
    { name: "王老师", skills: ["电子电路", "焊接"], status: "离线", role: "Arduino社(物理组兼)" },
    { name: "李老师", skills: ["图形化编程"], status: "在线", role: "编程兴趣班(科学组兼)" },
    { name: "赵老师", skills: ["竞赛指导"], status: "离线", role: "竞赛辅导(年级组长兼)" },
  ],
  recentActivities: [
    { id: 1, icon: "🎉", text: "Arduino创客社《教室灯光节能控制》获市科创大赛二等奖！晋级省赛", time: "2天前", type: "社团" },
    { id: 2, icon: "📦", text: "社团器材申请获批——新学期将新增 Arduino 套件10套", time: "5天前", type: "设备" },
    { id: 3, icon: "🏆", text: "机器人社李同学团队获梅山县创客马拉松一等奖", time: "1周前", type: "社团" },
    { id: 4, icon: "👨‍🏫", text: "张老师赴省城参加STEM教师研修（3天）——学校唯一名额", time: "2周前", type: "培训" },
    { id: 5, icon: "📋", text: "新学期社团招新：已收到63份申请，仅有40个名额", time: "3周前", type: "招新" },
    { id: 6, icon: "🔧", text: "Raspberry Pi #003 SD卡损坏——送修周期预计2周", time: "1月前", type: "维护" },
  ],
  // 社团经费紧张——每分钱都算着花
  budgetOverview: {
    annual: 15000,
    spent: 11800,
    remaining: 3200,
    items: [
      { name: "元器件耗材", spent: 4800, color: "#10b981" },
      { name: "3D打印耗材", spent: 3200, color: "#3b82f6" },
      { name: "设备维修", spent: 2300, color: "#f59e0b" },
      { name: "外出参赛", spent: 1500, color: "#8b5cf6" },
    ],
  },
  // 社团作品墙 —— 学生展示和交流的社区空间
  featuredWorks: [
    {
      id: 1,
      title: "教室灯光节能控制系统",
      author: "李铭轩",
      authorAvatar: "李",
      club: "Arduino创客社",
      grade: "初二(3)班",
      description: "利用光照传感器+人体红外模块，实现教室无人自动熄灯。已在本校3间教室试运行，月省电约12%。",
      coverIcon: "💡",
      coverColor: "from-amber-400 to-orange-500",
      likes: 47,
      comments: 12,
      views: 236,
      featured: true,
      tags: ["Arduino", "节能", "市赛二等奖"],
      time: "3天前",
    },
    {
      id: 2,
      title: "智能盆栽自动浇水器",
      author: "王小雨",
      authorAvatar: "王",
      club: "机器人社",
      grade: "初一(5)班",
      description: "土壤湿度传感器+水泵模块，假期再也不用担心教室绿植干死了。支持手动/自动双模式。",
      coverIcon: "🌱",
      coverColor: "from-emerald-400 to-green-600",
      likes: 35,
      comments: 8,
      views: 189,
      featured: true,
      tags: ["Micro:bit", "环保", "校创客节最佳"],
      time: "1周前",
    },
    {
      id: 3,
      title: "超声波测距避障小车",
      author: "陈浩然",
      authorAvatar: "陈",
      club: "机器人社",
      grade: "初二(1)班",
      description: "基于Arduino的超声波避障小车，可自主探测前方障碍并调整方向。竞赛集训作品。",
      coverIcon: "🚗",
      coverColor: "from-blue-400 to-indigo-600",
      likes: 52,
      comments: 15,
      views: 310,
      featured: true,
      tags: ["Arduino", "机器人", "竞赛作品"],
      time: "2天前",
    },
  ],
  studentWorks: [
    {
      id: 4,
      title: "食堂温湿度监测小装置",
      author: "刘思远",
      authorAvatar: "刘",
      club: "编程兴趣班",
      grade: "初一(4)班",
      description: "DHT11传感器+Micro:bit，实时显示食堂后厨温湿度，保障食品安全。",
      coverIcon: "🌡️",
      coverColor: "from-rose-400 to-pink-600",
      likes: 18,
      comments: 3,
      views: 87,
      tags: ["Micro:bit", "传感器"],
      time: "5天前",
    },
    {
      id: 5,
      title: "Scratch成语接龙小游戏",
      author: "赵雨桐",
      authorAvatar: "赵",
      club: "编程兴趣班",
      grade: "初一(2)班",
      description: "用Scratch做了个成语接龙游戏，内置300+成语库，还带语音播报，语文老师都说好！",
      coverIcon: "🎮",
      coverColor: "from-purple-400 to-violet-600",
      likes: 29,
      comments: 6,
      views: 152,
      tags: ["Scratch", "游戏", "语文融合"],
      time: "1周前",
    },
    {
      id: 6,
      title: "校园噪声地图",
      author: "孙晓宇",
      authorAvatar: "孙",
      club: "Arduino创客社",
      grade: "初二(2)班",
      description: "用声音传感器采集校园各区域噪声数据，生成可视化噪声热力图，帮学校找出最吵的地方。",
      coverIcon: "🔊",
      coverColor: "from-cyan-400 to-blue-600",
      likes: 41,
      comments: 9,
      views: 198,
      tags: ["Arduino", "数据分析", "校园"],
      time: "4天前",
    },
    {
      id: 7,
      title: "电子生日贺卡",
      author: "周瑾萱",
      authorAvatar: "周",
      club: "编程兴趣班",
      grade: "初一(3)班",
      description: "Micro:bit LED点阵屏滚动显示生日祝福，按下按钮还会播放《生日快乐》旋律。",
      coverIcon: "🎂",
      coverColor: "from-pink-400 to-rose-500",
      likes: 22,
      comments: 4,
      views: 103,
      tags: ["Micro:bit", "创意"],
      time: "6天前",
    },
    {
      id: 8,
      title: "3D打印文具收纳盒",
      author: "吴子涵",
      authorAvatar: "吴",
      club: "Arduino创客社",
      grade: "初二(4)班",
      description: "用Tinkercad自主设计+3D打印的多格文具盒，带笔槽和橡皮位，比买的还实用！",
      coverIcon: "📐",
      coverColor: "from-teal-400 to-cyan-600",
      likes: 38,
      comments: 11,
      views: 267,
      tags: ["3D打印", "设计"],
      time: "3天前",
    },
    {
      id: 9,
      title: "简易电子琴",
      author: "郑嘉豪",
      authorAvatar: "郑",
      club: "机器人社",
      grade: "初一(6)班",
      description: "7个按钮+蜂鸣器组成简易电子琴，能弹 Do Re Mi，音乐课上也拿来玩。",
      coverIcon: "🎹",
      coverColor: "from-yellow-400 to-orange-600",
      likes: 15,
      comments: 2,
      views: 64,
      tags: ["Arduino", "音乐"],
      time: "1周前",
    },
  ],
  // 教具管理 —— 元器件、耗材、工具的库存与流转
  teachingAids: {
    totalItems: 47,
    lowStockCount: 5,
    inventory: [
      { id: 1, name: "LED发光二极管(红)", category: "电子元器件", stock: 80, safetyStock: 30, unit: "个", status: "充足" },
      { id: 2, name: "面包板(830孔)", category: "电子元器件", stock: 15, safetyStock: 10, unit: "块", status: "正常" },
      { id: 3, name: "杜邦线(公母各半)", category: "电子元器件", stock: 8, safetyStock: 15, unit: "捆", status: "紧缺" },
      { id: 4, name: "电阻套装(10Ω~1MΩ)", category: "电子元器件", stock: 6, safetyStock: 8, unit: "套", status: "紧缺" },
      { id: 5, name: "光敏电阻传感器", category: "电子元器件", stock: 22, safetyStock: 10, unit: "个", status: "正常" },
      { id: 6, name: "超声波测距模块HC-SR04", category: "电子元器件", stock: 4, safetyStock: 6, unit: "个", status: "紧缺" },
      { id: 7, name: "3D打印PLA丝材(1kg)", category: "耗材", stock: 2, safetyStock: 3, unit: "卷", status: "紧缺" },
      { id: 8, name: "焊锡丝(0.8mm)", category: "耗材", stock: 3, safetyStock: 2, unit: "卷", status: "正常" },
      { id: 9, name: "9V电池", category: "耗材", stock: 25, safetyStock: 10, unit: "节", status: "充足" },
      { id: 10, name: "热熔胶棒", category: "耗材", stock: 40, safetyStock: 15, unit: "根", status: "充足" },
      { id: 11, name: "电烙铁(60W调温)", category: "通用工具", stock: 4, safetyStock: 4, unit: "把", status: "正常" },
      { id: 12, name: "万用表(数字)", category: "通用工具", stock: 3, safetyStock: 3, unit: "台", status: "正常" },
    ],
    borrowRecords: [
      { id: 1, borrower: "刘老师", item: "超声波模块 x2", purpose: "编程兴趣班课堂演示", date: "今天 15:30", status: "使用中", statusColor: "blue" },
      { id: 2, borrower: "李铭轩(社员)", item: "LED+电阻套装", purpose: "灯光节能项目调试", date: "昨天 17:00", status: "已归还", statusColor: "emerald" },
      { id: 3, borrower: "王小雨(社员)", item: "杜邦线 x1捆", purpose: "智能浇水器接线", date: "2天前", status: "已归还", statusColor: "emerald" },
      { id: 4, borrower: "陈老师", item: "PLA丝材 x1卷", purpose: "3D打印社团展示模型", date: "3天前", status: "使用中", statusColor: "blue" },
      { id: 5, borrower: "张老师", item: "电烙铁 x1把", purpose: "设备维修焊接", date: "1周前", status: "已归还", statusColor: "emerald" },
    ],
    purchaseRequests: [
      { id: 1, item: "Arduino传感器套件(37合1)", quantity: "3套", estimatedCost: 480, requestedBy: "张老师", reason: "现有传感器种类不足，影响项目多样性", date: "5天前", status: "待审批", statusColor: "amber" },
      { id: 2, item: "Micro:bit v2扩展板", quantity: "10个", estimatedCost: 350, requestedBy: "刘老师", reason: "配合Micro:bit使用，拓展IO接口", date: "3天前", status: "审批通过", statusColor: "emerald" },
      { id: 3, item: "3D打印PLA丝材(多色)", quantity: "5卷", estimatedCost: 400, requestedBy: "陈老师", reason: "现有丝材不足，3D打印活动频繁", date: "1周前", status: "待审批", statusColor: "amber" },
      { id: 4, item: "杜邦线(补充)", quantity: "5捆", estimatedCost: 150, requestedBy: "张老师", reason: "库存告急，社团活动频繁消耗快", date: "1天前", status: "待审批", statusColor: "amber" },
    ],
  },
};

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "社团总览", badge: null },
  { id: "community", icon: Heart, label: "作品社区", badge: "9件作品" },
  { id: "clubs", icon: Users, label: "社团管理", badge: "3个社团" },
  { id: "devices", icon: Wrench, label: "器材管理", badge: "41台·紧缺" },
  { id: "aids", icon: ShoppingBag, label: "教具管理", badge: "5项预警" },
  { id: "projects", icon: FileText, label: "社团项目", badge: "12个在读" },
  { id: "competitions", icon: Trophy, label: "竞赛管理", badge: "3场备赛" },
  { id: "schedule", icon: Calendar, label: "活动排期", badge: "仅1间活动室" },
  { id: "students", icon: Users, label: "社员管理", badge: "186人" },
  { id: "teachers", icon: UserCheck, label: "指导教师", badge: "6人" },
  { id: "reports", icon: BarChart3, label: "学期报告", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];

export default function DemoK12Static() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");

  const scrollToSection = (id: string) => {
    setActiveMenu(id);
    const el = document.getElementById(`section-${id}`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };

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
            <div className="w-20 h-20 border-4 border-emerald-500/30 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 mt-6 text-sm">正在加载演示环境...</p>
          <p className="text-slate-600 text-xs mt-2">{mockData.institution.fullName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ====== 深色侧边栏 ====== */}
      <aside className="w-60 bg-slate-900 flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">{mockData.institution.name}</h1>
              <p className="text-xs text-slate-500">科创社团管理</p>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-emerald-500/30">
              {mockData.user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{mockData.user.name}</p>
              <p className="text-xs text-slate-400">{mockData.user.role}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 truncate">{mockData.user.subRole}</p>
            </div>
          </div>
          {/* 社团信息摘要 */}
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-600">📍 </span>
              <span className="text-slate-500">{mockData.institution.location}</span>
            </div>
            <div>
              <span className="text-slate-600">🏷️ </span>
              <span className="text-slate-500">{mockData.institution.clubCount}</span>
            </div>
            <div className="text-[10px] text-slate-600 leading-relaxed pl-1">
              {mockData.institution.clubNames}
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                activeMenu === item.id
                  ? "bg-emerald-600/20 text-emerald-400 font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                  activeMenu === item.id
                    ? "bg-emerald-600/30 text-emerald-300"
                    : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 底部链接 */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <div className="px-3 py-2 text-[10px] text-slate-600">
            {mockData.institution.note}
          </div>
          <Link
            href="/demo"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回Demo选择
          </Link>
        </div>
      </aside>

      {/* ====== 主内容区 ====== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
          <div className="px-6 py-3 flex items-center justify-between">
            {/* 左侧：仿设备状态 */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-400 font-mono">{currentTime || "00:00"}</span>
              </div>
              <div className="text-slate-600">{mockData.institution.fullName}</div>
              <div className="hidden sm:flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">设备在线 38/41</span>
              </div>
            </div>

            {/* 右侧：操作 */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-md text-[11px] font-semibold">
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

        {/* 页面内容 */}
        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* ====== 行1：核心KPI ====== */}
          <div id="section-dashboard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "社团成员", value: mockData.stats.totalStudents, unit: "人", icon: Users, color: "blue", trend: "+12%", trendUp: true, sub: "来自3个社团" },
              { label: "指导教师", value: mockData.stats.totalTeachers, unit: "人", icon: UserCheck, color: "purple", trend: null, trendUp: null, sub: "专职2人+兼职4人" },
              { label: "社团器材", value: mockData.stats.totalDevices, unit: "台", icon: Cpu, color: "emerald", trend: "+14%", trendUp: true, sub: "获批新增中" },
              { label: "竞赛获奖", value: mockData.stats.competitionAwards, unit: "项", icon: Trophy, color: "amber", trend: null, trendUp: null, sub: "市级2·区级5" },
            ].map((card, idx) => {
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                purple: "bg-purple-50 text-purple-600",
                emerald: "bg-emerald-50 text-emerald-600",
                amber: "bg-amber-50 text-amber-600",
              };
              return (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    {card.trend && card.trendUp === true && card.trend.startsWith("+") && (
                      <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        {card.trend}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-0.5">
                    {card.value}<span className="text-base font-normal text-slate-400 ml-1">{card.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {card.label}
                    {card.sub && <span className="ml-2 text-slate-400">({card.sub})</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ====== 行2：图表 ====== */}
          <div id="section-reports" className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {/* 设备使用趋势 */}
            <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">设备使用趋势</h3>
                  <p className="text-xs text-slate-400 mt-0.5">全年保持高利用率——设备少、需求大</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />使用中</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />总量</span>
                </div>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={mockData.deviceUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 45]} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontSize: "12px" }} />
                    <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="inUse" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-slate-400 mt-3 text-center">4月赛前集训期间全设备满负荷运转</p>
              </div>
            </div>

            {/* 设备来源 + 经费 */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* 设备类型 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">设备类型分布</h3>
                </div>
                <div className="p-5 flex items-center gap-4">
                  <div className="w-[120px] h-[120px]">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={mockData.deviceTypes} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value">
                          {mockData.deviceTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs">
                    {mockData.deviceTypes.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">{item.value}台</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-slate-100 text-slate-500 flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      共 {mockData.stats.totalDevices} 台
                    </div>
                  </div>
                </div>
              </div>

              {/* 年度经费 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">年度经费概览</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">总预算 ¥{(mockData.budgetOverview.annual / 10000).toFixed(1)}万</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mockData.budgetOverview.remaining > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                      剩余 ¥{mockData.budgetOverview.remaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${(mockData.budgetOverview.spent / mockData.budgetOverview.annual) * 100}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {mockData.budgetOverview.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="text-slate-500">¥{item.spent.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====== 行3：STEM特色功能模块 + 快捷操作 ====== */}
          <div id="section-clubs" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 功能模块卡片 */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-3">
              {[
                {
                  title: "社团活动排期",
                  desc: "3个社团共用1间活动室，课后分时段轮转，支持设备预约与安全准入",
                  icon: Calendar,
                  color: "emerald",
                  status: { text: "今日3场活动", color: "emerald" },
                },
                {
                  title: "社团项目管理",
                  desc: "12个社团项目，从创意到竞赛的完整追踪",
                  icon: FileText,
                  color: "blue",
                  status: { text: "12个进行中", color: "blue" },
                },
                {
                  title: "竞赛组织",
                  desc: "社团成员组队参赛、教师辅导排班、外出参赛审批",
                  icon: Trophy,
                  color: "amber",
                  status: { text: "3场备赛中", color: "amber" },
                },
                {
                  title: "社团器材台账",
                  desc: "41台设备来源追踪，社员借还登记，维修历史",
                  icon: Cpu,
                  color: "purple",
                  status: { text: "3台待维修", color: "red" },
                },
              ].map((module, idx) => {
                const statusColorMap: Record<string, string> = {
                  emerald: "bg-emerald-50 text-emerald-600",
                  blue: "bg-blue-50 text-blue-600",
                  amber: "bg-amber-50 text-amber-600",
                  red: "bg-red-50 text-red-600",
                  purple: "bg-purple-50 text-purple-600",
                };
                const colorMap: Record<string, string> = {
                  emerald: "bg-emerald-50 text-emerald-600",
                  blue: "bg-blue-50 text-blue-600",
                  amber: "bg-amber-50 text-amber-600",
                  purple: "bg-purple-50 text-purple-600",
                };
                return (
                  <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[module.color]}`}>
                        <module.icon className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColorMap[module.status.color]}`}>
                        {module.status.text}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{module.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{module.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* 快捷操作 + 资源 */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">快捷操作</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "器材借出", icon: Package },
                    { label: "社团活动签到", icon: ClipboardCheck },
                    { label: "项目立项", icon: FileText },
                    { label: "竞赛报名", icon: Trophy },
                    { label: "耗材申领", icon: Radio },
                    { label: "报修申请", icon: Wrench },
                  ].map((action, idx) => (
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
                  {[
                    { label: "Scratch入门课件（自编）", icon: "📘" },
                    { label: "Arduino基础实验手册", icon: "📗" },
                    { label: "往届竞赛获奖作品集", icon: "🏆" },
                    { label: "张老师的社团活动笔记", icon: "📝" },
                  ].map((resource, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-xs text-slate-600 cursor-pointer transition-all">
                      <span>{resource.icon}</span>
                      <span>{resource.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ====== 行4：设备清单 + 今日课表 ====== */}
          <div id="section-devices" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 设备库存清单 */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">社团器材清单</h3>
                  <p className="text-xs text-slate-400 mt-0.5">每台设备都是社团的宝贝</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate-500">设备名称</th>
                      <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">总量</th>
                      <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">可用</th>
                      <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">借出中</th>
                      <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">来源</th>
                      <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-slate-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockData.devices.map((device, idx) => {
                      const usagePercent = Math.round((device.borrowing / device.total) * 100);
                      const isLow = device.available <= 3 && device.total > 1;
                      const isCritical = device.available === 0;
                      return (
                        <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs font-medium text-slate-700">{device.name}</td>
                          <td className="px-5 py-3 text-xs text-slate-600 text-center">{device.total}</td>
                          <td className="px-5 py-3 text-xs text-emerald-600 font-semibold text-center">{device.available}</td>
                          <td className="px-5 py-3 text-xs text-amber-600 font-semibold text-center">{device.borrowing}</td>
                          <td className="px-5 py-3 text-[11px] text-slate-500 text-center">{device.source}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-medium ${
                                isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500"
                              }`}>
                                {usagePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 今日社团活动 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">今日社团活动</h3>
                <p className="text-xs text-slate-400 mt-0.5">课后时间 · 3个社团轮流使用活动室</p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {mockData.todaySchedule.map((item, idx) => {
                    const typeColorMap: Record<string, string> = {
                      "硬件": "border-l-emerald-500 bg-emerald-50/50",
                      "编程": "border-l-blue-500 bg-blue-50/50",
                      "综合": "border-l-amber-500 bg-amber-50/50",
                    };
                    return (
                      <div key={idx} className={`border-l-2 rounded-r-lg p-3 ${typeColorMap[item.type] || "border-l-emerald-500 bg-emerald-50/50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono text-slate-500">{item.time}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{item.grade}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">👨‍🏫 {item.teacher} · 📍{item.room}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>3个社团共用1间活动室，每个社团每周仅1次活动。如能扩容，可接纳更多学生报名。</span>
                </div>
              </div>
            </div>
          </div>

          {/* ====== 行5：教师团队 + 近期动态 ====== */}
          <div id="section-teachers" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 指导教师团队 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">社团指导教师</h3>
                  <span className="text-[10px] text-slate-400">6人 · 专2兼4</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {mockData.teacherTeam.map((teacher, idx) => {
                  const colorInit = teacher.name.charCodeAt(0) % 5;
                  const avatarColors = ["bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`w-9 h-9 ${avatarColors[colorInit]} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                        {teacher.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800">{teacher.name}</p>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            teacher.status === "在线" ? "bg-emerald-500" :
                            teacher.status === "上课中" ? "bg-amber-500" : "bg-slate-300"
                          }`} />
                          <span className="text-[10px] text-slate-500">{teacher.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{teacher.role}</p>
                        <div className="flex gap-1 mt-1.5">
                          {teacher.skills.map((skill, si) => (
                            <span key={si} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 pb-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700">
                  💡 Token计费让AI助教触手可及——师资薄弱地区的学生也能获得个性化学习指导。
                </div>
              </div>
            </div>

            {/* 近期动态 */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">近期动态</h3>
              </div>
              <div className="p-4 space-y-3">
                {mockData.recentActivities.map((activity) => {
                  const typeColors: Record<string, string> = {
                    "社团": "bg-emerald-50 text-emerald-600 border-emerald-200",
                    "竞赛": "bg-amber-50 text-amber-600 border-amber-200",
                    "设备": "bg-blue-50 text-blue-600 border-blue-200",
                    "培训": "bg-purple-50 text-purple-600 border-purple-200",
                    "招新": "bg-emerald-50 text-emerald-600 border-emerald-200",
                    "维护": "bg-red-50 text-red-600 border-red-200",
                  };
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="text-xl flex-shrink-0">{activity.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">{activity.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400">{activity.time}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${typeColors[activity.type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ====== 行6：在读项目 + 赛事倒计时 ====== */}
          <div id="section-projects" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 社团在读项目 */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">社团在读项目</h3>
                <span className="text-[11px] text-slate-500">{mockData.stats.completedProjects}个项目 · 完成率66%</span>
              </div>
              <div className="p-4 space-y-3">
                {mockData.projects.map((project, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xs font-semibold text-slate-800">{project.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{project.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span>👥 {project.students}人团队</span>
                        <span>📍 {project.stage}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-semibold text-slate-700">{project.progress}%</span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${project.progress >= 80 ? "bg-emerald-500" : project.progress >= 60 ? "bg-blue-500" : "bg-amber-500"}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 赛事倒计时 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">近期赛事</h3>
              </div>
              <div className="p-4 space-y-3">
                {mockData.competitions.map((comp, idx) => {
                  const statusColor: Record<string, string> = {
                    "备赛中": "bg-amber-50 text-amber-600 border-amber-200",
                    "已报名": "bg-blue-50 text-blue-600 border-blue-200",
                    "报名中": "bg-emerald-50 text-emerald-600 border-emerald-200",
                  };
                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-100 hover:border-amber-200 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-800 leading-snug">{comp.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${statusColor[comp.status] || ""}`}>
                          {comp.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">📅 {comp.date}</span>
                        <span className="text-slate-500">👥 {comp.students}人</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          comp.level === "市级" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {comp.level}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 pb-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700">
                  🏆 去年获市级二等奖1项、区级一等奖3项——县城学校的骄傲。
                </div>
              </div>
            </div>
          </div>

          {/* ====== 行7：社团作品社区 —— 学生展示&交流 ====== */}
          <div id="section-community" className="space-y-4">
            {/* 社区标题栏 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  社团作品墙
                </h2>
                <p className="text-xs text-slate-500 mt-1">同学们的作品展示和互动社区，每个作品背后都是一个孩子的奇思妙想</p>
              </div>
              <Link
                href="/demo/k12"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                发布作品
              </Link>
            </div>

            {/* 精选作品（置顶） */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockData.featuredWorks.map((work) => (
                <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
                  {/* 封面区 */}
                  <div className={`relative h-32 bg-gradient-to-br ${work.coverColor} flex items-center justify-center`}>
                    <span className="text-5xl drop-shadow-lg">{work.coverIcon}</span>
                    {/* 精选徽章 */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400/90 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                      <Star className="w-3 h-3 fill-white" />
                      精选
                    </div>
                    {/* 社团标签 */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                      {work.club}
                    </div>
                  </div>
                  {/* 内容区 */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-1.5 line-clamp-1">{work.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{work.description}</p>
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {work.tags.map((tag, ti) => (
                        <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                      ))}
                    </div>
                    {/* 作者+互动数据 */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                          {work.authorAvatar}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">{work.author}</p>
                          <p className="text-[10px] text-slate-400">{work.grade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{work.views}</span>
                        <span className="flex items-center gap-1 text-rose-400"><Heart className="w-3 h-3" />{work.likes}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{work.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 全部作品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mockData.studentWorks.map((work) => (
                <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                  {/* 封面区 */}
                  <div className={`relative h-28 bg-gradient-to-br ${work.coverColor} flex items-center justify-center`}>
                    <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform">{work.coverIcon}</span>
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                      {work.club}
                    </div>
                  </div>
                  {/* 内容区 */}
                  <div className="p-3.5">
                    <h4 className="text-xs font-semibold text-slate-800 mb-1 line-clamp-1">{work.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5">{work.description}</p>
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {work.tags.map((tag, ti) => (
                        <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                      ))}
                    </div>
                    {/* 作者+互动数据 */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white text-[9px] font-semibold">
                          {work.authorAvatar}
                        </div>
                        <span className="text-[10px] text-slate-600">{work.author}</span>
                        <span className="text-[9px] text-slate-400">{work.time}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5 hover:text-rose-500 transition-colors"><Heart className="w-3 h-3" />{work.likes}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{work.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 社区底部提示 */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span>共 <strong className="text-slate-700">9</strong> 件作品 · 期待更多同学来分享！</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">本周最活跃社团：</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">Arduino创客社</span>
              </div>
            </div>
          </div>

          {/* ====== 行8：教具管理 —— 元器件·耗材·工具的领用与申购 ====== */}
          <div id="section-aids" className="space-y-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-violet-500" />
                  教具管理
                </h2>
                <p className="text-xs text-slate-500 mt-1">元器件、耗材与工具的库存管理，支持领用登记与申购审批</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  5项库存紧张
                </span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  新增申购
                </button>
              </div>
            </div>

            {/* 核心KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "教具种类", value: 47, unit: "种", icon: ShoppingBag, color: "violet" },
                { label: "库存预警", value: mockData.teachingAids.lowStockCount, unit: "项", icon: AlertTriangle, color: "amber" },
                { label: "领用中", value: 2, unit: "笔", icon: ClipboardList, color: "blue" },
                { label: "待审批申购", value: 3, unit: "项", icon: ShoppingCart, color: "emerald" },
              ].map((card, idx) => {
                const colorMap: Record<string, string> = {
                  violet: "bg-violet-50 text-violet-600",
                  amber: "bg-amber-50 text-amber-600",
                  blue: "bg-blue-50 text-blue-600",
                  emerald: "bg-emerald-50 text-emerald-600",
                };
                return (
                  <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                        <card.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] text-slate-500">{card.label}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {card.value}<span className="text-sm font-normal text-slate-400 ml-1">{card.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 库存清单 + 领用申购 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* 库存清单表 */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">库存清单</h3>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500" />充足</span>
                    <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-amber-500" />紧缺</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500">名称</th>
                        <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500">类别</th>
                        <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">库存</th>
                        <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">安全线</th>
                        <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">单位</th>
                        <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.teachingAids.inventory.map((item, idx) => {
                        const isLow = item.stock < item.safetyStock;
                        return (
                          <tr key={idx} className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${isLow ? "bg-amber-50/30" : ""}`}>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{item.name}</td>
                            <td className="px-4 py-2.5 text-[11px] text-slate-500">{item.category}</td>
                            <td className="px-4 py-2.5 text-xs text-center">
                              <span className={`font-semibold ${isLow ? "text-amber-600" : "text-slate-700"}`}>{item.stock}</span>
                            </td>
                            <td className="px-4 py-2.5 text-[11px] text-slate-400 text-center">{item.safetyStock}</td>
                            <td className="px-4 py-2.5 text-[11px] text-slate-400 text-center">{item.unit}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                item.status === "充足" ? "bg-emerald-50 text-emerald-600" :
                                item.status === "紧缺" ? "bg-amber-50 text-amber-600" :
                                "bg-blue-50 text-blue-600"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 领用记录 + 申购申请 */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* 领用记录 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-blue-500" />
                      领用记录
                    </h3>
                    <button className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">查看全部 →</button>
                  </div>
                  <div className="p-3 space-y-2">
                    {mockData.teachingAids.borrowRecords.map((record, idx) => {
                      const statusColorMap: Record<string, string> = {
                        blue: "bg-blue-50 text-blue-600 border-blue-200",
                        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
                      };
                      return (
                        <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${idx % 2 === 0 ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"}`}>
                            {record.borrower.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] font-medium text-slate-700 truncate">{record.borrower}</p>
                              <span className={`text-[9px] px-1 py-0.5 rounded-full border font-medium ${statusColorMap[record.statusColor]}`}>
                                {record.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{record.item}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-slate-400 truncate flex-1 mr-2">{record.purpose}</p>
                              <span className="text-[9px] text-slate-400 flex-shrink-0">{record.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 申购申请 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-emerald-500" />
                      申购申请
                    </h3>
                    <span className="text-[10px] text-slate-400">{mockData.teachingAids.purchaseRequests.length}项待处理</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {mockData.teachingAids.purchaseRequests.map((req, idx) => {
                      const statusColorMap: Record<string, string> = {
                        amber: "bg-amber-50 text-amber-600 border-amber-200",
                        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
                      };
                      return (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-100 hover:border-violet-200 transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-semibold text-slate-800 leading-snug">{req.item}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ml-2 ${statusColorMap[req.statusColor]}`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">{req.quantity}</span>
                            <span className="text-slate-600 font-medium">¥{req.estimatedCost}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{req.reason}</p>
                          <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
                            <span>{req.requestedBy} · {req.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 pb-3">
                    <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-lg text-[10px] text-violet-700">
                      💡 申购总预算约 ¥1,380——可申请学校科创专项经费或联系企业赞助。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 浮动演示信息卡片 */}
        <div className="fixed bottom-6 right-6 max-w-[280px] p-4 bg-white border border-slate-200 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏫</span>
            <h4 className="text-xs font-bold text-slate-800">演示账号信息</h4>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
              <span className="text-slate-600">社团指导老师</span>
              <code className="text-emerald-600 font-mono text-[10px]">zhang_advisor / demo123456</code>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
              <span className="text-slate-600">授课教师</span>
              <code className="text-emerald-600 font-mono text-[10px]">liu_teacher / demo123456</code>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
              <span className="text-slate-600">社员</span>
              <code className="text-emerald-600 font-mono text-[10px]">li_student / demo123456</code>
            </div>
          </div>
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-medium">只读模式，无法修改数据</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
