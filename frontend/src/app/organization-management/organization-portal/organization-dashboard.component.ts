import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import {
  Activity,
  Alert,
  CourseInfo,
  CourseStats,
  EnrollmentStats,
  OrgAdminService,
  OrgOverview,
  StudentInfo,
  TeacherInfo,
} from '../../core/services/org-admin.service';
import { OrganizationContextService, OrganizationType } from '../../core/services/organization-context.service';
import { UnifiedCourseService } from '../../core/services/unified-course.service';
import { UnifiedCourse } from '../../models/unified-course.models';

import { TrainingDashboardV2Component, QuickActionItem, ResourceItem } from './components/dashboard-overview/training-dashboard-v2.component';
import { DashboardMetrics } from './components/dashboard-overview/matux-core-metrics.component';
import { CommonFunctionItem } from './components/dashboard-overview/matux-common-functions.component';
import { DataAnalyticsDashboardComponent } from './components/data-analytics/data-analytics-dashboard.component';
import {
  DashboardData,
  Organization,
  OrganizationDashboardService,
} from './organization-dashboard.service';
import { getMockDashboardData } from './mock-dashboard-data';
import { OrganizationEditDialogComponent } from './organization-edit-dialog.component';

@Component({
  selector: 'app-organization-dashboard',
  template: `
    <div class="organization-dashboard">
      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载仪表盘数据...</p>
      </div>

      <!-- 主要内容区域 -->
      <div *ngIf="!loading && dashboardData" class="dashboard-content">
        <!-- 根据组织类型动态渲染驾驶舱 -->
        <mat-tab-group color="primary" dynamicHeight class="unified-dashboard-tabs">
          <!-- Tab 1: 经营概览 -->
          <mat-tab>
            <ng-template mat-tab-label>
              <div class="tab-label">
                <mat-icon>space_dashboard</mat-icon>
                <span>经营概览</span>
              </div>
            </ng-template>
            <div class="tab-content">
              <app-training-dashboard-v2 
                *ngIf="orgContext.isType('training_institution')"
                [metrics]="{ activeStudents: matuxMetrics.activeStudents, monthlyRevenue: matuxMetrics.monthlyRevenue.replace('¥', '').replace('万', ''), courseCompletionRate: matuxMetrics.courseCompletionRate.replace('%', ''), equipmentUsageRate: '78' }"
                [quickActions]="quickActions"
                [resources]="resourceItems">
              </app-training-dashboard-v2>
            </div>
          </mat-tab>

          <!-- Tab 2: 数据分析 -->
          <mat-tab>
            <ng-template mat-tab-label>
              <div class="tab-label">
                <mat-icon>insights</mat-icon>
                <span>数据分析</span>
              </div>
            </ng-template>
            <div class="tab-content">
              <app-data-analytics-dashboard></app-data-analytics-dashboard>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- 错误状态 -->
      <div *ngIf="!loading && !dashboardData && error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="refreshData()">重试</button>
      </div>


    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as tokens;

      .organization-dashboard {
        height: 100%;
        overflow-y: auto;
        padding: tokens.$spacing-lg; 
        max-width: 1600px;
        margin: 0 auto;
      }

      /* 统一仪表盘标签页样式 */
      ::ng-deep .unified-dashboard-tabs {
        background: transparent;
      }

      ::ng-deep .unified-dashboard-tabs .mat-mdc-tab-header {
        background: tokens.$card-bg;
        border-radius: 12px 12px 0 0;
        border: tokens.$card-border;
        border-bottom: none;
        padding: 0 8px;
        box-shadow: tokens.$shadow-sm;
      }

      ::ng-deep .unified-dashboard-tabs .mat-mdc-tab {
        min-width: 140px;
        padding: 0 20px;
        height: 56px;
      }

      .tab-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 14px;
      }

      .tab-label mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      ::ng-deep .unified-dashboard-tabs .mat-mdc-tab-body-wrapper {
        background: tokens.$card-bg;
        border: tokens.$card-border;
        border-radius: 0 0 12px 12px;
        border-top: none;
      }

      .tab-content {
        padding: 24px;
      }

      .dashboard-header {
        margin-bottom: tokens.$spacing-xl; 
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: tokens.$spacing-md; 
      }

      .header-content h1 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: tokens.$spacing-md; 
        color: tokens.$color-neutral-900; 
        font-size: tokens.$font-size-4xl; 
      }

      .header-actions {
        display: flex;
        gap: tokens.$spacing-md; 
      }

      .loading-container,
      .error-container,
      .education-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: tokens.$spacing-xxl tokens.$spacing-lg; 
        text-align: center;
      }

      .education-loading {
        padding: tokens.$spacing-xl tokens.$spacing-lg; 
        margin: tokens.$spacing-xl 0; 
        border-radius: tokens.$radius-lg; 
        background-color: tokens.$color-neutral-50; 
        border: 1px solid tokens.$color-neutral-200; 
      }

      .education-loading p {
        margin-top: tokens.$spacing-md; 
        color: tokens.$color-neutral-700; 
        font-size: tokens.$font-size-sm; 
      }

      .education-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: tokens.$spacing-xl tokens.$spacing-lg;
        margin: tokens.$spacing-xl 0;
        border-radius: tokens.$radius-lg;
        background-color: tokens.$color-warning-light;
        border: tokens.$card-border;
        color: tokens.$color-warning;
      }

      .education-error mat-icon {
        font-size: tokens.$font-size-2xl * 2; 
        width: tokens.$font-size-2xl * 2; 
        height: tokens.$font-size-2xl * 2; 
        margin-bottom: tokens.$spacing-lg; 
        color: tokens.$color-warning; 
      }

      .education-error button {
        margin-top: tokens.$spacing-lg; 
      }

      .error-container .error-icon {
        font-size: tokens.$font-size-2xl * 2; 
        width: tokens.$font-size-2xl * 2; 
        height: tokens.$font-size-2xl * 2; 
        color: tokens.$color-error; 
        margin-bottom: tokens.$spacing-lg; 
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: tokens.$spacing-lg;
        margin-bottom: tokens.$spacing-xl;
      }

      .unified-courses-section {
        margin-bottom: tokens.$spacing-xl;
      }

      .course-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: tokens.$spacing-md;
      }

      .stat-card {
        border-radius: tokens.$radius-lg;
        box-shadow: tokens.$shadow-md;
        transition:
          transform tokens.$transition-fast,
          box-shadow tokens.$transition-fast;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: tokens.$shadow-lg;
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: tokens.$spacing-md;
        margin-bottom: tokens.$spacing-md;
      }

      .stat-icon {
        font-size: tokens.$font-size-xl + 4;
        width: tokens.$font-size-xl + 4;
        height: tokens.$font-size-xl + 4;
        border-radius: tokens.$radius-full;
        padding: tokens.$spacing-md;
        color: white;
      }

      .stat-icon.active {
        background: tokens.$color-stem-green;
      }
      .stat-icon.projects {
        background: tokens.$color-brand-primary;
      }
      .stat-icon.users {
        background: tokens.$color-warning;
      }
      .stat-icon.hardware {
        background: tokens.$color-brand-primary;
      }

      .stat-icon.students {
        background: tokens.$color-stem-green;
      }
      .stat-icon.teachers {
        background: tokens.$color-warning;
      }
      .stat-icon.courses {
        background: tokens.$color-stem-green;
      }
      .stat-icon.members {
        background: tokens.$color-brand-primary;
      }
      .stat-icon.enrollment {
        background: tokens.$color-error;
      }
      .stat-icon.completion {
        background: tokens.$color-brand-primary;
      }
      .stat-icon.revenue {
        background: tokens.$color-warning;
      }
      .stat-icon.satisfaction {
        background: tokens.$color-brand-primary;
      }
      .stat-icon.finance {
        background: tokens.$color-stem-green;
      }
      .stat-icon.classroom {
        background: tokens.$color-warning;
      }
      .stat-icon.wechat-cs {
        background: tokens.$color-stem-green;
      }

      .finance-quick-access {
        cursor: pointer;
        transition: all tokens.$transition-normal;
      }

      .finance-quick-access:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(0, 150, 136, 0.2);
      }

      .classroom-quick-access {
        cursor: pointer;
        transition: all tokens.$transition-normal;
      }

      .classroom-quick-access:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(255, 87, 34, 0.2);
      }

      .wechat-cs-quick-access {
        cursor: pointer;
        transition: all tokens.$transition-normal;
      }

      .wechat-cs-quick-access:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(7, 193, 96, 0.2);
      }

      .stat-card h3 {
        margin: 0;
        font-size: tokens.$font-size-base;
        color: tokens.$color-neutral-600;
        font-weight: 500;
      }

      .stat-value {
        font-size: tokens.$font-size-4xl;
        font-weight: 700;
        color: tokens.$color-neutral-900;
        margin: tokens.$spacing-sm 0;
      }

      .stat-footer {
        font-size: tokens.$font-size-sm;
        color: tokens.$color-neutral-500;
        font-weight: 500;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: tokens.$spacing-lg;
        margin-bottom: tokens.$spacing-xl;
      }

      .chart-card {
        border-radius: tokens.$radius-lg;
        box-shadow: tokens.$shadow-md;
      }

      .chart-card mat-card-header {
        padding: tokens.$spacing-md tokens.$spacing-lg 0 tokens.$spacing-lg;
      }

      .chart-card mat-card-title {
        font-size: tokens.$font-size-xl;
        font-weight: 600;
        color: tokens.$color-neutral-900;
      }

      .chart-container {
        height: 300px;
        width: 100%;
      }

      .activities-alerts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: tokens.$spacing-lg;
      }

      .activities-card,
      .alerts-card {
        border-radius: tokens.$radius-lg;
        box-shadow: tokens.$shadow-md;
      }

      .activity-list,
      .alert-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .activity-item,
      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: tokens.$spacing-md;
        padding: tokens.$spacing-md;
        border-bottom: 1px solid tokens.$color-neutral-200;
      }

      .activity-item:last-child,
      .alert-item:last-child {
        border-bottom: none;
      }

      .activity-item.warning,
      .alert-item.medium {
        background-color: tokens.$color-warning-light; 
      }

      .activity-item.error,
      .alert-item.high {
        background-color: tokens.$color-error-light; 
      }

      .activity-icon,
      .alert-icon {
        font-size: tokens.$font-size-lg;
        width: tokens.$font-size-lg;
        height: tokens.$font-size-lg;
        margin-top: 2px;
      }

      .activity-content,
      .alert-content {
        flex: 1;
      }

      .activity-description,
      .alert-message {
        font-size: tokens.$font-size-base;
        color: tokens.$color-neutral-900;
        margin-bottom: tokens.$spacing-xs;
      }

      .activity-time,
      .alert-time {
        font-size: tokens.$font-size-xs;
        color: tokens.$color-neutral-500;
      }

      /* 教育场景模块样式 */
      .education-section {
        margin-top: tokens.$spacing-xl;
      }

      .section-title {
        font-size: tokens.$font-size-2xl;
        font-weight: 600;
        margin: 0 0 tokens.$spacing-lg 0;
        color: tokens.$color-neutral-900;
      }

      .stat-icon.students {
        background: tokens.$color-stem-green;
      }
      .stat-icon.teachers {
        background: tokens.$color-brand-primary;
      }
      .stat-icon.courses {
        background: tokens.$color-warning;
      }
      .stat-icon.members {
        background: tokens.$color-brand-primary;
      }

      .tab-content {
        padding: tokens.$spacing-lg 0;
      }

      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: tokens.$spacing-lg;
      }

      .tab-header h3 {
        margin: 0;
        font-size: tokens.$font-size-xl;
        font-weight: 600;
        color: tokens.$color-neutral-900;
      }

      .edu-table {
        width: 100%;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: tokens.$spacing-xl;
        color: tokens.$color-neutral-400;
      }

      .empty-state mat-icon {
        font-size: tokens.$font-size-2xl * 2;
        width: tokens.$font-size-2xl * 2;
        height: tokens.$font-size-2xl * 2;
        margin-bottom: tokens.$spacing-md;
      }

      @media (max-width: 1200px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .organization-dashboard {
          padding: tokens.$spacing-md;
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .activities-alerts-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    TrainingDashboardV2Component,
    DataAnalyticsDashboardComponent,
  ],
})
export class OrganizationDashboardComponent implements OnInit, OnDestroy {
  organization: Organization | null = null;
  dashboardData: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  // 教育模块数据
  orgOverview: OrgOverview | null = null;
  courses: CourseInfo[] = [];
  teachers: TeacherInfo[] = [];
  students: StudentInfo[] = [];

  // 新增教育模块数据（使用强类型）
  enrollmentStats: EnrollmentStats | null = null;
  courseStats: CourseStats | null = null;
  recentActivities: Activity[] = [];
  alerts: Alert[] = [];

  // 数据加载状态
  educationLoading = false;
  educationError = false;

  // 统一课程数据流（将在 ngOnInit 中初始化）
  popularCourses$!: Observable<UnifiedCourse[]>;

  // 表格列定义
  courseColumns = ['name', 'category', 'enrollmentCount', 'status', 'actions'];
  teacherColumns = [
    'name',
    'department',
    'courseCount',
    'activeHours',
    'performanceScore',
    'status',
  ];
  studentColumns = ['name', 'grade', 'enrolledCourses', 'progress', 'attendanceRate', 'status'];

  private subscriptions: Subscription[] = [];
  private orgId!: number;

  // MatuX 原型数据
  matuxMetrics: DashboardMetrics = { activeStudents: 0, monthlyRevenue: '¥0', courseCompletionRate: '0%' };
  commonFunctions: CommonFunctionItem[] = [
    { id: 'leads', title: '招生线索', icon: 'person_add', count: '15位待跟进', color: '#2196f3' },
    { id: 'schedule', title: '智能排课', icon: 'calendar_today', count: '本周42节课', color: '#4caf50' },
    { id: 'settlement', title: '课时结算', icon: 'payments', count: '待确认8单', color: '#FF6600' },
    { id: 'live', title: '直播授课', icon: 'videocam', count: '在线教室3间', color: '#0066FF' }
  ];
  quickActions: QuickActionItem[] = [
    { id: 'enroll', label: '快速报名', icon: 'how_to_reg', color: 'blue' },
    { id: 'leave', label: '请假处理', icon: 'event_busy', color: 'amber' },
    { id: 'homework', label: '作业批改', icon: 'assignment_turned_in', color: 'emerald' },
    { id: 'checkin', label: '签到打卡', icon: 'check_circle', color: 'purple' },
    { id: 'renew', label: '续费提醒', icon: 'repeat', color: 'rose' }
  ];
  resourceItems: ResourceItem[] = [
    { id: 'courseware', icon: 'edit_note', title: 'Arduino课件库', description: '32套教学方案' },
    { id: 'dataset', icon: 'sensors', title: '传感器数据集', description: '15组实验数据' },
    { id: 'competition', icon: 'campaign', title: '竞赛通知', description: '3场赛事报名中' },
    { id: 'iot-template', icon: 'wifi', title: 'IoT代码模板', description: 'ESP32/MQTT等' }
  ];

  /**
   * 常用功能选择处理
   */
  onFunctionSelect(item: CommonFunctionItem): void {
    console.log('Selected function:', item);
    // TODO: 根据 ID 导航到对应页面
    if (item.id === 'schedule') {
      void this.router.navigate(['/organization', this.orgId, 'schedules']);
    }
  }

  /**
   * 快捷操作点击处理
   */
  onQuickAction(action: QuickActionItem): void {
    console.log('Quick action clicked:', action);
    // TODO: 打开对应的快速操作对话框
  }

  /**
   * 资源中心选择处理
   */
  onResourceSelect(item: ResourceItem): void {
    console.log('Selected resource:', item);
    // TODO: 导航到资源管理页面
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: OrganizationDashboardService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private orgAdminService: OrgAdminService,
    private unifiedCourseService: UnifiedCourseService,
    public orgContext: OrganizationContextService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      this.subscriptions.push(
        parentRoute.paramMap.subscribe((params) => {
          const id = +(params.get('id') ?? '');
          // 严格校验 ID 有效性
          if (!id || isNaN(id)) {
            console.error('[Dashboard] 无效的机构ID:', params.get('id'));
            this.snackBar.open('无效的机构ID,请重新选择', '关闭', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
            return;
          }

          this.orgId = id;
          console.log('[Dashboard] 获取到机构ID:', this.orgId);
          this.dashboardService.setCurrentOrgId(this.orgId);
          this.loadData();
          this.loadPopularCourses();
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * 加载热门课程
   */
  loadPopularCourses(): void {
    this.popularCourses$ = this.unifiedCourseService.getPopularCourses(undefined, 6).pipe(
      catchError((error) => {
        console.warn('加载热门课程失败，尝试加载最新课程:', error);
        // 如果热门课程加载失败，尝试加载最新课程
        return this.unifiedCourseService.getNewestCourses(6).pipe(
          catchError((err) => {
            console.error('加载最新课程也失败，使用空数组:', err);
            // 如果都失败，返回空数组（UnifiedCourseService 内部已有 Mock 数据 fallback）
            return of([]);
          })
        );
      })
    );
  }

  /**
   * 查看课程详情
   */
  onViewCourseDetail(_courseId: number): void {
    // TODO: 实现路由导航到课程详情页面
  }

  /**
   * 跳转到财务管理页面
   */
  goToFinance(): void {
    if (!this.orgId) {
      console.error('机构ID不存在');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'finance']);
  }

  /**
   * 跳转到教室管理页面
   */
  goToClassrooms(): void {
    if (!this.orgId) {
      console.error('机构ID不存在');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'classrooms']);
  }

  /**
   * 跳转到微信客服页面
   */
  goToWechatCS(): void {
    if (!this.orgId) {
      console.error('机构ID不存在');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'wechat-cs']);
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Mock 模式下直接使用 Mock 数据，不调用 API
    if (environment.useMockData) {
      const mockData = getMockDashboardData(this.orgId);
      this.dashboardData = mockData;
      this.organization = mockData.organization;
      // Mock 模式下使用默认指标
      this.matuxMetrics = {
        activeStudents: 328,
        monthlyRevenue: '12.5',
        courseCompletionRate: '92',
      };
      this.setupCharts();
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // 设置超时处理，避免无限等待
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        this.error = '数据加载超时，请检查网络连接或后端服务状态';
        this.loading = false;
        this.snackBar
          .open('数据加载超时', '重试', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          })
          .onAction()
          .subscribe(() => {
            this.refreshData();
          });
      }
    }, 10000); // 10秒超时

    this.subscriptions.push(
      this.dashboardService.getDashboardData(this.orgId).subscribe({
        next: (data) => {
          clearTimeout(timeoutId);
          this.dashboardData = data;
          this.organization = data.organization;
          this.setupCharts();
          this.loading = false;
          // 手动触发变更检测，避免 ExpressionChangedAfterItHasBeenCheckedError
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearTimeout(timeoutId);
          this.error = this.getErrorMessage(err);
          this.loading = false;
          this.snackBar.open(this.error, '关闭', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          // 手动触发变更检测
          this.cdr.detectChanges();
        },
      })
    );

    this.subscriptions.push(
      this.orgAdminService.getOrgMetrics(this.orgId).subscribe({
        next: (metrics) => {
          this.matuxMetrics = metrics;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load metrics:', err)
      })
    );

    // 加载教育模块数据
    this.loadEducationData();
  }

  /**
   * 加载教育场景模块数据
   */
  /**
   * 加载教育场景模块数据（使用新的getOrgDashboard方法一次性获取所有数据）
   */
  loadEducationData(): void {
    this.educationLoading = true;
    this.educationError = false;

    this.subscriptions.push(
      this.orgAdminService.getOrgDashboard(this.orgId).subscribe({
        next: (dashboardData) => {
          // 解构Dashboard数据
          this.orgOverview = dashboardData.overview;
          this.courses = dashboardData.courses || [];
          this.teachers = dashboardData.teachers || [];
          this.students = dashboardData.students || [];
          this.enrollmentStats = dashboardData.enrollmentStats;
          this.courseStats = dashboardData.courseStats;
          this.recentActivities = dashboardData.recentActivities || [];
          this.alerts = dashboardData.alerts || [];

          this.educationLoading = false;
          this.showSnackbar('教育模块数据加载成功', 'success');
          // 手动触发变更检测
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('加载教育模块数据失败:', err);
          this.educationError = true;
          this.educationLoading = false;

          // 尝试回退到独立API调用
          this.fallbackToIndividualAPIs();
        },
      })
    );
  }

  /**
   * 回退到独立API调用（当getOrgDashboard失败时使用）
   */
  private fallbackToIndividualAPIs(): void {
    // 尝试使用独立 API 调用回退...

    const requests: [
      Observable<OrgOverview>,
      Observable<CourseInfo[]>,
      Observable<TeacherInfo[]>,
      Observable<StudentInfo[]>,
      Observable<EnrollmentStats>,
      Observable<CourseStats>,
    ] = [
      this.orgAdminService.getOrgOverview(this.orgId),
      this.orgAdminService.getOrgCourses(this.orgId),
      this.orgAdminService.getOrgTeachers(this.orgId),
      this.orgAdminService.getOrgStudents(this.orgId),
      this.orgAdminService.getEnrollmentStats(this.orgId),
      this.orgAdminService.getCourseStats(this.orgId),
    ];

    this.subscriptions.push(
      forkJoin<
        [OrgOverview, CourseInfo[], TeacherInfo[], StudentInfo[], EnrollmentStats, CourseStats]
      >(requests).subscribe({
        next: (results) => {
          const [overview, courses, teachers, students, enrollmentStats, courseStats] = results;
          this.orgOverview = overview;
          this.courses = courses || [];
          this.teachers = teachers || [];
          this.students = students || [];
          this.enrollmentStats = enrollmentStats;
          this.courseStats = courseStats;

          this.showSnackbar('教育模块数据已使用回退模式加载', 'info');
        },
        error: (err) => {
          console.error('回退模式加载失败:', err);
          this.showSnackbar('无法加载教育模块数据', 'error');
        },
      })
    );
  }

  refreshData(): void {
    this.loadData();
  }

  setupCharts(): void {
    // 图表功能暂未启用
  }

  openEditDialog(): void {
    if (!this.organization) return;

    const dialogRef = this.dialog.open(OrganizationEditDialogComponent, {
      width: '600px',
      data: { organization: this.organization },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateOrganization(result as Partial<Organization>);
      }
    });
  }

  updateOrganization(orgData: Partial<Organization>): void {
    if (!this.organization) return;

    this.subscriptions.push(
      this.dashboardService.updateOrganization(this.orgId, orgData).subscribe({
        next: (updatedOrg) => {
          this.organization = updatedOrg;
          this.showSnackbar('机构信息更新成功', 'success');
        },
        error: (err) => {
          const errorMessage = err instanceof Error ? err.message : '更新失败';
          this.showSnackbar(errorMessage, 'error');
        },
      })
    );
  }

  /**
   * 显示通知消息
   */
  private showSnackbar(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ): void {
    const panelClassMap = {
      success: ['success-snackbar'],
      error: ['error-snackbar'],
      info: [],
      warning: ['warning-snackbar'],
    };

    this.snackBar.open(message, '关闭', {
      duration: 3000,
      panelClass: panelClassMap[type],
    });
  }

  /**
   * 根据错误类型返回友好的错误消息
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // 网络错误
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return '网络连接失败，请检查网络设置或后端服务是否启动';
      }
      // HTTP 404 错误
      if (error.message.includes('404')) {
        return '请求的资源不存在，可能是API端点配置错误';
      }
      // HTTP 500 错误
      if (error.message.includes('500')) {
        return '服务器内部错误，请联系管理员检查数据库配置和服务状态';
      }
      // HTTP 503 错误
      if (error.message.includes('503')) {
        return '服务暂时不可用，请稍后重试';
      }
      return error.message;
    }
    return '加载数据失败，未知错误';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  /**
   * 快速添加课程
   */
  quickAddCourse(): void {
    const dialogRef = this.dialog.open(OrganizationEditDialogComponent, {
      width: '500px',
      data: {
        title: '快速添加课程',
        formConfig: {
          fields: [
            { name: 'name', label: '课程名称', type: 'text', required: true },
            { name: 'category', label: '课程类别', type: 'text', required: true },
            { name: 'capacity', label: '最大容量', type: 'number', required: true },
            { name: 'description', label: '课程描述', type: 'textarea' },
          ],
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addCourse(result as Partial<CourseInfo>);
      }
    });
  }

  /**
   * 添加新课程
   */
  private addCourse(courseData: Partial<CourseInfo>): void {
    // 调用API添加课程
    this.orgAdminService.createCourse(this.orgId, courseData).subscribe({
      next: (newCourse) => {
        this.showSnackbar('课程添加成功', 'success');
        this.courses = [...this.courses, newCourse];
      },
      error: (err) => {
        const errorMessage = err instanceof Error ? err.message : '添加失败';
        this.showSnackbar(errorMessage, 'error');
      },
    });
  }

  /**
   * 刷新教育模块数据
   */
  refreshEducationData(): void {
    this.educationLoading = true;
    this.educationError = false;
    this.loadEducationData();
  }

  /**
   * 导出报表
   */
  exportReport(): void {
    this.showSnackbar('报表导出功能正在开发中...', 'info');
    // TODO: 实现报表导出逻辑
  }

  // ==================== 课程管理事件处理 ====================

  onAddCourse(): void {
    if (!this.orgId || isNaN(this.orgId)) {
      console.error('[Dashboard] 机构ID无效,无法添加课程');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'courses'], {
      queryParams: { action: 'add' },
    });
  }

  onViewCourse(courseId: number): void {
    // TODO: 打开课程详情对话框或导航到详情页
    console.log('查看课程:', courseId);
  }

  onEditCourse(courseId: number): void {
    // TODO: 打开课程编辑对话框
    console.log('编辑课程:', courseId);
  }

  onDeleteCourse(_courseId: number): void {
    if (confirm('确定要删除这个课程吗？')) {
      // TODO: 调用服务删除课程
      this.showSnackbar('课程删除功能待实现', 'info');
    }
  }

  // ==================== 师生管理事件处理 ====================

  onAddTeacher(): void {
    if (!this.orgId || isNaN(this.orgId)) {
      console.error('[Dashboard] 机构ID无效,无法添加教师');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'teachers'], {
      queryParams: { action: 'add' },
    });
  }

  onViewTeacher(teacherId: number): void {
    // TODO: 打开教师详情对话框
    console.log('查看教师:', teacherId);
  }

  onEditTeacher(teacherId: number): void {
    // TODO: 打开教师编辑对话框
    console.log('编辑教师:', teacherId);
  }

  onAddStudent(): void {
    if (!this.orgId || isNaN(this.orgId)) {
      console.error('[Dashboard] 机构ID无效,无法添加学生');
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'students'], {
      queryParams: { action: 'add' },
    });
  }

  onViewStudent(studentId: number): void {
    // TODO: 打开学生详情对话框
    console.log('查看学生:', studentId);
  }

  onEditStudent(studentId: number): void {
    // TODO: 打开学生编辑对话框
    console.log('编辑学生:', studentId);
  }

  /**
   * 返回上一页
   */
}
