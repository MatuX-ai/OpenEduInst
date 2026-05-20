/**
 * 教室管理服务
 */

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  Classroom,
  ClassroomFilter,
  ClassroomSchedule,
  ClassroomStatistics,
} from '../models/classroom.models';

interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClassroomService {
  private readonly API_BASE = environment.apiUrl + '/api/v1';
  private readonly CLASSROOM_API = this.API_BASE + '/classrooms';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /**
   * 获取教室列表
   */
  getClassrooms(orgId: number, filters?: ClassroomFilter): Observable<Classroom[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.CLASSROOM_API}/org/${orgId}`;

    if (filters) {
      const params = Object.entries(filters).filter(([_, v]) => v != null);
      if (params.length > 0) {
        url += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
      }
    }

    return this.http.get<ApiResponse<Classroom[]>>(url, { headers }).pipe(
      map((response) => response.data || []),
      timeout(5000),
      catchError((err) => {
        console.warn('获取教室列表失败，返回模拟数据:', err);
        return this.getMockClassrooms(orgId);
      })
    );
  }

  /**
   * 获取教室详情
   */
  getClassroomDetail(orgId: number, classroomId: number): Observable<Classroom> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<Classroom>>(`${this.CLASSROOM_API}/org/${orgId}/${classroomId}`, { headers })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.error('获取教室详情失败:', err);
          throw err;
        })
      );
  }

  /**
   * 创建教室
   */
  createClassroom(orgId: number, classroom: Partial<Classroom>): Observable<Classroom> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<Classroom>>(`${this.CLASSROOM_API}/org/${orgId}`, classroom, { headers })
      .pipe(
        map((response) => response.data),
        timeout(8000),
        catchError((err) => {
          console.error('创建教室失败:', err);
          throw err;
        })
      );
  }

  /**
   * 更新教室信息
   */
  updateClassroom(
    orgId: number,
    classroomId: number,
    classroom: Partial<Classroom>
  ): Observable<Classroom> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<ApiResponse<Classroom>>(`${this.CLASSROOM_API}/org/${orgId}/${classroomId}`, classroom, {
        headers,
      })
      .pipe(
        map((response) => response.data),
        timeout(8000),
        catchError((err) => {
          console.error('更新教室失败:', err);
          throw err;
        })
      );
  }

  /**
   * 删除教室
   */
  deleteClassroom(orgId: number, classroomId: number): Observable<{ success: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<
        ApiResponse<{ success: boolean }>
      >(`${this.CLASSROOM_API}/org/${orgId}/${classroomId}`, { headers })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.error('删除教室失败:', err);
          throw err;
        })
      );
  }

  /**
   * 获取教室统计信息
   */
  getClassroomStatistics(orgId: number): Observable<ClassroomStatistics> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<ClassroomStatistics>>(`${this.CLASSROOM_API}/org/${orgId}/statistics`, {
        headers,
      })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.warn('获取统计信息失败，返回模拟数据:', err);
          return this.getMockStatistics(orgId);
        })
      );
  }

  /**
   * 获取教室课表
   */
  getClassroomSchedule(
    orgId: number,
    classroomId: number,
    date?: string
  ): Observable<ClassroomSchedule[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.CLASSROOM_API}/org/${orgId}/${classroomId}/schedule`;
    if (date) {
      url += `?date=${date}`;
    }

    return this.http.get<ApiResponse<ClassroomSchedule[]>>(url, { headers }).pipe(
      map((response) => response.data || []),
      timeout(5000),
      catchError((err) => {
        console.warn('获取教室课表失败，返回模拟数据:', err);
        return this.getMockSchedule(classroomId);
      })
    );
  }

  /**
   * 分配教室给课程
   */
  assignClassroom(
    orgId: number,
    classroomId: number,
    assignment: {
      course_id: number;
      schedule_id: number;
      start_date: string;
      end_date: string;
    }
  ): Observable<Classroom> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<Classroom>>(`${this.CLASSROOM_API}/org/${orgId}/${classroomId}/assign`, {
        assignment,
        headers,
      })
      .pipe(
        map((response) => response.data),
        timeout(8000),
        catchError((err) => {
          console.error('分配教室失败:', err);
          throw err;
        })
      );
  }

  // ==================== 模拟数据 ====================

  private getMockClassrooms(orgId: number): Observable<Classroom[]> {
    return of(
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        org_id: orgId,
        room_number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 101}`,
        building: ['教学楼 A', '教学楼 B', '实验楼'][i % 3],
        floor: (i % 5) + 1,
        capacity: [30, 40, 50, 60, 80, 100][i % 6],
        room_type: ['regular', 'computer_lab', 'multimedia'][i % 3],
        has_projector: i % 2 === 0,
        has_computer: i % 3 === 0,
        has_audio_system: i % 4 === 0,
        has_whiteboard: true,
        is_available: i % 8 !== 0,
        maintenance_status: i % 8 === 0 ? '维护中' : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 添加 Classroom 接口需要的属性
        name: `教室${i + 1}`,
        isAvailable: i % 8 !== 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    );
  }

  private getMockStatistics(_orgId: number): Observable<ClassroomStatistics> {
    return of({
      total_classrooms: 50,
      available_classrooms: 42,
      occupied_classrooms: 5,
      maintenance_classrooms: 3,
      utilization_rate: 84,
      by_type: {
        regular: 30,
        computer_lab: 10,
        multimedia: 8,
        science_lab: 2,
      },
      by_capacity: [
        { range: '30 人以下', count: 15 },
        { range: '30-50 人', count: 20 },
        { range: '50-80 人', count: 10 },
        { range: '80 人以上', count: 5 },
      ],
    });
  }

  private getMockSchedule(classroomId: number): Observable<ClassroomSchedule[]> {
    return of(
      Array.from({ length: 5 }, (_, i) => ({
        schedule_id: `SCH_${classroomId}_${i + 1}`,
        classroom_id: classroomId,
        course_name: `课程${i + 1}`,
        teacher_name: `教师${i + 1}`,
        day_of_week: i + 1,
        start_time: `${9 + i}:00`,
        end_time: `${10 + i}:00`,
        status: ['scheduled', 'ongoing', 'completed'][i % 3] as ClassroomSchedule['status'],
      }))
    );
  }
}
