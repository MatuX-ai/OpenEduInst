import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StemCloudService } from '../../services/stem-cloud.service';

export interface ClubMember {
  id: number;
  user_id: number;
  user_name: string;
  role: string;
  status: string;
  joined_at: string;
}

export interface ClubActivity {
  id: number;
  title: string;
  description?: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  activity_type: string;
  is_cancelled: boolean;
}

@Component({
  selector: 'app-stem-club-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTabsModule, MatTableModule, MatChipsModule,
    MatListModule, MatSnackBarModule,
  ],
  template: `
    <div class="club-detail">
      <!-- Back Button -->
      <button mat-button class="back-btn" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        返回社团列表
      </button>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <mat-icon class="loading-icon">hourglass_empty</mat-icon>
        <p>加载中...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{error}}</p>
        <button mat-raised-button color="primary" (click)="loadClub()">重试</button>
      </div>

      <ng-container *ngIf="!loading && !error && club">
        <!-- Club Header -->
        <div class="club-header">
          <div class="club-avatar-lg">{{club.name.charAt(0)}}</div>
          <div class="club-info">
            <div class="club-title-row">
              <h1>{{club.name}}</h1>
              <mat-chip [class.recruiting]="club.is_recruiting"
                        [class.active]="club.status==='active'"
                        [class.archived]="club.status==='archived'" selected>
                {{getStatusLabel(club.status)}}
              </mat-chip>
            </div>
            <p class="club-description" *ngIf="club.description">{{club.description}}</p>
            <div class="club-meta-row">
              <span><mat-icon>category</mat-icon> {{getCategoryLabel(club.category)}}</span>
              <span><mat-icon>school</mat-icon> {{club.grade_range_min}}-{{club.grade_range_max}} 年级</span>
              <span><mat-icon>people</mat-icon> {{club.current_members}}/{{club.max_members}} 人</span>
              <span *ngIf="club.leader_teacher_name"><mat-icon>person</mat-icon> 导师: {{club.leader_teacher_name}}</span>
            </div>
          </div>
          <div class="club-actions">
            <button mat-stroked-button color="primary" (click)="onEditClub()">
              <mat-icon>edit</mat-icon> 编辑
            </button>
            <button mat-raised-button color="primary" (click)="onAddMember()">
              <mat-icon>person_add</mat-icon> 添加成员
            </button>
          </div>
        </div>

        <!-- Tabs Section -->
        <mat-card>
          <mat-tab-group>
            <!-- Members Tab -->
            <mat-tab label="成员 ({{members.length}})">
              <div class="tab-content">
                <table mat-table [dataSource]="members" class="full-width">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>姓名</th>
                    <td mat-cell *matCellDef="let m">{{m.user_name}}</td>
                  </ng-container>
                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>角色</th>
                    <td mat-cell *matCellDef="let m">
                      <mat-chip>{{getRoleLabel(m.role)}}</mat-chip>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let m">
                      <mat-chip [class.active]="m.status==='active'" selected>
                        {{m.status==='active' ? '活跃' : '非活跃'}}
                      </mat-chip>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="joined">
                    <th mat-header-cell *matHeaderCellDef>加入时间</th>
                    <td mat-cell *matCellDef="let m">{{m.joined_at | date:'yyyy-MM-dd'}}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let m">
                      <button mat-icon-button color="warn" (click)="onRemoveMember(m)" matTooltip="移除成员">
                        <mat-icon>remove_circle_outline</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: memberColumns;"></tr>
                </table>
                <div *ngIf="members.length === 0" class="empty-tab">
                  <p>暂无成员</p>
                </div>
              </div>
            </mat-tab>

            <!-- Activities Tab -->
            <mat-tab label="活动 ({{activities.length}})">
              <div class="tab-content">
                <div class="tab-toolbar">
                  <button mat-raised-button color="primary" (click)="onCreateActivity()">
                    <mat-icon>add</mat-icon> 创建活动
                  </button>
                </div>
                <mat-list *ngIf="activities.length > 0">
                  <mat-list-item *ngFor="let act of activities" class="activity-item">
                    <mat-icon matListItemIcon [class.cancelled]="act.is_cancelled">
                      {{act.is_cancelled ? 'cancel' : 'event'}}
                    </mat-icon>
                    <div matListItemTitle>{{act.title}}</div>
                    <div matListItemLine>
                      {{act.activity_date}} {{act.start_time}}-{{act.end_time}}
                      <span *ngIf="act.location"> · {{act.location}}</span>
                      <mat-chip *ngIf="act.is_cancelled" class="cancelled-chip">已取消</mat-chip>
                    </div>
                  </mat-list-item>
                </mat-list>
                <div *ngIf="activities.length === 0" class="empty-tab">
                  <p>暂无活动</p>
                </div>
              </div>
            </mat-tab>

            <!-- Recruitment Tab -->
            <mat-tab label="招募">
              <div class="tab-content">
                <div class="tab-toolbar">
                  <button mat-raised-button color="primary" (click)="onCreateRecruitment()">
                    <mat-icon>add</mat-icon> 发布招募
                  </button>
                </div>
                <div *ngIf="recruitments.length === 0" class="empty-tab">
                  <mat-icon>campaign</mat-icon>
                  <p>暂无招募信息</p>
                </div>
                <div *ngFor="let rec of recruitments" class="recruitment-card">
                  <div class="rec-header">
                    <strong>{{rec.title || '社团招募'}}</strong>
                    <mat-chip [class.active]="rec.is_active" selected>
                      {{rec.is_active ? '招募中' : '已结束'}}
                    </mat-chip>
                  </div>
                  <p *ngIf="rec.description" class="rec-desc">{{rec.description}}</p>
                  <div class="rec-meta">
                    <span>名额: {{rec.quota || '不限'}}</span>
                    <span *ngIf="rec.deadline">截止: {{rec.deadline}}</span>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .club-detail { padding: 24px; }
    .back-btn { margin-bottom: 16px; color: #666; }
    .loading-state, .error-state { text-align: center; padding: 48px; color: #666; }
    .loading-icon { font-size: 48px; width: 48px; height: 48px; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .club-header {
      display: flex; gap: 24px; align-items: flex-start;
      margin-bottom: 24px; padding: 24px;
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .club-avatar-lg {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #1976d2, #42a5f5);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .club-info { flex: 1; }
    .club-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .club-title-row h1 { margin: 0; font-size: 22px; font-weight: 500; }
    .club-description { color: #666; margin: 0 0 12px 0; font-size: 14px; }
    .club-meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .club-meta-row span { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #666; }
    .club-meta-row mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .club-actions { display: flex; gap: 8px; }
    
    .tab-content { padding: 16px; }
    .full-width { width: 100%; }
    .empty-tab { text-align: center; padding: 48px; color: #999; }
    .empty-tab mat-icon { font-size: 48px; width: 48px; height: 48px; }
    
    .tab-toolbar { margin-bottom: 16px; }
    
    .activity-item { margin-bottom: 8px; }
    .activity-item .cancelled { color: #f44336; }
    .cancelled-chip { background: #ffebee !important; color: #c62828; font-size: 11px; margin-left: 8px; }
    
    .recruitment-card {
      border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 16px; margin-bottom: 12px;
    }
    .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .rec-desc { color: #666; font-size: 14px; margin: 0 0 8px 0; }
    .rec-meta { display: flex; gap: 16px; font-size: 13px; color: #888; }
    
    mat-chip.recruiting { background: #e8f5e9 !important; color: #2e7d32; }
    mat-chip.active { background: #e3f2fd !important; color: #1565c0; }
    mat-chip.archived { background: #f5f5f5 !important; color: #9e9e9e; }
  `]
})
export class StemClubDetailComponent implements OnInit {
  clubId!: number;
  club: any = null;
  members: ClubMember[] = [];
  activities: ClubActivity[] = [];
  recruitments: any[] = [];
  loading = true;
  error = '';

