import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TenantMenuService, MenuItem } from '../../../../core/services/tenant-menu.service';

@Component({
  selector: 'app-organization-side-nav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule, RouterModule],
  template: `
    <mat-nav-list>
      <ng-container *ngFor="let item of menuItems">
        <a mat-list-item [routerLink]="getNavLink(item.path)">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.title }}</span>
        </a>
      </ng-container>

      <mat-divider></mat-divider>

      <a mat-list-item [routerLink]="getNavLink('licenses')">
        <mat-icon matListItemIcon>vpn_key</mat-icon>
        <span matListItemTitle>许可证管理</span>
      </a>

      <a mat-list-item [routerLink]="getNavLink('purchase-tokens')">
        <mat-icon matListItemIcon>shopping_cart</mat-icon>
        <span matListItemTitle>购买 Token</span>
      </a>

      <a mat-list-item [routerLink]="getNavLink('users')">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle>用户管理</span>
      </a>
    </mat-nav-list>
  `,
  styles: [
    `
      mat-divider {
        margin: 8px 0;
      }
    `,
  ],
})
export class OrganizationSideNavComponent implements OnInit, OnDestroy {
  orgId!: number;
  menuItems: MenuItem[] = [];
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public orgContext: OrganizationContextService,
    private tenantMenuService: TenantMenuService
  ) {}

  ngOnInit(): void {
    this.extractOrgId();
    if (this.orgId) {
      this.loadMenu();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadMenu(): void {
    this.subs.add(
      this.tenantMenuService.getMenu(this.orgId).subscribe({
        next: (res) => {
          this.menuItems = res.menu;
        },
        error: (err) => console.error('Failed to load menu:', err)
      })
    );
  }

  /**
   * 获取导航链接
   */
  getNavLink(page: string): string[] {
    if (!this.orgId || isNaN(this.orgId)) {
      console.warn('[SideNav] orgId 无效,返回空数组');
      return [];
    }
    return ['/organization', String(this.orgId), page];
  }

  /**
   * 提取机构 ID
   */
  private extractOrgId(): void {
    // 方法1: 从父路由获取
    const parentId = this.route.parent?.snapshot.params['id'] as string | undefined;
    if (parentId && !isNaN(+parentId)) {
      this.orgId = +parentId;
      console.log('[SideNav] 从 parent 获取 orgId:', this.orgId);
      return;
    }

    // 方法2: 从当前路由的根路径获取
    let currentRoute: ActivatedRoute | null = this.route;
    while (currentRoute?.parent) {
      currentRoute = currentRoute.parent;
    }

    if (currentRoute) {
      const rootId = currentRoute.snapshot.firstChild?.params['id'] as string | undefined;
      if (rootId && !isNaN(+rootId)) {
        this.orgId = +rootId;
        console.log('[SideNav] 从 root 获取 orgId:', this.orgId);
        return;
      }
    }

    // 方法3: 从 URL 解析
    const urlSegments = this.router.url.split('/');
    const orgIndex = urlSegments.findIndex((seg) => seg === 'organization');
    if (orgIndex >= 0 && urlSegments[orgIndex + 1]) {
      const urlId = +urlSegments[orgIndex + 1];
      if (!isNaN(urlId)) {
        this.orgId = urlId;
        console.log('[SideNav] 从 URL 获取 orgId:', this.orgId);
        return;
      }
    }

    console.error('[SideNav] 无法获取机构ID,当前URL:', this.router.url);
  }
}
