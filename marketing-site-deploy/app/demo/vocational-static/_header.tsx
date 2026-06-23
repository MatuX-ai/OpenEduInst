import Link from "next/link";
import { Bell, Home } from "lucide-react";
import { mockData } from "./_data";

export default function HeaderBar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{mockData.institution.fullName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{mockData.institution.note}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            演示模式
          </div>
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Home className="w-5 h-5 text-slate-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
