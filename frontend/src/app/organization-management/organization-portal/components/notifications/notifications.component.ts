import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  is_read: boolean;
  create_time: string;
  action_label?: string;
  action_url?: string;
}

interface NotificationStats {
  unread_count: number;
  high_priority_count: number;
  pending_approvals: number;
  renewal_warnings: number;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">消息中心</h1>
          <p class="page-subtitle">审批提醒、续费预警、活动通知</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="markAllAsRead()">
            <mat-icon>check_circle</mat-icon>
            全部已读
          </button>
          <button mat-stroked-button>
            设置
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">未读消息</p>
              <p class="stat-value">{{ stats.unread_count || 0 }}</p>
              <p class="stat-desc blue">需及时处理</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>notifications</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">高优先级</p>
              <p class="stat-value">{{ stats.high_priority_count || 0 }}</p>
              <p class="stat-desc red">紧急处理</p>
            </div>
            <div class="stat-icon-wrapper red">
              <mat-icon>warning</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">待审批</p>
              <p class="stat-value">{{ stats.pending_approvals || 0 }}</p>
              <p class="stat-desc amber">项申请</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>description</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">续费预警</p>
              <p class="stat-value">{{ stats.renewal_warnings || 0 }}</p>
              <p class="stat-desc">名学员</p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>attach_money</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-bar">
        <button 
          [class.active]="activeFilter === 'all'" 
          (click)="setFilter('all')"
          class="filter-btn"
        >
          全部 ({{ notifications.length }})
        </button>
        <button 
          [class.active]="activeFilter === 'unread'" 
          (click)="setFilter('unread')"
          class="filter-btn"
        >
          未读 ({{ unreadCount }})
        </button>
        <button 
          [class.active]="activeFilter === 'approval'" 
          (click)="setFilter('approval')"
          class="filter-btn"
        >
          审批提醒
        </button>
        <button 
          [class.active]="activeFilter === 'renewal'" 
          (click)="setFilter('renewal')"
          class="filter-btn"
        >
          续费预警
        </button>
        <button 
          [class.active]="activeFilter === 'activity'" 
          (click)="setFilter('activity')"
          class="filter-btn"
        >
          活动通知
        </button>
      </div>

      <!-- Notification List -->
      <div class="notification-list">
        <div *ngFor="let notif of filteredNotifications" 
             [class.unread]="!notif.is_read"
             class="notification-item">
          <div class="notif-content">
            <div [class]="'notif-icon ' + getTypeColor(notif.type)">
              <mat-icon>{{ getTypeIcon(notif.type) }}</mat-icon>
            </div>
            
            <div class="notif-body">
              <div class="notif-header">
                <div class="header-left">
                  <h3 [class.unread]="!notif.is_read" class="notif-title">{{ notif.title }}</h3>
                  <span *ngIf="!notif.is_read" class="unread-dot"></span>
                  <span *ngIf="notif.priority === 'high'" class="priority-badge urgent">紧急</span>
                </div>
                <span class="notif-time">{{ formatTime(notif.create_time) }}</span>
              </div>
              
              <p class="notif-text">{{ notif.content }}</p>
              
              <div class="notif-footer">
                <span [class]="'type-badge ' + getTypeColor(notif.type)">
                  {{ getTypeLabel(notif.type) }}
                </span>
                <button *ngIf="notif.action_label" 
                        mat-button 
                        class="action-btn"
                        (click)="onAction(notif)">
                  {{ notif.action_label }} →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div class="load-more">
          <button mat-button class="load-more-btn">
            加载更多消息
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .notifications-container {
      padding: $spacing-lg;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-lg;
    }

    .page-title {
      font-size: $font-size-2xl;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: $font-size-sm;
      color: $color-neutral-500;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: $spacing-md;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: $spacing-md;
      margin-bottom: $spacing-lg;
    }

    .stat-card {
      background: $card-bg;
      border-radius: $radius-lg;
      padding: 20px;
      box-shadow: $card-shadow;
      border: $card-border;
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
      font-size: $font-size-xs;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: $font-size-xs;
      margin: 0;
    }

    .stat-desc.blue { color: $color-brand-primary; }
    .stat-desc.red { color: $color-error; }
    .stat-desc.amber { color: $color-warning; }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: $spacing-md;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-icon-wrapper.blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon-wrapper.red { background: $color-error-light; color: $color-error; }
    .stat-icon-wrapper.amber { background: $color-warning-light; color: $color-warning; }
    .stat-icon-wrapper.purple { background: $color-brand-primary-bg; color: $color-brand-primary; }

    /* Filter Bar */
    .filter-bar {
      background: $card-bg;
      border-radius: $radius-lg;
      padding: $spacing-md;
      box-shadow: $card-shadow;
      border: $card-border;
      margin-bottom: 20px;
      display: flex;
      gap: $spacing-md;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: $spacing-sm $spacing-md;
      border: $card-border;
      border-radius: $radius-md;
      background: $card-bg;
      font-size: $font-size-sm;
      color: $color-neutral-600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: $color-neutral-50;
    }

    .filter-btn.active {
      background: $color-brand-primary;
      color: white;
      border-color: $color-brand-primary;
    }

    /* Notification List */
    .notification-list {
      background: $card-bg;
      border-radius: $radius-lg;
      box-shadow: $card-shadow;
      border: $card-border;
      overflow: hidden;
    }

    .notification-item {
      border-bottom: 1px solid $color-neutral-100;
      transition: background 0.2s;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background: $color-neutral-50;
    }

    .notification-item.unread {
      background: $color-brand-primary-subtle;
    }

