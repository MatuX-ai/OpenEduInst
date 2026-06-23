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
import { StemCloudService, HardwareDevice, DeviceCategory } from '../../services/stem-cloud.service';

// Re-export for template compatibility
export { HardwareDevice, DeviceCategory };

@Component({
  selector: 'app-hardware-management',
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
    MatBadgeModule
  ],
  template: `
    <div class="hardware-management">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>硬件设备管理</h1>
          <p class="subtitle">Arduino/Raspberry Pi 租赁、维护、损耗追踪</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="onAddDevice()">
            <mat-icon>add</mat-icon>
            添加设备
          </button>
          <button mat-stroked-button (click)="onExportData()">
            <mat-icon>download</mat-icon>
            导出数据
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon blue">
                <mat-icon>devices</mat-icon>
              </div>
              <span class="stat-trend up">↑ 12%</span>
            </div>
            <div class="stat-value">{{ totalDevices }}</div>
            <div class="stat-label">设备总数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon green">
                <mat-icon>check_circle</mat-icon>
              </div>
              <span class="stat-trend stable">→ 稳定</span>
            </div>
            <div class="stat-value">{{ availableDevices }}</div>
            <div class="stat-label">可用设备</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon orange">
                <mat-icon>build</mat-icon>
              </div>
              <span class="stat-trend down">↓ 3%</span>
            </div>
            <div class="stat-value">{{ maintenanceDevices }}</div>
            <div class="stat-label">维护中</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon red">
                <mat-icon>error</mat-icon>
              </div>
              <span class="stat-trend down">↓ 5%</span>
            </div>
            <div class="stat-value">{{ damagedDevices }}</div>
            <div class="stat-label">损坏设备</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Device Categories -->
      <div class="section-title">设备分类</div>
      <div class="categories-grid">
        <mat-card *ngFor="let category of deviceCategories" class="category-card" (click)="onCategorySelect(category)">
          <mat-card-content>
            <div class="category-icon" [style.background]="category.color">
              <mat-icon>{{ category.icon }}</mat-icon>
            </div>
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p class="category-count">{{ category.count }}台设备</p>
              <div class="availability-bar">
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="(category.available / category.count) * 100"
                  [color]="getAvailabilityColor(category.available, category.count)">
                </mat-progress-bar>
                <span class="availability-text">
                  {{ category.available }}/{{ category.count }} 可用
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Device List -->
      <mat-card class="device-list-card">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex">
          <mat-tab label="全部设备">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="table-controls">
                  <div class="search-box">
                    <mat-icon>search</mat-icon>
                    <input type="text" placeholder="搜索设备名称、编号..." [(ngModel)]="searchTerm" />
                  </div>
                  <div class="filter-controls">
                    <select [(ngModel)]="statusFilter">
                      <option value="">全部状态</option>
                      <option value="available">可用</option>
                      <option value="in_use">使用中</option>
                      <option value="maintenance">维护中</option>
                      <option value="damaged">损坏</option>
                    </select>
                    <select [(ngModel)]="typeFilter">
                      <option value="">全部类型</option>
                      <option *ngFor="let type of deviceTypes" [value]="type">{{ type }}</option>
                    </select>
                  </div>
                </div>

                <table mat-table [dataSource]="filteredDevices" class="device-table">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>设备编号</th>
                    <td mat-cell *matCellDef="let device">{{ device.id }}</td>
                  </ng-container>

                  <!-- Name Column -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>设备名称</th>
                    <td mat-cell *matCellDef="let device">
                      <div class="device-name-cell">
                        <mat-icon [class]="getDeviceTypeIcon(device.type)">devices</mat-icon>
                        <span>{{ device.name }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Type Column -->
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>类型</th>
                    <td mat-cell *matCellDef="let device">
                      <mat-chip class="type-chip">{{ device.type }}</mat-chip>
                    </td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let device">
                      <mat-chip [class]="'status-chip ' + device.status">
                        {{ getStatusText(device.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Location Column -->
                  <ng-container matColumnDef="location">
                    <th mat-header-cell *matHeaderCellDef>位置</th>
                    <td mat-cell *matCellDef="let device">{{ device.location }}</td>
                  </ng-container>

                  <!-- Condition Column -->
                  <ng-container matColumnDef="condition">
                    <th mat-header-cell *matHeaderCellDef>完好度</th>
                    <td mat-cell *matCellDef="let device">
                      <div class="condition-cell">
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="device.condition"
                          [color]="getConditionColor(device.condition)">
                        </mat-progress-bar>
                        <span>{{ device.condition }}%</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Last Used Column -->
                  <ng-container matColumnDef="lastUsed">
                    <th mat-header-cell *matHeaderCellDef>最后使用</th>
                    <td mat-cell *matCellDef="let device">{{ device.lastUsed }}</td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let device">
                      <div class="action-buttons">
                        <button mat-icon-button (click)="onViewDevice(device)" title="查看详情">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onEditDevice(device)" title="编辑">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onMaintainDevice(device)" title="维护记录">
                          <mat-icon>build</mat-icon>
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

          <mat-tab label="使用中">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示正在使用的设备列表...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="维护中">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示正在维护的设备列表...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="损坏设备">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示损坏的设备列表...</p>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Recent Maintenance Records -->
      <mat-card class="maintenance-card">
        <mat-card-header>
          <mat-card-title>最近维护记录</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="maintenance-list">
            <div *ngFor="let record of maintenanceRecords" class="maintenance-item">
              <div class="maintenance-icon">
                <mat-icon [class]="getMaintenanceIconClass(record.type)">
                  {{ getMaintenanceIcon(record.type) }}
                </mat-icon>
              </div>
              <div class="maintenance-info">
                <h4>{{ record.deviceName }}</h4>
                <p>{{ record.description }}</p>
                <div class="maintenance-meta">
                  <span class="date">{{ record.date }}</span>
                  <span class="technician">技术员: {{ record.technician }}</span>
                </div>
              </div>
              <div class="maintenance-status">
                <mat-chip [class]="'maintenance-status-chip ' + record.status">
                  {{ getMaintenanceStatusText(record.status) }}
                </mat-chip>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
@use 'shared/mixins' as mx;
    .hardware-management {
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
      margin-bottom: 32px;
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

    /* Stats Grid - Dark Glassmorphism */
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
      padding: 24px !important;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
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
    .stat-icon.red { background: $color-error-light; color: $color-error; }

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
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .category-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .category-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
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

    .availability-bar {
      margin-top: 8px;
    }

    .availability-text {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* Device List Card */
    .device-list-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
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

    .search-box input::placeholder {
      color: #94a3b8;
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
    .device-table {
      width: 100%;
    }

    .device-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .device-name-cell mat-icon {
      color: #2196f3;
    }

    .type-chip {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-chip {
      font-size: 12px;
    }

    .status-chip.available {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-chip.in_use {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-chip.maintenance {
      background: #fce4ec;
      color: #c2185b;
    }

    .status-chip.damaged {
      background: #ffebee;
      color: #d32f2f;
    }

    .condition-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .condition-cell mat-progress-bar {
      width: 80px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    /* Maintenance Card */
    .maintenance-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
    }

    .maintenance-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .maintenance-item {
      display: flex;
      align-items: flex-start;
      padding: 16px 0;
      border-bottom: 1px solid $color-neutral-200;
    }

    .maintenance-item:last-child {
      border-bottom: none;
    }

    .maintenance-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .maintenance-icon.repair-icon {
      background: #fef2f2;
    }
    .maintenance-icon.repair-icon mat-icon {
      color: #dc2626;
    }
    .maintenance-icon.calibration-icon {
      background: #eff6ff;
    }
    .maintenance-icon.calibration-icon mat-icon {
      color: $color-brand-primary;
    }
    .maintenance-icon.maintenance-icon {
      background: #fffbeb;
    }
    .maintenance-icon.maintenance-icon mat-icon {
      color: #d97706;
    }

    .maintenance-info {
      flex: 1;
    }

    .maintenance-info h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .maintenance-info p {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #94a3b8;
    }

    .maintenance-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: $color-neutral-500;
    }

    .maintenance-status-chip {
      font-size: 12px;
    }

    .maintenance-status-chip.completed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .maintenance-status-chip.in_progress {
      background: #fff3e0;
      color: #f57c00;
    }

    .maintenance-status-chip.scheduled {
      background: #e3f2fd;
      color: #1976d2;
    }

    /* Responsive Design - 使用统一断点 mixin */
    @include mx.responsive(md) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .categories-grid {
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
    }
  `]
})
export class HardwareManagementComponent implements OnInit {
  // Stats data with animation support
  totalDevices = 0;
  availableDevices = 0;
  maintenanceDevices = 0;
  damagedDevices = 0;

