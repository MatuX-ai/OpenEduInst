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
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-organization-side-nav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule, RouterModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        overflow: 'hidden',
        opacity: 1
      })),
      transition('expanded <=> collapsed', animate('200ms ease-in-out'))
    ])
  ],
  template: `
    <mat-nav-list>
      <ng-container *ngFor="let group of menuItems">
        <!-- 分组标题（可点击折叠） -->
        <div class="menu-group-title" (click)="toggleGroup(group.id)">
          <span>{{ group.title }}</span>
          <mat-icon class="expand-icon" [class.expanded]="isGroupExpanded(group.id)">
            {{ isGroupExpanded(group.id) ? 'expand_less' : 'expand_more' }}
          </mat-icon>
        </div>
        
        <!-- 有子菜单的组 -->
        <ng-container *ngIf="group.children && group.children.length > 0">
          <div [@expandCollapse]="isGroupExpanded(group.id) ? 'expanded' : 'collapsed'">
            <a mat-list-item *ngFor="let item of group.children" [routerLink]="getNavLink(item.path || '')" 
               routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
              <mat-icon matListItemIcon>{{ item.icon || 'circle' }}</mat-icon>
              <span matListItemTitle>{{ item.title }}</span>
            </a>
          </div>
        </ng-container>

        <!-- 没有子菜单的单点（兼容旧逻辑） -->
        <a mat-list-item *ngIf="!group.children || group.children.length === 0" [routerLink]="getNavLink(group.path || '')"
           routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
          <mat-icon matListItemIcon>{{ group.icon }}</mat-icon>
          <span matListItemTitle>{{ group.title }}</span>
        </a>
      </ng-container>
    </mat-nav-list>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        background: #0F172A;
      }

      mat-nav-list {
        padding: 8px 0;
      }

      mat-divider {
        margin: 8px 0;
        border-top-color: rgba(255, 255, 255, 0.1);
      }

      ::ng-deep .mat-mdc-list-item {
        color: #F1F5F9 !important;
        min-height: 40px !important;
        padding: 0 16px !important;
        margin: 2px 8px !important;
        border-radius: 8px !important;
      }

      ::ng-deep .mat-mdc-list-item:hover {
        background-color: rgba(255, 255, 255, 0.08) !important;
      }

      ::ng-deep .mat-mdc-list-item-active,
      .active-link {
        background-color: rgba(0, 102, 255, 0.15) !important;
      }

      ::ng-deep .mat-mdc-list-item .mdc-list-item__primary-text {
        color: #F1F5F9 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      ::ng-deep .mat-mdc-list-item mat-icon {
        color: #94A3B8 !important;
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        margin-right: 12px !important;
      }

      ::ng-deep .mat-mdc-list-item:hover mat-icon {
        color: #F1F5F9 !important;
      }

      ::ng-deep .mat-mdc-list-item-active mat-icon,
      .active-link mat-icon {
        color: #0066FF !important;
      }

      .menu-group-title {
        padding: 16px 24px 8px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748B;
        letter-spacing: 0.8px;
        user-select: none;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: color 0.2s;
      }

      .menu-group-title:hover {
        color: #94A3B8;
      }

      .expand-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        transition: transform 0.2s;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .active-link {
        position: relative;
      }

      .active-link::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: #0066FF;
        border-radius: 0 2px 2px 0;
      }
    `,
  ],
})
export class OrganizationSideNavComponent implements OnInit, OnDestroy {
  orgId!: number;
  menuItems: MenuItem[] = [];
  private subs = new Subscription();
  private expandedGroups: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public orgContext: OrganizationContextService,
    private tenantMenuService: TenantMenuService
  ) {
    // 默认展开第一个组
    this.expandedGroups.add('overview');
  }

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
   * 切换分组展开/折叠状态
   */
  toggleGroup(groupId: string): void {
    if (this.isGroupExpanded(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
    }
  }

  /**
   * 检查分组是否展开
   */
  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups.has(groupId);
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
