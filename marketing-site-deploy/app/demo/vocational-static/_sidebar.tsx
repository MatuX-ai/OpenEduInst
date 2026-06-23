import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockData } from "./_data";
import { menuItems } from "./_menu";

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (id: string) => void;
}

export default function Sidebar({ activeMenu, onMenuClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">MS</div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-sm truncate">梅山县职校</h1>
            <p className="text-xs text-slate-500 truncate">STEM 实训平台</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{mockData.user.avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{mockData.user.name}</p>
            <p className="text-xs text-slate-500 truncate">{mockData.user.role}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onMenuClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeMenu === item.id
                ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                item.badge.includes("预警") || item.badge.includes("备赛")
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <Link
          href="/demo"
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回选择
        </Link>
      </div>
    </aside>
  );
}
