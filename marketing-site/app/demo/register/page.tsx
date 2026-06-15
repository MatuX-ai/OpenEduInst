"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle,
  AlertCircle, Loader2, Building2, Shield,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1: 账号信息
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Step 2: 个人信息
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Step 3: 组织信息
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("training_institution");

  // Step 4: 邮箱验证
  const [verCode, setVerCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const validateStep1 = () => {
    if (!username || username.length < 3) return "用户名至少 3 个字符";
    if (!password || password.length < 8) return "密码至少 8 个字符";
    if (password !== confirmPwd) return "两次密码不一致";
    return "";
  };

  const validateStep2 = () => {
    if (!fullName) return "请输入姓名";
    if (!email || !email.includes("@")) return "请输入有效的邮箱地址";
    return "";
  };

  const validateStep3 = () => {
    if (!orgName) return "请输入机构名称";
    return "";
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    } else if (step === 3) {
      const err = validateStep3();
      if (err) { setError(err); return; }
    }
    setStep((step + 1) as Step);
  };

  const prevStep = () => {
    setError("");
    setStep((step - 1) as Step);
  };

  // 发送验证码
  const sendCode = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/email/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "发送失败");
      setCodeSent(true);
      setCooldown(60);
      // 开发模式：自动填入验证码
      if (data._dev_code) {
        setVerCode(data._dev_code);
      }
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
          verification_code: verCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "注册失败");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">注册成功！</h2>
          <p className="text-gray-500">正在跳转到登录页面...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">注册云托管账号</h1>
          <p className="text-blue-100 text-sm mt-1">一站式 STEM 教育管理平台</p>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"} ${s === step ? "w-8" : "w-4"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="px-8 py-6">
          <AnimatePresence mode="wait">
            {/* Step 1: 账号信息 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 1: 创建账号</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">用户名</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="至少 3 个字符" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="至少 8 个字符" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="再次输入密码" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: 个人信息 */}
            {step === 2 && (
              <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 2: 个人信息</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="您的姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="your@email.com" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: 组织信息 */}
            {step === 3 && (
              <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 3: 机构信息</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">机构名称</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="如：星海机器人培训中心" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">机构类型</label>
                  <select value={orgType} onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="training_institution">培训机构</option>
                    <option value="k12_school">K12 学校</option>
                    <option value="vocational_school">职业学校</option>
                    <option value="education_bureau">教育局</option>
                  </select>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">注册后系统将自动为您创建云托管环境，包含 30 天免费试用、每日自动备份和 AI 助教功能。</p>
                </div>
              </motion.div>
            )}

            {/* Step 4: 邮箱验证 */}
            {step === 4 && (
              <motion.div key="s4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 4: 邮箱验证</h3>
                <p className="text-sm text-gray-500 mb-2">验证码已发送到 <strong>{email}</strong></p>
                <div className="flex gap-2">
                  <input type="text" value={verCode} onChange={(e) => setVerCode(e.target.value)} maxLength={6}
                    className="flex-1 text-center text-2xl tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000000" />
                  <button type="button" onClick={sendCode} disabled={cooldown > 0 || loading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap">
                    {cooldown > 0 ? `${cooldown}s` : codeSent ? "重新发送" : "发送验证码"}
                  </button>
                </div>
                {codeSent && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 验证码已发送，请查收邮箱</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button type="button" onClick={prevStep}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                <ArrowLeft className="w-4 h-4" /> 上一步
              </button>
            ) : <div />}

            {step < 4 ? (
              <button type="submit"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                下一步 <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                完成注册
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">立即登录</Link>
        </div>
      </motion.div>
    </div>
  );
}
