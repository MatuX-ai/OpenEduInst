import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

interface SocialAccount {
  id: number;
  platform: string;
  account_name: string;
  followers_count: number;
  total_posts: number;
  conversion_leads: number;
  is_active: boolean;
}

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  participants_count: number;
  target_participants: number;
  conversion_rate?: number;
  revenue: number;
  description: string;
}

interface Coupon {
  id: number;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_amount?: number;
  condition_description: string;
  total_quantity: number;
  used_quantity: number;
  expiry_date: string;
  is_active: boolean;
}

interface MarketingStats {
  monthly_revenue: number;
  active_participants: number;
  avg_conversion_rate: number;
  total_coupons_issued: number;
  total_coupons_used: number;
}

@Component({
  selector: 'app-marketing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTableModule,
    MatTabsModule
  ],
  template: `
    <div class="marketing-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">营销中心</h1>
          <p class="page-subtitle">社媒管理、营销活动、优惠券管理</p>
        </div>
        <button mat-raised-button color="primary" (click)="createCampaign()">
          <mat-icon>add</mat-icon>
          创建活动
        </button>
      </div>

      <mat-tab-group class="marketing-tabs">
        <!-- Tab 1: 社媒管理 -->
        <mat-tab label="社媒管理">
          <div class="tab-content">
            <div class="section-header">
              <h2 class="section-title">社交媒体账号</h2>
              <button mat-stroked-button color="primary" (click)="addSocialAccount()">
                <mat-icon>add</mat-icon> 添加账号
              </button>
            </div>
            <div class="social-grid">
              <div *ngFor="let account of socialAccounts" class="social-card">
                <div class="social-header">
                  <mat-icon [class]="'platform-icon ' + account.platform">{{ getPlatformIcon(account.platform) }}</mat-icon>
                  <div class="social-info">
                    <h3>{{ account.account_name }}</h3>
                    <p>{{ getPlatformName(account.platform) }}</p>
                  </div>
                </div>
                <div class="social-stats">
                  <div class="s-stat">
                    <span class="label">粉丝</span>
                    <span class="value">{{ account.followers_count }}</span>
                  </div>
                  <div class="s-stat">
                    <span class="label">发布</span>
                    <span class="value">{{ account.total_posts }}</span>
                  </div>
                  <div class="s-stat">
                    <span class="label">转化</span>
                    <span class="value green-text">{{ account.conversion_leads }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: 营销活动 -->
        <mat-tab label="营销活动">
          <div class="tab-content">
            <!-- Stats Cards -->
            <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月营销收入</p>
              <p class="stat-value">¥{{ formatRevenue(stats.monthly_revenue) }}</p>
              <p class="stat-desc green">+32% 较上月</p>
            </div>
            <div class="stat-icon-wrapper green">
              <mat-icon>campaign</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">活动参与人数</p>
              <p class="stat-value">{{ stats.active_participants || 0 }}</p>
              <p class="stat-desc blue">{{ activeCampaigns.length }}个活动中</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>groups</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">平均转化率</p>
              <p class="stat-value">{{ stats.avg_conversion_rate || 0 }}%</p>
              <p class="stat-desc purple">行业优秀水平</p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>percent</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">优惠券发放</p>
              <p class="stat-value">{{ stats.total_coupons_issued || 0 }}</p>
              <p class="stat-desc">已使用{{ stats.total_coupons_used || 0 }}张</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>card_giftcard</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaigns Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="header-left">
            <mat-icon class="section-icon">campaign</mat-icon>
            <h2 class="section-title">营销活动</h2>
            <span class="badge">共 {{ campaigns.length }} 个</span>
          </div>
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="搜索活动..." [(ngModel)]="searchKeyword" />
          </div>
        </div>

        <div class="campaigns-list">
          <div *ngFor="let campaign of filteredCampaigns" class="campaign-item">
            <div class="campaign-header">
              <div class="campaign-info">
                <div class="title-row">
                  <h3 class="campaign-name">{{ campaign.name }}</h3>
                  <span [class]="'status-badge ' + getStatusClass(campaign.status)">
                    {{ campaign.status }}
                  </span>
                  <span class="type-badge">{{ campaign.type }}</span>
                </div>
                <p class="campaign-desc">{{ campaign.description }}</p>
              </div>
            </div>

            <div class="campaign-stats">
              <div class="stat-item">
                <p class="stat-label">活动时间</p>
                <p class="stat-value-small">{{ formatDate(campaign.start_date) }} ~ {{ formatDate(campaign.end_date) }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">参与人数</p>
                <p class="stat-value-small">{{ campaign.participants_count }} / {{ campaign.target_participants }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">转化率</p>
                <p class="stat-value-green">{{ campaign.conversion_rate || '-' }}%</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">带来营收</p>
                <p class="stat-value-bold">¥{{ campaign.revenue.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-label">目标完成度</span>
                <span class="progress-percent">{{ getProgressPercent(campaign) }}%</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getProgressPercent(campaign)"
                class="progress-bar">
              </mat-progress-bar>
            </div>

            <div class="campaign-actions">
              <button mat-raised-button color="primary" (click)="manageCampaign(campaign)">
                管理活动
              </button>
              <button mat-stroked-button (click)="viewData(campaign)">
                查看数据
              </button>
              <button mat-stroked-button (click)="editCampaign(campaign)">
                编辑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Coupons Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="header-left">
            <mat-icon class="section-icon amber">card_giftcard</mat-icon>
            <h2 class="section-title">优惠券管理</h2>
            <span class="badge">共 {{ coupons.length }} 种</span>
          </div>
          <button mat-raised-button color="accent" (click)="createCoupon()">
            <mat-icon>add</mat-icon>
            新建优惠券
          </button>
        </div>

        <table mat-table [dataSource]="coupons" class="coupon-table">
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>优惠券名称</th>
            <td mat-cell *matCellDef="let coupon">
              <div>
                <p class="coupon-name">{{ coupon.name }}</p>
                <p class="coupon-code">{{ coupon.code }}</p>
              </div>
            </td>
          </ng-container>

          <!-- Discount Column -->
          <ng-container matColumnDef="discount">
            <th mat-header-cell *matHeaderCellDef>优惠内容</th>
            <td mat-cell *matCellDef="let coupon">
              <span class="discount-value">{{ formatDiscount(coupon) }}</span>
            </td>
          </ng-container>

          <!-- Condition Column -->
          <ng-container matColumnDef="condition">
            <th mat-header-cell *matHeaderCellDef>使用条件</th>
            <td mat-cell *matCellDef="let coupon">
              {{ coupon.condition_description }}
            </td>
          </ng-container>

          <!-- Usage Column -->
          <ng-container matColumnDef="usage">
            <th mat-header-cell *matHeaderCellDef>发放/使用</th>
            <td mat-cell *matCellDef="let coupon">
              <div class="usage-info">
                <span>{{ coupon.used_quantity }} / {{ coupon.total_quantity }}</span>
                <div class="usage-bar">
                  <div class="usage-fill" [style.width.%]="getUsagePercent(coupon)"></div>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Expiry Column -->
          <ng-container matColumnDef="expiry">
            <th mat-header-cell *matHeaderCellDef>有效期</th>
            <td mat-cell *matCellDef="let coupon">
              至 {{ formatDate(coupon.expiry_date) }}
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let coupon">
              <span [class]="'status-chip ' + (coupon.is_active ? 'active' : 'inactive')">
                {{ coupon.is_active ? '有效' : '无效' }}
              </span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let coupon">
              <button mat-button color="primary" (click)="editCoupon(coupon)">编辑</button>
              <button mat-button (click)="viewCouponData(coupon)">数据</button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .marketing-container {
      padding: $spacing-lg;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-lg;
    }

    .page-title {
      font-size: $font-size-2xl;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: $font-size-sm;
      color: $color-neutral-500;
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: $spacing-md;
      margin-bottom: $spacing-lg;
    }

    .stat-card {
      background: $card-bg;
      border-radius: $radius-lg;
      padding: 20px;
      box-shadow: $card-shadow;
      border: $card-border;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: $font-size-xs;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: $font-size-xs;
      margin: 0;
    }

    .stat-desc.green { color: $color-stem-green; }
    .stat-desc.blue { color: $color-brand-primary; }
    .stat-desc.purple { color: $color-brand-primary; }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: $spacing-md;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-icon-wrapper.green { background: $color-stem-green-bg; color: $color-stem-green; }
    .stat-icon-wrapper.blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon-wrapper.purple { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon-wrapper.amber { background: $color-warning-light; color: $color-warning; }

    /* Section Card */
    .section-card {
      background: $card-bg;
      border-radius: $radius-lg;
      box-shadow: $card-shadow;
      border: $card-border;
      margin-bottom: $spacing-lg;
      overflow: hidden;
    }

    .section-header {
      padding: 20px;
      border-bottom: 1px solid $color-neutral-100;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: $spacing-md;
    }

    .section-icon {
      color: $color-brand-primary;
    }

    .section-icon.amber {
      color: $color-warning;
    }

    .section-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-800;
      margin: 0;
    }

    .badge {
      font-size: $font-size-xs;
      padding: 4px 10px;
      background: $color-neutral-100;
      color: $color-neutral-600;
      border-radius: 12px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box mat-icon {
      position: absolute;
      left: 12px;
      color: $color-neutral-400;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .search-box input {
      padding: 8px 12px 8px 36px;
      border: $card-border;
      border-radius: $radius-md;
      font-size: $font-size-sm;
      width: 220px;
      outline: none;
    }

    .search-box input:focus {
      border-color: $color-brand-primary;
    }

    /* Campaigns List */
    .campaigns-list {
      padding: 20px;
    }

    .campaign-item {
      border: $card-border;
      border-radius: $radius-md;
      padding: 20px;
      margin-bottom: $spacing-md;
      transition: box-shadow 0.2s;
    }

    .campaign-item:hover {
      box-shadow: $shadow-md;
    }

    .campaign-header {
      margin-bottom: 16px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .campaign-name {
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0;
    }

    .status-badge {
      font-size: $font-size-xs;
      padding: 4px 10px;
      border-radius: $radius-sm;
      border: 1px solid;
    }

    .status-badge.active {
      background: $color-stem-green-bg;
      color: $color-stem-green;
      border-color: $color-stem-green-bg;
    }

    .status-badge.planned {
      background: $color-warning-light;
      color: $color-warning;
      border-color: $color-warning-light;
    }

    .status-badge.ended {
      background: $color-neutral-50;
      color: $color-neutral-500;
      border-color: $color-neutral-200;
    }

    .type-badge {
      font-size: $font-size-xs;
      padding: 4px 10px;
      background: $color-brand-primary-bg;
      color: $color-brand-primary;
      border-radius: $radius-sm;
    }

    .campaign-desc {
      font-size: $font-size-sm;
      color: $color-neutral-600;
      margin: 0;
    }

    .campaign-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $spacing-md;
      margin-bottom: 16px;
    }

    .stat-item {
      padding: 12px;
      background: $color-neutral-50;
      border-radius: $radius-sm;
    }

    .stat-item .stat-label {
      font-size: $font-size-xs;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .stat-value-small {
      font-size: $font-size-sm;
      color: $color-neutral-900;
      margin: 0;
    }

    .stat-value-green {
      font-size: $font-size-sm;
      color: $color-stem-green;
      font-weight: 600;
      margin: 0;
    }

    .stat-value-bold {
      font-size: $font-size-sm;
      color: $color-neutral-900;
      font-weight: 700;
      margin: 0;
    }

    .progress-section {
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: $font-size-xs;
      color: $color-neutral-600;
    }

    .progress-percent {
      font-size: $font-size-xs;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .progress-bar {
      height: 8px;
      border-radius: $radius-sm;
    }

    .campaign-actions {
      display: flex;
      gap: $spacing-sm;
    }

    /* Coupon Table */
    .coupon-table {
      width: 100%;
    }

    .coupon-name {
      font-size: $font-size-sm;
      font-weight: 500;
      color: $color-neutral-900;
      margin: 0 0 2px 0;
    }

    .coupon-code {
      font-size: $font-size-xs;
      color: $color-neutral-500;
      font-family: monospace;
      margin: 0;
    }

    .discount-value {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-warning;
    }

    .usage-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .usage-bar {
      width: 80px;
      height: 6px;
      background: $color-neutral-200;
      border-radius: $radius-sm;
      overflow: hidden;
    }

    .usage-fill {
      height: 100%;
      background: $color-warning;
      border-radius: $radius-sm;
    }

    .status-chip {
      font-size: $font-size-xs;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .status-chip.active {
      background: $color-stem-green-bg;
      color: $color-stem-green;
    }

    .status-chip.inactive {
      background: $color-neutral-50;
      color: $color-neutral-500;
    }

    /* Tabs & New Sections */
    .marketing-tabs {
      background: transparent;
    }

    .tab-content {
      padding-top: 20px;
    }

    .social-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .social-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      padding: 20px;
      transition: all 0.2s;
    }

    .social-card:hover {
      box-shadow: $shadow-md;
      transform: translateY(-2px);
    }

    .social-header {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: 20px;
    }

    .platform-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      padding: 8px;
      border-radius: $radius-md;
    }

    .platform-icon.wechat { background: $color-stem-green-bg; color: $color-stem-green; }
    .platform-icon.douyin { background: $color-neutral-50; color: $color-neutral-900; }
    .platform-icon.xiaohongshu { background: $color-error-light; color: $color-error; }
    .platform-icon.weibo { background: $color-warning-light; color: $color-warning; }
    .platform-icon.bilibili { background: $color-brand-primary-bg; color: $color-brand-primary; }

    .social-info h3 {
      font-size: $font-size-base;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: $color-neutral-900;
    }

    .social-info p {
      font-size: $font-size-xs;
      color: $color-neutral-500;
      margin: 0;
    }

    .social-stats {
      display: flex;
      justify-content: space-between;
      padding-top: $spacing-md;
      border-top: 1px solid $color-neutral-100;
    }

    .s-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .s-stat .label {
      font-size: $font-size-xs;
      color: $color-neutral-500;
      margin-bottom: 4px;
    }

    .s-stat .value {
      font-size: $font-size-base;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .source-list {
      padding: 20px;
    }

    .source-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid $color-neutral-100;
    }

    .source-name {
      font-size: $font-size-sm;
      color: $color-neutral-600;
    }

    .source-count {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .green-text { color: $color-stem-green; }
    .amber-text { color: $color-warning; }
  `]
})
export class MarketingComponent implements OnInit {
  searchKeyword: string = '';
  displayedColumns: string[] = ['name', 'discount', 'condition', 'usage', 'expiry', 'status', 'actions'];

