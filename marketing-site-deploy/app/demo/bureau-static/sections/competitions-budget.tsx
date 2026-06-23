import { Award, DollarSign } from "lucide-react";
import { mockData } from "../_data";

export default function CompetitionsBudget() {
  return (
    <div id="section-competitions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 竞赛管理 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-red-500" />
            竞赛组织与管理
          </h3>
          <div className="flex gap-2 text-xs">
            {["全部", "县级", "市级", "省级", "国家级"].map((t) => (
              <button key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600">{t}</button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { v: mockData.competitions.national, l: "国家级" },
              { v: mockData.competitions.provincial, l: "省级" },
              { v: mockData.competitions.municipal, l: "市级" },
              { v: mockData.competitions.county, l: "县级" },
            ].map((k, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-slate-50">
                <div className="text-xl font-bold text-slate-800">{k.v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">近期获奖</h4>
          </div>
          <div className="space-y-2">
            {mockData.competitions.recentResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{r.event}</p>
                  <p className="text-xs text-slate-400">{r.school}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">{r.level}</span>
                  <span className="text-sm font-bold text-red-600">{r.award}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 经费管理 */}
      <div id="section-budget" className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4.5 h-4.5 text-amber-500" />
              STEM 经费管理
            </h3>
          </div>
          <div className="p-5">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-slate-800">¥{mockData.budget.annual}万</div>
              <div className="text-xs text-slate-500 mt-1">年度STEM教育总预算</div>
            </div>
            <div className="space-y-2.5">
              {mockData.budget.allocation.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="text-slate-800 font-semibold">¥{item.amount}万</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: item.pct + "%", backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">已支出 <span className="font-semibold text-slate-700">¥{mockData.budget.spent}万</span></span>
              <span className="text-green-600 font-semibold">剩余 ¥{mockData.budget.remaining}万</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">最近经费支出</h3>
          </div>
          <div className="p-5 space-y-2">
            {mockData.budget.recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <span className="text-slate-700 font-medium">{e.item}</span>
                  <span className="text-slate-400 ml-2">{e.school}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-600 font-semibold">¥{e.amount}万</span>
                  <span
                    className={
                      "text-xs px-1.5 py-0.5 rounded-full font-medium " +
                      (e.status === "已拨付" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")
                    }
                  >
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
