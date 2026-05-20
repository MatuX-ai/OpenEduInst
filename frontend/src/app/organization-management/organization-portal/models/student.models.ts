/**
 * 学员管理模块数据模型
 *
 * @fileoverview 定义学员相关的类型和接口
 * @author AI Assistant
 * @date 2026-04-02
 */

/**
 * 学员状态枚举
 */
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended' | 'transferred';

/**
 * 家长信息
 */
export interface ParentInfo {
  /** 家长姓名 */
  name: string;

  /** 电话号码 */
  phone: string;

  /** 关系（父子/母女等） */
  relationship: string;

  /** 邮箱（可选） */
  email?: string;
}

/**
 * 学员基本信息
 */
export interface Student {
  /** 学员 ID */
  id: number;

  /** 姓名 */
  name: string;

  /** 邮箱 */
  email: string;

  /** 电话号码（可选） */
  phone?: string;

  /** 年级 */
  grade: string;

  /** 已报名课程数 */
  enrolledCourses: number;

  /** 学习进度 (0-100) */
  progress: number;

  /** 出勤率（可选） */
  attendanceRate?: number;

  /** 状态 */
  status: StudentStatus;

  /** 家长信息（可选） */
  parentInfo?: ParentInfo;

  /** 报名日期（可选） */
  enrollmentDate?: string;

  /** 毕业日期（可选） */
  graduationDate?: string;

  /** 头像 URL（可选） */
  avatar?: string;

  /** 总缴费金额（可选） */
  totalPayment?: number;

  /** 创建时间 */
  createdAt: string;

  /** 更新时间 */
  updatedAt: string;
}

/**
 * 学员详情（包含扩展信息）
 */
export interface StudentDetail extends Student {
  /** 学习档案 */
  learningPortfolio?: LearningRecord[];

  /** 成绩记录 */
  grades?: GradeRecord[];

  /** 出勤记录 */
  attendanceRecords?: AttendanceRecord[];

  /** 缴费记录 */
  paymentRecords?: PaymentRecord[];

  /** 课程列表 */
  courses?: EnrolledCourse[];

  /** 备注信息 */
  notes?: string;
}

/**
 * 学习记录
 */
export interface LearningRecord {
  /** 记录 ID */
  id: number;

  /** 课程名称 */
  courseName: string;

  /** 学习内容 */
  content: string;

  /** 完成度 (0-100) */
  completion: number;

  /** 记录时间 */
  recordedAt: string;

  /** 教师评价 */
  teacherComment?: string;
}

/**
 * 成绩记录
 */
export interface GradeRecord {
  /** 记录 ID */
  id: number;

  /** 考试/作业名称 */
  examName: string;

  /** 分数 */
  score: number;

  /** 总分 */
  totalScore: number;

  /** 百分比 */
  percentage: number;

  /** 考试时间 */
  examDate: string;

  /** 教师评语 */
  comment?: string;
}

/**
 * 出勤记录
 */
export interface AttendanceRecord {
  /** 记录 ID */
  id: number;

  /** 课程名称 */
  courseName: string;

  /** 上课时间 */
  classTime: string;

  /** 出勤状态 */
  status: 'present' | 'absent' | 'late' | 'excused';

  /** 备注 */
  notes?: string;
}

/**
 * 缴费记录
 */
export interface PaymentRecord {
  /** 记录 ID */
  id: number;

  /** 缴费项目 */
  itemName: string;

  /** 金额 */
  amount: number;

  /** 缴费时间 */
  paymentDate: string;

  /** 缴费方式 */
  paymentMethod: string;

  /** 状态 */
  status: 'paid' | 'pending' | 'overdue';

  /** 备注 */
  notes?: string;
}

/**
 * 已报名课程
 */
export interface EnrolledCourse {
  /** 课程 ID */
  courseId: number;

  /** 课程名称 */
  courseName: string;

  /** 授课教师 */
  teacherName: string;

  /** 报名日期 */
  enrollDate: string;

  /** 课程状态 */
  courseStatus: 'ongoing' | 'completed' | 'cancelled';

  /** 课时数 */
  duration: number;
}

/**
 * 学员创建请求
 */
export interface CreateStudentRequest {
  /** 姓名 */
  name: string;

  /** 邮箱 */
  email: string;

  /** 电话号码 */
  phone?: string;

  /** 年级 */
  grade: string;

  /** 家长信息 */
  parentInfo?: ParentInfo;

  /** 报名日期 */
  enrollmentDate?: string;
}

/**
 * 学员更新请求
 */
export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  /** 已报名课程数 */
  enrolledCourses?: number;

  /** 学习进度 */
  progress?: number;

  /** 出勤率 */
  attendanceRate?: number;

  /** 状态 */
  status?: StudentStatus;

  /** 毕业日期 */
  graduationDate?: string;

  /** 总缴费金额 */
  totalPayment?: number;
}

/**
 * 学员筛选条件
 */
export interface StudentFilter {
  /** 搜索关键词（姓名/邮箱） */
  keyword?: string;

  /** 年级筛选 */
  grade?: string;

  /** 状态筛选 */
  status?: StudentStatus;

  /** 页码 */
  page?: number;

  /** 每页数量 */
  pageSize?: number;

  /** 排序字段 */
  sortBy?: keyof Student;

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 学员列表响应
 */
export interface StudentListResponse {
  /** 学员列表 */
  data: Student[];

  /** 总数 */
  total: number;

  /** 当前页 */
  page: number;

  /** 每页数量 */
  pageSize: number;
}

/**
 * 学员统计数据
 */
export interface StudentStats {
  /** 总学员数 */
  totalStudents: number;

  /** 在读学员数 */
  activeStudents: number;

  /** 已毕业学员数 */
  graduatedStudents: number;

  /** 平均学习进度 */
  averageProgress: number;

  /** 平均出勤率 */
  averageAttendanceRate: number;

  /** 总报名课程数 */
  totalEnrolledCourses: number;

  /** 总缴费金额 */
  totalPayment: number;
}

/**
 * 年级信息
 */
export interface Grade {
  /** 年级 ID */
  id: number;

  /** 年级名称 */
  name: string;

  /** 学员数量 */
  studentCount: number;
}
