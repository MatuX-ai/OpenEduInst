/**
 * 排课管理模块数据模型
 *
 * @fileoverview 定义排课相关的类型和接口
 * @author AI Assistant
 * @date 2026-04-02
 */

/**
 * 排课状态枚举
 */
export type ScheduleStatus = 'scheduled' | 'adjusted' | 'cancelled';

/**
 * 重复类型枚举
 */
export type RepeatType = 'none' | 'weekly' | 'biweekly' | 'monthly';

/**
 * 视图模式枚举
 */
export type ViewMode = 'day' | 'week' | 'month';

/**
 * 冲突类型枚举
 */
export type ConflictType = 'teacher' | 'classroom' | 'time' | 'student';

/**
 * 星期枚举 (1-7 对应周一到周日)
 */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 教室信息
 */
export interface Classroom {
  /** 教室 ID */
  id: number;

  /** 教室名称 */
  name: string;

  /** 容纳人数 */
  capacity: number;

  /** 位置描述（可选） */
  location?: string;

  /** 设备列表（可选） */
  equipment?: string[];

  /** 是否可用 */
  isAvailable: boolean;

  /** 教室类型（可选） */
  type?: string;

  /** 备注（可选） */
  notes?: string;

  /** 创建时间 */
  createdAt: string;

  /** 更新时间 */
  updatedAt: string;
}

/**
 * 课程信息
 */
export interface Course {
  /** 课程 ID */
  id: number;

  /** 课程名称 */
  name: string;

  /** 课程代码 */
  code: string;

  /** 课程类型 */
  type: string;

  /** 课程描述（可选） */
  description?: string;

  /** 课时数 */
  duration: number;

  /** 授课教师 ID */
  teacherId: number;

  /** 授课教师姓名 */
  teacherName: string;

  /** 学员 ID 列表 */
  studentIds: number[];

  /** 建议教室类型（可选） */
  preferredClassroomType?: string;

  /** 状态 */
  status: 'active' | 'inactive' | 'completed';

  /** 开始日期 */
  startDate: string;

  /** 结束日期（可选） */
  endDate?: string;

  /** 创建时间 */
  createdAt: string;

  /** 更新时间 */
  updatedAt: string;
}

/**
 * 排课记录
 */
export interface Schedule {
  /** 排课 ID */
  id: number;

  /** 课程 ID */
  courseId: number;

  /** 课程名称 */
  courseName: string;

  /** 课程代码（可选） */
  courseCode?: string;

  /** 课程类型（可选）如：STEM课程、文化课等 */
  courseType?: string;

  /** 教师 ID */
  teacherId: number;

  /** 教师姓名 */
  teacherName: string;

  /** 教室 ID（可选） */
  classroomId?: number;

  /** 教室名称（可选） */
  classroomName?: string;

  /** 学员 ID 列表 */
  studentIds: number[];

  /** 星期几 (1-7) */
  dayOfWeek: DayOfWeek;

  /** 开始时间 (格式："09:00") */
  startTime: string;

  /** 结束时间 (格式："10:30") */
  endTime: string;

  /** 开始日期 */
  startDate: string;

  /** 结束日期（可选） */
  endDate?: string;

  /** 重复类型 */
  repeatType: RepeatType;

  /** 重复周数（可选） */
  repeatWeeks?: number;

  /** 状态 */
  status: ScheduleStatus;

  /** 备注（可选） */
  notes?: string;

  /** 调课原因（可选） */
  adjustReason?: string;

  /** 原排课 ID（如果是调课） */
  originalScheduleId?: number;

  /** 创建时间 */
  createdAt: string;

  /** 更新时间 */
  updatedAt: string;
}

/**
 * 排课详情（包含扩展信息）
 */
export interface ScheduleDetail extends Schedule {
  /** 课程详情 */
  course?: Course;

  /** 教室详情 */
  classroom?: Classroom;

  /** 学员列表 */
  students?: Array<{
    id: number;
    name: string;
    email: string;
  }>;

  /** 调课历史记录 */
  adjustmentHistory?: ScheduleAdjustment[];

  /** 出勤记录 */
  attendanceRecords?: AttendanceRecord[];
}

/**
 * 排课调整记录
 */
export interface ScheduleAdjustment {
  /** 调整 ID */
  id: number;

  /** 原排课 ID */
  scheduleId: number;

  /** 调整后新排课 ID */
  newScheduleId: number;

  /** 调整原因 */
  reason: string;

  /** 申请人 */
  applicant: string;

  /** 审批人（可选） */
  approver?: string;

  /** 审批状态 */
  approvalStatus: 'pending' | 'approved' | 'rejected';

  /** 申请时间 */
  applyTime: string;

  /** 审批时间（可选） */
  approveTime?: string;

  /** 备注（可选） */
  notes?: string;
}

/**
 * 出勤记录
 */
export interface AttendanceRecord {
  /** 记录 ID */
  id: number;

  /** 排课 ID */
  scheduleId: number;

  /** 学员 ID */
  studentId: number;

  /** 学员姓名 */
  studentName: string;

  /** 上课日期 */
  classDate: string;

