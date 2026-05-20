import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { Organization } from './organization-dashboard.service';

@Component({
  selector: 'app-organization-edit-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 matDialogTitle>
          <mat-icon>edit</mat-icon>
          编辑机构信息
        </h2>
        <button mat-icon-button matDialogClose>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="organizationForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>机构名称</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="organizationForm.get('name')?.hasError('required')">
            请输入机构名称
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>联系邮箱</mat-label>
          <input matInput formControlName="contact_email" type="email" required />
          <mat-error *ngIf="organizationForm.get('contact_email')?.hasError('required')">
            请输入联系邮箱
          </mat-error>
          <mat-error *ngIf="organizationForm.get('contact_email')?.hasError('email')">
            请输入有效的邮箱地址
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>联系电话</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>地址</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>官方网站</mat-label>
          <input matInput formControlName="website" type="url" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>最大用户数</mat-label>
          <input matInput formControlName="max_users" type="number" min="1" />
        </mat-form-field>

        <div class="dialog-actions">
          <button mat-button matDialogClose type="button">取消</button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="organizationForm.invalid || isSubmitting"
          >
            <mat-icon *ngIf="isSubmitting">hourglass_empty</mat-icon>
            <mat-icon *ngIf="!isSubmitting">save</mat-icon>
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        min-width: 500px;
        max-width: 600px;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px 0 24px;
        margin-bottom: 16px;
      }

      .dialog-header h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.5rem;
        font-weight: 500;
      }

      .dialog-form {
        padding: 0 24px 24px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .mat-form-field {
        width: 100%;
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #eee;
      }

      @media (max-width: 600px) {
        .dialog-container {
          min-width: 90vw;
        }

        .dialog-header {
          padding: 16px;
        }

        .dialog-form {
          padding: 0 16px 16px 16px;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
})
export class OrganizationEditDialogComponent {
  organizationForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrganizationEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { organization: Organization }
  ) {
    this.organizationForm = this.fb.group({
      name: [data.organization.name, [Validators.required]],
      contact_email: [data.organization.contact_email, [Validators.required, Validators.email]],
      phone: [data.organization.phone || ''],
      address: [data.organization.address || ''],
      website: [data.organization.website || ''],
      max_users: [data.organization.max_users || null, [Validators.min(1)]],
    });
  }

  onSubmit(): void {
    if (this.organizationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      // 模拟提交延迟
      setTimeout(() => {
        this.dialogRef.close(this.organizationForm.value);
        this.isSubmitting = false;
      }, 1000);
    }
  }
}
