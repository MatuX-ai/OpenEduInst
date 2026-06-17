import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '../../environments/environment';

interface MyFeaturesResult {
  org_id: number;
  features: string[];
  license_count: number;
  fetched_at: string;
}

const CACHE_KEY = 'openmt_license_features';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

interface CacheEntry {
  data: MyFeaturesResult;
  timestamp: number;
}

/**
 * 许可证功能守卫
 *
 * 根据路由 data.requiredFeature 检查当前组织是否已授权该功能。
 * 未授权时重定向到许可证管理页并给出提示。
 * 结果缓存到 sessionStorage（5 分钟过期）。
 */
@Injectable({
  providedIn: 'root',
})
export class LicenseGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredFeature = route.data?.['requiredFeature'] as string | undefined;

    // 无 feature 要求的路由直接放行
    if (!requiredFeature) {
      return of(true);
    }

    // Mock 模式直接放行
    if (environment.useMockData) {
      return of(true);
    }

    return this.getFeatures().pipe(
      map((result) => {
        const hasFeature = result.features.includes(requiredFeature);
        if (!hasFeature) {
          // 从路由中提取 org_id
          const orgId = this.extractOrgId(route);
          void this.router.navigate(['/organization', orgId, 'licenses']);
          this.snackBar.open(
            `当前许可证未授权「${this.getFeatureLabel(requiredFeature)}」功能，请激活对应许可证`,
            '关闭',
            { duration: 5000, panelClass: ['warning-snackbar'] }
          );
          return false;
        }
        return true;
      }),
      catchError(() => {
        // API 不可达时放行（避免阻塞页面）
        console.warn('[LicenseGuard] 获取 features 失败，默认放行');
        return of(true);
      })
    );
  }

  /**
   * 从 sessionStorage 获取缓存的 features，缓存过期则重新请求 API
   */
  private getFeatures(): Observable<MyFeaturesResult> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<MyFeaturesResult>(`${environment.apiUrl}/api/v1/licenses/my-features`)
      .pipe(
        map((data) => {
          this.writeCache(data);
          return data;
        })
      );
  }

  private readCache(): MyFeaturesResult | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return entry.data;
    } catch {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  private writeCache(data: MyFeaturesResult): void {
    try {
      const entry: CacheEntry = { data, timestamp: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // sessionStorage 满时静默失败
    }
  }

  /**
   * 从路由快照中提取 org_id
   * 子路由的 org_id 在 parent route（:id）中
   */
  private extractOrgId(route: ActivatedRouteSnapshot): number {
    let id = Number(route.paramMap.get('id'));
    if (!id && route.parent) {
      id = Number(route.parent.paramMap.get('id'));
    }
    return id || 0;
  }

  private getFeatureLabel(feature: string): string {
    const map: Record<string, string> = {
      ai_assistant: 'AI 助教',
      code_review: '代码审查',
      student_analysis: '学情分析',
      scheduling_suggest: '智能排课',
      cloud_backup: '云端备份',
      multi_tenant: '多租户管理',
      white_label: '白名单赛事',
      hardware_rental: '硬件租赁',
      advanced_reports: '高级报表',
      custom_branding: '定制品牌',
    };
    return map[feature] || feature;
  }
}
