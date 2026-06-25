import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ExamManagementService, ExamTask, ExamPaper } from './exam-management.service';

@Component({
  selector: 'app-exam-task-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="task-list-container">
      <div class="page-header">
        <h2>考试管理</h2>
        <button mat-raised-button color="primary" [routerLink]="['../tasks/create']">
          <mat-icon>add</mat-icon> 创建考试
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadTasks()">
              <mat-option value="">全部</mat-option>
              <mat-option value="pending">待开始</mat-option>
              <mat-option value="in_progress">进行中</mat-option>
              <mat-option value="ended">已结束</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div *ngIf="tasks.length === 0" class="empty-state">
        <mat-icon>assignment</mat-icon>
        <p>暂无考试任务</p>
      </div>

      <div class="task-grid">
        <mat-card *ngFor="let task of tasks" class="task-card">
          <mat-card-header>
            <mat-card-title>{{ task.title }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip-listbox>
                <mat-chip-option [ngClass]="'status-' + task.status" disabled>
                  {{ statusLabel(task.status) }}
                </mat-chip-option>
              </mat-chip-listbox>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="task-info">
              <div><mat-icon>description</mat-icon> {{ task.paper?.title || '未知试卷' }}</div>
              <div><mat-icon>schedule</mat-icon> {{ task.start_time | date:'yyyy-MM-dd HH:mm' }} ~ {{ task.end_time | date:'MM-dd HH:mm' }}</div>
              <div><mat-icon>timer</mat-icon> {{ task.duration }} 分钟</div>
              <div><mat-icon>{{ task.mode === 'online' ? 'computer' : 'print' }}</mat-icon> {{ task.mode === 'online' ? '线上考试' : '线下考试' }}</div>
              <div><mat-icon>people</mat-icon> {{ (task.student_ids?.length || 0) }} 名学生</div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button [routerLink]="['../tasks', task.id, 'results']" *ngIf="task.status === 'ended'">
              <mat-icon>assessment</mat-icon> 成绩
            </button>
            <button mat-button color="warn" (click)="cancelTask(task)" *ngIf="task.status === 'pending'">
              <mat-icon>cancel</mat-icon> 取消
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .task-list-container { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filter-row { display: flex; gap: 12px; }
    .filter-field { min-width: 200px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .task-card { transition: box-shadow 0.2s; }
    .task-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .task-info { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; font-size: 13px; color: #555; }
    .task-info div { display: flex; align-items: center; gap: 6px; }
    .task-info mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }
    mat-card-actions { display: flex; gap: 4px; }
    ::ng-deep .status-pending .mdc-evolution-chip__text-label { color: #ff9800; }
    ::ng-deep .status-in_progress .mdc-evolution-chip__text-label { color: #2196f3; }
    ::ng-deep .status-ended .mdc-evolution-chip__text-label { color: #9e9e9e; }
  `],
})
export class ExamTaskListComponent implements OnInit {
  tasks: ExamTask[] = [];
  statusFilter = '';

  constructor(
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.examService.getTasks(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.tasks = res.tasks || [];
      },
      error: () => {
        this.snackBar.open('加载考试任务失败', '关闭', { duration: 3000 });
      },
    });
  }

  cancelTask(task: ExamTask): void {
    if (!confirm(`确定取消考试"${task.title}"吗？`)) return;
    this.examService.cancelTask(task.id).subscribe({
      next: () => {
        this.snackBar.open('考试已取消', '关闭', { duration: 2000 });
        this.loadTasks();
      },
      error: () => {
        this.snackBar.open('取消失败', '关闭', { duration: 3000 });
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { pending: '待开始', in_progress: '进行中', ended: '已结束' };
    return labels[status] || status;
  }
}