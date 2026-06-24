import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VocationalService, VocDashboardStats } from '../../../services/vocational.service';

export interface VocationalMetrics {
  totalStudents: number;
  equipmentUsageRate: string;
  certificationPassRate: string;
  employmentRate: string;
}

@Component({
  selector: 'app-vocational-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatBadgeModule, MatProgressBarModule],
  template: `
    <div class="vocational-dashboard">
      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-bar">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <mat-card class="metric-card" (click)="onMetricClick('students')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon purple">precision_manufacturing</mat-icon>
              <span class="trend" [class.up]="true" [class.stable]="false">设备总数 {{ stats.total_equipment }}</span>
            </div>
            <div class="metric-value">{{ stats.equipment_usage_rate }}</div>
            <div class="metric-label">实训设备利用率</div>
            <div class="metric-sub">
              <span>可用 {{ stats.equipment_available }}</span>
              <span>使用中 {{ stats.equipment_in_use }}</span>
              <span>维修 {{ stats.equipment_maintenance }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('equipment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon blue">assignment_return</mat-icon>
              <span class="trend" [class.up]="stats.overdue_borrows === 0" [class.stable]="stats.overdue_borrows > 0">
                {{ stats.overdue_borrows > 0 ? '逾期 ' + stats.overdue_borrows : '正常' }}
              </span>
            </div>
            <div class="metric-value">{{ stats.active_borrows }}</div>
            <div class="metric-label">设备借用中</div>
            <div class="metric-sub">
              <span>闲置预警 {{ stats.equipment_idle_count }} 台</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('certification')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon green">build</mat-icon>
              <span class="trend">待处理</span>
            </div>
            <div class="metric-value">{{ stats.total_faults_pending }}</div>
            <div class="metric-label">待处理故障</div>
            <div class="metric-sub">
              <span>安全运行 {{ stats.safety_days }} 天</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('employment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon orange">work</mat-icon>
              <span class="trend up">就业对接</span>
            </div>
            <div class="metric-value">{{ metrics.employmentRate }}</div>
            <div class="metric-label">就业对接率</div>
            <div class="metric-sub">
              <span>在训 {{ metrics.totalStudents }} 人</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 常用功能模块 -->
      <div class="section-title">常用功能</div>
      <div class="modules-grid">
        <mat-card class="module-card" (click)="onModuleClick('training')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>build</mat-icon>
            </div>
            <div class="module-info">
              <h4>实训管理</h4>
              <p class="subtitle">设备借用 / 归还 / 维护</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('internship')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon matBadge="active" matBadgeColor="warn">work</mat-icon>
            </div>
            <div class="module-info">
              <h4>实习跟踪</h4>
              <p class="subtitle">实习记录 / 企业评价</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('certification')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>emoji_events</mat-icon>
            </div>
            <div class="module-info">
              <h4>技能竞赛</h4>
              <p class="subtitle">竞赛报名 / 成绩管理</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('enterprise')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>handshake</mat-icon>
            </div>
            <div class="module-info">
              <h4>企业对接</h4>
              <p class="subtitle">合作企业 / 联合项目</p>
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

      <!-- STEM 特色功能区 -->
      <div class="section-title">STEM 特色功能</div>
      <div class="stem-features-grid">
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('industrial-equipment')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon purple">
                <mat-icon>factory</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>工业设备管理</h4>
            <p class="feature-desc">PLC、CNC、工业机器人全生命周期管理</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">{{ stats.total_equipment }}</span>
                <span class="stat-label">设备总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value purple">{{ stats.equipment_usage_rate }}</span>
                <span class="stat-label">利用率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('safety')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon green">
                <mat-icon>shield</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>安全监控系统</h4>
            <p class="feature-desc">实时监测、智能预警、紧急停机</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value green">{{ stats.safety_days }}</span>
                <span class="stat-label">安全天数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">0</span>
                <span class="stat-label">事故数</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('skill-assessment')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon blue">
                <mat-icon>assessment</mat-icon>
              </div>
              <mat-icon class="status-icon info">info</mat-icon>
            </div>
            <h4>技能评估体系</h4>
            <p class="feature-desc">基于实际操作的能力量化评估</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">{{ stats.total_equipment }}</span>
                <span class="stat-label">评估人次</span>
              </div>
              <div class="stat-item">
                <span class="stat-value blue">88%</span>
                <span class="stat-label">达标率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('industry-integration')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon orange">
                <mat-icon>hub</mat-icon>
              </div>
              <mat-icon class="status-icon warning">pending</mat-icon>
            </div>
            <h4>产教融合平台</h4>
            <p class="feature-desc">校企合作项目与人才输送通道</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">24</span>
                <span class="stat-label">合作项目</span>
              </div>
              <div class="stat-item">
                <span class="stat-value orange">{{ metrics.employmentRate }}</span>
                <span class="stat-label">就业率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .vocational-dashboard { 
      padding: $spacing-lg; 
      background: $color-neutral-50;
      min-height: 100%;
    }
    
    .loading-bar {
      margin-bottom: $spacing-md;
    }
    
    .metrics-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 20px; 
      margin-bottom: $spacing-xl; 
    }
    
    .metric-card { 
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
    }
    
    .metric-card:hover {
      transform: $card-transform-hover;
      box-shadow: $card-shadow-hover;
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
      border-radius: $radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .metric-icon.purple { background: #9C27B0; }
    .metric-icon.blue { background: $color-brand-primary; }
    .metric-icon.green { background: $color-stem-green; }
    .metric-icon.orange { background: #FF9800; }
    
    .trend {
      font-size: $font-size-xs;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    .trend.up { color: $color-stem-green; background: $color-stem-green-bg; }
    .trend.stable { color: #FF9800; background: $color-warning-light; }
    
    .metric-value { 
      font-size: $font-size-4xl; 
      font-weight: 700; 
      color: $color-neutral-900;
      margin: $spacing-xs 0;
    }
    
    .metric-label { 
      color: $color-neutral-500; 
      font-size: $font-size-sm;
      font-weight: 500;
    }

    .metric-sub {
      display: flex;
      gap: $spacing-sm;
      font-size: $font-size-xs;
      color: $color-neutral-400;
      margin-top: $spacing-xs;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: $color-neutral-900;
      margin-bottom: $spacing-md;
      padding-left: 4px;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-md;
      margin-bottom: $spacing-xl;
    }
    
    .module-card {
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
    }
    
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: $card-shadow-hover;
      border-left: 4px solid #9C27B0;
    }
    
    .module-card mat-card-content {
      display: flex;
      align-items: center;
      padding: $spacing-md !important;
    }
    
    .module-icon {
      width: 56px;
      height: 56px;
      border-radius: $radius-lg;
      background: #F3E5F5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
      color: #9C27B0;
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
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-900;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }
    
    .arrow {
      color: $color-neutral-400;
    }
    
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: $spacing-xl;
    }
    
    .action-btn {
      text-transform: none;
      border-radius: $btn-primary-radius;
      padding: 12px 20px;
      font-weight: $btn-font-weight;
      background: #9C27B0;
      color: $btn-primary-color;
      transition: all $transition-normal ease;
      border: none;
      cursor: pointer;
    }
    
    .action-btn:hover {
      transform: $btn-primary-transform-hover;
      box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
      background: #8e24aa;
    }
    
    .action-btn mat-icon {
      margin-right: 8px;
    }
    
    .stem-features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .stem-feature-card {
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: $card-transform-hover;
      box-shadow: $card-shadow-hover;
      border-color: #9C27B0;
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
      border-radius: $radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .feature-icon.purple { background: #9C27B0; }
    .feature-icon.green { background: $color-stem-green; }
    .feature-icon.blue { background: $color-brand-primary; }
    .feature-icon.orange { background: #FF9800; }
    
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
    
    .status-icon.success { color: $color-stem-green; }
    .status-icon.warning { color: #FF9800; }
    .status-icon.info { color: $color-brand-primary; }
    
    .stem-feature-card h4 {
      margin: 0 0 8px 0;
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-900;
    }
    
    .feature-desc {
      margin: 0 0 $spacing-md 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
      line-height: 1.5;
    }
    
    .feature-stats {
      display: flex;
      gap: $spacing-md;
      padding-top: $spacing-md;
      border-top: 1px solid $color-neutral-100;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: $font-size-lg;
      font-weight: 700;
      color: $color-neutral-900;
      margin-bottom: 4px;
    }
    
    .stat-value.purple { color: #9C27B0; }
    .stat-value.green { color: $color-stem-green; }
    .stat-value.blue { color: $color-brand-primary; }
    .stat-value.orange { color: #FF9800; }
    
    .stat-label {
      display: block;
      font-size: $font-size-xs;
      color: $color-neutral-400;
    }
    
    @media (max-width: 1200px) {
      .metrics-grid, .stem-features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .metrics-grid, .modules-grid, .stem-features-grid {
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
export class VocationalDashboardComponent implements OnInit {
  private vocationalService = inject(VocationalService);

  @Input() metrics: VocationalMetrics = {
    totalStudents: 856,
    equipmentUsageRate: '72%',
    certificationPassRate: '88%',
    employmentRate: '65%'
  };
  
  @Input() quickActions = [
    { id: 'equip-reserve', label: '设备预约', icon: 'calendar_today' },
    { id: 'safety-check', label: '安全准入', icon: 'shield' },
    { id: 'intern-report', label: '实习报告', icon: 'description' },
    { id: 'cert-apply', label: '证书申请', icon: 'verified' },
    { id: 'enterprise-contact', label: '企业联络', icon: 'phone' }
  ];
  
  @Output() quickActionClick = new EventEmitter<any>();
  @Output() stemFeatureClick = new EventEmitter<string>();

  stats: VocDashboardStats = {
    total_equipment: 0,
    equipment_in_use: 0,
    equipment_available: 0,
    equipment_maintenance: 0,
    equipment_usage_rate: '0%',
    equipment_idle_count: 0,
    active_borrows: 0,
    overdue_borrows: 0,
    total_faults_pending: 0,
    safety_days: 0,
  };
  
  loading = false;

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.loading = true;
    this.vocationalService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('加载仪表盘数据失败', err);
        this.loading = false;
      },
    });
  }
  
  onMetricClick(metric: string): void {
    console.log('Metric clicked:', metric);
  }

  onModuleClick(module: string): void {
    console.log('Module clicked:', module);
  }
  
  onQuickAction(action: any): void {
    console.log('Quick action clicked:', action);
    this.quickActionClick.emit(action);
  }
  
  onStemFeatureClick(feature: string): void {
    console.log('STEM feature clicked:', feature);
    this.stemFeatureClick.emit(feature);
  }
}