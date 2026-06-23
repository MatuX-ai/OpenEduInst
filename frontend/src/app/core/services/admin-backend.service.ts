/**
 * Admin 管理后台 API 服务层
 *
 * 封装审计日志、用户管理、系统安全设置等接口的调用。
 * 所有接口使用统一的鉴权方式 (localStorage 的 access_token -> Authorization Bearer)。
 */

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

// ===================== 类型定义 =====================

export interface AuditLogEntry {
  type?: string;
  ts?: string;
  request_id?: string;
  user?: string;
  user_id?: number;
  org_id?: number;
  role?: string;
  ip?: string;
  ip_location?: string;
  method?: string;
  path?: string;
  operation?: string;
  status?: number;
  took_ms?: number;
  user_agent?: string;
  request_body?: string;
  response_summary?: { status?: number };
  trace_id?: string;
  risk_level?: 'normal' | 'warning' | 'high';
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditSummary {
  total_events: number;
  operation_stats: Record<string, number>;
  risk_stats: Record<string, number>;
  top_users: { user: string; count: number }[];
  high_risk_events: AuditLogEntry[];
  period_hours: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface RoleInfo {
  role: string;
  permissions: string[];
}

export interface SecurityConfig {
  access_token_expire_minutes: number;
  algorithm: string;
  secret_key_masked: string;
  cors_allow_origin_count: number;
  enforce_https: boolean;
  rate_limit: {
    anon: string;
    auth: string;
    login: string;
    admin: string;
    super_admin: string;
  };
  audit: {
    log_file: string;
    level: string;
    record_body: boolean;
  };
  token_blacklist: {
    ttl_seconds: number;
    redis_enabled: boolean;
  };
  imatu: {
    sync_enabled: boolean;
    api_base: string;
  };
}

export interface CurrentUserInfo {
  user_id: number;
  username: string;
  email?: string;
  org_id: number;
  role: string;
  permissions: string[];
  is_super_admin: boolean;
  is_admin: boolean;
}

// ===================== 服务 =====================

@Injectable({ providedIn: 'root' })
export class AdminBackendService {
  private readonly apiBase: string;

  constructor(private readonly http: HttpClient) {
    this.apiBase = environment.apiUrl.replace(/\/$/, '') + '/api/v1';
  }

  // ---------- 审计日志 ----------

  getAuditLogs(params: {
    page?: number;
    page_size?: number;
    operation?: string;
    user?: string;
    ip?: string;
    risk_level?: 'normal' | 'warning' | 'high';
    method?: string;
    hours?: number;
  }): Observable<{ success: boolean; data: PaginatedAuditLogs; message?: string }> {
    return this.http
      .get<{ success: boolean; data: PaginatedAuditLogs; message?: string }>(
        `${this.apiBase}/audit/logs`,
        { headers: this.authHeaders, params: this.toHttpParams(params) }
      )
      .pipe(catchError(this.handleError('getAuditLogs')));
  }

  getAuditSummary(hours: number = 24): Observable<AuditSummary> {
    return this.http
      .get<{ success: boolean; data: AuditSummary }>(
        `${this.apiBase}/audit/stats/summary`,
        { headers: this.authHeaders, params: { hours } }
      )
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getAuditSummary'))
      );
  }

  getOperations(): Observable<string[]> {
    return this.http
      .get<{ success: boolean; data: string[] }>(`${this.apiBase}/audit/operations`, {
        headers: this.authHeaders,
      })
      .pipe(
        map((resp) => resp.data ?? []),
        catchError(this.handleError('getOperations'))
      );
  }

  exportAuditLogs(params: { hours?: number; operation?: string; risk_level?: string }) {
    const url = `${this.apiBase}/audit/logs/export`;
    const fullUrl = params
      ? `${url}?${this.toHttpParams(params).toString()}`
      : url;
    return this.http.get(fullUrl, {
      headers: this.authHeaders,
      responseType: 'blob',
    });
  }

  // ---------- 系统 / 用户 ----------

  getMe(): Observable<CurrentUserInfo> {
    return this.http
      .get<{ success: boolean; data: CurrentUserInfo }>(`${this.apiBase}/system/me`, {
        headers: this.authHeaders,
      })
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getMe'))
      );
  }

  getSecurityConfig(): Observable<SecurityConfig> {
    return this.http
      .get<{ success: boolean; data: SecurityConfig }>(
        `${this.apiBase}/system/security/config`,
        { headers: this.authHeaders }
      )
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getSecurityConfig'))
      );
  }

  getRoles(): Observable<RoleInfo[]> {
    return this.http
      .get<{ success: boolean; data: RoleInfo[] }>(`${this.apiBase}/system/roles`, {
        headers: this.authHeaders,
      })
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getRoles'))
      );
  }

  getUsers(params: { page?: number; page_size?: number } = {}): Observable<{
    items: AdminUser[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.apiBase}/system/users`, {
        headers: this.authHeaders,
        params: this.toHttpParams(params),
      })
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getUsers'))
      );
  }

  updateUserRole(userId: number, role: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .put<{ success: boolean; message?: string }>(
        `${this.apiBase}/system/users/${userId}/role`,
        { role },
        { headers: this.authHeaders }
      )
      .pipe(catchError(this.handleError('updateUserRole')));
  }

  updateUserActiveStatus(userId: number, is_active: boolean): Observable<{ success: boolean }> {
    return this.http
      .patch<{ success: boolean }>(
        `${this.apiBase}/system/users/${userId}/status`,
        { is_active },
        { headers: this.authHeaders }
      )
      .pipe(catchError(this.handleError('updateUserActiveStatus')));
  }

  forceLogoutUser(username: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(
        `${this.apiBase}/system/force-logout/${encodeURIComponent(username)}`,
        {},
        { headers: this.authHeaders }
      )
      .pipe(catchError(this.handleError('forceLogoutUser')));
  }

  logout(): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(
        `${this.apiBase}/system/logout`,
        {},
        { headers: this.authHeaders }
      )
      .pipe(catchError(this.handleError('logout')));
  }

  getPlatformStats(): Observable<{
    organizations: number;
    users: number;
    licenses_total: number;
    licenses_active: number;
  }> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.apiBase}/system/stats/summary`, {
        headers: this.authHeaders,
      })
      .pipe(
        map((r) => r.data),
        catchError(this.handleError('getPlatformStats'))
      );
  }

  // ===================== 内部工具 =====================

  private get authHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private toHttpParams(obj: Record<string, any>): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }

  private handleError(op: string) {
    return (err: any) => {
      const message =
        err?.error?.message || err?.message || `${op} 请求失败，请稍后再试`;
      console.error(`[AdminBackendService::${op}]`, err);
      return throwError(() => new Error(message));
    };
  }
}
