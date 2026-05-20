import { Component, Input, OnInit } from '@angular/core';
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
    
    /* 响应式设计 */
    @media (max-width: 1200px) {
      .metrics-grid {
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
}
