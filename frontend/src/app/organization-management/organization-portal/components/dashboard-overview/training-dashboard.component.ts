import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-training-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="training-dashboard">
      <h2>培训机构驾驶舱</h2>
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.activeStudents }}</div>
            <div class="metric-label">在训学员</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.monthlyRevenue }}</div>
            <div class="metric-label">本月营收</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.courseCompletionRate }}</div>
            <div class="metric-label">本月消课率</div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="feature-section">
        <h3>常用功能</h3>
        <div class="feature-list">
          <div class="feature-item"><mat-icon>person_add</mat-icon> 招生线索 (15位待跟进)</div>
          <div class="feature-item"><mat-icon>calendar_today</mat-icon> 智能排课 (本周42节课)</div>
          <div class="feature-item"><mat-icon>payments</mat-icon> 课时结算 (待确认8单)</div>
          <div class="feature-item"><mat-icon>videocam</mat-icon> 直播授课 (在线教室3间)</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .training-dashboard { padding: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1976d2; }
    .metric-label { color: #666; margin-top: 8px; }
    .feature-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .feature-item { display: flex; align-items: center; gap: 8px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
  `]
})
export class TrainingDashboardComponent implements OnInit {
  @Input() metrics: any = {};

  constructor() {}

  ngOnInit(): void {}
}
