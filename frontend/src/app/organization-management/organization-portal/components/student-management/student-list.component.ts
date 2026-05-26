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
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
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
