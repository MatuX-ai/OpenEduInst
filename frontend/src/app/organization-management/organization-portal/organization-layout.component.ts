import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';
import { OrganizationSideNavComponent } from './components/organization-side-nav/organization-side-nav.component';
import { OrganizationDashboardService } from './organization-dashboard.service';
import { mockOrganizations } from './mock-dashboard-data';

@Component({
  selector: 'app-organization-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    OrganizationSideNavComponent,
  ],
  template: `
    <div class="organization-layout-container">
      <!-- 顶部 Header（深色，对齐原型） -->
      <header class="layout-header">
        <div class="header-left">
          <!-- 实时时钟 -->
          <div class="header-clock">
            <mat-icon class="clock-icon">schedule</mat-icon>
            <span class="clock-time">{{ currentTime }}</span>
          </div>
          <!-- 机构名称 -->
          <span class="page-title">{{ organizationName || '机构管理' }}</span>
        </div>
        <div class="header-right">
          <span class="demo-badge">演示模式</span>
          <button mat-icon-button class="header-btn" matTooltip="消息通知">
            <mat-icon class="header-btn-icon">notifications</mat-icon>
          </button>
          <button mat-icon-button class="header-btn" (click)="goBack()" matTooltip="返回机构列表">
            <mat-icon class="header-btn-icon">home</mat-icon>
          </button>
        </div>
      </header>

      <!-- 主体内容区（侧边栏 + 主内容） -->
      <mat-sidenav-container class="layout-body">
        <!-- 侧边栏导航 -->
        <mat-sidenav #sidenav 
                     mode="side" 
                     [opened]="sidebarOpened"
                     [style.width.px]="240"
                     class="side-nav">
          <app-organization-side-nav></app-organization-side-nav>
        </mat-sidenav>

        <!-- 主内容区域 -->
        <mat-sidenav-content class="layout-content-wrapper">
          <div class="layout-content">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as tokens;

      .organization-layout-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: tokens.$color-neutral-100;
      }

      /* === 顶部 Header（深色，与侧边栏统一） === */
      .layout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 48px;
        padding: 0 24px;
        background: tokens.$sidebar-header-bg;
        border-bottom: 1px solid tokens.$sidebar-border;
        flex-shrink: 0;
        z-index: 50;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .header-clock {
        display: flex;
        align-items: center;
        gap: 6px;
        color: tokens.$sidebar-text-muted;
        font-size: 12px;
        font-family: 'Courier New', monospace;
      }

      .clock-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        color: tokens.$sidebar-text-muted;
      }

      .clock-time {
        color: tokens.$sidebar-text-tertiary;
      }

      .page-title {
        font-size: 14px;
        font-weight: 500;
        color: tokens.$sidebar-text-primary;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .demo-badge {
        padding: 4px 10px;
        background: tokens.$sidebar-active-bg-soft;
        border: 1px solid tokens.$sidebar-active-border-soft;
        color: tokens.$sidebar-active-text;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      .header-btn {
        width: 32px !important;
        height: 32px !important;
        line-height: 32px !important;
      }

      .header-btn-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        color: tokens.$sidebar-text-tertiary;
      }

      .header-btn:hover .header-btn-icon {
        color: tokens.$sidebar-text-tertiary;
      }

      /* 主体内容区 */
      .layout-body {
        flex: 1;
        overflow: hidden;
      }

      /* Material sidenav 容器样式已迁移至 styles/_material-overrides.scss */

      .side-nav {
        border-right: none !important;
      }

      .layout-content-wrapper {
        display: flex;
        flex-direction: column;
      }

      .layout-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }
    `,
  ],
})
export class OrganizationLayoutComponent implements OnInit, OnDestroy {
  organizationName: string = '机构管理';
  sidebarOpened: boolean = true;
  currentTime: string = '';
  private timeInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orgService: OrganizationDashboardService
  ) {}

  ngOnInit(): void {
    // 实时时钟
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // 从路由参数中获取机构ID并加载机构信息
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      this.loadOrganizationInfo(+orgId);
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/organization']);
  }

  toggleSidebar(): void {
    this.sidebarOpened = !this.sidebarOpened;
  }
}
