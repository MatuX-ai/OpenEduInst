import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./institution-list.component').then((m) => m.InstitutionListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./institution-dashboard.component').then((m) => m.InstitutionDashboardComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InstitutionManagementRoutingModule {}
