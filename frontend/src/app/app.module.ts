import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app.component';
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
    children: [
      {
        path: '',
        loadChildren: () => import('./admin/institution-management/institution-management.module').then(m => m.InstitutionManagementModule),
      },
      {
        path: 'audit',
        loadComponent: () => import('./admin/admin-audit.component').then(m => m.AdminAuditComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'security',
        loadComponent: () => import('./admin/admin-security.component').then(m => m.AdminSecurityComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
    ],
  },
  // STEM 教育管理路由
  {
    path: 'stem',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/stem-cloud/stem-dashboard.component').then(m => m.StemDashboardComponent),
      },
      {
        path: 'clubs',
        loadComponent: () => import('./features/stem-cloud/stem-club-list.component').then(m => m.StemClubListComponent),
      },
      {
        path: 'clubs/:id',
        loadComponent: () => import('./features/stem-cloud/stem-club-detail.component').then(m => m.StemClubDetailComponent),
      },
      {
        path: 'consumables',
        loadComponent: () => import('./features/stem-cloud/stem-consumable-list.component').then(m => m.StemConsumableListComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { 
    path: '**', 
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
