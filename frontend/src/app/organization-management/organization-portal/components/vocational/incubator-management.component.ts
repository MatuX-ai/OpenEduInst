import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VocationalService, VocIncubatorProject } from '../../../../services/vocational.service';

@Component({
  selector: 'app-incubator-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatProgressBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>rocket_launch</mat-icon> 双创孵化管理</h2>
      </div>

      <div class="stats-row">
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">孵化项目</div>
          <div class="stat-value">{{ stats?.total || 0 }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ stats?.completed || 0 }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">成功率</div>
          <div class="stat-value">{{ stats?.success_rate || '0%' }}</div>
        </mat-card-content></mat-card>
        <mat-card class="stat-card"><mat-card-content>
          <div class="stat-label">专利数</div>
          <div class="stat-value">{{ stats?.patent_count || 0 }}</div>
        </mat-card-content></mat-card>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>孵化项目列表</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="projects" class="data-table">
            <ng-container matColumnDef="project_name">
              <th mat-header-cell *matHeaderCellDef>项目名称</th>
              <td mat-cell *matCellDef="let p">{{ p.project_name }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>类别</th>
              <td mat-cell *matCellDef="let p">{{ p.category }}</td>
            </ng-container>
            <ng-container matColumnDef="leader_name">
              <th mat-header-cell *matHeaderCellDef>负责人</th>
              <td mat-cell *matCellDef="let p">{{ p.leader_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="stage">
              <th mat-header-cell *matHeaderCellDef>阶段</th>
              <td mat-cell *matCellDef="let p">{{ p.stage }}</td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>进度</th>
              <td mat-cell *matCellDef="let p">
                <mat-progress-bar mode="determinate" [value]="p.progress"></mat-progress-bar>
                <span class="progress-text">{{ p.progress }}%</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let p">{{ p.status }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="projects.length === 0" class="empty">暂无孵化项目</div>
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
    .data-table { width: 100%; }
    .progress-text { font-size: 12px; margin-left: 8px; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class IncubatorManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  projects: VocIncubatorProject[] = [];
  stats: any = null;
  columns = ['project_name', 'category', 'leader_name', 'stage', 'progress', 'status'];
  ngOnInit() {
    this.vocService.getIncubatorProjects().subscribe(data => this.projects = data);
    this.vocService.getIncubatorStats().subscribe(data => this.stats = data);
  }
}