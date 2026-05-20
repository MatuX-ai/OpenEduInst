/**
 * 添加课程对话框组件
 *
 * @fileoverview 用于添加和编辑排课记录
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

import {
  Classroom,
  Course,
  CreateScheduleRequest,
  DayOfWeek,
  RepeatType,
  Schedule,
  UpdateScheduleRequest,
} from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

export interface ScheduleEditDialogData {
  mode: 'create' | 'edit';
  schedule?: Schedule;
}

@Component({
  selector: 'app-schedule-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatProgressBarModule,
    MatStepperModule,
    MatCheckboxModule,
  ],
  templateUrl: './schedule-add-dialog.component.html',
  styleUrls: ['./schedule-add-dialog.component.scss'],
})
export class ScheduleAddDialogComponent implements OnInit {
  loading = false;
  stepIndex = 0;

  formData: CreateScheduleRequest & { status?: Schedule['status'] } = {
    courseId: 0,
    courseName: '',
    teacherId: 0,
    teacherName: '',
    classroomId: undefined,
    studentIds: [],
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    startDate: new Date().toISOString().split('T')[0],
    repeatType: 'weekly',
    repeatWeeks: 16,
    notes: '',
  };

  // 选项数据
  courses: Course[] = [];
  classrooms: Classroom[] = [];
  weekDays: Array<{ value: DayOfWeek; label: string }> = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 7, label: '周日' },
  ];

  repeatTypes: Array<{ value: RepeatType; label: string }> = [
    { value: 'none', label: '不重复' },
    { value: 'weekly', label: '每周重复' },
    { value: 'biweekly', label: '隔周重复' },
    { value: 'monthly', label: '每月重复' },
  ];

  // 冲突信息
  conflictMessage: string | null = null;
  hasConflict = false;

  constructor(
    private dialogRef: MatDialogRef<ScheduleAddDialogComponent>,
    private scheduleService: ScheduleManagementService,
    @Inject(MAT_DIALOG_DATA) public data: ScheduleEditDialogData
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    if (this.data.mode === 'edit' && this.data.schedule) {
      this.formData = {
        courseId: this.data.schedule.courseId,
        courseName: this.data.schedule.courseName || '',
        teacherId: this.data.schedule.teacherId,
        teacherName: this.data.schedule.teacherName || '',
        classroomId: this.data.schedule.classroomId,
        studentIds: this.data.schedule.studentIds,
        dayOfWeek: this.data.schedule.dayOfWeek,
        startTime: this.data.schedule.startTime,
        endTime: this.data.schedule.endTime,
        startDate: this.data.schedule.startDate,
        repeatType: this.data.schedule.repeatType,
        repeatWeeks: this.data.schedule.repeatWeeks,
        notes: this.data.schedule.notes ?? '',
        status: this.data.schedule.status,
      };
    }
  }

  /**
   * 加载选项数据
   */
  loadOptions(): void {
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
    ];

    this.classrooms = [
      {
        id: 1,
        name: 'A101',
        capacity: 30,
        isAvailable: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-04-02T10:00:00Z',
      },
    ];
  }

  /**
   * 下一步
   */
  nextStep(): void {
    if (this.stepIndex < 3) {
      this.stepIndex++;
      if (this.stepIndex === 3) {
        this.checkConflict();
      }
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
   * 检测冲突
   */
  checkConflict(): void {
    const request: CreateScheduleRequest = {
      courseId: this.formData.courseId,
      courseName: this.formData.courseName,
      teacherId: this.formData.teacherId,
      teacherName: this.formData.teacherName,
      classroomId: this.formData.classroomId,
      studentIds: this.formData.studentIds,
      dayOfWeek: this.formData.dayOfWeek,
      startTime: this.formData.startTime,
      endTime: this.formData.endTime,
      startDate: this.formData.startDate,
      repeatType: this.formData.repeatType,
      repeatWeeks: this.formData.repeatWeeks,
      notes: this.formData.notes,
    };

    const conflict = this.scheduleService.checkConflict(request);
    this.hasConflict = conflict.hasConflict;
    this.conflictMessage = conflict.message ?? null;
  }

  onSubmit(): void {
    if (this.hasConflict) {
      alert('存在时间冲突，请调整后重试');
      return;
    }

    if (!this.formData.courseId || !this.formData.teacherId || !this.formData.dayOfWeek) {
      alert('请填写必填项');
      return;
    }

    this.loading = true;

    const request: CreateScheduleRequest | UpdateScheduleRequest = {
      courseId: this.formData.courseId,
      teacherId: this.formData.teacherId,
      classroomId: this.formData.classroomId,
      studentIds: this.formData.studentIds,
      dayOfWeek: this.formData.dayOfWeek,
      startTime: this.formData.startTime,
      endTime: this.formData.endTime,
      startDate: this.formData.startDate,
      repeatType: this.formData.repeatType,
      repeatWeeks: this.formData.repeatWeeks,
      notes: this.formData.notes,
    };

    if (this.data.mode === 'edit' && this.data.schedule) {
      request.status = this.formData.status;

      this.scheduleService.updateSchedule(this.data.schedule.id, request).subscribe({
        next: () => {
          this.dialogRef.close(request);
        },
        error: (error) => {
          console.error('更新失败:', error);
          this.loading = false;
          alert('更新失败，请重试');
        },
      });
    } else {
      this.scheduleService.createSchedule(request as CreateScheduleRequest).subscribe({
        next: () => {
          this.dialogRef.close(request);
        },
        error: (error) => {
          console.error('创建失败:', error);
          this.loading = false;
          alert('创建失败，请重试');
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEditMode ? '编辑排课' : '添加排课';
  }

  /**
   * 获取选中课程
   */
  getSelectedCourse(): Course | undefined {
    return this.courses.find((c) => c.id === this.formData.courseId);
  }

  /**
   * 学生选择切换
   */
  onStudentToggle(studentId: number, event: { checked: boolean }): void {
    if (event.checked) {
      this.formData.studentIds.push(studentId);
    } else {
      const index = this.formData.studentIds.indexOf(studentId);
      if (index > -1) {
        this.formData.studentIds.splice(index, 1);
      }
    }
  }
}
