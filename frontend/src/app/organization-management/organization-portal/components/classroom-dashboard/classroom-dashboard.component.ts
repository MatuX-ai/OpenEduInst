/**
 * 教室管理仪表板组件
 * 提供教室列表、分配、设备管理等功能
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
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Classroom, ClassroomStatistics } from '../../models/classroom.models';
import { ClassroomService } from '../../services/classroom.service';
import { BatchOperationsToolbarComponent } from '../batch-operations-toolbar/batch-operations-toolbar.component';

@Component({
  selector: 'app-classroom-dashboard',
  template: `
    <div class="classroom-dashboard">
      <div class="dashboard-header">
        <h1><mat-icon>meeting_room</mat-icon> 教室管理</h1>
        <p>机构教室资源与设备管理</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon total-icon">
              <mat-icon>business</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics.total_classrooms }}</h3>
              <p class="stat-label">教室总数</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon available-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics.available_classrooms }}</h3>
              <p class="stat-label">可用教室</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon occupied-icon">
              <mat-icon>event_available</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics.occupied_classrooms }}</h3>
              <p class="stat-label">使用中</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon utilization-icon">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics.utilization_rate }}%</h3>
              <p class="stat-label">使用率</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 功能标签页 -->
      <mat-tab-group color="primary">
        <!-- 教室列表 -->
        <mat-tab label="教室列表">
          <div class="tab-content">
            <div class="tab-header">
              <h3>教室资源</h3>
              <div class="header-actions">
                <app-batch-operations-toolbar
                  [orgId]="orgId"
                  [selectedItems]="[]"
                  (dataChanged)="loadClassrooms()"
                >
                </app-batch-operations-toolbar>
                <button mat-raised-button color="primary" (click)="openCreateDialog()">
                  <mat-icon>add</mat-icon>
                  新增教室
                </button>
              </div>
            </div>

            <!-- 筛选器 -->
            <div class="filters-bar" [formGroup]="filterForm">
              <mat-form-field appearance="outline">
                <mat-label>教学楼</mat-label>
                <mat-select formControlName="building">
                  <mat-option value="">全部</mat-option>
                  <mat-option value="教学楼 A">教学楼 A</mat-option>
                  <mat-option value="教学楼 B">教学楼 B</mat-option>
                  <mat-option value="实验楼">实验楼</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>教室类型</mat-label>
                <mat-select formControlName="room_type">
                  <mat-option value="">全部</mat-option>
                  <mat-option value="regular">普通教室</mat-option>
                  <mat-option value="computer_lab">计算机实验室</mat-option>
                  <mat-option value="multimedia">多媒体教室</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>容纳人数</mat-label>
                <mat-select formControlName="capacity_min">
                  <mat-option value="">全部</mat-option>
                  <mat-option value="30">30 人以上</mat-option>
                  <mat-option value="50">50 人以上</mat-option>
                  <mat-option value="80">80 人以上</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-checkbox formControlName="has_projector">有投影仪</mat-checkbox>
              <mat-checkbox formControlName="has_computer">有电脑</mat-checkbox>
              <mat-checkbox formControlName="is_available">仅显示可用</mat-checkbox>
            </div>

            <!-- 表格 -->
            <table mat-table [dataSource]="filteredClassrooms" class="classroom-table">
              <ng-container matColumnDef="room_number">
                <th mat-header-cell *matHeaderCellDef>房间号</th>
                <td mat-cell *matCellDef="let item">
                  <strong>{{ item.room_number }}</strong>
                </td>
              </ng-container>

              <ng-container matColumnDef="building">
                <th mat-header-cell *matHeaderCellDef>位置</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.building }} {{ item.floor ? item.floor + '层' : '' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="capacity">
                <th mat-header-cell *matHeaderCellDef>容量</th>
                <td mat-cell *matCellDef="let item">
                  <mat-chip color="primary">{{ item.capacity }}人</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="room_type">
                <th mat-header-cell *matHeaderCellDef>类型</th>
                <td mat-cell *matCellDef="let item">
                  {{ getRoomTypeText(item.room_type) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="equipment">
                <th mat-header-cell *matHeaderCellDef>设备</th>
                <td mat-cell *matCellDef="let item">
                  <mat-icon *ngIf="item.has_projector" matTooltip="投影仪">tv</mat-icon>
                  <mat-icon *ngIf="item.has_computer" matTooltip="电脑">computer</mat-icon>
                  <mat-icon *ngIf="item.has_audio_system" matTooltip="音响">volume_up</mat-icon>
                  <mat-icon *ngIf="item.has_whiteboard" matTooltip="白板">edit</mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let item">
                  <mat-chip [color]="item.is_available ? 'primary' : 'warn'" selected>
                    {{ item.is_available ? '可用' : '维护中' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let item">
                  <button
                    mat-icon-button
                    color="primary"
                    matTooltip="查看详情"
                    (click)="viewDetail(item)"
                  >
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="accent"
                    matTooltip="编辑"
                    (click)="editClassroom(item)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    matTooltip="删除"
                    (click)="deleteClassroom(item)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="更多" [matMenuTriggerFor]="menu">
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
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-tab>

        <!-- 教室分配 -->
        <mat-tab label="教室分配">
          <div class="tab-content">
            <h3>教室分配管理</h3>
            <p>课程教室分配与调度</p>
            <!-- TODO: 实现教室分配功能 -->
          </div>
        </mat-tab>

        <!-- 设备管理 -->
        <mat-tab label="设备管理">
          <div class="tab-content">
            <h3>教学设备管理</h3>
            <p>设备清单、维护记录管理</p>
            <!-- TODO: 实现设备管理功能 -->
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .classroom-dashboard {
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 24px;
      }

      .dashboard-header h1 {
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 2rem;
        color: #2196f3;
      }

      .dashboard-header p {
        margin: 0;
        color: #666;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }

      .stat-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
      }

      .stat-card mat-card-content {
        display: flex;
        align-items: center;
        padding: 20px;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }

      .total-icon {
        background: linear-gradient(135deg, #3f51b5, #303f9f);
        color: white;
      }

      .available-icon {
        background: linear-gradient(135deg, #4caf50, #388e3c);
        color: white;
      }

      .occupied-icon {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
      }

      .utilization-icon {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
      }

      .stat-info h3 {
        margin: 0 0 4px 0;
        font-size: 1.8rem;
        font-weight: 600;
        color: #333;
      }

      .stat-label {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .tab-content {
        padding: 24px 0;
      }

      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .tab-header h3 {
        margin: 0;
        font-size: 1.3rem;
        color: #333;
      }

      .filters-bar {
        display: flex;
        gap: 16px;
        padding: 16px 0;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: center;

        mat-form-field {
          min-width: 200px;
        }
      }

      .classroom-table {
        width: 100%;
      }

      mat-icon {
        margin: 0 4px;
      }
    `,
  ],
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

  constructor(
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
    const idParam = this.route.snapshot.paramMap.get('id');
    this.orgId = idParam ? +idParam : 0;
    this.loadAllData();
    this.setupFilterListeners();
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
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // 应用筛选
    });
  }

  get filteredClassrooms(): Classroom[] {
    const filters = this.filterForm.value as {
      building?: string;
      room_type?: string;
      capacity_min?: string;
      has_projector?: boolean;
      has_computer?: boolean;
      is_available?: boolean;
    };

    return this.classrooms.filter((item) => this.applyFilters(item, filters));
  }

  private applyFilters(
    item: Classroom,
    filters: {
      building?: string;
      room_type?: string;
      capacity_min?: string;
      has_projector?: boolean;
      has_computer?: boolean;
      is_available?: boolean;
    }
  ): boolean {
    return (
      this.matchBuilding(item, filters.building) &&
      this.matchRoomType(item, filters.room_type) &&
      this.matchCapacity(item, filters.capacity_min) &&
      this.matchEquipment(item, filters.has_projector, filters.has_computer) &&
      this.matchAvailability(item, filters.is_available)
    );
  }

  private matchBuilding(item: Classroom, building?: string): boolean {
    return !building || item.building === building;
  }

  private matchRoomType(item: Classroom, roomType?: string): boolean {
    return !roomType || item.room_type === roomType;
  }

  private matchCapacity(item: Classroom, capacityMin?: string): boolean {
    return !capacityMin || item.capacity >= Number(capacityMin);
  }

  private matchEquipment(item: Classroom, hasProjector?: boolean, hasComputer?: boolean): boolean {
    if (hasProjector && !item.has_projector) return false;
    if (hasComputer && !item.has_computer) return false;
    return true;
  }

  private matchAvailability(item: Classroom, isAvailable?: boolean): boolean {
    return !isAvailable || item.isAvailable;
  }

  getRoomTypeText(type?: string): string {
    const map: Record<string, string> = {
      regular: '普通教室',
      computer_lab: '计算机实验室',
      multimedia: '多媒体教室',
      science_lab: '科学实验室',
      art_room: '美术教室',
      music_room: '音乐教室',
      gym: '体育馆',
      lecture_hall: '报告厅',
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