  /** 出勤状态 */
  status: 'present' | 'absent' | 'late' | 'excused';

  /** 备注（可选） */
  notes?: string;

  /** 记录时间 */
  recordedAt: string;
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  /** 是否有冲突 */
  hasConflict: boolean;

  /** 冲突类型 */
  conflictType?: ConflictType;

  /** 冲突的排课记录 */
  conflictingSchedules: Schedule[];

  /** 冲突描述 */
  message: string;

  /** 解决建议（可选） */
  suggestion?: string;
}

/**
 * 时间段
 */
export interface TimeSlot {
  /** 星期几 */
  dayOfWeek: DayOfWeek;

  /** 开始时间 */
  startTime: string;

  /** 结束时间 */
  endTime: string;

  /** 教室 ID（可选） */
  classroomId?: number;

  /** 推荐分数 */
  score?: number;
}

/**
 * 排课筛选条件
 */
export interface ScheduleFilter {
  /** 搜索关键词（课程名称/教师姓名） */
  keyword?: string;

  /** 教师 ID 筛选 */
  teacherId?: number;

  /** 教室 ID 筛选 */
  classroomId?: number;

  /** 课程 ID 筛选 */
  courseId?: number;

  /** 星期几筛选 */
  dayOfWeek?: DayOfWeek;

  /** 开始日期 */
  startDate?: string;

  /** 结束日期 */
  endDate?: string;

  /** 状态筛选 */
  status?: ScheduleStatus;

  /** 视图模式 */
  viewMode?: ViewMode;

  /** 页码 */
  page?: number;

  /** 每页数量 */
  pageSize?: number;

  /** 排序字段 */
  sortBy?: keyof Schedule;

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 排课列表响应
 */
export interface ScheduleListResponse {
  /** 排课列表 */
  data: Schedule[];

  /** 总数 */
  total: number;

  /** 当前页 */
  page: number;

  /** 每页数量 */
  pageSize: number;
}

/**
 * 排课统计数据
 */
export interface ScheduleStats {
  /** 总课程数 */
  totalSchedules: number;

  /** 本周课程数 */
  thisWeekSchedules: number;

  /** 已上课次数 */
  completedCount: number;

  /** 已取消次数 */
  cancelledCount: number;

  /** 平均教室使用率 */
  averageClassroomUsageRate: number;

  /** 教师平均课时 */
  averageTeacherHours: number;

  /** 空教室数量 */
  availableClassroomsCount: number;
}

/**
 * 教室使用率统计
 */
export interface ClassroomUsageStats {
  /** 教室 ID */
  classroomId: number;

  /** 教室名称 */
  classroomName: string;

  /** 总课时数 */
  totalHours: number;

  /** 使用率 (0-100) */
  usageRate: number;

  /** 空闲时段 */
  freeSlots: TimeSlot[];
}

/**
 * 教师课时统计
 */
export interface TeacherHoursStats {
  /** 教师 ID */
  teacherId: number;

  /** 教师姓名 */
  teacherName: string;

  /** 总课时数 */
  totalHours: number;

  /** 本周课时数 */
  thisWeekHours: number;

  /** 课程列表 */
  courses: Array<{
    courseId: number;
    courseName: string;
    hours: number;
  }>;
}

/**
 * 排课创建请求
 */
export interface CreateScheduleRequest {
  /** 课程 ID */
  courseId: number;

  /** 课程名称 */
  courseName: string;

  /** 教师 ID */
  teacherId: number;

  /** 教师姓名 */
  teacherName: string;

  /** 教室 ID（可选） */
  classroomId?: number;

  /** 学员 ID 列表 */
  studentIds: number[];

  /** 星期几 */
  dayOfWeek: DayOfWeek;

  /** 开始时间 */
  startTime: string;

  /** 结束时间 */
  endTime: string;

  /** 开始日期 */
  startDate: string;

  /** 结束日期（可选） */
  endDate?: string;

  /** 重复类型 */
  repeatType: RepeatType;

  /** 重复周数（可选） */
  repeatWeeks?: number;

  /** 备注（可选） */
  notes?: string;
}

/**
 * 排课更新请求
 */
export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  /** 状态 */
  status?: ScheduleStatus;

  /** 调课原因（可选） */
  adjustReason?: string;

  /** 原排课 ID（可选） */
  originalScheduleId?: number;
}

/**
 * 批量排课请求
 */
export interface BatchScheduleRequest {
  /** 课程 ID 列表 */
  courseIds: number[];

  /** 教师 ID */
  teacherId: number;

  /** 教室 ID（可选） */
  classroomId?: number;

  /** 时间段列表 */
  timeSlots: TimeSlot[];

  /** 重复类型 */
  repeatType: RepeatType;

  /** 重复周数（可选） */
  repeatWeeks?: number;
}

/**
 * 调课申请请求
 */
export interface ScheduleAdjustRequest {
  /** 原排课 ID */
  scheduleId: number;

  /** 新时间段 */
  newTimeSlot: TimeSlot;

  /** 新教室 ID（可选） */
  newClassroomId?: number;

  /** 调课原因 */
  reason: string;

  /** 申请人 */
  applicant: string;
}
