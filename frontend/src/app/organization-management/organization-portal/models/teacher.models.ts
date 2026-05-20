/**
 * 教师管理模块数据模型
 *
 * @fileoverview 定义教师相关的所有接口和类型
 * @author AI Assistant
 * @date 2026-04-02
 */

// ==================== 核心接口 ====================

/**
 * 教师信息接口
 */
export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department: string; // 所属部门
  position?: string; // 职位
  courseCount: number; // 授课数量
  studentCount?: number; // 带学生数
  status: TeacherStatus;
  hireDate?: string;
  bio?: string; // 个人简介
  avatar?: string; // 头像 URL
  rating?: number; // 评分 (1-5)
  createdAt: string;
  updatedAt: string;
}

/**
 * 教师详情（包含关联数据）
 */
export interface TeacherDetail extends Teacher {
  courses: TeacherCourse[]; // 授课课程列表
  reviews: TeacherReview[]; // 学员评价
  workStats: TeacherWorkStats; // 工作统计
  historyRecords: TeacherHistoryRecord[]; // 历史记录
  education?: EducationBackground[]; // 教育背景
  workExperience?: WorkExperience[]; // 工作经历
  certifications?: string[]; // 资格证书
  teachingRecords?: TeachingRecord[]; // 授课记录
  teachingYears?: number; // 教龄
}

/**
 * 教师授课课程
 */
export interface TeacherCourse {
  courseId: number;
  courseName: string;
  courseCode: string;
  studentCount: number; // 选课学生数
  startDate: string;
  endDate?: string;
  hours: number; // 总课时
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * 学员评价
 */
export interface TeacherReview {
  id: number;
  studentId: number;
  studentName: string;
  rating: number; // 1-5 星
  comment: string;
  courseId?: number;
  courseName?: string;
  createdAt: string;
}

/**
 * 教师工作统计
 */
export interface TeacherWorkStats {
  totalCourses: number; // 总课程数
  totalStudents: number; // 总学生数
  totalHours: number; // 总课时
  averageRating: number; // 平均评分
  completionRate: number; // 课程完成率
  attendanceRate: number; // 出勤率
  thisMonthHours: number; // 本月课时
  thisWeekHours: number; // 本周课时
}

/**
 * 教育背景
 */
export interface EducationBackground {
  school: string;
  degree: string;
  major: string;
  graduationDate: string;
}

/**
 * 工作经历
 */
export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

/**
 * 授课记录
 */
export interface TeachingRecord {
  courseName: string;
  scheduleTime: string;
  duration: number;
  studentCount: number;
}

/**
 * 教师历史记录
 */
export interface TeacherHistoryRecord {
  id: number;
  type: HistoryRecordType;
  description: string;
  operator: string; // 操作人
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// ==================== 辅助接口 ====================

/**
 * 教师筛选条件
 */
export interface TeacherFilter {
  department?: string;
  status?: TeacherStatus;
  search?: string; // 搜索关键词（姓名/邮箱）
  page?: number;
  pageSize?: number;
  sortBy?: keyof Teacher;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 教师统计信息
 */
export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  onLeaveTeachers: number;
  averageRating: number;
  totalCourses: number;
  totalStudents: number;
  departmentStats: DepartmentStat[];
  // 以下为模板中使用的属性
  totalCount?: number;
  activeCount?: number;
  onLeaveCount?: number;
}

/**
 * 部门统计
 */
export interface DepartmentStat {
  department: string;
  count: number;
  percentage: number;
}

/**
 * 教师导出数据结构
 */
export interface TeacherExportData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  status: string;
  hireDate?: string;
  courseCount: number;
  studentCount?: number;
  rating?: number;
}

// ==================== 请求/响应接口 ====================

/**
 * 创建教师请求
 */
export interface CreateTeacherRequest {
  name: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  hireDate?: string;
  bio?: string;
  avatar?: string;
}

/**
 * 更新教师请求
 */
export interface UpdateTeacherRequest {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  status?: TeacherStatus;
  bio?: string;
  avatar?: string;
}

/**
 * 批量操作请求
 */
export interface BatchOperationRequest {
  teacherIds: number[];
  operation: BatchOperationType;
  data?: Record<string, string | number | boolean | Array<string | number> | null>;
}

/**
 * 教师分配课程请求
 */
export interface AssignCourseRequest {
  teacherId: number;
  courseId: number;
  startDate: string;
  endDate?: string;
}

// ==================== 类型枚举 ====================

/**
 * 教师状态
 */
export type TeacherStatus = 'active' | 'inactive' | 'on_leave';

/**
 * 历史记录类型
 */
export type HistoryRecordType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'course_assigned'
  | 'course_removed'
  | 'department_changed'
  | 'position_changed';

/**
 * 批量操作类型
 */
export type BatchOperationType = 'delete' | 'change_status' | 'change_department' | 'assign_course';
