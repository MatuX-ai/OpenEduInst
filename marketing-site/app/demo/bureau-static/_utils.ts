export const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export const statusColor = (s: string) =>
  s === "薄弱" || s === "紧急"
    ? "text-red-600 bg-red-50"
    : s === "待提升" || s === "紧缺"
    ? "text-amber-600 bg-amber-50"
    : s === "优秀" || s === "已归还"
    ? "text-green-600 bg-green-50"
    : "text-blue-600 bg-blue-50";

export const priorityColor = (p: string) =>
  p === "紧急" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";
