import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExamManagementService } from './exam-management.service';

@Component({
  selector: 'app-exam-grading',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSnackBarModule,
  ],
  template: `
    <div class="grading-container">
      <div class="page-header">
        <button mat-icon-button [routerLink]="['../..']">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>阅卷详情</h2>
      </div>

      <div *ngIf="loading" class="loading">加载中...</div>

      <div *ngIf="!loading && result">
        <mat-card class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="s-label">学生ID</span>
              <span class="s-value">{{ result.student_id }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">客观题得分</span>
              <span class="s-value">{{ result.objective_score ?? '-' }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">主观题得分</span>
              <span class="s-value">{{ result.subjective_score ?? '-' }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">总分</span>
              <span class="s-value highlight">{{ result.score ?? '-' }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">状态</span>
              <span class="s-value">{{ result.status }}</span>
            </div>
          </div>
        </mat-card>

        <h3 class="section-title">答题详情</h3>
        <mat-card *ngFor="let qd of questionsDetail; let i = index" class="question-card">
          <div class="q-header">
            <span class="q-num">第 {{ i + 1 }} 题</span>
            <span class="q-type">{{ qd.question_type }}</span>
            <span class="q-score">（{{ qd.score }} 分）</span>
          </div>
          <div class="q-body">{{ qd.question_content }}</div>

          <div *ngIf="qd.options" class="q-options">
            <div *ngFor="let opt of qd.options" class="opt-item"
                 [class.correct]="opt.label === qd.correct_answer"
                 [class.wrong]="qd.student_answer && opt.label === qd.student_answer && opt.label !== qd.correct_answer">
              {{ opt.label }}. {{ opt.content }}
            </div>
          </div>

          <div class="q-answer-section">
            <div class="answer-row">
              <span class="answer-label">正确答案：</span>
              <span class="answer-value correct-answer">{{ qd.correct_answer || '(未设置)' }}</span>
            </div>
            <div class="answer-row">
              <span class="answer-label">学生答案：</span>
              <span class="answer-value" [class.student-correct]="qd.student_answer === qd.correct_answer"
                    [class.student-wrong]="qd.student_answer && qd.student_answer !== qd.correct_answer">
                {{ qd.student_answer || '(未作答)' }}
              </span>
            </div>
            <div *ngIf="qd.answer_analysis" class="answer-row">
              <span class="answer-label">解析：</span>
              <span class="answer-value analysis">{{ qd.answer_analysis }}</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="grading-card" *ngIf="result.status !== 'graded'">
          <h3>主观题批改</h3>
          <div class="grading-row">
            <mat-form-field appearance="outline" class="score-field">
              <mat-label>主观题得分</mat-label>
              <input matInput type="number" [(ngModel)]="subjectiveScore" min="0">
            </mat-form-field>
          </div>
          <div class="grading-row">
            <mat-form-field appearance="outline" class="feedback-field">
              <mat-label>评语</mat-label>
              <textarea matInput [(ngModel)]="feedback" rows="3"></textarea>
            </mat-form-field>
          </div>
          <button mat-raised-button color="primary" (click)="submitGrade()">
            <mat-icon>check</mat-icon> 提交批改
          </button>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .grading-container { padding: 0; max-width: 900px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .summary-card { margin-bottom: 16px; padding: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
    .summary-item { text-align: center; }
    .s-label { display: block; font-size: 12px; color: #888; }
    .s-value { display: block; font-size: 20px; font-weight: 600; color: #333; margin-top: 4px; }
    .s-value.highlight { color: #1a237e; font-size: 28px; }
    .section-title { margin: 0 0 12px; font-size: 16px; }
    .question-card { margin-bottom: 12px; padding: 16px; }
    .q-header { margin-bottom: 8px; }
    .q-num { font-weight: 600; }
    .q-type { margin-left: 8px; color: #1976d2; font-size: 13px; }
    .q-score { margin-left: 6px; color: #888; font-size: 13px; }
    .q-body { font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
    .q-options { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .opt-item { padding: 6px 12px; border-radius: 4px; font-size: 13px; }
    .opt-item.correct { background: #e8f5e9; color: #2e7d32; }
    .opt-item.wrong { background: #ffebee; color: #c62828; }
    .q-answer-section { background: #f5f5f5; padding: 12px; border-radius: 8px; }
    .answer-row { margin-bottom: 6px; }
    .answer-label { font-weight: 500; font-size: 13px; }
    .answer-value { font-size: 13px; }
    .correct-answer { color: #2e7d32; }
    .student-correct { color: #2e7d32; }
    .student-wrong { color: #c62828; }
    .analysis { color: #555; }
    .grading-card { margin-top: 16px; padding: 20px; }
    .grading-card h3 { margin: 0 0 16px 0; font-size: 16px; }
    .grading-row { margin-bottom: 12px; }
    .score-field { width: 200px; }
    .feedback-field { width: 100%; }
  `],
})
export class ExamGradingComponent implements OnInit {
  resultId: number = 0;
  result: any = null;
  questionsDetail: any[] = [];
  loading = true;
  subjectiveScore: number = 0;
  feedback: string = '';

  constructor(
    private route: ActivatedRoute,
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.resultId = +this.route.snapshot.paramMap.get('resultId')!;
    this.loadResultDetail();
  }

  loadResultDetail(): void {
    this.loading = true;
    this.examService.getResultDetail(this.resultId).subscribe({
      next: (res) => {
        this.result = res.result;
        this.questionsDetail = res.result.questions_detail || [];
        this.subjectiveScore = this.result.subjective_score || 0;
        this.feedback = this.result.feedback || '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载失败', '关闭', { duration: 3000 });
      },
    });
  }

  submitGrade(): void {
    this.examService.gradeResult(this.resultId, {
      subjective_score: this.subjectiveScore,
      feedback: this.feedback,
    }).subscribe({
      next: () => {
        this.snackBar.open('批改完成', '关闭', { duration: 2000 });
        this.loadResultDetail();
      },
      error: () => {
        this.snackBar.open('批改失败', '关闭', { duration: 3000 });
      },
    });
  }
}