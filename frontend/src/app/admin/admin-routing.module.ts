import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminAuditComponent } from './admin-audit.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminSecurityComponent } from './admin-security.component';
import { AdminUsersComponent } from './admin-users.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
  },
  {
    path: 'audit',
    component: AdminAuditComponent,
    title: '审计日志',
  },
  {
    path: 'users',
    component: AdminUsersComponent,
    title: '用户管理',
  },
  {
    path: 'security',
    component: AdminSecurityComponent,
    title: '安全设置',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
