import Link from "next/link";
import { Heart, Star, Eye, Send, MessageCircle } from "lucide-react";
import { mockData } from "../_data";

export default function StudentCommunity() {
  return (
    <div id="section-community" className="space-y-4">
      {/* 社区标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            社团作品墙
          </h2>
          <p className="text-xs text-slate-500 mt-1">同学们的作品展示和互动社区，每个作品背后都是一个孩子的奇思妙想</p>
        </div>
        <Link href="/demo/k12" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <Send className="w-3.5 h-3.5" />
          发布作品
        </Link>
      </div>

      {/* 精选作品（置顶） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockData.featuredWorks.map((work) => (
          <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
            <div className={"relative h-32 bg-gradient-to-br " + work.coverColor + " flex items-center justify-center"}>
              <span className="text-5xl drop-shadow-lg">{work.coverIcon}</span>
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400/90 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                <Star className="w-3 h-3 fill-white" />
                精选
              </div>
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                {work.club}
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-1.5 line-clamp-1">{work.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{work.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {work.tags.map((tag, ti) => (
                  <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                    {work.authorAvatar}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-700">{work.author}</p>
                    <p className="text-[10px] text-slate-400">{work.grade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{work.views}</span>
                  <span className="flex items-center gap-1 text-rose-400"><Heart className="w-3 h-3" />{work.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{work.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 全部作品网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {mockData.studentWorks.map((work) => (
          <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
            <div className={"relative h-28 bg-gradient-to-br " + work.coverColor + " flex items-center justify-center"}>
              <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform">{work.coverIcon}</span>
              <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                {work.club}
              </div>
            </div>
            <div className="p-3.5">
              <h4 className="text-xs font-semibold text-slate-800 mb-1 line-clamp-1">{work.title}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5">{work.description}</p>
              <div className="flex flex-wrap gap-1 mb-2.5">
                {work.tags.map((tag, ti) => (
                  <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white text-[9px] font-semibold">
                    {work.authorAvatar}
                  </div>
                  <span className="text-[10px] text-slate-600">{work.author}</span>
                  <span className="text-[9px] text-slate-400">{work.time}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5 hover:text-rose-500 transition-colors"><Heart className="w-3 h-3" />{work.likes}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{work.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 社区底部提示 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <span>共 <strong className="text-slate-700">9</strong> 件作品 · 期待更多同学来分享！</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">本周最活跃社团：</span>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">Arduino创客社</span>
        </div>
      </div>
    </div>
  );
}