  socialAccounts: SocialAccount[] = [
    { id: 1, platform: 'wechat', account_name: 'MatuX编程', followers_count: 12500, total_posts: 86, conversion_leads: 45, is_active: true },
    { id: 2, platform: 'douyin', account_name: 'MatuX机器人', followers_count: 34200, total_posts: 124, conversion_leads: 78, is_active: true },
    { id: 3, platform: 'xiaohongshu', account_name: 'STEM教育笔记', followers_count: 8900, total_posts: 52, conversion_leads: 23, is_active: true }
  ];

  stats: MarketingStats = {
    monthly_revenue: 47000,
    active_participants: 68,
    avg_conversion_rate: 51,
    total_coupons_issued: 350,
    total_coupons_used: 188
  };

  campaigns: Campaign[] = [];
  coupons: Coupon[] = [];
  activeCampaigns: Campaign[] = [];

  // Mock data
  mockCampaigns: Campaign[] = [
    {
      id: 1,
      name: '春季招生拼团活动',
      type: '拼团',
      status: '进行中',
      start_date: '2026-05-01T00:00:00',
      end_date: '2026-06-30T23:59:59',
      participants_count: 45,
      target_participants: 60,
      conversion_rate: 38,
      revenue: 28500,
      description: '3人成团，每人优惠¥200'
    },
    {
      id: 2,
      name: '老带新推荐奖励',
      type: '推荐',
      status: '长期有效',
      start_date: '2026-01-01T00:00:00',
      end_date: '2026-12-31T23:59:59',
      participants_count: 23,
      target_participants: 50,
      conversion_rate: 65,
      revenue: 18400,
      description: '推荐成功双方各得¥300优惠券'
    },
    {
      id: 3,
      name: '暑期集训营早鸟价',
      type: '优惠券',
      status: '即将开始',
      start_date: '2026-06-15T00:00:00',
      end_date: '2026-07-15T23:59:59',
      participants_count: 0,
      target_participants: 80,
      revenue: 0,
      description: '6月15日前报名享8折优惠'
    }
  ];

