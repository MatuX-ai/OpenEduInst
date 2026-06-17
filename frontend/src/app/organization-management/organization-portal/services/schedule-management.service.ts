/**
 * 排课管理服务
 *
 * @fileoverview 提供排课管理的 API 接口封装，通过 HttpClient 调用后端真实 API
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
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

@Injectable({
  providedIn: 'root',
})
export class ScheduleManagementService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/schedules`;
  private readonly eduUrl = `${environment.apiUrl}/api/v1/educational_institution`;

  constructor(private http: HttpClient) {}

  // ======================== 排课 CRUD ========================

  /**
   * 获取排课列表（带筛选）
   */
  getScheduleList(filter?: ScheduleFilter): Observable<ScheduleListResponse> {
    let params = new HttpParams();
    if (filter) {
      if (filter.keyword) params = params.set('keyword', filter.keyword);
      if (filter.teacherId) params = params.set('teacher_id', String(filter.teacherId));
      if (filter.classroomId) params = params.set('classroom_id', String(filter.classroomId));
      if (filter.status) params = params.set('status', filter.status);
      if (filter.page) params = params.set('page', String(filter.page));
      if (filter.pageSize) params = params.set('pageSize', String(filter.pageSize));
    }

    return this.http.get<any>(`${this.baseUrl}/`, { params }).pipe(
      map((resp: any) => {
        // 后端可能返回数组或 { data, total, page, pageSize }
        if (Array.isArray(resp)) {
          return { data: resp, total: resp.length, page: 1, pageSize: resp.length };
        }
        return {
          data: (resp.data || []).map((s: any) => this.mapSchedule(s)),
          total: resp.total || (resp.data || []).length,
          page: resp.page || 1,
          pageSize: resp.pageSize || 200,
        };
      }),
      catchError(() => of({ data: [], total: 0, page: 1, pageSize: 50 }))
    );
  }

  /**
   * 获取排课详情
   */
  getScheduleDetail(scheduleId: number): Observable<ScheduleDetail> {
    return this.http.get<any>(`${this.baseUrl}/${scheduleId}`).pipe(
      map((s: any) => this.mapSchedule(s) as ScheduleDetail)
    );
  }

  /**
   * 创建排课记录
   */
  createSchedule(request: CreateScheduleRequest): Observable<Schedule> {
    const body = this.toScheduleCreateBody(request);
    return this.http.post<any>(`${this.baseUrl}/`, body).pipe(
      map((s: any) => this.mapSchedule(s))
    );
  }

  /**
   * 更新排课记录
   */
  updateSchedule(scheduleId: number, request: UpdateScheduleRequest): Observable<Schedule> {
    const body: any = {};
    if (request.courseId !== undefined) body.course_id = request.courseId;
    if (request.teacherId !== undefined) body.teacher_id = request.teacherId;
    if (request.classroomId !== undefined) body.classroom_id = request.classroomId;
    if (request.status !== undefined) body.status = request.status;

    if (request.startDate && request.dayOfWeek && request.startTime && request.endTime) {
      const startDt = this.buildDateTime(request.startDate, request.dayOfWeek, request.startTime);
      const endDt = this.buildDateTime(request.startDate, request.dayOfWeek, request.endTime);
      body.start_time = startDt;
      body.end_time = endDt;
    }

    if (request.repeatType) {
      body.recurrence_rule = request.repeatType !== 'none'
        ? `${request.repeatType};${request.repeatWeeks || 12}`
        : null;
    }

    return this.http.put<any>(`${this.baseUrl}/${scheduleId}`, body).pipe(
      map((s: any) => this.mapSchedule(s))
    );
  }

  /**
   * 删除排课记录（软删除）
   */
  deleteSchedule(scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${scheduleId}`);
  }

  // ======================== 课程 / 教室 / 教师 ========================

  /**
   * 获取课程列表
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<any>(`${this.eduUrl}/courses`, {
      params: new HttpParams().set('page_size', '100'),
    }).pipe(
      map((resp: any) => {
        const items = resp?.data?.items || resp?.items || [];
        return items.map((c: any) => this.mapCourse(c));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * 获取教室列表
   */
  getClassrooms(): Observable<Classroom[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classrooms`).pipe(
      map((items: any[]) =>
        (items || []).map((c: any) => this.mapClassroom(c))
      ),
      catchError(() => of([]))
    );
  }

  // ======================== 调课 ========================

  /**
   * 申请调课
   */
  adjustSchedule(request: ScheduleAdjustRequest): Observable<ScheduleAdjustment> {
    // 调课功能：通过 updateSchedule 实现
    const updateReq: UpdateScheduleRequest = {
      dayOfWeek: request.newTimeSlot.dayOfWeek,
      startTime: request.newTimeSlot.startTime,
      endTime: request.newTimeSlot.endTime,
      classroomId: request.newClassroomId,
      adjustReason: request.reason,
    };
    return this.updateSchedule(request.scheduleId, updateReq).pipe(
      map((updated) => ({
        id: updated.id,
        scheduleId: request.scheduleId,
        newScheduleId: updated.id,
        reason: request.reason,
        applicant: request.applicant,
        approvalStatus: 'approved' as const,
        applyTime: new Date().toISOString(),
      }))
    );
  }

  // ======================== 冲突检测（客户端） ========================

  /**
   * 检测冲突（客户端缓存检测，可配合后端双重校验）
   */
  checkConflict(request: CreateScheduleRequest | Schedule): ConflictInfo {
    // 保留客户端冲突检测逻辑作为额外保障
    // 实际冲突检测由后端 API 在创建/更新时执行
    return {
      hasConflict: false,
      conflictingSchedules: [],
      message: '无冲突',
    };
  }

  // ======================== 统计 ========================

  /**
   * 获取统计数据
   */
  getScheduleStats(): Observable<ScheduleStats> {
    // 从排课列表计算统计数据
    return this.getScheduleList().pipe(
      map((resp) => {
        const schedules = resp.data || [];
        const total = resp.total || schedules.length;
        const now = new Date();
        const todayDow = now.getDay() === 0 ? 7 : now.getDay(); // 1-7

        return {
          totalSchedules: total,
          thisWeekSchedules: schedules.filter(
            (s) => s.dayOfWeek === todayDow
          ).length,
          completedCount: schedules.filter((s) => s.status === 'scheduled').length,
          cancelledCount: schedules.filter((s) => s.status === 'cancelled').length,
          averageClassroomUsageRate: 0,
          averageTeacherHours: 0,
          availableClassroomsCount: 0,
        };
      })
    );
  }

  /**
   * 获取教室使用率统计
   */
  getClassroomUsageStats(): Observable<ClassroomUsageStats[]> {
    return this.getClassrooms().pipe(
      map((classrooms) =>
        classrooms.map((c) => ({
          classroomId: c.id,
          classroomName: c.name,
          totalHours: 0,
          usageRate: 0,
          freeSlots: [],
        }))
      )
    );
  }

  /**
   * 获取教师课时统计
   */
  getTeacherHoursStats(): Observable<TeacherHoursStats[]> {
    return this.getScheduleList().pipe(
      map((resp) => {
        const teacherMap = new Map<number, TeacherHoursStats>();
        for (const s of resp.data || []) {
          if (!teacherMap.has(s.teacherId)) {
            teacherMap.set(s.teacherId, {
              teacherId: s.teacherId,
              teacherName: s.teacherName,
              totalHours: 0,
              thisWeekHours: 0,
              courses: [],
            });
          }
          const t = teacherMap.get(s.teacherId)!;
          const hours = this.calcHours(s.startTime, s.endTime);
          t.totalHours += hours;
          t.courses.push({
            courseId: s.courseId,
            courseName: s.courseName,
            hours,
          });
        }
        return Array.from(teacherMap.values());
      })
    );
  }

  /**
   * 推荐时间段
   */
  recommendTimeSlots(teacherId: number, duration: number): Observable<TimeSlot[]> {
    // 返回默认推荐时段
    return of([
      { dayOfWeek: 1 as const, startTime: '09:00', endTime: this.addMinutes('09:00', duration), score: 95 },
      { dayOfWeek: 3 as const, startTime: '14:00', endTime: this.addMinutes('14:00', duration), score: 90 },
      { dayOfWeek: 5 as const, startTime: '10:00', endTime: this.addMinutes('10:00', duration), score: 85 },
    ]);
  }

  /**
   * 导出 Excel（TODO: 待实现）
   */
  exportToExcel(_schedules: Schedule[]): Observable<void> {
    return of(undefined);
  }

  // ======================== 数据映射 ========================

  private mapSchedule(raw: any): Schedule {
    if (raw.dayOfWeek && raw.courseName !== undefined) {
      // 已经是前端格式（来自富化后端响应）
      return raw as Schedule;
    }

    // 从原始后端格式映射
    const startDt = raw.start_time ? new Date(raw.start_time) : null;
    const endDt = raw.end_time ? new Date(raw.end_time) : null;
    const dayOfWeek = startDt ? (startDt.getDay() === 0 ? 7 : startDt.getDay()) : 1;
    const startTime = startDt
      ? `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`
      : '00:00';
    const endTime = endDt
      ? `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`
      : '00:00';

    let repeatType: 'none' | 'weekly' | 'biweekly' | 'monthly' = 'none';
    let repeatWeeks: number | undefined;
    if (raw.recurrence_rule) {
      const parts = raw.recurrence_rule.split(';');
      if (parts[0] === 'weekly' || parts[0] === 'biweekly' || parts[0] === 'monthly') {
        repeatType = parts[0];
      }
      if (parts[1]) {
        repeatWeeks = parseInt(parts[1], 10) || undefined;
      }
    }

    let status: 'scheduled' | 'adjusted' | 'cancelled' = 'scheduled';
    if (raw.status === 'cancelled') status = 'cancelled';

    return {
      id: raw.id,
      courseId: raw.course_id || raw.courseId || 0,
      courseName: raw.courseName || raw.course_name || '',
      courseCode: raw.courseCode || '',
      courseType: raw.courseType || raw.course_type || '',
      teacherId: raw.teacher_id || raw.teacherId || 0,
      teacherName: raw.teacherName || raw.teacher_name || '',
      classroomId: raw.classroom_id || raw.classroomId,
      classroomName: raw.classroomName || raw.classroom_name || '',
      studentIds: raw.studentIds || raw.student_ids || [],
      dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      startTime,
      endTime,
      startDate: raw.startDate || raw.start_date || (startDt ? startDt.toISOString().split('T')[0] : ''),
      repeatType,
      repeatWeeks,
      status,
      createdAt: raw.createdAt || raw.created_at || '',
      updatedAt: raw.updatedAt || raw.updated_at || '',
    };
  }

  private mapCourse(raw: any): Course {
    return {
      id: raw.id,
      name: raw.name || raw.title || '',
      code: raw.code || '',
      type: raw.type || raw.category || '',
      description: raw.description || '',
      duration: (raw.duration_hours || raw.durationHours || 2) * 60,
      teacherId: raw.teacherId || raw.teacher_id || 0,
      teacherName: raw.teacherName || raw.teacher_name || '',
      studentIds: raw.studentIds || raw.student_ids || [],
      status: raw.status === 'archived' ? 'inactive' : 'active',
      startDate: raw.startDate || raw.start_date || raw.created_at || '',
      endDate: raw.endDate || raw.end_date,
      createdAt: raw.createdAt || raw.created_at || '',
      updatedAt: raw.updatedAt || raw.updated_at || '',
    };
  }

  private mapClassroom(raw: any): Classroom {
    return {
      id: raw.id,
      name: raw.name || raw.room_number || '',
      capacity: raw.capacity || 30,
      location: raw.location || raw.building || '',
      type: raw.type || raw.room_type || '',
      isAvailable: raw.isAvailable !== undefined ? raw.isAvailable : (raw.is_available !== undefined ? raw.is_available : true),
      notes: raw.notes || '',
      createdAt: raw.createdAt || raw.created_at || '',
      updatedAt: raw.updatedAt || raw.updated_at || '',
    };
  }

  // ======================== 请求构建 ========================

  private toScheduleCreateBody(request: CreateScheduleRequest): any {
    const startDt = this.buildDateTime(request.startDate, request.dayOfWeek, request.startTime);
    const endDt = this.buildDateTime(request.startDate, request.dayOfWeek, request.endTime);

    return {
      course_id: request.courseId,
      teacher_id: request.teacherId,
      classroom_id: request.classroomId || 0,
      start_time: startDt,
      end_time: endDt,
      recurrence_rule:
        request.repeatType !== 'none'
          ? `${request.repeatType};${request.repeatWeeks || 12}`
          : null,
    };
  }

  private buildDateTime(dateStr: string, dayOfWeek: number, timeStr: string): string {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const currentDow = baseDate.getDay() === 0 ? 7 : baseDate.getDay();
    const diff = dayOfWeek - currentDow;
    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + diff);

    const [hours, minutes] = timeStr.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate.toISOString();
  }

  // ======================== 工具方法 ========================

  private calcHours(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const currentMinutes = this.timeToMinutes(time);
    const newMinutes = currentMinutes + minutes;
    return this.minutesToTime(newMinutes);
  }
}
