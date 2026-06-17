import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CloudBackupService, BackupStatus, BackupSnapshot } from '../../../services/cloud-backup.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-backup-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  template: `
    <div class="backup-management-container">
      <!-- 顶栏 -->
      <header class="page-header">
        <div>
          <h1><mat-icon>backup</mat-icon> 云端备份管理</h1>
          <p class="subtitle">管理组织数据的备份快照，支持一键回滚</p>
        </div>
        <button
          mat-raised-button
          color="primary"
          [disabled]="creatingBackup"
          (click)="openCreateBackupDialog()"
          aria-label="手动创建备份"
        >
          <mat-icon>add</mat-icon>
          {{ creatingBackup ? '备份执行中...' : '手动备份' }}
        </button>
      </header>

      <!-- 加载状态 -->
      <div *ngIf="loading" class="loading-section">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>正在加载备份数据...</p>
      </div>

      <!-- 错误状态 -->
      <div *ngIf="error" class="error-section">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-stroked-button (click)="loadData()">重试</button>
      </div>

      <!-- 内容区 -->
      <ng-container *ngIf="!loading && !error">
        <!-- 状态概览卡片 -->
        <div class="status-cards">
          <mat-card class="status-card" aria-label="快照总数">
            <mat-card-content>
              <div class="status-icon total">
                <mat-icon>collections_bookmark</mat-icon>
              </div>
              <div class="status-info">
                <span class="status-value">{{ status?.total_snapshots ?? 0 }}</span>
                <span class="status-label">快照总数</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="status-card" aria-label="最近备份">
            <mat-card-content>
              <div class="status-icon time">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="status-info">
                <span class="status-value">{{ formatDate(status?.latest_backup) }}</span>
                <span class="status-label">最近备份</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="status-card" aria-label="存储用量">
            <mat-card-content>
              <div class="status-icon storage">
                <mat-icon>storage</mat-icon>
              </div>
              <div class="status-info">
                <span class="status-value">{{ formatBytes(status?.total_storage_bytes ?? 0) }}</span>
                <span class="status-label">存储用量</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="status-card" aria-label="下次计划">
            <mat-card-content>
              <div class="status-icon plan">
                <mat-icon>event</mat-icon>
              </div>
              <div class="status-info">
                <span class="status-value">{{ formatDate(status?.next_scheduled) || '未设置' }}</span>
                <span class="status-label">下次计划</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 快照列表 -->
        <mat-card class="snapshot-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              备份快照列表
            </mat-card-title>
            <mat-card-subtitle>
              共 {{ snapshots.length }} 条记录，按创建时间倒序
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <!-- 空态 -->
            <div *ngIf="snapshots.length === 0 && !loadingSnapshots" class="empty-state">
              <mat-icon>cloud_off</mat-icon>
              <p>尚无备份快照</p>
              <span class="hint">点击「手动备份」创建第一个快照</span>
            </div>

            <!-- 加载中 -->
            <div *ngIf="loadingSnapshots" class="loading-row">
              <mat-progress-spinner mode="indeterminate" diameter="24"></mat-progress-spinner>
              <span>加载中...</span>
            </div>

            <!-- 表格 -->
            <div *ngIf="snapshots.length > 0" class="table-wrapper">
              <table mat-table [dataSource]="snapshots" class="snapshot-table">
                <!-- 快照 ID -->
                <ng-container matColumnDef="snapshot_id">
                  <th mat-header-cell *matHeaderCellDef>快照 ID</th>
                  <td mat-cell *matCellDef="let snap" class="mono">
                    {{ snap.snapshot_id.slice(0, 12) }}...
                  </td>
                </ng-container>

                <!-- 标签 -->
                <ng-container matColumnDef="label">
                  <th mat-header-cell *matHeaderCellDef>标签</th>
                  <td mat-cell *matCellDef="let snap">
                    {{ snap.label || '-' }}
                  </td>
                </ng-container>

                <!-- 类型 -->
                <ng-container matColumnDef="backup_type">
                  <th mat-header-cell *matHeaderCellDef>类型</th>
                  <td mat-cell *matCellDef="let snap">
                    <mat-chip [class]="'type-chip type-' + snap.backup_type" disableRipple>
                      {{ getTypeLabel(snap.backup_type) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- 状态 -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let snap">
                    <mat-chip [class]="'status-chip ' + snap.status" disableRipple>
                      {{ getStatusLabel(snap.status) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- 大小 -->
                <ng-container matColumnDef="file_size">
                  <th mat-header-cell *matHeaderCellDef>文件大小</th>
                  <td mat-cell *matCellDef="let snap">
                    {{ formatBytes(snap.file_size_bytes || 0) }}
                  </td>
                </ng-container>

                <!-- 创建时间 -->
                <ng-container matColumnDef="created_at">
                  <th mat-header-cell *matHeaderCellDef>创建时间</th>
                  <td mat-cell *matCellDef="let snap">
                    {{ (snap.completed_at || snap.started_at || '') | date:'yyyy-MM-dd HH:mm' }}
                  </td>
                </ng-container>

                <!-- 操作 -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>操作</th>
                  <td mat-cell *matCellDef="let snap">
                    <button
                      mat-icon-button
                      color="warn"
                      [disabled]="snap.status !== 'completed' || restoring"
                      (click)="openRestoreDialog(snap)"
                      matTooltip="从该快照恢复数据"
                      aria-label="回滚到该快照"
                    >
                      <mat-icon>restore_page</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .backup-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #263238;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .subtitle {
      margin: 4px 0 0 0;
      color: #78909c;
      font-size: 14px;
    }
    .loading-section {
      text-align: center;
      padding: 48px;
      color: #78909c;
    }
    .error-section {
      text-align: center;
      padding: 48px;
      color: #c62828;
    }
    .error-section p {
      margin: 12px 0;
    }
    .status-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .status-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .status-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .status-icon.total { background: #e3f2fd; color: #1565c0; }
    .status-icon.time { background: #e8f5e9; color: #2e7d32; }
    .status-icon.storage { background: #fff3e0; color: #e65100; }
    .status-icon.plan { background: #f3e5f5; color: #7b1fa2; }
    .status-info {
      display: flex;
      flex-direction: column;
    }
    .status-value {
      font-size: 20px;
      font-weight: 600;
      color: #263238;
    }
    .status-label {
      font-size: 12px;
      color: #78909c;
      margin-top: 2px;
    }
    .snapshot-card {
      margin-bottom: 24px;
    }
    .snapshot-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #90a4ae;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
    .empty-state p {
      font-size: 16px;
      margin: 8px 0;
    }
    .hint {
      font-size: 13px;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      padding: 24px;
      color: #78909c;
    }
    .table-wrapper {
      overflow-x: auto;
    }
    .snapshot-table {
      width: 100%;
    }
    .snapshot-table .mono {
      font-family: 'Roboto Mono', monospace;
      font-size: 12px;
    }
    .type-chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }
    .type-daily_incremental { background: #e3f2fd; color: #1565c0; }
    .type-weekly_full { background: #f3e5f5; color: #7b1fa2; }
    .type-manual { background: #e8f5e9; color: #2e7d32; }
    .status-chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }
    .status-chip.completed { background: #e8f5e9; color: #2e7d32; }
    .status-chip.in_progress { background: #fff8e1; color: #f57c00; }
    .status-chip.failed { background: #ffebee; color: #c62828; }
    .status-chip.pending { background: #e3f2fd; color: #1565c0; }
    .status-chip.expired { background: #f5f5f5; color: #9e9e9e; }
    @media (max-width: 768px) {
      .status-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
})
export class BackupManagementComponent implements OnInit, OnDestroy {
  orgId!: number;
  loading = true;
  loadingSnapshots = false;
  creatingBackup = false;
  restoring = false;
  error: string | null = null;

  status: BackupStatus | null = null;
  snapshots: BackupSnapshot[] = [];
  displayedColumns = ['snapshot_id', 'label', 'backup_type', 'status', 'file_size', 'created_at', 'actions'];

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private backupService: CloudBackupService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    console.log('[BackupManagement] orgId:', this.orgId);
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.subs.add(
      this.backupService.getStatus().subscribe({
        next: (data) => {
          this.status = data;
          this.loading = false;
          this.loadSnapshots();
        },
        error: (err) => {
          console.error('[BackupManagement] 加载状态失败:', err);
          this.error = '加载备份状态失败，请检查网络连接';
          this.loading = false;
        },
      })
    );
  }

  loadSnapshots(): void {
    this.loadingSnapshots = true;
    this.subs.add(
      this.backupService.listSnapshots().subscribe({
        next: (data) => {
          this.snapshots = data || [];
          this.loadingSnapshots = false;
        },
        error: (err) => {
          console.error('[BackupManagement] 加载快照列表失败:', err);
          this.loadingSnapshots = false;
        },
      })
    );
  }

  openCreateBackupDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '手动创建备份',
        message: '立即创建一次完整备份？此操作将序列化当前组织的所有数据。',
        confirmText: '开始备份',
        cancelText: '取消',
        showInput: true,
        inputLabel: '备份标签（可选）',
        inputPlaceholder: '例如：学期末归档',
      },
    });

    this.subs.add(
      dialogRef.afterClosed().subscribe((result: { confirmed: boolean; inputValue?: string }) => {
        if (result?.confirmed) {
          this.executeBackup(result.inputValue || undefined);
        }
      })
    );
  }

  executeBackup(label?: string): void {
    this.creatingBackup = true;
    this.subs.add(
      this.backupService.createBackup(label).subscribe({
        next: (result) => {
          this.creatingBackup = false;
          this.snackBar.open(`备份已完成：${result.snapshot_id.slice(0, 12)}...`, '关闭', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadSnapshots();
          this.loadData();
        },
        error: (err) => {
          this.creatingBackup = false;
          const msg = err?.error?.detail || '备份失败，请稍后重试';
          this.snackBar.open(msg, '关闭', { duration: 4000, panelClass: ['error-snackbar'] });
          console.error('[BackupManagement] 创建备份失败:', err);
        },
      })
    );
  }

  openRestoreDialog(snapshot: BackupSnapshot): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: '确认回滚',
        message: `从快照 "${snapshot.label || snapshot.snapshot_id.slice(0, 12)}" 恢复数据？回滚前将自动创建安全快照保护当前状态。`,
        confirmText: '确认回滚',
        cancelText: '取消',
        isDestructive: true,
        extraInfo: '此操作将覆盖当前数据，回滚期间建议暂停业务操作。',
      },
    });

    this.subs.add(
      dialogRef.afterClosed().subscribe((result: { confirmed: boolean }) => {
        if (result?.confirmed) {
          this.executeRestore(snapshot.snapshot_id);
        }
      })
    );
  }

  executeRestore(snapshotId: string): void {
    this.restoring = true;
    this.subs.add(
      this.backupService.restoreSnapshot(snapshotId).subscribe({
        next: (result) => {
          this.restoring = false;
          this.snackBar.open(
            `恢复${result.status === 'completed' ? '完成' : '执行中'}，已恢复 ${result.records_restored} 条记录`,
            '关闭',
            { duration: 4000, panelClass: ['success-snackbar'] }
          );
          this.loadSnapshots();
          this.loadData();
        },
        error: (err) => {
          this.restoring = false;
          const msg = err?.error?.detail || '回滚失败，请稍后重试';
          this.snackBar.open(msg, '关闭', { duration: 4000, panelClass: ['error-snackbar'] });
          console.error('[BackupManagement] 回滚失败:', err);
        },
      })
    );
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      daily_incremental: '增量备份',
      weekly_full: '全量备份',
      manual: '手动备份',
    };
    return map[type] || type;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '等待中',
      in_progress: '执行中',
      completed: '已完成',
      failed: '失败',
      expired: '已过期',
    };
    return map[status] || status;
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '暂无';
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }
}
