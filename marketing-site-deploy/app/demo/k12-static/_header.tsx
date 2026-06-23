import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Bell, Clock } from "lucide-react";
import { mockData } from "./_data";

export default function HeaderBar() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-400 font-mono">{currentTime || "00:00"}</span>
          </div>
          <div className="text-slate-600">{mockData.institution.fullName}</div>
          <div className="hidden sm:flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">设备在线 38/41</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-md text-[11px] font-semibold">
            演示模式
          </div>
          <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="返回首页">
            <Home className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </header>
  );
}
