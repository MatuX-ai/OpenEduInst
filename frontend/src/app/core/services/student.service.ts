import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, AttendanceRecord, Enrollment, Student } from '../../models/education-management.models';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly API_BASE = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /**
   * 获取学员列表
   */
  getStudents(orgId: number, page = 1, pageSize = 10, keyword?: string): Observable<ApiResponse<Student[]>> {
    let params = new HttpParams()
      .set('org_id', orgId.toString())
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<Student[]>>(`${this.API_BASE}/students/`, { headers: this.getAuthHeaders(), params });
  }

  /**
   * 获取学员详情
   */
  getStudent(id: number): Observable<ApiResponse<Student>> {
    return this.http.get<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * 创建学员
   */
  createStudent(orgId: number, studentData: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.http.post<ApiResponse<Student>>(`${this.API_BASE}/students/?org_id=${orgId}`, studentData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * 更新学员信息
   */
  updateStudent(id: number, studentData: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`, studentData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * 删除学员
   */
  deleteStudent(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_BASE}/students/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * 创建报名记录
   */
  createEnrollment(enrollmentData: Partial<Enrollment>): Observable<ApiResponse<Enrollment>> {
    return this.http.post<ApiResponse<Enrollment>>(`${this.API_BASE}/students/enrollments`, enrollmentData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * 创建出勤记录
   */
  createAttendance(attendanceData: Partial<AttendanceRecord>): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.API_BASE}/students/attendance`, attendanceData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * 获取学员统计摘要
   */
  getStatsSummary(orgId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_BASE}/students/stats/summary?org_id=${orgId}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
