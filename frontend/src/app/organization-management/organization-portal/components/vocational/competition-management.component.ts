import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocCompetition } from '../../../../services/vocational.service';

@Component({
  selector: 'app-competition-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>emoji_events</mat-icon> 技能竞赛管理</h2>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>竞赛列表</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="competitions" class="data-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>竞赛名称</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>
            <ng-container matColumnDef="level">
              <th mat-header-cell *matHeaderCellDef>级别</th>
              <td mat-cell *matCellDef="let c">{{ c.level }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>类型</th>
              <td mat-cell *matCellDef="let c">{{ c.type || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="competition_date">
              <th mat-header-cell *matHeaderCellDef>竞赛日期</th>
              <td mat-cell *matCellDef="let c">{{ c.competition_date || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="organizer">
              <th mat-header-cell *matHeaderCellDef>主办方</th>
              <td mat-cell *matCellDef="let c">{{ c.organizer || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let c">{{ c.status }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="competitions.length === 0" class="empty">暂无竞赛</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class CompetitionManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  competitions: VocCompetition[] = [];
  columns = ['name', 'level', 'type', 'competition_date', 'organizer', 'status'];
  ngOnInit() { this.vocService.getCompetitions().subscribe(data => this.competitions = data); }
}