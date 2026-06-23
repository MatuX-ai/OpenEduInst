import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AdminAuditComponent } from './admin-audit.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminSecurityComponent } from './admin-security.component';
import { AdminUsersComponent } from './admin-users.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    // 所有子组件都声明为 standalone，这里只需再 import 一次以便延迟加载时可用
    AdminDashboardComponent,
    AdminAuditComponent,
    AdminUsersComponent,
    AdminSecurityComponent,
  ],
})
export class AdminModule {}
