import {
  Users, Cpu, Trophy, LayoutDashboard, Calendar, Settings,
  Wrench, UserCheck, BarChart3, FileText, Heart, ShoppingBag,
  GraduationCap, BookOpen
} from "lucide-react";

export const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "社团总览", badge: null },
  { id: "community", icon: Heart, label: "作品社区", badge: "9件作品" },
  { id: "clubs", icon: Users, label: "社团管理", badge: "3个社团·186人" },
  { id: "devices", icon: Wrench, label: "器材管理", badge: "41台·紧缺" },
  { id: "aids", icon: ShoppingBag, label: "教具管理", badge: "5项预警" },
  { id: "competitions", icon: Trophy, label: "竞赛管理", badge: "3场备赛" },
  { id: "schedule", icon: Calendar, label: "活动排期", badge: "仅1间活动室" },
  { id: "interest-classes", icon: GraduationCap, label: "兴趣班管理", badge: "5个班级" },
  { id: "stem-academic", icon: BookOpen, label: "STEM教务管理", badge: "8门课程" },
  { id: "reports", icon: BarChart3, label: "学期报告", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];
