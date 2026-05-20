/**
 * 教师统计卡片组件
 *
 * @fileoverview 展示教师统计数据
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TeacherStats } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-stats-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './teacher-stats-card.component.html',
  styleUrls: ['./teacher-stats-card.component.scss'],
})
export class TeacherStatsCardComponent implements OnChanges {
  @Input() stats?: TeacherStats;
  @Input() loading = false;

  displayedStats: Array<{
    title: string;
    value: number | string;
    icon: string;
    color: string;
    gradient: string;
  }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateDisplayedStats();
    }
  }

  private updateDisplayedStats(): void {
    if (!this.stats) return;

    this.displayedStats = [
      {
        title: '总教师数',
        value: this.stats.totalTeachers,
        icon: 'school',
        color: 'primary',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        title: '在职教师',
        value: this.stats.activeTeachers,
        icon: 'person',
        color: 'accent',
        gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
      },
      {
        title: '请假教师',
        value: this.stats.onLeaveTeachers,
        icon: 'event_busy',
        color: 'warn',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      {
        title: '平均评分',
        value: this.stats.averageRating.toFixed(1),
        icon: 'star',
        color: '#ffc107',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      {
        title: '总课程数',
        value: this.stats.totalCourses,
        icon: 'menu_book',
        color: '#4facfe',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      {
        title: '总学生数',
        value: this.stats.totalStudents,
        icon: 'groups',
        color: '#43e97b',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      },
    ];
  }
}
