/**
 * 教室管理仪表板组件
 * 提供教室列表、分配、设备管理等功能
 * 样式对齐原型 demo（K12 静态页）设计语言
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Classroom, ClassroomStatistics } from '../../models/classroom.models';
import { ClassroomService } from '../../services/classroom.service';
import { BatchOperationsToolbarComponent } from '../batch-operations-toolbar/batch-operations-toolbar.component';

@Component({
  selector: 'app-classroom-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatNativeDateModule,
    BatchOperationsToolbarComponent,
  ],
  template: `
    <div class="cd-page">
      <!-- 标题栏 -->
      <div class="cd-header">
        <div>
          <h1 class="cd-title">教室管理</h1>
          <p class="cd-subtitle">机构教室资源与设备管理</p>
        </div>
        <div class="cd-header-actions">
          <button class="cd-btn cd-btn-primary" (click)="openCreateDialog()">
            <mat-icon class="cd-btn-icon">add</mat-icon>
            新增教室
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="cd-stats-grid">
        <div class="cd-stat-card">
          <div class="cd-stat-body">
            <div class="cd-stat-icon cd-stat-icon-blue">
              <mat-icon>business</mat-icon>
            </div>
            <div class="cd-stat-info">
              <div class="cd-stat-value">{{ statistics.total_classrooms }}</div>
              <div class="cd-stat-label">教室总数</div>
            </div>
          </div>
        </div>

        <div class="cd-stat-card">
          <div class="cd-stat-body">
            <div class="cd-stat-icon cd-stat-icon-emerald">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="cd-stat-info">
              <div class="cd-stat-value">{{ statistics.available_classrooms }}</div>
              <div class="cd-stat-label">可用教室</div>
            </div>
          </div>
        </div>

        <div class="cd-stat-card">
          <div class="cd-stat-body">
            <div class="cd-stat-icon cd-stat-icon-amber">
              <mat-icon>event_available</mat-icon>
            </div>
            <div class="cd-stat-info">
              <div class="cd-stat-value">{{ statistics.occupied_classrooms }}</div>
              <div class="cd-stat-label">使用中</div>
            </div>
          </div>
        </div>

        <div class="cd-stat-card">
          <div class="cd-stat-body">
            <div class="cd-stat-icon cd-stat-icon-purple">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="cd-stat-info">
              <div class="cd-stat-value">{{ statistics.utilization_rate }}%</div>
              <div class="cd-stat-label">使用率</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容卡片（标签页） -->
      <div class="cd-main-card">
        <mat-tab-group color="primary" class="cd-tab-group" [selectedIndex]="selectedTabIndex">
          <!-- 教室列表 -->
          <mat-tab label="教室列表">
            <div class="cd-tab-content">
              <!-- 操作工具栏 -->
              <div class="cd-toolbar">
                <div class="cd-toolbar-left">
                  <div class="cd-search-box">
                    <mat-icon class="cd-search-icon">search</mat-icon>
                    <input
                      class="cd-search-input"
                      type="text"
                      placeholder="搜索教室名称或位置..."
                      [formControl]="searchControl"
                    />
                  </div>
                  <div class="cd-filter-group">
                    <select class="cd-filter-select" [formControl]="buildingFilter">
                      <option value="">全部教学楼</option>
                      <option value="教学楼 A">教学楼 A</option>
                      <option value="教学楼 B">教学楼 B</option>
                      <option value="实验楼">实验楼</option>
                    </select>
                    <select class="cd-filter-select" [formControl]="typeFilter">
                      <option value="">全部类型</option>
                      <option value="regular">普通教室</option>
                      <option value="computer_lab">计算机实验室</option>
                      <option value="multimedia">多媒体教室</option>
                    </select>
                  </div>
                </div>
                <div class="cd-toolbar-right">
                  <app-batch-operations-toolbar
                    [orgId]="orgId"
                    [selectedItems]="[]"
                    (dataChanged)="loadClassrooms()"
                  ></app-batch-operations-toolbar>
                </div>
              </div>

              <!-- 设备筛选复选框 -->
              <div class="cd-equip-filters">
                <label class="cd-checkbox-label">
                  <input type="checkbox" [formControl]="hasProjectorFilter" />
                  <span>有投影仪</span>
                </label>
                <label class="cd-checkbox-label">
                  <input type="checkbox" [formControl]="hasComputerFilter" />
                  <span>有电脑</span>
                </label>
                <label class="cd-checkbox-label">
                  <input type="checkbox" [formControl]="availOnlyFilter" />
                  <span>仅显示可用</span>
                </label>
              </div>

              <!-- 教室表格 -->
              <div class="cd-table-wrap">
                <table class="cd-table">
                  <thead>
                    <tr>
                      <th class="cd-th">房间号</th>
                      <th class="cd-th">位置</th>
                      <th class="cd-th">容量</th>
                      <th class="cd-th">类型</th>
                      <th class="cd-th">设备</th>
                      <th class="cd-th">状态</th>
                      <th class="cd-th">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of filteredClassrooms" class="cd-tr">
                      <td class="cd-td">
                        <span class="cd-td-strong">{{ item.room_number }}</span>
                      </td>
                      <td class="cd-td">{{ item.building }} {{ item.floor ? item.floor + '层' : '' }}</td>
                      <td class="cd-td">{{ item.capacity }}人</td>
                      <td class="cd-td">{{ getRoomTypeText(item.room_type) }}</td>
                      <td class="cd-td">
                        <div class="cd-equip-icons">
                          <mat-icon *ngIf="item.has_projector" matTooltip="投影仪" class="cd-equip-icon">tv</mat-icon>
                          <mat-icon *ngIf="item.has_computer" matTooltip="电脑" class="cd-equip-icon">computer</mat-icon>
                          <mat-icon *ngIf="item.has_audio_system" matTooltip="音响" class="cd-equip-icon">volume_up</mat-icon>
                          <mat-icon *ngIf="item.has_whiteboard" matTooltip="白板" class="cd-equip-icon">edit</mat-icon>
                        </div>
                      </td>
                      <td class="cd-td">
                        <span [class.cd-badge-emerald]="item.isAvailable" [class.cd-badge-red]="!item.isAvailable" class="cd-badge">
                          {{ item.isAvailable ? '可用' : '维护中' }}
                        </span>
                      </td>
                      <td class="cd-td">
                        <div class="cd-action-group">
                          <button class="cd-action-btn" matTooltip="查看详情" (click)="viewDetail(item)">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          <button class="cd-action-btn" matTooltip="编辑" (click)="editClassroom(item)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button class="cd-action-btn cd-action-btn-danger" matTooltip="删除" (click)="deleteClassroom(item)">
                            <mat-icon>delete</mat-icon>
                          </button>
                          <button class="cd-action-btn" matTooltip="更多" [matMenuTriggerFor]="menu">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #menu="matMenu">
                            <button mat-menu-item (click)="viewSchedule(item)">
                              <mat-icon>event</mat-icon>
                              <span>查看课表</span>
                            </button>
                            <button mat-menu-item (click)="assignClassroom(item)">
                              <mat-icon>assignment</mat-icon>
                              <span>分配教室</span>
                            </button>
                          </mat-menu>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="filteredClassrooms.length === 0">
                      <td colspan="7" class="cd-empty-cell">
                        <div class="cd-empty-state">
                          <mat-icon class="cd-empty-icon">meeting_room</mat-icon>
                          <p class="cd-empty-text">暂无符合条件的教室</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- 教室分配 -->
          <mat-tab label="教室分配">
            <div class="cd-tab-content">
              <div class="cd-placeholder-card">
                <mat-icon class="cd-placeholder-icon">assignment</mat-icon>
                <h3 class="cd-placeholder-title">教室分配管理</h3>
                <p class="cd-placeholder-desc">课程教室分配与调度功能即将上线</p>
              </div>
            </div>
          </mat-tab>

          <!-- 设备管理 -->
          <mat-tab label="设备管理">
            <div class="cd-tab-content">
              <div class="cd-toolbar">
                <div class="cd-toolbar-left">
                  <div class="cd-search-box">
                    <mat-icon class="cd-search-icon">search</mat-icon>
                    <input
                      class="cd-search-input"
                      type="text"
                      placeholder="搜索设备名称、编号..."
                      [(ngModel)]="deviceSearchTerm"
                    />
                  </div>
                  <div class="cd-filter-group">
                    <select class="cd-filter-select" [(ngModel)]="deviceStatusFilter">
                      <option value="">全部状态</option>
                      <option value="available">可用</option>
                      <option value="in_use">使用中</option>
                      <option value="maintenance">维护中</option>
                      <option value="damaged">损坏</option>
                    </select>
                    <select class="cd-filter-select" [(ngModel)]="deviceTypeFilter">
                      <option value="">全部类型</option>
                      <option *ngFor="let type of deviceTypes" [value]="type">{{ type }}</option>
                    </select>
                  </div>
                </div>
                <div class="cd-toolbar-right">
                  <button class="cd-btn cd-btn-primary" (click)="onAddDevice()">
                    <mat-icon class="cd-btn-icon">add</mat-icon>
                    添加设备
                  </button>
                  <button class="cd-btn cd-btn-secondary" (click)="onExportData()">
                    <mat-icon class="cd-btn-icon">download</mat-icon>
                    导出数据
                  </button>
                </div>
              </div>

              <div class="cd-table-wrap">
                <table class="cd-table">
                  <thead>
                    <tr>
                      <th class="cd-th">设备编号</th>
                      <th class="cd-th">设备名称</th>
                      <th class="cd-th">类型</th>
                      <th class="cd-th">状态</th>
                      <th class="cd-th">位置</th>
                      <th class="cd-th">完好度</th>
                      <th class="cd-th">最后使用</th>
                      <th class="cd-th">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let device of filteredDevices" class="cd-tr">
                      <td class="cd-td cd-td-mono">{{ device.id }}</td>
                      <td class="cd-td">
                        <div class="cd-device-name">
                          <mat-icon class="cd-device-icon">devices</mat-icon>
                          <span>{{ device.name }}</span>
                        </div>
                      </td>
                      <td class="cd-td">
                        <span class="cd-badge cd-badge-slate">{{ device.type }}</span>
                      </td>
                      <td class="cd-td">
                        <span [class.cd-badge-emerald]="device.status==='available'"
                              [class.cd-badge-amber]="device.status==='in_use'"
                              [class.cd-badge-rose]="device.status==='maintenance'"
                              [class.cd-badge-red]="device.status==='damaged'"
                              class="cd-badge">
                          {{ getStatusText(device.status) }}
                        </span>
                      </td>
                      <td class="cd-td">{{ device.location }}</td>
                      <td class="cd-td">
                        <div class="cd-condition-bar">
                          <div class="cd-progress-track">
                            <div class="cd-progress-fill"
                                 [style.width.%]="device.condition"
                                 [class.cd-fill-emerald]="device.condition >= 80"
                                 [class.cd-fill-blue]="device.condition >= 60 && device.condition < 80"
                                 [class.cd-fill-amber]="device.condition < 60">
                            </div>
                          </div>
                          <span class="cd-progress-text">{{ device.condition }}%</span>
                        </div>
                      </td>
                      <td class="cd-td cd-td-muted">{{ device.lastUsed }}</td>
                      <td class="cd-td">
                        <div class="cd-action-group">
                          <button class="cd-action-btn" matTooltip="查看详情" (click)="onViewDevice(device)">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          <button class="cd-action-btn" matTooltip="编辑" (click)="onEditDevice(device)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button class="cd-action-btn" matTooltip="维护记录" (click)="onMaintainDevice(device)">
                            <mat-icon>build</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="filteredDevices.length === 0">
                      <td colspan="8" class="cd-empty-cell">
                        <div class="cd-empty-state">
                          <mat-icon class="cd-empty-icon">devices</mat-icon>
                          <p class="cd-empty-text">暂无设备数据</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 最近维护记录 -->
              <div class="cd-section-header">
                <mat-icon class="cd-section-icon cd-icon-amber">build</mat-icon>
                <span>最近维护记录</span>
              </div>
              <div class="cd-maintenance-list">
                <div *ngFor="let record of maintenanceRecords" class="cd-mnt-item">
                  <div class="cd-mnt-avatar" [class.cd-mnt-avatar-red]="record.type==='repair'"
                       [class.cd-mnt-avatar-blue]="record.type==='calibration'"
                       [class.cd-mnt-avatar-amber]="record.type==='maintenance'">
                    <mat-icon>{{ getMaintenanceIcon(record.type) }}</mat-icon>
                  </div>
                  <div class="cd-mnt-body">
                    <div class="cd-mnt-title">{{ record.deviceName }}</div>
                    <div class="cd-mnt-meta">
                      <span>{{ record.description }}</span>
                      <span class="cd-mnt-date">{{ record.date }}</span>
                    </div>
                    <div class="cd-mnt-tech">技术员: {{ record.technician }}</div>
                  </div>
                  <div class="cd-mnt-status">
                    <span [class.cd-badge-emerald]="record.status==='completed'"
                          [class.cd-badge-amber]="record.status==='in_progress'"
                          [class.cd-badge-blue]="record.status==='scheduled'"
                          class="cd-badge">
                      {{ getMaintenanceStatusText(record.status) }}
                    </span>
                  </div>
                </div>
                <div *ngIf="maintenanceRecords.length === 0" class="cd-empty-state">
                  <mat-icon class="cd-empty-icon">build</mat-icon>
                  <p class="cd-empty-text">暂无维护记录</p>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;

      /* ===== Page Layout ===== */
      .cd-page {
        padding: $spacing-lg;
        max-width: 1600px;
        margin: 0 auto;
      }

      /* ===== Header ===== */
      .cd-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-lg;
      }

      .cd-title {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 700;
        color: $color-neutral-800;
        line-height: 1.3;
      }

      .cd-subtitle {
        margin: $spacing-xs 0 0 0;
        font-size: $font-size-sm;
        color: $color-neutral-500;
      }

      .cd-header-actions {
        display: flex;
        gap: $spacing-sm;
        align-items: center;
      }

      /* ===== Buttons ===== */
      .cd-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: none;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        font-weight: 500;
        cursor: pointer;
        transition: all $transition-fast ease;
        line-height: 1;
      }

      .cd-btn-icon {
        font-size: $font-size-lg;
        width: $font-size-lg;
        height: $font-size-lg;
      }

      .cd-btn-primary {
        background: $btn-primary-bg;
        color: $btn-primary-color;
      }
      .cd-btn-primary:hover {
        background: $btn-primary-bg-hover;
      }

      .cd-btn-secondary {
        background: $btn-secondary-bg;
        color: $btn-secondary-color;
        border: $btn-secondary-border;
      }
      .cd-btn-secondary:hover {
        background: $btn-secondary-bg-hover;
        border-color: $color-neutral-300;
      }

      /* ===== Stats Grid ===== */
      .cd-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: $spacing-md;
        margin-bottom: $spacing-lg;
      }

      .cd-stat-card {
        background: $card-bg;
        border-radius: $card-border-radius;
        border: $card-border;
        box-shadow: $card-shadow;
        transition: box-shadow $transition-fast ease;
      }
      .cd-stat-card:hover {
        box-shadow: $card-shadow-hover;
      }

      .cd-stat-body {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        padding: $spacing-lg;
      }

      .cd-stat-icon {
        width: 44px;
        height: 44px;
        border-radius: $radius-md;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .cd-stat-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .cd-stat-icon-blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
      .cd-stat-icon-emerald { background: $color-stem-green-bg; color: $color-stem-green; }
      .cd-stat-icon-amber { background: $color-warning-light; color: $color-warning; }
      .cd-stat-icon-purple { background: $color-brand-primary-bg; color: $color-brand-primary; }

      .cd-stat-info {
        flex: 1;
      }
      .cd-stat-value {
        font-size: $font-size-2xl;
        font-weight: 700;
        color: $color-neutral-800;
        line-height: 1.1;
        margin-bottom: $spacing-xs;
      }
      .cd-stat-label {
        font-size: $font-size-xs;
        color: $color-neutral-500;
        font-weight: 500;
      }

      /* ===== Main Card ===== */
      .cd-main-card {
        background: $card-bg;
        border-radius: $card-border-radius;
        border: $card-border;
        box-shadow: $card-shadow;
        overflow: hidden;
      }

      .cd-tab-group {
        font-family: inherit;
      }

      ::ng-deep .cd-main-card .mat-mdc-tab-header {
        border-bottom: $card-border;
      }

      ::ng-deep .cd-main-card .mat-mdc-tab-label-container {
        padding: 0 4px;
      }

      ::ng-deep .cd-main-card .mat-mdc-tab {
        height: 44px;
        font-size: $font-size-sm;
        font-weight: 500;
        color: $color-neutral-500;
        min-width: auto;
        padding: 0 20px;
      }

      ::ng-deep .cd-main-card .mat-mdc-tab.mdc-tab--active {
        color: $color-brand-primary;
      }

      ::ng-deep .cd-main-card .mat-mdc-tab .mdc-tab-indicator__content--underline {
        border-color: $color-brand-primary;
      }

      .cd-tab-content {
        padding: 20px;
      }

      /* ===== Toolbar ===== */
      .cd-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 12px;
        flex-wrap: wrap;
      }

      .cd-toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        flex: 1;
      }

      .cd-toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cd-search-box {
        position: relative;
        width: 240px;
      }
      .cd-search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: $color-neutral-400;
        pointer-events: none;
      }
      .cd-search-input {
        width: 100%;
        padding: 8px 10px 8px 34px;
        border: $card-border;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        color: $color-neutral-800;
        background: $card-bg;
        outline: none;
        transition: border-color $transition-fast;
        box-sizing: border-box;
      }
      .cd-search-input:focus {
        border-color: $color-brand-primary;
      }
      .cd-search-input::placeholder {
        color: $color-neutral-400;
      }

      .cd-filter-group {
        display: flex;
        gap: $spacing-sm;
      }

      .cd-filter-select {
        padding: 8px 12px;
        border: $card-border;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        color: $color-neutral-800;
        background: $card-bg;
        outline: none;
        cursor: pointer;
        transition: border-color $transition-fast;
      }
      .cd-filter-select:focus {
        border-color: $color-brand-primary;
      }

      .cd-equip-filters {
        display: flex;
        gap: $spacing-md;
        margin-bottom: $spacing-md;
        padding: 0 4px;
      }

      .cd-checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: $font-size-sm;
        color: $color-neutral-600;
        cursor: pointer;
      }
      .cd-checkbox-label input[type="checkbox"] {
        width: 15px;
        height: 15px;
        accent-color: $color-brand-primary;
        cursor: pointer;
      }

      /* ===== Table (Demo Style) ===== */
      .cd-table-wrap {
        overflow-x: auto;
        border: $card-border;
        border-radius: $radius-md;
      }

      .cd-table {
        width: 100%;
        border-collapse: collapse;
      }

      .cd-th {
        text-align: left;
        padding: 10px 14px;
        font-size: $font-size-xs;
        font-weight: 600;
        color: $color-neutral-500;
        background: $color-neutral-50;
        border-bottom: $card-border;
        white-space: nowrap;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .cd-tr {
        border-bottom: 1px solid $color-neutral-100;
        transition: background 0.1s;
      }
      .cd-tr:last-child {
        border-bottom: none;
      }
      .cd-tr:hover {
        background: $color-neutral-50;
      }

      .cd-td {
        padding: 11px 14px;
        font-size: $font-size-sm;
        color: $color-neutral-700;
      }

      .cd-td-strong {
        font-weight: 600;
        color: $color-neutral-800;
      }

      .cd-td-mono {
        font-family: 'Courier New', monospace;
        font-size: $font-size-xs;
        color: $color-neutral-500;
      }

      .cd-td-muted {
        color: $color-neutral-400;
        font-size: $font-size-xs;
      }

      .cd-empty-cell {
        text-align: center;
        padding: 40px 20px;
      }

      .cd-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-sm;
        padding: 24px;
      }

      .cd-empty-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: $color-neutral-300;
      }

      .cd-empty-text {
        margin: 0;
        font-size: $font-size-sm;
        color: $color-neutral-400;
      }

      /* ===== Badges (Demo Style) ===== */
      .cd-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: $font-size-xs;
        font-weight: 500;
        line-height: 1.5;
        white-space: nowrap;
      }

      .cd-badge-emerald { background: $color-stem-green-bg; color: $color-stem-green; }
      .cd-badge-red { background: $color-error-light; color: $color-error; }
      .cd-badge-amber { background: $color-warning-light; color: $color-warning; }
      .cd-badge-blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
      .cd-badge-rose { background: #fdf2f8; color: #e11d48; }
      .cd-badge-slate { background: $color-neutral-100; color: $color-neutral-500; }

      /* ===== Equipment Icons ===== */
      .cd-equip-icons {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .cd-equip-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: $color-neutral-500;
      }

      /* ===== Action Buttons ===== */
      .cd-action-group {
        display: flex;
        gap: 2px;
        align-items: center;
      }

      .cd-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: $radius-sm;
        background: transparent;
        color: $color-neutral-500;
        cursor: pointer;
        transition: all $transition-fast;
      }
      .cd-action-btn:hover {
        background: $color-neutral-100;
        color: $color-brand-primary;
      }
      .cd-action-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .cd-action-btn-danger:hover {
        color: $color-error;
      }

      /* ===== Device Name ===== */
      .cd-device-name {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
      }
      .cd-device-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: $color-brand-primary;
      }

      /* ===== Progress Bar (Demo Style) ===== */
      .cd-condition-bar {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
      }

      .cd-progress-track {
        width: 70px;
        height: 6px;
        background: $color-neutral-100;
        border-radius: 999px;
        overflow: hidden;
      }

      .cd-progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }

      .cd-fill-emerald { background: $color-stem-green; }
      .cd-fill-blue { background: $color-brand-primary; }
      .cd-fill-amber { background: $color-warning; }

      .cd-progress-text {
        font-size: $font-size-xs;
        font-weight: 600;
        color: $color-neutral-600;
        min-width: 32px;
      }

      /* ===== Section Header ===== */
      .cd-section-header {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-neutral-800;
        margin: $spacing-lg 0 14px 0;
      }

      .cd-section-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .cd-icon-amber { color: $color-warning; }

      /* ===== Maintenance List (Demo Style) ===== */
      .cd-maintenance-list {
        border: $card-border;
        border-radius: $radius-md;
        overflow: hidden;
      }

      .cd-mnt-item {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 14px 16px;
        border-bottom: 1px solid $color-neutral-100;
        transition: background 0.1s;
      }
      .cd-mnt-item:last-child {
        border-bottom: none;
      }
      .cd-mnt-item:hover {
        background: $color-neutral-50;
      }

      .cd-mnt-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .cd-mnt-avatar mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .cd-mnt-avatar-red { background: $color-error-light; color: $color-error; }
      .cd-mnt-avatar-blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
      .cd-mnt-avatar-amber { background: $color-warning-light; color: $color-warning; }

      .cd-mnt-body {
        flex: 1;
        min-width: 0;
      }
      .cd-mnt-title {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-neutral-800;
        margin-bottom: 2px;
      }
      .cd-mnt-meta {
        font-size: $font-size-xs;
        color: $color-neutral-500;
        margin-bottom: 2px;
      }
      .cd-mnt-date {
        margin-left: 8px;
        color: $color-neutral-400;
      }
      .cd-mnt-tech {
        font-size: $font-size-xs;
        color: $color-neutral-400;
      }
      .cd-mnt-status {
        flex-shrink: 0;
        align-self: center;
      }

      /* ===== Placeholder (Demo Style) ===== */
      .cd-placeholder-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 24px;
        text-align: center;
      }
      .cd-placeholder-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: $color-neutral-300;
        margin-bottom: 12px;
      }
      .cd-placeholder-title {
        margin: 0 0 6px 0;
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-neutral-800;
      }
      .cd-placeholder-desc {
        margin: 0;
        font-size: $font-size-sm;
        color: $color-neutral-400;
      }

      /* ===== Responsive ===== */
      @media (max-width: 1200px) {
        .cd-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .cd-stats-grid {
          grid-template-columns: 1fr;
        }
        .cd-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        .cd-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .cd-toolbar-left {
          flex-direction: column;
        }
        .cd-search-box {
          width: 100%;
        }
        .cd-filter-group {
          width: 100%;
        }
        .cd-filter-select {
          flex: 1;
        }
        .cd-equip-filters {
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    `,
  ],
})
export class ClassroomDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orgId!: number;
  classrooms: Classroom[] = [];
  statistics: ClassroomStatistics = {
    total_classrooms: 0,
    available_classrooms: 0,
    occupied_classrooms: 0,
    maintenance_classrooms: 0,
    utilization_rate: 0,
    by_type: {
      regular: 0,
      computer_lab: 0,
      multimedia: 0,
      science_lab: 0,
    },
    by_capacity: [],
  };

  // Filter controls
  searchControl = this.fb.control('');
  buildingFilter = this.fb.control('');
  typeFilter = this.fb.control('');
  hasProjectorFilter = this.fb.control(false);
  hasComputerFilter = this.fb.control(false);
  availOnlyFilter = this.fb.control(false);

  filterForm: FormGroup;
  displayedColumns = [
    'room_number',
    'building',
    'capacity',
    'room_type',
    'equipment',
    'status',
    'actions',
  ];

  // Device management properties
  deviceSearchTerm = '';
  deviceStatusFilter = '';
  deviceTypeFilter = '';
  deviceTypes: string[] = ['Arduino', '传感器', '机器人', '3D打印机', '激光切割机'];

  // Tab selection based on route (/classrooms vs /devices)
  selectedTabIndex = 0;

  devices: any[] = [];
  maintenanceRecords: any[] = [
    {
      id: 'MNT-001',
      deviceName: 'Arduino Uno R3 (ARD-001)',
      description: '更换USB接口，测试通信正常',
      date: '2024-01-20',
      technician: '王技术员',
      status: 'completed',
      type: 'repair',
    },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private classroomService: ClassroomService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      building: [''],
      room_type: [''],
      capacity_min: [''],
      has_projector: [false],
      has_computer: [false],
      is_available: [false],
    });
  }

  ngOnInit(): void {
    // 从父路由获取 orgId（当前路由是 /organization/:id/devices 的子路由）
    const idParam = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    this.orgId = idParam ? +idParam : 1;
    this.loadAllData();
    this.setupFilterListeners();
    this.loadMockDeviceData();

    // 根据 URL 路径选择默认标签页
    // /classrooms → 教室列表(tab 0), /devices → 设备管理(tab 2)
    if (this.router.url.includes('/classrooms')) {
      this.selectedTabIndex = 0;
    } else if (this.router.url.includes('/devices')) {
      this.selectedTabIndex = 2;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loadClassrooms();
    this.loadStatistics();
  }

  loadClassrooms(): void {
    this.classroomService
      .getClassrooms(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Classroom[]) => {
        this.classrooms = data;
        this.cdr.detectChanges();
      });
  }

  loadStatistics(): void {
    this.classroomService
      .getClassroomStatistics(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ClassroomStatistics) => {
        this.statistics = data;
        this.cdr.detectChanges();
      });
  }

  setupFilterListeners(): void {
    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
    this.buildingFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
    this.typeFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
    this.hasProjectorFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
    this.hasComputerFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
    this.availOnlyFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.detectChanges());
  }

  get filteredClassrooms(): Classroom[] {
    return this.classrooms.filter((item) => {
      const search = (this.searchControl.value || '').toLowerCase();
      if (search && !item.room_number?.toLowerCase().includes(search) &&
          !item.building?.toLowerCase().includes(search)) {
        return false;
      }
      const building = this.buildingFilter.value;
      if (building && item.building !== building) return false;
      const type = this.typeFilter.value;
      if (type && item.room_type !== type) return false;
      if (this.hasProjectorFilter.value && !item.has_projector) return false;
      if (this.hasComputerFilter.value && !item.has_computer) return false;
      if (this.availOnlyFilter.value && !item.isAvailable) return false;
      return true;
    });
  }

  // --- Device management methods ---

  loadMockDeviceData(): void {
    this.devices = [
      { id: 'ARD-001', name: 'Arduino Uno R3', type: 'Arduino套件', status: 'available', location: '实验室A-01', lastUsed: '2026-04-15', condition: 95 },
      { id: 'ARD-002', name: 'Arduino Mega 2560', type: 'Arduino套件', status: 'in_use', location: '教室B-03', lastUsed: '2026-04-20', condition: 88, assignedTo: '张老师' },
      { id: 'RAS-001', name: 'Raspberry Pi 4B', type: 'Raspberry Pi', status: 'available', location: '实验室A-02', lastUsed: '2026-04-18', condition: 92 },
      { id: 'SEN-001', name: '温湿度传感器', type: '传感器模块', status: 'maintenance', location: '维修间', lastUsed: '2026-04-10', condition: 65 },
      { id: 'ROB-001', name: '智能小车底盘', type: '机器人底盘', status: 'damaged', location: '维修间', lastUsed: '2026-04-05', condition: 30 },
    ];
    this.maintenanceRecords = [
      { id: 'MNT-001', deviceName: 'Arduino Uno R3 (ARD-001)', description: '更换USB接口，测试通信正常', date: '2026-04-20', technician: '王技术员', status: 'completed', type: 'repair' },
      { id: 'MNT-002', deviceName: '温湿度传感器 (SEN-001)', description: '校准传感器精度，更换电池', date: '2026-04-18', technician: '李技术员', status: 'in_progress', type: 'calibration' },
      { id: 'MNT-003', deviceName: '智能小车底盘 (ROB-001)', description: '电机驱动板损坏，等待配件', date: '2026-04-15', technician: '王技术员', status: 'scheduled', type: 'repair' },
    ];
  }

  get filteredDevices(): any[] {
    return this.devices.filter((device) => {
      const matchesSearch = !this.deviceSearchTerm ||
        device.name.toLowerCase().includes(this.deviceSearchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(this.deviceSearchTerm.toLowerCase());
      const matchesStatus = !this.deviceStatusFilter || device.status === this.deviceStatusFilter;
      const matchesType = !this.deviceTypeFilter || device.type === this.deviceTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = { available: '可用', in_use: '使用中', maintenance: '维护中', damaged: '损坏' };
    return map[status] || status;
  }

  getMaintenanceIcon(type: string): string {
    const map: Record<string, string> = { repair: 'build', calibration: 'tune', maintenance: 'settings' };
    return map[type] || 'build';
  }

  getMaintenanceStatusText(status: string): string {
    const map: Record<string, string> = { completed: '已完成', in_progress: '进行中', scheduled: '已计划' };
    return map[status] || status;
  }

  onAddDevice(): void {
    this.router.navigate(['/organization', this.orgId, 'devices', 'add']);
  }

  onExportData(): void {
    console.log('Export device data');
  }

  onViewDevice(device: any): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id]);
  }

  onEditDevice(device: any): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id, 'edit']);
  }

  onMaintainDevice(device: any): void {
    this.router.navigate(['/organization', this.orgId, 'devices', device.id, 'maintenance']);
  }

  // --- Classroom CRUD methods ---

  getRoomTypeText(type?: string): string {
    const map: Record<string, string> = {
      regular: '普通教室', computer_lab: '计算机实验室', multimedia: '多媒体教室',
      science_lab: '科学实验室', art_room: '美术教室', music_room: '音乐教室',
      gym: '体育馆', lecture_hall: '报告厅',
    };
    return map[type ?? ''] ?? type ?? '-';
  }

  openCreateDialog(): void {
    // TODO: 打开创建对话框
  }

  viewDetail(_item: Classroom): void {
    // TODO: 实现查看详情逻辑
  }

  editClassroom(_item: Classroom): void {
    // TODO: 实现编辑逻辑
  }

  deleteClassroom(_item: Classroom): void {
    // TODO: 实现删除逻辑
  }

  viewSchedule(_item: Classroom): void {
    // TODO: 实现查看课表逻辑
  }

  assignClassroom(_item: Classroom): void {
    // TODO: 实现分配教室逻辑
  }
}
