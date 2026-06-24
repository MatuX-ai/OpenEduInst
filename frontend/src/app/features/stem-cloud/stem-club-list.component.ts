import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StemCloudService } from '../../services/stem-cloud.service';

export interface Club {
  id: number;
  org_id: number;
  name: string;
  logo?: string;
  description?: string;
  category: string;
  grade_range_min: number;
  grade_range_max: number;
  max_members: number;
  current_members: number;
  require_interview: boolean;
  is_recruiting: boolean;
  status: string;
  leader_teacher_name?: string;
  semester?: string;
  school_year?: string;
  created_at: string;
}

@Component({
  selector: 'app-stem-club-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="club-management">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>STEM 社团管理</h1>
          <p class="subtitle">管理跨班级 STEM 社团的开设、招募、活动和成员</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="onCreateClub()">
            <mat-icon>add</mat-icon>
            创建社团
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{stats.total_clubs}}</div>
            <div class="stat-label">社团总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card accent">
          <mat-card-content>
            <div class="stat-value">{{stats.active_clubs}}</div>
            <div class="stat-label">活跃社团</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-card-content>
            <div class="stat-value">{{stats.recruiting_clubs}}</div>
            <div class="stat-label">招募中</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card info">
          <mat-card-content>
            <div class="stat-value">{{stats.total_members}}</div>
            <div class="stat-label">总成员数</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>搜索社团</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="名称/导师">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>分类</mat-label>
          <mat-select [(ngModel)]="filterCategory" (selectionChange)="loadClubs()">
            <mat-option value="">全部</mat-option>
            <mat-option *ngFor="let cat of categories" [value]="cat.value">{{cat.label}}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>状态</mat-label>
          <mat-select [(ngModel)]="filterStatus" (selectionChange)="loadClubs()">
            <mat-option value="">全部</mat-option>
            <mat-option value="recruiting">招募中</mat-option>
            <mat-option value="active">运营中</mat-option>
            <mat-option value="archived">已归档</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Club Table -->
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="clubs" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>社团名称</th>
              <td mat-cell *matCellDef="let club">
                <div class="club-name-cell">
                  <div class="club-avatar">{{club.name.charAt(0)}}</div>
                  <div>
                    <div class="club-name">{{club.name}}</div>
                    <div class="club-meta" *ngIf="club.leader_teacher_name">导师: {{club.leader_teacher_name}}</div>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>分类</th>
              <td mat-cell *matCellDef="let club">
                <mat-chip>{{getCategoryLabel(club.category)}}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="grade">
              <th mat-header-cell *matHeaderCellDef>适用年级</th>
              <td mat-cell *matCellDef="let club">{{club.grade_range_min}}-{{club.grade_range_max}} 年级</td>
            </ng-container>
            <ng-container matColumnDef="members">
              <th mat-header-cell *matHeaderCellDef>成员</th>
              <td mat-cell *matCellDef="let club">{{club.current_members}}/{{club.max_members}}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let club">
                <mat-chip [class.recruiting]="club.is_recruiting" [class.active]="club.status==='active'"
                  [class.archived]="club.status==='archived'" selected>
                  {{getStatusLabel(club.status)}}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let club">
                <button mat-icon-button color="primary" (click)="viewClub(club)" matTooltip="查看详情">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button (click)="editClub(club)" matTooltip="编辑">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteClub(club)" matTooltip="解散">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <div *ngIf="clubs.length === 0" class="empty-state">
            <mat-icon>group_work</mat-icon>
            <p>暂无社团数据，点击"创建社团"开始</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .club-management { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0 0; }
    .header-actions { display: flex; gap: 8px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card .mat-mdc-card-content { text-align: center; padding: 20px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #1976d2; }
    .stat-card.accent .stat-value { color: #ff9800; }
    .stat-card.warn .stat-value { color: #f44336; }
    .stat-card.info .stat-value { color: #4caf50; }
    .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
    
    .filters-row { display: flex; gap: 16px; margin-bottom: 16px; align-items: center; }
    .search-field { flex: 1; }
    
    .full-width { width: 100%; }
    .club-name-cell { display: flex; align-items: center; gap: 12px; }
    .club-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e3f2fd; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #1976d2; }
    .club-name { font-weight: 500; }
    .club-meta { font-size: 12px; color: #888; }
    
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    
    mat-chip.recruiting { background: #e8f5e9 !important; color: #2e7d32; }
    mat-chip.active { background: #e3f2fd !important; color: #1565c0; }
    mat-chip.archived { background: #f5f5f5 !important; color: #9e9e9e; }
  `]
})
export class StemClubListComponent implements OnInit {
  clubs: Club[] = [];
  displayedColumns = ['name', 'category', 'grade', 'members', 'status', 'actions'];
  searchQuery = '';
  filterCategory = '';
  filterStatus = '';

  stats = { total_clubs: 0, active_clubs: 0, recruiting_clubs: 0, total_members: 0 };

  categories = [
    { value: 'robotics', label: '机器人' },
    { value: 'programming', label: '编程' },
    { value: 'drone', label: '无人机' },
    { value: 'printing_3d', label: '3D打印' },
    { value: 'engineering', label: '工程搭建' },
    { value: 'science_exp', label: '科学实验' },
    { value: 'ai', label: '人工智能' },
    { value: 'maker', label: '创客综合' },
  ];

  constructor(
    private stemService: StemCloudService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadClubs();
  }

  loadStats(): void {
    this.stemService.getClubStats().subscribe({
      next: (data) => this.stats = data,
      error: () => console.log('Stats not available yet - backend may be starting'),
    });
  }

  loadClubs(): void {
    this.stemService.getClubs({
      category: this.filterCategory || undefined,
      status: this.filterStatus || undefined,
      search: this.searchQuery || undefined,
    }).subscribe({
      next: (data) => this.clubs = data,
      error: () => console.log('Club list not available yet'),
    });
  }

  onSearch(): void {
    setTimeout(() => this.loadClubs(), 300);
  }

  getCategoryLabel(cat: string): string {
    const found = this.categories.find(c => c.value === cat);
    return found ? found.label : cat;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      recruiting: '招募中', active: '运营中', archived: '已归档', dissolved: '已解散'
    };
    return map[status] || status;
  }

  onCreateClub(): void {
    // Navigate to create page - for now just an alert
    this.snackBar.open('创建社团功能开发中', '关闭', { duration: 3000 });
  }

  viewClub(club: Club): void {
    this.router.navigate(['/stem/clubs', club.id]);
  }

  editClub(club: Club): void {
    this.snackBar.open(`编辑社团: ${club.name}`, '关闭', { duration: 3000 });
  }

  deleteClub(club: Club): void {
    if (confirm(`确定要解散社团"${club.name}"吗？`)) {
      this.stemService.deleteClub(club.id).subscribe({
        next: () => {
          this.snackBar.open('社团已解散', '关闭', { duration: 2000 });
          this.loadClubs();
          this.loadStats();
        },
        error: (err) => this.snackBar.open('操作失败: ' + err.message, '关闭', { duration: 3000 }),
      });
    }
  }
}