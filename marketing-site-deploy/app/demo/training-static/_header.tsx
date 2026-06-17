"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Clock, Home } from "lucide-react";

export default function HeaderBar() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Simulated Device Info */}
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-slate-400 font-mono">{currentTime || "00:00"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-blue-500 rounded-full" />
            </div>
            <span className="text-slate-400">85%</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-md text-[11px] font-semibold">
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
