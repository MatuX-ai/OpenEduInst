import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-matux-resource-center',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="resource-section">
      <h3 class="section-title">教学资源中心</h3>
      <div class="resource-grid">
        <mat-card *ngFor="let item of items" class="resource-card" (click)="onSelect(item)">
          <mat-card-content>
            <div class="icon-box">
              <mat-icon>{{ item.icon }}</mat-icon>
            </div>
            <div class="text-info">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .resource-section { margin-top: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 16px; }
    .resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .resource-card { cursor: pointer; border-radius: 12px; transition: all 0.2s; }
    .resource-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
    mat-card-content { display: flex; align-items: center; padding: 16px !important; }
    .icon-box { 
      width: 40px; height: 40px; border-radius: 8px; background: #f5f7fa; 
      display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #4a90e2;
    }
    .text-info h4 { margin: 0; font-size: 14px; color: #333; font-weight: 600; }
    .text-info p { margin: 4px 0 0; font-size: 12px; color: #888; }
  `]
})
export class MatuxResourceCenterComponent {
  @Input() items: ResourceItem[] = [];
  @Output() select = new EventEmitter<ResourceItem>();

  onSelect(item: ResourceItem) {
    this.select.emit(item);
  }
}