  // Device categories
  deviceCategories: DeviceCategory[] = [];
  
  // Device types for filter
  deviceTypes: string[] = ['Arduino', '传感器', '机器人', '3D打印机', '激光切割机'];

  // Sample devices data (will be replaced by API)
  devices: HardwareDevice[] = [];

  // Maintenance records (Mock for now, can be moved to API later)
  maintenanceRecords = [
    { 
      id: 'MNT-001', 
      deviceName: 'Arduino Uno R3 (ARD-001)', 
      description: '更换USB接口，测试通信正常', 
      date: '2024-01-20', 
      technician: '王技术员', 
      status: 'completed',
      type: 'repair'
    }
  ];

  // Table configuration
  displayedColumns: string[] = ['id', 'name', 'type', 'status', 'location', 'condition', 'lastUsed', 'actions'];
  selectedTabIndex = 0;
  
  // Filter variables
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';

  orgId!: number;

  constructor(
    private stemService: StemCloudService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 1;
    this.loadHardwareData();
  }

  loadHardwareData(): void {
    this.stemService.getDevices().subscribe({
      next: (data) => {
        this.devices = data;
        this.updateStats();
      },
      error: (err) => {
        console.error('Failed to load hardware data', err);
        // Fallback to mock data if API fails during development
        this.loadMockData();
      }
    });
  }

