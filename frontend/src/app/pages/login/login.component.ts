import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

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
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>OpenMT 教育机构管理系统</mat-card-title>
          <mat-card-subtitle>请登录以访问您的机构后台</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
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
              class="full-width"
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
        </mat-card-content>

        <mat-card-actions>
          <p class="demo-info">
            💡 演示账号：<code>admin</code> / <code>admin123</code>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-card-header {
      margin-bottom: 24px;
      text-align: center;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 600;
    }

    mat-card-subtitle {
      margin-top: 8px;
      color: rgba(0, 0, 0, 0.6);
    }

    button {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }

    .demo-info {
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      margin: 0;
    }

    code {
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

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
        // 登录后跳转到机构列表页面
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
