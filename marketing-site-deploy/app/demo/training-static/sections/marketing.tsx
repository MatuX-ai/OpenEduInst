import { Megaphone, Users, Percent, Gift, Calendar, TrendingUp, Plus, Search } from "lucide-react";

// Mock data for campaigns
const campaigns = [
  {
    id: 1,
    name: "春季招生拼团活动",
    type: "拼团",
    status: "进行中",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    participants: 45,
    target: 60,
    conversion: "38%",
    revenue: 28500,
    description: "3人成团，每人优惠¥200"
  },
  {
    id: 2,
    name: "老带新推荐奖励",
    type: "推荐",
    status: "长期有效",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    participants: 23,
    target: 50,
    conversion: "65%",
    revenue: 18400,
    description: "推荐成功双方各得¥300优惠券"
  },
  {
    id: 3,
    name: "暑期集训营早鸟价",
    type: "优惠券",
    status: "即将开始",
    startDate: "2026-06-15",
    endDate: "2026-07-15",
    participants: 0,
    target: 80,
    conversion: "-",
    revenue: 0,
    description: "6月15日前报名享8折优惠"
  },
];

// Mock data for coupons
const coupons = [
  {
    id: 1,
    code: "NEWBIE200",
    name: "新人专享券",
    discount: "¥200",
    condition: "满¥1000可用",
    quantity: 100,
    used: 67,
    expiryDate: "2026-12-31",
    status: "有效"
  },
  {
    id: 2,
    code: "RENEW15",
    name: "续费优惠券",
    discount: "85折",
    condition: "续费课程可用",
    quantity: 50,
    used: 32,
    expiryDate: "2026-06-30",
    status: "有效"
  },
  {
    id: 3,
    code: "GROUP100",
    name: "拼团专属券",
    discount: "¥100",
    condition: "拼团成功后发放",
    quantity: 200,
    used: 89,
    expiryDate: "2026-08-31",
    status: "有效"
  },
];

export default function MarketingPage() {
  const statusColors: Record<string, string> = {
    "进行中": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "长期有效": "bg-blue-50 text-blue-600 border-blue-200",
    "即将开始": "bg-amber-50 text-amber-600 border-amber-200",
    "已结束": "bg-slate-50 text-slate-600 border-slate-200",
    "有效": "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">营销中心</h1>
          <p className="text-sm text-slate-500 mt-1">拼团活动、优惠券管理、招生推广</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          创建活动
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">本月营销收入</p>
              <p className="text-2xl font-bold text-slate-900">¥4.7万</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +32% 较上月
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">活动参与人数</p>
              <p className="text-2xl font-bold text-slate-900">68</p>
              <p className="text-xs text-blue-600 mt-1">3个活动中</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">平均转化率</p>
              <p className="text-2xl font-bold text-slate-900">51%</p>
              <p className="text-xs text-purple-600 mt-1">行业优秀水平</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">优惠券发放</p>
              <p className="text-2xl font-bold text-slate-900">188</p>
              <p className="text-xs text-slate-500 mt-1">已使用121张</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">营销活动</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {campaigns.length} 个</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索活动..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">{campaign.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[campaign.status]}`}>
                      {campaign.status}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                      {campaign.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{campaign.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">活动时间</p>
                  <p className="text-sm font-medium text-slate-900">{campaign.startDate} ~ {campaign.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">参与人数</p>
                  <p className="text-sm font-medium text-slate-900">{campaign.participants} / {campaign.target}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">转化率</p>
                  <p className="text-sm font-semibold text-emerald-600">{campaign.conversion}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">带来营收</p>
                  <p className="text-sm font-semibold text-slate-900">¥{campaign.revenue.toLocaleString()}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">目标完成度</span>
                  <span className="font-semibold text-slate-900">{Math.round((campaign.participants / campaign.target) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(campaign.participants / campaign.target) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  管理活动
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  查看数据
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coupons Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-800">优惠券管理</h2>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">共 {coupons.length} 种</span>
          </div>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建优惠券
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">优惠券名称</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">优惠内容</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">使用条件</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">发放/使用</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">有效期</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{coupon.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{coupon.code}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-amber-600">{coupon.discount}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                    {coupon.condition}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">{coupon.used}</span>
                      <span className="text-slate-500"> / {coupon.quantity}</span>
                    </div>
                    <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${(coupon.used / coupon.quantity) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                    至 {coupon.expiryDate}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[coupon.status]}`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">编辑</button>
                    <button className="text-slate-600 hover:text-slate-700 text-sm">数据</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
