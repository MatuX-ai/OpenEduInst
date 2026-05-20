/**
 * Institution Dashboard Component
 *
 * 机构仪表板 - 简化版
 * TODO: 后续实现完整的统计图表和数据展示
 *
 * @author iMatu Development Team
 * @version 1.0.0
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import {
  ActivityRecord,
  AlertNotification,
  ChartData,
  InstitutionDashboardService,
  InstitutionStatistics,
} from './institution-dashboard.service';

@Component({
  selector: 'app-institution-dashboard',
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>
          <mat-icon>dashboard</mat-icon>
          机构仪表板
        </h1>
        <p class="subtitle">查看机构概况和统计数据</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon users">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总用户数</div>
              <div class="stat-value">
                {{ loading ? '-' : statistics?.total_users || 0 }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon projects">
              <mat-icon>folder</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">项目总数</div>
              <div class="stat-value">
                {{ loading ? '-' : statistics?.total_projects || 0 }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon licenses">
              <mat-icon>license</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">活跃许可证</div>
              <div class="stat-value">
                {{ loading ? '-' : statistics?.active_licenses || 0 }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon hardware">
              <mat-icon>memory</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">硬件消耗</div>
              <div class="stat-value">
                {{ loading ? '-' : statistics?.hardware_consumption || 0 }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载仪表板数据...</p>
      </div>

      <!-- 主要内容区域 -->
      <div *ngIf="!loading && statistics" class="dashboard-content">
        <!-- 图表区域 -->
        <div class="charts-grid">
          <!-- 用户增长趋势图 -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                用户增长趋势
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-placeholder">
                <mat-icon>insights</mat-icon>
                <p>图表功能开发中...</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- 项目发展趋势图 -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>show_chart</mat-icon>
                项目发展趋势
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-placeholder">
                <mat-icon>bar_chart</mat-icon>
                <p>图表功能开发中...</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- 硬件使用统计 -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                硬件使用统计
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-placeholder">
                <mat-icon>pie_chart</mat-icon>
                <p>图表功能开发中...</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- 许可证使用情况 -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>donut_large</mat-icon>
                许可证使用情况
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-placeholder">
                <mat-icon>donut_chart</mat-icon>
                <p>图表功能开发中...</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 最近活动和警报 -->
        <div class="activities-alerts-grid">
          <!-- 最近活动 -->
          <mat-card class="activities-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>history</mat-icon>
                最近活动
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="activities && activities.length > 0; else noActivities">
                <div *ngFor="let activity of activities" class="activity-item">
                  <mat-icon [class]="'severity-' + activity.severity">{{ activity.icon }}</mat-icon>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-time">
                      {{ activity.timestamp | date: 'yyyy-MM-dd HH:mm:ss' }}
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noActivities>
                <div class="empty-state">
                  <mat-icon>event_busy</mat-icon>
                  <p>暂无活动记录</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>

          <!-- 系统警报 -->
          <mat-card class="alerts-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>warning</mat-icon>
                系统警报
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="alerts && alerts.length > 0; else noAlerts">
                <div
                  *ngFor="let alert of alerts"
                  class="alert-item"
                  [class]="'alert-' + alert.severity"
                >
                  <mat-icon>{{ alert.icon }}</mat-icon>
                  <div class="alert-content">
                    <div class="alert-title">{{ alert.message }}</div>
                    <div class="alert-time">
                      {{ alert.timestamp | date: 'yyyy-MM-dd HH:mm:ss' }}
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noAlerts>
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>系统运行正常</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 24px;
      }

      .header {
        margin-bottom: 32px;

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px 0;
          font-size: 28px;
          color: #333;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #1976d2;
          }
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }

      .stat-card {
        padding: 16px;

        mat-card-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: white;
          }

          &.users {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.projects {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.licenses {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.hardware {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
        }
      }

      .info-card {
        max-width: 600px;

        mat-card-header {
          margin-bottom: 16px;

          mat-icon {
            color: #ff9800;
          }

          mat-card-title {
            color: #ff9800;
          }
        }

        ul {
          margin: 16px 0;
          padding-left: 20px;

          li {
            margin-bottom: 8px;
            color: #666;
          }
        }

        button {
          margin-top: 16px;
        }
      }

      // 图表区域样式
      .dashboard-content {
        animation: fadeIn 0.5s ease-in;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        margin-bottom: 32px;

        @media (max-width: 1024px) {
          grid-template-columns: 1fr;
        }
      }

      .chart-card {
        height: 350px;

        mat-card-header {
          margin-bottom: 16px;

          mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            color: #333;

            mat-icon {
              color: #1976d2;
            }
          }
        }

        mat-card-content {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .chart-placeholder {
        text-align: center;
        color: #999;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        p {
          margin: 0;
          font-size: 16px;
        }
      }

      .activities-alerts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;

        @media (max-width: 1024px) {
          grid-template-columns: 1fr;
        }
      }

      .activities-card,
      .alerts-card {
        .activity-item,
        .alert-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
            flex-shrink: 0;

            &.severity-info {
              color: #2196f3;
            }

            &.severity-warning {
              color: #ff9800;
            }

            &.severity-error {
              color: #f44336;
            }
          }

          .activity-content,
          .alert-content {
            flex: 1;

            .activity-title,
            .alert-title {
              font-size: 14px;
              color: #333;
              margin-bottom: 4px;
            }

            .activity-time,
            .alert-time {
              font-size: 12px;
              color: #999;
            }
          }
        }

        .alert-item {
          &.alert-warning {
            background: rgba(255, 152, 0, 0.1);
            padding: 8px;
            border-radius: 4px;
            margin: 0 -8px;
          }

          &.alert-error {
            background: rgba(244, 67, 54, 0.1);
            padding: 8px;
            border-radius: 4px;
            margin: 0 -8px;
          }
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: #999;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            margin-bottom: 8px;
          }

          p {
            margin: 0;
            font-size: 14px;
          }
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class InstitutionDashboardComponent implements OnInit {
  institutionId: number | null = null;
  loading = false;
  statistics: InstitutionStatistics | null = null;
  charts: ChartData | null = null;
  activities: ActivityRecord[] = [];
  alerts: AlertNotification[] = [];

  constructor(
    private route: ActivatedRoute,
    private dashboardService: InstitutionDashboardService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.institutionId = Number(idParam);
      this.loadDashboardData();
    } else {
      this.showSnackbar('未找到机构 ID', 'error');
    }
  }

  /**
   * 加载仪表板数据
   */
  loadDashboardData(): void {
    if (!this.institutionId) return;

    this.loading = true;

    // 优先使用真实 API 调用，失败时降级到 Mock 数据
    this.dashboardService.getFullDashboard(this.institutionId).subscribe({
      next: (data) => {
        this.statistics = data.statistics;
        this.charts = data.charts;
        this.activities = data.recent_activities;
        this.alerts = data.alerts;
        this.loading = false;
      },
      error: (err) => {
        console.warn('[Dashboard] API 调用失败，降级到 Mock 数据:', err);
        this.showSnackbar('API 服务不可用，显示演示数据', 'info');

        // 降级到 Mock 数据
        setTimeout(() => {
          const mockData = this.dashboardService.getMockDashboardData();
          this.statistics = mockData.statistics;
          this.charts = mockData.charts;
          this.activities = mockData.recent_activities;
          this.alerts = mockData.alerts;
          this.loading = false;
        }, 500);
      },
    });
  }

  goBack(): void {
    window.history.back();
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, '关闭', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'error' ? ['error-snackbar'] : undefined,
    });
  }
}
