/**
 * Admin 管理后台 - 审计日志查看
 *
 * 功能：
 * - 多条件筛选（操作类型/用户/IP/风险等级/HTTP方法）
 * - 分页
 * - 导出 CSV
 * - 点击单条日志查看详情（request_body、响应状态等）
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, takeUntil } from 'rxjs/operators';

import {
  AdminBackendService,
  AuditLogEntry,
} from '../core/services/admin-backend.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="audit">
      <header class="audit__header">
        <div>
          <h1>
            <mat-icon>description</mat-icon>
            审计日志
          </h1>
          <p class="audit__subtitle">
            查看最近 {{ hours }} 小时的操作记录，所有操作均有明确的操作人 / IP / 操作类型
          </p>
        </div>
        <button mat-raised-button color="primary" (click)="exportCsv()">
          <mat-icon>download</mat-icon>
          导出 CSV
        </button>
      </header>

      <!-- 筛选栏 -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>最近时间（小时）</mat-label>
              <mat-select [(value)]="hours" (selectionChange)="reload()">
                <mat-option [value]="1">1 小时</mat-option>
                <mat-option [value]="6">6 小时</mat-option>
                <mat-option [value]="24">24 小时</mat-option>
                <mat-option [value]="72">3 天</mat-option>
                <mat-option [value]="168">7 天</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>操作类型</mat-label>
              <mat-select [(value)]="filters.operation" (selectionChange)="reload()">
                <mat-option value="">全部</mat-option>
                <mat-option *ngFor="let op of operations" [value]="op">
                  {{ op }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>风险等级</mat-label>
              <mat-select [(value)]="filters.risk_level" (selectionChange)="reload()">
                <mat-option value="">全部</mat-option>
                <mat-option value="normal">normal</mat-option>
                <mat-option value="warning">warning</mat-option>
                <mat-option value="high">high</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>HTTP 方法</mat-label>
              <mat-select [(value)]="filters.method" (selectionChange)="reload()">
                <mat-option value="">全部</mat-option>
                <mat-option value="GET">GET</mat-option>
                <mat-option value="POST">POST</mat-option>
                <mat-option value="PUT">PUT</mat-option>
                <mat-option value="DELETE">DELETE</mat-option>
                <mat-option value="PATCH">PATCH</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>用户名</mat-label>
              <input
                matInput
                [(ngModel)]="filters.user"
                (input)="userFilter$.next(undefined)"
                placeholder="如 admin"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>IP</mat-label>
              <input
                matInput
                [(ngModel)]="filters.ip"
                (input)="ipFilter$.next(undefined)"
                placeholder="如 192.168.1.1"
              />
            </mat-form-field>

            <button mat-stroked-button color="primary" (click)="resetFilters()">
              <mat-icon>refresh</mat-icon>重置
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 表格 -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>history</mat-icon>
            操作记录（共 {{ total }} 条）
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="32"></mat-spinner>
            <p>加载中...</p>
          </div>
          <table mat-table [dataSource]="rows" *ngIf="!loading" class="audit-table">
            <ng-container matColumnDef="ts">
              <th mat-header-cell *matHeaderCellDef>时间</th>
              <td mat-cell *matCellDef="let r">{{ (r.ts || '') | slice: 0:19 }}</td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>用户</th>
              <td mat-cell *matCellDef="let r">{{ r.user || '<匿名>' }}</td>
            </ng-container>
            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>方法</th>
              <td mat-cell *matCellDef="let r">
                <mat-chip [color]="chipColor(r.method)" class="method-chip">
                  {{ r.method }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="operation">
              <th mat-header-cell *matHeaderCellDef>操作类型</th>
              <td mat-cell *matCellDef="let r">{{ r.operation || r.path }}</td>
            </ng-container>
            <ng-container matColumnDef="ip">
              <th mat-header-cell *matHeaderCellDef>IP</th>
              <td mat-cell *matCellDef="let r">{{ r.ip || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let r">{{ r.status ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="risk_level">
              <th mat-header-cell *matHeaderCellDef>风险</th>
              <td mat-cell *matCellDef="let r">
                <span class="risk-level" [ngClass]="'risk-' + (r.risk_level || 'normal')">
                  {{ r.risk_level || 'normal' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="took_ms">
              <th mat-header-cell *matHeaderCellDef>耗时</th>
              <td mat-cell *matCellDef="let r">{{ r.took_ms ?? '-' }} ms</td>
            </ng-container>
            <ng-container matColumnDef="detail">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button color="primary" (click)="openDetail(r)" matTooltip="查看详情">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div class="empty" *ngIf="!loading && rows.length === 0">
            <p>暂无匹配记录</p>
          </div>

          <mat-paginator
            [length]="total"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50, 100]"
            showFirstLastButtons
            (page)="onPage($event)"
          ></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .audit { padding: 24px; }
      .audit__header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 20px;
      }
      .audit__header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 24px; color: #1f2937; }
      .audit__subtitle { color: #6b7280; margin: 6px 0 0; }
      .filter-card { margin-bottom: 16px; }
      .filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
      .filter-field { min-width: 180px; }

      .audit-table mat-header-cell { background: #f9fafb; color: #374151; font-weight: 600; }
      .audit-table mat-cell, .audit-table mat-header-cell { padding: 8px 12px; }
      .method-chip { font-size: 12px; padding: 0 6px; }
      .risk-level { padding: 2px 8px; border-radius: 10px; color: #fff; font-size: 12px; font-weight: 600; background: #6b7280; }
      .risk-level.risk-high { background: #dc2626; }
      .risk-level.risk-warning { background: #f59e0b; }
      .risk-level.risk-normal { background: #3b82f6; }

      .loading { text-align: center; padding: 24px; color: #6b7280; }
      .empty { text-align: center; color: #9ca3af; padding: 32px 0; }
    `,
  ],
})
export class AdminAuditComponent implements OnInit, OnDestroy {
  hours = 24;
  filters = { operation: '', risk_level: '', method: '', user: '', ip: '' };
  page = 1;
  pageSize = 20;
  total = 0;
  rows: AuditLogEntry[] = [];
  operations: string[] = [];
  loading = false;
  columns = ['ts', 'user', 'method', 'operation', 'ip', 'status', 'risk_level', 'took_ms', 'detail'];

  readonly userFilter$ = new Subject<void>();
  readonly ipFilter$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminBackendService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService
      .getOperations()
      .pipe(catchError(() => []), takeUntil(this.destroy$))
      .subscribe((ops: string[]) => (this.operations = ops));
    this.reload();

    // 文本搜索框防抖
    this.userFilter$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => this.reload());
    this.ipFilter$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => this.reload());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.page = 1;
    this.loadData();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  resetFilters(): void {
    this.hours = 24;
    this.filters = { operation: '', risk_level: '', method: '', user: '', ip: '' };
    this.reload();
  }

  openDetail(entry: AuditLogEntry): void {
    this.dialog.open(AuditDetailDialogComponent, {
      data: entry,
      width: 'min(720px, 94vw)',
    });
  }

  exportCsv(): void {
    this.adminService.exportAuditLogs({
      hours: this.hours,
      operation: this.filters.operation,
      risk_level: this.filters.risk_level,
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 2400 });
      },
      error: () => this.snackBar.open('导出失败，请稍后重试', '关闭', { duration: 3000 }),
    });
  }

  private loadData(): void {
    this.loading = true;
    this.adminService
      .getAuditLogs({
        page: this.page,
        page_size: this.pageSize,
        hours: this.hours,
        operation: this.filters.operation || undefined,
        risk_level: (this.filters.risk_level as any) || undefined,
        method: this.filters.method || undefined,
        user: this.filters.user || undefined,
        ip: this.filters.ip || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: { success: boolean; data: { items: AuditLogEntry[]; total: number } }) => {
          this.rows = resp?.data?.items ?? [];
          this.total = resp?.data?.total ?? 0;
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

  chipColor(method?: string): 'primary' | 'warn' | 'accent' | undefined {
    if (!method) return undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'warn';
    return 'primary';
  }
}

@Component({
  selector: 'app-audit-detail-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>info</mat-icon>
      操作详情
    </h2>
    <mat-dialog-content class="detail">
      <dl>
        <ng-container *ngFor="let kv of flattened">
          <dt>{{ kv.key }}</dt>
          <dd [title]="kv.value">{{ kv.value }}</dd>
        </ng-container>
      </dl>
      <h3>请求体（脱敏）</h3>
      <pre class="body">{{ data?.request_body || '-' }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>关闭</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .detail { padding: 8px 4px; color: #374151; }
      .detail dl { display: grid; grid-template-columns: 180px 1fr; gap: 8px 16px; margin: 0 0 16px; }
      .detail dt { color: #6b7280; font-size: 13px; }
      .detail dd { margin: 0; word-break: break-all; font-size: 14px; }
      .detail h3 { font-size: 14px; color: #6b7280; margin: 16px 0 8px; }
      .body { background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 12px; white-space: pre-wrap; max-height: 280px; overflow: auto; }
    `,
  ],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
})
export class AuditDetailDialogComponent {
  data: AuditLogEntry | null = null;
  flattened: { key: string; value: string }[] = [];

  constructor() {}

  set entry(v: AuditLogEntry) {
    this.data = v;
    const mapping: [string, any][] = [
      ['时间', v.ts],
      ['request_id', v.request_id],
      ['trace_id', v.trace_id],
      ['用户名', v.user],
      ['用户ID', v.user_id],
      ['组织ID', v.org_id],
      ['角色', v.role],
      ['IP', v.ip],
      ['IP归属', v.ip_location],
      ['HTTP 方法', v.method],
      ['路径', v.path],
      ['操作类型', v.operation],
      ['响应状态', v.status],
      ['耗时(ms)', v.took_ms],
      ['风险等级', v.risk_level],
      ['User-Agent', v.user_agent],
    ];
    this.flattened = mapping
      .filter(([, val]) => val !== undefined && val !== null && String(val).length > 0)
      .map(([key, value]) => ({ key, value: String(value) }));
  }
}
