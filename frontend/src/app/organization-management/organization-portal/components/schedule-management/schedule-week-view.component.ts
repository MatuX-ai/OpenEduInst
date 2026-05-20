/**
 * 周视图课程表组件
 *
 * @fileoverview 展示周视图课程表，支持拖拽调整
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DayOfWeek, Schedule, ScheduleFilter } from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

@Component({
  selector: 'app-schedule-week-view',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
  ],
  templateUrl: './schedule-week-view.component.html',
  styleUrls: ['./schedule-week-view.component.scss'],
})
export class ScheduleWeekViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // 数据
  schedules: Schedule[] = [];
  loading = false;

  // 筛选条件
  filter: ScheduleFilter = {
    pageSize: 50, // 获取更多数据
  };

  // 当前周信息
  currentWeekStart: Date = new Date();
  weekDays: Array<{
    day: DayOfWeek;
    date: Date;
    label: string;
  }> = [];

  // 时间轴配置
  startHour = 8; // 8:00 开始
  endHour = 21; // 21:00 结束
  hourHeight = 60; // 每小时 60px

  // 星期标签
  weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  constructor(
    private scheduleService: ScheduleManagementService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initWeekDays();
    this.loadSchedules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 初始化周数据
   */
  initWeekDays(): void {
    const now = new Date();
    const currentDay = now.getDay() || 7; // 转换为 1-7
    const diff = now.getDate() - currentDay + 1;
    this.currentWeekStart = new Date(now.setDate(diff));

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      return {
        day: (i + 1) as DayOfWeek,
        date,
        label: `${this.weekdayLabels[i]} (${date.getMonth() + 1}/${date.getDate()})`,
      };
    });
  }

  /**
   * 加载排课数据
   */
  loadSchedules(): void {
    this.loading = true;
    this.scheduleService
      .getScheduleList(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.schedules = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('加载课程表失败:', error);
          this.loading = false;
        },
      });
  }

  /**
   * 切换到上一周
   */
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.initWeekDays();
    this.loadSchedules();
  }

  /**
   * 切换到下一周
   */
  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.initWeekDays();
    this.loadSchedules();
  }

  /**
   * 回到本周
   */
  today(): void {
    this.currentWeekStart = new Date();
    this.initWeekDays();
    this.loadSchedules();
  }

  /**
   * 获取指定星期的课程列表
   */
  getSchedulesByDay(day: DayOfWeek): Schedule[] {
    return this.schedules.filter((s) => s.dayOfWeek === day);
  }

  /**
   * 计算课程卡片的 top 位置（像素）
   */
  getScheduleTop(schedule: Schedule): number {
    const [hours, minutes] = schedule.startTime.split(':').map(Number);
    const totalMinutes = (hours - this.startHour) * 60 + minutes;
    return (totalMinutes / 60) * this.hourHeight;
  }

  /**
   * 计算课程卡片的高度（像素）
   */
  getScheduleHeight(schedule: Schedule): number {
    const startMinutes = this.timeToMinutes(schedule.startTime);
    const endMinutes = this.timeToMinutes(schedule.endTime);
    const duration = endMinutes - startMinutes;
    return (duration / 60) * this.hourHeight;
  }

  /**
   * 获取课程卡片的背景色
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
   * 处理拖拽放置
   */
  onDrop(event: CdkDragDrop<Schedule[]>): void {
    moveItemInArray(this.schedules, event.previousIndex, event.currentIndex);
    // TODO: 调用 API 更新排课位置
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
   * 时间字符串转换为分钟数
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
   * 获取课表提示文本
   */
  getScheduleTooltip(schedule: Schedule): string {
    return `${schedule.courseName}\n教师：${schedule.teacherName}\n时间：${schedule.startTime} - ${schedule.endTime}`;
  }
}
