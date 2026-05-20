import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

export interface TrainingMetrics {
  activeStudents: number;
  monthlyRevenue: string;
  courseCompletionRate: string;
  equipmentUsageRate: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-training-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <div class="training-dashboard">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <mat-card class="metric-card" (click)="onMetricClick('students')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon blue">people</mat-icon>
              <span class="trend up">↑ 12%</span>
            </div>
            <div class="metric-value">{{ metrics.activeStudents }}</div>
            <div class="metric-label">在训学员数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('revenue')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon green">attach_money</mat-icon>
              <span class="trend up">↑ 8%</span>
            </div>
            <div class="metric-value">{{ metrics.monthlyRevenue }}</div>
            <div class="metric-label">本月营收</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('completion')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon orange">trending_up</mat-icon>
              <span class="trend down">↓ 3%</span>
            </div>
            <div class="metric-value">{{ metrics.courseCompletionRate }}</div>
            <div class="metric-label">本月消课率</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('equipment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon purple">devices</mat-icon>
              <span class="trend stable">→ 稳定</span>
            </div>
            <div class="metric-value">{{ metrics.equipmentUsageRate }}</div>
            <div class="metric-label">设备使用率</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 常用功能模块 -->
      <div class="section-title">常用功能</div>
      <div class="modules-grid">
        <mat-card class="module-card" (click)="onModuleClick('leads')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>person_add</mat-icon>
            </div>
            <div class="module-info">
              <h4>招生线索</h4>
              <p class="subtitle">15位待跟进</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('schedule')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="module-info">
              <h4>智能排课</h4>
              <p class="subtitle">本周42节课</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('settlement')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon matBadge="8" matBadgeColor="warn">payments</mat-icon>
            </div>
            <div class="module-info">
              <h4>课时结算</h4>
              <p class="subtitle">待确认8单</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('live')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>videocam</mat-icon>
            </div>
            <div class="module-info">
              <h4>直播授课</h4>
              <p class="subtitle">在线教室3间</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 快捷操作栏 -->
      <div class="section-title">快捷操作</div>
      <div class="quick-actions-bar">
        <button *ngFor="let action of quickActions" mat-raised-button class="action-btn" (click)="onQuickAction(action)">
          <mat-icon>{{ action.icon }}</mat-icon>
          {{ action.label }}
        </button>
      </div>

      <!-- 教学资源中心 -->
      <div class="section-title">教学资源中心</div>
      <div class="resource-grid">
        <mat-card *ngFor="let resource of resources" class="resource-card" (click)="onResourceSelect(resource)">
          <mat-card-content>
            <div class="resource-icon">
              <mat-icon>{{ resource.icon }}</mat-icon>
            </div>
            <div class="resource-info">
              <h4>{{ resource.title }}</h4>
              <p>{{ resource.description }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- STEM 特色功能区 -->
      <div class="section-title">STEM 特色功能</div>
      <div class="stem-features-grid">
        <!-- 硬件设备管理 -->
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('hardware')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon blue">
                <mat-icon>devices</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>硬件设备管理</h4>
            <p class="feature-desc">Arduino/Raspberry Pi 租赁、维护、损耗追踪</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">156</span>
                <span class="stat-label">设备总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value orange">23</span>
                <span class="stat-label">借出中</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- 实验项目跟踪 -->
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('projects')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon green">
                <mat-icon>science</mat-icon>
              </div>
              <mat-icon class="status-icon warning">pending</mat-icon>
            </div>
            <h4>实验项目跟踪</h4>
            <p class="feature-desc">机器人竞赛、创客作品、编程项目归档</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">42</span>
                <span class="stat-label">进行中</span>
              </div>
              <div class="stat-item">
                <span class="stat-value green">18</span>
                <span class="stat-label">已完成</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Token 余额监控 -->
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('token')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon purple">
                <mat-icon>token</mat-icon>
              </div>
              <mat-icon class="status-icon info">info</mat-icon>
            </div>
            <h4>Token 余额监控</h4>
            <p class="feature-desc">AI 助教、智能评测、课程生成按需付费</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value purple">1,250</span>
                <span class="stat-label">剩余 Token</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">¥500</span>
                <span class="stat-label">充值入口</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- 创客空间预约 -->
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('makerspace')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon orange">
                <mat-icon>precision_manufacturing</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>创客空间预约</h4>
            <p class="feature-desc">实验室预约、设备共享、安全准入管理</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">3</span>
                <span class="stat-label">可用空间</span>
              </div>
              <div class="stat-item">
                <span class="stat-value orange">8</span>
                <span class="stat-label">今日预约</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .training-dashboard { 
      padding: 24px; 
      background: #f5f7fa;
      min-height: 100%;
    }
    
    /* 核心指标卡片 */
    .metrics-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 20px; 
      margin-bottom: 32px; 
    }
    
    .metric-card { 
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border-left: 4px solid transparent;
    }
    
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    mat-card-content {
      padding: 20px !important;
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .metric-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .metric-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .metric-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .metric-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    
    .trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    .trend.up { color: #4caf50; background: #e8f5e9; }
    .trend.down { color: #f44336; background: #ffebee; }
    .trend.stable { color: #ff9800; background: #fff3e0; }
    
    .metric-value { 
      font-size: 32px; 
      font-weight: 700; 
      color: #1a1a1a;
      margin: 8px 0;
    }
    
    .metric-label { 
      color: #666; 
      font-size: 14px;
      font-weight: 500;
    }
    
    /* 常用功能模块 */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-left: 4px;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .module-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-left: 4px solid #2196f3;
    }
    
    .module-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }
    
    .module-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #1976d2;
    }
    
    .module-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .module-info {
      flex: 1;
    }
    
    .module-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    
    .arrow {
      color: #999;
    }
    
    /* 快捷操作栏 */
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    
    .action-btn {
      text-transform: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }
    
    .action-btn mat-icon {
      margin-right: 8px;
    }
    
    /* 教学资源中心 */
    .resource-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .resource-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .resource-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .resource-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }
    
    .resource-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #1976d2;
    }
    
