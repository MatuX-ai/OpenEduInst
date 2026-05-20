import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrgAdminGuard } from '../../guards/organization.guard';

import { OrganizationLayoutComponent } from './organization-layout.component';

const routes: Routes = [
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
          import('./components/finance-dashboard/finance-dashboard.component').then(
            (m) => m.FinanceDashboardComponent
          ),
      },
      // 教室管理：通用功能
      {
        path: 'classrooms',
        loadComponent: () =>
          import('./components/classroom-dashboard/classroom-dashboard.component').then(
            (m) => m.ClassroomDashboardComponent
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
      // 角色权限：通用功能
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/role-permission/role-list.component').then(
            (m) => m.RoleListComponent
          ),
      },
      // 数据分析：通用功能，但不同组织类型展示内容不同
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/data-analytics/data-analytics-dashboard.component').then(
            (m) => m.DataAnalyticsDashboardComponent
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
