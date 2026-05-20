/**
 * 月视图课程表组件
 *
 * @fileoverview 展示月视图课程表，显示每日课程摘要
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Schedule } from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM',
  },
  display: {
    dateInput: 'YYYY-MM',
    monthYearLabel: 'YYYY 年 MM 月',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY 年 MM 月',
  },
};

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  schedules: Schedule[];
  scheduleCount: number;
}

@Component({
  selector: 'app-schedule-month-view',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './schedule-month-view.component.html',
  styleUrls: ['./schedule-month-view.component.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
})
export class ScheduleMonthViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // 数据
  schedules: Schedule[] = [];
  loading = false;

  // 当前月份
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];

  // 星期标题
  weekdayHeaders = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  constructor(
    private scheduleService: ScheduleManagementService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.generateCalendar();
    this.loadSchedules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 生成日历网格
   */
  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // 获取当月第一天
    const firstDay = new Date(year, month, 1);

    // 计算起始日期（周一）
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay() || 7; // 转换为 1-7
    startDay.setDate(startDay.getDate() - (dayOfWeek - 1));

    // 生成 42 天（6 行 x 7 列）
    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDay);
      currentDate.setDate(startDay.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === month && currentDate.getFullYear() === year;

      // 筛选当天的课程
      const daySchedules = this.schedules.filter((schedule) => {
        const scheduleDate = new Date(schedule.startDate);
        return scheduleDate.toDateString() === currentDate.toDateString();
      });

      this.calendarDays.push({
        date: currentDate,
        dayOfMonth: currentDate.getDate(),
        isCurrentMonth,
        schedules: daySchedules,
        scheduleCount: daySchedules.length,
      });
    }
  }

  /**
   * 加载排课数据
   */
  loadSchedules(): void {
    this.loading = true;
    this.scheduleService
      .getScheduleList({})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.schedules = response.data;
          this.generateCalendar(); // 重新生成日历
          this.loading = false;
        },
        error: (error) => {
          console.error('加载课程表失败:', error);
          this.loading = false;
        },
      });
  }

  /**
   * 切换到上个月
   */
  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  /**
   * 切换到下个月
   */
  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  /**
   * 回到本月
   */
  today(): void {
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  /**
   * 跳转到周视图
   */
  goToWeekView(date: Date): void {
    // TODO: 路由跳转或触发事件
    alert(`跳转到 ${this.formatDate(date)} 的周视图`);
  }

  /**
   * 获取课程类型颜色
   */
  getScheduleColor(courseType: string): string {
    const colors: Record<string, string> = {
      'STEM课程': '#11998e',
      文化课: '#667eea',
      语言课: '#f093fb',
      技术课: '#4facfe',
      艺术课: '#43e97b',
      体育课: '#fa709a',
    };
    return colors[courseType] || '#667eea';
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 判断是否是今天
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
}
