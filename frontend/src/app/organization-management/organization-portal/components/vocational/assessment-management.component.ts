import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocSkillStandard, VocSkillAssessment } from '../../../../services/vocational.service';

@Component({
  selector: 'app-assessment-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>assignment_turned_in</mat-icon> 技能评估管理</h2>
      </div>

      <div class="stats-row">
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">评估总数</div>
          <div class="stat-value">{{ stats?.total_assessments || 0 }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">平均分</div>
          <div class="stat-value">{{ stats?.avg_score || 0 }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">通过率</div>
          <div class="stat-value">{{ stats?.pass_rate || '0%' }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">证书总数</div>
          <div class="stat-value">{{ stats?.total_certificates || 0 }}</div>
        </mat-card-content></mat-card>
      </div>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>技能标准库</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="standards" class="data-table">
            <ng-container matColumnDef="skill_name">
              <th mat-header-cell *matHeaderCellDef>技能名称</th>
              <td mat-cell *matCellDef="let s">{{ s.skill_name }}</td>
            </ng-container>
            <ng-container matColumnDef="major">
              <th mat-header-cell *matHeaderCellDef>专业</th>
              <td mat-cell *matCellDef="let s">{{ s.major }}</td>
            </ng-container>
            <ng-container matColumnDef="skill_level">
              <th mat-header-cell *matHeaderCellDef>技能等级</th>
              <td mat-cell *matCellDef="let s">{{ s.skill_level }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>描述</th>
              <td mat-cell *matCellDef="let s">{{ s.description || '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="stdColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: stdColumns;"></tr>
          </table>
          <div *ngIf="standards.length === 0" class="empty">暂无技能标准</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-label { font-size: 12px; color: rgba(0,0,0,0.5); margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 600; }
    .section-card { margin-bottom: 16px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class AssessmentManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  standards: VocSkillStandard[] = [];
  stats: any = null;
  stdColumns = ['skill_name', 'major', 'skill_level', 'description'];
  ngOnInit() {
    this.vocService.getSkillStandards().subscribe(data => this.standards = data);
    this.vocService.getAssessmentStats().subscribe(data => this.stats = data);
  }
}