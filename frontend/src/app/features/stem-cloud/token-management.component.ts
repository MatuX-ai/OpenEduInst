import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { StemCloudService, TokenTransaction, TokenService, TokenPackage } from '../../services/stem-cloud.service';

// Re-export for template compatibility
export { TokenTransaction, TokenService, TokenPackage };

@Component({
  selector: 'app-token-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatExpansionModule
  ],
  template: `
    <div class="token-management">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Token 余额监控</h1>
          <p class="subtitle">AI 助教、智能评测、课程生成按需付费</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="onPurchaseTokens()">
            <mat-icon>add_shopping_cart</mat-icon>
            充值 Token
          </button>
          <button mat-stroked-button (click)="onViewUsageReport()">
            <mat-icon>assessment</mat-icon>
            使用报告
          </button>
        </div>
      </div>

      <!-- Token Balance Overview -->
      <div class="balance-overview">
        <mat-card class="balance-card">
          <mat-card-content>
            <div class="balance-header">
              <div class="balance-icon">
                <mat-icon>token</mat-icon>
              </div>
              <div class="balance-info">
                <h2>{{ currentBalance.toLocaleString() }}</h2>
                <p>当前 Token 余额</p>
              </div>
            </div>
            <div class="balance-details">
              <div class="detail-item">
                <span class="label">本月消耗</span>
                <span class="value">{{ monthlyUsage.toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="label">本月充值</span>
                <span class="value">{{ monthlyPurchase.toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="label">预计可用天数</span>
                <span class="value">{{ estimatedDays }} 天</span>
              </div>
            </div>
            <div class="balance-trend">
              <span class="trend-label">近7天趋势:</span>
              <div class="trend-chart">
                <div *ngFor="let day of weeklyTrend" class="trend-bar" 
                     [style.height.%]="day.value" 
                     [class.up]="day.change > 0" 
                     [class.down]="day.change < 0">
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="usage-stats-card">
          <mat-card-header>
            <mat-card-title>服务使用统计</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="service-stats">
              <div *ngFor="let service of tokenServices" class="service-stat-item">
                <div class="service-icon" [style.background]="service.color">
                  <mat-icon>{{ service.icon }}</mat-icon>
                </div>
                <div class="service-info">
                  <h4>{{ service.name }}</h4>
                  <p>{{ service.totalUses }} 次使用</p>
                  <div class="usage-bar">
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="getServiceUsagePercentage(service)">
                    </mat-progress-bar>
                    <span class="usage-text">{{ service.costPerUse }} Token/次</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Token Services -->
      <div class="section-title">可用服务</div>
      <div class="services-grid">
        <mat-card *ngFor="let service of tokenServices" class="service-card">
          <mat-card-content>
            <div class="service-header">
              <div class="service-icon-large" [style.background]="service.color">
                <mat-icon>{{ service.icon }}</mat-icon>
              </div>
              <div class="service-cost">
                <span class="cost-value">{{ service.costPerUse }}</span>
                <span class="cost-unit">Token/次</span>
              </div>
            </div>
            <h3>{{ service.name }}</h3>
            <p class="service-description">{{ service.description }}</p>
            <div class="service-stats-mini">
              <div class="mini-stat">
                <span class="mini-value">{{ service.totalUses }}</span>
                <span class="mini-label">总使用次数</span>
              </div>
              <div class="mini-stat">
                <span class="mini-value">{{ getServiceMonthlyUses(service) }}</span>
                <span class="mini-label">本月使用</span>
              </div>
            </div>
            <button mat-stroked-button class="service-action-btn" (click)="onUseService(service)">
              立即使用
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Transaction History -->
      <mat-card class="transactions-card">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex">
          <mat-tab label="全部记录">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="table-controls">
                  <div class="search-box">
                    <mat-icon>search</mat-icon>
                    <input type="text" placeholder="搜索交易描述..." [(ngModel)]="searchTerm" />
                  </div>
                  <div class="filter-controls">
                    <select [(ngModel)]="typeFilter">
                      <option value="">全部类型</option>
                      <option value="purchase">充值</option>
                      <option value="usage">消费</option>
                      <option value="refund">退款</option>
                      <option value="bonus">赠送</option>
                    </select>
                    <select [(ngModel)]="dateFilter">
                      <option value="">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">本周</option>
                      <option value="month">本月</option>
                    </select>
                  </div>
                </div>

                <table mat-table [dataSource]="filteredTransactions" class="transaction-table">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>交易编号</th>
                    <td mat-cell *matCellDef="let transaction">{{ transaction.id }}</td>
                  </ng-container>

                  <!-- Type Column -->
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>类型</th>
                    <td mat-cell *matCellDef="let transaction">
                      <mat-chip [class]="'type-chip ' + transaction.type">
                        {{ getTransactionTypeText(transaction.type) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Amount Column -->
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>数量</th>
                    <td mat-cell *matCellDef="let transaction">
                      <span [class.positive]="transaction.type === 'purchase' || transaction.type === 'bonus'"
                            [class.negative]="transaction.type === 'usage' || transaction.type === 'refund'">
                        {{ transaction.type === 'purchase' || transaction.type === 'bonus' ? '+' : '-' }}{{ transaction.amount }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Description Column -->
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>描述</th>
                    <td mat-cell *matCellDef="let transaction">{{ transaction.description }}</td>
                  </ng-container>

                  <!-- Service Column -->
                  <ng-container matColumnDef="service">
                    <th mat-header-cell *matHeaderCellDef>服务</th>
                    <td mat-cell *matCellDef="let transaction">{{ transaction.service || '-' }}</td>
                  </ng-container>

                  <!-- Date Column -->
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>日期</th>
                    <td mat-cell *matCellDef="let transaction">{{ transaction.date }}</td>
                  </ng-container>

                  <!-- Balance After Column -->
                  <ng-container matColumnDef="balanceAfter">
                    <th mat-header-cell *matHeaderCellDef>余额</th>
                    <td mat-cell *matCellDef="let transaction">{{ transaction.balanceAfter.toLocaleString() }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="充值记录">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示充值记录...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="消费记录">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示消费记录...</p>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Purchase Packages -->
      <div class="section-title">充值套餐</div>
      <div class="packages-grid">
        <mat-card *ngFor="let package of tokenPackages" class="package-card" [class.popular]="package.popular">
          <mat-card-content>
            <div class="package-header">
              <h3>{{ package.name }}</h3>
              <div *ngIf="package.popular" class="popular-badge">最受欢迎</div>
            </div>
            <div class="package-tokens">
              <span class="token-count">{{ package.tokens.toLocaleString() }}</span>
              <span class="token-label">Token</span>
            </div>
            <div class="package-price">
              <span class="price-amount">¥{{ package.price }}</span>
              <span *ngIf="package.bonus > 0" class="bonus-text">+{{ package.bonus }} 赠送</span>
            </div>
            <div class="package-value">
              <span class="value-text">单价: ¥{{ (package.price / package.tokens).toFixed(3) }}/Token</span>
            </div>
            <button mat-raised-button color="primary" class="purchase-btn" (click)="onPurchasePackage(package)">
              立即购买
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    .token-management {
      padding: 24px;
      background: $color-neutral-100;
      min-height: 100%;
      color: $color-neutral-700;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: $color-neutral-900;
      line-height: 1.3;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: $color-neutral-500;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button mat-icon {
      margin-right: 8px;
    }

    /* Balance Overview - Cyberpunk Style */
    .balance-overview {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .balance-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
    }

    .balance-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, $color-brand-primary, $color-brand-primary, $color-brand-primary);
    }

    mat-card-content {
      padding: 28px !important;
    }

    .balance-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }

    .balance-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: $color-brand-primary-subtle;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $color-brand-primary;
    }

    .balance-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .balance-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .balance-info p {
      margin: 4px 0 0 0;
      color: $color-neutral-500;
      font-size: 14px;
    }

    .balance-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .detail-item {
      text-align: center;
      padding: 12px;
      background: $color-neutral-50;
      border: $card-border;
      border-radius: $radius-md;
    }

    .detail-item .label {
      display: block;
      font-size: 12px;
      color: $color-neutral-400;
      margin-bottom: 4px;
    }

    .detail-item .value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .balance-trend {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .trend-label {
      font-size: 14px;
      color: $color-neutral-500;
      white-space: nowrap;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 40px;
      flex: 1;
    }

    .trend-bar {
      flex: 1;
      background: $color-brand-primary;
      border-radius: 2px 2px 0 0;
      min-height: 4px;
      opacity: 0.3;
    }

    .trend-bar.down {
      background: $color-brand-primary;
      opacity: 0.15;
    }

    .usage-stats-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
    }

    .service-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .service-stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .service-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $color-brand-primary;
      flex-shrink: 0;
    }

    .service-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .service-info {
      flex: 1;
    }

    .service-info h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .service-info p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: $color-neutral-400;
    }

    .usage-bar {
      margin-top: 4px;
    }

    .usage-text {
      display: block;
      font-size: 11px;
      color: $color-neutral-400;
      margin-top: 4px;
    }

    /* Section Title */
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-700;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .service-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
    }

    .service-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .service-card mat-card-content {
      padding: 20px !important;
    }

    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .service-icon-large {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $color-brand-primary;
    }

    .service-icon-large mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .service-cost {
      text-align: right;
    }

    .cost-value {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .cost-unit {
      display: block;
      font-size: 11px;
      color: #666;
    }

    .service-card h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .service-description {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: $color-neutral-400;
      line-height: 1.4;
    }

    .service-stats-mini {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .mini-stat {
      flex: 1;
      text-align: center;
      padding: 8px;
      border: 1px solid $color-neutral-200;
      border-radius: 6px;
    }

    .mini-value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .mini-label {
      display: block;
      font-size: 10px;
      color: $color-neutral-400;
    }

    .service-action-btn {
      width: 100%;
    }

    /* Transactions Card */
    .transactions-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 20px;
    }

    .table-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .search-box {
      position: relative;
      width: 300px;
    }

    .search-box mat-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: $color-neutral-400;
    }

    .search-box input {
      width: 100%;
      padding: 10px 10px 10px 40px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: $card-bg;
    }

    .filter-controls {
      display: flex;
      gap: 12px;
    }

    .filter-controls select {
      padding: 8px 12px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: $card-bg;
    }

    /* Table Styles */
    .transaction-table {
      width: 100%;
    }

    .type-chip {
      font-size: 12px;
    }

    .type-chip.purchase {
      background: #e8f5e9;
      color: #388e3c;
    }

    .type-chip.usage {
      background: #fff3e0;
      color: #f57c00;
    }

    .type-chip.refund {
      background: #ffebee;
      color: #d32f2f;
    }

    .type-chip.bonus {
      background: #e3f2fd;
      color: #1976d2;
    }

    .positive {
      color: #4caf50;
      font-weight: 600;
    }

    .negative {
      color: #f44336;
      font-weight: 600;
    }

    /* Packages Grid */
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .package-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
      position: relative;
    }

    .package-card.popular {
      border-color: #f59e0b;
      position: relative;
      border-width: 2px;
    }

    .package-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .package-card mat-card-content {
      padding: 24px !important;
      text-align: center;
    }

    .package-header {
      position: relative;
      margin-bottom: 16px;
    }

    .package-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .popular-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff9800;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .package-tokens {
      margin-bottom: 16px;
    }

    .token-count {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .token-label {
      display: block;
      font-size: 14px;
      color: $color-neutral-400;
    }

    .package-price {
      margin-bottom: 12px;
    }

    .price-amount {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #2196f3;
    }

    .bonus-text {
      display: block;
      font-size: 12px;
      color: #4caf50;
      margin-top: 4px;
    }

    .package-value {
      margin-bottom: 20px;
    }

    .value-text {
      font-size: 12px;
      color: $color-neutral-500;
    }

    .purchase-btn {
      width: 100%;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .balance-overview {
        grid-template-columns: 1fr;
      }
      .services-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .packages-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
      }
      .packages-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .table-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .search-box {
        width: 100%;
      }
      .filter-controls {
        justify-content: stretch;
      }
      .filter-controls select {
        flex: 1;
      }
      .balance-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TokenManagementComponent implements OnInit {
  // Balance data with animation support
  currentBalance = 0;
  monthlyUsage = 0;
  monthlyPurchase = 0;
  estimatedDays = 0;

  // Weekly trend data (last 7 days usage)
  weeklyTrend = [
    { day: 'Mon', value: 60, change: 5 },
    { day: 'Tue', value: 75, change: 15 },
    { day: 'Wed', value: 80, change: 5 },
    { day: 'Thu', value: 65, change: -15 },
    { day: 'Fri', value: 90, change: 25 },
    { day: 'Sat', value: 45, change: -45 },
    { day: 'Sun', value: 30, change: -15 }
  ];

  // Token services (Mock for now, can be moved to API later)
  tokenServices: TokenService[] = [
    { 
      id: 'ai-assistant', 
      name: 'AI 助教', 
      description: '智能答疑、作业批改、个性化学习建议', 
      icon: 'psychology', 
      costPerUse: 5, 
      totalUses: 1240, 
      color: '#eff6ff' 
    },
    { 
      id: 'auto-grading', 
      name: '智能评测', 
      description: '自动批改编程作业、项目评估、能力诊断', 
      icon: 'fact_check', 
      costPerUse: 8, 
      totalUses: 856, 
      color: '#ecfdf5' 
    }
  ];

  // Transaction history
  transactions: TokenTransaction[] = [];

  // Purchase packages
  tokenPackages: TokenPackage[] = [
    { id: 'pkg-basic', name: '基础套餐', tokens: 500, price: 200, bonus: 0 },
    { id: 'pkg-standard', name: '标准套餐', tokens: 1000, price: 380, bonus: 50, popular: true },
    { id: 'pkg-premium', name: '高级套餐', tokens: 2500, price: 900, bonus: 200 },
    { id: 'pkg-enterprise', name: '企业套餐', tokens: 5000, price: 1700, bonus: 500 }
  ];

  // Table configuration
  displayedColumns: string[] = ['id', 'type', 'amount', 'description', 'service', 'date', 'balanceAfter'];
  selectedTabIndex = 0;
  
  // Filter variables
  searchTerm = '';
  typeFilter = '';
  dateFilter = '';

  orgId!: number;

  constructor(
    private stemService: StemCloudService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 1;
    this.loadTokenData();
  }

  loadTokenData(): void {
    // Load Balance
    this.stemService.getTokenBalance().subscribe({
      next: (data) => {
        this.currentBalance = data.balance;
      },
      error: (err) => {
        console.error('Failed to load balance', err);
        this.currentBalance = 1250; // Fallback
      }
    });

    // Load Transactions
    this.stemService.getTokenTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.calculateMonthlyStats();
      },
      error: (err) => {
        console.error('Failed to load transactions', err);
        this.loadMockTransactions();
      }
    });
  }

  calculateMonthlyStats(): void {
    // Simple logic to calculate stats from transactions
    this.monthlyUsage = this.transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + t.amount, 0);
    
    this.monthlyPurchase = this.transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);

    this.estimatedDays = this.currentBalance > 0 ? Math.floor(this.currentBalance / (this.monthlyUsage / 30 || 1)) : 0;
  }

  loadMockTransactions(): void {
    this.transactions = [
      { id: 'TXN-001', type: 'purchase', amount: 500, description: '月度充值', date: '2024-01-20', balanceAfter: 1250 },
      { id: 'TXN-002', type: 'usage', amount: 25, description: 'AI助教使用 (5次)', date: '2024-01-19', service: 'AI 助教', balanceAfter: 750 },
      { id: 'TXN-003', type: 'usage', amount: 40, description: '智能评测使用 (5次)', date: '2024-01-18', service: '智能评测', balanceAfter: 775 }
    ];
    this.calculateMonthlyStats();
  }

  // Helper methods
  getFilteredTransactions(): TokenTransaction[] {
    return this.transactions.filter(transaction => {
      const matchesSearch = !this.searchTerm || 
        transaction.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = !this.typeFilter || transaction.type === this.typeFilter;
      
      // Simple date filter logic (in real app, would compare actual dates)
      let matchesDate = true;
      if (this.dateFilter === 'today') {
        matchesDate = transaction.date === '2024-01-20'; // Example
      } else if (this.dateFilter === 'week') {
        // Would check if date is within last week
        matchesDate = true;
      } else if (this.dateFilter === 'month') {
        // Would check if date is within current month
        matchesDate = true;
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  }

  get filteredTransactions() {
    return this.getFilteredTransactions();
  }

  getTransactionTypeText(type: string): string {
    switch(type) {
      case 'purchase': return '充值';
      case 'usage': return '消费';
      case 'refund': return '退款';
      case 'bonus': return '赠送';
      default: return type;
    }
  }

  getServiceUsagePercentage(service: TokenService): number {
    // Calculate percentage based on total uses (mock calculation)
    const maxUses = 2000; // Assume max for progress bar
    return Math.min((service.totalUses / maxUses) * 100, 100);
  }

  getServiceMonthlyUses(service: TokenService): number {
    // Mock monthly usage calculation
    return Math.floor(service.totalUses * 0.15); // 15% of total as monthly
  }

  // Event handlers
  onPurchaseTokens(): void {
    this.router.navigate(['/organization', this.orgId, 'tokens', 'purchase']);
  }

  onViewUsageReport(): void {
    this.router.navigate(['/organization', this.orgId, 'tokens', 'report']);
  }

  onUseService(service: TokenService): void {
    this.router.navigate(['/organization', this.orgId, 'tokens', 'service', service.id]);
  }

  onPurchasePackage(packageItem: TokenPackage): void {
    this.router.navigate(['/organization', this.orgId, 'tokens', 'purchase'], {
      queryParams: { packageId: packageItem.id }
    });
  }
}