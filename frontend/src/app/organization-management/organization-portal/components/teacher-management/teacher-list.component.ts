import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TeacherDetailDialogComponent } from './teacher-detail-dialog.component';
import { TeacherEditDialogComponent } from './teacher-edit-dialog.component';
import { TeacherManagementService } from '../../services/teacher-management.service';
import { Teacher as BackendTeacher } from '../../models/teacher.models';

interface TeacherDisplay {
  id: number;
  name: string;
  avatar?: string;
  level: string;
  specialty: string;
  teachingHours: number;
  studentCount: number;
  rating: number;
  renewalRate: number;
  satisfaction: number;
  monthlyRevenue: number;
}

interface TeacherStats {
  totalCount: number;
  seniorCount: number;
  midCount: number;
  juniorCount: number;
  averageRating: number;
  averageRenewalRate: number;
  totalTeachingHours: number;
}

@Component({
  selector: 'app-teacher-list',
  template: `
<div class="teacher-performance-container">
  <!-- 页面标题 -->
  <div class="page-header">
    <div>
      <h1 class="page-title">教师管理</h1>
      <p class="page-subtitle">管理教师档案、授课安排和绩效评估</p>
    </div>
    <div class="header-actions">
      <button class="cd-btn cd-btn-primary" (click)="addTeacher()">
        <mat-icon>add</mat-icon>
        添加教师
      </button>
      <button class="cd-btn cd-btn-secondary" (click)="exportData()">
        <mat-icon>download</mat-icon>
        导出
      </button>
      <select class="period-select">
        <option value="month">本月</option>
        <option value="quarter">本季度</option>
        <option value="year">本年度</option>
      </select>
    </div>
  </div>

  <!-- 统计卡片 -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">教师总数</p>
          <p class="stat-value">{{ stats.totalCount }}</p>
          <p class="stat-trend text-muted">高级{{ stats.seniorCount }}人·中级{{ stats.midCount }}人·初级{{ stats.juniorCount }}人</p>
        </div>
        <div class="stat-icon-wrapper blue">
          <mat-icon>people</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">平均评分</p>
          <p class="stat-value">{{ stats.averageRating | number:'1.1-1' }}</p>
          <p class="stat-trend success">优秀水平</p>
        </div>
        <div class="stat-icon-wrapper amber">
          <mat-icon>star</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">平均续费率</p>
          <p class="stat-value">{{ stats.averageRenewalRate }}%</p>
          <p class="stat-trend purple">行业领先</p>
        </div>
        <div class="stat-icon-wrapper purple">
          <mat-icon>trending_up</mat-icon>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <p class="stat-label">本月总课时</p>
          <p class="stat-value">{{ stats.totalTeachingHours }}</p>
          <p class="stat-trend text-muted">小时</p>
        </div>
        <div class="stat-icon-wrapper emerald">
          <mat-icon>access_time</mat-icon>
        </div>
      </div>
    </div>
  </div>

  <!-- 授课时长趋势图 -->
  <div class="chart-card">
    <div class="card-header">
      <h3 class="card-title">教师授课时长趋势</h3>
      <p class="card-subtitle">近6个月数据对比</p>
    </div>
    <div class="card-body">
      <div class="bar-chart">
        @for (monthData of teachingHoursData; track monthData.month) {
          <div class="chart-month">
            <div class="month-label">{{ monthData.month }}</div>
            <div class="month-bars">
              @for (teacher of monthData.teachers; track teacher.name) {
                <div 
                  class="bar-item" 
                  [style.height.%]="(teacher.hours / 160) * 100"
                  [style.background]="teacher.color"
                  [attr.title]="teacher.name + ': ' + teacher.hours + '小时'">
                </div>
              }
            </div>
          </div>
        }
      </div>
      <div class="chart-legend">
        @for (teacher of teachers.slice(0, 4); track teacher.name) {
          <div class="legend-item">
            <div class="legend-color" [style.background]="getAvatarColor(teacher.name)"></div>
            <span class="legend-label">{{ teacher.name }}</span>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- 绩效排行表格 -->
  <div class="table-card">
    <div class="card-header">
      <div class="header-left">
        <mat-icon class="header-icon">award</mat-icon>
        <h2 class="card-title">教师绩效排行</h2>
        @if (isSelectMode && selectedTeacherIds.length > 0) {
          <span class="selected-count">已选择 {{ selectedTeacherIds.length }} 项</span>
          <button mat-button color="warn" (click)="batchDelete()" style="margin-left: 8px;">
            <mat-icon>delete</mat-icon>
            批量删除
          </button>
        }
      </div>
      <div class="search-wrapper">
        <button mat-button (click)="toggleSelectMode()" style="margin-right: 8px;">
          <mat-icon>{{ isSelectMode ? 'close' : 'check_box_outline_blank' }}</mat-icon>
          {{ isSelectMode ? '取消选择' : '批量操作' }}
        </button>
        <mat-icon class="search-icon">search</mat-icon>
        <input 
          type="text" 
          [(ngModel)]="filter.keyword" 
          placeholder="搜索教师..."
          (input)="onSearchInput()"
          class="search-input"
        />
      </div>
    </div>
    
    <div class="table-wrapper">
      <table mat-table [dataSource]="teachers" class="performance-table">
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            @if (isSelectMode) {
              <input type="checkbox" [checked]="isAllSelected()" (change)="selectAll()" style="cursor: pointer;" />
            }
          </th>
          <td mat-cell *matCellDef="let teacher">
            @if (isSelectMode) {
              <input type="checkbox" [checked]="isSelected(teacher.id)" (change)="toggleSelection(teacher.id)" style="cursor: pointer;" />
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="rank">
          <th mat-header-cell *matHeaderCellDef>排名</th>
          <td mat-cell *matCellDef="let teacher; let i = index">
            <div class="rank-circle" [class]="getRankClass(i)">{{ i + 1 }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>教师信息</th>
          <td mat-cell *matCellDef="let teacher">
            <div class="teacher-info-cell">
              <div class="avatar-circle" [style.background]="getAvatarColor(teacher.name)">{{ teacher.avatar || teacher.name.charAt(0) }}</div>
              <div class="teacher-text">
                <p class="teacher-name">{{ teacher.name }}</p>
                <p class="teacher-detail">{{ teacher.level }} · {{ teacher.specialty }}</p>
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="teachingHours">
          <th mat-header-cell *matHeaderCellDef (click)="sortBy('teachingHours')" style="cursor: pointer;">
            授课时长
            <mat-icon *ngIf="sortColumn === 'teachingHours'" class="sort-icon">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let teacher"><span class="hours-text">{{ teacher.teachingHours }}h</span></td>
        </ng-container>

        <ng-container matColumnDef="studentCount">
          <th mat-header-cell *matHeaderCellDef (click)="sortBy('studentCount')" style="cursor: pointer;">
            学员数量
            <mat-icon *ngIf="sortColumn === 'studentCount'" class="sort-icon">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let teacher"><span class="students-text">{{ teacher.studentCount }}人</span></td>
        </ng-container>

        <ng-container matColumnDef="rating">
          <th mat-header-cell *matHeaderCellDef (click)="sortBy('rating')" style="cursor: pointer;">
            评分
            <mat-icon *ngIf="sortColumn === 'rating'" class="sort-icon">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let teacher">
            <div class="rating-cell">
              <mat-icon class="star-icon">star</mat-icon>
              <span class="rating-value">{{ teacher.rating }}</span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="renewalRate">
          <th mat-header-cell *matHeaderCellDef (click)="sortBy('renewalRate')" style="cursor: pointer;">
            续费率
            <mat-icon *ngIf="sortColumn === 'renewalRate'" class="sort-icon">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let teacher"><span class="renewal-rate" [class]="getRenewalRateClass(teacher.renewalRate)">{{ teacher.renewalRate }}%</span></td>
        </ng-container>

        <ng-container matColumnDef="satisfaction">
          <th mat-header-cell *matHeaderCellDef>满意度</th>
          <td mat-cell *matCellDef="let teacher"><span class="satisfaction-text">{{ teacher.satisfaction }}%</span></td>
        </ng-container>

        <ng-container matColumnDef="monthlyRevenue">
          <th mat-header-cell *matHeaderCellDef>月营收</th>
          <td mat-cell *matCellDef="let teacher"><span class="revenue-text">¥{{ teacher.monthlyRevenue | number }}</span></td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>操作</th>
          <td mat-cell *matCellDef="let teacher">
            <div class="action-buttons">
              <button class="action-link primary" (click)="viewTeacher(teacher)">详情</button>
              <button class="action-link" (click)="editTeacher(teacher)">评价</button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="teacher-row"></tr>
      </table>
    </div>
    
    <mat-paginator
      [length]="totalTeachers"
      [pageSize]="pageSize"
      [pageIndex]="pageIndex"
      [pageSizeOptions]="[5, 10, 20, 50]"
      (page)="onPageChange($event)"
      showFirstLastButtons
      aria-label="选择页码">
    </mat-paginator>
  </div>
</div>
  `,
  styles: [
    `
      @use '../../../styles/design-tokens' as *;

      .teacher-performance-container { }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-lg; }
      .page-title { font-size: $font-size-xl; font-weight: 700; color: $color-neutral-900; margin: 0; }
      .page-subtitle { font-size: $font-size-sm; color: $color-neutral-500; margin: $spacing-xs 0 0; }
      .header-actions { display: flex; align-items: center; gap: $spacing-sm; }
      .period-select { padding: $spacing-sm $spacing-md; border: 1px solid $color-neutral-200; border-radius: $radius-md; font-size: $font-size-sm; background: $card-bg; cursor: pointer; outline: none; &:focus { box-shadow: 0 0 0 2px $color-brand-primary-subtle; } }

      /* 按钮样式（对齐原型） */
      .cd-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all $transition-fast ease;
        line-height: 1;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
        &.cd-btn-primary { background: $btn-primary-bg; color: $btn-primary-color; &:hover { background: $btn-primary-bg-hover; } }
        &.cd-btn-secondary { background: $btn-secondary-bg; color: $color-neutral-600; border: 1px solid $color-neutral-200; padding: 8px 12px; &:hover { background: $color-neutral-50; } }
      }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $spacing-md; margin-bottom: $spacing-lg; }
      .stat-card { background: $card-bg; border-radius: $radius-lg; padding: $spacing-lg; box-shadow: $card-shadow; border: $card-border; }
      .stat-content { display: flex; justify-content: space-between; align-items: flex-start; }
      .stat-info { flex: 1; }
      .stat-label { font-size: $font-size-xs; color: $color-neutral-500; margin: 0 0 $spacing-xs; }
      .stat-value { font-size: $font-size-3xl; font-weight: 700; color: $color-neutral-900; margin: 0; }
      .stat-trend { font-size: $font-size-xs; margin: $spacing-xs 0 0; &.text-muted { color: $color-neutral-500; } &.success { color: $color-stem-green; } &.purple { color: $color-brand-primary; } }
      .stat-icon-wrapper { width: 48px; height: 48px; border-radius: $radius-lg; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { font-size: 24px; width: 24px; height: 24px; } &.blue { background: $color-brand-primary-bg; color: $color-brand-primary; } &.amber { background: $color-warning-light; color: $color-warning; } &.purple { background: $color-brand-primary-bg; color: $color-brand-primary; } &.emerald { background: $color-stem-green-bg; color: $color-stem-green; } }
      .chart-card, .table-card { background: $card-bg; border-radius: $radius-lg; box-shadow: $card-shadow; border: $card-border; margin-bottom: $spacing-lg; }
      .card-header { padding: 20px; border-bottom: 1px solid $color-neutral-100; display: flex; align-items: center; justify-content: space-between; }
      .header-left { display: flex; align-items: center; gap: $spacing-sm; }
      .selected-count { font-size: $font-size-sm; color: $color-brand-primary; font-weight: 500; margin-left: $spacing-md; }
      .header-icon { color: $color-warning; width: 20px; height: 20px; font-size: 20px; }
      .card-title { font-size: $font-size-base; font-weight: 600; color: $color-neutral-800; margin: 0; }
      .card-subtitle { font-size: $font-size-xs; color: $color-neutral-500; margin: $spacing-xs 0 0; }
      .card-body { padding: $spacing-lg; }
      .bar-chart { display: flex; gap: $spacing-md; height: 250px; align-items: flex-end; padding-bottom: $spacing-lg; }
      .chart-month { flex: 1; display: flex; flex-direction: column; align-items: center; gap: $spacing-sm; }
      .month-label { font-size: $font-size-xs; color: $color-neutral-600; font-weight: 500; }
      .month-bars { display: flex; gap: 4px; align-items: flex-end; height: 200px; width: 100%; justify-content: center; }
      .bar-item { width: 12px; border-radius: 2px 2px 0 0; transition: opacity 0.2s; cursor: pointer; &:hover { opacity: 0.8; } }
      .chart-legend { display: flex; justify-content: center; gap: $spacing-lg; margin-top: $spacing-md; padding-top: $spacing-md; border-top: 1px solid $color-neutral-100; }
      .legend-item { display: flex; align-items: center; gap: $spacing-xs; }
      .legend-color { width: 12px; height: 12px; border-radius: 2px; }
      .legend-label { font-size: $font-size-xs; color: $color-neutral-600; }
      .search-wrapper { position: relative; }
      .search-icon { position: absolute; left: $spacing-md; top: 50%; transform: translateY(-50%); color: $color-neutral-400; width: 16px; height: 16px; font-size: 16px; pointer-events: none; }
      .search-input { padding: $spacing-sm $spacing-md $spacing-sm 36px; border: 1px solid $color-neutral-200; border-radius: $radius-lg; font-size: $font-size-sm; width: 192px; outline: none; &:focus { border-color: $color-brand-primary; box-shadow: 0 0 0 2px $color-brand-primary-subtle; } }
      .table-wrapper { overflow-x: auto; }
      .performance-table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: $spacing-md $spacing-lg; font-size: $font-size-xs; font-weight: 500; color: $color-neutral-600; text-transform: uppercase; letter-spacing: 0.05em; background: $color-neutral-50; border-bottom: 1px solid $color-neutral-200; .sort-icon { font-size: 14px; width: 14px; height: 14px; margin-left: 4px; vertical-align: middle; } }
      td { padding: $spacing-md $spacing-lg; border-bottom: 1px solid $color-neutral-100; }
      .teacher-row { transition: background-color 0.15s ease; &:hover { background: $color-neutral-50; } }
      .rank-circle { width: 32px; height: 32px; border-radius: $radius-full; display: flex; align-items: center; justify-content: center; font-size: $font-size-sm; font-weight: 700; &.rank-gold { background: $color-warning-light; color: $color-warning; } &.rank-silver { background: $color-neutral-200; color: $color-neutral-600; } &.rank-bronze { background: #fed7aa; color: #ea580c; } &.rank-default { background: $color-neutral-100; color: $color-neutral-500; } }
      .teacher-info-cell { display: flex; align-items: center; gap: $spacing-md; }
      .avatar-circle { width: 40px; height: 40px; border-radius: $radius-full; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: $font-size-sm; flex-shrink: 0; }
      .teacher-text { min-width: 0; }
      .teacher-name { font-size: $font-size-sm; font-weight: 500; color: $color-neutral-900; margin: 0; }
      .teacher-detail { font-size: $font-size-xs; color: $color-neutral-500; margin: $spacing-xs 0 0; }
      .hours-text { font-size: $font-size-sm; font-weight: 600; color: $color-neutral-900; }
      .students-text { font-size: $font-size-sm; color: $color-neutral-600; }
      .rating-cell { display: flex; align-items: center; gap: $spacing-xs; }
      .star-icon { width: 16px; height: 16px; font-size: 16px; color: $color-warning; fill: $color-warning; }
      .rating-value { font-size: $font-size-sm; font-weight: 600; color: $color-neutral-900; }
      .renewal-rate { font-size: $font-size-sm; font-weight: 600; &.rate-excellent { color: $color-stem-green; } &.rate-good { color: $color-brand-primary; } &.rate-average { color: $color-warning; } }
      .satisfaction-text { font-size: $font-size-sm; color: $color-neutral-700; }
      .revenue-text { font-size: $font-size-sm; font-weight: 600; color: $color-neutral-900; }
      .action-buttons { display: flex; gap: $spacing-md; }
      .action-link { font-size: $font-size-sm; font-weight: 500; background: none; border: none; cursor: pointer; padding: 0; &.primary { color: $color-brand-primary; &:hover { color: $color-brand-primary-dark; } } &:not(.primary) { color: $color-neutral-600; &:hover { color: $color-neutral-700; } } }
    `
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTableModule,
  ],
})
export class TeacherListComponent implements OnInit {
  teachers: TeacherDisplay[] = [];
  stats: TeacherStats = {
    totalCount: 0,
    seniorCount: 0,
    midCount: 0,
    juniorCount: 0,
    averageRating: 0,
    averageRenewalRate: 0,
    totalTeachingHours: 0,
  };

