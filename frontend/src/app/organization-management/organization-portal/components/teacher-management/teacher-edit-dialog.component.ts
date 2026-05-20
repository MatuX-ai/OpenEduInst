/**
 * 教师编辑对话框组件
 *
 * @fileoverview 用于添加和编辑教师信息
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  CreateTeacherRequest,
  Teacher,
  TeacherStatus,
  UpdateTeacherRequest,
} from '../../models/teacher.models';
import { TeacherManagementService } from '../../services/teacher-management.service';

export interface TeacherEditDialogData {
  mode: 'create' | 'edit';
  teacher?: Teacher;
}

@Component({
  selector: 'app-teacher-edit-dialog',
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './teacher-edit-dialog.component.html',
  styleUrls: ['./teacher-edit-dialog.component.scss'],
})
export class TeacherEditDialogComponent {
  loading = false;

  formData: CreateTeacherRequest & { status?: TeacherStatus } = {
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    bio: '',
    status: 'active',
  };

  departments: string[] = [
    'STEM教研部',
    '机器人教研室',
    '编程教研室',
    '人工智能教研室',
    '创客空间',
    '科学实验部',
    '工程设计部',
    '数学思维部',
    '项目研发部',
    '课程创新部',
  ];

  statusOptions: { value: TeacherStatus; label: string }[] = [
    { value: 'active', label: '在职' },
    { value: 'inactive', label: '离职' },
    { value: 'on_leave', label: '请假' },
  ];

  constructor(
    private dialogRef: MatDialogRef<TeacherEditDialogComponent>,
    private teacherService: TeacherManagementService,
    @Inject(MAT_DIALOG_DATA) public data: TeacherEditDialogData
  ) {
    if (data.mode === 'edit' && data.teacher) {
      this.formData = {
        name: data.teacher.name,
        email: data.teacher.email,
        phone: data.teacher.phone ?? '',
        department: data.teacher.department,
        position: data.teacher.position ?? '',
        hireDate: data.teacher.hireDate ?? '',
        bio: data.teacher.bio ?? '',
        status: data.teacher.status,
      };
    }
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.department) {
      alert('请填写必填项');
      return;
    }

    this.loading = true;

    const request: CreateTeacherRequest | UpdateTeacherRequest = {
      name: this.formData.name,
      email: this.formData.email,
      phone: this.formData.phone ?? undefined,
      department: this.formData.department,
      position: this.formData.position ?? undefined,
      hireDate: this.formData.hireDate ?? undefined,
      bio: this.formData.bio ?? undefined,
    };

    if (this.data.mode === 'edit' && this.data.teacher) {
      (request as UpdateTeacherRequest).status = this.formData.status;

      this.teacherService
        .updateTeacher(this.data.teacher.id, request as UpdateTeacherRequest)
        .subscribe({
          next: (_updatedTeacher) => {
            this.dialogRef.close(request);
          },
          error: (error) => {
            console.error('更新失败:', error);
            this.loading = false;
            alert('更新失败，请重试');
          },
        });
    } else {
      this.teacherService.createTeacher(request).subscribe({
        next: (_newTeacher) => {
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
    return this.isEditMode ? '编辑教师' : '添加教师';
  }
}
