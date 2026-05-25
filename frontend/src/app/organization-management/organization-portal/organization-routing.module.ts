import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrgAdminGuard } from '../../guards/organization.guard';

import { OrganizationLayoutComponent } from './organization-layout.component';
import { OrganizationListComponent } from './organization-list.component';

const routes: Routes = [
  // 机构列表页面（默认页面）
  {
    path: '',
    component: OrganizationListComponent,
  },
  // 机构详情页面（需要ID）
  {
    path: ':id',
    component: OrganizationLayoutComponent,
    canActivate: [OrgAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./organization-dashboard.component').then(
            (m) => m.OrganizationDashboardComponent
          ),
      },
      // 财务模块：仅培训机构和职业学校可见（可通过 Guard 进一步控制）
      {
        path: 'finance',
        loadComponent: () =>
          import('./components/finance-dashboard/billing.component').then(
            (m) => m.BillingComponent
          ),
      },
      // 教室与设备管理（合并教室管理和设备资产）
      {
        path: 'devices',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/classroom-dashboard/classroom-dashboard.component').then(
                (m) => m.ClassroomDashboardComponent
              ),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('../../features/stem-cloud/hardware-management.component').then(
                (m) => m.HardwareManagementComponent
              ),
          },
          {
            path: ':id',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
              {
                path: 'edit',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
              {
                path: 'maintenance',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
            ],
          },
        ],
      },
      // 项目管理（包含教学资源和STEM项目）
      {
        path: 'projects',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/dashboard-overview/stem-features-container.component').then(
                (m) => m.StemFeaturesContainerComponent
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('../../features/stem-cloud/project-management.component').then(
                (m) => m.ProjectManagementComponent
              ),
          },
          {
            path: ':id',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../../features/stem-cloud/project-management.component').then(
                    (m) => m.ProjectManagementComponent
                  ),
              },
              {
                path: 'edit',
                loadComponent: () =>
                  import('../../features/stem-cloud/project-management.component').then(
                    (m) => m.ProjectManagementComponent
                  ),
              },
              {
                path: 'showcase',
                loadComponent: () =>
                  import('../../features/stem-cloud/project-management.component').then(
                    (m) => m.ProjectManagementComponent
                  ),
              },
            ],
          },
          {
            path: 'showcase',
            loadComponent: () =>
              import('../../features/stem-cloud/project-management.component').then(
                (m) => m.ProjectManagementComponent
              ),
          },
        ],
      },
      // 竞赛认证
      {
        path: 'competitions',
        loadComponent: () =>
          import('./components/competition-management/competition-list.component').then(
            (m) => m.CompetitionListComponent
          ),
      },
      // Token中心（合并购买Token功能）
      {
        path: 'tokens',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/token-purchase/token-purchase.component').then(
                (m) => m.TokenPurchaseComponent
              ),
          },
          {
            path: 'purchase',
            loadComponent: () =>
              import('../../features/stem-cloud/token-management.component').then(
                (m) => m.TokenManagementComponent
              ),
          },
          {
            path: 'report',
            loadComponent: () =>
              import('../../features/stem-cloud/token-management.component').then(
                (m) => m.TokenManagementComponent
              ),
          },
          {
            path: 'service',
            children: [
              {
                path: ':id',
                loadComponent: () =>
                  import('../../features/stem-cloud/token-management.component').then(
                    (m) => m.TokenManagementComponent
                  ),
              },
            ],
          },
        ],
      },
      // 系统设置
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/system-settings/system-settings.component').then(
            (m) => m.SystemSettingsComponent
          ),
      },
      // 消息中心
      {
        path: 'notifications',
        loadComponent: () =>
          import('./components/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },
      // 营销中心
      {
        path: 'marketing',
        loadComponent: () =>
          import('./components/marketing/marketing.component').then(
            (m) => m.MarketingComponent
          ),
      },
      // 家长中心
      {
        path: 'parent-portal',
        loadComponent: () =>
          import('./components/parent-portal/parent-portal.component').then(
            (m) => m.ParentPortalComponent
          ),
      },
      // 多校区管理
      {
        path: 'multi-campus',
        loadComponent: () =>
          import('./components/multi-campus/multi-campus.component').then(
            (m) => m.MultiCampusComponent
          ),
      },
      // 微信客服：通用功能
      {
        path: 'wechat-cs',
        loadComponent: () =>
          import('./components/wechat-customer-service/wechat-customer-service.component').then(
            (m) => m.WechatCustomerServiceComponent
          ),
      },
      // 教师管理：通用功能
      {
        path: 'teachers',
        loadComponent: () =>
          import('./components/teacher-management/teacher-list.component').then(
            (m) => m.TeacherListComponent
          ),
      },
      // 学生管理：通用功能
      {
        path: 'students',
        loadComponent: () =>
          import('./components/student-management/student-list.component').then(
            (m) => m.StudentListComponent
          ),
      },
      // 招生线索管理
      {
        path: 'leads',
        loadComponent: () =>
          import('./components/leads-management/leads-management.component').then(
            (m) => m.LeadsManagementComponent
          ),
      },
      // 教学资源中心
      {
        path: 'resources',
        loadComponent: () =>
          import('./components/teaching-resources/teaching-resources.component').then(
            (m) => m.TeachingResourcesComponent
          ),
      },
      // 排课管理：教育局通常不需要此功能，可考虑增加类型守卫
      {
        path: 'schedule',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/schedule-management/schedule-main.component').then(
                (m) => m.ScheduleMainComponent
              ),
          },
          {
            path: 'batch',
            loadComponent: () =>
              import('./components/schedule-management/batch-schedule.component').then(
                (m) => m.BatchScheduleComponent
              ),
          },
        ],
      },
      // STEM空间预约
      {
        path: 'spaces',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../../features/stem-cloud/space-scheduling.component').then(
                (m) => m.SpaceSchedulingComponent
              ),
          },
          {
            path: 'book',
            loadComponent: () =>
              import('../../features/stem-cloud/space-scheduling.component').then(
                (m) => m.SpaceSchedulingComponent
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../../features/stem-cloud/space-scheduling.component').then(
                (m) => m.SpaceSchedulingComponent
              ),
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import('../../features/stem-cloud/space-scheduling.component').then(
                (m) => m.SpaceSchedulingComponent
              ),
          },
          {
            path: 'bookings',
            children: [
              {
                path: ':id',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import('../../features/stem-cloud/space-scheduling.component').then(
                        (m) => m.SpaceSchedulingComponent
                      ),
                  },
                  {
                    path: 'edit',
                    loadComponent: () =>
                      import('../../features/stem-cloud/space-scheduling.component').then(
                        (m) => m.SpaceSchedulingComponent
                      ),
                  },
                ],
              },
            ],
          },
        ],
      },
      // 角色权限：通用功能
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/role-permission/role-list.component').then(
            (m) => m.RoleListComponent
          ),
      },
      // 数据分析：已整合到仪表盘中
      {
        path: 'analytics',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // 许可证管理
      {
        path: 'licenses',
        loadComponent: () =>
          import('./components/license-management/license-management.component').then(
            (m) => m.LicenseManagementComponent
          ),
      },
      // 购买 Token
      {
        path: 'purchase-tokens',
        loadComponent: () =>
          import('./components/token-purchase/token-purchase.component').then(
            (m) => m.TokenPurchaseComponent
          ),
      },
      // 用户管理
      {
        path: 'users',
        loadComponent: () =>
          import('./components/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationRoutingModule {}
