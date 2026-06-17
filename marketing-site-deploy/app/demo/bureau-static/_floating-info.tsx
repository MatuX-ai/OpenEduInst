import { AlertCircle } from "lucide-react";

export default function FloatingInfo() {
  return (
    <div className="fixed bottom-6 right-6 max-w-sm p-5 bg-white border border-slate-200 rounded-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏛️</span>
        <h4 className="text-sm font-bold text-slate-800">演示账号信息</h4>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
          <span className="text-slate-600">科长</span>
          <code className="text-amber-600 font-mono">chen_director / demo123456</code>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
          <span className="text-slate-600">督导员</span>
          <code className="text-amber-600 font-mono">li_inspector / demo123456</code>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
          <span className="text-slate-600">教研员</span>
          <code className="text-amber-600 font-mono">zhang_researcher / demo123456</code>
        </div>
      </div>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">只读模式，无法修改数据</span>
        </div>
      </div>
    </div>
  );
}
