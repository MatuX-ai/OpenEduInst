"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function DemoK12() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">正在加载演示环境...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回选择
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-sm font-semibold text-slate-200">
              阳光中学科创中心 - Demo
            </span>
          </div>
          <a
            href="http://localhost:4200"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            新窗口打开
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* iframe 嵌入主应用 */}
      <div className="w-full" style={{ height: "calc(100vh - 60px)" }}>
        <iframe
          src="http://localhost:4200/organization/2/dashboard"
          className="w-full h-full border-0"
          title="OpenMT Demo - K12 School"
          onLoad={() => console.log("Demo loaded")}
        />
      </div>

      {/* 浮动提示 */}
      <div className="fixed bottom-6 right-6 max-w-sm p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
        <h4 className="text-sm font-semibold mb-2 text-slate-200">
          🏫 演示账号信息
        </h4>
        <div className="space-y-1 text-xs text-slate-400">
          <p>校长：liu_principal / demo123456</p>
          <p>教务主任：wang_director / demo123456</p>
          <p>教师：chen_teacher / demo123456</p>
        </div>
        <p className="mt-3 text-xs text-orange-400">
          ⚠️ 只读模式，无法修改数据
        </p>
      </div>
    </div>
  );
}
