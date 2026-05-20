/**
 * 数据看板与 BI 分析数据模型
 *
 * @fileoverview 定义经营数据、统计分析、趋势预测等接口
 * @author AI Assistant
 * @date 2026-04-02
 */

// ==================== 核心统计接口 ====================

/**
 * 经营数据总览
 */
export interface BusinessOverview {
  totalStudents: number; // 学员总数
  activeStudents: number; // 在读学员
  totalTeachers: number; // 教师总数
  activeTeachers: number; // 在职教师
  totalCourses: number; // 课程总数
  runningCourses: number; // 进行中课程
  monthlyRevenue: number; // 本月收入
  monthlyGrowth: number; // 月度增长率（%）
  yearlyRevenue: number; // 年度总收入
  yearlyGrowth: number; // 年度增长率（%）
  averageClassSize: number; // 平均班级人数
  classroomUtilization: number; // 教室使用率（%）
  lastUpdated: string;
}

/**
 * 学员统计数据
 */
export interface StudentStats {
  totalStudents: number;
  newStudentsThisMonth: number; // 本月新增
  graduatedStudents: number; // 已毕业
  inactiveStudents: number; // 暂停学习
  studentGrowthRate: number; // 学员增长率
  retentionRate: number; // 续费率
  averageAttendance: number; // 平均出勤率
  gradeDistribution: GradeDistribution[];
  statusDistribution: StatusDistribution[];
}

/**
 * 年级分布
 */
export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

/**
 * 状态分布
 */
export interface StatusDistribution {
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * 教师统计数据
 */
export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  onLeaveTeachers: number;
  averageRating: number; // 平均评分
  totalClasses: number; // 总课时
  topTeachers: TeacherPerformance[];
  departmentDistribution: DepartmentDistribution[];
}

/**
 * 部门分布
 */
export interface DepartmentDistribution {
  department: string;
  count: number;
  percentage: number;
}

/**
 * 教师绩效排行
 */
export interface TeacherPerformance {
  id: number;
  name: string;
  department: string;
  courseCount: number;
  studentCount: number;
  rating: number;
  attendanceRate: number;
  revenue: number; // 创造收入
  avatar?: string;
  rank: number;
  rankChange: number; // 排名变化（+上升 -下降 0 不变）
}

/**
 * 课程统计数据
 */
export interface CourseStats {
  totalCourses: number;
  runningCourses: number;
  completedCourses: number;
  popularCourses: PopularCourse[];
  courseTypeDistribution: CourseTypeDistribution[];
  averagePrice: number;
  totalRevenue: number;
}

/**
 * 热门课程
 */
export interface PopularCourse {
  id: number;
  name: string;
  type: string;
  studentCount: number;
  revenue: number;
  rating: number;
  growth: number; // 增长率
  rank: number;
  rankChange: number;
}

/**
 * 课程类型分布
 */
export interface CourseTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  revenue: number;
}

/**
 * 财务统计数据
 */
export interface FinanceStats {
  monthlyRevenue: number;
  monthlyExpense: number;
  monthlyProfit: number;
  profitMargin: number; // 利润率
  receivables: number; // 待收款
  revenueTrend: TrendDataPoint[];
  expenseTrend: TrendDataPoint[];
  categoryDistribution: CategoryDistribution[];
}

/**
 * 收支趋势数据点
 */
export interface TrendDataPoint {
  period: string; // 月份或周
  revenue: number;
  expense: number;
  profit: number;
}

/**
 * 分类分布
 */
export interface CategoryDistribution {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

// ==================== 图表数据接口 ====================

/**
 * 趋势图表数据
 */
export interface ChartTrendData {
  labels: string[]; // X 轴标签（时间）
  datasets: ChartDataset[];
}

/**
 * 图表数据集
 */
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number; // 曲线平滑度
}

/**
 * 饼图数据
 */
export interface PieChartData {
  labels: string[];
  datasets: PieChartDataset[];
}

/**
 * 饼图数据集
 */
export interface PieChartDataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
}

/**
 * 柱状图数据
 */
export interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

/**
 * 柱状图数据集
 */
export interface BarChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

// ==================== 预警与预测接口 ====================

/**
 * 数据预警
 */
export interface DataWarning {
  id: number;
  type: WarningType;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric: string; // 指标名称
  currentValue: number; // 当前值
  thresholdValue: number; // 阈值
  suggestedAction: string; // 建议操作
  createdAt: string;
  isRead: boolean;
}

/**
 * 预警类型
 */
export type WarningType =
  | 'revenue_decline' // 收入下降
  | 'student_loss' // 学员流失
  | 'low_attendance' // 低出勤率
  | 'teacher_shortage' // 教师短缺
  | 'classroom_conflict' // 教室冲突
  | 'receivable_overdue'; // 应收逾期

/**
 * 业绩预测
 */
export interface PerformanceForecast {
  period: string; // 预测周期
  predictedRevenue: number; // 预测收入
  predictedStudents: number; // 预测学员数
  confidence: number; // 置信度（0-1）
  factors: ForecastFactor[];
}

/**
 * 预测影响因素
 */
export interface ForecastFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 影响权重
  description: string;
}

// ==================== 报表接口 ====================

/**
 * 自定义报表
 */
export interface CustomReport {
  id: number;
  name: string;
  description?: string;
  type: ReportType;
  metrics: string[]; // 指标列表
  dimensions: string[]; // 维度列表
  filters: ReportFilter[];
  chartType: ChartType; // 图表类型
  refreshInterval: number; // 刷新间隔（秒）
  isPublic: boolean; // 是否公开
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 报表类型
 */
export type ReportType =
  | 'summary' // 汇总报表
  | 'detail' // 明细报表
  | 'comparison' // 对比报表
  | 'trend'; // 趋势报表

/**
 * 报表筛选条件
 */
export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | number | boolean | Array<string | number> | null;
}

/**
 * 图表类型
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'table' | 'card' | 'mixed';

// ==================== 辅助接口 ====================

/**
 * 时间范围
 */
export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * 报表查询参数
 */
export interface ReportQueryParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  dimensions?: string[];
  filters?: ReportFilter[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 数据导出选项
 */
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf' | 'image';
  includeCharts: boolean;
  includeSummary: boolean;
  filename?: string;
}
