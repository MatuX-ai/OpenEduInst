import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ExamManagementService, ExamPaper } from './exam-management.service';

@Component({
  selector: 'app-exam-task-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSelectModule, MatSnackBarModule,
    MatCheckboxModule, MatRadioModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="task-create-container">
      <div class="page-header">
        <button mat-icon-button [routerLink]="['../..']">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>创建考试任务</h2>
      </div>

      <mat-card class="form-card">
        <h3>基本信息</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>考试名称</mat-label>
            <input matInput [(ngModel)]="task.title" placeholder="如：机器人1级 期末模拟考试">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>考试模式</mat-label>
            <mat-select [(ngModel)]="task.mode">
              <mat-option value="online">线上考试</mat-option>
              <mat-option value="offline">线下考试（仅记录）</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>选择试卷</mat-label>
            <mat-select [(ngModel)]="task.paper_id">
              <mat-option *ngFor="let p of papers" [value]="p.id">{{ p.title }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card class="form-card">
        <h3>时间设置</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>开始日期</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>开始时间</mat-label>
            <input matInput type="time" [(ngModel)]="startTime">
          </mat-form-field>
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>截止时间</mat-label>
            <input matInput type="time" [(ngModel)]="endTime">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>考试时长（分钟）</mat-label>
            <input matInput type="number" [(ngModel)]="task.duration" min="1">
          </mat-form-field>
          <mat-checkbox [(ngModel)]="task.allow_late" class="checkbox-item">
            允许迟到学生在截止时间前进入考试
          </mat-checkbox>
        </div>
      </mat-card>

      <mat-card class="form-card">
        <h3>提交与批改设置</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>提交方式</mat-label>
            <mat-select [(ngModel)]="task.submit_type">
              <mat-option value="online">在线提交</mat-option>
              <mat-option value="upload">上传附件</mat-option>
              <mat-option value="manual">手动录入</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-checkbox [(ngModel)]="task.auto_grade" class="checkbox-item">
            客观题自动批改
          </mat-checkbox>
        </div>
      </mat-card>

      <div class="form-actions">
        <button mat-button [routerLink]="['../..']">取消</button>
        <button mat-raised-button color="primary" (click)="createTask()" [disabled]="!task.title || !task.paper_id">
          <mat-icon>publish</mat-icon> 创建并发布
        </button>
      </div>
    </div>
  `,
  styles: [`
    .task-create-container { padding: 0; max-width: 800px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .form-card { margin-bottom: 16px; padding: 20px; }
    .form-card h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333; }
    .form-row { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .full-width { width: 100%; }
    .half-width { flex: 1; min-width: 200px; }
    .third-width { flex: 1; min-width: 150px; }
    .checkbox-item { margin-top: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `],
})
export class ExamTaskCreateComponent implements OnInit {
  task: any = {
    title: '',
    paper_id: null,
    mode: 'online',
    duration: 60,
    start_time: '',
    end_time: '',
    submit_type: 'online',
    auto_grade: true,
    allow_late: true,
    student_ids: [],
  };
  papers: ExamPaper[] = [];
  startDate: Date = new Date();
  startTime: string = '09:00';
  endTime: string = '18:00';

  constructor(
    private router: Router,
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.examService.getPapers('published').subscribe({
      next: (res) => {
        this.papers = res.papers || [];
      },
    });
  }

  createTask(): void {
    const startDateTime = new Date(this.startDate);
    const [sh, sm] = this.startTime.split(':').map(Number);
    startDateTime.setHours(sh, sm, 0, 0);

    const endDateTime = new Date(this.startDate);
    const [eh, em] = this.endTime.split(':').map(Number);
    endDateTime.setHours(eh, em, 0, 0);

    this.task.start_time = startDateTime.toISOString();
    this.task.end_time = endDateTime.toISOString();

    this.examService.createTask(this.task).subscribe({
      next: (res: any) => {
        this.examService.publishTask(res.task.id).subscribe({
          next: () => {
            this.snackBar.open('考试任务创建并发布成功', '关闭', { duration: 3000 });
            this.router.navigate(['../..'], { relativeTo: this.router.routerState.root.firstChild });
          },
        });
      },
      error: () => {
        this.snackBar.open('创建失败', '关闭', { duration: 3000 });
      },
    });
  }
}