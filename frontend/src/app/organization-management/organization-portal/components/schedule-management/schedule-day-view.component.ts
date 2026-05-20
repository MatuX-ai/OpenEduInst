/**
 * 日视图课程表组件
 *
 * @fileoverview 展示单日详细课程表
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
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

@Component({
  selector: 'app-schedule-day-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  templateUrl: './schedule-day-view.component.html',
  styleUrls: ['./schedule-day-view.component.scss'],
})
export class ScheduleDayViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // 数据
  schedules: Schedule[] = [];
  loading = false;

  // 当前日期
  currentDate: Date = new Date();

  // 时间轴配置
  startHour = 8; // 8:00 开始
  endHour = 21; // 21:00 结束
  hourHeight = 80; // 每小时 80px（日视图更详细）

  // 星期标签
  weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  constructor(
    private scheduleService: ScheduleManagementService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          // 筛选当天的课程
          const dateStr = this.currentDate.toDateString();
          this.schedules = response.data.filter((schedule) => {
            const scheduleDate = new Date(schedule.startDate);
            return scheduleDate.toDateString() === dateStr;
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('加载课程表失败:', error);
          this.loading = false;
        },
      });
  }

  /**
   * 切换到前一天
   */
  previousDay(): void {
    this.currentDate.setDate(this.currentDate.getDate() - 1);
    this.loadSchedules();
  }

  /**
   * 切换到后一天
   */
  nextDay(): void {
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.loadSchedules();
  }

  /**
   * 回到今天
   */
  today(): void {
    this.currentDate = new Date();
    this.loadSchedules();
  }

  /**
   * 日期变化时刷新
   */
  onDateChange(): void {
    this.loadSchedules();
  }

  /**
   * 计算课程卡片的 top 位置
   */
  getScheduleTop(schedule: Schedule): number {
    const [hours, minutes] = schedule.startTime.split(':').map(Number);
    const totalMinutes = (hours - this.startHour) * 60 + minutes;
    return (totalMinutes / 60) * this.hourHeight;
  }

  /**
   * 计算课程卡片的高度
   */
  getScheduleHeight(schedule: Schedule): number {
    const startMinutes = this.timeToMinutes(schedule.startTime);
    const endMinutes = this.timeToMinutes(schedule.endTime);
    const duration = endMinutes - startMinutes;
    return (duration / 60) * this.hourHeight;
  }

  /**
   * 获取课程颜色
   */
  getScheduleColor(courseType: string): string {
    const colors: Record<string, string> = {
      'STEM课程': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      文化课: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      语言课: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      技术课: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      艺术课: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      体育课: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    };
    return colors[courseType] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  /**
   * 添加课程
   */
  onAddSchedule(): void {
    // TODO: 打开添加课程对话框
    alert('添加课程功能待实现');
  }

  /**
   * 编辑课程
   */
  onEditSchedule(schedule: Schedule): void {
    // TODO: 打开编辑对话框
    alert(`编辑课程：${schedule.courseName}`);
  }

  /**
   * 删除课程
   */
  onDeleteSchedule(schedule: Schedule): void {
    if (confirm(`确定要删除"${schedule.courseName}"吗？`)) {
      this.scheduleService
        .deleteSchedule(schedule.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadSchedules();
          },
        });
    }
  }

  /**
   * 调课
   */
  onAdjustSchedule(schedule: Schedule): void {
    // TODO: 打开调课对话框
    alert(`调整"${schedule.courseName}"的时间`);
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

  /**
   * 格式化日期显示
   */
  getFormattedDate(): string {
    const year = this.currentDate.getFullYear();
    const month = (this.currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = this.currentDate.getDate().toString().padStart(2, '0');
    const weekday = this.weekdayLabels[this.currentDate.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  }

  /**
   * 时间转分钟数
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 获取小时标签数组
   */
  get hourLabels(): number[] {
    return Array.from({ length: this.endHour - this.startHour + 1 }, (_, i) => this.startHour + i);
  }

  /**
   * 获取当前时间位置 (分钟)
   */
  getCurrentTimePosition(): number {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.startHour * 60;
    return ((minutes - startMinutes) / 60) * this.hourHeight;
  }

  /**
   * 获取总课时数
   */
  getTotalHours(): number {
    return this.schedules.reduce((sum, schedule) => {
      const duration =
        this.timeToMinutes(schedule.endTime) - this.timeToMinutes(schedule.startTime);
      return sum + duration / 60;
    }, 0);
  }

  /**
   * 获取学生总数
   */
  getTotalStudents(): number {
    return this.schedules.reduce((sum, schedule) => sum + (schedule.studentIds?.length || 0), 0);
  }
}
