import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface CommonFunctionItem {
  id: string;
  title: string;
  icon: string;
  count?: number | string;
  color: string;
}

@Component({
  selector: 'app-matux-common-functions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="functions-grid">
      <mat-card *ngFor="let item of items" class="function-card" (click)="onSelect(item)">
        <mat-card-content>
          <div class="icon-wrapper" [style.background]="item.color">
            <mat-icon>{{ item.icon }}</mat-icon>
          </div>
          <div class="info">
            <h4>{{ item.title }}</h4>
            <p *ngIf="item.count !== undefined">{{ item.count }}</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    @use '../../../../styles/design-tokens' as *;
    .functions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .function-card {
      cursor: pointer;
      transition: all 0.2s;
      border-radius: $radius-lg;
    }
    .function-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }
    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: white;
    }
    .info h4 { margin: 0; font-size: $font-size-base; color: $color-neutral-900; font-weight: 600; }
    .info p { margin: 4px 0 0; font-size: $font-size-xs; color: $color-neutral-600; }
  `]
})
export class MatuxCommonFunctionsComponent {
  @Input() items: CommonFunctionItem[] = [];
  @Output() select = new EventEmitter<CommonFunctionItem>();

  onSelect(item: CommonFunctionItem) {
    this.select.emit(item);
  }
}
