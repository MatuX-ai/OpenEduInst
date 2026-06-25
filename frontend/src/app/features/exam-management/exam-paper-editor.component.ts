import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ExamManagementService, ExamPaper, PaperQuestion, Question,
} from './exam-management.service';

@Component({
  selector: 'app-exam-paper-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="paper-editor-container">
      <div class="page-header">
        <button mat-icon-button [routerLink]="['../..']">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>试卷编辑</h2>
        <button mat-raised-button color="primary" (click)="savePaper()">
          <mat-icon>save</mat-icon> 保存
        </button>
      </div>

      <mat-card class="info-card">
        <div class="info-row">
          <mat-form-field appearance="outline" class="title-field">
            <mat-label>试卷标题</mat-label>
            <input matInput [(ngModel)]="paper.title" placeholder="如：机器人技术等级考试（一级）模拟卷">
          </mat-form-field>
          <mat-form-field appearance="outline" class="num-field">
            <mat-label>考试时长（分钟）</mat-label>
            <input matInput type="number" [(ngModel)]="paper.duration" min="1">
          </mat-form-field>
          <mat-form-field appearance="outline" class="num-field">
            <mat-label>试卷总分</mat-label>
            <input matInput type="number" [(ngModel)]="paper.total_score" min="1">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="desc-field">
          <mat-label>试卷描述</mat-label>
          <textarea matInput [(ngModel)]="paper.description" rows="2"></textarea>
        </mat-form-field>
      </mat-card>

      <div class="editor-layout">
        <!-- 左侧：试题库 -->
        <mat-card class="question-bank-panel">
          <h3>试题库</h3>
          <div class="bank-filter">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>题型</mat-label>
              <mat-select [(ngModel)]="bankFilter.type" (selectionChange)="loadQuestions()">
                <mat-option value="">全部</mat-option>
                <mat-option value="single_choice">选择题</mat-option>
                <mat-option value="true_false">判断题</mat-option>
                <mat-option value="fill_blank">填空题</mat-option>
                <mat-option value="short_answer">简答题</mat-option>
                <mat-option value="coding">编程题</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="bank-list">
            <div *ngFor="let q of availableQuestions" class="bank-item" (click)="addQuestion(q)">
              <div class="bank-item-header">
                <span class="bank-item-type">{{ typeLabel(q.type) }}</span>
                <span class="bank-item-diff">{{ diffLabel(q.difficulty) }}</span>
              </div>
              <div class="bank-item-content">{{ q.content | slice:0:60 }}...</div>
              <mat-icon class="add-icon">add_circle</mat-icon>
            </div>
            <div *ngIf="availableQuestions.length === 0" class="empty-bank">
              暂无可用试题
            </div>
          </div>
          <div class="random-section">
            <mat-form-field appearance="outline" class="random-type">
              <mat-label>题型</mat-label>
              <mat-select [(ngModel)]="randomConfig.type">
                <mat-option value="single_choice">选择题</mat-option>
                <mat-option value="true_false">判断题</mat-option>
                <mat-option value="fill_blank">填空题</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="random-count">
              <mat-label>数量</mat-label>
              <input matInput type="number" [(ngModel)]="randomConfig.count" min="1" max="50">
            </mat-form-field>
            <button mat-raised-button (click)="randomSelect()" [disabled]="!randomConfig.type || !randomConfig.count">
              <mat-icon>shuffle</mat-icon> 随机抽题
            </button>
          </div>
        </mat-card>

        <!-- 右侧：试卷结构 -->
        <mat-card class="paper-structure-panel">
          <h3>试卷结构</h3>
          <div *ngIf="paperQuestions.length === 0" class="empty-structure">
            <mat-icon>library_add</mat-icon>
            <p>从左侧试题库点击添加题目</p>
          </div>

          <div *ngFor="let section of sections; let si = index" class="section-group">
            <div class="section-header">
              <span class="section-title">{{ section.name }}</span>
              <span class="section-count">（共 {{ section.questions.length }} 题，每题 {{ section.questions[0]?.score || 0 }} 分）</span>
            </div>
            <div *ngFor="let pq of section.questions; let qi = index" class="structure-item">
              <span class="item-order">{{ pq.order_no }}.</span>
              <span class="item-content">{{ pq.question?.content | slice:0:50 }}...</span>
              <mat-form-field appearance="outline" class="item-score">
                <input matInput type="number" [(ngModel)]="pq.score" (change)="recalculateTotal()" min="0">
              </mat-form-field>
              <button mat-icon-button (click)="moveUp(pq)" [disabled]="qi === 0">
                <mat-icon>arrow_upward</mat-icon>
              </button>
              <button mat-icon-button (click)="moveDown(pq)" [disabled]="qi === section.questions.length - 1">
                <mat-icon>arrow_downward</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="removeQuestion(pq)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="total-score">
            总分：{{ calculatedTotal }} / {{ paper.total_score }}
            <span *ngIf="calculatedTotal === paper.total_score" class="match">&#10003;</span>
            <span *ngIf="calculatedTotal !== paper.total_score" class="mismatch">&#10007; 不匹配</span>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .paper-editor-container { padding: 0; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; flex: 1; }
    .info-card { margin-bottom: 16px; padding: 16px; }
    .info-row { display: flex; gap: 12px; }
    .title-field { flex: 3; }
    .num-field { flex: 1; min-width: 120px; }
    .desc-field { width: 100%; margin-top: 8px; }
    .editor-layout { display: grid; grid-template-columns: 320px 1fr; gap: 16px; min-height: 500px; }
    .question-bank-panel { padding: 16px; }
    .question-bank-panel h3 { margin: 0 0 12px 0; font-size: 16px; }
    .bank-filter { margin-bottom: 12px; }
    .filter-field { width: 100%; }
    .bank-list { max-height: 400px; overflow-y: auto; }
    .bank-item { display: flex; flex-wrap: wrap; align-items: center; padding: 8px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 6px; cursor: pointer; transition: background 0.15s; position: relative; }
    .bank-item:hover { background: #f0f7ff; border-color: #90caf9; }
    .bank-item-header { display: flex; gap: 6px; width: 100%; margin-bottom: 4px; }
    .bank-item-type { font-size: 11px; color: #1976d2; font-weight: 500; }
    .bank-item-diff { font-size: 11px; color: #ff9800; }
    .bank-item-content { font-size: 12px; color: #333; flex: 1; }
    .add-icon { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #4caf50; font-size: 20px; width: 20px; height: 20px; }
    .empty-bank { text-align: center; padding: 20px; color: #888; font-size: 13px; }
    .random-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
    .random-type { flex: 1; }
    .random-count { width: 80px; }
    .paper-structure-panel { padding: 16px; }
    .paper-structure-panel h3 { margin: 0 0 12px 0; font-size: 16px; }
    .empty-structure { text-align: center; padding: 40px 20px; color: #888; }
    .empty-structure mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .section-group { margin-bottom: 16px; }
    .section-header { font-weight: 600; font-size: 14px; color: #333; margin-bottom: 8px; padding: 6px 0; border-bottom: 2px solid #1976d2; }
    .section-count { font-weight: 400; font-size: 12px; color: #888; }
    .structure-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-bottom: 1px solid #f0f0f0; }
    .structure-item:hover { background: #fafafa; }
    .item-order { font-weight: 600; width: 30px; }
    .item-content { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-score { width: 60px; }
    .total-score { text-align: right; padding: 12px 0; font-size: 16px; font-weight: 600; border-top: 2px solid #eee; margin-top: 12px; }
    .match { color: #4caf50; margin-left: 8px; }
    .mismatch { color: #f44336; margin-left: 8px; }
  `],
})
export class ExamPaperEditorComponent implements OnInit {
  paperId: number = 0;
  paper: any = { title: '', description: '', duration: 60, total_score: 100 };
  paperQuestions: PaperQuestion[] = [];
  availableQuestions: Question[] = [];
  bankFilter: any = { type: '' };
  randomConfig: any = { type: 'single_choice', count: 10 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.paperId = +this.route.snapshot.paramMap.get('paperId')!;
    if (this.paperId) {
      this.loadPaper();
    }
    this.loadQuestions();
  }

  loadPaper(): void {
    this.examService.getPaperDetail(this.paperId).subscribe({
      next: (res) => {
        this.paper = res.paper;
        this.paperQuestions = res.paper.questions || [];
      },
      error: () => this.snackBar.open('加载试卷失败', '关闭', { duration: 3000 }),
    });
  }

  loadQuestions(): void {
    const params: any = { limit: 100 };
    if (this.bankFilter.type) params.type = this.bankFilter.type;
    this.examService.getQuestions(params).subscribe({
      next: (res) => {
        const existingIds = new Set(this.paperQuestions.map(pq => pq.question_id));
        this.availableQuestions = (res.questions || []).filter((q: Question) => !existingIds.has(q.id));
      },
      error: () => this.snackBar.open('加载试题库失败', '关闭', { duration: 3000 }),
    });
  }

  addQuestion(q: Question): void {
    this.examService.addQuestionToPaper(this.paperId, {
      question_id: q.id,
      score: q.score,
      section: this.sectionLabel(q.type),
    }).subscribe({
      next: () => {
        this.loadPaper();
        this.loadQuestions();
      },
      error: () => this.snackBar.open('添加试题失败', '关闭', { duration: 3000 }),
    });
  }

  removeQuestion(pq: PaperQuestion): void {
    this.examService.removeQuestionFromPaper(this.paperId, pq.id).subscribe({
      next: () => {
        this.loadPaper();
        this.loadQuestions();
      },
      error: () => this.snackBar.open('移除试题失败', '关闭', { duration: 3000 }),
    });
  }

  randomSelect(): void {
    this.examService.randomSelectQuestions(this.paperId, {
      q_type: this.randomConfig.type,
      count: this.randomConfig.count,
      section: this.sectionLabel(this.randomConfig.type),
    }).subscribe({
      next: (res: any) => {
        this.snackBar.open(res.message || '随机抽题完成', '关闭', { duration: 2000 });
        this.loadPaper();
        this.loadQuestions();
      },
      error: () => this.snackBar.open('随机抽题失败', '关闭', { duration: 3000 }),
    });
  }

  moveUp(pq: PaperQuestion): void {
    const idx = this.paperQuestions.findIndex(p => p.id === pq.id);
    if (idx <= 0) return;
    const ids = this.paperQuestions.map(p => p.question_id);
    [ids[idx], ids[idx - 1]] = [ids[idx - 1], ids[idx]];
    this.examService.reorderQuestions(this.paperId, ids).subscribe({
      next: () => this.loadPaper(),
    });
  }

  moveDown(pq: PaperQuestion): void {
    const idx = this.paperQuestions.findIndex(p => p.id === pq.id);
    if (idx >= this.paperQuestions.length - 1) return;
    const ids = this.paperQuestions.map(p => p.question_id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    this.examService.reorderQuestions(this.paperId, ids).subscribe({
      next: () => this.loadPaper(),
    });
  }

  savePaper(): void {
    this.examService.updatePaper(this.paperId, this.paper).subscribe({
      next: () => this.snackBar.open('保存成功', '关闭', { duration: 2000 }),
      error: () => this.snackBar.open('保存失败', '关闭', { duration: 3000 }),
    });
  }

  recalculateTotal(): void {
    this.calculatedTotal = this.paperQuestions.reduce((sum, pq) => sum + (pq.score || 0), 0);
  }

  get calculatedTotal(): number {
    return this.paperQuestions.reduce((sum, pq) => sum + (pq.score || 0), 0);
  }

  get sections(): { name: string; questions: PaperQuestion[] }[] {
    const map = new Map<string, PaperQuestion[]>();
    for (const pq of this.paperQuestions) {
      const key = pq.section || '默认';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(pq);
    }
    return Array.from(map.entries()).map(([name, questions]) => ({ name, questions }));
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

  sectionLabel(type: string): string {
    const labels: Record<string, string> = {
      single_choice: '一、选择题', multi_choice: '一、选择题', true_false: '二、判断题',
      fill_blank: '三、填空题', short_answer: '四、简答题', essay: '五、论述题', coding: '六、编程题',
    };
    return labels[type] || '题目';
  }
}