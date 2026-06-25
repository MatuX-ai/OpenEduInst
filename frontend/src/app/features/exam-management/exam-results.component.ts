import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExamManagementService, ExamResult, ExamStats } from './exam-management.service';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule,
    MatTableModule, MatChipsModule, MatProgressBarModule,
  ],
  template: `
    <div class="results-container">
      <div class="page-header">
        <button mat-icon-button [routerLink]="['../../..']">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>考试成绩</h2>
      </div>

      <ng-container *ngIf="stats">
        <!-- 统计概览 -->
        <mat-card class="stats-card">
          <h3>成绩统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ stats.total_students }}</span>
              <span class="stat-label">参与学生</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.submitted_count }}</span>
              <span class="stat-label">已提交</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.graded_count }}</span>
              <span class="stat-label">已批改</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.average_score }}</span>
              <span class="stat-label">平均分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.max_score }}</span>
              <span class="stat-label">最高分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.min_score }}</span>
              <span class="stat-label">最低分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.pass_rate }}%</span>
              <span class="stat-label">及格率</span>
            </div>
          </div>
        </mat-card>

        <!-- 分数段分布 -->
        <mat-card class="distribution-card">
          <h3>分数段分布</h3>
          <div class="distribution-bars">
            <div *ngFor="let range of distributionRanges" class="dist-bar-row">
              <span class="dist-label">{{ range.label }}</span>
              <div class="dist-bar-bg">
                <div class="dist-bar" [style.width.%]="range.percent" [style.background]="range.color"></div>
              </div>
              <span class="dist-count">{{ range.count }}人</span>
            </div>
          </div>
        </mat-card>
      </ng-container>

      <!-- 成绩列表 -->
      <mat-card class="results-list-card">
        <h3>学生成绩列表</h3>
        <table mat-table [dataSource]="results" class="results-table">
          <ng-container matColumnDef="student">
            <th mat-header-cell *matHeaderCellDef>学生</th>
            <td mat-cell *matCellDef="let r">{{ r.student_id }}</td>
          </ng-container>
          <ng-container matColumnDef="score">
            <th mat-header-cell *matHeaderCellDef>总分</th>
            <td mat-cell *matCellDef="let r">{{ r.score ?? '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="objective">
            <th mat-header-cell *matHeaderCellDef>客观题</th>
            <td mat-cell *matCellDef="let r">{{ r.objective_score ?? '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="subjective">
            <th mat-header-cell *matHeaderCellDef>主观题</th>
            <td mat-cell *matCellDef="let r">{{ r.subjective_score ?? '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let r">
              <mat-chip-listbox>
                <mat-chip-option [ngClass]="'status-' + r.status" disabled>
                  {{ statusLabel(r.status) }}
                </mat-chip-option>
              </mat-chip-listbox>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let r">
              <button mat-button color="primary" [routerLink]="['../results', r.id]">
                查看详情
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .results-container { padding: 0; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .stats-card { margin-bottom: 16px; padding: 20px; }
    .stats-card h3 { margin: 0 0 16px 0; font-size: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; }
    .stat-item { text-align: center; padding: 12px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { display: block; font-size: 24px; font-weight: 700; color: #1a237e; }
    .stat-label { display: block; font-size: 12px; color: #888; margin-top: 4px; }
    .distribution-card { margin-bottom: 16px; padding: 20px; }
    .distribution-card h3 { margin: 0 0 16px 0; font-size: 16px; }
    .distribution-bars { display: flex; flex-direction: column; gap: 8px; }
    .dist-bar-row { display: flex; align-items: center; gap: 12px; }
    .dist-label { width: 50px; font-size: 13px; color: #666; }
    .dist-bar-bg { flex: 1; height: 24px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .dist-bar { height: 100%; border-radius: 4px; min-width: 2px; transition: width 0.3s; }
    .dist-count { width: 40px; font-size: 13px; color: #666; text-align: right; }
    .results-list-card { padding: 20px; }
    .results-list-card h3 { margin: 0 0 16px 0; font-size: 16px; }
    .results-table { width: 100%; }
    ::ng-deep .status-submitted .mdc-evolution-chip__text-label { color: #2196f3; }
    ::ng-deep .status-graded .mdc-evolution-chip__text-label { color: #4caf50; }
    ::ng-deep .status-in_progress .mdc-evolution-chip__text-label { color: #ff9800; }
  `],
})
export class ExamResultsComponent implements OnInit {
  taskId: number = 0;
  results: ExamResult[] = [];
  stats: ExamStats | null = null;
  displayedColumns = ['student', 'score', 'objective', 'subjective', 'status', 'actions'];

  distributionRanges: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private examService: ExamManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.taskId = +this.route.snapshot.paramMap.get('taskId')!;
    this.loadResults();
    this.loadStats();
  }

  loadResults(): void {
    this.examService.getExamResults(this.taskId).subscribe({
      next: (res) => {
        this.results = res.results || [];
      },
    });
  }

  loadStats(): void {
    this.examService.getExamStats(this.taskId).subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.buildDistribution(res.stats?.score_distribution || {});
      },
    });
  }

  buildDistribution(dist: Record<string, number>): void {
    const colors: Record<string, string> = {
      '90-100': '#4caf50', '80-89': '#8bc34a', '70-79': '#ffc107',
      '60-69': '#ff9800', '0-59': '#f44336',
    };
    const maxCount = Math.max(...Object.values(dist), 1);
    this.distributionRanges = Object.entries(dist).map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / maxCount) * 100),
      color: colors[label] || '#999',
    }));
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '未开始', in_progress: '答题中', submitted: '已提交', graded: '已批改',
    };
    return labels[status] || status;
  }
}