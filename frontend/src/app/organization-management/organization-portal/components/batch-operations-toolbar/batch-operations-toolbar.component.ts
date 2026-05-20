/**
 * 批量操作工具栏组件
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BatchOperationsService } from '../../services/batch-operations.service';

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
}

@Component({
  selector: 'app-batch-operations-toolbar',
  template: `
    <div class="batch-operations-toolbar">
      <!-- 导入按钮 -->
      <button mat-raised-button color="primary" [matMenuTriggerFor]="importMenu">
        <mat-icon>file_upload</mat-icon>
        导入
      </button>
      <mat-menu #importMenu="matMenu">
        <button mat-menu-item (click)="triggerImport('students')">
          <mat-icon>school</mat-icon>
          <span>导入学生数据</span>
        </button>
        <button mat-menu-item (click)="triggerImport('teachers')">
          <mat-icon>people</mat-icon>
          <span>导入教师数据</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="downloadTemplate('students')">
          <mat-icon>download</mat-icon>
          <span>学生模板</span>
        </button>
        <button mat-menu-item (click)="downloadTemplate('teachers')">
          <mat-icon>download</mat-icon>
          <span>教师模板</span>
        </button>
      </mat-menu>

      <!-- 导出按钮 -->
      <button mat-raised-button color="accent" [matMenuTriggerFor]="exportMenu">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
      <mat-menu #exportMenu="matMenu">
        <button mat-menu-item (click)="triggerExport('students')">
          <mat-icon>school</mat-icon>
          <span>导出学生数据</span>
        </button>
        <button mat-menu-item (click)="triggerExport('teachers')">
          <mat-icon>people</mat-icon>
          <span>导出教师数据</span>
        </button>
      </mat-menu>

      <!-- 批量操作按钮 -->
      <button
        mat-raised-button
        color="warn"
        [matMenuTriggerFor]="batchMenu"
        [disabled]="selectedItems.length === 0"
      >
        <mat-icon>layers</mat-icon>
        批量操作
        <span *ngIf="selectedItems.length > 0" class="badge">{{ selectedItems.length }}</span>
      </button>
      <mat-menu #batchMenu="matMenu">
        <button mat-menu-item (click)="batchDelete()">
          <mat-icon>delete</mat-icon>
          <span>批量删除</span>
        </button>
        <button mat-menu-item (click)="batchUpdateStatus()">
          <mat-icon>edit</mat-icon>
          <span>批量更新状态</span>
        </button>
      </mat-menu>

      <!-- 隐藏的文件输入 -->
      <input
        #fileInput
        type="file"
        accept=".xlsx,.xls"
        style="display: none"
        (change)="handleFileSelect($event)"
      />
    </div>
  `,
  styles: [
    `
      .batch-operations-toolbar {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .badge {
        margin-left: 8px;
        background: #f44336;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 12px;
        min-width: 20px;
        text-align: center;
      }
    `,
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
  ],
})
export class BatchOperationsToolbarComponent {
  @Input() orgId!: number;
  @Input() selectedItems: number[] = [];
  @Output() dataChanged = new EventEmitter<void>();

  constructor(
    private batchService: BatchOperationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  triggerImport(type: 'students' | 'teachers'): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.dataset['importType'] = type;
      fileInput.click();
    }
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const importType = input.dataset['importType'] as 'students' | 'teachers' | undefined;

    if (!file || !importType) return;

    this.processImport(importType, file);

    // 清空 input
    input.value = '';
  }

  processImport(type: 'students' | 'teachers', file: File): void {
    const obs =
      type === 'students'
        ? this.batchService.importStudents(this.orgId, file)
        : this.batchService.importTeachers(this.orgId, file);

    obs.subscribe({
      next: (result: ImportResult) => {
        this.showImportResult(result);
        this.dataChanged.emit();
      },
      error: () => {
        this.snackBar.open('导入失败', '关闭', { duration: 5000 });
      },
    });
  }

  showImportResult(result: ImportResult): void {
    let message = `导入完成！成功 ${result.created} 条，更新 ${result.updated} 条`;
    if (result.failed > 0) {
      message += `，失败 ${result.failed} 条`;
    }
    this.snackBar.open(message, '查看错误', { duration: 10000 });
  }

  downloadTemplate(type: 'students' | 'teachers'): void {
    this.batchService.downloadTemplate(type);
    this.snackBar.open('模板已下载', '关闭', { duration: 3000 });
  }

  triggerExport(type: 'students' | 'teachers'): void {
    const options = {
      format: 'excel' as const,
      includeHeaders: true,
    };

    const obs =
      type === 'students'
        ? this.batchService.exportStudents(this.orgId, options)
        : this.batchService.exportTeachers(this.orgId, options);

    obs.subscribe({
      next: (blob: Blob) => {
        const filename = `${type}_export_${new Date().getTime()}.xlsx`;
        this.batchService.saveFile(blob, filename);
        this.snackBar.open('导出成功', '关闭', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('导出失败', '关闭', { duration: 5000 });
      },
    });
  }

  batchDelete(): void {
    if (this.selectedItems.length === 0) return;

    const confirmed = confirm(
      `确定要删除选中的 ${this.selectedItems.length} 条记录吗？此操作不可恢复。`
    );
    if (!confirmed) return;

    // TODO: 调用批量删除 API
    this.snackBar.open('批量删除功能开发中', '关闭', { duration: 3000 });
  }

  batchUpdateStatus(): void {
    if (this.selectedItems.length === 0) return;

    // TODO: 打开状态更新对话框
    this.snackBar.open('批量更新功能开发中', '关闭', { duration: 3000 });
  }
}
