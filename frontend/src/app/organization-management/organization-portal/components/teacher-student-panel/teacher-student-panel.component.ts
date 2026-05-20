import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { StudentInfo, TeacherInfo } from '@app/core/services/org-admin.service';

@Component({
  selector: 'app-teacher-student-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
  ],
  template: `
    <div class="teacher-student-section">
      <mat-tab-group>
        <!-- 教师管理 -->
        <mat-tab label="教师管理">
          <div class="tab-content">
            <div class="tab-header">
              <h3>教师列表</h3>
              <button mat-raised-button color="primary" (click)="onAddTeacher()">
                <mat-icon>add</mat-icon>
                添加教师
              </button>
            </div>
            <mat-card>
              <mat-card-content>
                <table
                  mat-table
                  [dataSource]="teachers"
                  class="edu-table"
                  *ngIf="teachers.length > 0; else noTeachers"
                >
                  <!-- 姓名列 -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>姓名</th>
                    <td mat-cell *matCellDef="let teacher">{{ teacher.name }}</td>
                  </ng-container>

                  <!-- 部门列 -->
                  <ng-container matColumnDef="department">
                    <th mat-header-cell *matHeaderCellDef>部门</th>
                    <td mat-cell *matCellDef="let teacher">{{ teacher.department }}</td>
                  </ng-container>

                  <!-- 状态列 -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let teacher">
                      <span [class]="'status-badge ' + getTeacherStatusColor(teacher.status)">
                        {{ getTeacherStatusText(teacher.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- 操作列 -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let teacher">
                      <button mat-icon-button color="primary" (click)="onViewTeacher(teacher.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" (click)="onEditTeacher(teacher.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="teacherColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: teacherColumns"></tr>
                </table>
                <ng-template #noTeachers>
                  <div class="empty-state">
                    <mat-icon>people</mat-icon>
                    <p>暂无教师数据</p>
                  </div>
                </ng-template>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- 学生管理 -->
        <mat-tab label="学生管理">
          <div class="tab-content">
            <div class="tab-header">
              <h3>学生列表</h3>
              <button mat-raised-button color="primary" (click)="onAddStudent()">
                <mat-icon>add</mat-icon>
                添加学生
              </button>
            </div>
            <mat-card>
              <mat-card-content>
                <table
                  mat-table
                  [dataSource]="students"
                  class="edu-table"
                  *ngIf="students.length > 0; else noStudents"
                >
                  <!-- 姓名列 -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>姓名</th>
                    <td mat-cell *matCellDef="let student">{{ student.name }}</td>
                  </ng-container>

                  <!-- 年级列 -->
                  <ng-container matColumnDef="grade">
                    <th mat-header-cell *matHeaderCellDef>年级</th>
                    <td mat-cell *matCellDef="let student">{{ student.grade }}</td>
                  </ng-container>

                  <!-- 状态列 -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let student">
                      <span [class]="'status-badge ' + getStudentStatusColor(student.status)">
                        {{ getStudentStatusText(student.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- 操作列 -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let student">
                      <button mat-icon-button color="primary" (click)="onViewStudent(student.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" (click)="onEditStudent(student.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="studentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: studentColumns"></tr>
                </table>
                <ng-template #noStudents>
                  <div class="empty-state">
                    <mat-icon>school</mat-icon>
                    <p>暂无学生数据</p>
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
      .teacher-student-section {
        margin-bottom: 24px;
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

      .empty-state {
        text-align: center;
        padding: 40px;
        color: rgba(0, 0, 0, 0.5);
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-active {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .status-inactive {
        background-color: #ffebee;
        color: #c62828;
      }

      .status-on_leave {
        background-color: #fff3e0;
        color: #ef6c00;
      }
    `,
  ],
})
export class TeacherStudentPanelComponent {
  @Input() teachers: TeacherInfo[] = [];
  @Input() students: StudentInfo[] = [];

  @Output() addTeacher = new EventEmitter<void>();
  @Output() viewTeacher = new EventEmitter<number>();
  @Output() editTeacher = new EventEmitter<number>();
  @Output() addStudent = new EventEmitter<void>();
  @Output() viewStudent = new EventEmitter<number>();
  @Output() editStudent = new EventEmitter<number>();

  teacherColumns: string[] = ['name', 'department', 'status', 'actions'];
  studentColumns: string[] = ['name', 'grade', 'status', 'actions'];

  onAddTeacher(): void {
    this.addTeacher.emit();
  }

  onViewTeacher(teacherId: number): void {
    this.viewTeacher.emit(teacherId);
  }

  onEditTeacher(teacherId: number): void {
    this.editTeacher.emit(teacherId);
  }

  onAddStudent(): void {
    this.addStudent.emit();
  }

  onViewStudent(studentId: number): void {
    this.viewStudent.emit(studentId);
  }

  onEditStudent(studentId: number): void {
    this.editStudent.emit(studentId);
  }

  getTeacherStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'status-active',
      inactive: 'status-inactive',
      on_leave: 'status-on_leave',
    };
    return statusMap[status] || 'status-inactive';
  }

  getTeacherStatusText(status: string): string {
    const textMap: Record<string, string> = {
      active: '在职',
      inactive: '离职',
      on_leave: '休假',
    };
    return textMap[status] || status;
  }

  getStudentStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'status-active',
      inactive: 'status-inactive',
      graduated: 'status-on_leave',
    };
    return statusMap[status] || 'status-inactive';
  }

  getStudentStatusText(status: string): string {
    const textMap: Record<string, string> = {
      active: '在读',
      inactive: '休学',
      graduated: '已毕业',
    };
    return textMap[status] || status;
  }
}
