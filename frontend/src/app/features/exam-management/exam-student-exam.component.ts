import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { ExamManagementService } from './exam-management.service';

@Component({
  selector: 'app-exam-student-exam',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatRadioModule,
  ],
  template: `
    <div class="exam-container">
      <!-- 考试说明页 -->
      <mat-card *ngIf="!examStarted && !examSubmitted" class="exam-intro">
        <h2>{{ task?.title }}</h2>
        <div class="intro-info">
          <div><mat-icon>timer</mat-icon> 考试时长：{{ task?.duration }} 分钟</div>
          <div><mat-icon>quiz</mat-icon> 题目数量：{{ questions.length }} 题</div>
          <div><mat-icon>grade</mat-icon> 总分：{{ task?.paper?.total_score }} 分</div>
          <div><mat-icon>info</mat-icon> 请确保网络稳定，答题进度将自动保存</div>
        </div>
        <button mat-raised-button color="primary" (click)="startExam()" class="start-btn">
          <mat-icon>play_arrow</mat-icon> 开始考试
        </button>
      </mat-card>

      <!-- 考试中 -->
      <div *ngIf="examStarted && !examSubmitted" class="exam-body">
        <div class="exam-header">
          <h3>{{ task?.title }}</h3>
          <div class="timer" [class.warning]="remainingSeconds < 600" [class.danger]="remainingSeconds < 300">
            <mat-icon>timer</mat-icon>
            {{ formatTime(remainingSeconds) }}
          </div>
          <div class="progress-info">
            {{ answeredCount }} / {{ questions.length }} 题已答
          </div>
        </div>

        <div class="exam-content">
          <!-- 题号导航 -->
          <div class="question-nav">
            <button
              *ngFor="let q of questions; let i = index"
              [class.active]="currentIndex === i"
              [class.answered]="answers[q.pq_id]"
              (click)="currentIndex = i"
              class="nav-btn">
              {{ i + 1 }}
            </button>
          </div>

          <!-- 题目内容 -->
          <div class="question-area" *ngIf="currentQuestion">
            <div class="question-header">
              <span class="q-num">第 {{ currentIndex + 1 }} 题</span>
              <span class="q-type">{{ typeLabel(currentQuestion.type) }}</span>
              <span class="q-score">（{{ currentQuestion.score }} 分）</span>
            </div>
            <div class="question-body" [innerHTML]="currentQuestion.content"></div>

            <!-- 选择题 -->
            <div *ngIf="isChoiceType(currentQuestion.type)" class="options-list">
              <div *ngFor="let opt of currentQuestion.options" class="option-item"
                   [class.selected]="answers[currentQuestion.pq_id] === opt.label"
                   (click)="answers[currentQuestion.pq_id] = opt.label">
                <span class="option-label">{{ opt.label }}</span>
                <span class="option-content">{{ opt.content }}</span>
              </div>
            </div>

            <!-- 判断题 -->
            <div *ngIf="currentQuestion.type === 'true_false'" class="options-list">
              <div class="option-item" [class.selected]="answers[currentQuestion.pq_id] === 'true'"
                   (click)="answers[currentQuestion.pq_id] = 'true'">
                <span class="option-label">✓</span>
                <span class="option-content">正确</span>
              </div>
              <div class="option-item" [class.selected]="answers[currentQuestion.pq_id] === 'false'"
                   (click)="answers[currentQuestion.pq_id] = 'false'">
                <span class="option-label">✗</span>
                <span class="option-content">错误</span>
              </div>
            </div>

            <!-- 填空题/简答题/编程题 -->
            <div *ngIf="isTextType(currentQuestion.type)" class="text-answer">
              <textarea
                [(ngModel)]="answers[currentQuestion.pq_id]"
                rows="6"
                placeholder="请输入答案..."
                class="answer-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <div class="exam-footer">
          <button mat-button (click)="prevQuestion()" [disabled]="currentIndex === 0">
            <mat-icon>chevron_left</mat-icon> 上一题
          </button>
          <button mat-button (click)="nextQuestion()" [disabled]="currentIndex === questions.length - 1">
            下一题 <mat-icon>chevron_right</mat-icon>
          </button>
          <div class="spacer"></div>
          <button mat-raised-button color="warn" (click)="submitExam()" class="submit-btn">
            <mat-icon>done</mat-icon> 提交试卷
          </button>
        </div>
      </div>

      <!-- 提交成功 -->
      <mat-card *ngIf="examSubmitted" class="exam-done">
        <mat-icon class="done-icon">check_circle</mat-icon>
        <h2>考试已提交</h2>
        <p *ngIf="result?.objective_score !== null">
          客观题得分：{{ result?.objective_score }} 分
        </p>
        <p>请等待教师批改主观题后查看完整成绩。</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .exam-container { max-width: 900px; margin: 0 auto; }
    .exam-intro { text-align: center; padding: 40px; }
    .exam-intro h2 { margin-bottom: 24px; }
    .intro-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; font-size: 15px; color: #555; }
    .intro-info div { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .start-btn { padding: 12px 48px; font-size: 16px; }
    .exam-body { background: #fff; border-radius: 12px; overflow: hidden; }
    .exam-header { display: flex; align-items: center; gap: 20px; padding: 16px 24px; background: #1a237e; color: #fff; }
    .exam-header h3 { margin: 0; flex: 1; font-size: 16px; }
    .timer { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .timer.warning { color: #ffa726; }
    .timer.danger { color: #ef5350; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .progress-info { font-size: 13px; opacity: 0.8; }
    .exam-content { display: flex; min-height: 400px; }
    .question-nav { width: 60px; padding: 16px 8px; background: #f5f5f5; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-btn { width: 40px; height: 40px; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
    .nav-btn.active { background: #1a237e; color: #fff; border-color: #1a237e; }
    .nav-btn.answered { border-color: #4caf50; }
    .nav-btn.answered::after { content: ''; display: block; width: 6px; height: 6px; background: #4caf50; border-radius: 50%; margin: 2px auto 0; }
    .question-area { flex: 1; padding: 24px; }
    .question-header { margin-bottom: 16px; }
    .q-num { font-weight: 600; font-size: 16px; }
    .q-type { margin-left: 12px; color: #1976d2; font-size: 13px; }
    .q-score { margin-left: 8px; color: #888; font-size: 13px; }
    .question-body { font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
    .options-list { display: flex; flex-direction: column; gap: 8px; }
    .option-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .option-item:hover { border-color: #90caf9; background: #f5f8ff; }
    .option-item.selected { border-color: #1976d2; background: #e3f2fd; }
    .option-label { font-weight: 600; font-size: 16px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 50%; }
    .option-item.selected .option-label { background: #1976d2; color: #fff; }
    .text-answer { margin-top: 12px; }
    .answer-textarea { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; resize: vertical; box-sizing: border-box; }
    .answer-textarea:focus { border-color: #1976d2; outline: none; }
    .exam-footer { display: flex; align-items: center; padding: 16px 24px; background: #fafafa; border-top: 1px solid #eee; }
    .spacer { flex: 1; }
    .submit-btn { padding: 8px 32px; }
    .exam-done { text-align: center; padding: 60px 40px; }
    .done-icon { font-size: 64px; width: 64px; height: 64px; color: #4caf50; margin-bottom: 16px; }
    .exam-done h2 { margin: 0 0 12px; }
    .exam-done p { color: #666; }
  `],
})
export class ExamStudentExamComponent implements OnInit, OnDestroy {
  taskId: number = 0;
  task: any = null;
  questions: any[] = [];
  answers: any = {};
  result: any = null;
  resultId: number = 0;

