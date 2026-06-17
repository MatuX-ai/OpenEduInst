import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { mockOrganizations } from './mock-dashboard-data';
import { OrganizationEditDialogComponent } from './organization-edit-dialog.component';
import {
  Organization,
  OrganizationCreate,
  OrganizationService,
  OrganizationUpdate,
} from './organization-list.service';

@Component({
  selector: 'app-organization-list',
  template: `
    <div class="organization-list">
      <div class="header">
        <h1><mat-icon>business</mat-icon>组织管理</h1>
        <button mat-raised-button color="primary" (click)="createOrganization()">
          <mat-icon>add</mat-icon>
          创建组织
        </button>
      </div>

      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载组织列表...</p>
      </div>

      <!-- 错误状态 -->
      <div *ngIf="!loading && error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadOrganizations()">重试</button>
      </div>

      <!-- 组织列表 -->
      <div *ngIf="!loading && !error && organizations.length > 0" class="content">
        <table mat-table [dataSource]="organizations" class="mat-elevation-z8 organization-table">
          <!-- ID 列 -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let org">{{ org.id }}</td>
          </ng-container>

          <!-- 名称列 -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>组织名称</th>
            <td mat-cell *matCellDef="let org">{{ org.name }}</td>
          </ng-container>

          <!-- 邮箱列 -->
          <ng-container matColumnDef="contact_email">
            <th mat-header-cell *matHeaderCellDef>联系邮箱</th>
            <td mat-cell *matCellDef="let org">{{ org.contact_email }}</td>
          </ng-container>

          <!-- 电话列 -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>联系电话</th>
            <td mat-cell *matCellDef="let org">{{ org.phone || '-' }}</td>
          </ng-container>

          <!-- 用户数列 -->
          <ng-container matColumnDef="current_users">
            <th mat-header-cell *matHeaderCellDef>当前用户数</th>
            <td mat-cell *matCellDef="let org">{{ org.current_users }} / {{ org.max_users }}</td>
          </ng-container>

          <!-- 许可证列 -->
          <ng-container matColumnDef="license_count">
            <th mat-header-cell *matHeaderCellDef>许可证数</th>
            <td mat-cell *matCellDef="let org">{{ org.license_count }}</td>
          </ng-container>

          <!-- 状态列 -->
          <ng-container matColumnDef="is_active">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let org">
              <mat-chip [color]="org.is_active ? 'primary' : 'warn'">
                {{ org.is_active ? '激活' : '停用' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- 操作列 -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let org">
              <button
                mat-raised-button
                color="accent"
                (click)="navigateToDashboard(org.id)"
                matTooltip="进入机构驾驶舱"
                style="margin-right: 8px;"
              >
                <mat-icon>dashboard</mat-icon>
                进入管理后台
              </button>
              <button
                mat-icon-button
                color="primary"
                (click)="editOrganization(org)"
                matTooltip="编辑"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="deleteOrganization(org.id)"
                matTooltip="删除"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>

      <!-- 空状态 -->
      <div *ngIf="!loading && !error && organizations.length === 0" class="empty-state">
        <mat-icon>inbox</mat-icon>
        <h3>暂无组织数据</h3>
        <p>点击上方按钮创建第一个组织</p>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;

      .organization-list {
        padding: $spacing-lg;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-lg;
      }

      .header h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: $font-size-2xl;
        color: $color-neutral-900;
      }

      .loading-container,
      .error-container,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;
        text-align: center;
      }

      .error-container mat-icon.error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: $color-error;
        margin-bottom: $spacing-md;
      }

      .empty-state {
        background: $color-neutral-100;
        border-radius: $radius-md;
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: $color-neutral-400;
        margin-bottom: $spacing-md;
      }

      .organization-table {
        width: 100%;
        border-radius: $radius-md;
        overflow: hidden;
      }

      table th {
        background: $color-neutral-100;
        font-weight: 600;
        color: $color-neutral-900;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    OrganizationEditDialogComponent,
  ],
})
export class OrganizationListComponent implements OnInit {
  organizations: Organization[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'id',
    'name',
    'contact_email',
    'phone',
    'current_users',
    'license_count',
    'is_active',
    'actions',
  ];

  constructor(
    private organizationService: OrganizationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  /**
   * 加载组织列表
   */
  loadOrganizations(): void {
    this.loading = true;
    this.error = null;

    // 如果使用 mock 数据
    if (environment.useMockData) {
      setTimeout(() => {
        this.organizations = mockOrganizations as any;
        this.loading = false;
        // Mock 模式下，如果只有一个组织，自动跳转
        this.checkAndRedirect();
      }, environment.mockDataDelay);
      return;
    }

    this.organizationService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations = data;
        this.loading = false;
        // 真实 API 模式下，如果只有一个组织，自动跳转
        this.checkAndRedirect();
      },
      error: (err) => {
        console.error('加载组织列表失败:', err);
        this.error = '加载组织列表失败，请稍后重试';
        this.loading = false;
        this.showSnackbar('加载失败', 'error');
      },
    });
  }

  /**
   * 检查并自动跳转（用户只能有一个组织）
   */
  checkAndRedirect(): void {
    if (this.organizations.length === 0) {
      // 没有组织，显示创建引导
      return;
    }
    
    if (this.organizations.length >= 1) {
      // 用户只能有一个组织，直接跳转到该组织的 dashboard
      const org = this.organizations[0];
      this.router.navigate(['/organization', org.id, 'dashboard']);
    }
  }

  /**
   * 创建组织
   */
  createOrganization(): void {
    const dialogRef = this.dialog.open(OrganizationEditDialogComponent, {
      width: '600px',
      data: {
        title: '创建组织',
        mode: 'create',
      },
    });

    dialogRef.afterClosed().subscribe((result: OrganizationCreate | undefined) => {
      if (result) {
        this.organizationService.createOrganization(result).subscribe({
          next: (newOrg) => {
            this.organizations.push(newOrg);
            this.showSnackbar('组织创建成功', 'success');
          },
          error: (err: unknown) => {
            const errorMessage =
              typeof err === 'object' && err !== null
                ? 'error' in err &&
                  typeof err.error === 'object' &&
                  err.error !== null &&
                  'message' in err.error &&
                  typeof err.error.message === 'string'
                  ? (err.error as { message: string }).message
                  : 'message' in err && typeof err.message === 'string'
                    ? err.message
                    : '未知错误'
                : '未知错误';
            this.showSnackbar(`创建失败：${errorMessage}`, 'error');
          },
        });
      }
    });
  }

  /**
   * 编辑组织
   */
  editOrganization(org: Organization): void {
    const dialogRef = this.dialog.open(OrganizationEditDialogComponent, {
      width: '600px',
      data: {
        title: '编辑组织',
        mode: 'edit',
        organization: org,
      },
    });

    dialogRef.afterClosed().subscribe((result: OrganizationUpdate | undefined) => {
      if (result) {
        this.organizationService.updateOrganization(org.id, result).subscribe({
          next: (updatedOrg) => {
            const index = this.organizations.findIndex((o) => o.id === org.id);
            if (index !== -1) {
              this.organizations[index] = updatedOrg;
            }
            this.showSnackbar('组织更新成功', 'success');
          },
          error: (err: unknown) => {
            const errorMessage =
              typeof err === 'object' && err !== null
                ? 'error' in err &&
                  typeof err.error === 'object' &&
                  err.error !== null &&
                  'message' in err.error &&
                  typeof err.error.message === 'string'
                  ? (err.error as { message: string }).message
                  : 'message' in err && typeof err.message === 'string'
                    ? err.message
                    : '未知错误'
                : '未知错误';
            this.showSnackbar(`更新失败：${errorMessage}`, 'error');
          },
        });
      }
    });
  }

  /**
   * 删除组织
   */
  deleteOrganization(orgId: number): void {
    const confirmed = confirm('确定要删除这个组织吗？此操作不可恢复。');
    if (!confirmed) return;

    this.organizationService.deleteOrganization(orgId).subscribe({
      next: () => {
        this.organizations = this.organizations.filter((o) => o.id !== orgId);
        this.showSnackbar('组织删除成功', 'success');
      },
      error: (err: unknown) => {
        const errorMessage =
          typeof err === 'object' && err !== null
            ? 'error' in err &&
              typeof err.error === 'object' &&
              err.error !== null &&
              'message' in err.error &&
              typeof err.error.message === 'string'
              ? (err.error as { message: string }).message
              : 'message' in err && typeof err.message === 'string'
                ? err.message
                : '未知错误'
            : '未知错误';
        this.showSnackbar(`删除失败：${errorMessage}`, 'error');
      },
    });
  }

  /**
   * 显示通知消息
   */
  private showSnackbar(message: string, type: 'success' | 'error' = 'error'): void {
    const panelClass = type === 'success' ? ['success-snackbar'] : ['error-snackbar'];
    this.snackBar.open(message, '关闭', {
      duration: 3000,
      panelClass,
    });
  }

  /**
   * 导航到机构驾驶舱（STEM 云托管版）
   */
  navigateToDashboard(orgId: number): void {
    void this.router.navigate(['/organization-management', orgId, 'dashboard']);
  }
}
