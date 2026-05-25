"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/features/hardware", label: "硬件管理" },
  { href: "/features/projects", label: "实验项目" },
  { href: "/features/token", label: "Token计费" },
  { href: "/features/makerspace", label: "创客空间" },
  { href: "/features/cloud-hosting", label: "云托管版" },
  { href: "/demo", label: "Demo" },
  { href: "/download", label: "下载" },
  { href: "/docs", label: "文档" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-w.png" alt="OpenMT Logo" width={24} height={24} priority />
          <span className="text-xl font-bold text-slate-100">OpenMT</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-2">
            <Link
              href="/demo/login"
              className="px-4 py-2 text-sm text-slate-300 hover:text-blue-400 font-medium transition-colors"
            >
              登录
            </Link>
            <Link
              href="/demo/create-org"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              注册
            </Link>
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/demo/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm text-slate-300 hover:text-blue-400 font-medium transition-colors text-center border border-slate-700 rounded-lg"
              >
                登录
              </Link>
              <Link
                href="/demo/create-org"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors text-center"
              >
                注册
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
