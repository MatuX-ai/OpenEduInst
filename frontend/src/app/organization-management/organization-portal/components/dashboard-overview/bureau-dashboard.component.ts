import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="bureau-dashboard">
      <h2>教育局管理驾驶舱</h2>
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.schoolCount }}</div>
            <div class="metric-label">辖区学校总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.teacherTotal }}</div>
            <div class="metric-label">在编教师总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.budgetExec }}</div>
            <div class="metric-label">年度预算执行率</div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="feature-section">
        <h3>常用功能</h3>
        <div class="feature-list">
          <div class="feature-item"><mat-icon>bar_chart</mat-icon> 辖区统计</div>
          <div class="feature-item"><mat-icon>security</mat-icon> 安全预警</div>
          <div class="feature-item"><mat-icon>account_balance</mat-icon> 资源分配</div>
          <div class="feature-item"><mat-icon>description</mat-icon> 政策发布</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bureau-dashboard { padding: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #9c27b0; }
    .metric-label { color: #666; margin-top: 8px; }
    .feature-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .feature-item { display: flex; align-items: center; gap: 8px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
  `]
})
export class BureauDashboardComponent implements OnInit {
  @Input() metrics: any = {};

  constructor() {}

  ngOnInit(): void {}
}
