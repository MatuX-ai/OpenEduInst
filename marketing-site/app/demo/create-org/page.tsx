"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    org_type: "training_institution",
    phone: "",
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

      // 2. 调用后端创建组织接口
      const res = await fetch('http://localhost:8000/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '创建失败');
      }

      const data = await res.json();
      
      // 3. 存储新的包含 org_id 的 Token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('current_org_id', data.organization_id.toString());

      // 4. 跳转到 Angular 管理后台
      // 假设 Angular 运行在 4200 端口
      window.location.href = `http://localhost:4200/organization/${data.organization_id}/dashboard`;
      
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
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例如：星海机器人培训中心"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">联系邮箱</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">机构类型</label>
            <select
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.org_type}
              onChange={(e) => setFormData({...formData, org_type: e.target.value})}
            >
              <option value="training_institution">STEM 培训机构</option>
              <option value="k12_school">K12 学校科创中心</option>
              <option value="vocational_school">职业学校实训室</option>
              <option value="education_bureau">教育局监管平台</option>
            </select>
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
