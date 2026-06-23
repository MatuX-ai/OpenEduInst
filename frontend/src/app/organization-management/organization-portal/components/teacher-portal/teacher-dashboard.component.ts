import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import {
  OpenMtSciEdService,
  OpenSciEdConfig,
  OpenSciEdStats,
} from '../../../../core/services/openmt-scied.service';

interface QuickLink {
  icon: string;
  title: string;
  description: string;
  tab: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="teacher-dashboard">
      <header class="td-header">
        <div>
          <h1>教学工作台</h1>
          <p class="subtitle">欢迎，{{ userName }} · OpenMTSciEd STEM 资源备课中心</p>
        </div>
      </header>

      <div *ngIf="loading" class="loading-row">
        <mat-spinner diameter="36"></mat-spinner>
        <span>加载资源概览…</span>
      </div>

      <div *ngIf="!integrationEnabled && !loading" class="banner warn">
        <mat-icon>info</mat-icon>
        <span>OpenMTSciEd 尚未启用，请联系机构管理员在系统设置中配置。</span>
      </div>

      <div class="stats-grid" *ngIf="!loading && integrationEnabled">
        <mat-card class="stat-card">
          <mat-icon>menu_book</mat-icon>
          <div class="stat-value">{{ stats.tutorials }}</div>
          <div class="stat-label">教程</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>edit_note</mat-icon>
          <div class="stat-value">{{ stats.coursewares }}</div>
          <div class="stat-label">课件</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>memory</mat-icon>
          <div class="stat-value">{{ stats.hardware_projects }}</div>
          <div class="stat-label">硬件项目</div>
        </mat-card>
      </div>

      <section class="quick-section" *ngIf="!loading">
        <h2>快速进入</h2>
        <div class="quick-grid">
          <button
            type="button"
            class="quick-card"
            *ngFor="let link of quickLinks"
            (click)="goResources(link.tab)"
          >
            <mat-icon>{{ link.icon }}</mat-icon>
            <div>
              <div class="quick-title">{{ link.title }}</div>
              <div class="quick-desc">{{ link.description }}</div>
            </div>
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;

      .teacher-dashboard {
        max-width: 1100px;
        margin: 0 auto;
        padding: 8px 4px 32px;
      }

      .td-header h1 {
        margin: 0 0 6px;
        font-size: $font-size-xl;
        font-weight: 700;
        color: $color-neutral-900;
      }

      .subtitle {
        margin: 0;
        font-size: $font-size-sm;
        color: $color-neutral-500;
      }

      .loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 32px 0;
        color: $color-neutral-500;
      }

      .banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border-radius: $radius-md;
        margin: 20px 0;
        font-size: $font-size-sm;
      }

      .banner.warn {
        background: $color-warning-light;
        color: $color-neutral-700;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 24px 0;
      }

      .stat-card {
        padding: 20px;
        text-align: center;
        border: 1px solid $color-neutral-200;
        box-shadow: $shadow-sm;
      }

      .stat-card mat-icon {
        color: $color-primary;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $color-neutral-900;
      }

      .stat-label {
        font-size: $font-size-xs;
        color: $color-neutral-500;
        margin-top: 4px;
      }

      .quick-section h2 {
        font-size: $font-size-base;
        font-weight: 600;
        margin: 0 0 12px;
        color: $color-neutral-800;
      }

      .quick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }

      .quick-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border: 1px solid $color-neutral-200;
        border-radius: $radius-lg;
        background: white;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .quick-card:hover {
        border-color: rgba($color-primary, 0.4);
        box-shadow: $shadow-md;
      }

      .quick-card mat-icon {
        color: $color-primary;
      }

      .quick-title {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .quick-desc {
        font-size: $font-size-xs;
        color: $color-neutral-500;
        margin-top: 4px;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TeacherDashboardComponent implements OnInit {
  userName = '教师';
  loading = true;
  integrationEnabled = false;
  stats: OpenSciEdStats = { tutorials: 0, coursewares: 0, hardware_projects: 0 };
  orgId = 0;

  quickLinks: QuickLink[] = [
    { icon: 'menu_book', title: '浏览教程', description: '结构化 STEM 教程', tab: 'tutorials' },
    { icon: 'edit_note', title: '课件库', description: 'PPT / PDF / 视频课件', tab: 'courseware' },
    { icon: 'memory', title: '硬件项目', description: '实践项目与实验方案', tab: 'hardware' },
    { icon: 'hub', title: '知识图谱', description: '个性化资源推荐', tab: 'knowledge-graph' },
    { icon: 'lightbulb', title: '课题工作室', description: '六步向导创课', tab: 'topic-studio' },
    { icon: 'calendar_month', title: '我的课表', description: '查看排课安排', tab: 'schedule' },
  ];

  constructor(
    private sciEd: OpenMtSciEdService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.userName = user.full_name || user.username;
    }
    this.orgId = Number(
      this.route.parent?.parent?.snapshot.paramMap.get('id') ??
        this.route.parent?.snapshot.paramMap.get('id') ??
        0
    );
    this.loadOverview();
  }

  goResources(tab: string): void {
    if (!this.orgId) {
      return;
    }
    if (tab === 'schedule') {
      void this.router.navigate(['/organization', this.orgId, 'schedule']);
      return;
    }
    if (tab === 'knowledge-graph') {
      void this.router.navigate(['/organization', this.orgId, 'knowledge-graph']);
      return;
    }
    if (tab === 'topic-studio') {
      void this.router.navigate(['/organization', this.orgId, 'topic-studio']);
      return;
    }
    void this.router.navigate(['/organization', this.orgId, 'resources'], {
      queryParams: { tab },
    });
  }

  private loadOverview(): void {
    this.loading = true;
    this.sciEd.getConfig().subscribe({
      next: (cfg: OpenSciEdConfig) => {
        this.integrationEnabled = cfg.enabled;
        if (!cfg.enabled) {
          this.loading = false;
          return;
        }
        this.sciEd.getStats().subscribe({
          next: (stats) => {
            this.stats = stats;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.integrationEnabled = false;
        this.loading = false;
      },
    });
  }
}