  examStarted = false;
  examSubmitted = false;
  currentIndex = 0;
  remainingSeconds = 0;
  private timerInterval: any;
  private saveInterval: any;

  constructor(
    private route: ActivatedRoute,
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.taskId = +this.route.snapshot.paramMap.get('taskId')!;
  }

  startExam(): void {
    this.examService.startExam(this.taskId).subscribe({
      next: (res) => {
        this.task = res.task;
        this.questions = res.questions || [];
        this.resultId = res.result_id;
        this.answers = {};
        this.remainingSeconds = (this.task.duration || 60) * 60;
        this.examStarted = true;

        // 自动保存定时器
        this.saveInterval = setInterval(() => this.autoSave(), 30000);
        // 倒计时
        this.timerInterval = setInterval(() => {
          this.remainingSeconds--;
          if (this.remainingSeconds <= 0) {
            this.submitExam();
          }
        }, 1000);
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || '无法开始考试', '关闭', { duration: 3000 });
      },
    });
  }

  get currentQuestion(): any {
    return this.questions[this.currentIndex] || null;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).filter(k => this.answers[k]).length;
  }

  prevQuestion(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextQuestion(): void {
    if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
  }

  autoSave(): void {
    this.examService.saveProgress(this.taskId, this.answers).subscribe({
      error: () => console.warn('自动保存失败'),
    });
  }

  submitExam(): void {
    if (!confirm('确定提交试卷吗？提交后不可修改。')) return;

    clearInterval(this.timerInterval);
    clearInterval(this.saveInterval);

    this.examService.submitExam(this.taskId, this.answers).subscribe({
      next: (res) => {
        this.result = res.result;
        this.examSubmitted = true;
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || '提交失败', '关闭', { duration: 3000 });
      },
    });
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      single_choice: '单选题', multi_choice: '多选题', true_false: '判断题',
      fill_blank: '填空题', short_answer: '简答题', essay: '论述题', coding: '编程题',
    };
    return labels[type] || type;
  }

  isChoiceType(type: string): boolean {
    return ['single_choice', 'multi_choice'].includes(type);
  }

  isTextType(type: string): boolean {
    return ['fill_blank', 'short_answer', 'essay', 'coding'].includes(type);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.saveInterval);
  }
}