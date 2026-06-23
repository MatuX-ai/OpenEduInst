"use client";

import { motion } from "framer-motion";
import { Code, ArrowLeft, Shield, Key, Server, Database, Lock } from "lucide-react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/auth/login",
    description: "用户登录，获取 JWT Token",
    auth: "否",
  },
  {
    method: "GET",
    path: "/api/devices",
    description: "获取设备列表，支持分页和筛选",
    auth: "是",
  },
  {
    method: "GET",
    path: "/api/devices/{id}",
    description: "获取单个设备详情",
    auth: "是",
  },
  {
    method: "POST",
    path: "/api/devices",
    description: "新增设备",
    auth: "是",
  },
  {
    method: "PUT",
    path: "/api/devices/{id}",
    description: "更新设备信息",
    auth: "是",
  },
  {
    method: "GET",
    path: "/api/devices/{id}/borrow",
    description: "获取设备借用记录",
    auth: "是",
  },
  {
    method: "POST",
    path: "/api/devices/{id}/borrow",
    description: "借用设备",
    auth: "是",
  },
  {
    method: "GET",
    path: "/api/projects",
    description: "获取项目列表",
    auth: "是",
  },
  {
    method: "POST",
    path: "/api/projects",
    description: "创建新项目",
    auth: "是",
  },
  {
    method: "GET",
    path: "/api/tokens/balance",
    description: "查询 Token 余额",
    auth: "是",
  },
  {
    method: "POST",
    path: "/api/tokens/consume",
    description: "消费 Token",
    auth: "是",
  },
  {
    method: "GET",
    path: "/api/makerspace/rooms",
    description: "获取实验室/创客空间列表",
    auth: "是",
  },
  {
    method: "POST",
    path: "/api/makerspace/reservations",
    description: "预约实验室",
    auth: "是",
  },
];

export default function ApiDocs() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文档中心
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Code className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-400">API 参考</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            API 参考文档
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            OpenMT 提供 RESTful API 接口，支持 JSON 格式的数据交互。
            启动后端服务后可访问 <code className="px-2 py-1 bg-slate-800 rounded text-purple-400 text-sm">/docs</code> 查看 Swagger 交互式文档。
          </p>

          {/* 认证说明 */}
          <div className="mb-12 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" />
              认证方式
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              API 使用 JWT (JSON Web Token) 进行认证。登录后获取 Token，在后续请求中通过 Authorization Header 传递。
            </p>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <code className="text-sm text-slate-300 font-mono">
                Authorization: Bearer &lt;your_jwt_token&gt;
              </code>
            </div>
          </div>

          {/* API 端点列表 */}
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            API 端点
          </h2>

          <div className="space-y-3 mb-12">
            {apiEndpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-blue-500/30 transition-all"
              >
                <span className={`px-2 py-1 rounded text-xs font-mono font-bold min-w-[52px] text-center ${
                  endpoint.method === "GET" ? "bg-green-500/20 text-green-400" :
                  endpoint.method === "POST" ? "bg-blue-500/20 text-blue-400" :
                  endpoint.method === "PUT" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-slate-200 font-mono flex-1">{endpoint.path}</code>
                <span className="text-xs text-slate-500 hidden md:block flex-1 max-w-xs">{endpoint.description}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${endpoint.auth === "是" ? "bg-slate-700 text-slate-400" : "bg-green-500/10 text-green-400"}`}>
                  {endpoint.auth === "是" ? <Lock className="w-3 h-3 inline mr-1" /> : <Shield className="w-3 h-3 inline mr-1" />}
                  {endpoint.auth === "是" ? "需认证" : "公开"}
                </span>
              </motion.div>
            ))}
          </div>

          {/* 数据格式 */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              通用响应格式
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              所有 API 响应均采用以下 JSON 格式：
            </p>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
{`{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00Z"
}`}
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
