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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { ExamManagementService, Question } from './exam-management.service';

@Component({
  selector: 'app-exam-question-bank',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatTableModule, MatPaginatorModule, MatCheckboxModule, MatTooltipModule,
    MatProgressBarModule, MatExpansionModule, MatBadgeModule,
  ],
  template: `
    <div class="question-bank-container">
      <div class="page-header">
        <h2>题库浏览</h2>
        <button mat-raised-button color="primary" (click)="syncQuestions()" [disabled]="syncing">
          <mat-icon>sync</mat-icon> 同步题库
        </button>
      </div>

      <mat-progress-bar *ngIf="syncing" mode="indeterminate" style="margin-bottom: 16px;"></mat-progress-bar>

      <!-- 筛选区域 -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>科目</mat-label>
            <mat-select [(ngModel)]="filters.subject" (selectionChange)="loadQuestions()">
              <mat-option value="">全部</mat-option>
              <mat-option value="机器人1级">机器人1级</mat-option>
              <mat-option value="机器人2级">机器人2级</mat-option>
              <mat-option value="Python">Python</mat-option>
              <mat-option value="Scratch">Scratch</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>难度</mat-label>
            <mat-select [(ngModel)]="filters.difficulty" (selectionChange)="loadQuestions()">
              <mat-option value="">全部</mat-option>
              <mat-option value="easy">简单</mat-option>
              <mat-option value="medium">中等</mat-option>
              <mat-option value="hard">困难</mat-option>
              <mat-option value="expert">专家</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>题型</mat-label>
            <mat-select [(ngModel)]="filters.type" (selectionChange)="loadQuestions()">
              <mat-option value="">全部</mat-option>
              <mat-option value="single_choice">选择题</mat-option>
              <mat-option value="multi_choice">多选题</mat-option>
              <mat-option value="true_false">判断题</mat-option>
              <mat-option value="fill_blank">填空题</mat-option>
              <mat-option value="short_answer">简答题</mat-option>
              <mat-option value="essay">论述题</mat-option>
              <mat-option value="coding">编程题</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field search-field">
            <mat-label>关键词搜索</mat-label>
            <input matInput [(ngModel)]="filters.keyword" placeholder="搜索题干内容..." (keyup.enter)="loadQuestions()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="filter-actions">
          <button mat-button (click)="resetFilters()">重置</button>
          <span class="result-count">共 {{ totalQuestions }} 题，已选 {{ selectedQuestions.size }} 题</span>
        </div>
      </mat-card>

      <!-- 试题列表 -->
      <mat-card class="question-list-card">
        <div *ngIf="loading" class="loading-indicator">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>加载中...</p>
        </div>

        <div *ngIf="!loading && questions.length === 0" class="empty-state">
          <mat-icon>quiz</mat-icon>
          <p>暂无试题，请先同步题库或创建试题</p>
        </div>

        <div *ngFor="let q of questions; let i = index" class="question-item">
          <mat-checkbox
            [checked]="selectedQuestions.has(q.id)"
            (change)="toggleSelect(q)">
          </mat-checkbox>
          <div class="question-content">
            <div class="question-meta">
              <span class="question-index">{{ (pageIndex * pageSize) + i + 1 }}.</span>
              <mat-chip-listbox>
                <mat-chip-option [ngClass]="'type-' + q.type" disabled>{{ typeLabel(q.type) }}</mat-chip-option>
                <mat-chip-option [ngClass]="'difficulty-' + q.difficulty" disabled>{{ diffLabel(q.difficulty) }}</mat-chip-option>
                <mat-chip-option disabled>{{ q.subject || '未分类' }}</mat-chip-option>
              </mat-chip-listbox>
            </div>
            <div class="question-body">{{ q.content }}</div>
            <div *ngIf="q.options" class="question-options">
              <span *ngFor="let opt of q.options" class="option-item">
                {{ opt.label }}. {{ opt.content }}
              </span>
            </div>
            <div class="question-actions">
              <button mat-button color="primary" (click)="addToPaper(q)" *ngIf="!selectedQuestions.has(q.id)">
                <mat-icon>add</mat-icon> 加入试卷
              </button>
              <button mat-button color="warn" (click)="removeFromPaper(q)" *ngIf="selectedQuestions.has(q.id)">
                <mat-icon>remove</mat-icon> 移除
              </button>
              <button mat-button (click)="expandedQuestion = expandedQuestion === q.id ? null : q.id">
                <mat-icon>{{ expandedQuestion === q.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                详情
              </button>
            </div>
            <div *ngIf="expandedQuestion === q.id" class="question-detail">
              <p><strong>答案：</strong>{{ q.answer }}</p>
              <p *ngIf="q.answer_analysis"><strong>解析：</strong>{{ q.answer_analysis }}</p>
              <p><strong>分值：</strong>{{ q.score }} 分</p>
            </div>
          </div>
        </div>

        <mat-paginator
          [length]="totalQuestions"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)">
        </mat-paginator>
      </mat-card>

      <!-- 已选试题托盘 -->
      <div class="selected-tray" *ngIf="selectedQuestions.size > 0">
        <mat-card>
          <div class="tray-header">
            <span>已选试题 ({{ selectedQuestions.size }})</span>
            <div class="tray-actions">
              <button mat-button (click)="clearSelection()">清空</button>
              <button mat-raised-button color="primary" [routerLink]="['../papers']">创建试卷</button>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .question-bank-container { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .filter-field { flex: 1; min-width: 150px; }
    .search-field { flex: 2; min-width: 200px; }
    .filter-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .result-count { color: #666; font-size: 13px; }
    .question-list-card { padding: 0; }
    .loading-indicator { text-align: center; padding: 40px; }
    .loading-indicator p { margin-top: 12px; color: #888; }
    .empty-state { text-align: center; padding: 60px 20px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .question-item { display: flex; padding: 16px; border-bottom: 1px solid #eee; gap: 12px; }
    .question-item:hover { background: #fafafa; }
    .question-content { flex: 1; }
    .question-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .question-index { font-weight: 600; color: #333; min-width: 30px; }
    .question-body { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .question-options { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; }
    .option-item { font-size: 13px; color: #555; }
    .question-actions { display: flex; gap: 8px; }
    .question-detail { margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; }
    .question-detail p { margin: 4px 0; }
    .selected-tray { position: fixed; bottom: 0; left: 240px; right: 0; z-index: 100; }
    .selected-tray mat-card { border-radius: 8px 8px 0 0; padding: 12px 24px; box-shadow: 0 -2px 12px rgba(0,0,0,0.1); }
    .tray-header { display: flex; justify-content: space-between; align-items: center; }
    .tray-actions { display: flex; gap: 8px; }
    mat-chip-listbox { display: inline-flex; gap: 4px; }
    ::ng-deep .type-single_choice .mdc-evolution-chip__text-label { color: #1976d2; }
    ::ng-deep .type-true_false .mdc-evolution-chip__text-label { color: #388e3c; }
    ::ng-deep .type-fill_blank .mdc-evolution-chip__text-label { color: #f57c00; }
    ::ng-deep .type-coding .mdc-evolution-chip__text-label { color: #7b1fa2; }
    ::ng-deep .difficulty-easy .mdc-evolution-chip__text-label { color: #4caf50; }
    ::ng-deep .difficulty-medium .mdc-evolution-chip__text-label { color: #ff9800; }
    ::ng-deep .difficulty-hard .mdc-evolution-chip__text-label { color: #f44336; }
    ::ng-deep .difficulty-expert .mdc-evolution-chip__text-label { color: #9c27b0; }
  `],
})
export class ExamQuestionBankComponent implements OnInit {
  questions: Question[] = [];
  totalQuestions = 0;
  pageIndex = 0;
  pageSize = 20;
  loading = false;
  syncing = false;
  expandedQuestion: number | null = null;
  selectedQuestions = new Set<number>();