  updateStats(): void {
    this.totalDevices = this.devices.length;
    this.availableDevices = this.devices.filter(d => d.status === 'available').length;
    this.maintenanceDevices = this.devices.filter(d => d.status === 'maintenance').length;
    this.damagedDevices = this.devices.filter(d => d.status === 'damaged').length;
  }

  loadMockData(): void {
    // Keep existing mock data logic here for fallback
    this.devices = [
      { id: 'ARD-001', name: 'Arduino Uno R3', type: 'Arduino套件', status: 'available', location: '实验室A-01', lastUsed: '2024-01-15', condition: 95 },
      { id: 'ARD-002', name: 'Arduino Mega 2560', type: 'Arduino套件', status: 'in_use', location: '教室B-03', lastUsed: '2024-01-20', condition: 88, assignedTo: '张老师' },
      { id: 'RAS-001', name: 'Raspberry Pi 4B', type: 'Raspberry Pi', status: 'available', location: '实验室A-02', lastUsed: '2024-01-18', condition: 92 },
      { id: 'SEN-001', name: '温湿度传感器', type: '传感器模块', status: 'maintenance', location: '维修间', lastUsed: '2024-01-10', condition: 65 },
      { id: 'ROB-001', name: '智能小车底盘', type: '机器人底盘', status: 'damaged', location: '维修间', lastUsed: '2024-01-05', condition: 30 }
    ];
    
    this.deviceCategories = [
      { id: 'arduino', name: 'Arduino套件', icon: 'memory', count: 65, available: 52, color: '#eff6ff' },
      { id: 'raspberry', name: 'Raspberry Pi', icon: 'developer_board', count: 42, available: 35, color: '#ecfdf5' },
      { id: 'sensors', name: '传感器模块', icon: 'sensors', count: 58, available: 45, color: '#fffbeb' },
      { id: 'robots', name: '机器人底盘', icon: 'precision_manufacturing', count: 21, available: 18, color: '#f5f3ff' }
    ];

    this.updateStats();
  }

  // Helper methods
  getFilteredDevices(): HardwareDevice[] {
    return this.devices.filter(device => {
      const matchesSearch = !this.searchTerm || 
        device.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || device.status === this.statusFilter;
      const matchesType = !this.typeFilter || device.type === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get filteredDevices() {
    return this.getFilteredDevices();
  }

  getDeviceTypeIcon(type: string): string {
    switch(type) {
      case 'Arduino套件': return 'memory';
      case 'Raspberry Pi': return 'developer_board';
      case '传感器模块': return 'sensors';
      case '机器人底盘': return 'android';
      default: return 'devices';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'available': return '可用';
      case 'in_use': return '使用中';
      case 'maintenance': return '维护中';
      case 'damaged': return '损坏';
      default: return status;
    }
  }

  getConditionColor(condition: number): string {
    if (condition >= 80) return 'primary';
    if (condition >= 60) return 'accent';
    return 'warn';
  }

  getAvailabilityColor(available: number, total: number): string {
    const percentage = (available / total) * 100;
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  getMaintenanceIcon(type: string): string {
    switch(type) {
      case 'repair': return 'build';
      case 'calibration': return 'tune';
      case 'maintenance': return 'settings';
      default: return 'build';
    }
  }

  getMaintenanceIconClass(type: string): string {
    switch(type) {
      case 'repair': return 'repair-icon';
      case 'calibration': return 'calibration-icon';
      case 'maintenance': return 'maintenance-icon';
      default: return 'repair-icon';
    }
  }

  getMaintenanceStatusText(status: string): string {
    switch(status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'scheduled': return '已计划';
      default: return status;
    }
  }

  // Event handlers
  onAddDevice(): void {
    this.router.navigate(['/organization', this.orgId, 'devices', 'add']);
  }

  onExportData(): void {
    console.log('Export device data');
    // TODO: Implement export functionality
  }

  onCategorySelect(category: DeviceCategory): void {
    console.log('Category selected:', category);
    // Filter devices by category
  }

  onViewDevice(device: HardwareDevice): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id]);
  }

  onEditDevice(device: HardwareDevice): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id, 'edit']);
  }

  onMaintainDevice(device: HardwareDevice): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id, 'maintenance']);
  }
}