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
  title: {
    default: "OpenMT - 开源 STEM 教育机构管理工具",
    template: "%s | OpenMT",
  },
  description: "硬件管理 · 实验项目 · 创客空间 · 免费开源。专为 K12科创中心、职业学校实训、编程培训机构设计的 STEM 教育管理系统。支持 Arduino/Raspberry Pi 设备租赁、机器人竞赛管理、Token AI 计费。",
  keywords: ["开源", "STEM教育", "硬件管理", "创客空间", "Arduino", "Raspberry Pi", "机器人编程", "教育机构管理", "K12科创", "职业教育", "Token计费", "实验室预约"],
  authors: [{ name: "MatuX Team", url: "https://github.com/MatuX-ai" }],
  creator: "MatuX Team",
  publisher: "MatuX",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://eduInst.matux.tech"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://eduInst.matux.tech",
    siteName: "OpenMT",
    title: "OpenMT - 开源 STEM 教育机构管理工具",
    description: "硬件管理 · 实验项目 · 创客空间 · 免费开源。专为 STEM 教育设计的机构管理系统。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenMT - STEM Education Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenMT - 开源 STEM 教育机构管理工具",
    description: "硬件管理 · 实验项目 · 创客空间 · 免费开源",
    images: ["/og-image.png"],
    creator: "@MatuXAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
