import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
            <Search className="w-12 h-12 text-slate-500" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-slate-100 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-4">
          页面未找到
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          您要查找的页面可能已被移除、名称已更改或暂时不可用。
          请检查 URL 是否正确，或返回首页浏览其他内容。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 hover:border-blue-500 transition-all"
          >
            查看文档
          </Link>
        </div>
      </div>
    </div>
  );
}