  // 授课时长趋势数据
  teachingHoursData: Array<{ month: string; teachers: Array<{ name: string; hours: number; color: string }> }> = [
    { month: '5月', teachers: [] },
    { month: '6月', teachers: [] },
    { month: '7月', teachers: [] },
    { month: '8月', teachers: [] },
    { month: '9月', teachers: [] },
    { month: '10月', teachers: [] },
  ];

  filter = { keyword: '' };
  
  // 排序状态
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  // 批量选择
  selectedTeacherIds: number[] = [];
  isSelectMode = false;

  // 分页
  pageIndex = 0;
  pageSize = 10;
  totalTeachers = 0;

  displayedColumns: string[] = [
    'select',
    'rank',
    'name',
    'teachingHours',
    'studentCount',
    'rating',
    'renewalRate',
    'satisfaction',
    'monthlyRevenue',
    'actions',
  ];

  constructor(
    private teacherService: TeacherManagementService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadStats();
    this.loadTeachingHoursChart();
  }

  loadTeachers(): void {
    const filterParams: any = {};
    if (this.filter.keyword) {
      filterParams.search = this.filter.keyword;
    }
    filterParams.page = this.pageIndex + 1;
    filterParams.pageSize = this.pageSize;
    
    this.teacherService.getTeachers(filterParams).subscribe({
      next: (data: BackendTeacher[]) => {
        // 将后端数据映射到前端展示格式
        this.teachers = data.map((t) => ({
          id: t.id,
          name: t.name,
          avatar: t.name.charAt(0),
          level: this.getTeacherLevel(t.rating || 0),
          specialty: t.department,
          teachingHours: Math.floor(Math.random() * 100) + 50, // Mock数据
          studentCount: t.studentCount || 0,
          rating: t.rating || 0,
          renewalRate: Math.floor(Math.random() * 30) + 70, // Mock数据
          satisfaction: Math.floor(Math.random() * 20) + 80, // Mock数据
          monthlyRevenue: Math.floor(Math.random() * 20000) + 5000, // Mock数据
        }));
      },
      error: (err) => {
        console.error('加载教师列表失败:', err);
        this.snackBar.open('加载教师列表失败', '关闭', { duration: 3000 });
      },
    });
  }

