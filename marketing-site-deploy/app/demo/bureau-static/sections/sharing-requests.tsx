import { Truck, AlertTriangle } from "lucide-react";
import { mockData } from "../_data";
import { statusColor, priorityColor } from "../_utils";

export default function SharingRequests() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Truck className="w-4.5 h-4.5 text-blue-500" />
            跨校设备共享流转
          </h3>
          <span className="text-xs text-blue-600 font-medium">本月{mockData.equipmentPool.crossSchoolShare.thisMonth}次</span>
        </div>
        <div className="p-5 space-y-3">
          {mockData.equipmentPool.crossSchoolRecords.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">{r.id}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-800">{r.from}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-800">{r.to}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{r.item} · {r.reason}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{r.date}</span>
                  <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " + statusColor(r.status)}>{r.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            设备配发待处理
          </h3>
          <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">{mockData.equipmentPool.pendingRequests.length}项待处理</span>
        </div>
        <div className="p-5 space-y-3">
          {mockData.equipmentPool.pendingRequests.map((req) => (
            <div key={req.id} className="p-3 rounded-lg border border-slate-100 hover:border-red-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{req.school}</span>
                    <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " + priorityColor(req.priority)}>{req.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{req.item} x{req.qty} · {req.reason}</p>
                </div>
                <button className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex-shrink-0 ml-2">审批</button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-slate-400">{req.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
