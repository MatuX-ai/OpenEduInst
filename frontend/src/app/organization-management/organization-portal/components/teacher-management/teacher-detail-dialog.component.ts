/**
 * 教师详情对话框组件
 *
 * @fileoverview 展示教师详细信息和统计数据
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

import { TeacherDetail } from '../../models/teacher.models';
import { TeacherManagementService } from '../../services/teacher-management.service';

export interface TeacherDetailDialogData {
  teacherId: number;
}

@Component({
  selector: 'app-teacher-detail-dialog',
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
  templateUrl: './teacher-detail-dialog.component.html',
  styleUrls: ['./teacher-detail-dialog.component.scss'],
})
export class TeacherDetailDialogComponent implements OnInit {
  loading = false;
  teacher?: TeacherDetail;

  displayedColumns: string[] = ['courseName', 'scheduleTime', 'duration', 'studentCount'];

  constructor(
    private dialogRef: MatDialogRef<TeacherDetailDialogComponent>,
    private teacherService: TeacherManagementService,
    @Inject(MAT_DIALOG_DATA) public data: TeacherDetailDialogData
  ) {}

  ngOnInit(): void {
    this.loadTeacherDetail();
  }

  loadTeacherDetail(): void {
    this.loading = true;
    this.teacherService.getTeacherById(this.data.teacherId).subscribe({
      next: (detail: TeacherDetail) => {
        this.teacher = detail;
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('加载教师详情失败:', error);
        this.loading = false;
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getRatingStars(rating?: number): number[] {
    if (!rating) return [];
    return Array(Math.floor(rating)).fill(0) as number[];
  }
}
