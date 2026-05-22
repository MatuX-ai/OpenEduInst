import {
  LayoutDashboard, Wrench, Trophy, Users, Calendar, Settings,
  UserCheck, BarChart3, ShoppingBag, Building2, Rocket, Briefcase, BookOpen,
} from "lucide-react";

export const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export const menuItems = [
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
