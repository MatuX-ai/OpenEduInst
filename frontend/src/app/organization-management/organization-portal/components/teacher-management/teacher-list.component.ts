import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Teacher, TeacherFilter, TeacherStats, TeacherStatus } from '../../models/teacher.models';
import { TeacherManagementService } from '../../services/teacher-management.service';

@Component({
  selector: 'app-teacher-list',
  template: `
    <div class="teacher-management">
      <!-- 顶部统计卡片 -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon total">people</mat-icon>
              <h3>教师总数</h3>
            </div>
            <div class="stat-value">{{ stats?.totalCount || 0 }}</div>
            <div class="stat-footer">全部在职教师</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon active">check_circle</mat-icon>
              <h3>在职教师</h3>
            </div>
            <div class="stat-value">{{ stats?.activeCount || 0 }}</div>
            <div class="stat-footer">正在授课中</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon leave">schedule</mat-icon>
              <h3>请假教师</h3>
            </div>
            <div class="stat-value">{{ stats?.onLeaveCount || 0 }}</div>
            <div class="stat-footer">暂时不在岗</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon rating">star</mat-icon>
              <h3>平均评分</h3>
            </div>
            <div class="stat-value">{{ stats?.averageRating?.toFixed(1) || 0 }}</div>
            <div class="stat-footer">学员评价</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 操作工具栏 -->
      <div class="toolbar">
        <h1><mat-icon>person</mat-icon> 教师管理</h1>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="createTeacher()">
            <mat-icon>add</mat-icon>
            添加教师
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载教师列表...</p>
      </div>

      <!-- 错误状态 -->
      <div *ngIf="!loading && error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadTeachers()">重试</button>
      </div>

      <!-- 教师列表 -->
      <div *ngIf="!loading && !error && teachers.length > 0" class="content">
        <table mat-table [dataSource]="teachers" class="mat-elevation-z8 teacher-table">
          <!-- ID 列 -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.id }}</td>
          </ng-container>

          <!-- 姓名 列 -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>姓名</th>
            <td mat-cell *matCellDef="let teacher">
              <div class="teacher-info">
                <img
                  *ngIf="teacher.avatar"
                  [src]="teacher.avatar"
                  alt="{{ teacher.name }}"
                  class="avatar"
                />
                <span>{{ teacher.name }}</span>
              </div>
            </td>
          </ng-container>

          <!-- 邮箱列 -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>邮箱</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.email }}</td>
          </ng-container>

          <!-- 电话列 -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>电话</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.phone || '-' }}</td>
          </ng-container>

          <!-- 部门列 -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>部门</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.department }}</td>
          </ng-container>

          <!-- 职位列 -->
          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef>职位</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.position || '-' }}</td>
          </ng-container>

          <!-- 授课数 列 -->
          <ng-container matColumnDef="courseCount">
            <th mat-header-cell *matHeaderCellDef>授课数</th>
            <td mat-cell *matCellDef="let teacher">{{ teacher.courseCount }}</td>
          </ng-container>

          <!-- 评分列 -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef>评分</th>
            <td mat-cell *matCellDef="let teacher">
              <div class="rating-display" *ngIf="teacher.rating">
                <mat-icon>star</mat-icon>
                {{ teacher.rating.toFixed(1) }}
              </div>
            </td>
          </ng-container>

          <!-- 状态列 -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let teacher">
              <mat-chip [color]="getTeacherStatusColor(teacher.status)">
                {{ getTeacherStatusText(teacher.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- 操作列 -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let teacher">
              <button
                mat-icon-button
                color="primary"
                (click)="viewTeacher(teacher)"
                matTooltip="查看详情"
              >
                <mat-icon>visibility</mat-icon>
              </button>
              <button
                mat-icon-button
                color="accent"
                (click)="editTeacher(teacher)"
                matTooltip="编辑"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="deleteTeacher(teacher.id)"
                matTooltip="删除"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>

      <!-- 空状态 -->
      <div *ngIf="!loading && !error && teachers.length === 0" class="empty-state">
        <mat-icon>inbox</mat-icon>
        <h3>暂无教师数据</h3>
        <p>点击上方按钮添加第一个教师</p>
      </div>
    </div>
  `,
  styles: [
    `
      .teacher-management {
        height: 100%;
        overflow-y: auto;
        padding: 24px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        padding: 12px;
        color: white;
      }

      .stat-icon.total {
        background: linear-gradient(135deg, #2196f3, #1565c0);
      }

      .stat-icon.active {
        background: linear-gradient(135deg, #4caf50, #2e7d32);
      }

      .stat-icon.leave {
        background: linear-gradient(135deg, #ff9800, #ef6c00);
      }

      .stat-icon.rating {
        background: linear-gradient(135deg, #9c27b0, #6a1b9a);
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #333;
        margin: 8px 0;
      }

      .stat-footer {
        font-size: 0.9rem;
        color: #888;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .toolbar h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 1.75rem;
        color: #333;
      }

      .actions {
        display: flex;
        gap: 12px;
      }

      .loading-container,
      .error-container,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;
        text-align: center;
      }

      .error-container mat-icon.error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #f44336;
        margin-bottom: 16px;
      }

      .empty-state {
        background: #f5f5f5;
        border-radius: 8px;
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #999;
        margin-bottom: 16px;
      }

      .teacher-table {
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
      }

      table th {
        background: #f5f5f5;
        font-weight: 600;
        color: #333;
      }

      .teacher-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .rating-display {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #ff9800;
        font-weight: 600;
      }

      .rating-display mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  stats: TeacherStats | null = null;
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'id',
    'name',
    'email',
    'phone',
    'department',
    'position',
    'courseCount',
    'rating',
    'status',
    'actions',
  ];

  // 筛选条件
  filter: TeacherFilter = {
    department: undefined,
    status: undefined,
    search: undefined,
  };

  departments: string[] = [];
  selectedTeacherIds: number[] = [];
  showFilterPanel = false;

  constructor(
    private teacherService: TeacherManagementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadStats();
    this.loadDepartments();
  }

  /**
   * 加载教师列表
   */
  loadTeachers(): void {
    this.loading = true;
    this.error = null;

    this.teacherService.getTeachers().subscribe({
      next: (data: Teacher[]) => {
        this.teachers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('加载教师列表失败:', err);
        this.error = '加载教师列表失败，请稍后重试';
        this.loading = false;
        this.showSnackbar('加载失败', 'error');
      },
    });
  }

  /**
   * 加载统计数据
   */
  loadStats(): void {
    this.teacherService.getStats().subscribe({
      next: (data: TeacherStats) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('加载统计数据失败:', err);
      },
    });
  }

  /**
   * 加载部门列表
   */
  loadDepartments(): void {
    this.teacherService.getDepartments().subscribe({
      next: (depts) => {
        this.departments = depts;
      },
      error: (err) => {
        console.error('加载部门列表失败:', err);
      },
    });
  }

  /**
   * 创建教师
   */
  createTeacher(): void {
    // TODO: 打开创建对话框
    this.showSnackbar('教师添加功能开发中...', 'info');
  }

  /**
   * 查看教师详情
   */
  viewTeacher(teacher: Teacher): void {
    // TODO: 打开详情对话框
    this.showSnackbar(`查看 ${teacher.name} 详情`, 'info');
  }

  /**
   * 编辑教师
   */
  editTeacher(teacher: Teacher): void {
    // TODO: 打开编辑对话框
    this.showSnackbar(`编辑 ${teacher.name}`, 'info');
  }

  /**
   * 删除教师
   */
  deleteTeacher(id: number): void {
    const confirmed = confirm('确定要删除这个教师吗？此操作不可恢复。');
    if (!confirmed) return;

    this.teacherService.deleteTeacher(id).subscribe({
      next: () => {
        this.loadTeachers();
        this.loadStats();
        this.showSnackbar('教师删除成功', 'success');
      },
      error: (err) => {
        console.error('删除教师失败:', err);
        this.showSnackbar('删除失败', 'error');
      },
    });
  }

  /**
   * 批量删除
   */
  batchDelete(): void {
    if (this.selectedTeacherIds.length === 0) {
      this.showSnackbar('请至少选择一个教师', 'error');
      return;
    }

    if (!confirm(`确定要删除选中的 ${this.selectedTeacherIds.length} 位教师吗？`)) {
      return;
    }

    this.teacherService
      .batchOperation({
        teacherIds: this.selectedTeacherIds,
        operation: 'delete',
      })
      .subscribe({
        next: () => {
          this.showSnackbar('批量删除成功', 'success');
          this.selectedTeacherIds = [];
          this.loadTeachers();
          this.loadStats();
        },
        error: (err) => {
          console.error('批量删除失败:', err);
          this.showSnackbar('批量删除失败，请稍后重试', 'error');
        },
      });
  }

  /**
   * 批量更改状态
   */
  batchChangeStatus(status: TeacherStatus): void {
    if (this.selectedTeacherIds.length === 0) {
      this.showSnackbar('请至少选择一个教师', 'error');
      return;
    }

    this.teacherService
      .batchOperation({
        teacherIds: this.selectedTeacherIds,
        operation: 'change_status',
        data: { status },
      })
      .subscribe({
        next: () => {
          this.showSnackbar(`已将选中教师状态更改为${status}`, 'success');
          this.selectedTeacherIds = [];
          this.loadTeachers();
          this.loadStats();
        },
        error: (err) => {
          console.error('批量更改状态失败:', err);
          this.showSnackbar('操作失败，请稍后重试', 'error');
        },
      });
  }

  /**
   * 应用筛选
   */
  applyFilter(): void {
    this.selectedTeacherIds = [];
    this.loadTeachers();
  }

  /**
   * 重置筛选
   */
  resetFilter(): void {
    this.filter = {
      department: undefined,
      status: undefined,
      search: undefined,
    };
    this.selectedTeacherIds = [];
    this.loadTeachers();
  }

  /**
   * 搜索输入防抖
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filter.search = value || undefined;
    this.applyFilter();
  }

  /**
   * 选择教师切换
   */
  onTeacherToggle(teacherId: number, event: { checked: boolean }): void {
    if (event.checked) {
      this.selectedTeacherIds.push(teacherId);
    } else {
      const index = this.selectedTeacherIds.indexOf(teacherId);
      if (index > -1) {
        this.selectedTeacherIds.splice(index, 1);
      }
    }
  }

  /**
   * 全选切换
   */
  onSelectAll(event: { checked: boolean }): void {
    if (event.checked) {
      this.selectedTeacherIds = this.teachers.map((t) => t.id);
    } else {
      this.selectedTeacherIds = [];
    }
  }

  /**
   * 获取状态颜色
   */
  getTeacherStatusColor(status: TeacherStatus): string {
    const statusColors: Record<TeacherStatus, string> = {
      active: 'primary',
      inactive: 'warn',
      on_leave: 'accent',
    };
    return statusColors[status];
  }

  /**
   * 获取状态文本
   */
  getTeacherStatusText(status: TeacherStatus): string {
    const statusText: Record<TeacherStatus, string> = {
      active: '在职',
      inactive: '离职',
      on_leave: '请假',
    };
    return statusText[status];
  }

  /**
   * 显示通知
   */
  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClassMap = {
      success: ['success-snackbar'],
      error: ['error-snackbar'],
      info: [],
    };

    this.snackBar.open(message, '关闭', {
      duration: 3000,
      panelClass: panelClassMap[type],
    });
  }
}
