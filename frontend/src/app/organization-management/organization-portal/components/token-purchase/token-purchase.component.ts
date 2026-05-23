import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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

@Component({
  selector: 'app-token-purchase',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="token-purchase-container">
      <!-- 余额卡片 -->
      <mat-card class="balance-card">
        <mat-card-header>
          <mat-card-title>Token 余额</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="balance-display">
            <span class="balance-amount">{{ balance?.balance || 0 }}</span>
            <span class="balance-label">可用 Token</span>
          </div>
          <div class="balance-stats">
            <div class="stat-item">
              <span class="stat-label">累计购买</span>
              <span class="stat-value">{{ balance?.total_purchased || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">累计消耗</span>
              <span class="stat-value">{{ balance?.total_consumed || 0 }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 套餐列表 -->
      <h2 class="section-title">选择套餐</h2>
      <div class="packages-grid">
        <mat-card *ngFor="let pkg of packages" 
                  class="package-card" 
                  [class.popular]="pkg.is_popular"
                  (click)="purchasePackage(pkg)">
          <div class="popular-badge" *ngIf="pkg.is_popular">热门</div>
          <mat-card-header>
            <mat-card-title>{{ pkg.name }}</mat-card-title>
            <mat-card-subtitle>{{ pkg.description }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="package-details">
              <div class="token-amount">{{ pkg.token_amount }} Token</div>
              <div class="price">¥{{ pkg.price }}</div>
              <div class="validity">有效期：{{ pkg.validity_days }} 天</div>
              <div class="unit-price">单价：¥{{ (pkg.price / pkg.token_amount).toFixed(4) }}/Token</div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" class="full-width">立即购买</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .token-purchase-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .balance-card {
      margin-bottom: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .balance-card mat-card-title,
    .balance-card mat-card-subtitle {
      color: white;
    }
    .balance-display {
      text-align: center;
      padding: 20px 0;
    }
    .balance-amount {
      font-size: 48px;
      font-weight: bold;
      display: block;
    }
    .balance-label {
      font-size: 16px;
      opacity: 0.9;
    }
    .balance-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .stat-item {
      text-align: center;
    }
    .stat-label {
      display: block;
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
    }
    .section-title {
      margin: 32px 0 16px;
      font-size: 24px;
      color: #333;
    }
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .package-card {
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      border: 2px solid transparent;
    }
    .package-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
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
    }
    .package-details {
      padding: 16px 0;
    }
    .token-amount {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 8px;
    }
    .price {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    .validity,
    .unit-price {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class TokenPurchaseComponent implements OnInit {
  orgId!: number;
  balance: TokenBalance | null = null;
  packages: TokenPackage[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    console.log('[TokenPurchase] orgId:', this.orgId);
    this.loadBalance();
    this.loadPackages();
  }

  loadBalance() {
    const token = localStorage.getItem('access_token');
    this.http.get<TokenBalance>(`${environment.apiUrl}/api/v1/tokens/balance/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.balance = data;
      },
      error: (err) => {
        console.error('加载余额失败:', err);
      }
    });
  }

  loadPackages() {
    const token = localStorage.getItem('access_token');
    this.http.get<TokenPackage[]>(`${environment.apiUrl}/api/v1/tokens/packages/?active_only=true`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.packages = data;
      },
      error: (err) => {
        console.error('加载套餐失败:', err);
        // 使用模拟数据
        this.packages = [
          { id: 1, name: '体验包', description: '适合小规模试用', token_amount: 1000, price: 50, currency: 'CNY', validity_days: 365, is_popular: false },
          { id: 2, name: '标准包', description: '适合日常教学使用', token_amount: 5000, price: 200, currency: 'CNY', validity_days: 365, is_popular: true },
          { id: 3, name: '专业包', description: '适合大型培训机构', token_amount: 20000, price: 600, currency: 'CNY', validity_days: 365, is_popular: false },
          { id: 4, name: '企业包', description: ' unlimited 使用', token_amount: 100000, price: 2000, currency: 'CNY', validity_days: 365, is_popular: false }
        ];
      }
    });
  }

  purchasePackage(pkg: TokenPackage) {
    if (confirm(`确认购买 ${pkg.name}（${pkg.token_amount} Token）？\n价格：¥${pkg.price}`)) {
      const token = localStorage.getItem('access_token');
      this.http.post(`${environment.apiUrl}/api/v1/tokens/transactions/`, {
        transaction_type: 'purchase',
        amount: pkg.token_amount,
        description: `购买套餐：${pkg.name}`,
        unit_price: pkg.price / pkg.token_amount,
        total_cost: pkg.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => {
          this.snackBar.open('购买成功！Token 已到账', '关闭', { duration: 3000 });
          this.loadBalance();
        },
        error: (err) => {
          this.snackBar.open('购买失败，请稍后重试', '关闭', { panelClass: ['error-snackbar'] });
          console.error('购买失败:', err);
        }
      });
    }
  }
}