    .notif-content {
      padding: 20px;
      display: flex;
      gap: $spacing-md;
    }

    .notif-icon {
      width: 40px;
      height: 40px;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notif-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .notif-icon.approval { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .notif-icon.renewal { background: $color-warning-light; color: $color-warning; }
    .notif-icon.activity { background: $color-stem-green-bg; color: $color-stem-green; }
    .notif-icon.system { background: $color-brand-primary-bg; color: $color-brand-primary; }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      flex: 1;
    }

    .notif-title {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-neutral-700;
      margin: 0;
    }

    .notif-title.unread {
      color: $color-neutral-900;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: $color-brand-primary;
      border-radius: 50%;
    }

    .priority-badge {
      font-size: $font-size-xs;
      padding: 2px 8px;
      border-radius: $radius-sm;
      border: 1px solid;
    }

    .priority-badge.urgent {
      background: $color-error-light;
      color: $color-error;
      border-color: $color-error-light;
    }

    .notif-time {
      font-size: $font-size-xs;
      color: $color-neutral-400;
      white-space: nowrap;
      margin-left: 12px;
    }

    .notif-text {
      font-size: $font-size-sm;
      color: $color-neutral-600;
      margin: 0 0 12px 0;
      line-height: 1.5;
    }

    .notif-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .type-badge {
      font-size: $font-size-xs;
      padding: 4px 10px;
      border-radius: $radius-sm;
    }

    .type-badge.approval { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .type-badge.renewal { background: $color-warning-light; color: $color-warning; }
    .type-badge.activity { background: $color-stem-green-bg; color: $color-stem-green; }
    .type-badge.system { background: $color-brand-primary-bg; color: $color-brand-primary; }

    .action-btn {
      font-size: $font-size-sm;
      color: $color-brand-primary;
    }

    /* Load More */
    .load-more {
      padding: 20px;
      text-align: center;
      border-top: 1px solid $color-neutral-100;
    }

    .load-more-btn {
      color: $color-brand-primary;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  activeFilter: string = 'all';
  
  stats: NotificationStats = {
    unread_count: 0,
    high_priority_count: 0,
    pending_approvals: 0,
    renewal_warnings: 0
  };

  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount: number = 0;

  // Mock data
  mockNotifications: Notification[] = [
    {
      id: 1,
      title: '新课开设申请待审批',
      content: '张老师提交了《ESP32物联网开发》新课开设申请，等待您的审批。',
      type: 'approval',
      priority: 'high',
      is_read: false,
      create_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      action_label: '去审批'
    },
    {
      id: 2,
      title: '学员续费预警',
      content: '李小红（六年级）的机器人进阶课程剩余8课时，建议尽快联系家长续费。',
      type: 'renewal',
      priority: 'medium',
      is_read: false,
      create_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      action_label: '查看详情'
    },
    {
      id: 3,
      title: '蓝桥杯报名即将截止',
      content: '蓝桥杯青少年编程大赛报名将于6月15日截止，当前已有18名学员报名。',
      type: 'activity',
      priority: 'high',
      is_read: false,
      create_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      action_label: '查看报名'
    },
    {
      id: 4,
      title: '设备采购申请已通过',
      content: '您提交的15套Arduino传感器扩展板采购申请已通过审批，预计3天后到货。',
      type: 'approval',
      priority: 'low',
      is_read: true,
      create_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      title: '批量续费提醒',
      content: '本月共有23名学员课程即将到期，其中8人剩余课时≤10节。',
      type: 'renewal',
      priority: 'medium',
      is_read: true,
      create_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      action_label: '发送提醒'
    },
    {
      id: 6,
      title: '暑期集训营开始报名',
      content: '「AI视觉识别」暑期集训营已开启报名，早鸟价优惠至6月15日。',
      type: 'activity',
      priority: 'low',
      is_read: true,
      create_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      action_label: '查看活动'
    },
    {
      id: 7,
      title: '系统维护通知',
      content: '系统将于今晚23:00-01:00进行例行维护，期间部分功能可能暂时不可用。',
      type: 'system',
      priority: 'low',
      is_read: true,
      create_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.notifications = this.mockNotifications;
    this.filterNotifications();
    this.updateStats();
  }

  filterNotifications() {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.is_read);
        break;
      case 'approval':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'approval');
        break;
      case 'renewal':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'renewal');
        break;
      case 'activity':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'activity');
        break;
      default:
        this.filteredNotifications = this.notifications;
    }
  }

  updateStats() {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
    
    this.stats = {
      unread_count: this.unreadCount,
      high_priority_count: this.notifications.filter(n => n.priority === 'high' && !n.is_read).length,
      pending_approvals: this.notifications.filter(n => n.type === 'approval' && !n.is_read).length,
      renewal_warnings: this.notifications.filter(n => n.type === 'renewal').length
    };
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterNotifications();
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'approval': 'description',
      'renewal': 'attach_money',
      'activity': 'event',
      'system': 'notifications'
    };
    return icons[type] || 'notifications';
  }

  getTypeColor(type: string): string {
    return type;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'approval': '审批提醒',
      'renewal': '续费预警',
      'activity': '活动通知',
      'system': '系统通知'
    };
    return labels[type] || type;
  }

  formatTime(timeString: string): string {
    const now = new Date();
    const time = new Date(timeString);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return time.toISOString().split('T')[0];
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.is_read = true);
    this.filterNotifications();
    this.updateStats();
  }

  onAction(notification: Notification) {
    console.log('Action clicked:', notification);
    // TODO: 执行相应操作
  }
}
