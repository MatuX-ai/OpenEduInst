// ====== 梅山县教育局 · STEM 教育监管平台 Mock Data ======

export const mockData = {
  institution: { name: "梅山县教育局", fullName: "梅山县教育局 · STEM 教育监管平台", type: "bureau", location: "中部某县城", note: "统筹全县中小学校STEM教育发展 · 推动教育资源均衡配置" },
  user: { name: "陈国华", role: "基教科科长", subRole: "分管STEM教育", avatar: "陈", yearsService: 12, bio: "从教研室做起，推动全县STEM教育从零起步到25所学校全覆盖" },
  stats: {
    totalSchools: 25, schoolChange: 3,
    stemStudents: 8470, studentChange: 12.5,
    stemTeachers: 186, teacherChange: 8.7,
    stemCoverage: 76, coverageChange: 8.3,
    annualBudget: 3800000, budgetUnit: "万元",
    competitionAwards: 34, awardChange: 6,
  },
  // 学校STEM教育质量评估
  schoolRanking: [
    { name: "梅山县第一中学", type: "高中", stemScore: 88, students: 620, status: "优秀", equipment: "充足", keyStrength: "机器人竞赛强校，省级获奖", warning: null },
    { name: "梅山县第二中学", type: "初中", stemScore: 85, students: 480, status: "优秀", equipment: "充足", keyStrength: "创客项目丰富，社团活跃", warning: null },
    { name: "梅山县实验小学", type: "小学", stemScore: 82, students: 350, status: "良好", equipment: "充足", keyStrength: "3D打印/编程启蒙领先", warning: null },
    { name: "梅山县职业技术学校", type: "职校", stemScore: 80, students: 826, status: "良好", equipment: "基本满足", keyStrength: "校企合作紧密，孵化器活跃", warning: null },
    { name: "城关镇初级中学", type: "初中", stemScore: 75, students: 420, status: "良好", equipment: "基本满足", keyStrength: "电子制作/焊接实训扎实", warning: null },
    { name: "梅山县第三中学", type: "高中", stemScore: 72, students: 380, status: "良好", equipment: "紧缺", keyStrength: "学科竞赛有突破", warning: "设备紧缺" },
    { name: "青山镇中心学校", type: "九年一贯制", stemScore: 65, students: 280, status: "待提升", equipment: "紧缺", keyStrength: "教师积极性高", warning: "设备紧缺" },
    { name: "龙湾乡中心学校", type: "九年一贯制", stemScore: 58, students: 180, status: "薄弱", equipment: "严重不足", keyStrength: "学生兴趣浓厚", warning: "重点帮扶" },
    { name: "白沙镇初级中学", type: "初中", stemScore: 62, students: 310, status: "待提升", equipment: "紧缺", keyStrength: "已申请设备配发", warning: "设备紧缺" },
    { name: "石桥乡中心小学", type: "小学", stemScore: 55, students: 150, status: "薄弱", equipment: "严重不足", keyStrength: "新配创客教室待启用", warning: "重点帮扶" },
  ],
  coverageTrend: [
    { month: "9月", rate: 62 }, { month: "10月", rate: 66 }, { month: "11月", rate: 68 },
    { month: "12月", rate: 71 }, { month: "1月", rate: 74 }, { month: "2月", rate: 76 },
  ],
  schoolTypes: [
    { name: "小学", count: 12, color: "#10b981" },
    { name: "初中", count: 8, color: "#3b82f6" },
    { name: "高中", count: 3, color: "#f59e0b" },
    { name: "职校", count: 2, color: "#8b5cf6" },
  ],
  // ====== STEM设备配发与跨校调配 ======
  equipmentPool: {
    totalValue: 4860000, allocated: 3520000, inTransit: 480000, toApprove: 860000,
    crossSchoolShare: { thisMonth: 8, total: 35, desc: "跨校借用次数" },
    items: [
      { id: 1, name: "Arduino教学套件", total: 85, allocated: 68, inStock: 17, unit: "套", unitPrice: 1200, target: "已配发12所学校" },
      { id: 2, name: "3D打印机", total: 22, allocated: 16, inStock: 6, unit: "台", unitPrice: 3500, target: "已配发8所学校" },
      { id: 3, name: "Micro:bit套装", total: 120, allocated: 95, inStock: 25, unit: "套", unitPrice: 380, target: "已配发15所学校" },
      { id: 4, name: "焊接工作台套装", total: 40, allocated: 30, inStock: 10, unit: "套", unitPrice: 2500, target: "已配发9所学校" },
      { id: 5, name: "传感器实验箱", total: 50, allocated: 35, inStock: 15, unit: "套", unitPrice: 3200, target: "已配发10所学校" },
      { id: 6, name: "无人机教学套装", total: 18, allocated: 10, inStock: 8, unit: "套", unitPrice: 4800, target: "已配发6所学校" },
      { id: 7, name: "机器人竞赛套装", total: 15, allocated: 12, inStock: 3, unit: "套", unitPrice: 8600, target: "已配发5所竞赛学校" },
    ],
    crossSchoolRecords: [
      { id: 1, from: "梅山县实验小学", to: "石桥乡中心小学", item: "3D打印机 x1", date: "2月16日", reason: "乡镇学校创客周活动", status: "使用中" },
      { id: 2, from: "梅山县第二中学", to: "龙湾乡中心学校", item: "Arduino套件 x3", date: "2月10日", reason: "支教交流·编程启蒙课", status: "已归还" },
      { id: 3, from: "梅山县职业技术学校", to: "青山镇中心学校", item: "焊接工作台 x2", date: "2月8日", reason: "电子制作社团支援", status: "使用中" },
      { id: 4, from: "梅山县第一中学", to: "白沙镇初级中学", item: "传感器实验箱 x1", date: "2月5日", reason: "物联网课程支援", status: "已归还" },
    ],
    pendingRequests: [
      { id: 1, school: "龙湾乡中心学校", item: "Arduino教学套件", qty: 5, reason: "新增STEM课程，零基础起步", priority: "紧急", date: "2月18日" },
      { id: 2, school: "石桥乡中心小学", item: "Micro:bit套装", qty: 10, reason: "编程启蒙课程扩班", priority: "紧急", date: "2月17日" },
      { id: 3, school: "青山镇中心学校", item: "传感器实验箱", qty: 3, reason: "九年级物理实验教学", priority: "一般", date: "2月15日" },
      { id: 4, school: "梅山县第三中学", item: "3D打印机", qty: 2, reason: "创客空间扩容", priority: "一般", date: "2月12日" },
    ],
  },
  // ====== 师资培训 ======
  teacherTraining: {
    trainedThisYear: 86, totalTarget: 186, completionRate: 46,
    sessions: [
      { id: 1, title: "Arduino编程入门培训", trainer: "市教研室·周教研员", date: "2月25日", attendees: 32, max: 40, status: "报名中", type: "线下" },
      { id: 2, title: "3D打印与创客教育", trainer: "县职校·刘主任", date: "3月5日", attendees: 28, max: 30, status: "即将开课", type: "线下" },
      { id: 3, title: "Python+Micro:bit编程教学", trainer: "省教科院·李老师", date: "3月15日", attendees: 45, max: 50, status: "报名中", type: "线上" },
    ],
    districtStats: [
      { area: "县城片区", schools: 8, trained: 42, coverage: 68 },
      { area: "城关镇片区", schools: 5, trained: 18, coverage: 52 },
      { area: "青山镇片区", schools: 4, trained: 12, coverage: 38 },
      { area: "龙湾乡片区", schools: 3, trained: 5, coverage: 22 },
      { area: "白沙镇片区", schools: 3, trained: 6, coverage: 30 },
      { area: "石桥乡片区", schools: 2, trained: 3, coverage: 20 },
    ],
  },
  // ====== 竞赛管理 ======
  competitions: {
    yearTotal: 34, national: 1, provincial: 8, municipal: 12, county: 13,
    upcoming: [
      { id: 1, name: "全县中小学生机器人竞赛", level: "县级", date: "3月20日", schools: 18, participants: 86, status: "报名中", venue: "县一中体育馆" },
      { id: 2, name: "全市青少年科技创新大赛", level: "市级", date: "4月10日", schools: 8, participants: 24, status: "作品准备", venue: "市教育局" },
      { id: 3, name: "全省中小学生信息素养提升活动", level: "省级", date: "5月15日", schools: 3, participants: 9, status: "集训中", venue: "省科技馆" },
    ],
    recentResults: [
      { id: 1, event: "全市无人机编程挑战赛", school: "梅山县第一中学", award: "一等奖", level: "市级", date: "1月" },
      { id: 2, event: "全县创客马拉松", school: "梅山县第二中学", award: "团体冠军", level: "县级", date: "1月" },
      { id: 3, event: "全市3D创意设计大赛", school: "梅山县实验小学", award: "二等奖", level: "市级", date: "12月" },
      { id: 4, event: "全省青少年机器人竞赛", school: "梅山县第一中学", award: "三等奖", level: "省级", date: "11月" },
    ],
  },
  // ====== 经费管理 ======
  budget: {
    annual: 380, spent: 212, remaining: 168, unit: "万元",
    allocation: [
      { name: "STEM设备采购配发", amount: 160, pct: 42, color: "#f59e0b" },
      { name: "创客实验室建设", amount: 80, pct: 21, color: "#3b82f6" },
      { name: "师资培训", amount: 60, pct: 16, color: "#10b981" },
      { name: "竞赛组织与资助", amount: 45, pct: 12, color: "#8b5cf6" },
      { name: "课程资源开发", amount: 25, pct: 6, color: "#ec4899" },
      { name: "其他支出", amount: 10, pct: 3, color: "#94a3b8" },
    ],
    recentExpenses: [
      { id: 1, item: "Arduino教学套件第四批采购", amount: 28, school: "配发5所学校", date: "2月", status: "已拨付" },
      { id: 2, item: "全县机器人竞赛经费", amount: 8, school: "全县18校参赛", date: "2月", status: "已拨付" },
      { id: 3, item: "青山镇学校创客实验室建设", amount: 15, school: "青山镇中心学校", date: "2月", status: "审批中" },
      { id: 4, item: "寒假STEM师资培训", amount: 12, school: "全县教师32人", date: "1月", status: "已拨付" },
    ],
  },
  // ====== 课程资源 ======
  curriculum: {
    totalCourses: 68, sharedSchools: 22,
    categories: [
      { name: "编程与计算思维", count: 18, color: "#3b82f6" },
      { name: "电子与电路", count: 14, color: "#10b981" },
      { name: "3D设计与制造", count: 12, color: "#f59e0b" },
      { name: "机器人与自动化", count: 10, color: "#ef4444" },
      { name: "科学探究与实验", count: 14, color: "#8b5cf6" },
    ],
    featured: [
      { id: 1, title: "Scratch编程·校园导航小助手", school: "梅山县实验小学", grade: "4-6年级", downloads: 156, rating: 4.8 },
      { id: 2, title: "Arduino温湿度监测系统", school: "梅山县第二中学", grade: "7-9年级", downloads: 128, rating: 4.6 },
      { id: 3, title: "3D打印·桥梁结构设计", school: "梅山县第一中学", grade: "10-12年级", downloads: 95, rating: 4.7 },
    ],
  },
  // ====== 近期动态 ======
  recentActivities: [
    { id: 1, type: "equipment", text: "第四批Arduino套件到货，配发至龙湾乡等5所学校", time: "2小时前", icon: "📦" },
    { id: 2, type: "competition", text: "全县机器人竞赛报名截止，18所学校86名学生参赛", time: "6小时前", icon: "🤖" },
    { id: 3, type: "training", text: "寒假STEM师资培训结业，32名教师通过考核", time: "1天前", icon: "🎓" },
    { id: 4, type: "cooperation", text: "石桥乡中心小学新配创客教室完成验收并投入使用", time: "2天前", icon: "🏫" },
    { id: 5, type: "report", text: "龙湾乡中心学校提交STEM设备紧急配发申请", time: "3天前", icon: "📋" },
    { id: 6, type: "achievement", text: "县一中获全市无人机编程挑战赛一等奖", time: "4天前", icon: "🏆" },
  ],
};
