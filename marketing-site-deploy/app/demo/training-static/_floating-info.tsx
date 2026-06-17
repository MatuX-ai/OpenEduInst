import { AlertCircle, Cpu } from "lucide-react";

export default function FloatingInfo() {
  return (
    <div className="fixed bottom-6 right-6 max-w-xs p-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-blue-400" />
        <h4 className="text-xs font-bold text-slate-200">演示环境</h4>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
          <span className="text-slate-400">管理员</span>
          <code className="text-blue-400 font-mono">admin / demo123456</code>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
          <span className="text-slate-400">教师</span>
          <code className="text-blue-400 font-mono">teacher / demo123456</code>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded">
          <span className="text-slate-400">学生</span>
          <code className="text-blue-400 font-mono">student / demo123456</code>
        </div>
      </div>
      <div className="mt-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <AlertCircle className="w-3 h-3" />
          <span>只读演示 · 数据24h自动重置</span>
        </div>
      </div>
    </div>
  );
}
