import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocInternshipRecord } from '../../../../services/vocational.service';

@Component({
  selector: 'app-internship-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>work_history</mat-icon> 实习管理</h2>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>实习记录</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="internships" class="data-table">
            <ng-container matColumnDef="student_name">
              <th mat-header-cell *matHeaderCellDef>学生姓名</th>
              <td mat-cell *matCellDef="let i">{{ i.student_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="position_name">
              <th mat-header-cell *matHeaderCellDef>岗位名称</th>
              <td mat-cell *matCellDef="let i">{{ i.position_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="mentor_name">
              <th mat-header-cell *matHeaderCellDef>指导老师</th>
              <td mat-cell *matCellDef="let i">{{ i.mentor_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="start_date">
              <th mat-header-cell *matHeaderCellDef>开始日期</th>
              <td mat-cell *matCellDef="let i">{{ i.start_date || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="end_date">
              <th mat-header-cell *matHeaderCellDef>结束日期</th>
              <td mat-cell *matCellDef="let i">{{ i.end_date || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let i">{{ i.status }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="internships.length === 0" class="empty">暂无实习记录</div>
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
export class InternshipManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  internships: VocInternshipRecord[] = [];
  columns = ['student_name', 'position_name', 'mentor_name', 'start_date', 'end_date', 'status'];
  ngOnInit() { this.vocService.getInternships().subscribe(data => this.internships = data); }
}