import {
  School, BarChart3, Award, LayoutDashboard, Settings,
  Wrench, DollarSign, BookOpen, UserCheck,
} from "lucide-react";

export const menuItems = [
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
