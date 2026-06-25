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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService, DemoAccount } from '../../core/services/auth.service';
import {
  DemoOrgSelectDialogComponent,
  OrgTypeOption,
} from './demo-org-select-dialog.component';

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
    MatDialogModule,
    DemoOrgSelectDialogComponent,
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
              <mat-icon class="demo-star-icon">stars</mat-icon>
              <span>一键体验演示系统</span>
            </div>
            <p class="demo-hint">无需输入密码，选择机构类型快速进入演示环境</p>
            <button
              class="demo-entry-btn"
              [class.loading]="demoLoading !== null"
              (click)="openDemoDialog()"
              [disabled]="demoLoading !== null"
            >
              <div class="demo-entry-content">
                <mat-icon class="demo-entry-icon">rocket_launch</mat-icon>
                <div class="demo-entry-text">
                  <span class="demo-entry-label">一键演示</span>
                  <span class="demo-entry-desc">选择机构类型快速体验</span>
                </div>
              </div>
              <div class="demo-entry-action">
                <mat-progress-spinner
                  *ngIf="demoLoading !== null"
                  diameter="20"
                  mode="indeterminate"
                ></mat-progress-spinner>
                <mat-icon *ngIf="demoLoading === null" class="demo-entry-arrow">arrow_forward</mat-icon>
              </div>
            </button>
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

    .demo-star-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #ffb300;
    }

    .demo-hint {
      color: rgba(0, 0, 0, 0.5);
      font-size: 13px;
      margin: 4px 0 16px 0;
    }

    .demo-entry-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 16px 20px;
      border: 1.5px solid #e0e0e0;
      border-radius: 12px;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      font-family: inherit;
      position: relative;
      overflow: hidden;
    }

    .demo-entry-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .demo-entry-btn:hover:not(:disabled) {
      border-color: #1565c0;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(21, 101, 192, 0.15);
    }

    .demo-entry-btn:hover:not(:disabled)::before {
      opacity: 1;
    }

    .demo-entry-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(21, 101, 192, 0.1);
    }

    .demo-entry-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .demo-entry-btn.loading {
      border-color: #90caf9;
      background: #e3f2fd;
    }

    .demo-entry-content {
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      z-index: 1;
    }

    .demo-entry-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #1565c0;
    }

    .demo-entry-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .demo-entry-label {
      font-weight: 700;
      font-size: 15px;
      color: #1a1a2e;
    }

    .demo-entry-desc {
      font-size: 12px;
      color: #999;
    }

    .demo-entry-action {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }

    .demo-entry-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1565c0;
      transition: transform 0.25s ease;
    }

    .demo-entry-btn:hover:not(:disabled) .demo-entry-arrow {
      transform: translateX(4px);
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
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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

  /** 打开机构类型选择弹窗 */
  openDemoDialog(): void {
    const dialogRef = this.dialog.open(DemoOrgSelectDialogComponent, {
      width: '540px',
      maxWidth: '92vw',
      panelClass: ['demo-org-select-panel'],
      disableClose: false,
      autoFocus: false,
      backdropClass: 'demo-org-select-backdrop',
    });

    dialogRef.afterClosed().subscribe((option: OrgTypeOption | null) => {
      if (!option) return;

      // 根据选择的机构类型查找对应的演示账号
      this.performDemoLogin(option);
    });
  }

  /** 根据机构类型执行演示登录 */
  private performDemoLogin(option: OrgTypeOption): void {
    if (this.demoLoading) return;

    // 查找与所选机构类型匹配的演示账号
    const matchedAccount = this.demoAccounts.find(
      (acc) => acc.org_type === option.type
    );

    if (!matchedAccount) {
      this.snackBar.open(`未找到「${option.label}」类型的演示账号，请确认 seed 数据已正确初始化`, '关闭', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    // 记录用户选择的机构类型（可用于后续分析）
    console.log(`[Demo] 用户选择了机构类型: ${option.label} (${option.type})，使用账号: ${matchedAccount.username}`);

    this.demoLoading = matchedAccount.username;

    this.authService.demoLogin(matchedAccount.username).subscribe({
      next: () => {
        this.demoLoading = null;
        this.snackBar.open(`以「${option.label}」演示身份登录成功！`, '关闭', {
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
}