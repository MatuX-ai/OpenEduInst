import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrgAdminGuard } from '../../guards/organization.guard';
import { LicenseGuard } from '../../guards/license.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./institution-list.component').then((m) => m.InstitutionListComponent),
    canActivate: [OrgAdminGuard, LicenseGuard],
    data: { requiredFeature: 'stem_management' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./institution-dashboard.component').then((m) => m.InstitutionDashboardComponent),
    canActivate: [OrgAdminGuard, LicenseGuard],
    data: { requiredFeature: 'stem_management' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InstitutionManagementRoutingModule {}
