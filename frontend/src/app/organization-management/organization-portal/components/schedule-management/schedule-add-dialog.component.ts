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
    this.scheduleService.getCourses().subscribe((courses) => {
      this.courses = courses;
    });

    this.scheduleService.getClassrooms().subscribe((classrooms) => {
      this.classrooms = classrooms;
    });
  }

  /**
   * 课程选择变化时，自动填充课程名称和教师信息
   */
  onCourseChange(): void {
    const selectedCourse = this.getSelectedCourse();
    if (selectedCourse) {
      this.formData.courseName = selectedCourse.name;
      this.formData.teacherId = selectedCourse.teacherId;
      this.formData.teacherName = selectedCourse.teacherName;
      // 同步课程的学员列表
      this.formData.studentIds = [...(selectedCourse.studentIds || [])];
    } else {
      this.formData.courseName = '';
      this.formData.teacherId = 0;
      this.formData.teacherName = '';
    }
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

    if (this.data.mode === 'edit' && this.data.schedule) {
      const updateRequest: UpdateScheduleRequest = {
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
        status: this.formData.status,
      };

      this.scheduleService.updateSchedule(this.data.schedule.id, updateRequest).subscribe({
        next: () => {
          this.dialogRef.close(updateRequest);
        },
        error: (error) => {
          console.error('更新失败:', error);
          this.loading = false;
          alert('更新失败，请重试');
        },
      });
    } else {
      const createRequest: CreateScheduleRequest = {
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

      this.scheduleService.createSchedule(createRequest).subscribe({
        next: () => {
          this.dialogRef.close(createRequest);
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
   * 获取选中教室名称
   */
  getSelectedClassroomName(): string {
    const classroom = this.classrooms.find((c) => c.id === this.formData.classroomId);
    return classroom ? classroom.name : '未选择';
  }

  /**
   * 获取选中星期标签
   */
  getSelectedDayLabel(): string {
    const day = this.weekDays.find((d) => d.value === this.formData.dayOfWeek);
    return day ? day.label : '';
  }

  /**
   * 获取选中重复类型标签
   */
  getSelectedRepeatLabel(): string {
    const type = this.repeatTypes.find((r) => r.value === this.formData.repeatType);
    return type ? type.label : '';
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
