import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { DashboardData } from '../../organization-dashboard.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="stats-grid">
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-header">
            <mat-icon class="stat-icon active">vpn_key</mat-icon>
            <h3>活跃许可证</h3>
          </div>
          <div class="stat-value">{{ data?.statistics?.activeLicenses ?? 0 }}</div>
          <div class="stat-footer">剩余: {{ data?.statistics?.licenseRemaining ?? 0 }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-header">
            <mat-icon class="stat-icon projects">folder</mat-icon>
            <h3>项目总数</h3>
          </div>
          <div class="stat-value">{{ data?.statistics?.totalProjects ?? 0 }}</div>
          <div class="stat-footer">本月新增: {{ data?.statistics?.newProjectsThisMonth ?? 0 }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-header">
            <mat-icon class="stat-icon users">people</mat-icon>
            <h3>用户总数</h3>
          </div>
          <div class="stat-value">{{ data?.statistics?.totalUsers ?? 0 }}</div>
          <div class="stat-footer">活跃: {{ data?.statistics?.activeUsers ?? 0 }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-header">
            <mat-icon class="stat-icon storage">storage</mat-icon>
            <h3>存储使用</h3>
          </div>
          <div class="stat-value">{{ data?.statistics?.storageUsed ?? 0 }} GB</div>
          <div class="stat-footer">总计: {{ data?.statistics?.storageTotal ?? 0 }} GB</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .stat-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.6);
      }

      .stat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .stat-icon.active {
        color: #4caf50;
      }

      .stat-icon.projects {
        color: #2196f3;
      }

      .stat-icon.users {
        color: #ff9800;
      }

      .stat-icon.storage {
        color: #9c27b0;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
        margin-bottom: 8px;
      }

      .stat-footer {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
})
export class DashboardOverviewComponent {
  @Input() data: DashboardData | null = null;
}
