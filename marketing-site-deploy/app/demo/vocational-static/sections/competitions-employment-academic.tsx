import { Trophy, Briefcase, BookOpen, Wrench, UserCheck, Users, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { mockData } from "../_data";
import { COLORS } from "../_menu";
import { workloadColor } from "../_utils";

export default function CompetitionsEmploymentAcademic() {
  return (
    <div id="section-competitions" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 技能竞赛 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-red-500" />技能竞赛
          </h3>
          <span className="text-xs text-red-600 font-medium">3场备赛</span>
        </div>
        <div className="p-5 space-y-3">
          {mockData.competitions.map(c => (
            <div key={c.id} className="p-3 rounded-lg border border-slate-100 hover:border-purple-200 transition-colors">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  c.level === "省级" ? "bg-red-50 text-red-600" :
                  c.level === "市级" ? "bg-purple-50 text-purple-600" :
                  "bg-blue-50 text-blue-600"
                }`}>{c.level}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{c.subTitle}</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1 text-slate-500"><Users className="w-3 h-3" />{c.students}人</div>
                <div className="flex items-center gap-1 text-slate-500"><UserCheck className="w-3 h-3" />教练：{c.coach}</div>
                <div className="flex items-center gap-1 text-slate-500"><Calendar className="w-3 h-3" />{c.date}</div>
                <div className="flex items-center gap-1 text-slate-500"><Trophy className="w-3 h-3" />{c.awards}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-50">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.status === "集训中" ? "bg-red-50 text-red-600" :
                  c.status === "备赛中" ? "bg-amber-50 text-amber-600" :
                  "bg-green-50 text-green-600"
                }`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 就业统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-green-500" />就业去向分布
          </h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={mockData.employmentStats.destinations.map((d, i) => ({ ...d, color: COLORS[i] }))} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {mockData.employmentStats.destinations.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mb-3">
            <div className="text-xs text-slate-500 mt-2">近三年就业率</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {["2023", "2024", "2025"].map((y, i) => (
                <span key={y} className="text-xs font-bold text-green-600">
                  {[mockData.employmentStats.rate2023, mockData.employmentStats.rate2024, mockData.employmentStats.rate2025][i]}%
                  {i < 2 ? " →" : ""}
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-1.5">主要去向</div>
          {mockData.employmentStats.topEnterprises.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-600">{e.name}</span>
              <span className="text-slate-400">{e.note}</span>
              <span className="text-slate-800 font-medium w-8 text-right">{e.hires}人</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEM教务 + 实训室排课 + 教师工作量 + 经费 */}
      <div className="space-y-6">
        {/* STEM教务管理 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-blue-500" />STEM 教务管理
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">仅管理STEM实训课程 · 不含文化课与学籍管理</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {mockData.academic.currentSemester} · {mockData.academic.totalClasses}个实训班 · 周课时{mockData.academic.weeklySessions}节
            </p>
          </div>
          <div className="p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">STEM 实训课程排布</h4>
            {mockData.academic.courses.map((co, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 font-medium truncate">{co.name}</p>
                  <p className="text-slate-400">{co.grade} · {co.teacher} · {co.room}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-slate-600">{co.students}人</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-400">{co.sessions}节/周</span>
                    <span className="text-xs px-1 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">实训{co.labHours}节</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 实训室排课统计 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-orange-500" />实训室排课统计
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {mockData.academic.labSchedule.map((lab, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{lab.lab}</span>
                  <span className="text-slate-400">{lab.note}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-orange-500" style={{ width: lab.utilization + '%' }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">{lab.utilization}%</span>
                </div>
                <span className="text-xs text-slate-400 w-16 text-right">{lab.usedSlots}/{lab.weeklySlots}节</span>
              </div>
            ))}
          </div>
        </div>

        {/* 教师工作量 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-purple-500" />STEM教师工作量
            </h3>
          </div>
          <div className="p-5 space-y-2">
            {mockData.academic.teacherWorkload.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50">
                <span className="text-slate-700 font-medium">{w.name}</span>
                <span className="text-slate-400">{w.courses}门课 · {w.classes}</span>
                <span className="text-slate-600 font-medium">{w.weeklyHours}节/周</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${workloadColor(w.load)}`}>{w.load}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 年度经费 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">年度经费概览</h3>
          </div>
          <div className="p-5">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-slate-800">¥{(mockData.budgetOverview.annual / 10000).toFixed(0)}万</div>
              <div className="text-xs text-slate-500 mt-1">年度总预算</div>
            </div>
            <div className="space-y-2.5">
              {mockData.budgetOverview.items.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="text-slate-800 font-semibold">¥{(item.amount / 10000).toFixed(1)}万</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">已支出 <span className="font-semibold text-slate-700">¥{(mockData.budgetOverview.spent / 10000).toFixed(0)}万</span></span>
              <span className="text-emerald-600 font-semibold">剩余 ¥{(mockData.budgetOverview.remaining / 10000).toFixed(1)}万</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
