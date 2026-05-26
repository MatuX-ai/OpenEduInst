import { HttpClient, HttpParams } from '@angular/common/http';
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

  /**
   * 获取学员列表
   */
  getStudents(orgId: number, page = 1, pageSize = 10, keyword?: string): Observable<ApiResponse<Student[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<Student[]>>(`${this.API_BASE}/students/`, { params });
  }

  /**
   * 获取学员详情
   */
  getStudent(id: number): Observable<ApiResponse<Student>> {
    return this.http.get<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`);
  }

  /**
   * 创建学员
   */
  createStudent(orgId: number, studentData: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.http.post<ApiResponse<Student>>(`${this.API_BASE}/students/?org_id=${orgId}`, studentData);
  }

  /**
   * 更新学员信息
   */
  updateStudent(id: number, studentData: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`, studentData);
  }

  /**
   * 删除学员
   */
  deleteStudent(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_BASE}/students/${id}`);
  }

  /**
   * 创建报名记录
   */
  createEnrollment(enrollmentData: Partial<Enrollment>): Observable<ApiResponse<Enrollment>> {
    return this.http.post<ApiResponse<Enrollment>>(`${this.API_BASE}/students/enrollments`, enrollmentData);
  }

  /**
   * 创建出勤记录
   */
  createAttendance(attendanceData: Partial<AttendanceRecord>): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.API_BASE}/students/attendance`, attendanceData);
  }

  /**
   * 获取学员统计摘要
   */
  getStatsSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_BASE}/students/stats/summary`);
  }
}
