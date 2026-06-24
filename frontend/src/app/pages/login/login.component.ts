import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, DemoAccount } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon class="logo-icon" aria-hidden="false">memory</mat-icon>
          <mat-card-title>OpenMT 教育管理系统</mat-card-title>
          <mat-card-subtitle>一站式 STEM 教育管理云平台</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- 账号密码登录 -->
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>用户名</mat-label>
              <input
                matInput
                type="text"
                [(ngModel)]="username"
                name="username"
                required
                placeholder="请输入用户名"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>密码</mat-label>
              <input
                matInput
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="请输入密码"
              />
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width login-btn"
              [disabled]="loading || !loginForm.valid"
            >
              <span *ngIf="!loading">登录</span>
              <mat-progress-spinner
                *ngIf="loading"
                diameter="20"
                mode="indeterminate"
              ></mat-progress-spinner>
            </button>
          </form>

          <mat-divider class="divider"></mat-divider>

          <!-- 演示账号一键登录 -->
          <div class="demo-section">
            <div class="demo-title">
              <mat-icon color="accent">stars</mat-icon>
              <span>一键体验演示系统</span>
            </div>
            <p class="demo-hint">选择以下任一角色快速登录，无需输入密码</p>
            <div class="demo-accounts">
              <button
                *ngFor="let acc of demoAccounts"
                class="demo-account-btn"
                [class.loading]="demoLoading === acc.username"
                (click)="onDemoLogin(acc)"
                [disabled]="demoLoading !== null"
              >
                <div class="demo-account-info">
                  <div class="demo-account-label">{{ acc.label }}</div>
                  <div class="demo-account-org">
                    <mat-icon>business</mat-icon>
                    {{ acc.org_name }}
                  </div>
                </div>
                <mat-icon class="demo-account-arrow" *ngIf="demoLoading !== acc.username">arrow_forward_ios</mat-icon>
                <mat-progress-spinner
                  *ngIf="demoLoading === acc.username"
                  diameter="18"
                  mode="indeterminate"
                ></mat-progress-spinner>
              </button>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <p class="footer-hint">
            💡 演示环境数据每日重置，仅供功能体验
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #42a5f5 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 32px;
      border-radius: 16px;
    }

    .logo-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1565c0;
      margin-bottom: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-card-header {
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
      text-align: center;
    }

    mat-card-title {
      font-size: 22px;
      font-weight: 600;
    }

    mat-card-subtitle {
      margin-top: 4px;
      color: rgba(0, 0, 0, 0.5);
    }

    .login-btn {
      margin-top: 8px;
      height: 48px;
      font-size: 16px;
    }

    .divider {
      margin: 24px 0;
    }

    .demo-section {
      text-align: left;
    }

    .demo-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .demo-title mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .demo-hint {
      color: rgba(0, 0, 0, 0.5);
      font-size: 13px;
      margin: 4px 0 16px 0;
    }

    .demo-accounts {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 320px;
      overflow-y: auto;
    }

    .demo-account-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      font-family: inherit;
    }

    .demo-account-btn:hover:not(:disabled) {
      background: #e3f2fd;
      border-color: #90caf9;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
    }

    .demo-account-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .demo-account-btn.loading {
      background: #e3f2fd;
      border-color: #90caf9;
    }

    .demo-account-info {
      flex: 1;
      min-width: 0;
    }

    .demo-account-label {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }

    .demo-account-org {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #888;
      margin-top: 2px;
    }

    .demo-account-org mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .demo-account-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #bbb;
      flex-shrink: 0;
    }

    .footer-hint {
      text-align: center;
      color: rgba(0, 0, 0, 0.4);
      font-size: 12px;
      margin: 0;
      width: 100%;
    }
  `,
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  demoAccounts: DemoAccount[] = [];
  demoLoading: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDemoAccounts();
  }

  loadDemoAccounts(): void {
    this.authService.getDemoAccounts().subscribe({
      next: (res) => {
        this.demoAccounts = res.accounts;
      },
      error: () => {
        console.log('演示账号列表加载失败（后端可能未启动）');
      },
    });
  }

  onLogin(): void {
    if (!this.username || !this.password) {
      return;
    }

    this.loading = true;

    this.authService.login({
      username: this.username,
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('登录成功！', '关闭', {
          duration: 2000,
          panelClass: ['success-snackbar'],
        });
        this.router.navigate(['/organization']);
      },
      error: (error: any) => {
        this.loading = false;
        const errorMessage = error.error?.detail || '登录失败，请检查用户名和密码';
        this.snackBar.open(errorMessage, '关闭', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onDemoLogin(account: DemoAccount): void {
    if (this.demoLoading) return;
    this.demoLoading = account.username;

    this.authService.demoLogin(account.username).subscribe({
      next: () => {
        this.demoLoading = null;
        this.snackBar.open(`以「${account.label}」身份登录成功！`, '关闭', {
          duration: 2500,
          panelClass: ['success-snackbar'],
        });
        this.router.navigate(['/organization']);
      },
      error: (error: any) => {
        this.demoLoading = null;
        const errorMessage = error.error?.detail || '演示登录失败，请确认后端已运行 seed 脚本';
        this.snackBar.open(errorMessage, '关闭', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}