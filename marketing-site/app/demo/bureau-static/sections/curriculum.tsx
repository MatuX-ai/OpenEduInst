import { BookOpen } from "lucide-react";
import { mockData } from "../_data";

export default function Curriculum() {
  const weakSchoolCourses = [
    { title: "Scratch趣味编程·入门10课", from: "县实验小学", for: "小学" },
    { title: "Arduino零基础·点亮第一颗LED", from: "县二中", for: "初中" },
    { title: "3D打印·从建模到成品", from: "县职校", for: "通用" },
  ];

  return (
    <div id="section-curriculum" className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-green-500" />
          STEM 课程资源共享池
        </h3>
        <span className="text-xs text-green-600 font-medium">
          {mockData.curriculum.totalCourses}门课程 · {mockData.curriculum.sharedSchools}所学校在共享
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        <div className="lg:col-span-2 p-5 border-r border-slate-100">
          <div className="grid grid-cols-5 gap-3 mb-5">
            {mockData.curriculum.categories.map((c) => (
              <div key={c.name} className="text-center p-3 rounded-lg border border-slate-100 hover:border-green-200 transition-colors cursor-pointer">
                <div className="text-xl font-bold" style={{ color: c.color }}>{c.count}</div>
                <div className="text-xs text-slate-500 mt-1">{c.name}</div>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">优秀课程教案</h4>
          <div className="space-y-3">
            {mockData.curriculum.featured.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-green-200 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.school} · 适用{c.grade}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-slate-400">⬇ {c.downloads}次</span>
                  <span className="text-xs text-amber-500 font-medium">★ {c.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">薄弱校课程推荐</h4>
          <div className="space-y-2">
            {weakSchoolCourses.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs font-medium text-slate-800">{r.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">来源：{r.from}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">{r.for}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">💡 提示：</span>
              龙湾乡中心学校、石桥乡中心小学可优先从共享池下载课程资源，零基础可直接使用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
