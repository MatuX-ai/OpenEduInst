import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ExamManagementService, ExamPaper } from './exam-management.service';

@Component({
  selector: 'app-exam-paper-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatTableModule, MatDialogModule, MatTooltipModule,
  ],
  template: `
    <div class="paper-list-container">
      <div class="page-header">
        <h2>试卷管理</h2>
        <button mat-raised-button color="primary" (click)="createPaper()">
          <mat-icon>add</mat-icon> 创建试卷
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadPapers()">
              <mat-option value="">全部</mat-option>
              <mat-option value="draft">草稿</mat-option>
              <mat-option value="published">已发布</mat-option>
              <mat-option value="archived">已归档</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div *ngIf="papers.length === 0" class="empty-state">
        <mat-icon>description</mat-icon>
        <p>暂无试卷，点击"创建试卷"开始</p>
      </div>

      <div class="paper-grid">
        <mat-card *ngFor="let paper of papers" class="paper-card">
          <mat-card-header>
            <mat-card-title>{{ paper.title }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip-listbox>
                <mat-chip-option [ngClass]="'status-' + paper.status" disabled>
                  {{ statusLabel(paper.status) }}
                </mat-chip-option>
              </mat-chip-listbox>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="paper-info">
              <span><mat-icon>timer</mat-icon> {{ paper.duration }} 分钟</span>
              <span><mat-icon>grade</mat-icon> {{ paper.total_score }} 分</span>
              <span><mat-icon>calendar_today</mat-icon> {{ paper.create_time | date:'yyyy-MM-dd' }}</span>
            </div>
            <p *ngIf="paper.description" class="paper-desc">{{ paper.description }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button [routerLink]="['../papers', paper.id, 'edit']">
              <mat-icon>edit</mat-icon> 编辑
            </button>
            <button mat-button [routerLink]="['../papers', paper.id]">
              <mat-icon>visibility</mat-icon> 预览
            </button>
            <button mat-button color="warn" (click)="deletePaper(paper)" *ngIf="paper.status === 'draft'">
              <mat-icon>delete</mat-icon> 删除
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .paper-list-container { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filter-row { display: flex; gap: 12px; }
    .filter-field { min-width: 200px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .paper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .paper-card { cursor: pointer; transition: box-shadow 0.2s; }
    .paper-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .paper-info { display: flex; gap: 16px; margin: 8px 0; font-size: 13px; color: #666; }
    .paper-info span { display: flex; align-items: center; gap: 4px; }
    .paper-info mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .paper-desc { color: #888; font-size: 13px; margin-top: 8px; }
    mat-card-actions { display: flex; gap: 4px; }
    ::ng-deep .status-draft .mdc-evolution-chip__text-label { color: #ff9800; }
    ::ng-deep .status-published .mdc-evolution-chip__text-label { color: #4caf50; }
    ::ng-deep .status-archived .mdc-evolution-chip__text-label { color: #9e9e9e; }
  `],
})
export class ExamPaperListComponent implements OnInit {
  papers: ExamPaper[] = [];
  statusFilter = '';

  constructor(
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadPapers();
  }

  loadPapers(): void {
    this.examService.getPapers(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.papers = res.papers || [];
      },
      error: () => {
        this.snackBar.open('加载试卷失败', '关闭', { duration: 3000 });
      },
    });
  }

  createPaper(): void {
    const title = prompt('请输入试卷标题：');
    if (!title) return;
    this.examService.createPaper({ title, duration: 60, total_score: 100 }).subscribe({
      next: () => {
        this.snackBar.open('试卷创建成功', '关闭', { duration: 2000 });
        this.loadPapers();
      },
      error: () => {
        this.snackBar.open('创建失败', '关闭', { duration: 3000 });
      },
    });
  }

  deletePaper(paper: ExamPaper): void {
    if (!confirm(`确定删除试卷"${paper.title}"吗？`)) return;
    this.examService.deletePaper(paper.id).subscribe({
      next: () => {
        this.snackBar.open('试卷已删除', '关闭', { duration: 2000 });
        this.loadPapers();
      },
      error: () => {
        this.snackBar.open('删除失败', '关闭', { duration: 3000 });
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { draft: '草稿', published: '已发布', archived: '已归档' };
    return labels[status] || status;
  }
}