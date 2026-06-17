import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface BureauMetrics {
  schoolCount: number;
  totalEquipmentValue: string;
  teacherTrainingRate: string;
  studentParticipationRate: string;
}

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="bureau-dashboard">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <mat-card class="metric-card" (click)="onMetricClick('schools')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon orange">school</mat-icon>
              <span class="trend up">↑ 3%</span>
            </div>
            <div class="metric-value">{{ metrics.schoolCount }}</div>
            <div class="metric-label">辖区学校数</div>
            <div class="metric-subtitle">覆盖率 85%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('equipment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon blue">devices</mat-icon>
              <span class="trend up">↑ 15%</span>
            </div>
            <div class="metric-value">{{ metrics.totalEquipmentValue }}</div>
            <div class="metric-label">设备资源总量</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('training')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon green">person</mat-icon>
              <span class="trend up">↑ 12%</span>
            </div>
            <div class="metric-value">{{ metrics.teacherTrainingRate }}</div>
            <div class="metric-label">师资培训覆盖率</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('participation')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon purple">groups</mat-icon>
              <span class="trend stable">→ 稳定</span>
            </div>
            <div class="metric-value">{{ metrics.studentParticipationRate }}</div>
            <div class="metric-label">学生参与率</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 常用功能模块 -->
      <div class="section-title">常用功能</div>
      <div class="modules-grid">
        <mat-card class="module-card" (click)="onModuleClick('district-stats')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>pie_chart</mat-icon>
            </div>
            <div class="module-info">
              <h4>辖区统计</h4>
              <p class="subtitle">127所学校数据汇总</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('safety')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon matBadge="2" matBadgeColor="warn">security</mat-icon>
            </div>
            <div class="module-info">
              <h4>安全预警</h4>
              <p class="subtitle">2所学校需关注</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('resource')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>shuffle</mat-icon>
            </div>
            <div class="module-info">
              <h4>资源调配</h4>
              <p class="subtitle">5项待审批申请</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('policy')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>description</mat-icon>
            </div>
            <div class="module-info">
              <h4>政策发布</h4>
              <p class="subtitle">本月 3份新文件</p>
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
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('regional-dashboard')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon orange">
                <mat-icon>map</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>区域数据看板</h4>
            <p class="feature-desc">GIS地图可视化展示全区STEM教育发展</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">127</span>
                <span class="stat-label">学校数量</span>
              </div>
              <div class="stat-item">
                <span class="stat-value orange">85%</span>
                <span class="stat-label">覆盖率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('resource-allocation')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon blue">
                <mat-icon>hub</mat-icon>
              </div>
              <mat-icon class="status-icon info">info</mat-icon>
            </div>
            <h4>资源调度中心</h4>
            <p class="feature-desc">跨校设备共享与师资流动管理</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">38</span>
                <span class="stat-label">共享设备</span>
              </div>
              <div class="stat-item">
                <span class="stat-value blue">12</span>
                <span class="stat-label">调度中</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('safety-network')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon green">
                <mat-icon>shield</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>安全监管网络</h4>
            <p class="feature-desc">实时监控各学校实验室安全状态</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value green">98%</span>
                <span class="stat-label">合规率</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">2</span>
                <span class="stat-label">预警数</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('quality-monitoring')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon purple">
                <mat-icon>trending_up</mat-icon>
              </div>
              <mat-icon class="status-icon warning">pending</mat-icon>
            </div>
            <h4>质量监测体系</h4>
            <p class="feature-desc">STEM教育质量量化评估与排名</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">127</span>
                <span class="stat-label">评估学校</span>
              </div>
              <div class="stat-item">
                <span class="stat-value purple">A级15</span>
                <span class="stat-label">优秀校</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .bureau-dashboard { 
      padding: $spacing-lg; 
      background: $color-neutral-50;
      min-height: 100%;
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
    
    .metric-icon.orange { background: #FF9800; }
    .metric-icon.blue { background: $color-brand-primary; }
    .metric-icon.green { background: $color-stem-green; }
    .metric-icon.purple { background: #9C27B0; }
    
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
    
    .metric-subtitle {
      color: $color-neutral-400;
      font-size: $font-size-xs;
      margin-top: 4px;
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
      border-left: 4px solid #FF9800;
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
      background: $color-warning-light;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
      color: #FF9800;
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
      background: #FF9800;
      color: $btn-primary-color;
      transition: all $transition-normal ease;
      border: none;
      cursor: pointer;
    }
    
    .action-btn:hover {
      transform: $btn-primary-transform-hover;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      background: #f57c00;
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
      border-color: #FF9800;
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
    
    .feature-icon.orange { background: #FF9800; }
    .feature-icon.blue { background: $color-brand-primary; }
    .feature-icon.green { background: $color-stem-green; }
    .feature-icon.purple { background: #9C27B0; }
    
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
    
    .stat-value.orange { color: #FF9800; }
    .stat-value.green { color: $color-stem-green; }
    .stat-value.blue { color: $color-brand-primary; }
    .stat-value.purple { color: #9C27B0; }
    
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
export class BureauDashboardComponent implements OnInit {
  @Input() metrics: any = {
    schoolCount: 127,
    totalEquipmentValue: '¥2,350W',
    teacherTrainingRate: '73%',
    studentParticipationRate: '58%'
  };
  
  @Input() quickActions = [
    { id: 'data-report', label: '数据上报', icon: 'upload_cloud' },
    { id: 'resource-apply', label: '资源申请', icon: 'plus_circle' },
    { id: 'safety-check', label: '安全检查', icon: 'shield' },
    { id: 'training-plan', label: '培训计划', icon: 'users' },
    { id: 'quality-eval', label: '质量评估', icon: 'star' }
  ];
  
  @Output() quickActionClick = new EventEmitter<any>();
  @Output() stemFeatureClick = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}
  
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
