/**
 * 学员编辑对话框组件
 *
 * @fileoverview 用于添加和编辑学员信息
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
  CreateStudentRequest,
  Student,
  StudentStatus,
  UpdateStudentRequest,
} from '../../models/student.models';
import { StudentManagementService } from '../../services/student-management.service';

export interface StudentEditDialogData {
  mode: 'create' | 'edit';
  student?: Student;
}

@Component({
  selector: 'app-student-edit-dialog',
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
  templateUrl: './student-edit-dialog.component.html',
  styleUrls: ['./student-edit-dialog.component.scss'],
})
export class StudentEditDialogComponent {
  loading = false;

  formData: CreateStudentRequest & { status?: StudentStatus } = {
    name: '',
    email: '',
    phone: '',
    grade: '',
    parentInfo: undefined,
    enrollmentDate: '',
    status: 'active',
  };

  // 家长关系选项
  relationshipOptions: string[] = [
    '父子',
    '母子',
    '父女',
    '母女',
    '祖父',
    '祖母',
    '外祖父',
    '外祖母',
    '其他监护人',
  ];

  // 年级选项
  gradeOptions: string[] = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  // 状态选项
  statusOptions: { value: StudentStatus; label: string }[] = [
    { value: 'active', label: '在读' },
    { value: 'inactive', label: '休学' },
    { value: 'graduated', label: '已毕业' },
    { value: 'suspended', label: '暂停' },
    { value: 'transferred', label: '已转学' },
  ];

  constructor(
    private dialogRef: MatDialogRef<StudentEditDialogComponent>,
    private studentService: StudentManagementService,
    @Inject(MAT_DIALOG_DATA) public data: StudentEditDialogData
  ) {
    if (data.mode === 'edit' && data.student) {
      this.formData = {
        name: data.student.name,
        email: data.student.email,
        phone: data.student.phone ?? '',
        grade: data.student.grade,
        parentInfo: data.student.parentInfo,
        enrollmentDate: data.student.enrollmentDate ?? '',
        status: data.student.status,
      };
    }
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.grade) {
      alert('请填写必填项');
      return;
    }

    this.loading = true;

    const request: CreateStudentRequest | UpdateStudentRequest = {
      name: this.formData.name,
      email: this.formData.email,
      phone: this.formData.phone ?? undefined,
      grade: this.formData.grade,
      parentInfo: this.formData.parentInfo,
      enrollmentDate: this.formData.enrollmentDate ?? undefined,
    };

    if (this.data.mode === 'edit' && this.data.student) {
      (request as UpdateStudentRequest).status = this.formData.status;

      this.studentService
        .updateStudent(this.data.student.id, request as UpdateStudentRequest)
        .subscribe({
          next: (_updatedStudent) => {
            this.dialogRef.close(request);
          },
          error: (error) => {
            console.error('更新失败:', error);
            this.loading = false;
            alert('更新失败，请重试');
          },
        });
    } else {
      this.studentService.createStudent(request as CreateStudentRequest).subscribe({
        next: (_newStudent) => {
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
    return this.isEditMode ? '编辑学员' : '添加学员';
  }

  /**
   * 添加家长信息
   */
  onAddParentInfo(): void {
    if (!this.formData.parentInfo) {
      this.formData.parentInfo = {
        name: '',
        phone: '',
        relationship: '父子',
      };
    }
  }

  /**
   * 移除家长信息
   */
  onRemoveParentInfo(): void {
    this.formData.parentInfo = undefined;
  }
}
