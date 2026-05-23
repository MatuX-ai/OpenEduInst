import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

export interface VocationalMetrics {
  totalStudents: number;
  equipmentUsageRate: string;
  certificationPassRate: string;
  employmentRate: string;
}

@Component({
  selector: 'app-vocational-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <div class="vocational-dashboard">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <mat-card class="metric-card" (click)="onMetricClick('students')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon purple">school</mat-icon>
              <span class="trend up">↑ 6%</span>
            </div>
            <div class="metric-value">{{ metrics.totalStudents }}</div>
            <div class="metric-label">在训学员数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('equipment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon blue">precision_manufacturing</mat-icon>
              <span class="trend up">↑ 10%</span>
            </div>
            <div class="metric-value">{{ metrics.equipmentUsageRate }}</div>
            <div class="metric-label">实训设备利用率</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('certification')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon green">card_membership</mat-icon>
              <span class="trend stable">→ 稳定</span>
            </div>
            <div class="metric-value">{{ metrics.certificationPassRate }}</div>
            <div class="metric-label">技能认证通过率</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('employment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon orange">work</mat-icon>
              <span class="trend up">↑ 8%</span>
            </div>
            <div class="metric-value">{{ metrics.employmentRate }}</div>
            <div class="metric-label">就业对接率</div>
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
              <p class="subtitle">今日 12 个实训班组</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('internship')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon matBadge="235" matBadgeColor="warn">work</mat-icon>
            </div>
            <div class="module-info">
              <h4>实习跟踪</h4>
              <p class="subtitle">235人在岗实习</p>
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
              <h4>技能认证</h4>
              <p class="subtitle">本月 45 人参加考试</p>
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
              <p class="subtitle">合作企业 38 家</p>
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
                <span class="stat-value">86</span>
                <span class="stat-label">设备总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value purple">72%</span>
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
            <p class="feature-desc">实时监測、智能预警、紧急停机</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value green">120</span>
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
                <span class="stat-value">156</span>
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
                <span class="stat-value orange">65%</span>
                <span class="stat-label">就业率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .vocational-dashboard { 
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
    
    .metric-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    .metric-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .metric-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .metric-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    
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
      border-left: 4px solid #9c27b0;
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
      background: linear-gradient(135deg, #f3e5f5, #e1bee7);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #9c27b0;
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
      background: #9c27b0;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
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
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      border-color: #9c27b0;
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
    
    .feature-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    .feature-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .feature-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
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
    
    .stat-value.purple { color: #9c27b0; }
    .stat-value.green { color: #4caf50; }
    .stat-value.blue { color: #2196f3; }
    .stat-value.orange { color: #ff9800; }
    
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
export class VocationalDashboardComponent implements OnInit {
  @Input() metrics: any = {
    totalStudents: 856,
    equipmentUsageRate: '72%',
    certificationPassRate: '88%',
    employmentRate: '65%'
  };
  
  @Input() quickActions = [
    { id: 'equip-reserve', label: '设备预约', icon: 'calendar_plus' },
    { id: 'safety-check', label: '安全准入', icon: 'shield_check' },
    { id: 'intern-report', label: '实习报告', icon: 'file_text' },
    { id: 'cert-apply', label: '证书申请', icon: 'award' },
    { id: 'enterprise-contact', label: '企业联络', icon: 'phone' }
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
