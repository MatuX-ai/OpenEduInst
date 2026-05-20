import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

export interface Organization {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  license_count: number;
  max_users: number;
  current_users: number;
  total_sponsorship_amount: number;
  active_sponsorships: number;
  total_brand_exposures: number;
  accumulated_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreate {
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users?: number;
}

export interface OrganizationUpdate {
  name?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users?: number;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private baseUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * 获取所有组织列�?
   */
  getOrganizations(
    skip: number = 0,
    limit: number = 100,
    isActive?: boolean
  ): Observable<Organization[]> {
    let url = `${this.baseUrl}/organizations?skip=${skip}&limit=${limit}`;

    if (isActive !== undefined) {
      url += `&is_active=${isActive}`;
    }

    return this.http
      .get<Organization[]>(url)
      .pipe(catchError(this.handleError<Organization[]>('getOrganizations')));
  }

  /**
   * 根据 ID 获取组织详情
   */
  getOrganization(orgId: number): Observable<Organization> {
    const url = `${this.baseUrl}/organizations/${orgId}`;
    return this.http
      .get<Organization>(url)
      .pipe(catchError(this.handleError<Organization>('getOrganization')));
  }

  /**
   * 创建新组�?
   */
  createOrganization(data: OrganizationCreate): Observable<Organization> {
    const url = `${this.baseUrl}/organizations`;
    return this.http
      .post<Organization>(url, data)
      .pipe(catchError(this.handleError<Organization>('createOrganization')));
  }

  /**
   * 更新组织信息
   */
  updateOrganization(orgId: number, data: OrganizationUpdate): Observable<Organization> {
    const url = `${this.baseUrl}/organizations/${orgId}`;
    return this.http
      .put<Organization>(url, data)
      .pipe(catchError(this.handleError<Organization>('updateOrganization')));
  }

  /**
   * 删除组织
   */
  deleteOrganization(orgId: number): Observable<{ message: string; org_id: number }> {
    const url = `${this.baseUrl}/organizations/${orgId}`;
    return this.http
      .delete<{ message: string; org_id: number }>(url)
      .pipe(
        catchError(this.handleError<{ message: string; org_id: number }>('deleteOrganization'))
      );
  }

  /**
   * 错误处理
   */
  private handleError<T>(operation?: string, result?: T) {
    return (_error: unknown): Observable<T> => {
      console.error(`${operation} failed:`, _error);
      // 返回空结果以避免中断应用
      return of(result as T);
    };
  }
}