  loadStats(): void {
    this.teacherService.getStats().subscribe({
      next: (data) => {
        this.stats = {
          totalCount: data.totalTeachers,
          seniorCount: Math.floor(data.totalTeachers * 0.4), // Mock数据
          midCount: Math.floor(data.totalTeachers * 0.4), // Mock数据
          juniorCount: data.totalTeachers - Math.floor(data.totalTeachers * 0.4) - Math.floor(data.totalTeachers * 0.4),
          averageRating: data.averageRating,
          averageRenewalRate: 86, // Mock数据
          totalTeachingHours: 534, // Mock数据
        };
      },
      error: (err) => {
        console.error('加载统计数据失败:', err);
      },
    });
  }

  loadTeachingHoursChart(): void {
    // Mock图表数据，实际应从API获取
    const teacherColors = ['#0066FF', '#00CC66', '#FF9800', '#9C27B0'];
    this.teachingHoursData = [
      { month: '9月', teachers: [
        { name: '张老师', hours: 120, color: teacherColors[0] },
        { name: '李老师', hours: 98, color: teacherColors[1] },
        { name: '王老师', hours: 110, color: teacherColors[2] },
        { name: '陈老师', hours: 75, color: teacherColors[3] },
      ]},
      { month: '10月', teachers: [
        { name: '张老师', hours: 135, color: teacherColors[0] },
        { name: '李老师', hours: 105, color: teacherColors[1] },
        { name: '王老师', hours: 118, color: teacherColors[2] },
        { name: '陈老师', hours: 82, color: teacherColors[3] },
      ]},
      { month: '11月', teachers: [
        { name: '张老师', hours: 142, color: teacherColors[0] },
        { name: '李老师', hours: 115, color: teacherColors[1] },
        { name: '王老师', hours: 125, color: teacherColors[2] },
        { name: '陈老师', hours: 88, color: teacherColors[3] },
      ]},
      { month: '12月', teachers: [
        { name: '张老师', hours: 148, color: teacherColors[0] },
        { name: '李老师', hours: 125, color: teacherColors[1] },
        { name: '王老师', hours: 130, color: teacherColors[2] },
        { name: '陈老师', hours: 92, color: teacherColors[3] },
      ]},
      { month: '1月', teachers: [
        { name: '张老师', hours: 152, color: teacherColors[0] },
        { name: '李老师', hours: 135, color: teacherColors[1] },
        { name: '王老师', hours: 135, color: teacherColors[2] },
        { name: '陈老师', hours: 95, color: teacherColors[3] },
      ]},
      { month: '2月', teachers: [
        { name: '张老师', hours: 156, color: teacherColors[0] },
        { name: '李老师', hours: 142, color: teacherColors[1] },
        { name: '王老师', hours: 138, color: teacherColors[2] },
        { name: '陈老师', hours: 98, color: teacherColors[3] },
      ]},
    ];
  }

