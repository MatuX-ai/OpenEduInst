import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  MockPaymentDialogComponent,
  MockPaymentDialogResult,
} from './mock-payment-dialog.component';

interface TokenPackage {
  id: number;
  name: string;
  description: string;
  token_amount: number;
  price: number;
  currency: string;
  validity_days: number;
  is_popular: boolean;
}

interface TokenBalance {
  balance: number;
  total_purchased: number;
  total_consumed: number;
  last_transaction_at: string | null;
}

interface TokenOrder {
  id: number;
  order_no: string;
  package_id: number | null;
  token_amount: number;
  price: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string;
  transaction_id: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

@Component({
  selector: 'app-token-purchase',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  template: `
    <div class="token-purchase-container">
      <!-- 余额卡片 -->
      <mat-card class="balance-card" aria-label="Token 余额概览">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>account_balance_wallet</mat-icon>
            Token 余额
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="balance-display">
            <span class="balance-amount">{{ (balance?.balance || 0) | number }}</span>
            <span class="balance-label">可用 Token</span>
          </div>
          <div class="balance-stats">
            <div class="stat-item">
              <span class="stat-label">累计购买</span>
              <span class="stat-value">{{ (balance?.total_purchased || 0) | number }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">累计消耗</span>
              <span class="stat-value">{{ (balance?.total_consumed || 0) | number }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最后交易</span>
              <span class="stat-value small">
                {{ balance?.last_transaction_at ? ((balance?.last_transaction_at) | date:'short') : '—' }}
              </span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-tab-group [(selectedIndex)]="selectedTab" class="purchase-tabs">
        <!-- Tab 1: 购买套餐 -->
        <mat-tab label="购买套餐">
          <div class="tab-content">
            <h2 class="section-title">选择 Token 套餐</h2>
            <div *ngIf="packagesLoading" class="loading-row">
              <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
              <span>加载套餐...</span>
            </div>
            <div class="packages-grid" *ngIf="!packagesLoading">
              <mat-card
                *ngFor="let pkg of packages"
                class="package-card"
                [class.popular]="pkg.is_popular"
                [attr.aria-label]="'购买 ' + pkg.name + '，' + pkg.token_amount + ' Token，¥' + pkg.price"
                (click)="purchasePackage(pkg)"
                role="button"
                tabindex="0"
                (keydown.enter)="purchasePackage(pkg)"
                (keydown.space)="purchasePackage(pkg); $event.preventDefault()"
              >
                <div class="popular-badge" *ngIf="pkg.is_popular">热门</div>
                <mat-card-header>
                  <mat-card-title>{{ pkg.name }}</mat-card-title>
                  <mat-card-subtitle>{{ pkg.description }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="package-details">
                    <div class="token-amount">
                      <span class="num">{{ pkg.token_amount | number }}</span>
                      <span class="unit">Token</span>
                    </div>
                    <div class="price">¥{{ pkg.price }}</div>
                    <div class="validity">有效期：{{ pkg.validity_days }} 天</div>
                    <div class="unit-price">
                      单价：¥{{ (pkg.price / pkg.token_amount).toFixed(4) }}/Token
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button
                    mat-raised-button
                    color="primary"
                    class="full-width"
                    [attr.aria-label]="'立即购买 ' + pkg.name"
                  >
                    <mat-icon>shopping_cart</mat-icon>
                    立即购买
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: 订单记录 -->
        <mat-tab label="订单记录">
          <div class="tab-content">
            <div class="orders-toolbar">
              <h2 class="section-title inline">订单列表</h2>
              <button
                mat-stroked-button
                (click)="loadOrders()"
                [disabled]="ordersLoading"
                aria-label="刷新订单列表"
              >
                <mat-icon>refresh</mat-icon>
                刷新
              </button>
            </div>
            <div *ngIf="ordersLoading" class="loading-row">
              <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
              <span>加载订单...</span>
            </div>
            <table
              *ngIf="!ordersLoading && orders.length > 0"
              mat-table
              [dataSource]="orders"
              class="orders-table"
              aria-label="订单记录"
            >
              <ng-container matColumnDef="order_no">
                <th mat-header-cell *matHeaderCellDef>订单号</th>
                <td mat-cell *matCellDef="let o">
                  <span class="mono">{{ o.order_no }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>金额 / Token</th>
                <td mat-cell *matCellDef="let o">
                  <div>¥{{ o.price.toFixed(2) }}</div>
                  <div class="muted">{{ o.token_amount | number }} Token</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let o">
                  <mat-chip [class]="'status-chip status-' + o.status" disableRipple>
                    {{ getStatusText(o.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef>支付方式</th>
                <td mat-cell *matCellDef="let o">{{ getMethodText(o.payment_method) }}</td>
              </ng-container>

              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>创建时间</th>
                <td mat-cell *matCellDef="let o">{{ o.created_at | date:'short' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: orderColumns"></tr>
            </table>

            <div *ngIf="!ordersLoading && orders.length === 0" class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>暂无订单记录</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .token-purchase-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .balance-card {
        margin-bottom: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .balance-card mat-card-title,
      .balance-card mat-card-subtitle {
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .balance-card mat-card-title mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .balance-display {
        text-align: center;
        padding: 16px 0;
      }
      .balance-amount {
        font-size: 48px;
        font-weight: bold;
        display: block;
        line-height: 1;
      }
      .balance-label {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 8px;
        display: block;
      }
      .balance-stats {
        display: flex;
        justify-content: space-around;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }
      .stat-item {
        text-align: center;
        flex: 1;
      }
      .stat-label {
        display: block;
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 4px;
      }
      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: bold;
      }
      .stat-value.small {
        font-size: 12px;
        font-weight: 500;
      }
      .purchase-tabs {
        margin-top: 16px;
      }
      .tab-content {
        padding: 16px 0;
      }
      .section-title {
        margin: 8px 0 16px;
        font-size: 18px;
        color: #263238;
      }
      .section-title.inline {
        display: inline-block;
        margin-right: 16px;
      }
      .loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px;
        justify-content: center;
        color: #607d8b;
      }
      .packages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
      }
      .package-card {
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        border: 2px solid transparent;
        outline: none;
      }
      .package-card:focus-visible {
        border-color: #1976d2;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.3);
      }
      .package-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        border-color: #667eea;
      }
      .package-card.popular {
        border-color: #ff6b6b;
      }
      .popular-badge {
        position: absolute;
        top: -10px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1;
      }
      .package-details {
        padding: 8px 0;
      }
      .token-amount {
        margin-bottom: 8px;
      }
      .token-amount .num {
        font-size: 32px;
        font-weight: bold;
        color: #1976d2;
        line-height: 1;
      }
      .token-amount .unit {
        font-size: 14px;
        color: #607d8b;
        margin-left: 4px;
      }
      .price {
        font-size: 24px;
        font-weight: bold;
        color: #d32f2f;
        margin-bottom: 8px;
      }
      .validity,
      .unit-price {
        font-size: 12px;
        color: #607d8b;
        margin-bottom: 4px;
      }
      .full-width {
        width: 100%;
      }
      .full-width mat-icon {
        margin-right: 6px;
        font-size: 18px;
        width: 18px;
        height: 18px;
        vertical-align: middle;
      }
      .orders-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .orders-table {
        width: 100%;
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }
      .orders-table .mono {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
      }
      .orders-table .muted {
        color: #607d8b;
        font-size: 12px;
      }
      .status-chip {
        font-size: 12px;
        font-weight: 500;
      }
      .status-pending,
      .status-processing {
        background: #fff8e1 !important;
        color: #f57c00 !important;
      }
      .status-success {
        background: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
      .status-failed,
      .status-cancelled {
        background: #ffebee !important;
        color: #c62828 !important;
      }
      .status-refunded {
        background: #e3f2fd !important;
        color: #1565c0 !important;
      }
      .empty-state {
        text-align: center;
        padding: 48px 16px;
        color: #607d8b;
      }
      .empty-state mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        opacity: 0.5;
      }
      .empty-state p {
        margin-top: 8px;
      }
      @media (max-width: 600px) {
        .packages-grid {
          grid-template-columns: 1fr;
        }
        .balance-stats {
          flex-direction: column;
          gap: 12px;
        }
      }
    `,
  ],
})
export class TokenPurchaseComponent implements OnInit {
  orgId!: number;
  balance: TokenBalance | null = null;
  packages: TokenPackage[] = [];
  packagesLoading = false;

