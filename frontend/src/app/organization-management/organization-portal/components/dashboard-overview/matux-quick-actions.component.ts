import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-matux-quick-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="actions-container">
      <h3 class="section-title">快捷操作</h3>
      <div class="actions-grid">
        <button *ngFor="let action of actions" mat-raised-button color="primary" (click)="onAction(action)">
          <mat-icon>{{ action.icon }}</mat-icon>
          {{ action.label }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actions-container { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 16px; }
    .actions-grid { display: flex; gap: 12px; flex-wrap: wrap; }
    button { text-transform: none; border-radius: 8px; }
    mat-icon { margin-right: 8px; }
  `]
})
export class MatuxQuickActionsComponent {
  @Input() actions: QuickActionItem[] = [];
  @Output() actionClick = new EventEmitter<QuickActionItem>();

  onAction(action: QuickActionItem) {
    this.actionClick.emit(action);
  }
}
