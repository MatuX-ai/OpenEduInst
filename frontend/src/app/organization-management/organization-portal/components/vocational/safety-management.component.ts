import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { VocationalService, VocSafetyCertification, VocIncidentReport, VocSafetyStats } from '../../../../services/vocational.service';

@Component({
  selector: 'app-safety-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatChipsModule],
  template: `
    <div class="safety-page">
      <div class="page-header">
        <h2><mat-icon>security</mat-icon> 安全准入管理</h2>
      </div>

      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-label">认证总数</div>
            <div class="stat-value">{{ stats?.total_certifications || 0 }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card active">
          <mat-card-content>
            <div class="stat-label">有效认证</div>
            <div class="stat-value">{{ stats?.active_certifications || 0 }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-card-content>
            <div class="stat-label">待处理事故</div>
            <div class="stat-value">{{ stats?.pending_incidents || 0 }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card info">
          <mat-card-content>
            <div class="stat-label">今日检查</div>
            <div class="stat-value">{{ stats?.checklists_today || 0 }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>安全认证记录</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="certifications" class="data-table">
            <ng-container matColumnDef="user_name">
              <th mat-header-cell *matHeaderCellDef>姓名</th>
              <td mat-cell *matCellDef="let c">{{ c.user_name }}</td>
            </ng-container>
            <ng-container matColumnDef="safety_level">
              <th mat-header-cell *matHeaderCellDef>安全等级</th>
              <td mat-cell *matCellDef="let c">
                <span class="chip" [class.green]="c.safety_level === 'high'" [class.yellow]="c.safety_level === 'medium'">
                  {{ c.safety_level === 'high' ? '高级' : c.safety_level === 'medium' ? '中级' : '初级' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="exam_score">
              <th mat-header-cell *matHeaderCellDef>考核分数</th>
              <td mat-cell *matCellDef="let c">{{ c.exam_score ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="expire_date">
              <th mat-header-cell *matHeaderCellDef>有效期至</th>
              <td mat-cell *matCellDef="let c">{{ c.expire_date || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let c">
                <span class="chip" [class.green]="c.status === 'active'" [class.red]="c.status === 'expired'">
                  {{ c.status === 'active' ? '有效' : c.status === 'expired' ? '已过期' : c.status }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="certColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: certColumns;"></tr>
          </table>
          <div *ngIf="certifications.length === 0" class="empty">暂无认证记录</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>事故报告</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="incidents" class="data-table">
            <ng-container matColumnDef="incident_type">
              <th mat-header-cell *matHeaderCellDef>事故类型</th>
              <td mat-cell *matCellDef="let i">{{ i.incident_type }}</td>
            </ng-container>
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef>严重程度</th>
              <td mat-cell *matCellDef="let i">
                <span class="chip" [class.red]="i.severity === 'high'" [class.yellow]="i.severity === 'medium'">
                  {{ i.severity === 'high' ? '严重' : i.severity === 'medium' ? '中等' : '轻微' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="location_room">
              <th mat-header-cell *matHeaderCellDef>地点</th>
              <td mat-cell *matCellDef="let i">{{ i.location_room || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let i">{{ i.status }}</td>
            </ng-container>
            <ng-container matColumnDef="incident_date">
              <th mat-header-cell *matHeaderCellDef>发生日期</th>
              <td mat-cell *matCellDef="let i">{{ i.incident_date || '-' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="incidentColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: incidentColumns;"></tr>
          </table>
          <div *ngIf="incidents.length === 0" class="empty">暂无事故报告</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .safety-page { padding: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 20px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { cursor: default; }
    .stat-card.active { border-left: 3px solid #4caf50; }
    .stat-card.warn { border-left: 3px solid #ff9800; }
    .stat-card.info { border-left: 3px solid #2196f3; }
    .stat-label { font-size: 12px; color: rgba(0,0,0,0.5); margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 600; }
    .section-card { margin-bottom: 16px; }
    .data-table { width: 100%; }
    .chip { padding: 2px 8px; border-radius: 12px; font-size: 12px; background: #e0e0e0; }
    .chip.green { background: #c8e6c9; color: #2e7d32; }
    .chip.yellow { background: #fff9c4; color: #f57f17; }
    .chip.red { background: #ffcdd2; color: #c62828; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class SafetyManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  certifications: VocSafetyCertification[] = [];
  incidents: VocIncidentReport[] = [];
  stats: VocSafetyStats | null = null;
  certColumns = ['user_name', 'safety_level', 'exam_score', 'expire_date', 'status'];
  incidentColumns = ['incident_type', 'severity', 'location_room', 'status', 'incident_date'];

  ngOnInit() {
    this.vocService.getSafetyCertifications().subscribe(data => this.certifications = data);
    this.vocService.getIncidents().subscribe(data => this.incidents = data);
    this.vocService.getSafetyStats().subscribe(data => this.stats = data);
  }
}