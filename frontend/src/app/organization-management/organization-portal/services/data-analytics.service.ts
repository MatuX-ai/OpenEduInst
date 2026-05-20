/**
 * 数据看板与 BI 分析服务
 *
 * @fileoverview 提供经营数据统计、趋势分析、报表生成等业务逻辑
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { generateBusinessOverview, generateDataWarnings } from '../mock-data-enhancements';
import {
  BarChartData,
  BusinessOverview,
  ChartTrendData,
  CourseStats,
  CustomReport,
  DataWarning,
  FinanceStats,
  PerformanceForecast,
  PieChartData,
  PopularCourse,
  StudentStats,
  TeacherPerformance,
  TeacherStats,
} from '../models/data-analytics.models';

@Injectable({ providedIn: 'root' })
export class DataAnalyticsService {
  // Mock 经营总览数据 - 动态生成
  private overview: BusinessOverview = generateBusinessOverview() as BusinessOverview;

  // Mock 学员统计数据
  private studentStats: StudentStats = {
    totalStudents: 1258,
    newStudentsThisMonth: 86,
    graduatedStudents: 342,
    inactiveStudents: 45,
    studentGrowthRate: 8.2,
    retentionRate: 92.5,
    averageAttendance: 88.6,
    gradeDistribution: [
      { grade: '小学', count: 356, percentage: 28.3 },
      { grade: '初中', count: 434, percentage: 34.5 },
      { grade: '高中', count: 398, percentage: 31.6 },
      { grade: '其他', count: 70, percentage: 5.6 },
    ],
    statusDistribution: [
      { status: 'active', label: '在读', count: 1089, percentage: 86.6, color: '#4caf50' },
      { status: 'inactive', label: '暂停', count: 45, percentage: 3.6, color: '#ff9800' },
      { status: 'graduated', label: '已毕业', count: 124, percentage: 9.8, color: '#2196f3' },
    ],
  };

  // Mock 教师统计数据
  private teacherStats: TeacherStats = {
    totalTeachers: 68,
    activeTeachers: 62,
    onLeaveTeachers: 6,
    averageRating: 4.6,
    totalClasses: 2458,
    topTeachers: [
      {
        id: 1,
        name: '张老师',
        department: '机器人教研室',
        courseCount: 24,
        studentCount: 456,
        rating: 4.9,
        attendanceRate: 98.5,
        revenue: 285000,
        rank: 1,
        rankChange: 0,
      },
      {
        id: 2,
        name: '李老师',
        department: '人工智能教研室',
        courseCount: 22,
        studentCount: 423,
        rating: 4.8,
        attendanceRate: 97.2,
        revenue: 268000,
        rank: 2,
        rankChange: 1,
      },
      {
        id: 3,
        name: '王老师',
        department: '编程教研室',
        courseCount: 20,
        studentCount: 398,
        rating: 4.7,
        attendanceRate: 96.8,
        revenue: 245000,
        rank: 3,
        rankChange: -1,
      },
    ],
    departmentDistribution: [
      { department: '机器人教研室', count: 15, percentage: 22.1 },
      { department: '人工智能教研室', count: 12, percentage: 17.6 },
      { department: '编程教研室', count: 14, percentage: 20.6 },
      { department: '科学实验部', count: 10, percentage: 14.7 },
      { department: '其他', count: 17, percentage: 25.0 },
    ],
  };

  // Mock 课程统计数据
  private courseStats: CourseStats = {
    totalCourses: 156,
    runningCourses: 124,
    completedCourses: 32,
    popularCourses: [
      {
        id: 1,
        name: '机器人编程基础',
        type: '机器人',
        studentCount: 456,
        revenue: 285000,
        rating: 4.9,
        growth: 15.6,
        rank: 1,
        rankChange: 0,
      },
      {
        id: 2,
        name: 'AI人工智能入门',
        type: '人工智能',
        studentCount: 423,
        revenue: 268000,
        rating: 4.8,
        growth: 12.3,
        rank: 2,
        rankChange: 1,
      },
      {
        id: 3,
        name: 'Python编程进阶',
        type: '编程',
        studentCount: 398,
        revenue: 245000,
        rating: 4.7,
        growth: 8.9,
        rank: 3,
        rankChange: -1,
      },
    ],
    courseTypeDistribution: [
      { type: '机器人', count: 45, percentage: 28.8, revenue: 856000 },
      { type: '人工智能', count: 38, percentage: 24.4, revenue: 723000 },
      { type: '编程', count: 32, percentage: 20.5, revenue: 612000 },
      { type: '科学实验', count: 24, percentage: 15.4, revenue: 458000 },
      { type: '其他', count: 17, percentage: 10.9, revenue: 325000 },
    ],
    averagePrice: 6500,
    totalRevenue: 2974000,
  };

  // Mock 财务统计数据
  private financeStats: FinanceStats = {
    monthlyRevenue: 856000,
    monthlyExpense: 425000,
    monthlyProfit: 431000,
    profitMargin: 50.4,
    receivables: 125000,
    revenueTrend: [
      { period: '1 月', revenue: 680000, expense: 380000, profit: 300000 },
      { period: '2 月', revenue: 720000, expense: 395000, profit: 325000 },
      { period: '3 月', revenue: 785000, expense: 410000, profit: 375000 },
      { period: '4 月', revenue: 820000, expense: 420000, profit: 400000 },
      { period: '5 月', revenue: 856000, expense: 425000, profit: 431000 },
    ],
    expenseTrend: [
      { period: '1 月', revenue: 680000, expense: 380000, profit: 300000 },
      { period: '2 月', revenue: 720000, expense: 395000, profit: 325000 },
      { period: '3 月', revenue: 785000, expense: 410000, profit: 375000 },
      { period: '4 月', revenue: 820000, expense: 420000, profit: 400000 },
      { period: '5 月', revenue: 856000, expense: 425000, profit: 431000 },
    ],
    categoryDistribution: [
      { category: '教师薪酬', amount: 285000, percentage: 67.1, color: '#4caf50' },
      { category: '场地租金', amount: 85000, percentage: 20.0, color: '#ff9800' },
      { category: '教学设备', amount: 35000, percentage: 8.2, color: '#2196f3' },
      { category: '其他支出', amount: 20000, percentage: 4.7, color: '#9c27b0' },
    ],
  };

  // Mock 预警数据 - 动态生成
  private warnings: DataWarning[] = generateDataWarnings(5) as DataWarning[];

  constructor() {}

  /**
   * 获取经营总览
   */
  getBusinessOverview(): Observable<BusinessOverview> {
    return of(this.overview);
  }

  /**
   * 获取学员统计
   */
  getStudentStats(): Observable<StudentStats> {
    return of(this.studentStats);
  }

  /**
   * 获取教师统计
   */
  getTeacherStats(): Observable<TeacherStats> {
    return of(this.teacherStats);
  }

  /**
   * 获取课程统计
   */
  getCourseStats(): Observable<CourseStats> {
    return of(this.courseStats);
  }

  /**
   * 获取财务统计
   */
  getFinanceStats(): Observable<FinanceStats> {
    return of(this.financeStats);
  }

  /**
   * 获取教师绩效排行
   */
  getTeacherPerformanceRanking(limit?: number): Observable<TeacherPerformance[]> {
    let result = [...this.teacherStats.topTeachers];
    if (limit) {
      result = result.slice(0, limit);
    }
    return of(result);
  }

  /**
   * 获取热门课程排行
   */
  getPopularCourses(limit?: number): Observable<PopularCourse[]> {
    let result = [...this.courseStats.popularCourses];
    if (limit) {
      result = result.slice(0, limit);
    }
    return of(result);
  }

  /**
   * 获取收入趋势数据
   */
  getRevenueTrend(periods?: number): Observable<ChartTrendData> {
    const data = this.financeStats.revenueTrend;
    const slicedData = periods ? data.slice(-periods) : data;

    return of({
      labels: slicedData.map((d) => d.period),
      datasets: [
        {
          label: '收入',
          data: slicedData.map((d) => d.revenue),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: '支出',
          data: slicedData.map((d) => d.expense),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: '利润',
          data: slicedData.map((d) => d.profit),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  /**
   * 获取年级分布饼图数据
   */
  getGradeDistributionPieChart(): Observable<PieChartData> {
    const distribution = this.studentStats.gradeDistribution;

    return of({
      labels: distribution.map((d) => d.grade),
      datasets: [
        {
          data: distribution.map((d) => d.count),
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'],
          borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff'],
        },
      ],
    });
  }

  /**
   * 获取课程类型柱状图数据
   */
  getCourseTypeBarChart(): Observable<BarChartData> {
    const distribution = this.courseStats.courseTypeDistribution;

    return of({
      labels: distribution.map((d) => d.type),
      datasets: [
        {
          label: '课程数量',
          data: distribution.map((d) => d.count),
          backgroundColor: '#4caf50',
          borderColor: '#388e3c',
          borderWidth: 1,
        },
        {
          label: '收入',
          data: distribution.map((d) => d.revenue / 10000), // 转换为万元
          backgroundColor: '#2196f3',
          borderColor: '#1976d2',
          borderWidth: 1,
        },
      ],
    });
  }

  /**
   * 获取部门分布饼图数据
   */
  getDepartmentDistributionPieChart(): Observable<PieChartData> {
    const distribution = this.teacherStats.departmentDistribution;

    return of({
      labels: distribution.map((d) => d.department),
      datasets: [
        {
          data: distribution.map((d) => d.count),
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'],
          borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff'],
        },
      ],
    });
  }

  /**
   * 获取预警列表
   */
  getWarnings(unreadOnly?: boolean): Observable<DataWarning[]> {
    let result = [...this.warnings];
    if (unreadOnly) {
      result = result.filter((w) => !w.isRead);
    }
    return of(result);
  }

  /**
   * 标记预警为已读
   */
  markWarningAsRead(warningId: number): Observable<boolean> {
    const warning = this.warnings.find((w) => w.id === warningId);
    if (warning) {
      warning.isRead = true;
    }
    return of(true);
  }

  /**
   * 获取业绩预测
   */
  getPerformanceForecast(period?: string): Observable<PerformanceForecast> {
    return of({
      period: period ?? '下月',
      predictedRevenue: 920000,
      predictedStudents: 1350,
      confidence: 0.85,
      factors: [
        {
          name: '招生季节',
          impact: 'positive',
          weight: 0.4,
          description: '即将进入招生旺季',
        },
        {
          name: '市场竞争',
          impact: 'negative',
          weight: 0.3,
          description: '新竞争对手出现',
        },
        {
          name: '教学质量',
          impact: 'positive',
          weight: 0.3,
          description: '学员满意度持续提升',
        },
      ],
    });
  }

  /**
   * 获取自定义报表列表
   */
  getCustomReports(): Observable<CustomReport[]> {
    return of([
      {
        id: 1,
        name: '月度经营报表',
        description: '包含所有关键指标的月度汇总',
        type: 'summary',
        metrics: ['revenue', 'students', 'courses', 'profit'],
        dimensions: ['time', 'department'],
        filters: [],
        chartType: 'mixed',
        refreshInterval: 3600,
        isPublic: true,
        createdBy: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  /**
   * 创建自定义报表
   */
  createCustomReport(
    report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<CustomReport> {
    const newReport: CustomReport = {
      ...report,
      id: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return of(newReport);
  }

  /**
   * 导出数据报表
   */
  exportReport(_reportId: number, _format: 'excel' | 'csv' | 'pdf'): Observable<Blob> {
    // Mock 导出功能
    return of(new Blob(['Mock data'], { type: 'application/vnd.ms-excel' }));
  }
}
