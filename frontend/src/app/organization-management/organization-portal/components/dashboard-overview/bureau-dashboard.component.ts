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
    .bureau-dashboard { 
      padding: 24px; 
      background: #f5f7fa;
      min-height: 100%;
    }
    
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
    
    .metric-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .metric-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .metric-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .metric-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    
    .trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    .trend.up { color: #4caf50; background: #e8f5e9; }
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
    
    .metric-subtitle {
      color: #999;
      font-size: 12px;
      margin-top: 4px;
    }
    
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
      margin-bottom: 32px;
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
      border-left: 4px solid #ff9800;
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
      background: linear-gradient(135deg, #fff3e0, #ffe0b2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #ff9800;
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
      background: #ff9800;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
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
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      border-color: #ff9800;
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
    
    .feature-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .feature-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .feature-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .feature-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    
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
    .stat-value.blue { color: #2196f3; }
    .stat-value.purple { color: #9c27b0; }
    
    .stat-label {
      display: block;
      font-size: 12px;
      color: #999;
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
  @Input() metrics: BureauMetrics = {
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
