import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  extraInfo?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <p *ngIf="data.extraInfo" class="extra-info">
        <mat-icon color="warn">info</mat-icon>
        {{ data.extraInfo }}
      </p>
      <mat-form-field *ngIf="data.showInput" appearance="outline" class="full-width">
        <mat-label>{{ data.inputLabel || '输入' }}</mat-label>
        <input
          matInput
          [(ngModel)]="inputValue"
          [placeholder]="data.inputPlaceholder || ''"
        />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="{ confirmed: false }">
        {{ data.cancelText || '取消' }}
      </button>
      <button
        mat-raised-button
        [color]="data.isDestructive ? 'warn' : 'primary'"
        [mat-dialog-close]="{ confirmed: true, inputValue: inputValue }"
      >
        {{ data.confirmText || '确认' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .extra-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fff8e1;
      border-radius: 4px;
      font-size: 13px;
      color: #e65100;
    }
    .full-width {
      width: 100%;
      margin-top: 8px;
    }
  `],
})
export class ConfirmDialogComponent {
  inputValue = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
