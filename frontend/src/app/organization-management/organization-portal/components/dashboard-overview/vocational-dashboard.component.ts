import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-vocational-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="vocational-dashboard">
      <h2>职业学校驾驶舱</h2>
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.equipmentUsage }}</div>
            <div class="metric-label">实训设备使用率</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.employmentRate }}</div>
            <div class="metric-label">毕业生就业率</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.coopProjects }}</div>
            <div class="metric-label">校企合作项目</div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="feature-section">
        <h3>常用功能</h3>
        <div class="feature-list">
          <div class="feature-item"><mat-icon>build</mat-icon> 实训管理</div>
          <div class="feature-item"><mat-icon>work</mat-icon> 实习跟踪</div>
          <div class="feature-item"><mat-icon>card_membership</mat-icon> 技能认证</div>
          <div class="feature-item"><mat-icon>handshake</mat-icon> 企业对接</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vocational-dashboard { padding: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #ff9800; }
    .metric-label { color: #666; margin-top: 8px; }
    .feature-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .feature-item { display: flex; align-items: center; gap: 8px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
  `]
})
export class VocationalDashboardComponent implements OnInit {
  @Input() metrics: any = {};

  constructor() {}

  ngOnInit(): void {}
}
