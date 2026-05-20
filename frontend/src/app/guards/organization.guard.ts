import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { OrganizationContextService, OrganizationType } from '../core/services/organization-context.service';

/**
 * 机构管理权限守卫
 *
 * 用于保护机构管理相关页面，防止未授权访问并注入组织上下文
 */
@Injectable({
  providedIn: 'root',
})
export class OrgAdminGuard implements CanActivate {
  constructor(
    private router: Router,
    private orgContext: OrganizationContextService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const orgId = Number(route.paramMap.get('id'));

    // Mock 模式：模拟加载组织信息
    if (environment.useMockData) {
      const mockOrg = {
        id: orgId || 1,
        name: '星海机器人培训中心',
        type: 'training_institution' as OrganizationType,
        features: {
          admissions: true,
          scheduling: true,
          finance: true,
          live_streaming: true,
        },
      };
      this.orgContext.setContext(mockOrg);
      return of(true);
    }

    // TODO: 真实 API 模式下验证用户权限并获取组织详情
    // eslint-disable-next-line no-console
    console.log('[Real API] 验证机构管理权限并加载上下文...', orgId);

    const isAuthenticated = true;
    const hasPermission = true;

    if (isAuthenticated && hasPermission) {
      // 这里应该从 API 获取真实的组织类型和配置
      this.orgContext.setContext({
        id: orgId,
        name: '加载中...',
        type: 'training_institution',
        features: {},
      });
      return of(true);
    } else {
      void this.router.navigate(['/auth/login']);
      return of(false);
    }
  }
}
