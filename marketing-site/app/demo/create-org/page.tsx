"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData] = useState({
    name: "星海机器人培训中心",
    contact_email: "admin@example.com",
    org_type: "training_institution",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 获取当前登录用户的 Token (假设已存储在 localStorage)
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert("请先登录！");
        router.push('/demo/login'); // 假设有登录页
        return;
      }

      // 2. 调用后端创建组织接口（通过 Next.js API Route 代理）
      console.log('Token:', token);
      
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          contact_email: formData.contact_email,
          org_type: formData.org_type,
          phone: null,
          address: null
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || `创建失败 (HTTP ${res.status})`);
      }

      const data = await res.json();
      
      // 3. 存储新的包含 org_id 的 Token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('current_org_id', data.organization_id.toString());

      // 4. 跳转到 Angular 管理后台
      window.location.href = `http://localhost:4201/organization/${data.organization_id}/dashboard`;
      
    } catch (error) {
      console.error("创建组织失败:", error);
      const message = error instanceof Error ? error.message : "创建失败，请稍后重试";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">创建您的 STEM 机构</h1>
          <p className="text-slate-400 mt-2">填写基本信息以开启云托管服务</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">机构名称</label>
            <div className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400">
              星海机器人培训中心
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">联系邮箱</label>
            <div className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400">
              admin@example.com
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">机构类型</label>
            <div className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400">
              STEM 培训机构
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-green-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>立即创建 <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          已有账号？ <Link href="/demo" className="text-blue-400 hover:text-blue-300">返回登录</Link>
        </div>
      </motion.div>
    </div>
  );
}
