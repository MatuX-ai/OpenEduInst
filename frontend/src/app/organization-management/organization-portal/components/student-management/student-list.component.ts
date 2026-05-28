/**
 * 学员列表组件
 *
 * @fileoverview 展示学员列表，支持筛选、搜索、批量操作
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription } from 'rxjs';

import { StudentService } from '../../../../core/services/student.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { Student, AttendanceRecord, Enrollment } from '../../../../models/education-management.models';
import { StudentDetailDialogComponent } from './student-detail-dialog.component';
import { StudentEditDialogComponent } from './student-edit-dialog.component';

// 本地类型定义以适配现有 UI
interface Grade {
  id: number;
  name: string;
  studentCount: number;
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  graduatedStudents: number;
  averageProgress: number;
  averageAttendanceRate: number;
  totalEnrolledCourses: number;
  totalPayment: number;
}

interface StudentFilter {
  keyword?: string;
  status?: string;
  grade?: string;
  page: number;
  pageSize: number;
}

type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped_out' | 'suspended' | 'transferred';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSnackBarModule,
    StudentEditDialogComponent,
    StudentDetailDialogComponent,
  ],
  template: `
<div class="student-list-container">
  <!-- 工具栏 -->
  <div class="toolbar">
    <div>
      <h1 class="page-title">学员管理</h1>
      <p class="page-subtitle">管理学员档案、学习进度和续费提醒</p>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      @if (isSelectionActive) {
        <div class="batch-toolbar">
          <span class="selected-count">
            <mat-icon>check_circle</mat-icon>
            已选择 {{ selectedStudents.size }} 位
          </span>
          <button mat-stroked-button color="primary" (click)="onBatchUpdateStatus('active')">
            <mat-icon>check_circle</mat-icon>
            设为在读
          </button>
          <button mat-stroked-button color="warn" (click)="onBatchUpdateStatus('inactive')">
            <mat-icon>pause_circle</mat-icon>
            设为休学
          </button>
          <button mat-stroked-button color="accent" (click)="onBatchUpdateStatus('graduated')">
            <mat-icon>emoji_events</mat-icon>
            设为毕业
          </button>
          <button mat-icon-button matTooltip="取消选择" (click)="clearSelection()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      } @else {
        <button class="btn-primary" (click)="onAddStudent()">
          <mat-icon>person_add</mat-icon>
          添加学员
        </button>
      }
    </div>
  </div>

  <!-- 统计卡片 -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">在训学员</p>
          <p class="stat-value">{{ stats.totalStudents || 0 }}</p>
          <p class="stat-trend success">
            <mat-icon class="trend-icon">trending_up</mat-icon>
            +12.5% 较上月
          </p>
        </div>
        <div class="stat-icon-wrapper blue">
          <mat-icon>people</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">本月消课</p>
          <p class="stat-value">1,248</p>
          <p class="stat-trend text-muted">课时</p>
        </div>
        <div class="stat-icon-wrapper purple">
          <mat-icon>access_time</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">即将到期</p>
          <p class="stat-value">23</p>
          <p class="stat-trend warning">需跟进续费</p>
        </div>
        <div class="stat-icon-wrapper amber">
          <mat-icon>book</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">续费率</p>
          <p class="stat-value">78%</p>
          <p class="stat-trend success">行业领先</p>
        </div>
        <div class="stat-icon-wrapper emerald">
          <mat-icon>military_tech</mat-icon>
        </div>
      </div>
    </div>
  </div>

  <!-- 表格内容 -->
  <div class="table-card">
    <div class="table-header">
      <div class="table-title-section">
        <h2 class="table-title">学员列表</h2>
        <span class="table-count">共 {{ total }} 人</span>
      </div>
      <div class="table-actions">
        <div class="search-field-wrapper">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            [(ngModel)]="filter.keyword" 
            placeholder="搜索学员姓名..."
            (keyup.enter)="onSearch()"
            class="search-input"
          />
          @if (filter.keyword) {
            <button mat-icon-button class="clear-btn" (click)="filter.keyword = ''; onSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
        <button class="btn-secondary" (click)="resetFilter()">
          <mat-icon>filter_list</mat-icon>
          筛选
        </button>
      </div>
    </div>

    @if (loading) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <table mat-table [dataSource]="students" class="student-table">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>学员信息</th>
        <td mat-cell *matCellDef="let student">
          <div class="student-info-cell">
            <div class="avatar-circle" [style.background]="getAvatarColor(student.name)">
              {{ student.name.charAt(0) }}
            </div>
            <div class="student-text">
              <p class="student-name">{{ student.name }}</p>
              <p class="student-grade">{{ student.grade }}</p>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="courses">
        <th mat-header-cell *matHeaderCellDef>报读课程</th>
        <td mat-cell *matCellDef="let student">
          <div class="course-tags">
            <mat-chip size="small" class="course-chip">{{ student.enrolledCourses }} 门课程</mat-chip>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="hours">
        <th mat-header-cell *matHeaderCellDef>剩余课时</th>
        <td mat-cell *matCellDef="let student">
          <div class="hours-cell">
            <p class="hours-text">{{ student.attendanceRate || 0 }} / 48</p>
            <div class="hours-bar-bg">
              <div 
                class="hours-bar-fill" 
                [style.width.%]="student.attendanceRate || 0"
                [class]="getHoursBarClass(student.attendanceRate)">
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="projects">
        <th mat-header-cell *matHeaderCellDef>项目成果</th>
        <td mat-cell *matCellDef="let student">
          <div class="projects-cell">
            <span class="project-count">{{ student.progress }} 个项目</span>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="lastClass">
        <th mat-header-cell *matHeaderCellDef>最近上课</th>
        <td mat-cell *matCellDef="let student">
          <span class="last-class-text">2026-05-20</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>状态</th>
        <td mat-cell *matCellDef="let student">
          <span class="status-badge" [class]="getStatusBadgeClass(student.status)">
            {{ getStatusChipLabel(student.status) }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>操作</th>
        <td mat-cell *matCellDef="let student">
          <div class="action-buttons">
            <button class="action-link primary" (click)="onViewDetail(student)">详情</button>
            <button class="action-link" (click)="onEditStudent(student)">编辑</button>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="student-row"></tr>
    </table>

    @if (!loading && students.length === 0) {
      <div class="empty-state">
        <mat-icon>person_search</mat-icon>
        <h3>暂无学员数据</h3>
        <p>当前筛选条件下没有找到学员</p>
      </div>
    }

    @if (total > 0) {
      <div class="pagination-section">
        <p class="pagination-info">显示 1-{{ students.length }} 条，共 {{ total }} 条</p>
        <mat-paginator
          [length]="total"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="[5, 10, 20, 50]"
          showFirstLastButtons
          (page)="onPageChange($event)"
          aria-label="分页">
        </mat-paginator>
      </div>
    }
  </div>
</div>
  `,
  styles: [
    `
      @use '../../../styles/design-tokens' as *;
      .student-list-container{height:100%;overflow-y:auto}
      .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:$spacing-md;margin-bottom:$spacing-lg}
      .stat-card{border-radius:$radius-lg;box-shadow:$shadow-sm;border:1px solid $color-neutral-200;padding:20px;&:hover{box-shadow:$shadow-md}}
      .stat-content{display:flex;justify-content:space-between;align-items:flex-start}
      .stat-info{flex:1}
      .stat-label{font-size:$font-size-xs;color:$color-neutral-500;margin:0 0 $spacing-xs 0}
      .stat-value{font-size:$font-size-2xl;font-weight:700;color:$color-neutral-900;margin:$spacing-xs 0}
      .stat-trend{font-size:$font-size-xs;margin:$spacing-xs 0 0 0;display:flex;align-items:center;gap:4px;.trend-icon{font-size:$font-size-xs;width:12px;height:12px}&.success{color:$color-stem-green}&.warning{color:#d97706}&.text-muted{color:$color-neutral-500}}
      .stat-icon-wrapper{width:48px;height:48px;border-radius:$radius-lg;display:flex;align-items:center;justify-content:center;flex-shrink:0;mat-icon{font-size:24px;width:24px;height:24px}&.blue{background:$color-brand-primary-bg;color:$color-brand-primary}&.purple{background:$color-brand-primary-bg;color:$color-brand-primary}&.amber{background:$color-warning-light;color:$color-warning}&.emerald{background:$color-stem-green-bg;color:$color-stem-green}}
      .toolbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:$spacing-lg;.page-title{margin:0;font-size:$font-size-xl;font-weight:700;color:$color-neutral-900}.page-subtitle{margin:$spacing-xs 0 0 0;font-size:$font-size-sm;color:$color-neutral-500}.actions{display:flex;gap:$spacing-md}}
      .search-field-wrapper{position:relative;flex:1;max-width:300px;.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px;width:16px;height:16px;color:$color-neutral-400}.search-input{width:100%;padding:8px 16px 8px 36px;border:1px solid $color-neutral-200;border-radius:$radius-lg;font-size:$font-size-sm;outline:none;background:$card-bg;&:focus{border-color:$color-brand-primary;box-shadow:0 0 0 3px rgba(0,102,255,0.1)}&::placeholder{color:$color-neutral-400}}.clear-btn{position:absolute;right:4px;top:50%;transform:translateY(-50%)}}
      .batch-toolbar{display:flex;align-items:center;gap:$spacing-md;padding:$spacing-sm $spacing-md;background:$color-brand-primary-subtle;border-radius:$radius-md;flex-wrap:wrap;.selected-count{display:flex;align-items:center;gap:$spacing-xs;font-weight:500;color:var(--color-primary)}}
      .table-card{border-radius:$card-border-radius;box-shadow:$card-shadow;border:$card-border;overflow:hidden}
      .table-header{padding:20px;border-bottom:1px solid $color-neutral-100;display:flex;justify-content:space-between;align-items:center}
      .table-title-section{display:flex;align-items:center;gap:$spacing-sm}
      .table-title{margin:0;font-size:$font-size-base;font-weight:600;color:$color-neutral-800}
      .table-count{font-size:$font-size-xs;padding:2px 8px;background:$color-neutral-100;color:$color-neutral-600;border-radius:$radius-full}
      .table-actions{display:flex;gap:$spacing-md;align-items:center}
      .student-table{width:100%;th.mat-header-cell{font-weight:500;font-size:$font-size-xs;color:$color-neutral-600;text-transform:uppercase;letter-spacing:0.05em;background-color:$color-neutral-50;border-bottom:1px solid $color-neutral-200;padding:12px 20px}td.mat-cell{border-bottom:1px solid $color-neutral-100;padding:16px 20px;vertical-align:middle}tr.student-row{transition:background-color $transition-fast;&:hover{background-color:$color-neutral-50}}}
      .student-info-cell{display:flex;align-items:center;gap:$spacing-sm}
      .avatar-circle{width:40px;height:40px;border-radius:$radius-full;color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:$font-size-sm;background:linear-gradient(135deg,$color-brand-primary 0%,$color-stem-green 100%);flex-shrink:0}
      .student-text{display:flex;flex-direction:column}
      .student-name{margin:0;font-size:$font-size-sm;font-weight:500;color:$color-neutral-900}
      .student-grade{margin:2px 0 0 0;font-size:$font-size-xs;color:$color-neutral-500}
      .course-tags{display:flex;flex-wrap:wrap;gap:4px}
      .course-chip{background:$color-brand-primary-bg;color:$color-brand-primary;font-size:$font-size-xs;padding:2px 8px;border-radius:12px}
      .hours-cell{display:flex;flex-direction:column;gap:4px}
      .hours-text{margin:0;font-size:$font-size-sm;font-weight:600;color:$color-neutral-900}
      .hours-bar-bg{width:96px;height:6px;background:$color-neutral-200;border-radius:$radius-full;overflow:hidden}
      .hours-bar-fill{height:100%;border-radius:$radius-full;&.bar-success{background:$color-stem-green}&.bar-warning{background:$color-warning}&.bar-empty{background:$color-neutral-400}}
      .projects-cell{display:flex;align-items:center;gap:$spacing-sm}
      .project-count{font-size:$font-size-sm;color:$color-neutral-700}
      .last-class-text{font-size:$font-size-sm;color:$color-neutral-600}
      .status-badge{display:inline-block;padding:4px 8px;border-radius:$radius-sm;font-size:$font-size-xs;font-weight:500;border:1px solid;&.status-active{background:$color-stem-green-bg;color:$color-stem-green;border-color:$color-stem-green}&.status-warning{background:$color-warning-light;color:#d97706;border-color:#fde68a}&.status-default{background:$color-neutral-50;color:$color-neutral-600;border-color:$color-neutral-200}}
      .action-buttons{display:flex;gap:$spacing-sm}
      .action-link{background:none;border:none;cursor:pointer;font-size:$font-size-sm;font-weight:500;padding:0;&.primary{color:$color-brand-primary;&:hover{color:$color-brand-primary-dark}}&:not(.primary){color:$color-neutral-600;&:hover{color:$color-neutral-900}}}
      /* 按钮对齐原型 */
      .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:$btn-padding;background:$btn-primary-bg;color:$btn-primary-color;border:none;border-radius:$btn-primary-radius;font-size:$btn-font-size;font-weight:$btn-font-weight;cursor:pointer;transition:all $transition-fast;line-height:1;mat-icon{font-size:18px;width:18px;height:18px}&:hover{background:$btn-primary-bg-hover;transform:$btn-primary-transform-hover;box-shadow:$btn-primary-shadow-hover}}
      .btn-secondary{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:$btn-secondary-bg;color:$btn-secondary-color;border:$btn-secondary-border;border-radius:$btn-primary-radius;font-size:$btn-font-size;font-weight:$btn-font-weight;cursor:pointer;transition:all $transition-fast;line-height:1;mat-icon{font-size:16px;width:16px;height:16px}&:hover{background:$btn-secondary-bg-hover;box-shadow:$shadow-sm}}
      .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:$spacing-xxl $spacing-lg;text-align:center;background:$color-neutral-100;border-radius:$radius-md;mat-icon{font-size:80px;width:80px;height:80px;color:$color-neutral-500;margin-bottom:$spacing-md}h3{margin:0 0 $spacing-sm;color:$color-neutral-600}p{margin:0;color:$color-neutral-500}}
      .pagination-section{padding:$spacing-md $spacing-lg;border-top:1px solid $color-neutral-100;display:flex;justify-content:space-between;align-items:center;background:$color-neutral-50}
      .pagination-info{margin:0;font-size:$font-size-sm;color:$color-neutral-500}
      mat-paginator{background:transparent}
      @media (max-width:1200px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
      @media (max-width:768px){.toolbar{flex-direction:column;align-items:flex-start;gap:$spacing-md}.table-header{flex-direction:column;gap:$spacing-md;align-items:stretch}.table-actions{flex-direction:column}.search-field-wrapper{max-width:100%}}
      @media (max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr);gap:$spacing-sm}}
    `
  ],
})
export class StudentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  // 数据
  students: Student[] = [];
  grades: Grade[] = [];
  loading = false;
  statsLoading = false;

  // 统计数据
  stats: StudentStats = {
    totalStudents: 0,
    activeStudents: 0,
    graduatedStudents: 0,
    averageProgress: 0,
    averageAttendanceRate: 0,
    totalEnrolledCourses: 0,
    totalPayment: 0,
  };

  // 筛选条件
  filter: StudentFilter = {
    page: 1,
    pageSize: 10,
  };

  // 表格列定义
  displayedColumns: string[] = [
    'name',
    'courses',
    'hours',
    'projects',
    'lastClass',
    'status',
    'actions',
  ];

  // 选中的学员
  selectedStudents: Set<number> = new Set();
  isSelectionActive = false;

  // 分页
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  // 状态选项
  statusOptions: { value: StudentStatus; label: string }[] = [
    { value: 'active', label: '在读' },
    { value: 'inactive', label: '休学' },
    { value: 'graduated', label: '已毕业' },
    { value: 'suspended', label: '暂停' },
    { value: 'transferred', label: '已转学' },
  ];

  // 快捷筛选选项
  quickFilterOptions: { label: string; value: string; icon: string }[] = [
    { label: '全部', value: '', icon: 'people' },
    { label: '在读', value: 'active', icon: 'school' },
    { label: '休学', value: 'inactive', icon: 'pause_circle' },
    { label: '已毕业', value: 'graduated', icon: 'emoji_events' },
  ];

  constructor(
    private studentService: StudentService,
    private orgContext: OrganizationContextService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[StudentList] 开始初始化...');
    this.loadStudents();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * 加载学员列表
   */
  loadStudents(): void {
    console.log('[StudentList] 开始加载学员列表...');
    this.loading = true;
    const subscription = this.studentService
      .getStudents(0, this.pageIndex + 1, this.pageSize, this.filter.keyword)
      .subscribe({
        next: (response) => {
          console.log('[StudentList] 加载成功，数据条数:', response.data?.length);
          this.students = response.data || [];
          this.total = response.pagination?.total || 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[StudentList] 加载学员列表失败:', error);
          this.loading = false;
          this.showSnackbar('加载学员列表失败', 'error');
        },
      });
    this.subscriptions.push(subscription);
  }

  /**
   * 加载统计数据
   */
  loadStats(): void {
    console.log('[StudentList] 开始加载统计数据...');
    this.statsLoading = true;
    const subscription = this.studentService
      .getStatsSummary()
      .subscribe({
        next: (response) => {
          console.log('[StudentList] 统计数据加载成功:', response.data);
          if (response.data) {
            this.stats = {
              totalStudents: response.data.total_students || 0,
              activeStudents: response.data.active_students || 0,
              graduatedStudents: response.data.graduated_students || 0,
              averageProgress: response.data.average_progress || 0,
              averageAttendanceRate: response.data.average_attendance_rate || 0,
              totalEnrolledCourses: response.data.total_enrollments || 0,
              totalPayment: response.data.total_revenue || 0,
            };
          }
          this.statsLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[StudentList] 统计数据加载失败:', error);
          this.statsLoading = false;
        },
      });
    this.subscriptions.push(subscription);
  }

  /**
   * 加载年级列表 (目前使用模拟数据，待后端实现)
   */
  loadGrades(): void {
    console.log('[StudentList] 开始加载年级列表...');
    // TODO: 调用真实 API
    this.grades = [
      { id: 1, name: '一年级', studentCount: 30 },
      { id: 2, name: '二年级', studentCount: 25 },
    ];
    this.cdr.detectChanges();
  }

  /**
   * 快捷筛选
   */
  onQuickFilter(status: string): void {
    this.filter.status = status as StudentStatus || undefined;
    this.filter.page = 1;
    this.pageIndex = 0;
    this.loadStudents();
  }

  /**
   * 搜索
   */
  onSearch(): void {
    this.filter.page = 1;
    this.pageIndex = 0;
    this.loadStudents();
  }

  /**
   * 重置筛选
   */
  resetFilter(): void {
    this.filter = {
      page: 1,
      pageSize: 10,
    };
    this.pageIndex = 0;
    this.loadStudents();
  }

  /**
   * 分页变化
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filter.page = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.loadStudents();
  }

  /**
   * 复选框选择
   */
  onCheckboxChange(studentId: number, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedStudents.add(studentId);
    } else {
      this.selectedStudents.delete(studentId);
    }
    this.isSelectionActive = this.selectedStudents.size > 0;
  }

  /**
   * 全选
   */
  onSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.students.forEach((t) => this.selectedStudents.add(t.id));
    } else {
      this.selectedStudents.clear();
    }
    this.isSelectionActive = this.selectedStudents.size > 0;
  }

  /**
   * 取消选择
   */
  clearSelection(): void {
    this.selectedStudents.clear();
    this.isSelectionActive = false;
  }

  /**
   * 添加学员
   */
  onAddStudent(): void {
    const dialogRef = this.dialog.open(StudentEditDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.loadStudents();
          this.loadStats();
          this.showSnackbar('添加学员成功', 'success');
        }
      },
    });
  }

  /**
   * 编辑学员
   */
  onEditStudent(student: Student): void {
    const dialogRef = this.dialog.open(StudentEditDialogComponent, {
      width: '600px',
      data: { mode: 'edit', student },
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.loadStudents();
          this.loadStats();
          this.showSnackbar('更新学员信息成功', 'success');
        }
      },
    });
  }

  /**
   * 查看详情
   */
  onViewDetail(student: Student): void {
    this.dialog.open(StudentDetailDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { studentId: student.id },
    });
  }

  /**
   * 删除学员
   */
  onDeleteStudent(student: Student): void {
    if (confirm(`确定要删除学员"${student.name}"吗？`)) {
      this.studentService
        .deleteStudent(student.id)
        .subscribe({
          next: () => {
            this.loadStudents();
            this.loadStats();
            this.showSnackbar('删除学员成功', 'success');
          },
          error: () => {
            this.showSnackbar('删除学员失败', 'error');
          },
        });
    }
  }

  /**
   * 批量更新状态 (目前仅前端模拟，待后端实现)
   */
  onBatchUpdateStatus(status: StudentStatus): void {
    if (this.selectedStudents.size === 0) {
      return;
    }

    const statusLabel = this.statusOptions.find((o) => o.value === status)?.label ?? '';
    if (confirm(`确定要将选中的 ${this.selectedStudents.size} 位学员设置为"${statusLabel}"吗？`)) {
      // TODO: 调用真实 API
      this.clearSelection();
      this.loadStudents();
      this.showSnackbar(`已将学员设为"${statusLabel}"（模拟）`, 'success');
    }
  }

  /**
   * 导出 Excel (目前仅前端模拟)
   */
  onExportExcel(): void {
    // TODO: 实现真实的 Excel 导出逻辑
    this.showSnackbar('导出功能开发中...', 'success');
  }

  /**
   * 刷新数据
   */
  refreshData(): void {
    this.loadStudents();
    this.loadStats();
  }

  /**
   * 显示提示消息
   */
  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, '关闭', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['snackbar-success'] : ['snackbar-error'],
    });
  }

  /**
   * 获取状态徽章样式类
   */
  getStatusBadgeClass(status: StudentStatus): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-warning';
      case 'graduated':
        return 'status-default';
      default:
        return 'status-default';
    }
  }

  /**
   * 获取课时进度条样式类
   */
  getHoursBarClass(hours: number | undefined): string {
    if (!hours || hours === 0) return 'bar-empty';
    if (hours <= 10) return 'bar-warning';
    return 'bar-success';
  }

  /**
   * 获取状态标签文本
   */
  getStatusChipLabel(status: StudentStatus): string {
    const option = this.statusOptions.find((o) => o.value === status);
    return option?.label ?? status;
  }

  /**
   * 获取进度条颜色
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  /**
   * 获取出勤率颜色
   */
  getAttendanceColor(rate: number | undefined): string {
    if (!rate) return 'warn';
    if (rate >= 90) return 'primary';
    if (rate >= 75) return 'accent';
    return 'warn';
  }

  /**
   * 格式化金额
   */
  formatCurrency(amount: number | undefined): string {
    if (!amount) return '¥0';
    return `¥${amount.toLocaleString()}`;
  }

  /**
   * 获取当前快捷筛选值
   */
  get currentQuickFilter(): string {
    return this.filter.status || '';
  }

  /**
   * 获取头像背景颜色（基于姓名生成）
   */
  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
