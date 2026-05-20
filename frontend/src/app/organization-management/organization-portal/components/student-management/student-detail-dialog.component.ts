/**
 * 学员详情对话框组件
 *
 * @fileoverview 展示学员详细信息和学习轨迹
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import {
  AttendanceRecord,
  EnrolledCourse,
  PaymentRecord,
  StudentDetail,
  StudentStatus,
} from '../../models/student.models';
import { StudentManagementService } from '../../services/student-management.service';

export interface StudentDetailDialogData {
  studentId: number;
}

@Component({
  selector: 'app-student-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatProgressBarModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatTableModule,
  ],
  templateUrl: './student-detail-dialog.component.html',
  styleUrls: ['./student-detail-dialog.component.scss'],
})
export class StudentDetailDialogComponent implements OnInit {
  loading = false;
  student?: StudentDetail;

  // Tab 列定义
  displayedColumns: string[] = ['courseName', 'scheduleTime', 'duration', 'studentCount'];

  constructor(
    private dialogRef: MatDialogRef<StudentDetailDialogComponent>,
    private studentService: StudentManagementService,
    @Inject(MAT_DIALOG_DATA) public data: StudentDetailDialogData
  ) {}

  ngOnInit(): void {
    this.loadStudentDetail();
  }

  loadStudentDetail(): void {
    this.loading = true;
    this.studentService.getStudentDetail(this.data.studentId).subscribe({
      next: (detail) => {
        this.student = detail;
        this.loading = false;
      },
      error: (error) => {
        console.error('加载学员详情失败:', error);
        this.loading = false;
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getRatingStars(rating?: number): number[] {
    if (!rating) return [];
    const length = Math.floor(rating);
    return Array.from({ length }, (_, i) => (i < length ? 0 : 0));
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  getStatusChipColor(status: StudentStatus): string {
    switch (status) {
      case 'active':
        return 'primary';
      case 'inactive':
        return 'warn';
      case 'graduated':
        return 'accent';
      case 'suspended':
        return '';
      case 'transferred':
        return '';
      default:
        return '';
    }
  }

  getStatusChipLabel(status: StudentStatus): string {
    const labels: Record<StudentStatus, string> = {
      active: '在读',
      inactive: '休学',
      graduated: '已毕业',
      suspended: '暂停',
      transferred: '已转学',
    };
    return labels[status];
  }

  getAttendanceStatusColor(status: AttendanceRecord['status']): string {
    switch (status) {
      case 'present':
        return 'primary';
      case 'absent':
        return 'warn';
      case 'late':
        return 'accent';
      case 'excused':
        return '';
      default:
        return '';
    }
  }

  getAttendanceStatusLabel(status: AttendanceRecord['status']): string {
    const labels: Record<AttendanceRecord['status'], string> = {
      present: '出勤',
      absent: '缺勤',
      late: '迟到',
      excused: '请假',
    };
    return labels[status];
  }

  getPaymentStatusColor(status: PaymentRecord['status']): string {
    switch (status) {
      case 'paid':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'overdue':
        return 'warn';
      default:
        return '';
    }
  }

  getPaymentStatusLabel(status: PaymentRecord['status']): string {
    const labels: Record<PaymentRecord['status'], string> = {
      paid: '已缴费',
      pending: '待缴费',
      overdue: '逾期',
    };
    return labels[status];
  }

  getCourseStatusColor(status: EnrolledCourse['courseStatus']): string {
    switch (status) {
      case 'ongoing':
        return 'primary';
      case 'completed':
        return 'accent';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  getCourseStatusLabel(status: EnrolledCourse['courseStatus']): string {
    const labels: Record<EnrolledCourse['courseStatus'], string> = {
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  }
}
