import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app.component';
import { OrganizationsModule } from './organization-management/organization-portal/organizations.module';
import { InstitutionManagementModule } from './admin/institution-management/institution-management.module';
import { authInterceptor } from './interceptors/auth.interceptor';

const routes: Routes = [
  { path: '', redirectTo: '/organization', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'create-org', 
    loadComponent: () => import('./pages/create-org/create-org.component').then(m => m.CreateOrgComponent)
  },
  { 
    path: 'organization', 
    loadChildren: () => import('./organization-management/organization-portal/organizations.module').then(m => m.OrganizationsModule)
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/institution-management/institution-management.module').then(m => m.InstitutionManagementModule)
  },
  {
    path: 'admin/audit',
    loadComponent: () => import('./admin/admin-audit.component').then(m => m.AdminAuditComponent),
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./admin/admin-users.component').then(m => m.AdminUsersComponent),
  },
  {
    path: 'admin/security',
    loadComponent: () => import('./admin/admin-security.component').then(m => m.AdminSecurityComponent),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  { path: '**', redirectTo: '/organization' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    OrganizationsModule,
    InstitutionManagementModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
