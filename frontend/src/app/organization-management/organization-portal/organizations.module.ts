import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { BatchOperationsToolbarComponent } from './components/batch-operations-toolbar/batch-operations-toolbar.component';
import { ClassroomDashboardComponent } from './components/classroom-dashboard/classroom-dashboard.component';
import { FinanceDashboardComponent } from './components/finance-dashboard/finance-dashboard.component';
import { OrganizationSideNavComponent } from './components/organization-side-nav/organization-side-nav.component';
import { WechatCustomerServiceComponent } from './components/wechat-customer-service/wechat-customer-service.component';
import { OrganizationDashboardComponent } from './organization-dashboard.component';
import { OrganizationEditDialogComponent } from './organization-edit-dialog.component';
import { OrganizationListComponent } from './organization-list.component';
import { OrganizationRoutingModule } from './organization-routing.module';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatBadgeModule,
    MatNativeDateModule,
    OrganizationRoutingModule,
    OrganizationDashboardComponent,
    OrganizationEditDialogComponent,
    OrganizationListComponent,
    FinanceDashboardComponent,
    ClassroomDashboardComponent,
    BatchOperationsToolbarComponent,
    WechatCustomerServiceComponent,
    OrganizationSideNavComponent,
  ],
})
export class OrganizationsModule {}
