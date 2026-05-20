/**
 * 排课管理主页面组件
 *
 * @fileoverview 整合日/周/月视图和批量排课功能
 * @author AI Assistant
 * @date 2026-04-08
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ScheduleDayViewComponent } from './schedule-day-view.component';
import { ScheduleMonthViewComponent } from './schedule-month-view.component';
import { ScheduleStatsCardComponent } from './schedule-stats-card.component';
import { ScheduleWeekViewComponent } from './schedule-week-view.component';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-schedule-main',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ScheduleDayViewComponent,
    ScheduleWeekViewComponent,
    ScheduleMonthViewComponent,
    ScheduleStatsCardComponent,
  ],
  template: `
    <div class="schedule-container">
      <!-- 工具栏 -->
      <mat-card class="toolbar-card">
        <mat-card-content>
          <div class="toolbar">
            <!-- 视图切换 -->
            <div class="view-toggle">
              <mat-button-toggle-group
                [(ngModel)]="currentView"
                (change)="onViewChange()"
                aria-label="视图模式">
                <mat-button-toggle value="day">
                  <mat-icon>view_day</mat-icon>
                  日视图
                </mat-button-toggle>
                <mat-button-toggle value="week">
                  <mat-icon>view_week</mat-icon>
                  周视图
                </mat-button-toggle>
                <mat-button-toggle value="month">
                  <mat-icon>calendar_month</mat-icon>
                  月视图
                </mat-button-toggle>
              </mat-button-toggle-group>
            </div>

            <!-- 操作按钮 -->
            <div class="actions">
              <button
                mat-flat-button
                color="primary"
                (click)="openBatchSchedule()"
                matTooltip="批量排课">
                <mat-icon>add_circle</mat-icon>
                批量排课
              </button>

              <button
                mat-stroked-button
                [matMenuTriggerFor]="moreMenu"
                matTooltip="更多操作">
                <mat-icon>more_vert</mat-icon>
              </button>

              <mat-menu #moreMenu="matMenu">
                <button mat-menu-item (click)="exportSchedule()">
                  <mat-icon>download</mat-icon>
                  <span>导出课表</span>
                </button>
                <button mat-menu-item (click)="printSchedule()">
                  <mat-icon>print</mat-icon>
                  <span>打印课表</span>
                </button>
                <button mat-menu-item (click)="openStats()">
                  <mat-icon>analytics</mat-icon>
                  <span>统计数据</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 统计卡片 -->
      @if (showStats) {
        <app-schedule-stats-card></app-schedule-stats-card>
      }

      <!-- 视图内容 -->
      <div class="view-content">
        @if (currentView === 'day') {
          <app-schedule-day-view></app-schedule-day-view>
        }
        @if (currentView === 'week') {
          <app-schedule-week-view></app-schedule-week-view>
        }
        @if (currentView === 'month') {
          <app-schedule-month-view></app-schedule-month-view>
        }
      </div>
    </div>
  `,
  styles: [`
    .schedule-container {
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      background-color: #f5f5f5;
    }

    .toolbar-card {
      margin-bottom: 16px;
      border-radius: 8px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .view-toggle {
      display: flex;
      align-items: center;
    }

    ::ng-deep .mat-button-toggle-group {
      border: none;
      border-radius: 8px;
      overflow: hidden;
    }

    ::ng-deep .mat-button-toggle {
      background-color: #f5f5f5;
    }

    ::ng-deep .mat-button-toggle-checked {
      background-color: #1976d2;
      color: white;
    }

    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .view-content {
      min-height: 500px;
    }

    @media (max-width: 768px) {
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .view-toggle,
      .actions {
        justify-content: center;
      }
    }
  `],
})
export class ScheduleMainComponent implements OnInit {
  currentView: ViewMode = 'week';
  showStats = false;

  ngOnInit(): void {
    // 默认显示周视图
  }

  /**
   * 视图切换
   */
  onViewChange(): void {
    console.log('切换视图:', this.currentView);
  }

  /**
   * 打开批量排课
   */
  openBatchSchedule(): void {
    // TODO: 打开批量排课对话框或导航到批量排课页面
    window.location.href = '/management/organization/1/schedule/batch';
  }

  /**
   * 导出课表
   */
  exportSchedule(): void {
    alert('导出功能待实现');
  }

  /**
   * 打印课表
   */
  printSchedule(): void {
    window.print();
  }

  /**
   * 显示统计
   */
  openStats(): void {
    this.showStats = !this.showStats;
  }
}
