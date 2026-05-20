/**
 * 排课管理服务
 *
 * @fileoverview 提供排课管理的 API 接口封装，包含冲突检测和智能推荐算法
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  generateRealisticClassrooms,
  generateRealisticCourses,
  generateRealisticSchedules,
} from '../mock-data-enhancements';
import {
  AttendanceRecord,
  Classroom,
  ClassroomUsageStats,
  ConflictInfo,
  Course,
  CreateScheduleRequest,
  Schedule,
  ScheduleAdjustment,
  ScheduleAdjustRequest,
  ScheduleDetail,
  ScheduleFilter,
  ScheduleListResponse,
  ScheduleStats,
  TeacherHoursStats,
  TimeSlot,
  UpdateScheduleRequest,
} from '../models/schedule.models';

/**
 * Mock 教室数据 - 基于真实校园场景生成
 */
const MOCK_CLASSROOMS: Classroom[] = generateRealisticClassrooms(12) as Classroom[];

/**
 * Mock 课程数据 - 基于项目课程体系生成
 */
const MOCK_COURSES: Course[] = generateRealisticCourses(15) as Course[];

/**
 * Mock 排课数据 - 基于教室和课程动态生成
 */
const MOCK_SCHEDULES: Schedule[] = generateRealisticSchedules(
  MOCK_CLASSROOMS.length,
  MOCK_COURSES.length,
  12, // 教师数量
  30 // 排课记录数
) as Schedule[];

@Injectable({
  providedIn: 'root',
})
export class ScheduleManagementService {
  // TODO: 替换为真实的 API 基础 URL
  private readonly baseUrl = '/api/schedules';

  constructor() {}

  /**
   * 获取排课列表（带筛选）
   * @param filter 筛选条件
   */
  getScheduleList(filter?: ScheduleFilter): Observable<ScheduleListResponse> {
    // TODO: 连接到真实 API
    // return this.http.get<ScheduleListResponse>(this.baseUrl, { params: filter });

    // 直接返回缓存的 Mock 数据，无延迟
    return of({
      data: MOCK_SCHEDULES,
      total: MOCK_SCHEDULES.length,
      page: 1,
      pageSize: 50,
    });
  }

  /**
   * 获取排课详情
   * @param scheduleId 排课 ID
   */
  getScheduleDetail(scheduleId: number): Observable<ScheduleDetail> {
    // TODO: 连接到真实 API
    // return this.http.get<ScheduleDetail>(`${this.baseUrl}/${scheduleId}`);

    // Mock 实现
    const schedule = MOCK_SCHEDULES.find((s) => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`排课 ${scheduleId} 不存在`);
    }

    const detail: ScheduleDetail = {
      ...schedule,
      course: MOCK_COURSES.find((c) => c.id === schedule.courseId),
      classroom: MOCK_CLASSROOMS.find((c) => c.id === schedule.classroomId),
      students: this.getMockStudents(schedule.studentIds),
      adjustmentHistory: this.getMockAdjustmentHistory(scheduleId),
      attendanceRecords: this.getMockAttendanceRecords(scheduleId),
    };

