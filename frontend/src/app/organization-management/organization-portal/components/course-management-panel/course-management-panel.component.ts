import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable } from 'rxjs';

import { CourseInfo } from '@app/core/services/org-admin.service';
import { UnifiedCourse } from '../../../../models/unified-course.models';
import { UnifiedCourseCardComponent } from '../../../../shared/components/unified-course-card/unified-course-card.component';

@Component({
  selector: 'app-course-management-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    UnifiedCourseCardComponent,
  ],
  template: `
    <div class="course-management-section">
      <!-- 热门课程 -->
      <div class="unified-courses-section" *ngIf="popularCourses$">
        <div class="section-header">
          <h3>热门课程</h3>
          <button mat-button color="primary">
            查看全部
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
        <div class="course-grid">
          <ng-container *ngIf="popularCourses$ | async as courses">
            <ng-container *ngIf="courses.length > 0; else noPopularCourses">
              <app-unified-course-card
                *ngFor="let course of courses.slice(0, 6)"
                [config]="{
                  course: course,
                  showEnrollButton: false,
                  showProgress: false,
                  showOrgName: false,
                  compact: true,
                }"
                (detail)="onViewCourseDetail(course.id)"
              >
              </app-unified-course-card>
            </ng-container>
            <ng-template #noPopularCourses>
              <div class="empty-state">
                <mat-icon>school</mat-icon>
                <p>暂无热门课程</p>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>

      <!-- 课程列表 -->
      <mat-tab-group>
        <mat-tab label="课程运营">
          <div class="tab-content">
            <div class="tab-header">
              <h3>课程列表</h3>
              <button mat-raised-button color="primary" (click)="onAddCourse()">
                <mat-icon>add</mat-icon>
                添加课程
              </button>
            </div>
            <mat-card>
              <mat-card-content>
                <table
                  mat-table
                  [dataSource]="courses"
                  class="edu-table"
                  *ngIf="courses.length > 0; else noCourses"
                >
                  <!-- 课程名称列 -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>课程名称</th>
                    <td mat-cell *matCellDef="let course">{{ course.name }}</td>
                  </ng-container>

                  <!-- 状态列 -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let course">
                      <span [class]="'status-badge ' + getCourseStatusColor(course.status)">
                        {{ getCourseStatusText(course.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- 学生数列 -->
                  <ng-container matColumnDef="studentCount">
                    <th mat-header-cell *matHeaderCellDef>学生数</th>
                    <td mat-cell *matCellDef="let course">{{ course.studentCount }}</td>
                  </ng-container>

                  <!-- 操作列 -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let course">
                      <button mat-icon-button color="primary" (click)="onViewCourse(course.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" (click)="onEditCourse(course.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="onDeleteCourse(course.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                </table>
                <ng-template #noCourses>
                  <div class="empty-state">
                    <mat-icon>inbox</mat-icon>
                    <p>暂无课程数据</p>
                  </div>
                </ng-template>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      .course-management-section {
        margin-bottom: 24px;
      }

      .unified-courses-section {
        margin-bottom: 24px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .course-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: $color-text-muted;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      .tab-content {
        padding: 16px 0;
      }

      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .tab-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .edu-table {
        width: 100%;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-active {
        background-color: rgba($color-secondary, 0.1);
        color: $color-secondary-dark;
      }

      .status-inactive {
        background-color: rgba($color-error, 0.1);
        color: $color-error;
      }

      .status-pending {
        background-color: rgba($color-warning, 0.1);
        color: $color-warning;
      }
    `,
  ],
})
export class CourseManagementPanelComponent {
  @Input() popularCourses$: Observable<UnifiedCourse[]> | null = null;
  @Input() courses: CourseInfo[] = [];

  @Output() viewCourseDetail = new EventEmitter<number>();
  @Output() addCourse = new EventEmitter<void>();
  @Output() viewCourse = new EventEmitter<number>();
  @Output() editCourse = new EventEmitter<number>();
  @Output() deleteCourse = new EventEmitter<number>();

  displayedColumns: string[] = ['name', 'status', 'studentCount', 'actions'];

  onViewCourseDetail(courseId: number): void {
    this.viewCourseDetail.emit(courseId);
  }

  onAddCourse(): void {
    this.addCourse.emit();
  }

  onViewCourse(courseId: number): void {
    this.viewCourse.emit(courseId);
  }

  onEditCourse(courseId: number): void {
    this.editCourse.emit(courseId);
  }

  onDeleteCourse(courseId: number): void {
    this.deleteCourse.emit(courseId);
  }

  getCourseStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'status-active',
      inactive: 'status-inactive',
      pending: 'status-pending',
    };
    return statusMap[status] || 'status-pending';
  }

  getCourseStatusText(status: string): string {
    const textMap: Record<string, string> = {
      active: '进行中',
      inactive: '已停用',
      pending: '待开始',
    };
    return textMap[status] || status;
  }
}
