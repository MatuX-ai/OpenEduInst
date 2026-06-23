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
      <!-- 页面标题（对齐原型） -->
      <div class="page-header">
        <div>
          <h1 class="page-title">排课管理</h1>
          <p class="page-subtitle">日/周/月多视图课表管理与批量排课</p>
        </div>
        <div class="header-actions">
          <button class="cd-btn cd-btn-primary" (click)="openBatchSchedule()">
            <mat-icon>add_circle</mat-icon>
            批量排课
          </button>
          <button class="cd-btn cd-btn-secondary" (click)="openEquipmentSchedule()">
            <mat-icon>precision_manufacturing</mat-icon>
            设备排期
          </button>
          <button class="cd-btn cd-btn-secondary" [matMenuTriggerFor]="moreMenu">
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

      <!-- 视图切换工具栏（对齐原型卡片样式） -->
      <div class="toolbar-card">
        <div class="toolbar-inner">
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
          <span class="current-date-label">{{ currentDateLabel }}</span>
        </div>
      </div>

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
    @use 'design-tokens' as *;
@use 'shared/mixins' as mx;

    .schedule-container {
      height: 100%;
      overflow-y: auto;
    }

    /* 页面标题（对齐原型） */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-lg;
    }

    .page-title {
      margin: 0;
      font-size: $font-size-xl;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .page-subtitle {
      margin: $spacing-xs 0 0 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }

    .header-actions {
      display: flex;
      gap: $spacing-sm;
      align-items: center;
    }

    /* 按钮样式（对齐原型） */
    .cd-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: $radius-md;
      font-size: $font-size-sm;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all $transition-fast ease;
      line-height: 1;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.cd-btn-primary {
        background: $btn-primary-bg;
        color: $btn-primary-color;
        &:hover { background: $btn-primary-bg-hover; }
      }

      &.cd-btn-secondary {
        background: $btn-secondary-bg;
        color: $color-neutral-600;
        border: 1px solid $color-neutral-200;
        padding: 8px 12px;
        &:hover { background: $color-neutral-50; }
      }
    }

    /* 工具栏卡片（对齐原型） */
    .toolbar-card {
      background: $card-bg;
      border-radius: $radius-lg;
      box-shadow: $card-shadow;
      border: $card-border;
      padding: $spacing-md $spacing-lg;
      margin-bottom: $spacing-lg;
    }

    .toolbar-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: $spacing-md;
    }

    .view-toggle {
      display: flex;
      align-items: center;
    }

    /* Material button toggle 样式已迁移至 styles/_material-overrides.scss */

    .current-date-label {
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }

    .view-content {
      min-height: 500px;
    }

    @include mx.responsive(sm) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-md;
      }

      .toolbar-inner {
        flex-direction: column;
        align-items: stretch;
      }

      .view-toggle {
        justify-content: center;
      }
    }
  `],
})
export class ScheduleMainComponent implements OnInit {
  currentView: ViewMode = 'week';
  showStats = false;
  currentDateLabel: string = '';

  ngOnInit(): void {
    this.updateDateLabel();
  }

  private updateDateLabel(): void {
    const now = new Date();
    this.currentDateLabel = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
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
    window.location.href = '/organization/1/schedule/batch';
  }

  /**
   * 打开设备排期
   */
  openEquipmentSchedule(): void {
    // TODO: 打开设备排期对话框或导航到设备排期页面
    console.log('打开设备排期');
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