    return of(detail).pipe(delay(50));
  }

  /**
   * 创建排课记录
   * @param request 创建请求
   */
  createSchedule(request: CreateScheduleRequest): Observable<Schedule> {
    // TODO: 连接到真实 API
    // return this.http.post<Schedule>(this.baseUrl, request);

    // Mock 实现
    const conflict = this.checkConflict(request);
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    const newSchedule: Schedule = {
      id: MOCK_SCHEDULES.length + 1,
      ...request,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_SCHEDULES.push(newSchedule);

    return of(newSchedule).pipe(delay(50));
  }

  /**
   * 更新排课记录
   * @param scheduleId 排课 ID
   * @param request 更新请求
   */
  updateSchedule(scheduleId: number, request: UpdateScheduleRequest): Observable<Schedule> {
    // TODO: 连接到真实 API
    // return this.http.put<Schedule>(`${this.baseUrl}/${scheduleId}`, request);

    // Mock 实现
    const index = MOCK_SCHEDULES.findIndex((s) => s.id === scheduleId);
    if (index === -1) {
      throw new Error(`排课 ${scheduleId} 不存在`);
    }

    // 如果是调课，检查冲突
    if (request.dayOfWeek ?? request.startTime ?? request.endTime ?? request.classroomId) {
      const conflict = this.checkConflict({
        ...MOCK_SCHEDULES[index],
        ...request,
      } as CreateScheduleRequest);

      if (conflict.hasConflict) {
        throw new Error(conflict.message);
      }
    }

    const updatedSchedule: Schedule = {
      ...MOCK_SCHEDULES[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    MOCK_SCHEDULES[index] = updatedSchedule;

    return of(updatedSchedule).pipe(delay(50));
  }

  /**
   * 删除排课记录（软删除）
   * @param scheduleId 排课 ID
   */
  deleteSchedule(scheduleId: number): Observable<void> {
    // TODO: 连接到真实 API
    // return this.http.delete<void>(`${this.baseUrl}/${scheduleId}`);

    // Mock 实现
    const index = MOCK_SCHEDULES.findIndex((s) => s.id === scheduleId);
    if (index === -1) {
      throw new Error(`排课 ${scheduleId} 不存在`);
    }

    // 软删除：将状态设置为 cancelled
    MOCK_SCHEDULES[index].status = 'cancelled';
    MOCK_SCHEDULES[index].updatedAt = new Date().toISOString();

    return of(undefined).pipe(delay(50));
  }

  /**
   * 申请调课
   * @param request 调课申请
   */
  adjustSchedule(request: ScheduleAdjustRequest): Observable<ScheduleAdjustment> {
    // TODO: 连接到真实 API
    // return this.http.post<ScheduleAdjustment>(`${this.baseUrl}/adjust`, request);

    // Mock 实现
    const adjustment: ScheduleAdjustment = {
      id: 1,
      scheduleId: request.scheduleId,
      newScheduleId: MOCK_SCHEDULES.length + 1,
      reason: request.reason,
      applicant: request.applicant,
      approvalStatus: 'pending',
      applyTime: new Date().toISOString(),
    };

    return of(adjustment).pipe(delay(50));
  }

  /**
   * 检测冲突
   * @param request 排课请求
   */
  checkConflict(request: CreateScheduleRequest | Schedule): ConflictInfo {
    // 检测教师冲突
    const teacherConflict = MOCK_SCHEDULES.filter(
      (s) =>
        s.teacherId === request.teacherId &&
        s.dayOfWeek === request.dayOfWeek &&
        this.isTimeOverlap(s.startTime, s.endTime, request.startTime, request.endTime) &&
        s.id !== (request as Schedule).id
    );

    if (teacherConflict.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'teacher',
        conflictingSchedules: teacherConflict,
        message: `教师"${request.teacherName}"在该时间段已有课程安排`,
        suggestion: '请选择其他时间段或更换教师',
      };
    }

    // 检测教室冲突
    if (request.classroomId) {
      const classroomConflict = MOCK_SCHEDULES.filter(
        (s) =>
          s.classroomId === request.classroomId &&
          s.dayOfWeek === request.dayOfWeek &&
          this.isTimeOverlap(s.startTime, s.endTime, request.startTime, request.endTime) &&
          s.id !== (request as Schedule).id
      );

      if (classroomConflict.length > 0) {
        return {
          hasConflict: true,
          conflictType: 'classroom',
          conflictingSchedules: classroomConflict,
          message: `教室"${request.classroomId}"在该时间段已被占用`,
          suggestion: '请选择其他教室或时间段',
        };
      }
    }

    return {
      hasConflict: false,
      conflictingSchedules: [],
      message: '无冲突',
    };
  }

  /**
   * 获取统计数据
   */
  getScheduleStats(): Observable<ScheduleStats> {
    // TODO: 连接到真实 API
    // return this.http.get<ScheduleStats>(`${this.baseUrl}/stats`);

    // Mock 实现
    const total = MOCK_SCHEDULES.length;
    const thisWeek = MOCK_SCHEDULES.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 7).length;
    const completed = MOCK_SCHEDULES.filter((s) => s.status === 'scheduled').length;
    const cancelled = MOCK_SCHEDULES.filter((s) => s.status === 'cancelled').length;

    const availableClassrooms = MOCK_CLASSROOMS.filter((c) => c.isAvailable).length;

    return of({
      totalSchedules: total,
      thisWeekSchedules: thisWeek,
      completedCount: completed,
      cancelledCount: cancelled,
      averageClassroomUsageRate: 75.5,
      averageTeacherHours: 18.5,
      availableClassroomsCount: availableClassrooms,
    }).pipe(delay(50));
  }

  /**
   * 获取教室使用率统计
   */
  getClassroomUsageStats(): Observable<ClassroomUsageStats[]> {
    // TODO: 连接到真实 API
    // return this.http.get<ClassroomUsageStats[]>(`${this.baseUrl}/classroom-usage`);

    // Mock 实现
    const stats: ClassroomUsageStats[] = MOCK_CLASSROOMS.map((classroom) => ({
      classroomId: classroom.id,
      classroomName: classroom.name,
      totalHours: 20,
      usageRate: 65.5,
      freeSlots: this.getMockFreeSlots(classroom.id),
    }));

    return of(stats).pipe(delay(50));
  }

  /**
   * 获取教师课时统计
   */
  getTeacherHoursStats(): Observable<TeacherHoursStats[]> {
    // TODO: 连接到真实 API
    // return this.http.get<TeacherHoursStats[]>(`${this.baseUrl}/teacher-hours`);

    // Mock 实现
    const teachers = new Map<
      number,
      {
        name: string;
        hours: number;
        courses: Array<{ courseId: number; courseName: string; hours: number }>;
      }
    >();

    MOCK_SCHEDULES.forEach((schedule) => {
      if (!teachers.has(schedule.teacherId)) {
        teachers.set(schedule.teacherId, {
          name: schedule.teacherName,
          hours: 0,
          courses: [],
        });
      }

      const teacher = teachers.get(schedule.teacherId);
      if (!teacher) return;
      const course = MOCK_COURSES.find((c) => c.id === schedule.courseId);
      if (course) {
        teacher.hours += course.duration / 60;
        teacher.courses.push({
          courseId: course.id,
          courseName: course.name,
          hours: course.duration / 60,
        });
      }
    });

    const stats: TeacherHoursStats[] = Array.from(teachers.entries()).map(([id, data]) => ({
      teacherId: id,
      teacherName: data.name,
      totalHours: data.hours,
      thisWeekHours: data.hours / 4,
      courses: data.courses,
    }));

    return of(stats).pipe(delay(50));
  }

  /**
   * 推荐时间段
   * @param teacherId 教师 ID
   * @param duration 课程时长（分钟）
   */
  recommendTimeSlots(teacherId: number, duration: number): Observable<TimeSlot[]> {
    // TODO: 连接到真实 API
    // return this.http.get<TimeSlot[]>(`${this.baseUrl}/recommend?teacherId=${teacherId}&duration=${duration}`);

    // Mock 实现
    const slots: TimeSlot[] = [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: this.addMinutes('09:00', duration),
        score: 95,
      },
      {
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: this.addMinutes('14:00', duration),
        score: 90,
      },
      {
        dayOfWeek: 5,
        startTime: '10:00',
        endTime: this.addMinutes('10:00', duration),
        score: 85,
      },
    ];

    return of(slots).pipe(delay(50));
  }

  /**
   * 导出 Excel
   * @param schedules 排课列表
   */
  exportToExcel(_schedules: Schedule[]): Observable<void> {
    // TODO: 实现 Excel 导出功能
    return of(undefined).pipe(delay(50));
  }

  /**
   * 判断时间是否重叠
   */
  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  /**
   * 时间字符串转换为分钟数
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 分钟数转换为时间字符串
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 添加分钟数到时间
   */
  private addMinutes(time: string, minutes: number): string {
    const currentMinutes = this.timeToMinutes(time);
    const newMinutes = currentMinutes + minutes;
    return this.minutesToTime(newMinutes);
  }

  /**
   * 获取 Mock 学生列表
   */
  private getMockStudents(
    studentIds: number[]
  ): Array<{ id: number; name: string; email: string }> {
    return studentIds.map((id) => ({
      id,
      name: `学生${id}`,
      email: `student${id}@example.com`,
    }));
  }

  /**
   * 获取 Mock 调课历史
   */
  private getMockAdjustmentHistory(scheduleId: number): ScheduleAdjustment[] {
    return [
      {
        id: 1,
        scheduleId,
        newScheduleId: scheduleId + 1,
        reason: '教师临时有事',
        applicant: '张老师',
        approvalStatus: 'approved' as const,
        applyTime: '2026-03-15T10:00:00Z',
        approveTime: '2026-03-15T11:00:00Z',
      },
    ];
  }

  /**
   * 获取 Mock 出勤记录
   */
  private getMockAttendanceRecords(scheduleId: number): AttendanceRecord[] {
    return [
      {
        id: 1,
        scheduleId,
        studentId: 1,
        studentName: '学生 1',
        classDate: '2026-04-01',
        status: 'present' as const,
        recordedAt: '2026-04-01T09:00:00Z',
      },
    ];
  }

  /**
   * 获取 Mock 空闲时段
   */
  private getMockFreeSlots(classroomId: number): TimeSlot[] {
    return [
      {
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
        classroomId,
      },
      {
        dayOfWeek: 4,
        startTime: '14:00',
        endTime: '16:00',
        classroomId,
      },
    ];
  }
}
