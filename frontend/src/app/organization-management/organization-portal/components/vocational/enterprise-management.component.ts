import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocEnterprise, VocEnterpriseDemand } from '../../../../services/vocational.service';

@Component({
  selector: 'app-enterprise-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>business</mat-icon> 合作企业管理</h2>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>企业列表</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="enterprises" class="data-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>企业名称</th>
              <td mat-cell *matCellDef="let e">{{ e.name }}</td>
            </ng-container>
            <ng-container matColumnDef="industry">
              <th mat-header-cell *matHeaderCellDef>行业领域</th>
              <td mat-cell *matCellDef="let e">{{ e.industry || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="contact_person">
              <th mat-header-cell *matHeaderCellDef>联系人</th>
              <td mat-cell *matCellDef="let e">{{ e.contact_person || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="contact_phone">
              <th mat-header-cell *matHeaderCellDef>联系电话</th>
              <td mat-cell *matCellDef="let e">{{ e.contact_phone || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="cooperation_years">
              <th mat-header-cell *matHeaderCellDef>合作年限</th>
              <td mat-cell *matCellDef="let e">{{ e.cooperation_years ?? '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="enterprises.length === 0" class="empty">暂无合作企业</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class EnterpriseManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  enterprises: VocEnterprise[] = [];
  columns = ['name', 'industry', 'contact_person', 'contact_phone', 'cooperation_years'];
  ngOnInit() { this.vocService.getEnterprises().subscribe(data => this.enterprises = data); }
}