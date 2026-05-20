/**
 * 学员管理服务
 *
 * @fileoverview 提供学员管理的 API 接口封装
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { generateRealisticStudents, GRADE_LEVELS } from '../mock-data-enhancements';
import {
  CreateStudentRequest,
  Grade,
  Student,
  StudentDetail,
  StudentFilter,
  StudentListResponse,
  StudentStats,
  UpdateStudentRequest,
} from '../models/student.models';

/**
 * Mock 学员数据 - 基于项目教育场景生成
 */
const MOCK_STUDENTS: Student[] = generateRealisticStudents(25) as Student[];

/**
 * Mock 年级数据 - 符合 K12 教育体系
 */
const MOCK_GRADES: Grade[] = Object.entries(GRADE_LEVELS).map(([_key, name], index) => ({
  id: index + 1,
  name,
  studentCount: Math.floor(Math.random() * 10) + 20, // 20-30 人/班
}));

@Injectable({
  providedIn: 'root',
})
export class StudentManagementService {
  // TODO: 替换为真实的 API 基础 URL
  private readonly baseUrl = '/api/students';

  constructor() {}

  /**
   * 获取学员列表（带筛选）
   * @param filter 筛选条件
   */
  getStudentList(filter?: StudentFilter): Observable<StudentListResponse> {
    // TODO: 连接到真实 API
    // return this.http.get<StudentListResponse>(this.baseUrl, { params: filter });

    // Mock 实现
    let filteredData = [...MOCK_STUDENTS];

    // 应用筛选
    if (filter) {
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        filteredData = filteredData.filter(
          (t) => t.name.toLowerCase().includes(keyword) || t.email.toLowerCase().includes(keyword)
        );
      }

      if (filter.grade) {
        filteredData = filteredData.filter((t) => t.grade === filter.grade);
      }

      if (filter.status) {
        filteredData = filteredData.filter((t) => t.status === filter.status);
      }
    }

    const total = filteredData.length;
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;

    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = filteredData.slice(startIndex, endIndex);

