/**
 * 用户授权对话框组件
 *
 * @fileoverview 提供用户选择、角色分配、批量授权等功能
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
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Role } from '../../models/role-permission.models';
import { RolePermissionService } from '../../services/role-permission.service';

export interface UserAssignDialogData {
  roleId?: number; // 如果指定，则为单个角色分配
  userIds?: number[]; // 如果指定，则为批量分配
  mode: 'single' | 'batch' | 'assign_to_user';
}

interface UserViewModel {
  id: number;
  name: string;
  email: string;
  department?: string;
  currentRoles: string[];
  selected: boolean;
}

@Component({
  selector: 'app-user-assign-dialog',
  template: `
    <div class="user-assign-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ getDialogTitleIcon() }}</mat-icon>
        {{ getDialogTitle() }}
      </h2>

      <mat-dialog-content>
        <!-- 模式 1: 为用户分配角色 -->
        <div *ngIf="data.mode === 'assign_to_user'" class="mode-section">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                选择用户
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>搜索用户</mat-label>
                <input
                  matInput
                  [(ngModel)]="searchKeyword"
                  (input)="applyFilter()"
                  placeholder="姓名、邮箱或部门"
                />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>

              <div class="user-list" *ngIf="filteredUsers.length > 0">
                <mat-card
                  *ngFor="let user of filteredUsers; trackBy: trackByFn"
                  class="user-card"
                  [class.selected]="user.selected"
                  (click)="toggleUser(user)"
                >
                  <mat-card-content>
                    <div class="user-info">
                      <div class="user-avatar">
                        <mat-icon>account_circle</mat-icon>
                      </div>
                      <div class="user-details">
                        <div class="user-name">{{ user.name }}</div>
                        <div class="user-email">{{ user.email }}</div>
                        <div class="user-department">{{ user.department || '暂无部门' }}</div>
                      </div>
                    </div>
                    <mat-checkbox
                      [checked]="user.selected"
                      (click)="$event.stopPropagation()"
                      (change)="toggleUser(user)"
                    >
                    </mat-checkbox>
                  </mat-card-content>
                </mat-card>
              </div>

              <div class="empty-state" *ngIf="filteredUsers.length === 0">
                <mat-icon>person_off</mat-icon>
                <p>没有找到匹配的用户</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="role-selection-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>admin_panel_settings</mat-icon>
                分配角色
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>选择角色 <span class="required">*</span></mat-label>
                <mat-select [(ngModel)]="selectedRoleId" required>
                  @for (role of roles; track role.id) {
                    <mat-option [value]="role.id">
                      <div class="role-option">
                        <span class="role-name">{{ role.name }}</span>
                        <span class="role-code">{{ role.code }}</span>
                        <mat-chip *ngIf="role.isSystem">系统</mat-chip>
                      </div>
                    </mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="!selectedRoleId && submitted">请选择一个角色</mat-error>
              </mat-form-field>

              <div class="selected-users-summary" *ngIf="selectedUsers.length > 0">
                <mat-icon>check_circle</mat-icon>
                <span
                  >已选择 <strong>{{ selectedUsers.length }}</strong> 个用户</span
                >
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 模式 2: 为角色分配用户 -->
        <div *ngIf="data.mode === 'single'" class="mode-section">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>people</mat-icon>
                选择要授权的用户
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>搜索用户</mat-label>
                <input
                  matInput
                  [(ngModel)]="searchKeyword"
                  (input)="applyFilter()"
                  placeholder="姓名、邮箱或部门"
                />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>

              <div class="user-table-container">
                <table mat-table [dataSource]="filteredUsers" class="user-table">
                  <!-- 选择列 -->
                  <ng-container matColumnDef="select">
                    <th mat-header-cell *matHeaderCellDef>
                      <mat-checkbox
                        (change)="toggleSelectAll($event)"
                        [checked]="isAllSelected()"
                        [indeterminate]="isIndeterminate()"
                      >
                      </mat-checkbox>
                    </th>
                    <td mat-cell *matCellDef="let user">
                      <mat-checkbox
                        [checked]="user.selected"
                        (change)="toggleUser(user)"
                        (click)="$event.stopPropagation()"
                      >
                      </mat-checkbox>
                    </td>
                  </ng-container>

                  <!-- 用户信息列 -->
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>用户信息</th>
                    <td mat-cell *matCellDef="let user">
                      <div class="user-cell">
                        <mat-icon>account_circle</mat-icon>
                        <div>
                          <div class="user-name">{{ user.name }}</div>
                          <div class="user-email">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <!-- 当前角色列 -->
                  <ng-container matColumnDef="roles">
                    <th mat-header-cell *matHeaderCellDef>当前角色</th>
                    <td mat-cell *matCellDef="let user">
                      <div class="role-tags">
                        <mat-chip
                          *ngFor="let roleName of user.currentRoles; trackBy: trackByRoleFn"
                          selected
                        >
                          {{ roleName }}
                        </mat-chip>
                        <span *ngIf="user.currentRoles.length === 0" class="no-role">暂无角色</span>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                </table>
              </div>

              <div class="empty-state" *ngIf="filteredUsers.length === 0">
                <mat-icon>person_off</mat-icon>
                <p>没有找到匹配的用户</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 加载状态 -->
        <div class="loading-container" *ngIf="loading">
          <mat-spinner diameter="50"></mat-spinner>
          <p>正在加载用户列表...</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="submitting">取消</button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="!canConfirm() || submitting"
        >
          <mat-icon *ngIf="submitting">hourglass_empty</mat-icon>
          <mat-icon *ngIf="!submitting">check</mat-icon>
          {{ submitting ? '提交中...' : getConfirmButtonText() }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .user-assign-dialog {
        min-width: 800px;
        max-width: 1000px;
      }

      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: #1976d2;
        }
      }

      mat-dialog-content {
        max-height: 600px;
        overflow-y: auto;
        padding: 16px 0;
      }

      .mode-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .info-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      mat-card-header {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f0f0f0;

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
            color: #ff9800;
          }
        }
      }

      mat-card-content {
        padding: 16px !important;
      }

      .full-width {
        width: 100%;
      }

      .required {
        color: #f44336;
        margin-left: 4px;
      }

      .user-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;
        margin-top: 16px;
        max-height: 400px;
        overflow-y: auto;
      }

      .user-card {
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border-color: #1976d2;
          background-color: #e3f2fd;
        }

        mat-card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px !important;
        }
      }

      .user-info {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .user-avatar {
        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: #999;
        }
      }

      .user-details {
        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 13px;
          color: #666;
          margin-bottom: 2px;
        }

        .user-department {
          font-size: 12px;
          color: #999;
        }
      }

      .user-table-container {
        margin-top: 16px;
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      }

      .user-table {
        width: 100%;

        th.mat-header-cell {
          font-weight: 600;
          color: #333;
          background-color: #f5f5f5;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        td.mat-cell {
          padding: 12px;
        }

        tr.mat-row:hover {
          background-color: #f5f5f5;
        }
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #999;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 13px;
          color: #666;
        }
      }

      .role-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        mat-chip {
          height: 24px;
          font-size: 12px;
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .no-role {
          font-size: 13px;
          color: #999;
        }
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 8px;

        .role-name {
          font-weight: 600;
          color: #333;
        }

        .role-code {
          font-size: 12px;
          color: #999;
          font-family: monospace;
        }

        mat-chip {
          height: 20px;
          font-size: 11px;
          background-color: #fff3e0;
          color: #f57c00;
        }
      }

      .selected-users-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: #e8f5e9;
        border-radius: 8px;
        margin-top: 12px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #4caf50;
        }

        strong {
          color: #2e7d32;
          font-weight: 600;
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
          color: #666;
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #ccc;
          margin-bottom: 16px;
        }

        p {
          font-size: 14px;
          color: #666;
        }
      }

      /* 响应式调整 */
      @media (max-width: 768px) {
        .user-assign-dialog {
          min-width: 100%;
          max-width: 100%;
        }

        .user-list {
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
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
})
export class UserAssignDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  submitting = false;
  submitted = false;
  users: UserViewModel[] = [];
  filteredUsers: UserViewModel[] = [];
  roles: Role[] = [];
  searchKeyword = '';
  selectedRoleId?: number;
  displayedColumns = ['select', 'user', 'roles'];

  constructor(
    public dialogRef: MatDialogRef<UserAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserAssignDialogData,
    private roleService: RolePermissionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    // 加载用户列表（Mock 数据）
    this.loadMockUsers();

    // 加载角色列表
    this.roleService
      .getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles.filter((r) => !r.isSystem || r.code !== 'principal'); // 排除校长角色
          if (this.data.roleId) {
            this.selectedRoleId = this.data.roleId;
          }
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('加载角色列表失败', '关闭', { duration: 3000 });
          this.loading = false;
        },
      });
  }

  createMockUser(
    id: number,
    name: string,
    email: string,
    department: string,
    currentRoles: string[]
  ): UserViewModel {
    return {
      id,
      name,
      email,
      department,
      currentRoles,
      selected: false,
    };
  }

  loadMockUsers(): void {
    const mockUsers: UserViewModel[] = [
      this.createMockUser(1, '张三', 'zhangsan@example.com', '教学部', ['教师']),
      this.createMockUser(2, '李四', 'lisi@example.com', '教学部', ['教师', '教务主任']),
      this.createMockUser(3, '王五', 'wangwu@example.com', '市场部', ['课程顾问']),
      this.createMockUser(4, '赵六', 'zhaoliu@example.com', '行政部', []),
      this.createMockUser(5, '钱七', 'qianqi@example.com', '教学部', ['教师']),
      this.createMockUser(6, '孙八', 'sunba@example.com', '财务部', []),
      this.createMockUser(7, '周九', 'zhoujiu@example.com', '市场部', ['课程顾问']),
      this.createMockUser(8, '吴十', 'wushi@example.com', '行政部', []),
    ];

    if (this.data.userIds) {
      mockUsers.forEach((user) => {
        if (this.data.userIds?.includes(user.id)) {
          user.selected = true;
        }
      });
    }

    this.users = mockUsers;
    this.filteredUsers = mockUsers;
  }

  applyFilter(): void {
    if (!this.searchKeyword) {
      this.filteredUsers = this.users;
      return;
    }

    const keyword = this.searchKeyword.toLowerCase();
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.department?.toLowerCase().includes(keyword)
    );
  }

  toggleUser(user: UserViewModel): void {
    user.selected = !user.selected;
  }

  toggleSelectAll(event: MatCheckboxChange): void {
    const checked = event.checked;
    this.filteredUsers.forEach((user) => {
      user.selected = checked;
    });
  }

  isAllSelected(): boolean {
    return this.filteredUsers.length > 0 && this.filteredUsers.every((u) => u.selected);
  }

  isIndeterminate(): boolean {
    const selectedCount = this.filteredUsers.filter((u) => u.selected).length;
    return selectedCount > 0 && selectedCount < this.filteredUsers.length;
  }

  get selectedUsers(): UserViewModel[] {
    return this.users.filter((u) => u.selected);
  }

  canConfirm(): boolean {
    if (this.submitting) return false;

    if (this.data.mode === 'assign_to_user') {
      return this.selectedUsers.length > 0 && !!this.selectedRoleId;
    } else if (this.data.mode === 'single') {
      return this.selectedUsers.length > 0 && !!this.selectedRoleId;
    }
    return false;
  }

  getDialogTitle(): string {
    if (this.data.mode === 'assign_to_user') {
      return '为用户分配角色';
    } else if (this.data.mode === 'single') {
      const role = this.roles.find((r) => r.id === this.data.roleId);
      return role ? `为角色"${role.name}"分配用户` : '分配用户';
    }
    return '批量授权';
  }

  getDialogTitleIcon(): string {
    if (this.data.mode === 'assign_to_user') {
      return 'person_add';
    } else if (this.data.mode === 'single') {
      return 'group_add';
    }
    return 'admin_panel_settings';
  }

  getConfirmButtonText(): string {
    const count = this.selectedUsers.length;
    if (this.data.mode === 'assign_to_user') {
      return `为${count}个用户分配角色`;
    } else if (this.data.mode === 'single') {
      return `添加${count}个用户`;
    }
    return '确认分配';
  }

  trackByFn(index: number, user: UserViewModel): number {
    return user.id;
  }

  trackByRoleFn(index: number, roleName: string): string {
    return roleName;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.canConfirm()) {
      this.snackBar.open('请先选择用户和角色', '关闭', { duration: 3000 });
      return;
    }

    this.submitting = true;

    const selectedUserIds = this.selectedUsers.map((u) => u.id);

    // 批量分配
    let completed = 0;
    const total = selectedUserIds.length;

    if (!this.selectedRoleId) return;

    selectedUserIds.forEach((userId) => {
      this.roleService
        .assignRole({
          userId,
          roleId: this.selectedRoleId as number,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completed++;
            if (completed === total) {
              this.snackBar.open(`成功为${total}个用户分配角色`, '关闭', { duration: 3000 });
              this.dialogRef.close(true);
            }
          },
          error: () => {
            this.snackBar.open('分配失败', '关闭', { duration: 3000 });
            this.submitting = false;
          },
        });
    });
  }
}
