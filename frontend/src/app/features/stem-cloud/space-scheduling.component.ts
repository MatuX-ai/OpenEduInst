import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { StemCloudService, SpaceRoom, Booking, SpaceCategory } from '../../services/stem-cloud.service';

// Re-export for template compatibility
export { SpaceRoom, Booking, SpaceCategory };

@Component({
  selector: 'app-space-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatExpansionModule
  ],
  template: `
    <div class="space-scheduling">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>创客空间预约</h1>
          <p class="subtitle">实验室预约、设备共享、安全准入管理</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="onBookSpace()">
            <mat-icon>add</mat-icon>
            预约空间
          </button>
          <button mat-stroked-button (click)="onViewCalendar()">
            <mat-icon>calendar_today</mat-icon>
            查看日历
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon blue">
                <mat-icon>domain</mat-icon>
              </div>
              <span class="stat-trend stable">→ 稳定</span>
            </div>
            <div class="stat-value">{{ totalSpaces }}</div>
            <div class="stat-label">空间总数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon green">
                <mat-icon>check_circle</mat-icon>
              </div>
              <span class="stat-trend up">↑ 15%</span>
            </div>
            <div class="stat-value">{{ availableSpaces }}</div>
            <div class="stat-label">当前可用</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon orange">
                <mat-icon>calendar_month</mat-icon>
              </div>
              <span class="stat-trend up">↑ 8%</span>
            </div>
            <div class="stat-value">{{ todayBookings }}</div>
            <div class="stat-label">今日预约</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon purple">
                <mat-icon>people</mat-icon>
              </div>
              <span class="stat-trend up">↑ 12%</span>
            </div>
            <div class="stat-value">{{ utilizationRate }}%</div>
            <div class="stat-label">使用率</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Space Categories -->
      <div class="section-title">空间分类</div>
      <div class="categories-grid">
        <mat-card *ngFor="let category of spaceCategories" class="category-card" (click)="onCategorySelect(category)">
          <mat-card-content>
            <div class="category-icon" [style.background]="category.color">
              <mat-icon>{{ category.icon }}</mat-icon>
            </div>
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p class="category-count">{{ category.count }}个空间</p>
              <div class="availability-info">
                <span class="available-count">{{ category.available }}个可用</span>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="(category.available / category.count) * 100"
                  [color]="getAvailabilityColor(category.available, category.count)">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Space Rooms Grid -->
      <div class="section-title">空间列表</div>
      <div class="spaces-grid">
        <mat-card *ngFor="let room of spaceRooms" class="space-card" [class.available]="room.status === 'available'">
          <mat-card-content>
            <div class="space-header">
              <div class="space-type-icon" [style.background]="getSpaceTypeColor(room.type)">
                <mat-icon>{{ getSpaceTypeIcon(room.type) }}</mat-icon>
              </div>
              <mat-chip [class]="'status-chip ' + room.status">
                {{ getStatusText(room.status) }}
              </mat-chip>
            </div>
            
            <h3>{{ room.name }}</h3>
            <p class="space-capacity">
              <mat-icon>people</mat-icon>
              容量: {{ room.capacity }}人
            </p>

            <div class="space-equipment">
              <mat-chip *ngFor="let equip of (room.equipment || []).slice(0, 3)" class="equipment-chip">
                {{ equip }}
              </mat-chip>
              <span *ngIf="(room.equipment || []).length > 3" class="more-equipment">+{{ (room.equipment || []).length - 3 }}更多</span>
            </div>

            <div class="space-booking-info" *ngIf="room.currentActivity || room.nextBooking">
              <div *ngIf="room.currentActivity" class="current-activity">
                <mat-icon>play_circle</mat-icon>
                <span>进行中: {{ room.currentActivity }}</span>
              </div>
              <div *ngIf="room.nextBooking" class="next-booking">
                <mat-icon>schedule</mat-icon>
                <span>下一场: {{ room.nextBooking }}</span>
              </div>
            </div>

            <div class="space-actions">
              <button mat-stroked-button (click)="onViewRoomDetails(room)" [disabled]="room.status !== 'available'">
                查看详情
              </button>
              <button mat-raised-button color="primary" (click)="onBookRoom(room)" [disabled]="room.status !== 'available'">
                立即预约
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Today's Bookings -->
      <mat-card class="bookings-card">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex">
          <mat-tab label="今日预约">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="table-controls">
                  <div class="search-box">
                    <mat-icon>search</mat-icon>
                    <input type="text" placeholder="搜索预约人、用途..." [(ngModel)]="searchTerm" />
                  </div>
                  <div class="filter-controls">
                    <select [(ngModel)]="statusFilter">
                      <option value="">全部状态</option>
                      <option value="confirmed">已确认</option>
                      <option value="pending">待确认</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </div>

                <table mat-table [dataSource]="filteredBookings" class="booking-table">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>预约编号</th>
                    <td mat-cell *matCellDef="let booking">{{ booking.id }}</td>
                  </ng-container>

                  <!-- Room Column -->
                  <ng-container matColumnDef="roomName">
                    <th mat-header-cell *matHeaderCellDef>空间</th>
                    <td mat-cell *matCellDef="let booking">{{ booking.roomName }}</td>
                  </ng-container>

                  <!-- User Column -->
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>预约人</th>
                    <td mat-cell *matCellDef="let booking">{{ booking.user }}</td>
                  </ng-container>

                  <!-- Purpose Column -->
                  <ng-container matColumnDef="purpose">
                    <th mat-header-cell *matHeaderCellDef>用途</th>
                    <td mat-cell *matCellDef="let booking">{{ booking.purpose }}</td>
                  </ng-container>

                  <!-- Time Column -->
                  <ng-container matColumnDef="time">
                    <th mat-header-cell *matHeaderCellDef>时间</th>
                    <td mat-cell *matCellDef="let booking">
                      {{ booking.startTime }} - {{ booking.endTime }}
                    </td>
                  </ng-container>

                  <!-- Participants Column -->
                  <ng-container matColumnDef="participants">
                    <th mat-header-cell *matHeaderCellDef>人数</th>
                    <td mat-cell *matCellDef="let booking">{{ booking.participants }}人</td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let booking">
                      <mat-chip [class]="'status-chip ' + booking.status">
                        {{ getBookingStatusText(booking.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let booking">
                      <div class="action-buttons">
                        <button mat-icon-button (click)="onViewBooking(booking)" title="查看详情">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onEditBooking(booking)" title="编辑">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onCancelBooking(booking)" title="取消" *ngIf="booking.status !== 'cancelled'">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="我的预约">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示我的预约记录...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="历史预约">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示历史预约记录...</p>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Quick Booking Form -->
      <mat-card class="quick-booking-card">
        <mat-card-header>
          <mat-card-title>快速预约</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="booking-form">
            <div class="form-row">
              <div class="form-group">
                <label>选择空间</label>
                <select [(ngModel)]="quickBooking.roomId">
                  <option value="">请选择空间</option>
                  <option *ngFor="let room of availableRooms" [value]="room.id">
                    {{ room.name }} (容量: {{ room.capacity }}人)
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>预约日期</label>
                <input type="date" [(ngModel)]="quickBooking.date" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>开始时间</label>
                <input type="time" [(ngModel)]="quickBooking.startTime" />
              </div>
              <div class="form-group">
                <label>结束时间</label>
                <input type="time" [(ngModel)]="quickBooking.endTime" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>预约用途</label>
                <input type="text" placeholder="请输入预约用途" [(ngModel)]="quickBooking.purpose" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>参与人数</label>
                <input type="number" min="1" [(ngModel)]="quickBooking.participants" />
              </div>
              <div class="form-group">
                <label>联系电话</label>
                <input type="tel" placeholder="请输入联系电话" [(ngModel)]="quickBooking.phone" />
              </div>
            </div>
            <div class="form-actions">
              <button mat-stroked-button (click)="onClearForm()">清空表单</button>
              <button mat-raised-button color="primary" (click)="onSubmitQuickBooking()">提交预约</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
@use 'shared/mixins' as mx;
    .space-scheduling {
      padding: 24px;
      background: $color-neutral-100;
      min-height: 100%;
      color: $color-neutral-700;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: $color-neutral-900;
      line-height: 1.3;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: $color-neutral-500;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button mat-icon {
      margin-right: 8px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    mat-card-content {
      padding: 20px !important;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon.green { background: $color-stem-green-bg; color: $color-stem-green; }
    .stat-icon.orange { background: $color-warning-light; color: $color-warning; }
    .stat-icon.purple { background: $color-brand-primary-subtle; color: $color-brand-primary; }

    .stat-trend {
      font-size: 12px;
      font-weight: 500;
    }

    .stat-trend.up { color: $color-stem-green; }
    .stat-trend.down { color: $color-error; }
    .stat-trend.stable { color: $color-brand-primary; }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: $color-neutral-900;
      margin: 8px 0;
    }

    .stat-label {
      color: $color-neutral-500;
      font-size: 12px;
      font-weight: 500;
    }

    /* Section Title */
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-700;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .category-card {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .category-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .category-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }

    .category-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #475569;
    }

    .category-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #475569;
    }

    .category-info {
      flex: 1;
    }

    .category-info h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .category-count {
      margin: 4px 0 8px 0;
      font-size: 13px;
      color: #94a3b8;
    }

    .availability-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .available-count {
      font-size: 12px;
      color: #4caf50;
      font-weight: 500;
    }

    /* Spaces Grid */
    .spaces-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .space-card {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
    }

    .space-card.available {
      border-color: $color-stem-green;
      border-width: 2px;
    }

    .space-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .space-card mat-card-content {
      padding: 20px !important;
    }

    .space-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .space-type-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
    }

    .space-type-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #475569;
    }

    .status-chip {
      font-size: 12px;
    }

    .status-chip.available {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-chip.occupied {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-chip.maintenance {
      background: #fce4ec;
      color: #c2185b;
    }

    .status-chip.reserved {
      background: #e3f2fd;
      color: #1976d2;
    }

    .space-card h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .space-capacity {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #94a3b8;
    }

    .space-capacity mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .space-equipment {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .equipment-chip {
      font-size: 11px;
      background: $color-neutral-100;
      color: $color-neutral-500;
    }

    .more-equipment {
      font-size: 11px;
      color: $color-neutral-500;
    }

    .space-booking-info {
      margin-bottom: 16px;
    }

    .current-activity, .next-booking {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $color-neutral-500;
      margin-bottom: 4px;
    }

    .current-activity mat-icon, .next-booking mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .space-actions {
      display: flex;
      gap: 8px;
    }

    .space-actions button {
      flex: 1;
    }

    /* Bookings Card */
    .bookings-card {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 20px;
    }

    .table-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .search-box {
      position: relative;
      width: 300px;
    }

    .search-box mat-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 10px 10px 10px 40px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: $card-bg;
    }

    .filter-controls {
      display: flex;
      gap: 12px;
    }

    .filter-controls select {
      padding: 8px 12px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: $card-bg;
    }

    /* Table Styles */
    .booking-table {
      width: 100%;
    }

    .status-chip.confirmed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-chip.pending {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-chip.cancelled {
      background: #ffebee;
      color: #d32f2f;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    /* Quick Booking Card */
    .quick-booking-card {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .booking-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: $color-neutral-900;
    }

    .form-group input,
    .form-group select {
      padding: 10px 12px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: $card-bg;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    /* Responsive Design - 使用统一断点 mixin */
    @include mx.responsive(md) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .spaces-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @include mx.responsive(sm) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .categories-grid {
        grid-template-columns: 1fr;
      }
      .spaces-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .table-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .search-box {
        width: 100%;
      }
      .filter-controls {
        justify-content: stretch;
      }
      .filter-controls select {
        flex: 1;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SpaceSchedulingComponent implements OnInit {
  // Stats data with animation support
  totalSpaces = 0;
  availableSpaces = 0;
  todayBookings = 0;
  utilizationRate = 0;

  // Space categories (Mock for now)
  spaceCategories: SpaceCategory[] = [
    { id: 'lab', name: '实验室', icon: 'biotech', count: 5, available: 3, color: '#eff6ff' },
    { id: 'makerspace', name: '创客空间', icon: 'hardware', count: 4, available: 3, color: '#ecfdf5' },
    { id: 'classroom', name: '教室', icon: 'smart_display', count: 2, available: 1, color: '#fffbeb' },
    { id: 'workshop', name: '工作坊', icon: 'engineering', count: 1, available: 1, color: '#f5f3ff' }
  ];

  // Space rooms
  spaceRooms: SpaceRoom[] = [];
  
  // Available rooms for booking
  get availableRooms(): SpaceRoom[] {
    return this.spaceRooms.filter(r => r.status === 'available');
  }

  // Today's bookings
  bookings: Booking[] = [];

  // Quick booking form
  quickBooking = {
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    participants: 1,
    phone: ''
  };

  // Table configuration
  displayedColumns: string[] = ['id', 'roomName', 'user', 'purpose', 'time', 'participants', 'status', 'actions'];
  selectedTabIndex = 0;
  
  // Filter variables
  searchTerm = '';
  statusFilter = '';

  orgId!: number;

  constructor(
    private stemService: StemCloudService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 1;
    this.loadSpaceData();
  }

  loadSpaceData(): void {
    this.stemService.getSpaces().subscribe({
      next: (data) => {
        this.spaceRooms = data;
        this.updateStats();
      },
      error: (err) => {
        console.error('Failed to load spaces', err);
        this.loadMockSpaces();
      }
    });
  }

  updateStats(): void {
    this.totalSpaces = this.spaceRooms.length;
    this.availableSpaces = this.spaceRooms.filter(r => r.status === 'available').length;
    this.utilizationRate = this.totalSpaces > 0 ? Math.round(((this.totalSpaces - this.availableSpaces) / this.totalSpaces) * 100) : 0;
  }

  loadMockSpaces(): void {
    this.spaceRooms = [
      { id: 'ROOM-001', name: 'Arduino实验室A', type: 'lab', capacity: 30, status: 'available', equipment: ['Arduino套件', '示波器', '焊接工具'], currentActivity: '智能小车项目' },
      { id: 'ROOM-002', name: '机器人工作室', type: 'makerspace', capacity: 20, status: 'occupied', equipment: ['3D打印机', '激光切割机', '机器人底盘'], currentActivity: 'VEX机器人训练', nextBooking: '14:00-16:00' }
    ];
    this.bookings = [
      { id: 'BK-001', roomId: 'ROOM-001', roomName: 'Arduino实验室A', user: '张老师', purpose: '智能温室控制系统项目', startTime: '09:00', endTime: '11:00', date: '2024-01-20', status: 'confirmed', participants: 18 }
    ];
    this.todayBookings = this.bookings.length;
    this.updateStats();
  }

  // Helper methods
  getFilteredBookings(): Booking[] {
    return this.bookings.filter(booking => {
      const matchesSearch = !this.searchTerm || 
        booking.user.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.purpose.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || booking.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  get filteredBookings() {
    return this.getFilteredBookings();
  }

  getSpaceTypeIcon(type: string): string {
    switch(type) {
      case 'lab': return 'science';
      case 'makerspace': return 'precision_manufacturing';
      case 'classroom': return 'school';
      case 'workshop': return 'handyman';
      default: return 'meeting_room';
    }
  }

  getSpaceTypeColor(type: string): string {
    switch(type) {
      case 'lab': return '#eff6ff';
      case 'makerspace': return '#ecfdf5';
      case 'classroom': return '#fffbeb';
      case 'workshop': return '#f5f3ff';
      default: return '#f1f5f9';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'available': return '可用';
      case 'occupied': return '使用中';
      case 'maintenance': return '维护中';
      case 'reserved': return '已预约';
      default: return status;
    }
  }

  getBookingStatusText(status: string): string {
    switch(status) {
      case 'confirmed': return '已确认';
      case 'pending': return '待确认';
      case 'cancelled': return '已取消';
      default: return status;
    }
  }

  getAvailabilityColor(available: number, total: number): string {
    const percentage = (available / total) * 100;
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  // Event handlers
  onBookSpace(): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', 'book']);
  }

  onViewCalendar(): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', 'calendar']);
  }

  onCategorySelect(category: SpaceCategory): void {
    console.log('Category selected:', category);
    // Filter spaces by category
  }

  onViewRoomDetails(room: SpaceRoom): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', room.id]);
  }

  onBookRoom(room: SpaceRoom): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', 'book'], {
      queryParams: { roomId: room.id }
    });
  }

  onViewBooking(booking: Booking): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', 'bookings', booking.id]);
  }

  onEditBooking(booking: Booking): void {
    this.router.navigate(['/organization', this.orgId, 'spaces', 'bookings', booking.id, 'edit']);
  }

  onCancelBooking(booking: Booking): void {
    if (confirm('确定要取消这个预约吗？')) {
      console.log('Cancel booking:', booking);
      // TODO: Call API to cancel booking
    }
  }

  onClearForm(): void {
    this.quickBooking = {
      roomId: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      participants: 1,
      phone: ''
    };
  }

  onSubmitQuickBooking(): void {
    // Validate form
    if (!this.quickBooking.roomId || !this.quickBooking.date || !this.quickBooking.startTime) {
      alert('请填写完整的预约信息');
      return;
    }
    
    // Navigate to booking confirmation with form data
    this.router.navigate(['/organization', this.orgId, 'spaces', 'book'], {
      queryParams: {
        roomId: this.quickBooking.roomId,
        date: this.quickBooking.date,
        startTime: this.quickBooking.startTime,
        endTime: this.quickBooking.endTime,
        purpose: this.quickBooking.purpose,
        participants: this.quickBooking.participants,
        phone: this.quickBooking.phone
      }
    });
  }
}