  orders: TokenOrder[] = [];
  ordersLoading = false;
  orderColumns = ['order_no', 'amount', 'status', 'method', 'time'];
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    console.log('[TokenPurchase] orgId:', this.orgId);
    this.loadBalance();
    this.loadPackages();
    this.loadOrders();
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  loadBalance(): void {
    this.http
      .get<TokenBalance>(`${environment.apiUrl}/api/v1/tokens/balance/`, this.authHeaders)
      .subscribe({
        next: (data) => (this.balance = data),
        error: (err) => console.error('加载余额失败:', err),
      });
  }

  loadPackages(): void {
    this.packagesLoading = true;
    this.http
      .get<TokenPackage[]>(
        `${environment.apiUrl}/api/v1/tokens/packages/?active_only=true`,
        this.authHeaders
      )
      .subscribe({
        next: (data) => {
          this.packages = data;
          this.packagesLoading = false;
        },
        error: (err) => {
          console.error('加载套餐失败:', err);
          // 降级：使用模拟数据
          this.packages = [
            { id: 1, name: '体验包', description: '适合小规模试用', token_amount: 1000, price: 50, currency: 'CNY', validity_days: 365, is_popular: false },
            { id: 2, name: '标准包', description: '适合日常教学使用', token_amount: 5000, price: 200, currency: 'CNY', validity_days: 365, is_popular: true },
            { id: 3, name: '专业包', description: '适合大型培训机构', token_amount: 20000, price: 600, currency: 'CNY', validity_days: 365, is_popular: false },
            { id: 4, name: '企业包', description: 'unlimited 使用', token_amount: 100000, price: 2000, currency: 'CNY', validity_days: 365, is_popular: false },
          ];
          this.packagesLoading = false;
        },
      });
  }

