import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-k12-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="k12-dashboard">
      <h2>K12学校驾驶舱</h2>
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.totalStudents }}</div>
            <div class="metric-label">在校学生</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.attendanceRate }}</div>
            <div class="metric-label">今日出勤率</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ metrics.activeClasses }}</div>
            <div class="metric-label">教学班级</div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="feature-section">
        <h3>常用功能</h3>
        <div class="feature-list">
          <div class="feature-item"><mat-icon>school</mat-icon> 学籍管理</div>
          <div class="feature-item"><mat-icon>event_note</mat-icon> 课表查询</div>
          <div class="feature-item"><mat-icon>message</mat-icon> 家校互动</div>
          <div class="feature-item"><mat-icon>assessment</mat-icon> 成绩分析</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .k12-dashboard { padding: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #4caf50; }
    .metric-label { color: #666; margin-top: 8px; }
    .feature-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .feature-item { display: flex; align-items: center; gap: 8px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
  `]
})
export class K12DashboardComponent implements OnInit {
  @Input() metrics: any = {};

  constructor() {}

  ngOnInit(): void {}
}
