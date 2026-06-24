import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocTrainingSchedule, VocRoomUtilization } from '../../../../services/vocational.service';

@Component({
  selector: 'app-schedule-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>calendar_month</mat-icon> 排课管理</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="schedules" class="data-table">
            <ng-container matColumnDef="teacher_name">
              <th mat-header-cell *matHeaderCellDef>教师</th>
              <td mat-cell *matCellDef="let s">{{ s.teacher_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="weekday">
              <th mat-header-cell *matHeaderCellDef>星期</th>
              <td mat-cell *matCellDef="let s">{{ weekdayNames[s.weekday] || s.weekday }}</td>
            </ng-container>
            <ng-container matColumnDef="start_time">
              <th mat-header-cell *matHeaderCellDef>开始时间</th>
              <td mat-cell *matCellDef="let s">{{ s.start_time }}</td>
            </ng-container>
            <ng-container matColumnDef="end_time">
              <th mat-header-cell *matHeaderCellDef>结束时间</th>
              <td mat-cell *matCellDef="let s">{{ s.end_time }}</td>
            </ng-container>
            <ng-container matColumnDef="semester">
              <th mat-header-cell *matHeaderCellDef>学期</th>
              <td mat-cell *matCellDef="let s">{{ s.semester || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let s">{{ s.status }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="schedules.length === 0" class="empty">暂无排课</div>
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
export class ScheduleManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  schedules: VocTrainingSchedule[] = [];
  columns = ['teacher_name', 'weekday', 'start_time', 'end_time', 'semester', 'status'];
  weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
  ngOnInit() { this.vocService.getSchedules().subscribe(data => this.schedules = data); }
}