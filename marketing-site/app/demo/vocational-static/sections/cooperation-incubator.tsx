import { Building2, Rocket } from "lucide-react";
import { mockData } from "../_data";

export default function CooperationIncubator() {
  return (
    <div id="section-cooperation" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 校企真实项目 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-blue-500" />校企真实项目
          </h3>
          <span className="text-xs text-slate-500">5个进行中</span>
        </div>
        <div className="p-5 space-y-4">
          {mockData.cooperationProjects.map(p => (
            <div key={p.id} className="p-4 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.enterprise} · 👥 {p.students}名学生在做</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  p.stage === "现场试运行" ? "bg-green-50 text-green-600" :
                  p.stage === "样机调试" ? "bg-amber-50 text-amber-600" :
                  "bg-blue-50 text-blue-600"
                }`}>{p.stage}</span>
              </div>
              <div className="bg-red-50 rounded-lg p-2.5 mb-2">
                <p className="text-xs text-red-600"><span className="font-semibold">企业痛点：</span>{p.painPoint}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 mb-2">
                <p className="text-xs text-emerald-700"><span className="font-semibold">合作价值：</span>{p.value}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{p.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 双创孵化器 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Rocket className="w-4.5 h-4.5 text-amber-500" />学生双创孵化器
          </h3>
          <span className="text-xs text-amber-600 font-medium">已拨 ¥{mockData.incubator.totalFunding.toLocaleString()}</span>
        </div>
        <div className="p-5">
          {/* 阶段统计 */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {mockData.incubator.stages.map(s => (
              <div key={s.name} className="text-center p-2 rounded-lg bg-slate-50">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs text-slate-500">{s.name}</div>
              </div>
            ))}
          </div>
          {/* 项目列表 */}
          <div className="space-y-3">
            {mockData.incubator.projects.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        p.stage === "推向市场" ? "bg-green-50 text-green-600" :
                        p.stage === "样机测试" ? "bg-amber-50 text-amber-600" :
                        p.stage === "原型开发" ? "bg-blue-50 text-blue-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>{p.stage}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.team} · {p.leader}({p.className}) · {p.members}人</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">导师: {p.mentor}</span>
                      {p.funding > 0 && <span className="text-xs text-amber-600 font-semibold">已拨 ¥{p.funding.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{p.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
