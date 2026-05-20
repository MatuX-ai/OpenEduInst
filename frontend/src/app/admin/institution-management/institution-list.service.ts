import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

export interface Institution {
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

export interface InstitutionCreate {
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users?: number;
}

export interface InstitutionUpdate {
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
export class InstitutionService {
  private baseUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * 获取所有机构列表
   */
  getInstitutions(
    skip: number = 0,
    limit: number = 100,
    isActive?: boolean
  ): Observable<Institution[]> {
    let url = `${this.baseUrl}/institutions?skip=${skip}&limit=${limit}`;

    if (isActive !== undefined) {
      url += `&is_active=${isActive}`;
    }

    return this.http
      .get<Institution[]>(url)
      .pipe(catchError(this.handleError<Institution[]>('getInstitutions')));
  }

  /**
   * 根据 ID 获取机构详情
   */
  getInstitution(instId: number): Observable<Institution> {
    const url = `${this.baseUrl}/institutions/${instId}`;
    return this.http
      .get<Institution>(url)
      .pipe(catchError(this.handleError<Institution>('getInstitution')));
  }

  /**
   * 创建新机构
   */
  createInstitution(data: InstitutionCreate): Observable<Institution> {
    const url = `${this.baseUrl}/institutions`;
    return this.http
      .post<Institution>(url, data)
      .pipe(catchError(this.handleError<Institution>('createInstitution')));
  }

  /**
   * 更新机构信息
   */
  updateInstitution(instId: number, data: InstitutionUpdate): Observable<Institution> {
    const url = `${this.baseUrl}/institutions/${instId}`;
    return this.http
      .put<Institution>(url, data)
      .pipe(catchError(this.handleError<Institution>('updateInstitution')));
  }

  /**
   * 删除机构
   */
  deleteInstitution(instId: number): Observable<{ message: string; inst_id: number }> {
    const url = `${this.baseUrl}/institutions/${instId}`;
    return this.http
      .delete<{ message: string; inst_id: number }>(url)
      .pipe(
        catchError(this.handleError<{ message: string; inst_id: number }>('deleteInstitution'))
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
