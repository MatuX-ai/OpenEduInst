import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenMT - 开源 STEM 教育机构管理工具",
  description: "硬件管理 · 实验项目 · 创客空间 · 免费开源。专为 K12科创中心、职业学校实训、编程培训机构设计的 STEM 教育管理系统。",
  keywords: ["开源", "STEM教育", "硬件管理", "创客空间", "Arduino", "机器人编程", "教育机构管理"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
