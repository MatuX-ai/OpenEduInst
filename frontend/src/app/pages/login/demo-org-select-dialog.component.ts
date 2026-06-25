import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface OrgTypeOption {
  type: string;
  label: string;
  description: string;
  icon: string;
  gradient: string;
}

export const ORG_TYPE_OPTIONS: OrgTypeOption[] = [
  {
    type: 'training_institution',
    label: '培训机构',
    description: 'STEM 机器人编程、创客教育等培训机构的教务管理与教学运营',
    icon: 'school',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'k12_school',
    label: 'K12 学校',
    description: '中小学 STEM 课程体系管理、实验室与社团活动统筹',
    icon: 'auto_stories',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    type: 'vocational_school',
    label: '职业学校',
    description: '职业教育实训基地管理、校企合作与技能认证',
    icon: 'precision_manufacturing',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    type: 'education_bureau',
    label: '教育局',
    description: '区域教育统筹监管、学校数据看板与资源调配',
    icon: 'account_balance',
    gradient: 'from-orange-500 to-amber-500',
  },
];

@Component({
  selector: 'app-demo-org-select-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon-wrapper">
          <mat-icon class="header-icon">stars</mat-icon>
        </div>
        <h2 mat-dialog-title class="dialog-title">选择演示机构类型</h2>
        <p class="dialog-subtitle">请选择您想体验的机构类型，系统将自动为您登录演示环境</p>
      </div>

      <mat-dialog-content class="dialog-content">
        <div class="org-options">
          <button
            *ngFor="let option of orgOptions; let i = index"
            class="org-option-btn"
            [style.animation-delay]="i * 0.05 + 's'"
            matRipple
            [matRippleColor]="'rgba(255,255,255,0.15)'"
            (click)="selectOrg(option)"
          >
            <div class="option-icon-wrapper" [class]="option.gradient">
              <mat-icon>{{ option.icon }}</mat-icon>
            </div>
            <div class="option-text">
              <span class="option-label">{{ option.label }}</span>
              <span class="option-desc">{{ option.description }}</span>
            </div>
            <mat-icon class="option-arrow">chevron_right</mat-icon>
          </button>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="center" class="dialog-actions">
        <button mat-button class="cancel-btn" [mat-dialog-close]="null">
          <mat-icon>close</mat-icon>
          取消
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    // language=CSS
    `
    .dialog-container {
      max-width: 520px;
      border-radius: 20px;
      overflow: hidden;
      background: #ffffff;
    }

    .dialog-header {
      text-align: center;
      padding: 32px 32px 8px;
      position: relative;
    }

    .header-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ffb300;
      filter: drop-shadow(0 2px 8px rgba(255, 179, 0, 0.3));
      animation: starPulse 2s ease-in-out infinite;
    }

    @keyframes starPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .dialog-title {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px 0;
      padding: 0;
    }

    .dialog-subtitle {
      font-size: 13px;
      color: #888;
      margin: 0;
      line-height: 1.5;
    }

    .dialog-content {
      padding: 16px 24px 8px !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .org-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .org-option-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 16px 20px;
      border: 1.5px solid #e8e8f0;
      border-radius: 14px;
      background: #fafafe;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      font-family: inherit;
      position: relative;
      overflow: hidden;
      animation: fadeInUp 0.35s ease-out both;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .org-option-btn:hover {
      border-color: #1565c0;
      background: #f0f5ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(21, 101, 192, 0.12);
    }

    .org-option-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(21, 101, 192, 0.08);
    }

    .option-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background-image: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
    }

    .option-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #fff;
    }

    .from-blue-500 { --tw-gradient-from: #3b82f6; --tw-gradient-to: #06b6d4; }
    .from-emerald-500 { --tw-gradient-from: #10b981; --tw-gradient-to: #14b8a6; }
    .from-purple-500 { --tw-gradient-from: #8b5cf6; --tw-gradient-to: #7c3aed; }
    .from-orange-500 { --tw-gradient-from: #f97316; --tw-gradient-to: #f59e0b; }

    .option-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .option-label {
      font-weight: 700;
      font-size: 15px;
      color: #1a1a2e;
    }

    .option-desc {
      font-size: 12px;
      color: #999;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .option-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ccc;
      flex-shrink: 0;
      transition: transform 0.25s ease;
    }

    .org-option-btn:hover .option-arrow {
      color: #1565c0;
      transform: translateX(4px);
    }

    .dialog-actions {
      padding: 8px 24px 24px !important;
      justify-content: center !important;
    }

    .cancel-btn {
      color: #999;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 24px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      color: #666;
      background: #f5f5f5;
    }

    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class DemoOrgSelectDialogComponent {
  orgOptions = ORG_TYPE_OPTIONS;

  constructor(
    public dialogRef: MatDialogRef<DemoOrgSelectDialogComponent>
  ) {}

  selectOrg(option: OrgTypeOption): void {
    this.dialogRef.close(option);
  }
}