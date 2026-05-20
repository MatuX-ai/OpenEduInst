/**
 * 排课统计卡片组件
 *
 * @fileoverview 展示排课统计数据和使用率分析
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import {
  ClassroomUsageStats,
  ScheduleStats,
  TeacherHoursStats,
} from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

@Component({
  selector: 'app-schedule-stats-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './schedule-stats-card.component.html',
  styleUrls: ['./schedule-stats-card.component.scss'],
})
export class ScheduleStatsCardComponent implements OnInit {
  @Input() stats?: ScheduleStats;
  loading = false;

  // 统计数据
  scheduleStats?: ScheduleStats;
  classroomUsageStats: ClassroomUsageStats[] = [];
  teacherHoursStats: TeacherHoursStats[] = [];

  // 时间范围筛选
  timeRange: 'week' | 'month' | 'all' = 'week';

  constructor(private scheduleService: ScheduleManagementService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  /**
   * 加载统计数据
   */
  loadStats(): void {
    this.loading = true;

    // 获取总体统计
    this.scheduleService.getScheduleStats().subscribe({
      next: (stats) => {
        this.scheduleStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('加载统计数据失败:', error);
        this.loading = false;
      },
    });

    // 获取教室使用率
    this.scheduleService.getClassroomUsageStats().subscribe({
      next: (stats) => {
        this.classroomUsageStats = stats;
      },
      error: (error) => {
        console.error('加载教室使用率失败:', error);
      },
    });

    // 获取教师课时统计
    this.scheduleService.getTeacherHoursStats().subscribe({
      next: (stats) => {
        this.teacherHoursStats = stats;
      },
      error: (error) => {
        console.error('加载教师课时统计失败:', error);
      },
    });
  }

  /**
   * 时间范围变化
   */
  onTimeRangeChange(): void {
    // TODO: 根据时间范围重新加载数据
    this.loadStats();
  }

  /**
   * 导出 Excel
   */
  onExportExcel(): void {
    // TODO: 调用导出功能
    alert('导出 Excel 功能待实现');
  }

  /**
   * 打印课表
   */
  onPrint(): void {
    window.print();
  }

  /**
   * 获取进度条颜色
   */
  getProgressColor(rate: number): string {
    if (rate >= 80) return 'accent';
    if (rate >= 60) return 'primary';
    return 'warn';
  }
}