  filters: any = {
    subject: '',
    difficulty: '',
    type: '',
    keyword: '',
  };

  constructor(
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    const params: any = {
      skip: this.pageIndex * this.pageSize,
      limit: this.pageSize,
    };
    if (this.filters.subject) params.subject = this.filters.subject;
    if (this.filters.difficulty) params.difficulty = this.filters.difficulty;
    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.keyword) params.keyword = this.filters.keyword;

    this.examService.getQuestions(params).subscribe({
      next: (res) => {
        this.questions = res.questions || [];
        this.totalQuestions = res.total || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载试题失败', '关闭', { duration: 3000 });
      },
    });
  }

  syncQuestions(): void {
    this.syncing = true;
    this.examService.syncQuestions(undefined, this.filters.subject || undefined).subscribe({
      next: (res: any) => {
        this.syncing = false;
        this.snackBar.open(res.message || '同步完成', '关闭', { duration: 3000 });
        this.loadQuestions();
      },
      error: () => {
        this.syncing = false;
        this.snackBar.open('同步失败', '关闭', { duration: 3000 });
      },
    });
  }

  toggleSelect(q: Question): void {
    if (this.selectedQuestions.has(q.id)) {
      this.selectedQuestions.delete(q.id);
    } else {
      this.selectedQuestions.add(q.id);
    }
  }

  addToPaper(q: Question): void {
    this.selectedQuestions.add(q.id);
  }

  removeFromPaper(q: Question): void {
    this.selectedQuestions.delete(q.id);
  }

  clearSelection(): void {
    this.selectedQuestions.clear();
  }

  resetFilters(): void {
    this.filters = { subject: '', difficulty: '', type: '', keyword: '' };
    this.pageIndex = 0;
    this.loadQuestions();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadQuestions();
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      single_choice: '选择题', multi_choice: '多选题', true_false: '判断题',
      fill_blank: '填空题', short_answer: '简答题', essay: '论述题', coding: '编程题',
    };
    return labels[type] || type;
  }

  diffLabel(diff: string): string {
    const labels: Record<string, string> = {
      easy: '简单', medium: '中等', hard: '困难', expert: '专家',
    };
    return labels[diff] || diff;
  }
}