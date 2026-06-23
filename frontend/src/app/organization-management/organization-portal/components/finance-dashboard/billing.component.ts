import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

interface RevenueData {
  month: string;
  courseFee: number;
  deviceRent: number;
  tokenRecharge: number;
  total: number;
}

interface TeacherPayment {
  id: number;
  name: string;
  level: string;
  hours: number;
  rate: number;
  amount: number;
  status: string;
}

interface PendingBill {
  id: number;
  student: string;
  course: string;
  hours: number;
  amount: number;
  date: string;
  status: string;
}

interface FinanceStats {
  monthly_revenue: number;
  pending_bills: number;
  monthly_classes: number;
  teacher_salary: number;
  token_consumption: number;
  equipment_rental_income: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="billing-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">财务结算</h1>
          <p class="page-subtitle">课时费结算、教师工资、营收分析</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="export-btn">
            <mat-icon>download</mat-icon>
            导出报表
          </button>
          <button mat-raised-button color="primary" class="add-btn">
            <mat-icon>add</mat-icon>
            新建账单
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月营收</p>
              <p class="stat-value">¥{{ stats.monthly_revenue | number:'1.0-0' }}</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">trending_up</mat-icon>
                +8.3% 较上月
              </p>
            </div>
            <div class="stat-icon-wrapper emerald">
              <mat-icon>attach_money</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">待确认账单</p>
              <p class="stat-value">{{ stats.pending_bills || 0 }}</p>
              <p class="stat-desc">需尽快处理</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>description</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月消课</p>
              <p class="stat-value">{{ stats.monthly_classes || 0 }}</p>
              <p class="stat-desc">课时</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>schedule</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">教师工资</p>
              <p class="stat-value">¥{{ stats.teacher_salary | number:'1.0-0' }}</p>
              <p class="stat-desc">待发放3人</p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>people</mat-icon>
            </div>
          </div>
        </div>

        <!-- Token 消耗 -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Token 消耗</p>
              <p class="stat-value">{{ stats.token_consumption | number:'1.0-0' }}</p>
              <p class="stat-desc">点 / 本月</p>
            </div>
            <div class="stat-icon-wrapper cyan">
              <mat-icon>token</mat-icon>
            </div>
          </div>
        </div>

        <!-- 设备租赁收入 -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">设备租赁收入</p>
              <p class="stat-value">¥{{ stats.equipment_rental_income | number:'1.0-0' }}</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">trending_up</mat-icon>
                +12.5% 较上月
              </p>
            </div>
            <div class="stat-icon-wrapper orange">
              <mat-icon>desktop_windows</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Main Content -->
        <div class="main-content">
          <!-- Revenue Chart Placeholder -->
          <div class="chart-card">
            <div class="card-header">
              <div>
                <h3 class="card-title">营收趋势分析</h3>
                <p class="card-subtitle">课程费 + 设备租赁 + Token充值</p>
              </div>
              <select class="period-select">
                <option>近 6 个月</option>
                <option>近 12 个月</option>
              </select>
            </div>
            <div class="chart-placeholder">
              <div class="placeholder-text">
                <mat-icon class="placeholder-icon">insert_chart</mat-icon>
                <p>营收趋势图表（需要集成图表库）</p>
              </div>
            </div>
          </div>

          <!-- Pending Bills Table -->
          <div class="table-card">
            <div class="card-header">
              <div class="header-left">
                <h3 class="card-title">待确认账单</h3>
                <span class="count-badge">{{ pendingBills.length }} 笔</span>
              </div>
              <div class="search-box">
                <mat-icon class="search-icon">search</mat-icon>
                <input type="text" placeholder="搜索学员..." [(ngModel)]="searchKeyword">
              </div>
            </div>

            <table mat-table [dataSource]="pendingBills" class="bills-table">
              <!-- Student Column -->
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef>学员</th>
                <td mat-cell *matCellDef="let bill">{{ bill.student }}</td>
              </ng-container>

              <!-- Course Column -->
              <ng-container matColumnDef="course">
                <th mat-header-cell *matHeaderCellDef>课程</th>
                <td mat-cell *matCellDef="let bill">{{ bill.course }}</td>
              </ng-container>

