import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StemCloudService } from '../../services/stem-cloud.service';

export interface Consumable {
  id: number;
  org_id: number;
  name: string;
  category: string;
  specification?: string;
  description?: string;
  unit: string;
  unit_price: number;
  token_price: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  supplier?: string;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-stem-consumable-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="consumable-management">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>STEM 耗材管理</h1>
          <p class="subtitle">管理创客空间的教学耗材、库存和采购</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button (click)="onPurchaseRequests()">
            <mat-icon>receipt</mat-icon>
            采购申请
          </button>
          <button mat-raised-button color="primary" (click)="onCreateConsumable()">
            <mat-icon>add</mat-icon>
            添加耗材
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{stats.total_consumables}}</div>
            <div class="stat-label">耗材总数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-card-content>
            <div class="stat-value">{{stats.low_stock_count}}</div>
            <div class="stat-label">库存不足</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card info">
          <mat-card-content>
            <div class="stat-value">{{stats.total_categories}}</div>
            <div class="stat-label">分类数</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card accent">
          <mat-card-content>
            <div class="stat-value">{{stats.usage_this_month}}</div>
            <div class="stat-label">本月领用</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Low Stock Alert -->
      <mat-card class="alert-card" *ngIf="lowStockItems.length > 0">
        <mat-card-content>
          <div class="alert-header">
            <mat-icon color="warn">warning_amber</mat-icon>
            <span>库存不足预警（{{lowStockItems.length}} 项）</span>
          </div>
          <div class="alert-items">
            <span *ngFor="let item of lowStockItems" class="alert-item">
              {{item.name}}（库存: {{item.current_stock}}/{{item.min_stock}}）
            </span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filters -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>搜索耗材</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="名称/规格">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>分类</mat-label>
          <mat-select [(ngModel)]="filterCategory" (selectionChange)="loadConsumables()">
            <mat-option value="">全部</mat-option>
            <mat-option *ngFor="let cat of categories" [value]="cat.value">{{cat.label}}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>库存状态</mat-label>
          <mat-select [(ngModel)]="filterLowStock" (selectionChange)="loadConsumables()">
            <mat-option [value]="false">全部</mat-option>
            <mat-option [value]="true">仅低库存</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Consumable Table -->
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="consumables" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>耗材名称</th>
              <td mat-cell *matCellDef="let item">
                <div class="item-name-cell">
                  <div>
                    <div class="item-name">{{item.name}}</div>
                    <div class="item-meta" *ngIf="item.specification">{{item.specification}}</div>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>分类</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip>{{getCategoryLabel(item.category)}}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>库存</th>
              <td mat-cell *matCellDef="let item">
                <div class="stock-cell" [class.low-stock]="item.is_low_stock">
                  <span class="stock-value">{{item.current_stock}}</span>
                  <span class="stock-unit">{{item.unit}}</span>
                  <mat-icon *ngIf="item.is_low_stock" class="warn-icon" color="warn">warning</mat-icon>
                </div>
                <div class="stock-bar">
                  <div class="stock-fill" [style.width.%]="getStockPercentage(item)"></div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>单价</th>
              <td mat-cell *matCellDef="let item">
                <div class="price-cell">
                  <span class="token-price">{{item.token_price}} Token</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="supplier">
              <th mat-header-cell *matHeaderCellDef>供应商</th>
              <td mat-cell *matCellDef="let item">{{item.supplier || '-'}}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button (click)="onUseConsumable(item)" matTooltip="领用">
                  <mat-icon>exit_to_app</mat-icon>
                </button>
                <button mat-icon-button (click)="onEditConsumable(item)" matTooltip="编辑">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <div *ngIf="consumables.length === 0" class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <p>暂无耗材数据，点击"添加耗材"开始</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .consumable-management { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0 0; }
    .header-actions { display: flex; gap: 8px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card .mat-mdc-card-content { text-align: center; padding: 20px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #1976d2; }
    .stat-card.warn .stat-value { color: #f44336; }
    .stat-card.info .stat-value { color: #4caf50; }
    .stat-card.accent .stat-value { color: #ff9800; }
    .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
    
    .alert-card { margin-bottom: 24px; background: #fff3e0 !important; }
    .alert-header { display: flex; align-items: center; gap: 8px; font-weight: 500; margin-bottom: 8px; }
    .alert-items { display: flex; flex-wrap: wrap; gap: 8px; }
    .alert-item { background: #ffe0b2; padding: 4px 12px; border-radius: 12px; font-size: 13px; color: #e65100; }
    
    .filters-row { display: flex; gap: 16px; margin-bottom: 16px; align-items: center; }
    .search-field { flex: 1; }
    
    .full-width { width: 100%; }
    .item-name-cell { display: flex; align-items: center; gap: 12px; }
    .item-name { font-weight: 500; }
    .item-meta { font-size: 12px; color: #888; }
    
    .stock-cell { display: flex; align-items: center; gap: 4px; }
    .stock-cell.low-stock { color: #f44336; font-weight: 500; }
    .stock-value { font-weight: 600; }
    .stock-unit { font-size: 12px; color: #888; }
    .warn-icon { font-size: 16px; width: 16px; height: 16px; }
    .stock-bar { width: 100px; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 4px; }
    .stock-fill { height: 100%; background: #4caf50; border-radius: 2px; transition: width 0.3s; }
    .stock-cell.low-stock + .stock-bar .stock-fill { background: #f44336; }
    
    .price-cell { text-align: center; }
    .token-price { font-weight: 500; color: #ff9800; }
    
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class StemConsumableListComponent implements OnInit {
  consumables: Consumable[] = [];
  lowStockItems: Consumable[] = [];
  displayedColumns = ['name', 'category', 'stock', 'price', 'supplier', 'actions'];
  searchQuery = '';
  filterCategory = '';
  filterLowStock = false;

  stats = { total_consumables: 0, low_stock_count: 0, total_categories: 0, usage_this_month: 0 };

  categories = [
    { value: 'electronics', label: '电子元件' },
    { value: 'structure', label: '结构件' },
    { value: 'fastener', label: '紧固件' },
    { value: 'tool', label: '工具' },
    { value: 'wire_cable', label: '线缆' },
    { value: 'sensor', label: '传感器' },
    { value: 'consumable', label: '日常耗材' },
    { value: 'other', label: '其他' },
  ];

  constructor(
    private stemService: StemCloudService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadConsumables();
    this.loadLowStockItems();
  }

  loadStats(): void {
    this.stemService.getConsumableStats().subscribe({
      next: (data) => this.stats = data,
      error: () => console.log('Stats not available yet'),
    });
  }

  loadConsumables(): void {
    this.stemService.getConsumables({
      category: this.filterCategory || undefined,
      low_stock_only: this.filterLowStock || undefined,
      search: this.searchQuery || undefined,
    }).subscribe({
      next: (data) => this.consumables = data,
      error: () => console.log('Consumable list not available yet'),
    });
  }

  loadLowStockItems(): void {
    this.stemService.getLowStockItems().subscribe({
      next: (data) => this.lowStockItems = data,
      error: () => console.log('Low stock items not available yet'),
    });
  }

  onSearch(): void {
    setTimeout(() => this.loadConsumables(), 300);
  }

  getCategoryLabel(cat: string): string {
    const found = this.categories.find(c => c.value === cat);
    return found ? found.label : cat;
  }

  getStockPercentage(item: Consumable): number {
    if (item.max_stock <= 0) return 0;
    return Math.min(100, Math.round((item.current_stock / item.max_stock) * 100));
  }

  onCreateConsumable(): void {
    this.snackBar.open('添加耗材功能开发中', '关闭', { duration: 3000 });
  }

  onEditConsumable(item: Consumable): void {
    this.snackBar.open(`编辑: ${item.name}`, '关闭', { duration: 3000 });
  }

  onUseConsumable(item: Consumable): void {
    this.snackBar.open(`领用耗材: ${item.name} 功能开发中`, '关闭', { duration: 3000 });
  }

  onPurchaseRequests(): void {
    this.snackBar.open('采购申请功能开发中', '关闭', { duration: 3000 });
  }
}