  loadOrders(): void {
    this.ordersLoading = true;
    this.http
      .get<TokenOrder[]>(`${environment.apiUrl}/api/v1/token-orders/`, this.authHeaders)
      .subscribe({
        next: (data) => {
          this.orders = data;
          this.ordersLoading = false;
        },
        error: (err) => {
          console.error('加载订单失败:', err);
          this.orders = [];
          this.ordersLoading = false;
        },
      });
  }

  purchasePackage(pkg: TokenPackage): void {
    // 第一步：创建订单
    this.http
      .post<{
        order: TokenOrder;
        payment_url: string;
        transaction_id: string;
        payment_status: string;
      }>(`${environment.apiUrl}/api/v1/token-orders/`, {
        package_id: pkg.id,
        payment_method: 'mock',
      }, this.authHeaders)
      .subscribe({
        next: (resp) => {
          // 第二步：弹出 Mock 支付确认对话框
          const dialogRef = this.dialog.open<MockPaymentDialogComponent, any, MockPaymentDialogResult>(
            MockPaymentDialogComponent,
            {
              data: {
                orderNo: resp.order.order_no,
                packageName: pkg.name,
                tokenAmount: pkg.token_amount,
                price: pkg.price,
                currency: pkg.currency,
                transactionId: resp.transaction_id,
                paymentMethodLabel: '沙箱 Mock 支付',
              },
              width: '480px',
              disableClose: true,
            }
          );

          dialogRef.afterClosed().subscribe((result) => {
            if (!result) {
              this.snackBar.open('已取消支付', '关闭', { duration: 2000 });
              return;
            }

            // 第三步：调 Mock 支付确认
            this.confirmPayment(resp.order.order_no, result.forceFail);
          });
        },
        error: (err) => {
          console.error('创建订单失败:', err);
          this.snackBar.open(
            err?.error?.detail || '创建订单失败，请稍后重试',
            '关闭',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        },
      });
  }

  private confirmPayment(orderNo: string, forceFail: boolean): void {
    this.http
      .post<TokenOrder>(
        `${environment.apiUrl}/api/v1/token-orders/${orderNo}/mock-confirm`,
        { force_fail: forceFail },
        this.authHeaders
      )
      .subscribe({
        next: (order) => {
          if (order.status === 'success') {
            this.snackBar.open(
              `支付成功！到账 ${order.token_amount.toLocaleString()} Token`,
              '关闭',
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.loadBalance();
            this.loadOrders();
          }
        },
        error: (err) => {
          if (err?.status === 402) {
            this.snackBar.open('模拟支付失败（演示场景）', '关闭', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          } else {
            this.snackBar.open(
              err?.error?.detail || '支付确认失败',
              '关闭',
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
          this.loadOrders();
        },
      });
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      pending: '待支付',
      processing: '处理中',
      success: '已支付',
      failed: '已失败',
      refunded: '已退款',
      cancelled: '已取消',
    };
    return map[status] || status;
  }

  getMethodText(method: string): string {
    const map: Record<string, string> = {
      mock: '沙箱',
      wechat: '微信',
      alipay: '支付宝',
      bank_transfer: '银行',
    };
    return map[method] || method;
  }
}