  mockCoupons: Coupon[] = [
    {
      id: 1,
      code: 'NEWBIE200',
      name: '新人专享券',
      discount_type: 'fixed',
      discount_value: 200,
      min_amount: 1000,
      condition_description: '满¥1000可用',
      total_quantity: 100,
      used_quantity: 67,
      expiry_date: '2026-12-31T23:59:59',
      is_active: true
    },
    {
      id: 2,
      code: 'RENEW15',
      name: '续费优惠券',
      discount_type: 'percentage',
      discount_value: 85,
      condition_description: '续费课程可用',
      total_quantity: 50,
      used_quantity: 32,
      expiry_date: '2026-06-30T23:59:59',
      is_active: true
    },
    {
      id: 3,
      code: 'GROUP100',
      name: '拼团专属券',
      discount_type: 'fixed',
      discount_value: 100,
      condition_description: '拼团成功后发放',
      total_quantity: 200,
      used_quantity: 89,
      expiry_date: '2026-08-31T23:59:59',
      is_active: true
    }
  ];

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.campaigns = this.mockCampaigns;
    this.coupons = this.mockCoupons;
    this.activeCampaigns = this.campaigns.filter(c => c.status === '进行中');
  }

  get filteredCampaigns(): Campaign[] {
    if (!this.searchKeyword) {
      return this.campaigns;
    }
    const keyword = this.searchKeyword.toLowerCase();
    return this.campaigns.filter(c => 
      c.name.toLowerCase().includes(keyword) || 
      c.description.toLowerCase().includes(keyword)
    );
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      '进行中': 'active',
      '长期有效': 'active',
      '即将开始': 'planned',
      '已结束': 'ended'
    };
    return classes[status] || 'active';
  }

  getProgressPercent(campaign: Campaign): number {
    if (!campaign.target_participants || campaign.target_participants === 0) {
      return 0;
    }
    return Math.round((campaign.participants_count / campaign.target_participants) * 100);
  }

  getUsagePercent(coupon: Coupon): number {
    if (coupon.total_quantity === 0) {
      return 0;
    }
    return Math.round((coupon.used_quantity / coupon.total_quantity) * 100);
  }

  formatRevenue(value: number): string {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + '万';
    }
    return value.toLocaleString();
  }

  formatDate(dateString: string): string {
    return dateString.split('T')[0];
  }

  formatDiscount(coupon: Coupon): string {
    if (coupon.discount_type === 'fixed') {
      return `¥${coupon.discount_value}`;
    } else {
      return `${coupon.discount_value}折`;
    }
  }

  createCampaign() {
    console.log('Create campaign');
    // TODO: 打开创建对话框
  }

  manageCampaign(campaign: Campaign) {
    console.log('Manage campaign:', campaign);
  }

  viewData(campaign: Campaign) {
    console.log('View data:', campaign);
  }

  editCampaign(campaign: Campaign) {
    console.log('Edit campaign:', campaign);
  }

  createCoupon() {
    console.log('Create coupon');
    // TODO: 打开创建对话框
  }

  editCoupon(coupon: Coupon) {
    console.log('Edit coupon:', coupon);
  }

  viewCouponData(coupon: Coupon) {
    console.log('View coupon data:', coupon);
  }

  addSocialAccount() {
    console.log('Add social account');
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      'wechat': 'chat',
      'douyin': 'music_note',
      'xiaohongshu': 'book',
      'weibo': 'public',
      'bilibili': 'smart_display'
    };
    return icons[platform] || 'link';
  }

  getPlatformName(platform: string): string {
    const names: Record<string, string> = {
      'wechat': '微信公众号',
      'douyin': '抖音',
      'xiaohongshu': '小红书',
      'weibo': '微博',
      'bilibili': 'Bilibili'
    };
    return names[platform] || platform;
  }
}
