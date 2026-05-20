/**
 * Institution Dashboard Service
 *
 * 机构仪表板数据服务
 * 提供机构统计数据、图表数据和活动记录
 *
 * @author iMatu Development Team
 * @version 1.0.0
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * 机构统计信息
 */
export interface InstitutionStatistics {
  active_licenses: number;
  total_projects: number;
  total_users: number;
  hardware_consumption: number;
  license_remaining: number;
}

/**
 * 用户增长数据点
 */
export interface UserGrowthDataPoint {
  date: string;
  value: number;
}

/**
 * 项目趋势数据点
 */
export interface ProjectTrendDataPoint {
  date: string;
  value: number;
}

/**
 * 硬件使用数据项
 */
export interface HardwareUsageItem {
  category: string;
  value: number;
  date: string;
}

/**
 * 许可证使用数据项
 */
export interface LicenseUsageItem {
  date: string;
  value: number;
}

/**
 * 图表数据集合
 */
export interface ChartData {
  user_growth_data: UserGrowthDataPoint[];
  project_trend_data: ProjectTrendDataPoint[];
  hardware_usage_data: HardwareUsageItem[];
  license_usage_data: LicenseUsageItem[];
}

/**
 * 最近活动记录
 */
export interface ActivityRecord {
  id: number;
  type: 'user_login' | 'project_created' | 'license_used' | 'hardware_access';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  icon: string; // Material 图标名称
  title: string; // 活动标题
}

/**
 * 系统告警通知
 */
export interface AlertNotification {
  id: number;
  type: 'license_expiring' | 'hardware_limit' | 'system_maintenance';
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  icon: string; // Material 图标名称
  timestamp: string; // 时间戳（用于模板显示）
}

/**
 * 仪表板完整数据
 */
export interface DashboardData {
  statistics: InstitutionStatistics;
  charts: ChartData;
  recent_activities: ActivityRecord[];
  alerts: AlertNotification[];
}

@Injectable({
  providedIn: 'root',
})
export class InstitutionDashboardService {
  private baseUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * 获取机构统计信息
   * @param institutionId 机构 ID
   * @returns 统计信息 Observable
   */
  getStatistics(institutionId: number): Observable<InstitutionStatistics> {
    const url = `${this.baseUrl}/institutions/${institutionId}/statistics`;
    return this.http.get<InstitutionStatistics>(url);
  }

  /**
   * 获取用户增长趋势数据
   * @param institutionId 机构 ID
   * @param months 月份数（默认 6 个月）
   * @returns 用户增长数据 Observable
   */
  getUserGrowthTrend(institutionId: number, months: number = 6): Observable<UserGrowthDataPoint[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/analytics/user-growth`;
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<UserGrowthDataPoint[]>(url, { params });
  }

  /**
   * 获取项目发展趋势数据
   * @param institutionId 机构 ID
   * @param months 月份数（默认 6 个月）
   * @returns 项目趋势数据 Observable
   */
  getProjectTrend(institutionId: number, months: number = 6): Observable<ProjectTrendDataPoint[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/analytics/project-trend`;
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<ProjectTrendDataPoint[]>(url, { params });
  }

  /**
   * 获取硬件使用统计
   * @param institutionId 机构 ID
   * @returns 硬件使用数据 Observable
   */
  getHardwareUsage(institutionId: number): Observable<HardwareUsageItem[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/analytics/hardware-usage`;
    return this.http.get<HardwareUsageItem[]>(url);
  }

  /**
   * 获取许可证使用情况
   * @param institutionId 机构 ID
   * @returns 许可证使用数据 Observable
   */
  getLicenseUsage(institutionId: number): Observable<LicenseUsageItem[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/analytics/license-usage`;
    return this.http.get<LicenseUsageItem[]>(url);
  }

