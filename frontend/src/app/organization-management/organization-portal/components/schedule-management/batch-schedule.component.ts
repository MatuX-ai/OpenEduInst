/**
 * 批量排课组件
 *
 * @fileoverview 支持多门课程批量设置时间和教室
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Course, DayOfWeek, RepeatType } from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

@Component({
  selector: 'app-batch-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './batch-schedule.component.html',
  styleUrls: ['./batch-schedule.component.scss'],
})
export class BatchScheduleComponent implements OnInit {
  courses: Course[] = [];
  loading = false;
  stepIndex = 0;

  // 第一步：选择课程
  selectedCourseIds: number[] = [];

  // 第二步：时间设置
  formData: {
    teacherId?: number;
    classroomId?: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    startDate: string;
    repeatType: RepeatType;
    repeatWeeks?: number;
  } = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    startDate: new Date().toISOString().split('T')[0],
    repeatType: 'weekly',
    repeatWeeks: 16,
  };

  // 星期选项
  weekDays: Array<{ value: DayOfWeek; label: string }> = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 7, label: '周日' },
  ];

  // 重复类型选项
  repeatTypes: Array<{ value: RepeatType; label: string }> = [
    { value: 'none', label: '不重复' },
    { value: 'weekly', label: '每周重复' },
    { value: 'biweekly', label: '隔周重复' },
    { value: 'monthly', label: '每月重复' },
  ];

  constructor(
    private scheduleService: ScheduleManagementService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  /**
   * 加载课程列表
   */
  loadCourses(): void {
    this.loading = true;
    // STEM课程列表
    this.courses = [
      {
        id: 101,
        name: '机器人编程基础',
        code: 'ROBOT-101',
        type: 'STEM课程',
        duration: 90,
        teacherId: 1,
        teacherName: '张老师',
        studentIds: [],
        status: 'active',
        startDate: '2026-03-01',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-04-02T10:00:00Z',
      },
      {
        id: 102,
        name: 'AI人工智能入门',
        code: 'AI-101',
        type: 'STEM课程',
        duration: 60,
        teacherId: 2,
        teacherName: '李老师',
        studentIds: [],
        status: 'active',
        startDate: '2026-03-01',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-04-02T10:00:00Z',
      },
      {
        id: 103,
        name: 'Python编程进阶',
        code: 'PY-201',
        type: 'STEM课程',
        duration: 90,
        teacherId: 1,
        teacherName: '张老师',
        studentIds: [],
        status: 'active',
        startDate: '2026-03-01',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-04-02T10:00:00Z',
      },
      {
        id: 104,
        name: '科学实验探究',
        code: 'SCI-101',
        type: 'STEM课程',
        duration: 60,
        teacherId: 3,
        teacherName: '王老师',
        studentIds: [],
        status: 'active',
        startDate: '2026-03-01',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-04-02T10:00:00Z',
      },
    ];
    this.loading = false;
  }

  /**
   * 课程选择切换
   */
  onCourseToggle(courseId: number, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedCourseIds.push(courseId);
    } else {
      const index = this.selectedCourseIds.indexOf(courseId);
      if (index > -1) {
        this.selectedCourseIds.splice(index, 1);
      }
    }
  }

  /**
   * 全选
   */
  onSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedCourseIds = this.courses.map((c) => c.id);
    } else {
      this.selectedCourseIds = [];
    }
  }

  /**
   * 下一步
   */
  nextStep(): void {
    if (this.stepIndex < 1) {
      this.stepIndex++;
    }
  }

  /**
   * 上一步
   */
  previousStep(): void {
    if (this.stepIndex > 0) {
      this.stepIndex--;
    }
  }

  /**
   * 提交批量排课
   */
  onSubmit(): void {
    if (this.selectedCourseIds.length === 0) {
      alert('请至少选择一门课程');
      return;
    }

    if (!this.formData.teacherId || !this.formData.dayOfWeek) {
      alert('请填写必填项');
      return;
    }

    this.loading = true;

    // TODO: 调用批量排课 API
    setTimeout(() => {
      this.loading = false;
      alert(`成功为 ${this.selectedCourseIds.length} 门课程排课`);
      this.reset();
    }, 1000);
  }

  /**
   * 重置表单
   */
  reset(): void {
    this.stepIndex = 0;
    this.selectedCourseIds = [];
    this.formData = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      startDate: new Date().toISOString().split('T')[0],
      repeatType: 'weekly',
      repeatWeeks: 16,
    };
  }

  /**
   * 获取选中的课程数量
   */
  getSelectedCount(): number {
    return this.selectedCourseIds.length;
  }

  /**
   * 获取选中课程的教师（如果都相同）
   */
  getCommonTeacher(): string | undefined {
    const teachers = new Set(
      this.courses.filter((c) => this.selectedCourseIds.includes(c.id)).map((c) => c.teacherId)
    );
    if (teachers.size === 1) {
      const teacherId = teachers.values().next().value;
      return this.courses.find((c) => c.teacherId === teacherId)?.teacherName;
    }
    return undefined;
  }

  /**
   * 返回课表页面
   */
  goBack(): void {
    window.location.href = '/management/organization/1/schedule';
  }
}
