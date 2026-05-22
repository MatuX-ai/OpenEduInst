import {
  LayoutDashboard, Users, UserPlus, Calendar, Wrench, Code,
  Brain, DollarSign, BarChart3, Settings, Award, BookOpen,
} from "lucide-react";

export const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "运营概览", badge: null },
  { id: "students", icon: Users, label: "学员管理", badge: "328人在训" },
  { id: "leads", icon: UserPlus, label: "招生线索", badge: "15位待跟进" },
  { id: "schedule", icon: Calendar, label: "智能排课", badge: "本周42节" },
  { id: "devices", icon: Wrench, label: "设备资产", badge: "5台待维护" },
  { id: "projects", icon: Code, label: "项目管理", badge: "3个进行中" },
  { id: "resources", icon: BookOpen, label: "教学资源", badge: "93个资源" },
  { id: "competitions", icon: Award, label: "竞赛认证", badge: "4项报名中" },
  { id: "tokens", icon: Brain, label: "Token中心", badge: "12,580点" },
  { id: "billing", icon: DollarSign, label: "财务结算", badge: "待确认8单" },
  { id: "reports", icon: BarChart3, label: "数据报表", badge: null },
  { id: "settings", icon: Settings, label: "系统设置", badge: null },
];
