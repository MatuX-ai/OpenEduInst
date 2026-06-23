import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrganizationContextService, OrganizationType } from '../../../../core/services/organization-context.service';
import { TenantMenuService, MenuItem } from '../../../../core/services/tenant-menu.service';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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
    <div class="side-nav-container">
      <!-- Logo 区域（对齐原型） -->
      <div class="logo-section">
        <div class="logo-icon">
          <mat-icon>memory</mat-icon>
        </div>
        <div class="logo-text">
          <h1 class="org-name">{{ orgName }}</h1>
          <p class="org-subtitle">{{ orgSubtitle }}</p>
        </div>
      </div>

      <!-- 用户信息（对齐原型） -->
      <div class="user-section">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <p class="user-name">{{ userName }}</p>
          <p class="user-role">{{ userRole }}</p>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="nav-section">
        <ng-container *ngFor="let group of menuItems">
          <!-- 直接链接 -->
          <ng-container *ngIf="group.path">
            <a class="nav-item"
               [routerLink]="getNavLink(group.path)"
               routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{exact: true}">
              <mat-icon class="nav-icon">{{ group.icon || 'circle' }}</mat-icon>
              <span class="nav-label">{{ group.title }}</span>
            </a>
          </ng-container>

          <!-- 分组标题 -->
          <ng-container *ngIf="group.children && group.children.length > 0">
            <div class="nav-group-header" (click)="toggleGroup(group.id)">
              <mat-icon class="nav-icon">{{ group.icon || 'folder' }}</mat-icon>
              <span class="nav-group-label">{{ group.title }}</span>
              <mat-icon class="nav-expand" [class.expanded]="isGroupExpanded(group.id)">
                {{ isGroupExpanded(group.id) ? 'expand_less' : 'expand_more' }}
              </mat-icon>
            </div>
            <div [@expandCollapse]="isGroupExpanded(group.id) ? 'expanded' : 'collapsed'">
              <a class="nav-item nav-sub-item"
                 *ngFor="let item of group.children"
                 [routerLink]="getNavLink(item.path || '')"
                 routerLinkActive="nav-active"
                 [routerLinkActiveOptions]="{exact: true}">
                <mat-icon class="nav-icon">{{ item.icon || 'circle' }}</mat-icon>
                <span class="nav-label">{{ item.title }}</span>
              </a>
            </div>
          </ng-container>
        </ng-container>
      </nav>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      :host {
        display: block;
        height: 100%;
        background: $sidebar-bg;
      }

      .side-nav-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* === Logo 区域（对齐原型） === */
      .logo-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        border-bottom: 1px solid $sidebar-border;
      }

      .logo-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, $sidebar-accent-from, $sidebar-accent-to);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .logo-icon mat-icon {
        color: white;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .logo-text {
        min-width: 0;
      }

      .org-name {
        font-size: 14px;
        font-weight: 700;
        color: $sidebar-text-primary;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .org-subtitle {
        font-size: 11px;
        color: $sidebar-text-tertiary;
        margin: 0;
      }

      /* === 用户信息（对齐原型） === */
      .user-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid $sidebar-border;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        background: $sidebar-active-bg;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
        box-shadow: 0 0 0 2px $sidebar-avatar-ring;
      }

      .user-info {
        min-width: 0;
      }

      .user-name {
        font-size: 14px;
        font-weight: 600;
        color: $sidebar-text-secondary;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 12px;
        color: $sidebar-text-tertiary;
        margin: 0;
      }

      /* === 导航菜单 === */
      .nav-section {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        margin: 1px 0;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.15s ease;
        cursor: pointer;
        font-size: 14px;
      }

      .nav-item:hover {
        background-color: $sidebar-hover-bg;
      }

      .nav-item:hover .nav-label {
        color: $sidebar-text-secondary;
      }

      .nav-item:hover .nav-icon {
        color: $sidebar-text-secondary;
      }

      .nav-active {
        background-color: $sidebar-active-bg-soft !important;
      }

      .nav-active .nav-label {
        color: $sidebar-active-text !important;
        font-weight: 500;
      }

      .nav-active .nav-icon {
        color: $sidebar-accent-from !important;
      }

      .nav-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        color: $sidebar-text-tertiary;
        flex-shrink: 0;
      }

      .nav-label {
        font-size: 14px;
        color: $sidebar-text-tertiary;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.15s;
      }

      .nav-sub-item {
        padding-left: 42px !important;
      }

      /* 分组标题 */
      .nav-group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        margin-top: 4px;
        cursor: pointer;
        user-select: none;
        border-radius: 8px;
        transition: background 0.15s;
      }

      .nav-group-header:hover {
        background-color: $sidebar-hover-bg-soft;
      }

      .nav-group-header:hover .nav-group-label {
        color: $color-text-muted;
      }

      .nav-group-label {
        font-size: 13px;
        font-weight: 500;
        color: $color-text-secondary;
        flex: 1;
      }

      .nav-expand {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        color: $color-text-secondary;
        transition: transform 0.2s;
      }

      .nav-expand.expanded {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class OrganizationSideNavComponent implements OnInit, OnDestroy {
  orgId!: number;
  menuItems: MenuItem[] = [];
  orgName: string = '星海机器人';
  orgSubtitle: string = '培训中心管理';
  userName: string = '管理员';
  userRole: string = '机构负责人';
  userInitial: string = '管';

  private subs = new Subscription();
  private expandedGroups: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public orgContext: OrganizationContextService,
    private tenantMenuService: TenantMenuService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    // 从 AuthService 获取用户信息
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.full_name || user.username;
      this.userRole = this.mapRoleLabel(user.role);
      this.userInitial = (user.full_name || user.username).charAt(0);
    }
  }

  private mapRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: '机构负责人',
      staff: '教务人员',
      teacher: '授课教师',
      student: '学员',
      parent: '家长',
    };
    return labels[role] || '管理员';
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
    const role = this.authService.getCurrentUser()?.role ?? 'admin';
    this.subs.add(
      this.tenantMenuService.getMenu(this.orgId).subscribe({
        next: (res) => {
          this.menuItems = this.tenantMenuService.filterMenuForRole(res.menu, role);
          const firstGroup = this.menuItems.find(m => m.children && m.children.length > 0);
          if (firstGroup) {
            this.expandedGroups.add(firstGroup.id);
          }
          this.loadOrganizationInfo();
        },
        error: (err) => console.error('Failed to load menu:', err)
      })
    );
  }

  private loadOrganizationInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/api/v1/organizations/${this.orgId}`).subscribe({
      next: (org) => {
        let orgType: OrganizationType = 'training_institution';
        if (org.org_type === 'k12_school') {
          orgType = 'k12_school';
        } else if (org.org_type === 'vocational_school') {
          orgType = 'vocational_school';
        } else if (org.org_type === 'education_bureau') {
          orgType = 'education_bureau';
        }

        this.orgContext.setContext({
          id: this.orgId,
          name: org.name || '机构名称',
          type: orgType
        });

        // 更新侧边栏机构信息
        this.orgName = org.name || this.orgName;
        const subtitleMap: Record<string, string> = {
          'training_institution': '培训中心管理',
          'k12_school': '科创中心管理',
          'vocational_school': '实训基地管理',
          'education_bureau': '监管平台管理'
        };
        this.orgSubtitle = subtitleMap[orgType] || '管理中心';
      },
      error: (err) => {
        console.error('Failed to load organization info:', err);
        this.orgContext.setContext({
          id: this.orgId,
          name: '机构名称',
          type: 'training_institution'
        });
      }
    });
  }

  toggleGroup(groupId: string): void {
    if (this.isGroupExpanded(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
    }
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups.has(groupId);
  }

  getNavLink(page: string): string[] {
    if (!this.orgId || isNaN(this.orgId)) {
      console.warn('[SideNav] orgId 无效,返回空数组');
      return [];
    }
    return ['/organization', String(this.orgId), page];
  }

  private extractOrgId(): void {
    const parentId = this.route.parent?.snapshot.params['id'] as string | undefined;
    if (parentId && !isNaN(+parentId)) {
      this.orgId = +parentId;
      return;
    }

    let currentRoute: ActivatedRoute | null = this.route;
    while (currentRoute?.parent) {
      currentRoute = currentRoute.parent;
    }

    if (currentRoute) {
      const rootId = currentRoute.snapshot.firstChild?.params['id'] as string | undefined;
      if (rootId && !isNaN(+rootId)) {
        this.orgId = +rootId;
        return;
      }
    }

    const urlSegments = this.router.url.split('/');
    const orgIndex = urlSegments.findIndex((seg) => seg === 'organization');
    if (orgIndex >= 0 && urlSegments[orgIndex + 1]) {
      const urlId = +urlSegments[orgIndex + 1];
      if (!isNaN(urlId)) {
        this.orgId = urlId;
        return;
      }
    }

    console.error('[SideNav] 无法获取机构ID,当前URL:', this.router.url);
  }
}
