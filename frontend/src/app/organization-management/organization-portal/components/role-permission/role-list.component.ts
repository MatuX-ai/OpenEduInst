/**
 * 角色列表组件
 *
 * @fileoverview 展示角色列表，支持创建、编辑、删除和权限配置
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Permission, PermissionStats, Role, RoleFilter } from '../../models/role-permission.models';
import { RolePermissionService } from '../../services/role-permission.service';

import { RoleEditDialogComponent } from './role-edit-dialog.component';
import { UserAssignDialogComponent } from './user-assign-dialog.component';

@Component({
  selector: 'app-role-list',
  template: `
    <div class="role-list-container">
      <div class="page-header">
        <h1><mat-icon>admin_panel_settings</mat-icon> 角色管理</h1>
        <p>自定义角色与权限配置</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon total-icon">
              <mat-icon>groups</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.totalRoles }}</h3>
              <p class="stat-label">角色总数</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon system-icon">
              <mat-icon>security</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.systemRoles }}</h3>
              <p class="stat-label">系统角色</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon custom-icon">
              <mat-icon>badge</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.customRoles }}</h3>
              <p class="stat-label">自定义角色</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon users-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.totalUsers }}</h3>
              <p class="stat-label">已分配用户</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 操作工具栏 -->
      <div class="toolbar">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>搜索角色</mat-label>
            <input
              matInput
              [(ngModel)]="filter.search"
              (input)="applyFilter()"
              placeholder="角色名称或代码"
            />
          </mat-form-field>

          <button mat-stroked-button (click)="resetFilter()">
            <mat-icon>refresh</mat-icon>
            重置
          </button>
        </div>

        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          创建角色
        </button>
      </div>

      <!-- 加载状态 -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载角色列表...</p>
      </div>

      <!-- 角色列表 -->
      <div class="role-grid" *ngIf="!loading && roles.length > 0">
        <mat-card
          *ngFor="let role of filteredRoles; trackBy: trackByFn"
          class="role-card"
          [class.system-role]="role.isSystem"
        >
          <mat-card-header>
            <mat-card-title>
              <mat-icon [color]="role.isSystem ? 'warn' : undefined">
                {{ role.isSystem ? 'security' : 'badge' }}
              </mat-icon>
              {{ role.name }}
            </mat-card-title>
            <mat-card-subtitle>{{ role.code }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p class="description">{{ role.description || '暂无描述' }}</p>

            <div class="role-meta">
              <div class="meta-item">
                <mat-icon>people</mat-icon>
                <span>{{ role.userCount }} 人</span>
              </div>
              <div class="meta-item">
                <mat-icon>vpn_key</mat-icon>
                <span>{{ role.permissions.length }} 个权限</span>
              </div>
              <div class="meta-item">
                <mat-icon>folder</mat-icon>
                <span>{{ getDataScopeText(role.dataScope) }}</span>
              </div>
            </div>

            <div class="permission-tags" *ngIf="role.permissions.length > 0">
              <mat-chip
                *ngFor="let perm of role.permissions.slice(0, 5); trackBy: trackByPermFn"
                selected
              >
                {{ perm.name }}
              </mat-chip>
              <mat-chip *ngIf="role.permissions.length > 5" selected>
                +{{ role.permissions.length - 5 }}
              </mat-chip>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button (click)="viewRole(role)">
              <mat-icon>visibility</mat-icon>
              查看
            </button>
            <button mat-button color="primary" (click)="editRole(role)">
              <mat-icon>edit</mat-icon>
              编辑
            </button>
            <button mat-button color="accent" (click)="assignUsers(role)">
              <mat-icon>group_add</mat-icon>
              分配用户
            </button>
            <button mat-button color="warn" (click)="deleteRole(role)" [disabled]="role.isSystem">
              <mat-icon>delete</mat-icon>
              删除
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" *ngIf="!loading && roles.length === 0">
        <mat-icon>admin_panel_settings</mat-icon>
        <h3>暂无角色数据</h3>
        <p>点击右上角创建第一个角色</p>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../../styles/design-tokens' as *;
      .role-list-container {
        height: 100%;
        overflow-y: auto;
        padding: 24px;
        background-color: $color-bg-primary;
      }

      .page-header {
        margin-bottom: 24px;

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 600;
          color: $color-text-primary;
          margin: 0 0 8px 0;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: $color-primary;
          }
        }

        p {
          font-size: 14px;
          color: $color-text-secondary;
          margin: 0;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        border-radius: $radius-lg;
        box-shadow: $shadow-md;
        transition: transform 0.2s;

        &:hover {
          transform: translateY(-4px);
        }

        mat-card-content {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px !important;
        }
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: $radius-lg;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }

        &.total-icon {
          background: linear-gradient(135deg, $color-primary, #764ba2);
        }

        &.system-icon {
          background: linear-gradient(135deg, #f093fb, $color-error);
        }

        &.custom-icon {
          background: linear-gradient(135deg, $color-primary-light, #00f2fe);
        }

        &.users-icon {
          background: linear-gradient(135deg, $color-secondary, #38f9d7);
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: $color-text-primary;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: $color-text-secondary;
          margin: 0;
        }
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 16px;
        background-color: white;
        border-radius: 8px;
        box-shadow: $shadow-sm;
      }

      .filters {
        display: flex;
        gap: 12px;
        align-items: center;

        mat-form-field {
          min-width: 300px;
        }
      }

      .role-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }

      .role-card {
        border-radius: $radius-lg;
        box-shadow: $shadow-md;
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: $shadow-xl;
        }

        &.system-role {
          border-color: $color-error;
        }

        mat-card-header {
          padding: 16px !important;
          border-bottom: 1px solid $color-bg-primary;

          mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 600;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
            }
          }

          mat-card-subtitle {
            font-size: 14px;
            color: $color-text-secondary;
            margin-top: 4px;
          }
        }

        mat-card-content {
          padding: 16px !important;
        }
      }

      .description {
        font-size: 14px;
        color: $color-text-secondary;
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .role-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: $color-text-secondary;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: $color-text-muted;
        }
      }

      .permission-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid $color-bg-primary;

        mat-chip {
          height: 24px;
          font-size: 12px;
          background-color: rgba($color-primary, 0.08);
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

      .empty-state {
        text-align: center;
        padding: 60px 20px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: $color-text-muted;
          margin-bottom: 16px;
        }

        h3 {
          font-size: 18px;
          color: $color-text-primary;
          margin: 0 0 8px 0;
        }

        p {
          font-size: 14px;
          color: $color-text-secondary;
          margin: 0;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
})
export class RoleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  filter: RoleFilter = {};
  stats: PermissionStats | null = null;

  constructor(
    private roleService: RolePermissionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService
      .getRoles(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          this.filteredRoles = roles;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('加载角色列表失败', '关闭', { duration: 3000 });
          this.loading = false;
        },
      });
  }

  loadStats(): void {
    this.roleService
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.stats = stats;
      });
  }

  applyFilter(): void {
    if (!this.filter.search) {
      this.filteredRoles = this.roles;
      return;
    }

    const keyword = this.filter.search.toLowerCase();
    this.filteredRoles = this.roles.filter(
      (role) =>
        role.name.toLowerCase().includes(keyword) ||
        role.code.toLowerCase().includes(keyword) ||
        role.description?.toLowerCase().includes(keyword)
    );
  }

  resetFilter(): void {
    this.filter = {};
    this.filteredRoles = this.roles;
  }

  viewRole(role: Role): void {
    // TODO: 实现查看详情
    this.snackBar.open(`查看角色：${role.name}`, '关闭', { duration: 2000 });
  }

  editRole(role: Role): void {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      data: {
        role,
        mode: 'edit',
      },
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.loadStats();
      }
    });
  }

  assignUsers(role: Role): void {
    const dialogRef = this.dialog.open(UserAssignDialogComponent, {
      data: {
        roleId: role.id,
        mode: 'single',
      },
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.loadStats();
      }
    });
  }

  deleteRole(role: Role): void {
    if (role.isSystem) {
      this.snackBar.open('系统内置角色不可删除', '关闭', { duration: 3000 });
      return;
    }

    if (confirm(`确定要删除角色"${role.name}"吗？`)) {
      this.roleService
        .deleteRole(role.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('删除成功', '关闭', { duration: 3000 });
              this.loadRoles();
              this.loadStats();
            } else {
              this.snackBar.open('删除失败', '关闭', { duration: 3000 });
            }
          },
        });
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      data: {
        mode: 'create',
      },
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.loadStats();
      }
    });
  }

  trackByFn(index: number, role: Role): number {
    return role.id;
  }

  trackByPermFn(index: number, perm: Permission): number {
    return perm.id;
  }

  getDataScopeText(scope: string): string {
    const map: Record<string, string> = {
      all: '全部数据',
      department: '本部门及以下',
      self: '仅本人数据',
      custom: '自定义范围',
    };
    return map[scope] || scope;
  }
}
