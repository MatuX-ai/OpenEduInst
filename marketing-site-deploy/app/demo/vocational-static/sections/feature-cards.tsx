import { Building2, Rocket, Trophy, Briefcase } from "lucide-react";
import { mockData } from "../_data";

export default function FeatureCards() {
  return (
    <div id="section-clubs" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 校企合作 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">校企合作</h4>
            <p className="text-xs text-slate-500">23家本地民企</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {mockData.enterprises.slice(0,4).map(e => (
            <span key={e.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{e.name}</span>
          ))}
          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">+18家</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">缺研发的中小企业 → 学生的真项目</p>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">5个真实合作项目 →</div>
      </div>

      {/* 双创孵化 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-400">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">双创孵化器</h4>
            <p className="text-xs text-slate-500">{mockData.stats.incubatingProjects}个项目在孵</p>
          </div>
        </div>
        <div className="space-y-2">
          {mockData.incubator.projects.slice(0,3).map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 truncate">{p.team}·{p.name}</span>
              <span className={`font-semibold ${
                p.stage === "推向市场" ? "text-green-600" : p.stage === "样机测试" ? "text-amber-600" : "text-blue-600"
              }`}>{p.stage}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">
          已拨孵化资金 ¥{mockData.incubator.totalFunding.toLocaleString()} →
        </div>
      </div>

      {/* 技能竞赛 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">技能竞赛</h4>
            <p className="text-xs text-slate-500">3场备赛中</p>
          </div>
        </div>
        <div className="space-y-2">
          {mockData.competitions.map(c => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                c.level === "省级" ? "bg-red-50 text-red-600" : c.level === "市级" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
              }`}>{c.level}</span>
              <span className="text-slate-600 truncate">{c.subTitle}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">查看竞赛详情 →</div>
      </div>

      {/* 实习就业 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">实习就业</h4>
            <p className="text-xs text-slate-500">就业率 {mockData.stats.employmentRate}%</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800 mb-1">
          ¥{mockData.employmentStats.avgSalary.toLocaleString()}
          <span className="text-xs text-slate-500 font-normal ml-1">本地起薪/月</span>
        </div>
        <p className="text-xs text-slate-500">55% 本地 · 5% 创业 · 10% 升学</p>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-medium">查看就业报告 →</div>
      </div>
    </div>
  );
}
