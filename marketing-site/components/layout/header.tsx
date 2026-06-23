"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Menu,
  X,
  Monitor,
  FlaskConical,
  Coins,
  Puzzle,
  Cloud,
  Eye,
  Download,
  BookOpen,
  LogIn,
  UserPlus,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navLinks: NavLink[] = [
  { href: "/features/hardware", label: "硬件管理", icon: Monitor },
  { href: "/features/projects", label: "实验项目", icon: FlaskConical },
  { href: "/features/token", label: "Token计费", icon: Coins },
  { href: "/features/makerspace", label: "创客空间", icon: Puzzle },
  { href: "/features/cloud-hosting", label: "云托管版", icon: Cloud },
  { href: "/demo", label: "Demo", icon: Eye },
  { href: "/download", label: "下载", icon: Download },
  { href: "/docs", label: "文档", icon: BookOpen },
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
        <nav className="hidden lg:flex items-center gap-1">
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
              href="/login"
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
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav - 图文网格 */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center gap-2 px-3 py-4 text-sm text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-xl transition-all"
                  >
                    <Icon className="w-6 h-6" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-blue-400 font-medium transition-colors border border-slate-700 rounded-xl"
              >
                <LogIn className="w-5 h-5" />
                登录
              </Link>
              <Link
                href="/demo/create-org"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                注册
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