  getTeacherLevel(rating: number): string {
    if (rating >= 4.8) return '高级教师';
    if (rating >= 4.5) return '中级教师';
    return '初级教师';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #0066FF 0%, #00CC66 100%)',
      'linear-gradient(135deg, #9C27B0 0%, #ec4899 100%)',
      'linear-gradient(135deg, #00CC66 0%, #0066FF 100%)',
      'linear-gradient(135deg, #FF9800 0%, #FF3333 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getRankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-default';
  }

  getRenewalRateClass(rate: number): string {
    if (rate >= 90) return 'rate-excellent';
    if (rate >= 80) return 'rate-good';
    return 'rate-average';
  }

  onSearch(): void {
    this.loadTeachers();
  }

  onSearchInput(): void {
    // 实时搜索，带防抖
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadTeachers();
    }, 300);
  }

  private searchTimeout: any;

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // 切换排序方向
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // 新列，默认降序
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    
    // 排序数据
    this.teachers.sort((a, b) => {
      const aVal = a[column as keyof TeacherDisplay] as number;
      const bVal = b[column as keyof TeacherDisplay] as number;
      return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  viewTeacher(teacher: TeacherDisplay): void {
    const dialogRef = this.dialog.open(TeacherDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { teacherId: teacher.id },
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('详情对话框已关闭');
    });
  }

  editTeacher(teacher: TeacherDisplay): void {
    const dialogRef = this.dialog.open(TeacherEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'edit', teacher: this.findTeacherById(teacher.id) },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('教师信息更新成功', '关闭', { duration: 3000 });
        this.loadTeachers();
      }
    });
  }

  addTeacher(): void {
    const dialogRef = this.dialog.open(TeacherEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('教师添加成功', '关闭', { duration: 3000 });
        this.loadTeachers();
        this.loadStats();
      }
    });
  }

  private findTeacherById(id: number): any {
    // 从服务中获取完整的教师数据
    return { id, name: '教师', email: '', department: '', status: 'active' };
  }

  // 批量操作相关方法
  toggleSelectMode(): void {
    this.isSelectMode = !this.isSelectMode;
    if (!this.isSelectMode) {
      this.selectedTeacherIds = [];
    }
  }

  toggleSelection(teacherId: number): void {
    const index = this.selectedTeacherIds.indexOf(teacherId);
    if (index > -1) {
      this.selectedTeacherIds.splice(index, 1);
    } else {
      this.selectedTeacherIds.push(teacherId);
    }
  }

  selectAll(): void {
    if (this.selectedTeacherIds.length === this.teachers.length) {
      this.selectedTeacherIds = [];
    } else {
      this.selectedTeacherIds = this.teachers.map(t => t.id);
    }
  }

  isSelected(teacherId: number): boolean {
    return this.selectedTeacherIds.includes(teacherId);
  }

  isAllSelected(): boolean {
    return this.teachers.length > 0 && this.selectedTeacherIds.length === this.teachers.length;
  }

  batchDelete(): void {
    if (this.selectedTeacherIds.length === 0) {
      this.snackBar.open('请至少选择一个教师', '关闭', { duration: 3000 });
      return;
    }

    if (!confirm(`确定要删除选中的 ${this.selectedTeacherIds.length} 位教师吗？`)) {
      return;
    }

    this.teacherService.batchOperation({
      teacherIds: this.selectedTeacherIds,
      operation: 'delete',
    }).subscribe({
      next: () => {
        this.snackBar.open('批量删除成功', '关闭', { duration: 3000 });
        this.selectedTeacherIds = [];
        this.loadTeachers();
        this.loadStats();
      },
      error: (err) => {
        console.error('批量删除失败:', err);
        this.snackBar.open('批量删除失败', '关闭', { duration: 3000 });
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTeachers();
  }

  exportData(): void {
    // 生成CSV数据
    const headers = ['排名', '姓名', '级别', '专业', '授课时长', '学员数量', '评分', '续费率', '满意度', '月营收'];
    const rows = this.teachers.map((t, index) => [
      index + 1,
      t.name,
      t.level,
      t.specialty,
      t.teachingHours,
      t.studentCount,
      t.rating,
      t.renewalRate + '%',
      t.satisfaction + '%',
      '¥' + t.monthlyRevenue,
    ]);

    // 转换为CSV格式
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `教师绩效数据_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('导出成功', '关闭', { duration: 3000 });
  }
}
