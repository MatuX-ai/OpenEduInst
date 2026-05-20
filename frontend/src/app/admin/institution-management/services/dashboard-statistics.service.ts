/**
 * Dashboard Statistics Service
 *
 * 提供机构仪表盘统计数据服务
 * 包括学生、教师、课程等维度的统计和趋势分析
 *
 * @author iMatu Development Team
 * @version 1.0.0
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * 统计数据汇总
 */
export interface DashboardStatisticsSummary {
  /** 学生总数 */
  totalStudents: number;
  /** 教师总数 */
  totalTeachers: number;
  /** 课程总数 */
  totalCourses: number;
  /** 活跃许可证数量 */
  activeLicenses: number;
  /** 本月收入 */
  revenueThisMonth: number;
  /** 平均出勤率 */
  averageAttendanceRate?: number;
  /** 课程完成率 */
  courseCompletionRate?: number;
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  /** 日期 */
  date: string;
  /** 数值 */
  value: number;
  /** 标签 (可选) */
  label?: string;
}

/**
 * 饼图数据项
 */
export interface PieChartData {
  /** 名称 */
  name: string;
  /** 数值 */
  value: number;
  /** 百分比 */
  percentage?: number;
}

/**
 * 趋势数据
 */
export interface TrendData {
  /** 学生增长趋势 */
  studentGrowth: ChartDataPoint[];
  /** 收入趋势 */
  revenueTrend: ChartDataPoint[];
  /** 课程报名趋势 */
  courseEnrollment: ChartDataPoint[];
}

/**
 * 分布数据
 */
export interface DistributionData {
  /** 学生年级分布 */
  studentByGrade: PieChartData[];
  /** 课程类型分布 */
  courseByCategory: PieChartData[];
  /** 教师科目分布 */
  teacherBySubject?: PieChartData[];
}

/**
 * 完整的仪表盘统计数据
 */
export interface DashboardStatistics {
  /** 汇总数据 */
  summary: DashboardStatisticsSummary;
  /** 趋势数据 */
  trends: TrendData;
  /** 分布数据 */
  distributions: DistributionData;
  /** 最近活动 */
  recentActivities?: unknown[];
  /** 预警信息 */
  alerts?: unknown[];
}

/**
 * 查询参数
 */
export interface StatisticsQueryParams {
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 时间维度 (day/week/month) */
  timeDimension?: 'day' | 'week' | 'month';
  /** 数据点数限制 */
  limit?: number;
}

const USE_MOCK_DATA = true;

@Injectable({
  providedIn: 'root',
})
export class DashboardStatisticsService {
  private readonly API_BASE_URL = '/api/v1/organizations';

  constructor(private http: HttpClient) {}

  /**
   * 获取仪表盘完整统计数据
   * @param orgId 机构 ID
   * @param params 查询参数
   */
  getDashboardStatistics(
    orgId: number,
    params?: StatisticsQueryParams
  ): Observable<DashboardStatistics> {
    if (USE_MOCK_DATA) {
      return of(this.generateMockStatistics(orgId)).pipe(delay(800));
    }

    let httpParams = new HttpParams();
    if (params?.startDate) {
      httpParams = httpParams.set('start_date', params.startDate);
    }
    if (params?.endDate) {
      httpParams = httpParams.set('end_date', params.endDate);
    }
    if (params?.timeDimension) {
      httpParams = httpParams.set('time_dimension', params.timeDimension);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<DashboardStatistics>(
      `${this.API_BASE_URL}/${orgId}/dashboard/statistics`,
      { params: httpParams }
    );
  }

  /**
   * 获取学生增长数据
   * @param orgId 机构 ID
   * @param days 天数 (默认 30 天)
   */
  getStudentGrowthData(orgId: number, days: number = 30): Observable<ChartDataPoint[]> {
    if (USE_MOCK_DATA) {
      return of(this.generateMockStudentGrowth(days)).pipe(delay(600));
    }

    const params = new HttpParams().set('days', days.toString()).set('type', 'student_growth');

    return this.http.get<ChartDataPoint[]>(`${this.API_BASE_URL}/${orgId}/statistics/growth`, {
      params,
    });
  }

  /**
   * 获取收入趋势数据
   * @param orgId 机构 ID
   * @param months 月数 (默认 12 个月)
   */
  getRevenueTrendData(orgId: number, months: number = 12): Observable<ChartDataPoint[]> {
    if (USE_MOCK_DATA) {
      return of(this.generateMockRevenueTrend(months)).pipe(delay(600));
    }

    const params = new HttpParams().set('months', months.toString()).set('type', 'revenue_trend');

    return this.http.get<ChartDataPoint[]>(`${this.API_BASE_URL}/${orgId}/statistics/revenue`, {
      params,
    });
  }

  /**
   * 获取课程类型分布
   * @param orgId 机构 ID
   */
  getCourseCategoryDistribution(orgId: number): Observable<PieChartData[]> {
    if (USE_MOCK_DATA) {
      return of(this.generateMockCourseDistribution()).pipe(delay(500));
    }

    return this.http.get<PieChartData[]>(
      `${this.API_BASE_URL}/${orgId}/statistics/course-distribution`
    );
  }

  /**
   * 获取学生年级分布
   * @param orgId 机构 ID
   */
  getStudentGradeDistribution(orgId: number): Observable<PieChartData[]> {
    if (USE_MOCK_DATA) {
      return of(this.generateMockStudentGradeDistribution()).pipe(delay(500));
    }

    return this.http.get<PieChartData[]>(
      `${this.API_BASE_URL}/${orgId}/statistics/student-grade-distribution`
    );
  }

  /**
   * 生成模拟数据 - 完整统计
   */
  private generateMockStatistics(_orgId: number): DashboardStatistics {
    return {
      summary: {
        totalStudents: 1256,
        totalTeachers: 48,
        totalCourses: 126,
        activeLicenses: 89,
        revenueThisMonth: 458900,
        averageAttendanceRate: 92.5,
        courseCompletionRate: 87.3,
      },
      trends: {
        studentGrowth: this.generateMockStudentGrowth(30),
        revenueTrend: this.generateMockRevenueTrend(12),
        courseEnrollment: this.generateMockCourseEnrollment(30),
      },
      distributions: {
        studentByGrade: this.generateMockStudentGradeDistribution(),
        courseByCategory: this.generateMockCourseDistribution(),
        teacherBySubject: this.generateMockTeacherDistribution(),
      },
      recentActivities: [],
      alerts: [],
    };
  }

  /**
   * 生成模拟数据 - 学生增长
   */
  private generateMockStudentGrowth(days: number): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const baseValue = 1100;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const randomGrowth = Math.floor(Math.random() * 20) - 5;
      const value = baseValue + (days - i) * 3 + randomGrowth;

      data.push({
        date: date.toISOString().split('T')[0],
        value,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
      });
    }

