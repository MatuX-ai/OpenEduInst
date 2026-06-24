import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { StemCloudService } from '../../services/stem-cloud.service';

@Component({
  selector: 'app-stem-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatGridListModule, MatChipsModule, MatProgressBarModule, RouterLink,
  ],
  template: `
    <div class="stem-dashboard">
      <div class="page-header">
        <div>
          <h1>STEM 教育管理看板</h1>
          <p class="subtitle">学校 STEM 社团、设备、项目运营总览</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card" routerLink="/stem/clubs">
          <mat-card-content>
            <div class="kpi-icon clubs"><mat-icon>group_work</mat-icon></div>
            <div class="kpi-value">{{overview.club_count}}</div>
            <div class="kpi-label">社团总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card" routerLink="/stem/projects">
          <mat-card-content>
            <div class="kpi-icon projects"><mat-icon>science</mat-icon></div>
            <div class="kpi-value">{{overview.project_count}}</div>
            <div class="kpi-label">项目总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card" routerLink="/stem/devices">
          <mat-card-content>
            <div class="kpi-icon devices"><mat-icon>hardware</mat-icon></div>
            <div class="kpi-value">{{overview.device_count}}</div>
            <div class="kpi-label">设备总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card" routerLink="/stem/clubs">
          <mat-card-content>
            <div class="kpi-icon members"><mat-icon>people</mat-icon></div>
            <div class="kpi-value">{{overview.member_count}}</div>
            <div class="kpi-label">社团成员</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-icon activities"><mat-icon>event</mat-icon></div>
            <div class="kpi-value">{{overview.active_activity_count}}</div>
            <div class="kpi-label">待办活动</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card" [class.warn]="overview.low_stock_count > 0">
          <mat-card-content>
            <div class="kpi-icon stock"><mat-icon>inventory_2</mat-icon></div>
            <div class="kpi-value">{{overview.low_stock_count}}</div>
            <div class="kpi-label">低库存耗材</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Section: Quick Actions -->
      <h2 class="section-title">快速操作</h2>
      <div class="action-grid">
        <button mat-raised-button class="action-btn" routerLink="/stem/clubs">
          <mat-icon>group_work</mat-icon> 社团管理
        </button>
        <button mat-raised-button class="action-btn accent" routerLink="/stem/devices">
          <mat-icon>hardware</mat-icon> 设备管理
        </button>
        <button mat-raised-button class="action-btn warn" routerLink="/stem/projects">
          <mat-icon>science</mat-icon> 项目管理
        </button>
        <button mat-raised-button class="action-btn info" routerLink="/stem/spaces">
          <mat-icon>meeting_room</mat-icon> 空间预约
        </button>
      </div>

      <!-- Section: Club Category Distribution -->
      <h2 class="section-title">社团分类分布</h2>
      <mat-card>
        <mat-card-content>
          <div *ngIf="categoryDistribution.length === 0" class="empty">暂无数据</div>
          <div *ngFor="let cat of categoryDistribution" class="dist-row">
            <span class="dist-label">{{cat.category}}</span>
            <div class="dist-bar-bg">
              <div class="dist-bar" [style.width.%]="cat.percentage"></div>
            </div>
            <span class="dist-count">{{cat.count}} ({{cat.percentage}}%)</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stem-dashboard { padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0 0; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi-card { cursor: pointer; transition: transform .2s; }
    .kpi-card:hover { transform: translateY(-4px); }
    .kpi-card .mat-mdc-card-content { text-align: center; padding: 20px; }
    .kpi-icon { font-size: 32px; margin-bottom: 8px; }
    .kpi-icon.clubs { color: #1976d2; }
    .kpi-icon.projects { color: #ff9800; }
    .kpi-icon.devices { color: #4caf50; }
    .kpi-icon.members { color: #9c27b0; }
    .kpi-icon.activities { color: #00bcd4; }
    .kpi-icon.stock { color: #f44336; }
    .kpi-card.warn .kpi-icon.stock { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
    .kpi-value { font-size: 28px; font-weight: 700; }
    .kpi-label { font-size: 13px; color: #666; margin-top: 4px; }
    
    .section-title { font-size: 18px; font-weight: 500; margin: 24px 0 16px; }
    
    .action-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .action-btn { height: 80px !important; font-size: 16px !important; display: flex !important; flex-direction: column !important; gap: 4px !important; }
    .action-btn.accent { background: #fff3e0 !important; color: #e65100 !important; }
    .action-btn.warn { background: #fce4ec !important; color: #c62828 !important; }
    .action-btn.info { background: #e0f7fa !important; color: #00838f !important; }
    
    .dist-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .dist-label { width: 80px; font-size: 14px; }
    .dist-bar-bg { flex: 1; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
    .dist-bar { height: 100%; background: linear-gradient(90deg, #1976d2, #64b5f6); border-radius: 10px; transition: width .5s; }
    .dist-count { width: 80px; text-align: right; font-size: 13px; color: #666; }
    
    .empty { text-align: center; padding: 24px; color: #999; }
  `]
})
export class StemDashboardComponent implements OnInit {
  overview = {
    club_count: 0, project_count: 0, device_count: 0,
    member_count: 0, active_activity_count: 0,
    competition_count: 0, low_stock_count: 0,
  };
  categoryDistribution: Array<{ category: string; count: number; percentage: number }> = [];

  constructor(private stemService: StemCloudService) {}

  ngOnInit(): void {
    this.stemService.getDashboardOverview().subscribe({
      next: (data) => this.overview = data,
      error: () => console.log('Dashboard overview not available'),
    });
    this.stemService.getClubCategoryDistribution().subscribe({
      next: (data) => this.categoryDistribution = data,
      error: () => console.log('Category distribution not available'),
    });
  }
}