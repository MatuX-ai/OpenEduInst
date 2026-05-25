import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-multi-campus',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="multi-campus-container">
      <div class="content-card">
        <div class="icon-wrapper">
          <mat-icon class="main-icon">business</mat-icon>
        </div>
        
        <h1 class="title">多校区管理</h1>
        <p class="description">
          该功能需要定制开发，支持多校区统一管理和数据同步。
        </p>
        
        <div class="contact-box">
          <div class="contact-header">
            <mat-icon>email</mat-icon>
            <span>如需开通多校区功能，请联系开发人员</span>
          </div>
          <div class="contact-email">
            <mat-icon>mail_outline</mat-icon>
            <span>1055603323&#64;qq.com</span>
          </div>
        </div>

        <div class="features-preview">
          <h3 class="features-title">多校区功能预览</h3>
          <div class="feature-list">
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>多校区统一账号管理</span>
            </div>
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>跨校区课程调度</span>
            </div>
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>校区间学员转校</span>
            </div>
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>多校区财务报表汇总</span>
            </div>
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>校区独立数据统计</span>
            </div>
            <div class="feature-item">
              <mat-icon>check_circle</mat-icon>
              <span>总部-分校区权限分级</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .multi-campus-container {
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 100px);
    }

    .content-card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      max-width: 700px;
      width: 100%;
      text-align: center;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .main-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }

    .description {
      font-size: 16px;
      color: #64748b;
      margin: 0 0 32px 0;
      line-height: 1.6;
    }

    .contact-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .contact-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #1e40af;
      font-weight: 500;
    }

    .contact-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .contact-email {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 18px;
      color: #1e40af;
      font-weight: 600;
      font-family: monospace;
    }

    .contact-email mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .features-preview {
      text-align: left;
    }

    .features-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 16px 0;
      text-align: center;
    }

    .feature-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .feature-item mat-icon {
      color: #10b981;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .feature-item span {
      font-size: 13px;
      color: #334155;
    }

    @media (max-width: 640px) {
      .feature-list {
        grid-template-columns: 1fr;
      }
      
      .content-card {
        padding: 32px 24px;
      }
    }
  `]
})
export class MultiCampusComponent {}
