/**
 * 角色创建/编辑对话框组件
 *
 * @fileoverview 提供角色信息表单和权限配置集成
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  CreateRoleRequest,
  DataScopeType,
  Permission,
  Role,
  UpdateRoleRequest,
} from '../../models/role-permission.models';
import { RolePermissionService } from '../../services/role-permission.service';

import {
  PermissionConfigDialogComponent,
  PermissionConfigDialogData,
} from './permission-config-dialog.component';

export interface RoleEditDialogData {
  role?: Role;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-role-edit-dialog',
  template: `
    <div class="role-edit-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.mode === 'create' ? 'add_circle' : 'edit' }}</mat-icon>
        {{ data.mode === 'create' ? '创建角色' : '编辑角色' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <!-- 基本信息 -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                基本信息
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>角色名称 <span class="required">*</span></mat-label>
                  <input
                    matInput
                    formControlName="name"
                    placeholder="如：校长、教务主任"
                    required
                  />
                  <mat-error *ngIf="form.get('name')?.hasError('required')">角色名称必填</mat-error>
                  <mat-hint align="end">{{ form.get('name')?.value?.length || 0 }}/50</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>角色代码 <span class="required">*</span></mat-label>
                  <input
                    matInput
                    formControlName="code"
                    placeholder="如：principal、teacher"
                    required
                  />
                  <mat-error *ngIf="form.get('code')?.hasError('required')">角色代码必填</mat-error>
                  <mat-error *ngIf="form.get('code')?.hasError('pattern')"
                    >只能包含字母、数字和下划线</mat-error
                  >
                  <mat-hint>英文小写字母、数字和下划线，用于系统识别</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>角色描述</mat-label>
                  <textarea
                    matInput
                    formControlName="description"
                    rows="3"
                    placeholder="简要描述该角色的职责和权限范围"
                  ></textarea>
                  <mat-hint align="end"
                    >{{ form.get('description')?.value?.length || 0 }}/200</mat-hint
                  >
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>数据权限范围 <span class="required">*</span></mat-label>
                  <mat-select formControlName="dataScope" required>
                    <mat-option value="all">全部数据</mat-option>
                    <mat-option value="department">本部门及以下</mat-option>
                    <mat-option value="self">仅本人数据</mat-option>
                    <mat-option value="custom">自定义范围</mat-option>
                  </mat-select>
                  <mat-error *ngIf="form.get('dataScope')?.hasError('required')"
                    >数据权限范围必选</mat-error
                  >
                  <mat-hint>定义该角色可以访问的数据范围</mat-hint>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- 权限配置 -->
          <mat-card class="permissions-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>vpn_key</mat-icon>
                权限配置
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="permission-summary">
                <div class="summary-item">
                  <span class="label">已选权限：</span>
                  <span class="value highlight">{{ selectedPermissions.length }}</span>
                  <span class="label">个</span>
                </div>
                <div class="summary-item">
                  <span class="label">覆盖模块：</span>
                  <span class="value">{{ getCoveredModules() }}</span>
                </div>
              </div>

              <button
                mat-stroked-button
                type="button"
                (click)="openPermissionConfig()"
                color="primary"
                class="config-btn"
              >
                <mat-icon>settings</mat-icon>
                配置权限
              </button>

              <!-- 已选权限预览 -->
              <div class="selected-permissions" *ngIf="selectedPermissions.length > 0">
                <h4>已选权限预览：</h4>
                <div class="permission-tags">
                  @for (perm of displayedPermissions; track perm.id) {
                    <mat-chip [removable]="true" (removed)="removePermission(perm.id)">
                      {{ perm.name }}
                      <mat-icon matChipRemove>cancel</mat-icon>
                    </mat-chip>
                  }
                  <mat-chip *ngIf="selectedPermissions.length > 10" class="more-chip">
                    +{{ selectedPermissions.length - 10 }}
                  </mat-chip>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()" [disabled]="submitting">
            取消
          </button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || submitting"
          >
            <mat-icon *ngIf="submitting">hourglass_empty</mat-icon>
            <mat-icon *ngIf="!submitting">check</mat-icon>
            {{ submitting ? '提交中...' : data.mode === 'create' ? '创建' : '保存' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      .role-edit-dialog {
        min-width: 700px;
        max-width: 900px;
      }

      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 600;
        color: $color-text-primary;
        margin-bottom: 16px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: $color-primary;
        }
      }

      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 16px 0;
      }

      .info-card,
      .permissions-card {
        border-radius: 8px;
        box-shadow: $shadow-sm;
      }

      mat-card-header {
        padding: 12px 16px !important;
        border-bottom: 1px solid $color-bg-primary;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: $color-warning;
          }
        }
      }

      mat-card-content {
        padding: 16px !important;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .full-width {
          grid-column: 1 / -1;
        }
      }

      .required {
        color: $color-error;
        margin-left: 4px;
      }

      .permission-summary {
        display: flex;
        gap: 24px;
        padding: 16px;
        background-color: $color-bg-primary;
        border-radius: 8px;
        margin-bottom: 16px;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .label {
            font-size: 14px;
            color: $color-text-secondary;
          }

          .value {
            font-size: 20px;
            font-weight: bold;
            color: $color-text-primary;

            &.highlight {
              color: $color-primary;
            }
          }
        }
      }

      .config-btn {
        width: 100%;
        padding: 12px;
        font-size: 15px;
        margin-bottom: 16px;
      }

      .selected-permissions {
        h4 {
          font-size: 14px;
          color: $color-text-secondary;
          margin: 0 0 12px 0;
          font-weight: normal;
        }

        .permission-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          mat-chip {
            height: 28px;
            font-size: 13px;
            background-color: rgba($color-primary, 0.08);
            color: $color-primary;
          }

          .more-chip {
            background-color: $color-bg-primary;
            color: $color-text-muted;
          }
        }
      }

      /* 响应式调整 */
      @media (max-width: 768px) {
        .role-edit-dialog {
          min-width: 100%;
          max-width: 100%;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
})
export class RoleEditDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  submitting = false;
  selectedPermissions: Permission[] = [];
  displayedPermissions: Permission[] = [];

  constructor(
    public dialogRef: MatDialogRef<RoleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleEditDialogData,
    private fb: FormBuilder,
    private roleService: RolePermissionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.data.mode === 'edit' && this.data.role) {
      this.loadExistingRole();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable @typescript-eslint/unbound-method */
  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      code: [
        '',
        [Validators.required, Validators.pattern(/^[a-z0-9_]+$/), Validators.maxLength(50)],
      ],
      description: ['', [Validators.maxLength(200)]],
      dataScope: ['self', [Validators.required]],
    });
  }
  /* eslint-enable @typescript-eslint/unbound-method */

  loadExistingRole(): void {
    if (!this.data.role) return;
    const role = this.data.role;
    this.form.patchValue({
      name: role.name,
      code: role.code,
      description: role.description,
      dataScope: role.dataScope,
    });
    this.selectedPermissions = [...role.permissions];
    this.updateDisplayedPermissions();
  }

  openPermissionConfig(): void {
    const permissionIds = this.selectedPermissions.map((p) => p.id);

    const dialogRef = this.roleService['dialog'].open(PermissionConfigDialogComponent, {
      data: {
        selectedPermissionIds: permissionIds,
        title: '为角色配置权限',
      } as PermissionConfigDialogData,
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result: number[] | undefined) => {
      if (result && Array.isArray(result)) {
        // 更新选中的权限
        this.updateSelectedPermissions(result);
      }
    });
  }

  updateSelectedPermissions(newPermissionIds: number[]): void {
    // 获取完整的权限对象
    this.roleService
      .getAllPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((allPermissions) => {
        const findPermission = (id: number): Permission | null => {
          for (const p of allPermissions) {
            if (p.id === id) return p;
            if (p.children) {
              const child = p.children.find((c) => c.id === id);
              if (child) return child;
            }
          }
          return null;
        };

        this.selectedPermissions = newPermissionIds
          .map((id) => findPermission(id))
          .filter((p): p is Permission => p !== null);

        this.updateDisplayedPermissions();
        this.snackBar.open(`已选择 ${this.selectedPermissions.length} 个权限`, '关闭', {
          duration: 2000,
        });
      });
  }

  removePermission(permissionId: number): void {
    this.selectedPermissions = this.selectedPermissions.filter(
      (p: Permission) => p.id !== permissionId
    );
    this.updateDisplayedPermissions();
  }

  updateDisplayedPermissions(): void {
    // 只显示前 10 个权限
    this.displayedPermissions = this.selectedPermissions.slice(0, 10);
  }

  getCoveredModules(): string {
    const modules = new Set(this.selectedPermissions.map((p: Permission) => p.module));
    const moduleNames = {
      teacher: '教师',
      student: '学员',
      schedule: '排课',
      finance: '财务',
      classroom: '教室',
      wechat: '微信',
      system: '系统',
    };
    return Array.from(modules)
      .map((m) => moduleNames[m as keyof typeof moduleNames] || m)
      .join('、');
  }

  /**
   * 创建角色
   */
  private createRole(
    permissionIds: number[],
    formValue: {
      name: string;
      code: string;
      description: string;
      dataScope: DataScopeType;
    }
  ): void {
    const request: CreateRoleRequest = {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description,
      permissionIds,
      dataScope: formValue.dataScope,
    };

    this.roleService
      .createRole(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('角色创建成功', '关闭', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('角色创建失败', '关闭', { duration: 3000 });
          this.submitting = false;
        },
      });
  }

  /**
   * 更新角色
   */
  private updateRole(
    roleId: number,
    permissionIds: number[],
    formValue: {
      name: string;
      code: string;
      description: string;
      dataScope: DataScopeType;
    }
  ): void {
    const request: UpdateRoleRequest = {
      name: formValue.name,
      description: formValue.description,
      permissionIds,
      dataScope: formValue.dataScope,
    };

    this.roleService
      .updateRole(roleId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('角色更新成功', '关闭', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('角色更新失败', '关闭', { duration: 3000 });
          this.submitting = false;
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.selectedPermissions.length === 0) {
      this.snackBar.open('请填写完整信息并至少选择一个权限', '关闭', { duration: 3000 });
      return;
    }

    this.submitting = true;

    const permissionIds = this.selectedPermissions.map((p: Permission) => p.id);
    const formValue = this.form.getRawValue() as {
      name: string;
      code: string;
      description: string;
      dataScope: DataScopeType;
    };

    if (this.data.mode === 'create') {
      this.createRole(permissionIds, formValue);
    } else if (this.data.role) {
      this.updateRole(this.data.role.id, permissionIds, formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
