"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ArrowRight, LogOut, User, Shield } from "lucide-react";
import Link from "next/link";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function UserCenterPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const redirectToOrganization = async () => {
    setRedirecting(true);

    try {
      // 调用后端 API 获取用户所属的组织（通过代理）
      const response = await fetch("/api/organizations/my", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取组织信息失败");
      }

      const organizations = await response.json();

      if (organizations.length === 0) {
        // 没有组织，使用默认组织 ID=1
        window.location.href = `http://localhost:4200/organization/1/dashboard`;
        return;
      }

      // 用户只能有一个组织，直接跳转
      const org = organizations[0];
      
      // 带上 token 跳转到 Angular 管理后台
      const token = localStorage.getItem("access_token");
      window.location.href = `http://localhost:4200/organization/${org.id}/dashboard?token=${encodeURIComponent(token || "")}`;
    } catch (err) {
      console.error("跳转失败:", err);
      // 失败时跳转到默认组织
      const token = localStorage.getItem("access_token");
      window.location.href = `http://localhost:4200/organization/1/dashboard?token=${encodeURIComponent(token || "")}`;
    }
  };

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem("user_info");
    const token = localStorage.getItem("access_token");

    if (!token || !userStr) {
      // 未登录，跳转到登录页
      router.push("/demo/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 模拟加载延迟，展示过渡页面
      setTimeout(() => {
        setUserInfo(user);
        redirectToOrganization();
      }, 1500);
    } catch (err) {
      console.error("解析用户信息失败:", err);
      router.push("/demo/login");
    } finally {
      setLoading(false);
    }
  }, [router, redirectToOrganization]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    router.push("/demo/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* 用户信息卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
          {/* 头像和用户名 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              {userInfo?.username || "用户"}
            </h1>
            <p className="text-slate-400 text-sm">
              {userInfo?.email || ""}
            </p>
            {userInfo?.role && (
              <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400">{userInfo.role}</span>
              </div>
            )}
          </div>

          {/* 正在跳转提示 */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-100 font-semibold mb-1">
                  正在进入 STEM 机构管理后台
                </h3>
                <p className="text-sm text-slate-400">
                  {redirecting ? "准备跳转..." : "即将跳转到管理后台"}
                </p>
              </div>
              {redirecting && (
                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              )}
            </div>
          </div>


        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            如果页面没有自动跳转，请点击&quot;立即进入&quot;按钮
          </p>
        </div>
      </motion.div>
    </div>
  );
}
