/**
 * 调课对话框组件
 *
 * @fileoverview 用于申请调整课程时间
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

import { CreateScheduleRequest, DayOfWeek, Schedule, TimeSlot } from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

export interface ScheduleAdjustDialogData {
  schedule: Schedule;
}

@Component({
  selector: 'app-schedule-adjust-dialog',
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
  ],
  templateUrl: './schedule-adjust-dialog.component.html',
  styleUrls: ['./schedule-adjust-dialog.component.scss'],
})
export class ScheduleAdjustDialogComponent implements OnInit {
  loading = false;
  stepIndex = 0;

  // 原课程信息
  originalSchedule?: Schedule;

  // 新时间段
  formData: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    classroomId?: number;
    reason: string;
    applicant: string;
  } = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    classroomId: undefined,
    reason: '',
    applicant: '',
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

  // 冲突信息
  hasConflict = false;
  conflictMessage: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<ScheduleAdjustDialogComponent>,
    private scheduleService: ScheduleManagementService,
    @Inject(MAT_DIALOG_DATA) public data: ScheduleAdjustDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.schedule) {
      this.originalSchedule = this.data.schedule;
      this.formData = {
        dayOfWeek: this.data.schedule.dayOfWeek,
        startTime: this.data.schedule.startTime,
        endTime: this.data.schedule.endTime,
        classroomId: this.data.schedule.classroomId,
        reason: '',
        applicant: '',
      };
    }
  }

  /**
   * 下一步
   */
  nextStep(): void {
    if (this.stepIndex < 2) {
      this.stepIndex++;
      if (this.stepIndex === 2) {
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
    if (!this.originalSchedule) return;

    const request: CreateScheduleRequest = {
      courseId: this.originalSchedule.courseId,
      courseName: this.originalSchedule.courseName || '',
      teacherId: this.originalSchedule.teacherId,
      teacherName: this.originalSchedule.teacherName || '',
      classroomId: this.formData.classroomId ?? this.originalSchedule.classroomId,
      studentIds: this.originalSchedule.studentIds,
      dayOfWeek: this.formData.dayOfWeek,
      startTime: this.formData.startTime,
      endTime: this.formData.endTime,
      startDate: this.originalSchedule.startDate,
      repeatType: this.originalSchedule.repeatType,
      repeatWeeks: this.originalSchedule.repeatWeeks,
    };

    const conflict = this.scheduleService.checkConflict(request);
    this.hasConflict = conflict.hasConflict;
    this.conflictMessage = conflict.message ?? null;
  }

  onSubmit(): void {
    if (!this.originalSchedule) return;

    if (!this.formData.reason || !this.formData.applicant) {
      alert('请填写必填项');
      return;
    }

    if (this.hasConflict) {
      if (!confirm('存在时间冲突，仍要继续申请吗？')) {
        return;
      }
    }

    this.loading = true;

    const adjustRequest = {
      scheduleId: this.originalSchedule.id,
      newTimeSlot: {
        dayOfWeek: this.formData.dayOfWeek,
        startTime: this.formData.startTime,
        endTime: this.formData.endTime,
        classroomId: this.formData.classroomId,
      } as TimeSlot,
      newClassroomId: this.formData.classroomId,
      reason: this.formData.reason,
      applicant: this.formData.applicant,
    };

    this.scheduleService.adjustSchedule(adjustRequest).subscribe({
      next: () => {
        this.dialogRef.close(adjustRequest);
      },
      error: (error) => {
        console.error('调课申请失败:', error);
        this.loading = false;
        alert('申请失败，请重试');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * 获取原始时间显示
   */
  getOriginalTimeInfo(): string {
    if (!this.originalSchedule) return '';
    const dayLabel =
      this.weekDays.find((d) => d.value === this.originalSchedule?.dayOfWeek)?.label ?? '';
    return `${dayLabel} ${this.originalSchedule.startTime} - ${this.originalSchedule.endTime}`;
  }

  /**
   * 获取新时间显示
   */
  getNewTimeInfo(): string {
    const dayLabel = this.weekDays.find((d) => d.value === this.formData.dayOfWeek)?.label ?? '';
    return `${dayLabel} ${this.formData.startTime} - ${this.formData.endTime}`;
  }
}