    .resource-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .resource-info h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .resource-info p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    
    /* STEM 特色功能区 */
    .stem-features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 8px;
    }
    
    .stem-feature-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      border-color: #2196f3;
    }
    
    .stem-feature-card mat-card-content {
      padding: 20px !important;
    }
    
    .feature-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .feature-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .feature-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .feature-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    .feature-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    
    .feature-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .status-icon.success { color: #4caf50; }
    .status-icon.warning { color: #ff9800; }
    .status-icon.info { color: #2196f3; }
    
    .stem-feature-card h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .feature-desc {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }
    
    .feature-stats {
      display: flex;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .stat-value.orange { color: #ff9800; }
    .stat-value.green { color: #4caf50; }
    .stat-value.purple { color: #9c27b0; }
    
    .stat-label {
      display: block;
      font-size: 12px;
      color: #999;
    }
    
    /* 响应式设计 */
    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .resource-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stem-features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      .modules-grid {
        grid-template-columns: 1fr;
      }
      .resource-grid {
        grid-template-columns: 1fr;
      }
      .stem-features-grid {
        grid-template-columns: 1fr;
      }
      .quick-actions-bar {
        flex-direction: column;
      }
      .action-btn {
        width: 100%;
      }
    }
  `]
})
export class TrainingDashboardComponent implements OnInit {
  @Input() metrics: TrainingMetrics = {
    activeStudents: 328,
    monthlyRevenue: '¥12.5W',
    courseCompletionRate: '92%',
    equipmentUsageRate: '85%'
  };
  
  @Input() quickActions: QuickActionItem[] = [
    { id: 'enroll', label: '快速报名', icon: 'how_to_reg' },
    { id: 'leave', label: '请假处理', icon: 'event_busy' },
    { id: 'homework', label: '作业批改', icon: 'assignment_turned_in' },
    { id: 'checkin', label: '签到打卡', icon: 'check_circle' },
    { id: 'renew', label: '续费提醒', icon: 'repeat' }
  ];
  
  @Input() resources: ResourceItem[] = [
    { id: 'courseware', title: '课件发布', description: '同步教学资源', icon: 'cloud_upload' },
    { id: 'promotion', title: '活动推广', description: '朋友圈海报生成', icon: 'share' },
    { id: 'report', title: '学情报告', description: '一键发送家长', icon: 'description' },
    { id: 'material', title: '素材库', description: '教案与习题集', icon: 'library_books' }
  ];
  
  @Output() quickActionClick = new EventEmitter<QuickActionItem>();
  @Output() resourceSelect = new EventEmitter<ResourceItem>();
  @Output() stemFeatureClick = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  onMetricClick(metric: string): void {
    console.log('Metric clicked:', metric);
    // TODO: Navigate to detailed view
  }

  onModuleClick(module: string): void {
    console.log('Module clicked:', module);
    // TODO: Navigate to module page
  }
  
  onQuickAction(action: QuickActionItem): void {
    console.log('Quick action clicked:', action);
    this.quickActionClick.emit(action);
  }
  
  onResourceSelect(resource: ResourceItem): void {
    console.log('Resource selected:', resource);
    this.resourceSelect.emit(resource);
  }
  
  onStemFeatureClick(feature: string): void {
    console.log('STEM feature clicked:', feature);
    this.stemFeatureClick.emit(feature);
  }
}
