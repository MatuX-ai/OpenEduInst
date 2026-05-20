import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import { getMockDashboardData } from './mock-dashboard-data';

export interface Organization {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  organization: Organization;
  statistics: {
    activeLicenses: number;
    totalProjects: number;
    totalUsers: number;
    hardwareConsumption: number;
    licenseRemaining: number;
    // 扩展属性（用于 dashboard-overview 组件）
    newProjectsThisMonth?: number;
    activeUsers?: number;
    storageUsed?: number;
    storageTotal?: number;
  };
  charts: {
    userGrowthData: ChartData[];
    projectTrendData: ChartData[];
    hardwareUsageData: ChartData[];
    licenseUsageData: ChartData[];
  };
  recentActivities: Activity[];
  alerts: Alert[];
}

export interface ChartData {
  date: string;
  value: number;
  category?: string;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

export interface Alert {
  id: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface OrganizationOverview {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  statistics?: {
    total_licenses?: number;
    active_licenses?: number;
    total_users?: number;
    total_courses?: number;
    storage_used_mb?: number;
    storage_limit_mb?: number;
  };
}

export interface LicenseStatistics {
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  expiring_soon: number;
  license_types?: Array<{
    type: string;
    count: number;
  }>;
  usage_trend?: Array<{
    date: string;
    active_count: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationDashboardService {
  private baseUrl = `${environment.apiUrl}/api/v1`;
  private currentOrgIdSubject = new BehaviorSubject<number | null>(null);
  public currentOrgId$ = this.currentOrgIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  setCurrentOrgId(orgId: number): void {
    this.currentOrgIdSubject.next(orgId);
  }

  getDashboardData(orgId: number): Observable<DashboardData> {
    // 开发环境使用 Mock 数据
    if (!environment.production) {
      const mockData = getMockDashboardData(orgId);
      return of(mockData).pipe(delay(800));
    }

    // 生产环境调用真实 API
    const headers = new HttpHeaders({
      'X-Org-ID': orgId.toString(),
    });

    return this.http
      .get<DashboardData>(`${this.baseUrl}/org/${orgId}/dashboard`, { headers })
      .pipe(catchError(this.handleError<DashboardData>('getDashboardData')));
  }

  getOrganizationOverview(orgId: number): Observable<OrganizationOverview> {
    const headers = new HttpHeaders({
      'X-Org-ID': orgId.toString(),
    });

    return this.http
      .get<OrganizationOverview>(`${this.baseUrl}/org/${orgId}/overview`, { headers })
      .pipe(catchError(this.handleError<OrganizationOverview>('getOrganizationOverview')));
  }

  updateOrganization(orgId: number, orgData: Partial<Organization>): Observable<Organization> {
    const headers = new HttpHeaders({
      'X-Org-ID': orgId.toString(),
    });

    return this.http
      .put<Organization>(`${this.baseUrl}/organizations/${orgId}`, orgData, { headers })
      .pipe(catchError(this.handleError<Organization>('updateOrganization')));
  }

  getLicenseStatistics(orgId: number): Observable<LicenseStatistics> {
    const headers = new HttpHeaders({
      'X-Org-ID': orgId.toString(),
    });

    return this.http
      .get<LicenseStatistics>(`${this.baseUrl}/org/${orgId}/licenses/statistics`, { headers })
      .pipe(catchError(this.handleError<LicenseStatistics>('getLicenseStatistics')));
  }

  private handleError<T>(operation?: string, result?: T) {
    return (_error: unknown): Observable<T> => {
      return of(result as T);
    };
  }
}
