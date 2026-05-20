import { GitBranch as GithubIcon, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 产品信息 */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-slate-100">OpenMT</h3>
            <p className="text-sm text-slate-400 mb-4">
              开源 STEM 教育机构管理工具<br />
              硬件管理 · 实验项目 · 创客空间
            </p>
            <a
              href="https://github.com/OpenMTEduInst"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>

          {/* 功能链接 */}
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">核心功能</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features/hardware" className="text-slate-400 hover:text-blue-400 transition-colors">
                  硬件设备管理
                </Link>
              </li>
              <li>
                <Link href="/features/projects" className="text-slate-400 hover:text-blue-400 transition-colors">
                  实验项目管理
                </Link>
              </li>
              <li>
                <Link href="/features/token" className="text-slate-400 hover:text-blue-400 transition-colors">
                  Token 计费系统
                </Link>
              </li>
              <li>
                <Link href="/features/makerspace" className="text-slate-400 hover:text-blue-400 transition-colors">
                  创客空间调度
                </Link>
              </li>
            </ul>
          </div>

          {/* 资源链接 */}
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">资源</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-slate-400 hover:text-blue-400 transition-colors">
                  文档中心
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-slate-400 hover:text-blue-400 transition-colors">
                  API 参考
                </Link>
              </li>
              <li>
                <Link href="/docs/quick-start" className="text-slate-400 hover:text-blue-400 transition-colors">
                  快速开始
                </Link>
              </li>
              <li>
                <Link href="/docs/faq" className="text-slate-400 hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">联系我们</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:contact@matux.tech" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4" />
                  contact@matux.tech
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Discord 社区
                </a>
              </li>
              <li>
                <a href="https://github.com/OpenMTEduInst/issues" className="text-slate-400 hover:text-blue-400 transition-colors">
                  GitHub Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>© 2026 OpenMT. MIT License. Made with ❤️ for STEM Education.</p>
        </div>
      </div>
    </footer>
  );
}
