/**
 * 教师管理服务
 *
 * @fileoverview 提供教师管理的完整业务逻辑
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  generateRealisticTeachers,
  SUBJECT_LABELS,
  TEACHER_PROFILES,
} from '../mock-data-enhancements';
import {
  AssignCourseRequest,
  BatchOperationRequest,
  CreateTeacherRequest,
  DepartmentStat,
  Teacher,
  TeacherCourse,
  TeacherDetail,
  TeacherFilter,
  TeacherHistoryRecord,
  TeacherReview,
  TeacherStats,
  TeacherWorkStats,
  UpdateTeacherRequest,
} from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherManagementService {
  // Mock 数据 - 基于项目课程体系特点生成
  private teachers: Teacher[] = generateRealisticTeachers(12);

  /**
   * 获取教师列表
   */
  getTeachers(filter?: TeacherFilter): Observable<Teacher[]> {
    let result = [...this.teachers];

    // 筛选部门
    if (filter?.department) {
      result = result.filter((t) => t.department === filter.department);
    }

    // 筛选状态
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }

    // 搜索关键词
    if (filter?.search) {
      const keyword = filter.search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(keyword) || t.email.toLowerCase().includes(keyword)
      );
    }

    // 排序
    if (filter?.sortBy) {
      const key = filter.sortBy;
      result.sort((a, b) => {
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';
        if (filter.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // 分页
    if (filter?.page && filter.pageSize) {
      const start = (filter.page - 1) * filter.pageSize;
      result = result.slice(start, start + filter.pageSize);
    }

    return of(result);
  }

  /**
   * 获取教师详情
   */
  getTeacherById(id: number): Observable<TeacherDetail> {
    const teacher = this.teachers.find((t) => t.id === id);
    if (!teacher) {
      throw new Error(`Teacher ${id} not found`);
    }

    const detail: TeacherDetail = {
      ...teacher,
      courses: this.getTeacherCourses(id),
      reviews: this.getTeacherReviews(id),
      workStats: this.getTeacherWorkStats(id),
      historyRecords: this.getTeacherHistory(id),
    };

    return of(detail);
  }

  /**
   * 创建教师
   */
  createTeacher(request: CreateTeacherRequest): Observable<Teacher> {
    const newTeacher: Teacher = {
      id: this.generateId(),
      ...request,
      courseCount: 0,
      status: 'active',
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.teachers.push(newTeacher);
    return of(newTeacher);
  }

  /**
   * 更新教师
   */
  updateTeacher(id: number, request: UpdateTeacherRequest): Observable<Teacher> {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Teacher ${id} not found`);
    }

    this.teachers[index] = {
      ...this.teachers[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    return of(this.teachers[index]);
  }

  /**
   * 删除教师（软删除）
   */
  deleteTeacher(id: number): Observable<boolean> {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) {
      return of(false);
    }

    // 软删除：将状态改为 inactive
    this.teachers[index].status = 'inactive';
    this.teachers[index].updatedAt = new Date().toISOString();

    return of(true);
  }

  /**
   * 批量操作
   */
  batchOperation(request: BatchOperationRequest): Observable<boolean> {
    switch (request.operation) {
      case 'delete':
        request.teacherIds.forEach((id) => this.deleteTeacher(id));
        break;
      case 'change_status':
        request.teacherIds.forEach((id) => {
          const index = this.teachers.findIndex((t) => t.id === id);
          if (index !== -1) {
            this.teachers[index].status =
              (request.data?.['status'] as Teacher['status']) || 'inactive';
            this.teachers[index].updatedAt = new Date().toISOString();
          }
        });
        break;
      case 'change_department':
        request.teacherIds.forEach((id) => {
          const index = this.teachers.findIndex((t) => t.id === id);
          if (index !== -1) {
            this.teachers[index].department = (request.data?.['department'] as string) || '';
            this.teachers[index].updatedAt = new Date().toISOString();
          }
        });
        break;
    }

    return of(true);
  }

  /**
   * 分配课程
   */
  assignCourse(request: AssignCourseRequest): Observable<boolean> {
    const index = this.teachers.findIndex((t) => t.id === request.teacherId);
    if (index === -1) {
      return of(false);
    }

    this.teachers[index].courseCount++;
    this.teachers[index].updatedAt = new Date().toISOString();

    return of(true);
  }

  /**
   * 获取统计数据
   */
  getStats(): Observable<TeacherStats> {
    const total = this.teachers.length;
    const active = this.teachers.filter((t) => t.status === 'active').length;
    const inactive = this.teachers.filter((t) => t.status === 'inactive').length;
    const onLeave = this.teachers.filter((t) => t.status === 'on_leave').length;

    const avgRating = this.teachers.reduce((sum, t) => sum + (t.rating ?? 0), 0) / total || 0;
    const roundedAvgRating = parseFloat(avgRating.toFixed(1)); // 保留一位小数

    const totalCourses = this.teachers.reduce((sum, t) => sum + t.courseCount, 0);
    const totalStudents = this.teachers.reduce((sum, t) => sum + (t.studentCount ?? 0), 0);

    // 部门统计
    const deptMap = new Map<string, number>();
    this.teachers.forEach((t) => {
      deptMap.set(t.department, (deptMap.get(t.department) ?? 0) + 1);
    });

    const departmentStats: DepartmentStat[] = Array.from(deptMap.entries()).map(
      ([dept, count]) => ({
        department: dept,
        count,
        percentage: (count / total) * 100,
      })
    );

    return of({
      totalTeachers: total,
      activeTeachers: active,
      inactiveTeachers: inactive,
      onLeaveTeachers: onLeave,
      averageRating: roundedAvgRating,
      totalCourses,
      totalStudents,
      departmentStats,
    });
  }

  /**
   * 获取所有部门列表
   */
  getDepartments(): Observable<string[]> {
    const depts = new Set(this.teachers.map((t) => t.department));
    return of(Array.from(depts));
  }

  // ==================== 辅助方法 ====================

  private getTeacherCourses(_teacherId: number): TeacherCourse[] {
    // Mock 数据
    return [
      {
        courseId: 101,
        courseName: '数学基础',
        courseCode: 'MATH-101',
        studentCount: 30,
        startDate: '2026-03-01',
        hours: 90,
        status: 'active' as const,
      },
    ];
  }

  private getTeacherReviews(_teacherId: number): TeacherReview[] {
    return [
      {
        id: 1,
        studentId: 1001,
        studentName: '小明',
        rating: 5,
        comment: '老师讲解清晰，很有耐心',
        courseId: 101,
        courseName: '数学基础',
        createdAt: '2026-03-15T00:00:00Z',
      },
    ];
  }

  private getTeacherWorkStats(_teacherId: number): TeacherWorkStats {
    return {
      totalCourses: 5,
      totalStudents: 120,
      totalHours: 450,
      averageRating: 4.8,
      completionRate: 95,
      attendanceRate: 98,
      thisMonthHours: 80,
      thisWeekHours: 20,
    };
  }

  private getTeacherHistory(_teacherId: number): TeacherHistoryRecord[] {
    return [
      {
        id: 1,
        type: 'created' as const,
        description: '教师信息创建',
        operator: '系统',
        timestamp: '2020-09-01T00:00:00Z',
      },
    ];
  }

  private generateId(): number {
    return Math.max(...this.teachers.map((t) => t.id), 0) + 1;
  }
}
