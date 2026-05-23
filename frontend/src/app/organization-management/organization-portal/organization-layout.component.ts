import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { environment } from '../../../environments/environment';
import { OrganizationSideNavComponent } from './components/organization-side-nav/organization-side-nav.component';
import { OrganizationDashboardService } from './organization-dashboard.service';
import { mockOrganizations } from './mock-dashboard-data';

@Component({
  selector: 'app-organization-layout',
  template: `
    <div class="organization-layout-container">
      <!-- 顶部 Header -->
      <header class="layout-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="返回机构列表">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <span class="page-title">{{ organizationName || '机构管理' }}</span>
        </div>
        <div class="header-right">
          <button mat-icon-button (click)="refreshPage()" matTooltip="刷新">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </header>

      <!-- 主体内容区（侧边栏 + 主内容） -->
      <div class="layout-body">
        <!-- 侧边栏导航 -->
        <app-organization-side-nav class="side-nav"></app-organization-side-nav>

        <!-- 主内容区域 -->
        <div class="layout-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/design-tokens' as tokens;

      .organization-layout-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: tokens.$color-neutral-100;
      }

      /* 顶部 Header */
      .layout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 64px;
        padding: 0 tokens.$spacing-lg;
        background: white;
        box-shadow: tokens.$shadow-sm;
        flex-shrink: 0;
        z-index: tokens.$z-index-fixed;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: tokens.$spacing-md;
      }

      .page-title {
        font-size: tokens.$font-size-lg;
        font-weight: 500;
        color: tokens.$color-neutral-900;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: tokens.$spacing-md;
      }

      /* 主体内容区 */
      .layout-body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .side-nav {
        width: 280px;
        flex-shrink: 0;
        background-color: white;
        box-shadow: tokens.$shadow-sm;
        overflow-y: auto;
        height: calc(100vh - 64px);
      }

      .layout-content {
        flex: 1;
        overflow-y: auto;
        padding: tokens.$spacing-lg;
      }
    `,
  ],
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    OrganizationSideNavComponent,
  ],
})
export class OrganizationLayoutComponent implements OnInit {
  organizationName: string = '机构管理';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orgService: OrganizationDashboardService
  ) {}

  ngOnInit(): void {
    // 从路由参数中获取机构ID并加载机构信息
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      this.loadOrganizationInfo(+orgId);
    }
  }

  private loadOrganizationInfo(orgId: number): void {
    // Mock 模式下直接使用 Mock 数据
    if (environment.useMockData) {
      const mockOrg = mockOrganizations.find(o => o.id === orgId);
      if (mockOrg) {
        this.organizationName = mockOrg.name;
      }
      return;
    }

    // 真实 API 模式
    this.orgService.getOrganizationOverview(orgId).subscribe({
      next: (org) => {
        if (org && org.name) {
          this.organizationName = org.name;
        }
      },
      error: (err: unknown) => {
        console.error('Failed to load organization:', err);
        // 保持默认值，不修改
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/organization']);
  }

  refreshPage(): void {
    window.location.reload();
  }
}
