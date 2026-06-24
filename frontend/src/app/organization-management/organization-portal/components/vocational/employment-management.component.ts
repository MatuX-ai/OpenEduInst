import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocEmploymentRecord } from '../../../../services/vocational.service';

@Component({
  selector: 'app-employment-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>badge</mat-icon> 就业管理</h2>
        <span class="badge">已就业 {{ stats?.total_employed || 0 }} 人</span>
      </div>

      <div class="stats-row">
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">就业人数</div>
          <div class="stat-value">{{ stats?.total_employed || 0 }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">平均薪资</div>
          <div class="stat-value">{{ stats?.avg_salary || 0 }}</div>
        </mat-card-content></mat-card>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>就业记录</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="records" class="data-table">
            <ng-container matColumnDef="student_name">
              <th mat-header-cell *matHeaderCellDef>姓名</th>
              <td mat-cell *matCellDef="let r">{{ r.student_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="position_name">
              <th mat-header-cell *matHeaderCellDef>岗位</th>
              <td mat-cell *matCellDef="let r">{{ r.position_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="salary">
              <th mat-header-cell *matHeaderCellDef>薪资</th>
              <td mat-cell *matCellDef="let r">{{ r.salary ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>就业地点</th>
              <td mat-cell *matCellDef="let r">{{ r.location || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="entry_date">
              <th mat-header-cell *matHeaderCellDef>入职日期</th>
              <td mat-cell *matCellDef="let r">{{ r.entry_date || '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="records.length === 0" class="empty">暂无就业记录</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .badge { background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 13px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-label { font-size: 12px; color: rgba(0,0,0,0.5); margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 600; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class EmploymentManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  records: VocEmploymentRecord[] = [];
  stats: any = null;
  columns = ['student_name', 'position_name', 'salary', 'location', 'entry_date'];
  ngOnInit() {
    this.vocService.getEmploymentStats().subscribe(data => this.stats = data);
  }
}