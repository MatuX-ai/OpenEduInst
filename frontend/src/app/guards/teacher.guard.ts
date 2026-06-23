import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';

/** 可访问教师工作台的角色 */
const TEACHER_PORTAL_ROLES = new Set(['teacher', 'admin', 'staff']);

/**
 * 教师工作台路由守卫
 * @see docs/OPENMTSCIED_INTEGRATION_PRD.md FR-OS-5
 */
@Injectable({
  providedIn: 'root',
})
export class TeacherGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    if (environment.useMockData) {
      return of(true);
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return of(false);
    }

    if (TEACHER_PORTAL_ROLES.has(user.role)) {
      return of(true);
    }

    const orgId = this.extractOrgId(route);
    this.snackBar.open('仅教师或教务人员可访问教学工作台', '关闭', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
    });
    if (orgId) {
      void this.router.navigate(['/organization', orgId, 'dashboard']);
    } else {
      void this.router.navigate(['/']);
    }
    return of(false);
  }

  private extractOrgId(route: ActivatedRouteSnapshot): number {
    let id = Number(route.paramMap.get('id'));
    let current: ActivatedRouteSnapshot | null = route.parent;
    while (!id && current) {
      id = Number(current.paramMap.get('id'));
      current = current.parent;
    }
    return id || 0;
  }
}
