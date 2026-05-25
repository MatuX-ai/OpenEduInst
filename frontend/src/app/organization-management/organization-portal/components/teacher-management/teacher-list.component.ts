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
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
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
    { month: '9月', teachers: [] },
    { month: '10月', teachers: [] },
    { month: '11月', teachers: [] },
    { month: '12月', teachers: [] },
    { month: '1月', teachers: [] },
    { month: '2月', teachers: [] },
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
    const teacherColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
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
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
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
