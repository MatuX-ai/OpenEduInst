/**
 * 教室选择器组件
 *
 * @fileoverview 提供教室选择和空闲时段查询功能
 * @author AI Assistant
 * @date 2026-04-02
 * @version 1.0.1
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Classroom, DayOfWeek, TimeSlot } from '../../models/schedule.models';
import { ScheduleManagementService } from '../../services/schedule-management.service';

@Component({
  selector: 'app-classroom-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './classroom-selector.component.html',
  styleUrls: ['./classroom-selector.component.scss'],
})
export class ClassroomSelectorComponent implements OnInit {
  @Input() selectedClassroomId?: number;
  @Output() classroomChange = new EventEmitter<number | undefined>();

  classrooms: Classroom[] = [];
  loading = false;
  showFreeSlots = false;
  freeSlots: TimeSlot[] = [];

  // 筛选条件
  filterCapacity?: number;
  filterType?: string;

  constructor(private scheduleService: ScheduleManagementService) {}

  ngOnInit(): void {
    this.loadClassrooms();
  }

  /**
   * 加载教室列表
   */
  loadClassrooms(): void {
    this.loading = true;
    this.scheduleService.getClassroomUsageStats().subscribe({
      next: () => {
        // TODO: 从统计信息中提取教室列表
        this.classrooms = this.getMockClassrooms();
        this.loading = false;
      },
      error: (error) => {
        console.error('加载教室列表失败:', error);
        this.loading = false;
      },
    });
  }

  /**
   * 获取模拟教室数据
   */
  private getMockClassrooms(): Classroom[] {
    return [
      this.createClassroom(1, 'A101', 30, '一楼东侧', ['投影仪', '白板', '音响'], '普通教室'),
      this.createClassroom(
        2,
        'A102',
        40,
        '一楼东侧',
        ['投影仪', '白板', '音响', '空调'],
        '多媒体教室'
      ),
      this.createClassroom(
        3,
        'B201',
        50,
        '二楼西侧',
        ['投影仪', '白板', '音响', '电脑'],
        '计算机教室'
      ),
      this.createClassroom(4, 'C301', 20, '三楼南侧', ['钢琴', '音响设备'], '音乐教室'),
      this.createClassroom(5, 'D401', 25, '四楼北侧', ['画架', '美术工具', '展示墙'], '美术教室'),
    ];
  }

  /**
   * 创建教室对象
   */
  private createClassroom(
    id: number,
    name: string,
    capacity: number,
    location: string,
    equipment: string[],
    type: string
  ): Classroom {
    return {
      id,
      name,
      capacity,
      location,
      equipment,
      isAvailable: true,
      type,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    };
  }

  /**
   * 选择教室
   */
  onClassroomSelect(classroomId: number): void {
    this.selectedClassroomId = classroomId;
    this.classroomChange.emit(classroomId);
  }

  /**
   * 清除选择
   */
  onClear(): void {
    this.selectedClassroomId = undefined;
    this.classroomChange.emit(undefined);
  }

  /**
   * 查询空闲时段
   */
  onCheckFreeSlots(classroomId: number): void {
    if (this.showFreeSlots && this.selectedClassroomId === classroomId) {
      this.hideFreeSlots();
    } else {
      this.showFreeSlotsForClassroom(classroomId);
    }
  }

  /**
   * 隐藏空闲时段
   */
  private hideFreeSlots(): void {
    this.showFreeSlots = false;
    this.freeSlots = [];
  }

  /**
   * 显示指定教室的空闲时段
   */
  private showFreeSlotsForClassroom(classroomId: number): void {
    this.showFreeSlots = true;
    this.selectedClassroomId = classroomId;
    // TODO: 调用 API 查询空闲时段
    this.freeSlots = this.getMockFreeSlots(classroomId);
  }

  /**
   * 获取模拟空闲时段数据
   */
  private getMockFreeSlots(classroomId: number): TimeSlot[] {
    return [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        classroomId,
      },
      {
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '16:00',
        classroomId,
      },
      {
        dayOfWeek: 5,
        startTime: '10:00',
        endTime: '12:00',
        classroomId,
      },
      {
        dayOfWeek: 2,
        startTime: '15:00',
        endTime: '17:00',
        classroomId,
      },
      {
        dayOfWeek: 4,
        startTime: '08:00',
        endTime: '10:00',
        classroomId,
      },
    ];
  }

  /**
   * 获取星期标签
   */
  getDayLabel(day: DayOfWeek): string {
    const labels: Record<DayOfWeek, string> = {
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六',
      7: '周日',
    };
    return labels[day];
  }

  /**
   * 按类型筛选
   */
  filterByType(type?: string): void {
    if (this.filterType === type) {
      this.filterType = undefined;
    } else {
      this.filterType = type;
    }
  }

  /**
   * 获取筛选后的教室列表
   */
  get filteredClassrooms(): Classroom[] {
    if (!this.filterType) {
      return this.classrooms;
    }
    return this.classrooms.filter((c) => c.type === this.filterType);
  }

  /**
   * 获取教室类型图标
   */
  getClassroomTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      普通教室: 'school',
      多媒体教室: 'desktop_windows',
      计算机教室: 'computer',
      音乐教室: 'music_note',
      美术教室: 'palette',
      体育课: 'sports_gymnastics',
    };
    return icons[type ?? ''] || 'school';
  }

  /**
   * 获取教室类型颜色
   */
  getClassroomTypeColor(type?: string): string {
    const colors: Record<string, string> = {
      普通教室: '#667eea',
      多媒体教室: '#4facfe',
      计算机教室: '#43e97b',
      音乐教室: '#fa709a',
      美术教室: '#f093fb',
      体育课: '#fee140',
    };
    return colors[type ?? ''] || '#667eea';
  }
}