              <!-- Hours Column -->
              <ng-container matColumnDef="hours">
                <th mat-header-cell *matHeaderCellDef>课时</th>
                <td mat-cell *matCellDef="let bill">{{ bill.hours }} 课时</td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>金额</th>
                <td mat-cell *matCellDef="let bill" class="amount-cell">¥{{ bill.amount }}</td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>日期</th>
                <td mat-cell *matCellDef="let bill">{{ bill.date }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let bill">
                  <span [class]="'status-badge ' + getStatusClass(bill.status)">
                    {{ bill.status }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let bill">
                  <button mat-button class="action-link confirm">确认</button>
                  <button mat-button class="action-link detail">详情</button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <!-- Teacher Payments -->
          <div class="sidebar-card">
            <div class="card-header">
              <h3 class="card-title">教师课时费</h3>
              <p class="card-subtitle">本月待结算</p>
            </div>
            <div class="teacher-list">
              <div *ngFor="let teacher of teacherPayments" class="teacher-item">
                <div class="teacher-header">
                  <div>
                    <p class="teacher-name">{{ teacher.name }}</p>
                    <p class="teacher-level">{{ teacher.level }}</p>
                  </div>
                  <span [class]="'status-badge ' + getStatusClass(teacher.status)">
                    {{ teacher.status }}
                  </span>
                </div>
                <div class="teacher-details">
                  <span>{{ teacher.hours }}课时 × ¥{{ teacher.rate }}/时</span>
                  <span class="teacher-amount">¥{{ teacher.amount }}</span>
                </div>
              </div>
              <button mat-raised-button color="primary" class="batch-pay-btn">
                批量发放
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="sidebar-card">
            <div class="card-header">
              <h3 class="card-title">快捷操作</h3>
            </div>
            <div class="quick-actions">
              <button mat-stroked-button class="action-btn">
                <mat-icon class="action-icon blue">description</mat-icon>
                生成月度报表
              </button>
              <button mat-stroked-button class="action-btn">
                <mat-icon class="action-icon emerald">attach_money</mat-icon>
                续费提醒发送
              </button>
              <button mat-stroked-button class="action-btn">
                <mat-icon class="action-icon purple">download</mat-icon>
                导出对账单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    .billing-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .export-btn {
      font-size: 13px;
    }

    .add-btn {
      background: $color-primary !important;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: $color-bg-card;
      border-radius: $radius-lg;
      padding: 20px;
      box-shadow: $shadow-sm;
      border: 1px solid $color-border;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: $color-text-primary;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
    }

    .stat-trend {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
    }

    .stat-trend.positive {
      color: $color-secondary;
    }

    .trend-icon {
      font-size: 16px;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16px;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-icon-wrapper.emerald { background: rgba($color-secondary, 0.1); color: $color-secondary; }
    .stat-icon-wrapper.amber { background: rgba($color-warning, 0.1); color: $color-warning; }
    .stat-icon-wrapper.blue { background: rgba($color-primary, 0.1); color: $color-primary; }
    .stat-icon-wrapper.purple { background: rgba($color-primary-dark, 0.1); color: $color-primary-dark; }
    .stat-icon-wrapper.cyan { background: rgba($color-primary-light, 0.1); color: $color-primary-light; }
    .stat-icon-wrapper.orange { background: rgba($color-warning, 0.1); color: $color-warning; }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    /* Cards */
    .chart-card, .table-card, .sidebar-card {
      background: $color-bg-card;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      border: 1px solid $color-border;
      overflow: hidden;
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
      margin: 0 0 2px 0;
    }

    .card-subtitle {
      font-size: 12px;
      color: $color-text-secondary;
      margin: 0;
    }

    .count-badge {
      font-size: 12px;
      padding: 4px 12px;
      background: rgba($color-warning, 0.1);
      color: $color-warning;
      border-radius: 12px;
    }

    .period-select {
      padding: 6px 12px;
      border: 1px solid $color-border;
      border-radius: 6px;
      font-size: 12px;
      background: $color-bg-primary;
      outline: none;
    }

    /* Chart Placeholder */
    .chart-placeholder {
      padding: 40px;
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-text {
      text-align: center;
      color: $color-text-muted;
    }

    .placeholder-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .placeholder-text p {
      font-size: 14px;
      margin: 0;
    }

    /* Search Box */
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: $color-text-muted;
    }

    .search-box input {
      padding: 8px 12px 8px 36px;
      border: 1px solid $color-border;
      border-radius: 8px;
      font-size: 13px;
      width: 180px;
      outline: none;
    }

    .search-box input:focus {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
    }

    /* Table */
    .bills-table {
      width: 100%;
    }

    .bills-table th {
      font-size: 11px;
      font-weight: 600;
      color: $color-text-primary;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: $color-bg-primary;
      padding: 12px 20px;
    }

    .bills-table td {
      padding: 16px 20px;
      font-size: 13px;
      color: $color-text-primary;
    }

    .amount-cell {
      font-weight: 600;
      color: $color-text-primary;
    }

    .status-badge {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid;
    }

    .status-badge.pending {
      background: rgba($color-warning, 0.1);
      color: $color-warning;
      border-color: rgba($color-warning, 0.3);
    }

    .status-badge.confirmed {
      background: rgba($color-secondary, 0.1);
      color: $color-secondary;
      border-color: rgba($color-secondary, 0.3);
    }

    .status-badge.paid {
      background: rgba($color-primary, 0.1);
      color: $color-primary;
      border-color: rgba($color-primary, 0.3);
    }

    .action-link {
      font-size: 12px;
      padding: 4px 8px;
    }

    .action-link.confirm {
      color: $color-primary;
    }

    .action-link.detail {
      color: $color-text-secondary;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .teacher-list {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .teacher-item {
      border: 1px solid $color-border;
      border-radius: $radius-md;
      padding: 12px;
      transition: all 0.2s;
    }

    .teacher-item:hover {
      background: $color-bg-primary;
    }

    .teacher-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .teacher-name {
      font-size: 13px;
      font-weight: 500;
      color: $color-text-primary;
      margin: 0 0 2px 0;
    }

    .teacher-level {
      font-size: 11px;
      color: $color-text-secondary;
      margin: 0;
    }

    .teacher-details {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: $color-text-secondary;
    }

    .teacher-amount {
      font-weight: 600;
      color: $color-text-primary;
    }

    .batch-pay-btn {
      width: 100%;
      margin-top: 8px;
      background: $color-primary !important;
    }

    /* Quick Actions */
    .quick-actions {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-btn {
      width: 100%;
      justify-content: flex-start;
      font-size: 13px;
      padding: 10px 16px;
    }

    .action-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }

    .action-icon.blue { color: $color-primary; }
    .action-icon.emerald { color: $color-secondary; }
    .action-icon.purple { color: $color-primary-dark; }
  `]
})
export class BillingComponent implements OnInit {
  searchKeyword: string = '';
  
  stats: FinanceStats = {
    monthly_revenue: 125000,
    pending_bills: 8,
    monthly_classes: 1248,
    teacher_salary: 28000,
    token_consumption: 12580,
    equipment_rental_income: 18500
  };

  displayedColumns: string[] = ['student', 'course', 'hours', 'amount', 'date', 'status', 'actions'];

  // Mock data
  pendingBills: PendingBill[] = [
    {
      id: 1,
      student: '王小明',
      course: 'Arduino基础',
      hours: 8,
      amount: 640,
      date: '2026-05-20',
      status: '待确认'
    },
    {
      id: 2,
      student: '李小红',
      course: '机器人进阶',
      hours: 6,
      amount: 720,
      date: '2026-05-21',
      status: '待确认'
    },
    {
      id: 3,
      student: '张小强',
      course: 'Scratch编程',
      hours: 4,
      amount: 320,
      date: '2026-05-19',
      status: '已确认'
    },
    {
      id: 4,
      student: '陈小华',
      course: 'Arduino传感器',
      hours: 6,
      amount: 480,
      date: '2026-05-22',
      status: '待确认'
    }
  ];

  teacherPayments: TeacherPayment[] = [
    {
      id: 1,
      name: '张老师',
      level: '高级教师',
      hours: 48,
      rate: 150,
      amount: 7200,
      status: '待确认'
    },
    {
      id: 2,
      name: '李老师',
      level: '中级教师',
      hours: 42,
      rate: 120,
      amount: 5040,
      status: '待确认'
    },
    {
      id: 3,
      name: '王老师',
      level: '高级教师',
      hours: 45,
      rate: 150,
      amount: 6750,
      status: '已发放'
    },
    {
      id: 4,
      name: '陈老师',
      level: '初级教师',
      hours: 38,
      rate: 100,
      amount: 3800,
      status: '待确认'
    },
    {
      id: 5,
      name: '赵老师',
      level: '中级教师',
      hours: 40,
      rate: 120,
      amount: 4800,
      status: '已发放'
    }
  ];

  ngOnInit() {}

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      '待确认': 'pending',
      '已确认': 'confirmed',
      '已发放': 'paid'
    };
    return classes[status] || '';
  }
}