  /**
   * 获取最近活动记录
   * @param institutionId 机构 ID
   * @param limit 记录数量（默认 10 条）
   * @returns 活动记录列表 Observable
   */
  getRecentActivities(institutionId: number, limit: number = 10): Observable<ActivityRecord[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/activities`;
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ActivityRecord[]>(url, { params });
  }

  /**
   * 获取系统告警通知
   * @param institutionId 机构 ID
   * @returns 告警通知列表 Observable
   */
  getAlerts(institutionId: number): Observable<AlertNotification[]> {
    const url = `${this.baseUrl}/institutions/${institutionId}/alerts`;
    return this.http.get<AlertNotification[]>(url);
  }

  /**
   * 获取完整的仪表板数据
   * @param institutionId 机构 ID
   * @returns 完整仪表板数据 Observable
   */
  getFullDashboard(institutionId: number): Observable<DashboardData> {
    const url = `${this.baseUrl}/institutions/${institutionId}/dashboard`;
    return this.http.get<DashboardData>(url);
  }

  /**
   * 获取 Mock 仪表板数据（用于降级或演示）
   * @param institutionId 机构 ID
   * @returns Mock 仪表板数据
   */
  getMockDashboardData(): DashboardData {
    return {
      statistics: this.getMockStatistics(),
      charts: this.getMockCharts(),
      recent_activities: this.getMockActivities(),
      alerts: this.getMockAlerts(),
    };
  }

  /**
   * 获取模拟统计数据
   */
  private getMockStatistics(): InstitutionStatistics {
    return {
      active_licenses: 1250,
      total_projects: 48,
      total_users: 356,
      hardware_consumption: 78,
      license_remaining: 750,
    };
  }

  /**
   * 获取模拟图表数据
   */
  private getMockCharts(): ChartData {
    return {
      user_growth_data: [
        { date: '2025-09', value: 120 },
        { date: '2025-10', value: 180 },
        { date: '2025-11', value: 250 },
        { date: '2025-12', value: 310 },
        { date: '2026-01', value: 356 },
        { date: '2026-02', value: 420 },
      ],
      project_trend_data: [
        { date: '2025-09', value: 20 },
        { date: '2025-10', value: 28 },
        { date: '2025-11', value: 35 },
        { date: '2025-12', value: 42 },
        { date: '2026-01', value: 48 },
        { date: '2026-02', value: 55 },
      ],
      hardware_usage_data: [
        { category: 'Arduino', value: 35, date: '2026-02' },
        { category: 'Raspberry Pi', value: 28, date: '2026-02' },
        { category: '传感器模块', value: 22, date: '2026-02' },
        { category: '其他设备', value: 15, date: '2026-02' },
      ],
      license_usage_data: [{ date: '2026-02', value: 1250 }],
    };
  }

  /**
   * 获取模拟活动记录
   */
  private getMockActivities(): ActivityRecord[] {
    return [
      {
        id: 1,
        type: 'user_login',
        title: '张老师登录系统',
        description: '用户 zhang_teacher@example.com 成功登录',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 分钟前
        severity: 'info',
        icon: 'login',
      },
      {
        id: 2,
        type: 'project_created',
        title: '新项目创建',
        description: '学生李明创建了"智能温室监控系统"项目',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 小时前
        severity: 'info',
        icon: 'folder_add',
      },
      {
        id: 3,
        type: 'license_used',
        title: '许可证使用警告',
        description: '机构许可证使用率已达 85%',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 小时前
        severity: 'warning',
        icon: 'warning',
      },
      {
        id: 4,
        type: 'hardware_access',
        title: '硬件设备访问',
        description: 'Arduino UNO #3 被成功访问',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 小时前
        severity: 'info',
        icon: 'memory',
      },
    ];
  }

  /**
   * 获取模拟告警通知
   */
  private getMockAlerts(): AlertNotification[] {
    return [
      {
        id: 1,
        type: 'license_expiring',
        message: '许可证即将到期，剩余 30 天',
        severity: 'high',
        created_at: new Date().toISOString(),
        icon: 'error',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'hardware_limit',
        message: '硬件使用接近上限，建议升级套餐',
        severity: 'medium',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 天前
        icon: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 天前
      },
    ];
  }
}
