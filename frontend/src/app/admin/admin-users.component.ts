/**
 * Admin 管理后台 - 用户管理
 *
 * 功能：
 * - 查看用户列表（分页）
 * - 修改用户角色
 * - 启用/停用账号
 * - 强制下线（基于 Token 黑名单）
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EMPTY, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import {
  AdminBackendService,
  AdminUser,
  RoleInfo,
} from '../core/services/admin-backend.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="users">
      <header class="users__header">
        <div>
          <h1>
            <mat-icon>group</mat-icon>
            用户管理
          </h1>
          <p class="users__subtitle">管理用户角色、账号状态与会话（强制下线基于 Token 黑名单）</p>
        </div>
      </header>

      <mat-card *ngIf="loading" class="state-card">
        <p>加载中...</p>
      </mat-card>

      <mat-card *ngIf="!loading">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>people</mat-icon>
            用户列表（共 {{ total }} 条）
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="rows" class="user-table">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let u">#{{ u.id }}</td>
            </ng-container>
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>用户名</th>
              <td mat-cell *matCellDef="let u">{{ u.username }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>邮箱</th>
              <td mat-cell *matCellDef="let u">{{ u.email || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>角色</th>
              <td mat-cell *matCellDef="let u">
                <mat-select [(value)]="u.role" (selectionChange)="onChangeRole(u)">
                  <mat-option *ngFor="let r of roles" [value]="r.role">
                    {{ r.role }}（{{ r.permissions.length }} 权限）
                  </mat-option>
                </mat-select>
              </td>
            </ng-container>
            <ng-container matColumnDef="is_active">
              <th mat-header-cell *matHeaderCellDef>启用</th>
              <td mat-cell *matCellDef="let u">
                <mat-slide-toggle [checked]="u.is_active" (change)="onToggleActive(u, $event)">
                </mat-slide-toggle>
              </td>
            </ng-container>
            <ng-container matColumnDef="created_at">
              <th mat-header-cell *matHeaderCellDef>创建时间</th>
              <td mat-cell *matCellDef="let u">{{ (u.created_at || '') | slice: 0:10 }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let u">
                <button mat-stroked-button color="warn" (click)="forceLogout(u)">
                  <mat-icon>logout</mat-icon>
                  强制下线
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>

          <mat-paginator
            [length]="total"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            showFirstLastButtons
            (page)="onPage($event)"
          ></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .users { padding: 24px; }
      .users__header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 24px; color: #1f2937; }
      .users__subtitle { color: #6b7280; margin: 6px 0 20px; }
      .state-card { text-align: center; color: #6b7280; padding: 24px; }
      .user-table mat-header-cell { background: #f9fafb; color: #374151; font-weight: 600; }
    `,
  ],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  rows: AdminUser[] = [];
  roles: RoleInfo[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = true;
  columns = ['id', 'username', 'email', 'role', 'is_active', 'created_at', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminBackendService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService
      .getRoles()
      .pipe(catchError(() => EMPTY), takeUntil(this.destroy$))
      .subscribe((r: RoleInfo[]) => (this.roles = r));
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onChangeRole(user: AdminUser): void {
    this.adminService.updateUserRole(user.id, user.role).subscribe({
      next: () => this.snackBar.open(`角色已更新为 ${user.role}`, '关闭', { duration: 2400 }),
      error: () => this.snackBar.open('更新失败', '关闭', { duration: 2400 }),
    });
  }

  onToggleActive(user: AdminUser, event: any): void {
    const next = !!event.checked;
    this.adminService.updateUserActiveStatus(user.id, next).subscribe({
      next: () => {
        user.is_active = next;
        this.snackBar.open(`账号状态已更新`, '关闭', { duration: 2000 });
      },
      error: () => {
        user.is_active = !next;
        this.snackBar.open('更新失败', '关闭', { duration: 2400 });
      },
    });
  }

  forceLogout(user: AdminUser): void {
    if (!confirm(`确认将用户 "${user.username}" 立即下线吗？该操作会使其当前 Access Token 失效。`)) return;
    this.adminService.forceLogoutUser(user.username).subscribe({
      next: (resp: { success: boolean; message?: string }) => this.snackBar.open(resp?.message || '已强制下线', '关闭', { duration: 3000 }),
      error: () => this.snackBar.open('操作失败，请重试', '关闭', { duration: 2400 }),
    });
  }

  private loadData(): void {
    this.loading = true;
    this.adminService
      .getUsers({ page: this.page, page_size: this.pageSize })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: { items: AdminUser[]; total: number; page: number; page_size: number; total_pages: number }) => {
          this.rows = data.items;
          this.total = data.total;
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.total = 0;
          this.loading = false;
          this.snackBar.open('加载失败，请稍后重试', '关闭', { duration: 3000 });
        },
      });
  }
}
