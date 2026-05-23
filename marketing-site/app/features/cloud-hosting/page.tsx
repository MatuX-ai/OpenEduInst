import { Cloud, Shield, Zap, Smartphone } from "lucide-react";
import Link from "next/link";

export default function CloudHostingPage() {
  const features = [
    {
      icon: <Cloud className="w-8 h-8 text-blue-500" />,
      title: "云端自动备份",
      desc: "无需担心数据丢失，系统每日自动增量备份，支持一键回滚。"
    },
    {
      icon: <Zap className="w-8 h-8 text-purple-500" />,
      title: "高级 AI 助教",
      desc: "集成云端大模型，提供智能排课建议、学生学情分析及代码审查。"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-green-500" />,
      title: "多端实时同步",
      desc: "Web、平板、手机端数据秒级同步，随时随地管理您的 STEM 机构。"
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "企业级安全防护",
      desc: "SSL 加密传输，多租户物理隔离，符合教育行业数据安全标准。"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center border-b border-slate-800">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          OpenMT 云托管版
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          专为 STEM 教育机构打造的 SaaS 管理平台。免运维、高可用、智能化。
        </p>
        <Link 
          href="/demo/create-org"
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-all"
        >
          立即免费试用
        </Link>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 container mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">版本对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-4 text-slate-400">功能特性</th>
                  <th className="p-4 text-slate-400">开源社区版</th>
                  <th className="p-4 text-blue-400 font-bold">云托管版</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <td className="p-4">硬件设备管理</td>
                  <td className="p-4">✅</td>
                  <td className="p-4">✅</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-4">Token 计费系统</td>
                  <td className="p-4">✅</td>
                  <td className="p-4">✅</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-4">云端自动备份</td>
                  <td className="p-4">❌</td>
                  <td className="p-4 text-blue-400">✅</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-4">AI 智能助教</td>
                  <td className="p-4">基础版</td>
                  <td className="p-4 text-blue-400">高级版</td>
                </tr>
                <tr>
                  <td className="p-4">多端实时同步</td>
                  <td className="p-4">❌</td>
                  <td className="p-4 text-blue-400">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
