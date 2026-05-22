export const statusColor = (s: string) =>
  s === "紧缺" || s === "使用中"
    ? "text-amber-600 bg-amber-50"
    : s === "正常" || s === "已归还"
    ? "text-green-600 bg-green-50"
    : s === "待维修"
    ? "text-orange-600 bg-orange-50"
    : "text-slate-500 bg-slate-100";

export const approvalColor = (s: string) =>
  s === "已批准"
    ? "text-green-600 bg-green-50"
    : s === "待审批"
    ? "text-amber-600 bg-amber-50"
    : "text-red-600 bg-red-50";

export const workloadColor = (s: string) =>
  s === "偏重"
    ? "text-amber-600 bg-amber-50"
    : s === "适中"
    ? "text-blue-600 bg-blue-50"
    : "text-green-600 bg-green-50";
