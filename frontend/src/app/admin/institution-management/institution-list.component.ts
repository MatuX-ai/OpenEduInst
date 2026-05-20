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

import {
  type InstitutionData,
  InstitutionEditDialogComponent,
} from '../../shared/admin-components/institution-edit-dialog.component';

import {
  Institution,
  InstitutionCreate,
  InstitutionService,
  InstitutionUpdate,
} from './institution-list.service';

@Component({
  selector: 'app-institution-list',
  template: `
    <div class="institution-list">
      <div class="header">
        <h1><mat-icon>business</mat-icon>机构管理</h1>
        <button mat-raised-button color="primary" (click)="createInstitution()">
          <mat-icon>add</mat-icon>
          创建机构
        </button>
      </div>

      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>正在加载机构列表...</p>
      </div>

      <!-- 错误状态 -->
      <div *ngIf="!loading && error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadInstitutions()">重试</button>
      </div>

      <!-- 机构列表 -->
      <div *ngIf="!loading && !error && institutions.length > 0" class="content">
        <table mat-table [dataSource]="institutions" class="mat-elevation-z8 institution-table">
          <!-- ID 列 -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let inst">{{ inst.id }}</td>
          </ng-container>

          <!-- 名称列 -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>机构名称</th>
            <td mat-cell *matCellDef="let inst">{{ inst.name }}</td>
          </ng-container>

          <!-- 邮箱列 -->
          <ng-container matColumnDef="contact_email">
            <th mat-header-cell *matHeaderCellDef>联系邮箱</th>
            <td mat-cell *matCellDef="let inst">{{ inst.contact_email }}</td>
          </ng-container>

          <!-- 电话列 -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>联系电话</th>
            <td mat-cell *matCellDef="let inst">{{ inst.phone || '-' }}</td>
          </ng-container>

          <!-- 用户数列 -->
          <ng-container matColumnDef="current_users">
            <th mat-header-cell *matHeaderCellDef>当前用户数</th>
            <td mat-cell *matCellDef="let inst">{{ inst.current_users }} / {{ inst.max_users }}</td>
          </ng-container>

          <!-- 许可证列 -->
          <ng-container matColumnDef="license_count">
            <th mat-header-cell *matHeaderCellDef>许可证数</th>
            <td mat-cell *matCellDef="let inst">{{ inst.license_count }}</td>
          </ng-container>

          <!-- 状态列 -->
          <ng-container matColumnDef="is_active">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let inst">
              <mat-chip [color]="inst.is_active ? 'primary' : 'warn'">
                {{ inst.is_active ? '激活' : '停用' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- 操作列 -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let inst">
              <button
                mat-icon-button
                color="primary"
                (click)="editInstitution(inst)"
                matTooltip="编辑"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="deleteInstitution(inst.id)"
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
      <div *ngIf="!loading && !error && institutions.length === 0" class="empty-state">
        <mat-icon>inbox</mat-icon>
        <h3>暂无机构数据</h3>
        <p>点击上方按钮创建第一个机构</p>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/design-tokens' as tokens;
      @use '../../../styles/shared/mixins' as mixins;

      .institution-list {
        padding: tokens.$spacing-xl;
        animation: fadeIn 0.5s ease-in-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .header {
        @include mixins.flex-between;
        margin-bottom: tokens.$spacing-xxl;

        h1 {
          display: flex;
          align-items: center;
          gap: tokens.$spacing-sm;
          margin: 0;
          font-size: tokens.$font-size-2xl;
          color: tokens.$color-neutral-900;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: var(--color-primary);
          }
        }
      }

      .loading-container,
      .error-container,
      .empty-state {
        @include mixins.flex-center;
        flex-direction: column;
        padding: tokens.$spacing-3xl tokens.$spacing-lg;
        text-align: center;
      }

      .error-container {
        mat-icon.error-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--color-warn);
          margin-bottom: tokens.$spacing-md;
        }
      }

      .empty-state {
        background: tokens.$color-neutral-100;
        border-radius: tokens.$radius-md;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: tokens.$color-neutral-400;
          margin-bottom: tokens.$spacing-md;
        }

        h3 {
          font-size: tokens.$font-size-xl;
          color: tokens.$color-neutral-700;
          margin: 0 0 tokens.$spacing-xs 0;
        }

        p {
          font-size: tokens.$font-size-base;
          color: tokens.$color-neutral-600;
          margin: 0;
        }
      }

      .institution-table {
        width: 100%;
        border-radius: tokens.$radius-lg;
        overflow: hidden;
        box-shadow: tokens.$shadow-md;
        background: white;

        table th {
          background: tokens.$color-neutral-50;
          font-weight: tokens.$font-weight-semibold;
          color: tokens.$color-neutral-700;
          padding: tokens.$spacing-md;
        }

        table td {
          padding: tokens.$spacing-md;
          border-bottom: 1px solid tokens.$color-neutral-100;
          color: tokens.$color-neutral-600;
        }

        table tr:hover td {
          background: tokens.$color-neutral-50;
        }
      }

      // 响应式适配
      @include mixins.tablet {
        .header h1 {
          font-size: tokens.$font-size-3xl;
        }
      }

      @include mixins.mobile {
        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: tokens.$spacing-md;

          button { width: 100%; }
        }
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
    // InstitutionEditDialogComponent, // TODO: 需要创建此组件
  ],
})
export class InstitutionListComponent implements OnInit {
  institutions: Institution[] = [];
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
    private institutionService: InstitutionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInstitutions();
  }

  /**
   * 加载机构列表
   */
  loadInstitutions(): void {
    this.loading = true;
    this.error = null;

    this.institutionService.getInstitutions().subscribe({
      next: (data) => {
        this.institutions = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('加载机构列表失败:', err);
        this.error = '加载机构列表失败，请稍后重试';
        this.loading = false;
        this.showSnackbar('加载失败', 'error');
      },
    });
  }

  /**
   * 创建机构
   */
  createInstitution(): void {
    const dialogRef = this.dialog.open(InstitutionEditDialogComponent, {
      width: '600px',
      data: {
        title: '创建机构',
        mode: 'create',
      },
    });

    dialogRef.afterClosed().subscribe((formData: InstitutionData | undefined) => {
      if (formData) {
        const createData: InstitutionCreate = {
          name: formData.name,
          contact_email: formData.contact_email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website,
          max_users: formData.max_users ?? 100,
        };

        this.institutionService.createInstitution(createData).subscribe({
          next: (newInst) => {
            this.institutions.push(newInst);
            this.showSnackbar('机构创建成功', 'success');
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
   * 编辑机构
   */
  editInstitution(institution: Institution): void {
    this.openEditDialog(institution);
  }

  /**
   * 打开编辑对话框
   */
  private openEditDialog(institution: Institution): void {
    const dialogRef = this.dialog.open(InstitutionEditDialogComponent, {
      width: '600px',
      data: {
        title: '编辑机构',
        mode: 'edit',
        institution: {
          id: institution.id,
          name: institution.name,
          contact_email: institution.contact_email,
          phone: institution.phone,
          address: institution.address,
          website: institution.website,
          max_users: institution.max_users,
          is_active: institution.is_active,
        },
      },
    });

    dialogRef.afterClosed().subscribe((formData: InstitutionData | undefined) => {
      if (formData) {
        this.updateInstitution(institution.id, formData);
      }
    });
  }

  /**
   * 更新机构信息
   */
  private updateInstitution(institutionId: number, formData: InstitutionData): void {
    const updateData: InstitutionUpdate = {
      name: formData.name,
      contact_email: formData.contact_email,
      phone: formData.phone,
      address: formData.address,
      website: formData.website,
      max_users: formData.max_users,
    };

    this.institutionService.updateInstitution(institutionId, updateData).subscribe({
      next: (updatedInst) => {
        const index = this.institutions.findIndex((i) => i.id === institutionId);
        if (index !== -1) {
          this.institutions[index] = updatedInst;
        }
        this.showSnackbar('机构更新成功', 'success');
      },
      error: (err: unknown) => {
        this.handleUpdateError(err);
      },
    });
  }

  /**
   * 处理更新错误
   */
  private handleUpdateError(err: unknown): void {
    const errorMessage = this.extractErrorMessage(err);
    this.showSnackbar(`更新失败：${errorMessage}`, 'error');
  }

  /**
   * 提取错误消息
   */
  private extractErrorMessage(err: unknown): string {
    if (typeof err !== 'object' || err === null) {
      return '未知错误';
    }

    if (
      'error' in err &&
      typeof err.error === 'object' &&
      err.error !== null &&
      'message' in err.error &&
      typeof err.error.message === 'string'
    ) {
      return (err.error as { message: string }).message;
    }

    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }

    return '未知错误';
  }

  /**
   * 删除机构
   */
  deleteInstitution(institutionId: number): void {
    const confirmed = confirm('确定要删除这个机构吗？此操作不可恢复。');
    if (!confirmed) return;

    this.institutionService.deleteInstitution(institutionId).subscribe({
      next: () => {
        this.institutions = this.institutions.filter((i) => i.id !== institutionId);
        this.showSnackbar('机构删除成功', 'success');
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
}
