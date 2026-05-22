import { Wrench, UserCheck, Award, BookOpen } from "lucide-react";
import { mockData } from "../_data";

export default function FeatureCards() {
  const cards = [
    {
      icon: Wrench, bg: "from-orange-500 to-red-600", label: "设备调配",
      sub: mockData.equipmentPool.crossSchoolShare.thisMonth + "次跨校共享",
      desc: "全县设备统一采购 → 按需配发 → 跨校流转",
      highlight: mockData.equipmentPool.pendingRequests.length + "所学校待配发",
      color: "orange",
    },
    {
      icon: UserCheck, bg: "from-blue-500 to-blue-700", label: "师资培训",
      sub: "已完成" + mockData.teacherTraining.completionRate + "%",
      desc: "县城集训 + 线上课程 + 送教下乡",
      highlight: mockData.teacherTraining.sessions.length + "场培训进行中",
      color: "blue",
    },
    {
      icon: Award, bg: "from-red-500 to-red-700", label: "竞赛组织",
      sub: "年度获奖" + mockData.stats.competitionAwards + "项",
      desc: "县级选拔 → 市级推荐 → 省级参赛",
      highlight: mockData.competitions.upcoming.length + "场赛事待办",
      color: "red",
    },
    {
      icon: BookOpen, bg: "from-green-500 to-green-700", label: "课程共享",
      sub: mockData.curriculum.totalCourses + "门共享课程",
      desc: "优秀教案全县共享，薄弱校可直接使用",
      highlight: mockData.curriculum.sharedSchools + "所学校在下载",
      color: "green",
    },
  ];

  return (
    <div id="section-equipment" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className={"w-10 h-10 rounded-lg bg-gradient-to-br " + card.bg + " flex items-center justify-center"}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">{card.label}</h4>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">{card.desc}</p>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-600 font-medium flex items-center gap-1">
            <span className={"w-1.5 h-1.5 rounded-full bg-" + (card.color === "orange" ? "amber" : card.color) + "-500"} />
            {card.highlight} →
          </div>
        </div>
      ))}
    </div>
  );
}