    return of({
      data,
      total,
      page,
      pageSize,
    }).pipe(delay(500));
  }

  /**
   * 获取学员详情
   * @param studentId 学员 ID
   */
  getStudentDetail(studentId: number): Observable<StudentDetail> {
    // TODO: 连接到真实 API
    // return this.http.get<StudentDetail>(`${this.baseUrl}/${studentId}`);

    // Mock 实现
    const student = MOCK_STUDENTS.find((t) => t.id === studentId);
    if (!student) {
      throw new Error(`学员 ${studentId} 不存在`);
    }

    const detail: StudentDetail = {
      ...student,
      learningPortfolio: this.getMockLearningRecords(studentId),
      grades: this.getMockGrades(studentId),
      attendanceRecords: this.getMockAttendanceRecords(studentId),
      paymentRecords: this.getMockPaymentRecords(studentId),
      courses: this.getMockCourses(studentId),
      notes: '该学员表现良好，学习认真。',
    };

    return of(detail).pipe(delay(300));
  }

  /**
   * 创建学员
   * @param request 创建请求
   */
  createStudent(request: CreateStudentRequest): Observable<Student> {
    // TODO: 连接到真实 API
    // return this.http.post<Student>(this.baseUrl, request);

    // Mock 实现
    const newStudent: Student = {
      id: MOCK_STUDENTS.length + 1,
      ...request,
      enrolledCourses: 0,
      progress: 0,
      attendanceRate: 0,
      status: 'active',
      totalPayment: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_STUDENTS.push(newStudent);

    return of(newStudent).pipe(delay(500));
  }

  /**
   * 更新学员信息
   * @param studentId 学员 ID
   * @param request 更新请求
   */
  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<Student> {
    // TODO: 连接到真实 API
    // return this.http.put<Student>(`${this.baseUrl}/${studentId}`, request);

    // Mock 实现
    const index = MOCK_STUDENTS.findIndex((t) => t.id === studentId);
    if (index === -1) {
      throw new Error(`学员 ${studentId} 不存在`);
    }

    const updatedStudent: Student = {
      ...MOCK_STUDENTS[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    MOCK_STUDENTS[index] = updatedStudent;

    return of(updatedStudent).pipe(delay(500));
  }

  /**
   * 删除学员（软删除）
   * @param studentId 学员 ID
   */
  deleteStudent(studentId: number): Observable<void> {
    // TODO: 连接到真实 API
    // return this.http.delete<void>(`${this.baseUrl}/${studentId}`);

    // Mock 实现
    const index = MOCK_STUDENTS.findIndex((t) => t.id === studentId);
    if (index === -1) {
      throw new Error(`学员 ${studentId} 不存在`);
    }

    // 软删除：将状态设置为 inactive
    MOCK_STUDENTS[index].status = 'inactive';
    MOCK_STUDENTS[index].updatedAt = new Date().toISOString();

    return of(undefined).pipe(delay(300));
  }

  /**
   * 批量更新学员状态
   * @param studentIds 学员 ID 列表
   * @param status 新状态
   */
  batchUpdateStatus(
    studentIds: number[],
    status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'transferred'
  ): Observable<void> {
    // TODO: 连接到真实 API
    // return this.http.patch<void>(`${this.baseUrl}/batch/status`, { studentIds, status });

    // Mock 实现
    studentIds.forEach((id) => {
      const index = MOCK_STUDENTS.findIndex((t) => t.id === id);
      if (index !== -1) {
        MOCK_STUDENTS[index].status = status;
        MOCK_STUDENTS[index].updatedAt = new Date().toISOString();
      }
    });

    return of(undefined).pipe(delay(500));
  }

  /**
   * 获取统计数据
   */
  getStudentStats(): Observable<StudentStats> {
    // TODO: 连接到真实 API
    // return this.http.get<StudentStats>(`${this.baseUrl}/stats`);

    // Mock 实现
    const total = MOCK_STUDENTS.length;
    const active = MOCK_STUDENTS.filter((t) => t.status === 'active').length;
    const graduated = MOCK_STUDENTS.filter((t) => t.status === 'graduated').length;

    const avgProgress = MOCK_STUDENTS.reduce((sum, t) => sum + t.progress, 0) / total;
    const avgAttendance =
      MOCK_STUDENTS.reduce((sum, t) => sum + (t.attendanceRate ?? 0), 0) / total;
    const totalCourses = MOCK_STUDENTS.reduce((sum, t) => sum + t.enrolledCourses, 0);
    const totalPayment = MOCK_STUDENTS.reduce((sum, t) => sum + (t.totalPayment ?? 0), 0);

    return of({
      totalStudents: total,
      activeStudents: active,
      graduatedStudents: graduated,
      averageProgress: parseFloat(avgProgress.toFixed(1)),
      averageAttendanceRate: parseFloat(avgAttendance.toFixed(1)),
      totalEnrolledCourses: totalCourses,
      totalPayment,
    }).pipe(delay(300));
  }

  /**
   * 获取年级列表
   */
  getGrades(): Observable<Grade[]> {
    // TODO: 连接到真实 API
    // return this.http.get<Grade[]>(`${this.baseUrl}/grades`);

    // Mock 实现
    return of(MOCK_GRADES).pipe(delay(300));
  }

  /**
   * 导出学员数据到 Excel
   * @param students 学员列表
   */
  exportToExcel(_students: Student[]): Observable<void> {
    // TODO: 实现 Excel 导出功能
    return of(undefined).pipe(delay(500));
  }

  /**
   * 从 Excel 导入学员数据
   * @param file Excel 文件
   */
  importFromExcel(_file: File): Observable<{ success: number; failed: number }> {
    // TODO: 实现 Excel 导入功能
    return of({ success: 0, failed: 0 }).pipe(delay(1000));
  }

  /**
   * 获取 Mock 学习记录
   */
  private getMockLearningRecords(_studentId: number): Array<{
    id: number;
    courseName: string;
    content: string;
    completion: number;
    recordedAt: string;
    teacherComment: string;
  }> {
    return [
      {
        id: 1,
        courseName: 'STEM机器人编程',
        content: '完成了Arduino基础电路搭建与传感器应用',
        completion: 80,
        recordedAt: '2026-03-15T10:00:00Z',
        teacherComment: '动手能力强，逻辑思维清晰。',
      },
      {
        id: 2,
        courseName: '3D打印设计',
        content: '学习了Fusion 360建模基础',
        completion: 65,
        recordedAt: '2026-03-20T14:00:00Z',
        teacherComment: '空间想象力优秀，继续保持。',
      },
    ];
  }

  /**
   * 获取 Mock 成绩记录
   */
  private getMockGrades(_studentId: number): Array<{
    id: number;
    examName: string;
    score: number;
    totalScore: number;
    percentage: number;
    examDate: string;
    comment: string;
  }> {
    return [
      {
        id: 1,
        examName: 'STEM项目评估',
        score: 92,
        totalScore: 100,
        percentage: 92,
        examDate: '2026-03-20T09:00:00Z',
        comment: '项目完成度高，创新思维突出！',
      },
      {
        id: 2,
        examName: '编程能力测试',
        score: 88,
        totalScore: 100,
        percentage: 88,
        examDate: '2026-03-25T10:00:00Z',
        comment: '代码规范良好，算法思路清晰。',
      },
    ];
  }

  /**
   * 获取 Mock 出勤记录
   */
  private getMockAttendanceRecords(_studentId: number): Array<{
    id: number;
    courseName: string;
    classTime: string;
    status: 'present' | 'absent' | 'late';
  }> {
    return [
      {
        id: 1,
        courseName: 'STEM机器人编程',
        classTime: '2026-04-01T09:00:00Z',
        status: 'present',
      },
      {
        id: 2,
        courseName: '3D打印设计',
        classTime: '2026-04-02T14:00:00Z',
        status: 'present',
      },
    ];
  }

  /**
   * 获取 Mock 缴费记录
   */
  private getMockPaymentRecords(_studentId: number): Array<{
    id: number;
    itemName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: 'paid' | 'pending' | 'overdue';
  }> {
    return [
      {
        id: 1,
        itemName: 'STEM春季学期学费',
        amount: 5000,
        paymentDate: '2026-03-01T00:00:00Z',
        paymentMethod: '微信支付',
        status: 'paid' as const,
      },
      {
        id: 2,
        itemName: '3D打印材料费',
        amount: 800,
        paymentDate: '2026-03-15T00:00:00Z',
        paymentMethod: '支付宝',
        status: 'pending' as const,
      },
    ];
  }

  /**
   * 获取 Mock STEM 课程列表
   */
  private getMockCourses(_studentId: number): Array<{
    courseId: number;
    courseName: string;
    teacherName: string;
    enrollDate: string;
    courseStatus: 'ongoing' | 'completed' | 'cancelled';
    duration: number;
  }> {
    return [
      {
        courseId: 101,
        courseName: 'STEM机器人编程基础',
        teacherName: '张老师',
        enrollDate: '2025-09-01',
        courseStatus: 'ongoing' as const,
        duration: 30,
      },
      {
        courseId: 102,
        courseName: '3D打印与建模设计',
        teacherName: '李老师',
        enrollDate: '2025-09-01',
        courseStatus: 'ongoing',
        duration: 24,
      },
      {
        courseId: 103,
        courseName: 'Python编程入门',
        teacherName: '王老师',
        enrollDate: '2026-01-10',
        courseStatus: 'ongoing',
        duration: 20,
      },
      {
        courseId: 104,
        courseName: '科学实验探究',
        teacherName: '赵老师',
        enrollDate: '2025-09-01',
        courseStatus: 'completed' as const,
        duration: 16,
      },
    ];
  }
}
