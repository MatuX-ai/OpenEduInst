/**
 * Organization Repository
 *
 * 机构数据访问层，继承通用 HTTP Repository
 * 提供机构相关的 CRUD 操作和扩展查询方法
 *
 * @author iMatu Development Team
 * @version 1.0.0
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Institution } from '../../admin/institution-management/institution-list.service';
import { RepositoryCacheService } from '../services/repository-cache.service';
import { retryWithBackoff } from '../utils/retry.utils';

import { PaginatedResponse } from './base.repository';
import { HttpRepositoryBase } from './http-repository.base';

/**
 * 机构统计数据
 */
export interface OrganizationStats {
  teacher_count: number;
  student_count: number;
  course_count: number;
  classroom_count: number;
  active_lessons_today: number;
  pending_assignments: number;
  average_attendance_rate: number;
  average_progress_rate: number;
}

/**
 * 机构 Repository
 */
@Injectable({ providedIn: 'root' })
export class OrganizationRepository extends HttpRepositoryBase<Institution, number> {
  /** 缓存键前缀 */
  private readonly CACHE_PREFIX = 'organization:';

  /**
   * 构造函数
   * @param http HTTP 客户端
   * @param cache 缓存服务
   */
  constructor(
    protected override http: HttpClient,
    private cache: RepositoryCacheService
  ) {
    super('/api/v1', 'organizations', http);
  }

  /**
   * 获取机构统计数据（带缓存）
   * @param orgId 机构 ID
   * @returns 统计数据 Observable
   */
  getStatistics(orgId: number): Observable<OrganizationStats> {
    const cacheKey = `${this.CACHE_PREFIX}stats:${orgId}`;

    return this.cache.cacheObservable(
      cacheKey,
      this.http
        .get<OrganizationStats>(`${this.apiUrl}/${orgId}/statistics`)
        .pipe(retryWithBackoff({ maxRetries: 3, initialDelay: 1000 })),
      { ttl: 5 * 60 * 1000 } // 5 分钟缓存
    );
  }

  /**
   * 根据名称搜索机构（带缓存）
   * @param name 机构名称 (支持模糊匹配)
   * @returns 机构列表 Observable
   */
  searchByName(name: string): Observable<Institution[]> {
    const cacheKey = `${this.CACHE_PREFIX}search:${name}`;

    return this.cache.cacheObservable(
      cacheKey,
      this.http
        .get<Institution[]>(this.apiUrl, {
          params: new HttpParams().set('name', name),
        })
        .pipe(retryWithBackoff({ maxRetries: 2 })),
      { ttl: 10 * 60 * 1000 } // 10 分钟缓存
    );
  }

  /**
   * 获取活跃机构列表（带缓存）
   * @param page 页码
   * @param size 每页大小
   * @returns 分页响应 Observable
   */
  getActiveOrganizations(
    page: number = 1,
    size: number = 10
  ): Observable<PaginatedResponse<Institution>> {
    const cacheKey = `${this.CACHE_PREFIX}active:p${page}s${size}`;

    return this.cache.cacheObservable(
      cacheKey,
      this.http
        .get<PaginatedResponse<Institution>>(this.apiUrl, {
          params: new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('active', 'true'),
        })
        .pipe(
          retryWithBackoff({ maxRetries: 2 }),
          catchError(() =>
            of({
              data: [],
              total: 0,
              page,
              size,
              totalPages: 0,
            } as PaginatedResponse<Institution>)
          )
        ),
      { ttl: 3 * 60 * 1000 } // 3 分钟缓存
    );
  }

  /**
   * 获取机构详情 (包含统计数据)
   * @param orgId 机构 ID
   * @returns 包含统计数据的机构 Observable
   */
  getOrganizationWithStats(
    orgId: number
  ): Observable<Institution & { stats?: OrganizationStats | undefined }> {
    return forkJoin({
      org: this.findById(orgId),
      stats: this.getStatistics(orgId).pipe(
        catchError(() => of(undefined as OrganizationStats | undefined))
      ),
    }).pipe(map((result) => ({ ...result.org, stats: result.stats })));
  }

  /**
   * 更新机构状态
   * @param orgId 机构 ID
   * @param isActive 是否活跃
   * @returns 更新后的机构 Observable
   */
  updateStatus(orgId: number, isActive: boolean): Observable<Institution> {
    return this.update(orgId, { is_active: isActive });
  }

  /**
   * 获取机构用户列表
   * @param orgId 机构 ID
   * @param page 页码
   * @param size 每页大小
   * @returns 分页用户列表 Observable
   */
  getUsers(
    orgId: number,
    page: number = 1,
    size: number = 10
  ): Observable<PaginatedResponse<unknown>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedResponse<unknown>>(`${this.apiUrl}/${orgId}/users`, { params });
  }

  /**
   * 获取机构课程列表
   * @param orgId 机构 ID
   * @param page 页码
   * @param size 每页大小
   * @returns 分页课程列表 Observable
   */
  getCourses(
    orgId: number,
    page: number = 1,
    size: number = 10
  ): Observable<PaginatedResponse<unknown>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedResponse<unknown>>(`${this.apiUrl}/${orgId}/courses`, { params });
  }
}
