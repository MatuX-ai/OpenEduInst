import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import { mockData } from "./_data";
import { menuItems } from "./_menu";

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (id: string) => void;
}

export default function Sidebar({ activeMenu, onMenuClick }: SidebarProps) {
  return (
    <aside className="w-60 bg-slate-900 flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">{mockData.institution.name}</h1>
            <p className="text-xs text-slate-400">培训中心管理</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-blue-500/30">
            {mockData.user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{mockData.user.name}</p>
            <p className="text-xs text-slate-400">{mockData.user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
              activeMenu === item.id
                ? "bg-blue-600/20 text-blue-400 font-medium"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                activeMenu === item.id
                  ? "bg-blue-600/30 text-blue-300"
                  : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Links */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/demo"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回Demo选择
        </Link>
      </div>
    </aside>
  );
}
