import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

export interface MockPaymentDialogData {
  orderNo: string;
  packageName: string;
  tokenAmount: number;
  price: number;
  currency: string;
  transactionId: string;
  paymentMethodLabel: string;
}

export interface MockPaymentDialogResult {
  success: boolean;
  forceFail: boolean;
}

@Component({
  selector: 'app-mock-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="mock-payment-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon">payment</mat-icon>
        模拟支付确认
      </h2>

      <mat-dialog-content>
        <!-- 订单信息 -->
        <div class="info-card">
          <div class="info-row">
            <span class="label">订单号</span>
            <span class="value mono">{{ data.orderNo }}</span>
          </div>
          <mat-divider></mat-divider>
          <div class="info-row">
            <span class="label">套餐</span>
            <span class="value">{{ data.packageName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Token 数量</span>
            <span class="value highlight">{{ data.tokenAmount.toLocaleString() }}</span>
          </div>
          <div class="info-row total">
            <span class="label">应付金额</span>
            <span class="value price">¥{{ data.price.toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">支付方式</span>
            <span class="value">{{ data.paymentMethodLabel }}</span>
          </div>
          <div class="info-row">
            <span class="label">流水号</span>
            <span class="value mono small">{{ data.transactionId }}</span>
          </div>
        </div>

        <!-- 演示提示 -->
        <div class="notice">
          <mat-icon>info</mat-icon>
          <span>沙箱支付环境：可选择「立即支付」或「模拟失败」以演示完整链路。</span>
        </div>

        <mat-progress-bar
          *ngIf="processing"
          mode="indeterminate"
          aria-label="支付处理中"
        ></mat-progress-bar>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button
          mat-button
          color="warn"
          [disabled]="processing"
          (click)="onForceFail()"
          aria-label="模拟支付失败"
        >
          <mat-icon>close</mat-icon>
          模拟失败
        </button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="processing"
          (click)="onConfirm()"
          aria-label="确认支付"
        >
          <mat-icon>check</mat-icon>
          立即支付
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .mock-payment-dialog {
        min-width: 420px;
        max-width: 520px;
      }
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #1976d2;
      }
      .title-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .info-card {
        background: #f5f7fa;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 8px 0 16px;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;
      }
      .info-row .label {
        color: #607d8b;
      }
      .info-row .value {
        color: #263238;
        font-weight: 500;
      }
      .info-row .value.mono {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
      }
      .info-row .value.mono.small {
        font-size: 11px;
        color: #607d8b;
      }
      .info-row .value.highlight {
        color: #1976d2;
        font-size: 16px;
        font-weight: 600;
      }
      .info-row.total {
        border-top: 1px dashed #cfd8dc;
        margin-top: 4px;
        padding-top: 12px;
      }
      .info-row .value.price {
        color: #d32f2f;
        font-size: 20px;
        font-weight: 700;
      }
      .notice {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #fff8e1;
        border-left: 3px solid #ffb300;
        border-radius: 4px;
        font-size: 13px;
        color: #5d4037;
        margin: 8px 0 12px;
      }
      .notice mat-icon {
        color: #ff8f00;
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      mat-progress-bar {
        margin-top: 8px;
      }
      mat-dialog-actions {
        padding: 8px 24px 16px;
        gap: 8px;
      }
      mat-dialog-actions mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class MockPaymentDialogComponent {
  processing = false;

  constructor(
    public dialogRef: MatDialogRef<MockPaymentDialogComponent, MockPaymentDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: MockPaymentDialogData
  ) {}

  onConfirm(): void {
    this.processing = true;
    this.dialogRef.close({ success: true, forceFail: false });
  }

  onForceFail(): void {
    this.processing = true;
    this.dialogRef.close({ success: false, forceFail: true });
  }
}
