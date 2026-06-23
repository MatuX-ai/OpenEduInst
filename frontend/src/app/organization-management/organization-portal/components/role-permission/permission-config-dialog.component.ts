/**
 * 权限配置对话框组件
 *
 * @fileoverview 提供树形权限选择器，支持按模块筛选、全选/取消全选
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTreeModule } from '@angular/material/tree';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Permission } from '../../models/role-permission.models';
import { RolePermissionService } from '../../services/role-permission.service';

export interface PermissionConfigDialogData {
  roleId?: number;
  selectedPermissionIds: number[];
  title?: string;
}

@Component({
  selector: 'app-permission-config-dialog',
  template: `
    <div class="permission-config-dialog">
      <h2 mat-dialog-title>
        <mat-icon>vpn_key</mat-icon>
        {{ data.title || '权限配置' }}
      </h2>

      <mat-dialog-content>
        <!-- 筛选工具栏 -->
        <div class="filter-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>搜索权限</mat-label>
            <input
              matInput
              [(ngModel)]="searchKeyword"
              (input)="applyFilter()"
              placeholder="权限名称或代码"
            />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>模块筛选</mat-label>
            <mat-select [(ngModel)]="selectedModule" (selectionChange)="applyFilter()">
              <mat-option value="">全部模块</mat-option>
              @for (module of modules; track module) {
                <mat-option [value]="module.code">{{ module.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="actions">
            <button mat-stroked-button (click)="selectAll()">
              <mat-icon>check_box</mat-icon>
              全选
            </button>
            <button mat-stroked-button (click)="deselectAll()">
              <mat-icon>indeterminate_check_box</mat-icon>
              取消全选
            </button>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-bar">
          <span
            >已选 <strong>{{ selectedCount }}</strong> 个权限</span
          >
          <span class="divider">|</span>
          <span
            >共 <strong>{{ totalPermissions }}</strong> 个权限</span
          >
        </div>

        <!-- 加载状态 -->
        <div class="loading-container" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>正在加载权限树...</p>
        </div>

        <!-- 权限树 -->
        <div class="permission-tree-container" *ngIf="!loading">
          @for (module of filteredPermissions; track module.code) {
            <mat-card class="module-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-checkbox
                    [checked]="isModuleChecked(module)"
                    [indeterminate]="isModuleIndeterminate(module)"
                    (change)="onModuleToggle(module, $event)"
                  >
                    <mat-icon>folder</mat-icon>
                    {{ module.name }}
                  </mat-checkbox>
                  <span class="permission-count">{{ getModulePermissionCount(module) }}个权限</span>
                </mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <div class="permission-list">
                  @for (perm of module.children; track perm.id) {
                    <div class="permission-item">
                      <mat-checkbox
                        [checked]="isSelected(perm.id)"
                        (change)="onPermissionToggle(perm.id, $event)"
                      >
                        <span class="permission-name">{{ perm.name }}</span>
                        <span class="permission-code">{{ perm.code }}</span>
                        <mat-chip *ngIf="perm.type === 'api'">
                          <mat-icon>api</mat-icon>
                          API
                        </mat-chip>
                      </mat-checkbox>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- 空状态 -->
        <div class="empty-state" *ngIf="!loading && filteredPermissions.length === 0">
          <mat-icon>search_off</mat-icon>
          <p>没有找到匹配的权限</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">取消</button>
        <button mat-button color="primary" (click)="onConfirm()" [disabled]="selectedCount === 0">
          <mat-icon>check</mat-icon>
          确定（{{ selectedCount }}）
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      .permission-config-dialog {
        min-width: 800px;
        max-width: 1200px;
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

      .filter-toolbar {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        padding: 16px;
        background-color: $color-bg-primary;
        border-radius: 8px;
        flex-wrap: wrap;

        .search-field {
          flex: 1;
          min-width: 250px;
        }

        mat-form-field {
          min-width: 180px;
        }

        .actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
      }

      .stats-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba($color-primary, 0.08);
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        color: $color-text-secondary;

        strong {
          color: $color-primary;
          font-weight: 600;
        }

        .divider {
          color: $color-border;
        }
      }

      .loading-container {
        text-align: center;
        padding: 60px 20px;

        mat-spinner {
          margin: 0 auto 16px;
        }

        p {
          font-size: 14px;
          color: $color-text-secondary;
        }
      }

      .permission-tree-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: 500px;
        overflow-y: auto;
      }

      .module-card {
        border-radius: 8px;
        box-shadow: $shadow-sm;

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid $color-bg-primary;

          mat-card-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            font-size: 16px;
            font-weight: 600;

            mat-checkbox {
              display: flex;
              align-items: center;
              gap: 8px;

              mat-icon {
                font-size: 20px;
                width: 20px;
                height: 20px;
                color: $color-warning;
              }
            }

            .permission-count {
              font-size: 13px;
              color: $color-text-muted;
              font-weight: normal;
            }
          }
        }

        mat-card-content {
          padding: 16px !important;
        }
      }

      .permission-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
      }

      .permission-item {
        mat-checkbox {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;

          .mat-mdc-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
          }
        }

        .permission-name {
          font-size: 14px;
          color: $color-text-primary;
          font-weight: 500;
        }

        .permission-code {
          font-size: 12px;
          color: $color-text-muted;
          font-family: monospace;
        }

        mat-chip {
          height: 20px;
          font-size: 11px;
          background-color: rgba($color-primary-dark, 0.1);
          color: $color-primary-dark;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            margin-right: 4px;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: $color-text-muted;
          margin-bottom: 16px;
        }

        p {
          font-size: 14px;
          color: $color-text-secondary;
        }
      }

      /* 响应式调整 */
      @media (max-width: 768px) {
        .permission-config-dialog {
          min-width: 100%;
          max-width: 100%;
        }

        .filter-toolbar {
          flex-direction: column;

          .search-field {
            min-width: 100%;
          }

          mat-form-field {
            min-width: 100%;
          }

          .actions {
            width: 100%;
            justify-content: center;
          }
        }

        .permission-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatTreeModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
})
export class PermissionConfigDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  allPermissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  searchKeyword = '';
  selectedModule = '';
  selectedPermissionIds: Set<number> = new Set();

  modules = [
    { code: 'teacher', name: '教师管理' },
    { code: 'student', name: '学员管理' },
    { code: 'schedule', name: '排课管理' },
    { code: 'finance', name: '财务管理' },
    { code: 'classroom', name: '教室管理' },
    { code: 'wechat', name: '微信客服' },
    { code: 'system', name: '系统管理' },
  ];

  constructor(
    public dialogRef: MatDialogRef<PermissionConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PermissionConfigDialogData,
    private permissionService: RolePermissionService,
    private snackBar: MatSnackBar
  ) {
    // 初始化选中的权限
    data.selectedPermissionIds.forEach((id) => this.selectedPermissionIds.add(id));
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.loading = true;
    this.permissionService
      .getAllPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          this.allPermissions = permissions;
          this.filteredPermissions = permissions;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('加载权限树失败', '关闭', { duration: 3000 });
          this.loading = false;
        },
      });
  }

  applyFilter(): void {
    let result = [...this.allPermissions];

    // 模块筛选
    if (this.selectedModule) {
      result = result.filter((p) => p.module === this.selectedModule);
    }

    // 搜索筛选
    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result
        .map((module) => {
          const matchedChildren = module.children?.filter(
            (child) =>
              child.name.toLowerCase().includes(keyword) ||
              child.code.toLowerCase().includes(keyword)
          );

          const moduleMatched =
            module.name.toLowerCase().includes(keyword) ||
            module.code.toLowerCase().includes(keyword);

          if (moduleMatched) {
            return module;
          } else if (matchedChildren && matchedChildren.length > 0) {
            return { ...module, children: matchedChildren };
          }
          return null;
        })
        .filter((p): p is Permission => p !== null);
    }

    this.filteredPermissions = result;
  }

  selectAll(): void {
    this.filteredPermissions.forEach((module) => {
      module.children?.forEach((perm) => {
        this.selectedPermissionIds.add(perm.id);
      });
    });
    this.snackBar.open('已全选所有权限', '关闭', { duration: 2000 });
  }

  deselectAll(): void {
    this.selectedPermissionIds.clear();
    this.snackBar.open('已取消全选', '关闭', { duration: 2000 });
  }

  isSelected(permissionId: number): boolean {
    return this.selectedPermissionIds.has(permissionId);
  }

  isModuleChecked(module: Permission): boolean {
    if (!module.children) return false;
    return module.children.every((child) => this.selectedPermissionIds.has(child.id));
  }

  isModuleIndeterminate(module: Permission): boolean {
    if (!module.children) return false;
    const checkedCount = module.children.filter((child) =>
      this.selectedPermissionIds.has(child.id)
    ).length;
    return checkedCount > 0 && checkedCount < module.children.length;
  }

  getModulePermissionCount(module: Permission): number {
    return module.children?.length ?? 0;
  }

  onModuleToggle(module: Permission, event: MatCheckboxChange): void {
    if (!module.children) return;

    if (event.checked) {
      // 全选该模块下所有权限
      module.children.forEach((perm) => {
        this.selectedPermissionIds.add(perm.id);
      });
    } else {
      // 取消全选该模块下所有权限
      module.children.forEach((perm) => {
        this.selectedPermissionIds.delete(perm.id);
      });
    }
  }

  onPermissionToggle(permissionId: number, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedPermissionIds.add(permissionId);
    } else {
      this.selectedPermissionIds.delete(permissionId);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedPermissionIds.size === 0) {
      this.snackBar.open('请至少选择一个权限', '关闭', { duration: 3000 });
      return;
    }

    this.dialogRef.close(Array.from(this.selectedPermissionIds));
  }

  get selectedCount(): number {
    return this.selectedPermissionIds.size;
  }

  get totalPermissions(): number {
    return this.allPermissions.reduce((sum, p) => sum + (p.children?.length ?? 0), 0);
  }
}
