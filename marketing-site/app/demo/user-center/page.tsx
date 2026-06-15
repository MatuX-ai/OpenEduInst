"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, LogOut, User, Shield, CheckCircle2, Loader2 } from "lucide-react";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role?: string;
}

const steps = [
  { key: "auth", label: "验证登录信息", icon: Shield },
  { key: "org", label: "获取组织信息", icon: Building2 },
  { key: "redirect", label: "进入管理后台", icon: CheckCircle2 },
];

export default function UserCenterPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState("");

  const redirectToOrganization = useCallback(async () => {
    try {
      // Step 1: 验证登录 (already done by checking token)
      setCurrentStep(0);

      // Step 2: 获取组织信息
      setCurrentStep(1);
      const response = await fetch("/api/organizations/my", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取组织信息失败");
      }

      const organizations = await response.json();
      setCompletedSteps([0, 1]);

      let redirectUrl: string;
      if (organizations.length === 0) {
        redirectUrl = `http://localhost:4200/organization/1/dashboard`;
      } else {
        const org = organizations[0];
        const token = localStorage.getItem("access_token");
        redirectUrl = `http://localhost:4200/organization/${org.id}/dashboard?token=${encodeURIComponent(token || "")}`;
      }

      // Step 3: 跳转
      setCurrentStep(2);
      setCompletedSteps([0, 1, 2]);

      // 短暂展示完成状态后跳转
      await new Promise((resolve) => setTimeout(resolve, 600));
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("跳转失败:", err);
      setCompletedSteps([0, 1]);
      setCurrentStep(2);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const token = localStorage.getItem("access_token");
      window.location.href = `http://localhost:4200/organization/1/dashboard?token=${encodeURIComponent(token || "")}`;
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user_info");
    const token = localStorage.getItem("access_token");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserInfo(user);
      setLoading(false);

      // 立即开始跳转流程
      redirectToOrganization();
    } catch (err) {
      console.error("解析用户信息失败:", err);
      router.push("/login");
    }
  }, [router, redirectToOrganization]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-100">OpenMT</h1>
        </div>

        {/* 主卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
          {/* 用户头像区 */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-8"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                </div>
                <h2 className="text-lg font-semibold text-slate-300">正在登录</h2>
              </motion.div>
            ) : (
              <motion.div
                key="user-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-8"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">
                  {userInfo?.username || "用户"}
                </h2>
                <p className="text-slate-400 text-sm">{userInfo?.email || ""}</p>
                {userInfo?.role && (
                  <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400">{userInfo.role}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 步骤进度 */}
          <div className="space-y-3 mb-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCurrent = currentStep === index;
              const isCompleted = completedSteps.includes(index);
              const isPending = index > currentStep && !isCompleted;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isCurrent
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : isCompleted
                      ? "bg-emerald-500/5 border border-emerald-500/20"
                      : "bg-slate-800/30 border border-slate-700/50"
                  }`}
                >
                  {/* 图标 */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isCurrent
                        ? "bg-blue-500/20 text-blue-400"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700/50 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* 文字 */}
                  <span
                    className={`text-sm font-medium flex-1 ${
                      isCurrent
                        ? "text-blue-300"
                        : isCompleted
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* 当前步骤脉冲 */}
                  {isCurrent && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-blue-400"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400 text-center mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* 全部完成提示 */}
          {completedSteps.length === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-emerald-400 font-semibold mb-1"
              >
                ✓ 准备就绪，正在跳转...
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-500">如果页面没有自动跳转，请联系技术支持</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </motion.div>
    </div>
  );
}
