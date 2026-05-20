import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Activity, Alert } from '../../organization-dashboard.service';

@Component({
  selector: 'app-activity-alert-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="activities-alerts-grid">
      <!-- 最近活动 -->
      <mat-card class="activities-card">
        <mat-card-header>
          <mat-card-title>最近活动</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="activity-list">
            <div
              *ngFor="let activity of activities"
              class="activity-item"
              [class.warning]="activity.severity === 'warning'"
              [class.error]="activity.severity === 'error'"
            >
              <mat-icon [class]="'activity-icon ' + getActivityIcon(activity.type)">
                {{ getActivityIcon(activity.type) }}
              </mat-icon>
              <div class="activity-content">
                <div class="activity-title">{{ activity.description }}</div>
                <div class="activity-time">{{ activity.timestamp | date: 'medium' }}</div>
              </div>
            </div>
            <div *ngIf="activities.length === 0" class="empty-state">
              <mat-icon>history</mat-icon>
              <p>暂无活动记录</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 系统警报 -->
      <mat-card class="alerts-card">
        <mat-card-header>
          <mat-card-title>系统警报</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="alert-list">
            <div
              *ngFor="let alert of alerts"
              class="alert-item"
              [class.high]="alert.severity === 'high'"
              [class.medium]="alert.severity === 'medium'"
              [class.low]="alert.severity === 'low'"
            >
              <mat-icon [class]="'alert-icon ' + getAlertIcon(alert.type)">
                {{ getAlertIcon(alert.type) }}
              </mat-icon>
              <div class="alert-content">
                <div class="alert-title">{{ alert.message }}</div>
                <div class="alert-time">{{ alert.createdAt | date: 'medium' }}</div>
              </div>
            </div>
            <div *ngIf="alerts.length === 0" class="empty-state">
              <mat-icon>notifications_off</mat-icon>
              <p>暂无警报</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .activities-alerts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .activities-card,
      .alerts-card {
        height: 100%;
      }

      .activity-list,
      .alert-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .activity-item,
      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        transition: background-color 0.2s;
      }

      .activity-item:hover,
      .alert-item:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .activity-item.warning {
        background-color: #fff3e0;
      }

      .activity-item.error {
        background-color: #ffebee;
      }

      .alert-item.high {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
      }

      .alert-item.medium {
        background-color: #fff3e0;
        border-left: 4px solid #ff9800;
      }

      .alert-item.low {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
      }

      .activity-icon,
      .alert-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .icon-create {
        color: #4caf50;
      }
      .icon-update {
        color: #2196f3;
      }
      .icon-delete {
        color: #f44336;
      }
      .icon-login {
        color: #9c27b0;
      }
      .icon-default {
        color: #757575;
      }

      .alert-icon-warning {
        color: #ff9800;
      }
      .alert-icon-error {
        color: #f44336;
      }
      .alert-icon-info {
        color: #2196f3;
      }

      .activity-content,
      .alert-content {
        flex: 1;
        min-width: 0;
      }

      .activity-title,
      .alert-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
        word-break: break-word;
      }

      .activity-time,
      .alert-time {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.5);
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: rgba(0, 0, 0, 0.5);
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class ActivityAlertPanelComponent {
  @Input() activities: Activity[] = [];
  @Input() alerts: Alert[] = [];

  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      create: 'add_circle',
      update: 'edit',
      delete: 'delete',
      login: 'login',
      course_created: 'school',
      student_enrolled: 'person_add',
      teacher_assigned: 'assignment_ind',
    };
    return iconMap[type] || 'info';
  }

  getAlertIcon(type: string): string {
    const iconMap: Record<string, string> = {
      warning: 'warning',
      error: 'error',
      info: 'info',
      license_expiring: 'vpn_key',
      storage_full: 'storage',
      payment_overdue: 'payments',
    };
    return iconMap[type] || 'notifications';
  }
}
