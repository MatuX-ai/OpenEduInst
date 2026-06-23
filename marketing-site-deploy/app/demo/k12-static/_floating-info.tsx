import { AlertCircle } from "lucide-react";

export default function FloatingInfo() {
  return (
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
  );
}
