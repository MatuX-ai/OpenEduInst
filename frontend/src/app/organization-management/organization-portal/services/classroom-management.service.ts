/**
 * 教室管理服务
 *
 * @fileoverview 提供教室管理的完整业务逻辑
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  Classroom,
  ClassroomBooking,
  ClassroomFilter,
  ClassroomMaintenance,
  ClassroomStats,
  ClassroomType,
  ClassroomUsageStats,
  CreateBookingRequest,
  CreateClassroomRequest,
  CreateMaintenanceRequest,
  UpdateBookingRequest,
  UpdateClassroomRequest,
} from '../models/classroom.models';

@Injectable({ providedIn: 'root' })
export class ClassroomManagementService {
  // Mock 数据
  private classrooms: Classroom[] = [
    {
      id: 1,
      name: 'A101',
      capacity: 30,
      location: '一楼东侧',
      equipment: ['投影仪', '白板', '音响'],
      type: '普通教室',
      isAvailable: true,
      description: '标准教室，适合 30 人以下课程',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    },
    {
      id: 2,
      name: 'A102',
      capacity: 40,
      location: '一楼东侧',
      equipment: ['投影仪', '白板', '音响', '空调'],
      type: '多媒体教室',
      isAvailable: true,
      description: '多媒体教室，配备先进设备',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    },
    {
      id: 3,
      name: 'B201',
      capacity: 50,
      location: '二楼西侧',
      equipment: ['投影仪', '白板', '音响', '电脑'],
      type: '计算机教室',
      isAvailable: true,
      description: '计算机专用教室，人手一机',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    },
    {
      id: 4,
      name: 'C301',
      capacity: 20,
      location: '三楼南侧',
      equipment: ['钢琴', '音响', '镜子'],
      type: '舞蹈教室',
      isAvailable: false,
      description: '舞蹈教室，配备钢琴和镜子墙',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    },
  ];

  private bookings: ClassroomBooking[] = [];
  private maintenances: ClassroomMaintenance[] = [];

  /**
   * 获取教室列表
   */
  getClassrooms(filter?: ClassroomFilter): Observable<Classroom[]> {
    let result = [...this.classrooms];

    if (filter?.type) {
      result = result.filter((c) => c.type === filter.type);
    }

    if (filter?.capacity) {
      const capacity = filter.capacity;
      result = result.filter((c) => c.capacity >= capacity);
    }

    if (filter?.isAvailable !== undefined) {
      result = result.filter((c) => c.isAvailable === filter.isAvailable);
    }

    if (filter?.search) {
      const keyword = filter.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          (c.location?.toLowerCase().includes(keyword) ?? false) ||
          (c.description?.toLowerCase().includes(keyword) ?? false)
      );
    }

    return of(result);
  }

  /**
   * 获取教室详情
   */
  getClassroomById(id: number): Observable<Classroom | undefined> {
    const classroom = this.classrooms.find((c) => c.id === id);
    return of(classroom);
  }

  /**
   * 创建教室
   */
  createClassroom(request: CreateClassroomRequest): Observable<Classroom> {
    const newClassroom: Classroom = {
      id: this.generateId(),
      ...request,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.classrooms.push(newClassroom);
    return of(newClassroom);
  }

  /**
   * 更新教室
   */
  updateClassroom(id: number, request: UpdateClassroomRequest): Observable<Classroom> {
    const index = this.classrooms.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Classroom ${id} not found`);
    }

    this.classrooms[index] = {
      ...this.classrooms[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    return of(this.classrooms[index]);
  }

  /**
   * 删除教室
   */
  deleteClassroom(id: number): Observable<boolean> {
    const index = this.classrooms.findIndex((c) => c.id === id);
    if (index === -1) {
      return of(false);
    }

    this.classrooms.splice(index, 1);
    return of(true);
  }

  /**
   * 获取统计数据
   */
  getStats(): Observable<ClassroomStats> {
    const total = this.classrooms.length;
    const available = this.classrooms.filter((c) => c.isAvailable).length;
    const unavailable = total - available;
    const totalCapacity = this.classrooms.reduce((sum, c) => sum + c.capacity, 0);

    // 类型统计
    const typeMap = new Map<ClassroomType, number>();
    this.classrooms.forEach((c) => {
      const type = c.type ?? '其他';
      typeMap.set(type as ClassroomType, (typeMap.get(type as ClassroomType) ?? 0) + 1);
    });

    const typeStats = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: (count / total) * 100,
    }));

    return of({
      totalClassrooms: total,
      availableClassrooms: available,
      unavailableClassrooms: unavailable,
      totalCapacity,
      todayBookings: 0,
      thisWeekBookings: 0,
      utilizationRate: 0,
      typeStats,
    });
  }

  /**
   * 获取教室使用率统计
   */
  getClassroomUsageStats(_classroomId?: number): Observable<ClassroomUsageStats[]> {
    const stats: ClassroomUsageStats[] = this.classrooms.map((c) => ({
      classroomId: c.id,
      classroomName: c.name,
      totalHours: 0,
      bookingCount: 0,
      utilizationRate: 0,
      averageParticipants: 0,
      freeSlots: [],
    }));

    return of(stats);
  }

  /**
   * 创建预约
   */
  createBooking(request: CreateBookingRequest): Observable<ClassroomBooking> {
    const newBooking: ClassroomBooking = {
      id: this.generateBookingId(),
      classroomId: request.classroomId,
      classroomName: '未命名教室',
      purpose: request.purpose,
      bookerId: request.bookerId,
      bookerName: '未知用户',
      startTime: request.startTime,
      endTime: request.endTime,
      status: 'pending',
      participants: request.participants,
      notes: request.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.push(newBooking);
    return of(newBooking);
  }

  /**
   * 更新预约
   */
  updateBooking(id: number, request: UpdateBookingRequest): Observable<ClassroomBooking> {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Booking ${id} not found`);
    }

    this.bookings[index] = {
      ...this.bookings[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    return of(this.bookings[index]);
  }

  /**
   * 删除预约
   */
  deleteBooking(id: number): Observable<boolean> {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return of(false);
    }

    this.bookings.splice(index, 1);
    return of(true);
  }

  /**
   * 创建维护记录
   */
  createMaintenance(request: CreateMaintenanceRequest): Observable<ClassroomMaintenance> {
    const newMaintenance: ClassroomMaintenance = {
      id: this.generateMaintenanceId(),
      ...request,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.maintenances.push(newMaintenance);
    return of(newMaintenance);
  }

  /**
   * 更新维护记录
   */
  updateMaintenance(
    id: number,
    status: 'in_progress' | 'completed' | 'cancelled'
  ): Observable<ClassroomMaintenance> {
    const index = this.maintenances.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Maintenance ${id} not found`);
    }

    this.maintenances[index].status = status;
    this.maintenances[index].updatedAt = new Date().toISOString();

    if (status === 'completed') {
      this.maintenances[index].completedAt = new Date().toISOString();
    }

    return of(this.maintenances[index]);
  }

  // ==================== 辅助方法 ====================

  private generateId(): number {
    return Math.max(...this.classrooms.map((c) => c.id), 0) + 1;
  }

  private generateBookingId(): number {
    return Math.max(...this.bookings.map((b) => b.id), 0) + 1;
  }

  private generateMaintenanceId(): number {
    return Math.max(...this.maintenances.map((m) => m.id), 0) + 1;
  }
}
