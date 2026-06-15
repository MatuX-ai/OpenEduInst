"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

const DEMO_EMAIL = "zhao_admin";
const DEMO_PASSWORD = "demo123456";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (username: string, pwd: string) => {
    setLoading(true);
    setError("");

    try {
      // 调用后端登录 API（通过 Next.js API Route 代理）
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password: pwd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "登录失败");
      }

      const data = await response.json();

      // 保存 Token
      localStorage.setItem("access_token", data.access_token);

      // 获取用户信息（通过代理）
      const userResponse = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userInfo = await userResponse.json();
        localStorage.setItem("user_info", JSON.stringify(userInfo));
      }

      // 跳转到用户中心（过渡页面）
      router.push("/demo/user-center");
    } catch (err) {
      console.error("登录错误:", err);
      const errorMessage = err instanceof Error ? err.message : "登录失败，请检查用户名和密码";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleDemoLogin = async () => {
    await doLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-100">
            OpenMT
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-2 text-slate-100">
            欢迎回来
          </h1>
          <p className="text-slate-400">
            登录以访问您的组织管理后台
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}

            {/* 邮箱/用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                邮箱或用户名
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入邮箱或用户名"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* 其他选项 */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              还没有账号？{" "}
              <Link
                href="/demo/create-org"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                创建组织
              </Link>
            </p>
          </div>
        </div>

        {/* 演示账号一键登录 */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              演示账号一键登录
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-slate-500 text-center">
          账号 zhao_admin / 密码 demo123456
        </p>

        {/* 返回首页 */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-400">
            还没有账号？{" "}
            <Link href="/demo/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              注册云托管账号
            </Link>
          </p>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