  memberColumns = ['name', 'role', 'status', 'joined', 'actions'];

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
    private route: ActivatedRoute,
    private router: Router,
    private stemService: StemCloudService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.clubId = +params['id'];
      if (this.clubId) {
        this.loadClub();
      }
    });
  }

  loadClub(): void {
    this.loading = true;
    this.error = '';
    this.stemService.getClub(this.clubId).subscribe({
      next: (data) => {
        this.club = data;
        this.loading = false;
        this.loadMembers();
        this.loadActivities();
        this.loadRecruitments();
      },
      error: (err) => {
        this.loading = false;
        this.error = '加载社团信息失败: ' + (err.message || '未知错误');
      },
    });
  }

  loadMembers(): void {
    this.stemService.getClubMembers(this.clubId).subscribe({
      next: (data) => this.members = data,
      error: () => console.log('Members not available'),
    });
  }

  loadActivities(): void {
    this.stemService.getClubActivities(this.clubId).subscribe({
      next: (data) => this.activities = data,
      error: () => console.log('Activities not available'),
    });
  }

  loadRecruitments(): void {
    this.stemService.getClubRecruitments(this.clubId).subscribe({
      next: (data) => this.recruitments = data,
      error: () => console.log('Recruitments not available'),
    });
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

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      leader: '团长', vice_leader: '副团长', secretary: '干事', member: '成员'
    };
    return map[role] || role;
  }

  goBack(): void {
    this.router.navigate(['/stem/clubs']);
  }

  onEditClub(): void {
    this.snackBar.open(`编辑社团: ${this.club.name}`, '关闭', { duration: 3000 });
  }

  onAddMember(): void {
    this.snackBar.open('添加成员功能开发中', '关闭', { duration: 3000 });
  }

  onRemoveMember(member: ClubMember): void {
    if (confirm(`确定要移除成员"${member.user_name}"吗？`)) {
      this.stemService.removeClubMember(this.clubId, member.id).subscribe({
        next: () => {
          this.snackBar.open('成员已移除', '关闭', { duration: 2000 });
          this.loadMembers();
        },
        error: (err) => this.snackBar.open('操作失败: ' + err.message, '关闭', { duration: 3000 }),
      });
    }
  }

  onCreateActivity(): void {
    this.snackBar.open('创建活动功能开发中', '关闭', { duration: 3000 });
  }

  onCreateRecruitment(): void {
    this.snackBar.open('发布招募功能开发中', '关闭', { duration: 3000 });
  }
}