    return data;
  }

  /**
   * 生成模拟数据 - 收入趋势
   */
  private generateMockRevenueTrend(months: number): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const baseRevenue = 380000;

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.2;
      const randomVar = Math.random() * 100000 - 50000;
      const value = Math.floor(baseRevenue * seasonalFactor + randomVar);

      data.push({
        date: date.toISOString().split('T')[0].substring(0, 7),
        value,
        label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    return data;
  }

  /**
   * 生成模拟数据 - 课程报名
   */
  private generateMockCourseEnrollment(days: number): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const baseValue = 80;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.5 : 1;
      const randomVar = Math.floor(Math.random() * 30 - 10);
      const value = Math.floor(baseValue * weekendFactor + randomVar);

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, value),
        label: `${date.getMonth() + 1}/${date.getDate()}`,
      });
    }

    return data;
  }

  /**
   * 生成模拟数据 - 课程类型分布
   */
  private generateMockCourseDistribution(): PieChartData[] {
    const categories = [
      { name: '编程', value: 35 },
      { name: '美术', value: 25 },
      { name: '音乐', value: 15 },
      { name: '体育', value: 12 },
      { name: '科学', value: 8 },
      { name: '其他', value: 5 },
    ];

    const total = categories.reduce((sum, item) => sum + item.value, 0);

    return categories.map((item) => ({
      ...item,
      percentage: +((item.value / total) * 100).toFixed(1),
    }));
  }

  /**
   * 生成模拟数据 - 学生年级分布
   */
  private generateMockStudentGradeDistribution(): PieChartData[] {
    const grades = [
      { name: '小学一年级', value: 120 },
      { name: '小学二年级', value: 135 },
      { name: '小学三年级', value: 142 },
      { name: '小学四年级', value: 138 },
      { name: '小学五年级', value: 145 },
      { name: '小学六年级', value: 150 },
      { name: '初中一年级', value: 156 },
      { name: '初中二年级', value: 148 },
      { name: '初中三年级', value: 122 },
    ];

    const total = grades.reduce((sum, item) => sum + item.value, 0);

    return grades.map((item) => ({
      ...item,
      percentage: +((item.value / total) * 100).toFixed(1),
    }));
  }

  /**
   * 生成模拟数据 - 教师科目分布
   */
  private generateMockTeacherDistribution(): PieChartData[] {
    const subjects = [
      { name: '编程', value: 12 },
      { name: '美术', value: 8 },
      { name: '音乐', value: 6 },
      { name: '体育', value: 7 },
      { name: '科学', value: 5 },
      { name: '数学', value: 4 },
      { name: '英语', value: 3 },
      { name: '其他', value: 3 },
    ];

    const total = subjects.reduce((sum, item) => sum + item.value, 0);

    return subjects.map((item) => ({
      ...item,
      percentage: +((item.value / total) * 100).toFixed(1),
    }));
  }
}
