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

import { StudentService } from '../../../../core/services/student.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { Student } from '../../../../models/education-management.models';

type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped_out' | 'suspended' | 'transferred';

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

  formData: Partial<Student> = {
    name: '',
    email: '',
    phone: '',
    grade_level: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: '',
    enrollment_date: new Date().toISOString(),
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

  constructor(
    private dialogRef: MatDialogRef<StudentEditDialogComponent>,
    private studentService: StudentService,
    private orgContext: OrganizationContextService,
    @Inject(MAT_DIALOG_DATA) public data: StudentEditDialogData
  ) {
    if (data.mode === 'edit' && data.student) {
      this.formData = { ...data.student };
    }
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.grade_level) {
      alert('请填写必填项');
      return;
    }

    this.loading = true;
    const orgId = this.orgContext.currentContext?.id;
    if (!orgId) {
      alert('未找到机构信息');
      this.loading = false;
      return;
    }

    if (this.data.mode === 'edit' && this.data.student) {
      this.studentService
        .updateStudent(this.data.student.id, this.formData)
        .subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('更新失败:', error);
            this.loading = false;
            alert('更新失败，请重试');
          },
        });
    } else {
      this.studentService.createStudent(orgId, this.formData).subscribe({
        next: () => {
          this.dialogRef.close(true);
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
   * 添加监护人信息
   */
  onAddParentInfo(): void {
    if (!this.formData.guardian_name) {
      this.formData.guardian_name = '';
      this.formData.guardian_phone = '';
      this.formData.guardian_relationship = '父子';
    }
  }

  /**
   * 移除监护人信息
   */
  onRemoveParentInfo(): void {
    this.formData.guardian_name = undefined;
    this.formData.guardian_phone = undefined;
    this.formData.guardian_relationship = undefined;
  }
}
