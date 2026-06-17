import { mockData } from "./_data";

export default function LoadingScreen() {
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
