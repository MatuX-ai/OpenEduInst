import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-safety-alert-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <div class="safety-panel">
      <h3>安全预警中心</h3>
      <mat-card>
        <mat-list>
          <mat-list-item *ngFor="let alert of alerts">
            <mat-icon matListItemIcon [class.high]="alert.level === 'high'">warning</mat-icon>
            <div matListItemTitle>{{ alert.schoolName }}</div>
            <div matListItemLine>{{ alert.message }}</div>
            <div matListItemLine class="time">{{ alert.time }}</div>
          </mat-list-item>
        </mat-list>
      </mat-card>
    </div>
  `,
  styles: [`
    .safety-panel { padding: 20px; }
    .high { color: #f44336; }
    .time { font-size: 12px; color: #999; }
  `]
})
export class SafetyAlertPanelComponent implements OnInit {
  alerts = [
    { schoolName: '第一实验小学', message: '消防设施检查逾期', level: 'high', time: '10分钟前' },
    { schoolName: '职业高级中学', message: '实验室设备报修申请', level: 'medium', time: '1小时前' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
