import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { OrganizationsModule } from './organization-management/organization-portal/organizations.module';
import { InstitutionManagementModule } from './admin/institution-management/institution-management.module';

const routes: Routes = [
  { path: '', redirectTo: '/organization', pathMatch: 'full' },
  { 
    path: 'organization', 
    loadChildren: () => import('./organization-management/organization-portal/organizations.module').then(m => m.OrganizationsModule)
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/institution-management/institution-management.module').then(m => m.InstitutionManagementModule)
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
