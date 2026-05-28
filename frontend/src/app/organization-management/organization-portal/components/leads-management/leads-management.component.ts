import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../../environments/environment';

interface Lead {
  id: number;
  parent_name: string;
  phone: string;
  student_grade: string;
  source: string;
  interest_course: string;
  status: string;
  create_time: string;
  follow_up_time: string;
}

interface LeadStats {
  monthly_leads: number;
  pending_leads: number;
  conversion_rate: number;
  total_leads: number;
  source_stats: Record<string, number>;
}

@Component({
  selector: 'app-leads-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  template: `
    <div class="leads-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">招生线索</h1>
          <p class="page-subtitle">管理潜在客户、跟进记录和转化分析</p>
        </div>
        <button mat-raised-button color="primary" class="add-btn">
          <mat-icon>add</mat-icon>
          添加线索
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月新增线索</p>
              <p class="stat-value">{{ stats.monthly_leads || 0 }}</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">trending_up</mat-icon>
                +23% 较上月
              </p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>person_add</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">待跟进</p>
              <p class="stat-value">{{ stats.pending_leads || 0 }}</p>
              <p class="stat-trend warning">需尽快联系</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>schedule</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">试听课预约</p>
              <p class="stat-value">28</p>
              <p class="stat-trend info">本周安排</p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>calendar_today</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">转化率</p>
              <p class="stat-value">{{ stats.conversion_rate || 0 }}%</p>
              <p class="stat-trend positive">行业平均35%</p>
            </div>
            <div class="stat-icon-wrapper green">
              <mat-icon>check_circle</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Lead List -->
        <div class="leads-table-card">
          <div class="card-header">
            <div class="header-left">
              <h2 class="card-title">线索列表</h2>
              <span class="badge">共 {{ leads.length }} 条</span>
            </div>
            <div class="header-right">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>搜索姓名/电话</mat-label>
                <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearch()">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button mat-stroked-button>
                <mat-icon>filter_list</mat-icon>
                筛选
              </button>
            </div>
          </div>

          <table mat-table [dataSource]="filteredLeads" class="leads-table">
            <!-- Parent Info Column -->
            <ng-container matColumnDef="parent">
              <th mat-header-cell *matHeaderCellDef>家长信息</th>
              <td mat-cell *matCellDef="let lead">
                <div class="parent-cell">
                  <div class="avatar">{{ lead.parent_name.charAt(0) }}</div>
                  <div class="parent-info">
                    <p class="parent-name">{{ lead.parent_name }}</p>
                    <p class="parent-phone">
                      <mat-icon class="phone-icon">phone</mat-icon>
                      {{ lead.phone }}
                    </p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Source Column -->
            <ng-container matColumnDef="source">
              <th mat-header-cell *matHeaderCellDef>来源渠道</th>
              <td mat-cell *matCellDef="let lead">{{ lead.source }}</td>
            </ng-container>

            <!-- Interest Column -->
            <ng-container matColumnDef="interest">
              <th mat-header-cell *matHeaderCellDef>意向课程</th>
              <td mat-cell *matCellDef="let lead">
                <p class="interest-course">{{ lead.interest_course }}</p>
                <p class="interest-grade">{{ lead.student_grade }}</p>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>跟进状态</th>
              <td mat-cell *matCellDef="let lead">
                <span class="status-badge" [class]="getStatusClass(lead.status)">
                  {{ lead.status }}
                </span>
              </td>
            </ng-container>

            <!-- Create Time Column -->
            <ng-container matColumnDef="create_time">
              <th mat-header-cell *matHeaderCellDef>创建时间</th>
              <td mat-cell *matCellDef="let lead">{{ lead.create_time | date:'yyyy-MM-dd' }}</td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let lead">
                <button mat-button color="primary" class="action-btn">跟进</button>
                <button mat-button class="action-btn">详情</button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div class="pagination">
            <p class="pagination-info">显示 1-{{ leads.length }} 条，共 {{ leads.length }} 条</p>
            <mat-paginator
              [length]="leads.length"
              [pageSize]="10"
              [pageSizeOptions]="[5, 10, 20]"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <!-- Source Statistics -->
          <mat-card class="sidebar-card">
            <div class="card-header-small">
              <h3 class="card-title-small">渠道转化分析</h3>
              <p class="card-subtitle">本月数据</p>
            </div>
            <div class="source-list">
              <div class="source-item" *ngFor="let source of sourceStats">
                <div class="source-info">
                  <p class="source-name">{{ source.source }}</p>
                  <p class="source-count">{{ source.count }} 条线索</p>
                </div>
                <div class="source-rate">
                  <p class="rate-value">{{ source.conversion }}</p>
                  <p class="rate-label">转化率</p>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Quick Actions -->
          <mat-card class="sidebar-card">
            <div class="card-header-small">
              <h3 class="card-title-small">快捷操作</h3>
            </div>
            <div class="quick-actions">
              <button mat-stroked-button class="action-item">
                <mat-icon>calendar_today</mat-icon>
                安排试听课
              </button>
              <button mat-stroked-button class="action-item">
                <mat-icon>phone</mat-icon>
                批量外呼
              </button>
              <button mat-stroked-button class="action-item">
                <mat-icon>person_add</mat-icon>
                导入线索
              </button>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/design-tokens' as *;
    .leads-container {
      padding: 24px;
      background: $color-bg-primary;
      min-height: calc(100vh - 64px);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: $color-text-secondary;
      margin: 0;
    }

    .add-btn {
      background: $color-primary !important;
      color: white !important;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: $shadow-sm;
      border: 1px solid $color-border;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .stat-label {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0 0 8px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .stat-trend {
      font-size: 12px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-trend.positive { color: $color-secondary; }
    .stat-trend.warning { color: $color-warning; }
    .stat-trend.info { color: $color-primary; }

    .trend-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
    }

    .stat-icon-wrapper.blue {
      background: rgba($color-primary, 0.1);
      color: $color-primary;
    }

    .stat-icon-wrapper.amber {
      background: rgba($color-warning, 0.1);
      color: $color-warning;
    }

    .stat-icon-wrapper.purple {
      background: rgba($color-primary-dark, 0.1);
      color: $color-primary-dark;
    }

    .stat-icon-wrapper.green {
      background: rgba($color-secondary, 0.1);
      color: $color-secondary;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 24px;
    }

    .leads-table-card {
      background: white;
      border-radius: 12px;
      box-shadow: $shadow-sm;
      border: 1px solid $color-border;
    }

    .card-header {
      padding: 20px;
      border-bottom: 1px solid $color-bg-primary;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: $color-text-primary;
      margin: 0;
    }

    .badge {
      font-size: 12px;
      padding: 4px 12px;
      background: $color-bg-primary;
      color: $color-text-secondary;
      border-radius: 12px;
    }

    .header-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-field {
      width: 240px;
    }

    .leads-table {
      width: 100%;
    }

    .parent-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, $color-primary, $color-primary-light);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .parent-name {
      font-size: 14px;
      font-weight: 500;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .parent-phone {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .phone-icon {
      font-size: 12px !important;
      width: 12px !important;
      height: 12px !important;
    }

    .interest-course {
      font-size: 14px;
      color: $color-text-primary;
      margin: 0 0 2px 0;
    }

    .interest-grade {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
    }

    .status-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 12px;
      border: 1px solid;
      font-weight: 500;
    }

    .status-badge.pending {
      background: rgba($color-warning, 0.1);
      color: $color-warning;
      border-color: rgba($color-warning, 0.3);
    }

    .status-badge.appointed {
      background: rgba($color-primary, 0.1);
      color: $color-primary;
      border-color: rgba($color-primary, 0.3);
    }

    .status-badge.enrolled {
      background: rgba($color-secondary, 0.1);
      color: $color-secondary;
      border-color: rgba($color-secondary, 0.3);
    }

    .status-badge.unreachable {
      background: $color-bg-primary;
      color: $color-text-secondary;
      border-color: $color-border;
    }

    .action-btn {
      padding: 0 8px !important;
      min-width: auto !important;
    }

    .pagination {
      padding: 16px 20px;
      border-top: 1px solid $color-bg-primary;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-info {
      font-size: 13px;
      color: $color-text-secondary;
      margin: 0;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar-card {
      border-radius: 12px;
      border: 1px solid $color-border;
    }

    .card-header-small {
      padding: 16px 20px;
      border-bottom: 1px solid $color-bg-primary;
    }

    .card-title-small {
      font-size: 15px;
      font-weight: 600;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .card-subtitle {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
    }

    .source-list {
      padding: 16px 20px;
    }

    .source-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: $color-bg-primary;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: background 0.2s;
    }

    .source-item:hover {
      background: $color-bg-primary;
    }

    .source-name {
      font-size: 14px;
      font-weight: 500;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .source-count {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
    }

    .rate-value {
      font-size: 14px;
      font-weight: 600;
      color: $color-secondary;
      margin: 0 0 2px 0;
      text-align: right;
    }

    .rate-label {
      font-size: 11px;
      color: $color-text-secondary;
      margin: 0;
      text-align: right;
    }

    .quick-actions {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-item {
      justify-content: flex-start;
      padding: 10px 16px !important;
      text-align: left;
    }

    .action-item mat-icon {
      margin-right: 8px;
    }
  `]
})
export class LeadsManagementComponent implements OnInit {
  orgId!: number;
  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  searchTerm = '';
  stats: LeadStats = {
    monthly_leads: 0,
    pending_leads: 0,
    conversion_rate: 0,
    total_leads: 0,
    source_stats: {}
  };

  displayedColumns: string[] = ['parent', 'source', 'interest', 'status', 'create_time', 'actions'];

  sourceStats: Array<{source: string, count: number, conversion: string}> = [
    { source: '地推活动', count: 45, conversion: '32%' },
    { source: '老带新', count: 38, conversion: '68%' },
    { source: '线上咨询', count: 52, conversion: '28%' },
    { source: '转介绍', count: 23, conversion: '55%' }
  ];

  mockLeads: Lead[] = [
    {
      id: 1,
      parent_name: '刘家长',
      phone: '138****5678',
      student_grade: '四年级',
      source: '地推活动',
      interest_course: 'Arduino基础班',
      status: '待跟进',
      create_time: '2026-05-22T10:00:00',
      follow_up_time: '2026-05-23T10:00:00'
    },
    {
      id: 2,
      parent_name: '陈家长',
      phone: '139****1234',
      student_grade: '五年级',
      source: '老带新',
      interest_course: '机器人进阶班',
      status: '已预约试听',
      create_time: '2026-05-21T14:30:00',
      follow_up_time: '2026-05-24T09:00:00'
    },
    {
      id: 3,
      parent_name: '王家长',
      phone: '137****9876',
      student_grade: '六年级',
      source: '线上咨询',
      interest_course: 'Python编程',
      status: '已报名',
      create_time: '2026-05-20T16:00:00',
      follow_up_time: '-'
    },
    {
      id: 4,
      parent_name: '赵家长',
      phone: '136****4567',
      student_grade: '七年级',
      source: '转介绍',
      interest_course: 'AI视觉课程',
      status: '待跟进',
      create_time: '2026-05-22T11:30:00',
      follow_up_time: '2026-05-23T14:00:00'
    },
    {
      id: 5,
      parent_name: '李家长',
      phone: '135****2345',
      student_grade: '三年级',
      source: '地推活动',
      interest_course: 'Scratch启蒙',
      status: '未接通',
      create_time: '2026-05-19T09:00:00',
      follow_up_time: '2026-05-20T10:00:00'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.orgId = +(params.get('id') ?? '1');
      this.loadLeads();
      this.loadStats();
    });
  }

  loadLeads(): void {
    // 使用Mock数据（实际应该调用API）
    this.leads = this.mockLeads;
    this.filteredLeads = this.leads;
    
    // 实际API调用：
    // this.http.get<any>(\`\${environment.apiUrl}/leads?org_id=\${this.orgId}\`).subscribe({
    //   next: (res) => {
    //     this.leads = res.leads;
    //     this.filteredLeads = res.leads;
    //   },
    //   error: (err) => console.error('Failed to load leads:', err)
    // });
  }

  loadStats(): void {
    // Mock数据
    this.stats = {
      monthly_leads: 158,
      pending_leads: 15,
      conversion_rate: 42,
      total_leads: 280,
      source_stats: {}
    };

    // 实际API调用：
    // this.http.get<any>(\`\${environment.apiUrl}/leads/stats?org_id=\${this.orgId}\`).subscribe({
    //   next: (res) => {
    //     this.stats = res;
    //   },
    //   error: (err) => console.error('Failed to load stats:', err)
    // });
  }

  onSearch(): void {
    if (!this.searchTerm) {
      this.filteredLeads = this.leads;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredLeads = this.leads.filter(lead =>
      lead.parent_name.toLowerCase().includes(term) ||
      lead.phone.includes(term)
    );
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      '待跟进': 'pending',
      '已预约试听': 'appointed',
      '已报名': 'enrolled',
      '未接通': 'unreachable'
    };
    return classMap[status] || 'pending';
  }
}
