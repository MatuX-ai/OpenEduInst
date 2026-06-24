import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocCourse } from '../../../../services/vocational.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>school</mat-icon> 实训课程管理</h2>
        <span class="badge">{{ courses.length }} 门课程</span>
      </div>
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="courses" class="data-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>课程名称</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>
            <ng-container matColumnDef="major">
              <th mat-header-cell *matHeaderCellDef>专业</th>
              <td mat-cell *matCellDef="let c">{{ c.major }}</td>
            </ng-container>
            <ng-container matColumnDef="grade">
              <th mat-header-cell *matHeaderCellDef>年级</th>
              <td mat-cell *matCellDef="let c">{{ c.grade || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="total_hours">
              <th mat-header-cell *matHeaderCellDef>总学时</th>
              <td mat-cell *matCellDef="let c">{{ c.total_hours }}</td>
            </ng-container>
            <ng-container matColumnDef="semester">
              <th mat-header-cell *matHeaderCellDef>学期</th>
              <td mat-cell *matCellDef="let c">{{ c.semester || '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="courses.length === 0" class="empty">暂无课程</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .badge { background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 12px; font-size: 13px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class CourseManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  courses: VocCourse[] = [];
  columns = ['name', 'major', 'grade', 'total_hours', 'semester'];
  ngOnInit() { this.vocService.getCourses().subscribe(data => this.courses = data); }
}