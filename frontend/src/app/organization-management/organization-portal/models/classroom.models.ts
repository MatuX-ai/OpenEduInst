/**
 * 教室管理模块数据模型
 *
 * @fileoverview 定义教室相关的接口和类型
 * @author AI Assistant
 * @date 2026-04-02
 */

// ==================== 核心接口 ====================

/**
 * 教室信息接口
 */
export interface Classroom {
  id: number;
  name: string;
  capacity: number; // 容纳人数
  location?: string; // 位置描述
  equipment?: string[]; // 设备列表
  type?: ClassroomType; // 教室类型
  isAvailable: boolean; // 是否可用
  description?: string; // 详细描述
  imageUrl?: string; // 图片 URL
  createdAt: string;
  updatedAt: string;
  // 以下为模板中使用的额外属性
  building?: string; // 教学楼
  room_type?: string; // 房间类型
  room_number?: string; // 房间号
  has_projector?: boolean; // 是否有投影仪
  has_computer?: boolean; // 是否有电脑
  has_audio_system?: boolean; // 是否有音响
  has_whiteboard?: boolean; // 是否有白板
  floor?: number; // 楼层
}

/**
 * 教室预约记录
 */
export interface ClassroomBooking {
  id: number;
  classroomId: number;
  classroomName: string;
  purpose: string; // 用途
  bookerId: number; // 预约人 ID
  bookerName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  participants?: number; // 参与人数
  notes?: string; // 备注
  createdAt: string;
  updatedAt: string;
}

/**
 * 教室使用统计
 */
export interface ClassroomUsageStats {
  classroomId: number;
  classroomName: string;
  totalHours: number; // 总使用时长
  bookingCount: number; // 预约次数
  utilizationRate: number; // 使用率 (0-100)
  averageParticipants: number; // 平均参与人数
  freeSlots: TimeSlot[]; // 空闲时段
}

/**
 * 教室统计信息（用于后端 API 响应）
 */
export interface ClassroomStatistics {
  total_classrooms: number;
  available_classrooms: number;
  occupied_classrooms: number;
  maintenance_classrooms: number;
  utilization_rate: number;
  by_type: {
    regular: number;
    computer_lab: number;
    multimedia: number;
    science_lab: number;
  };
  by_capacity: Array<{
    range: string;
    count: number;
  }>;
}

/**
 * 教室课表安排
 */
export interface ClassroomSchedule {
  schedule_id: string;
  classroom_id: number;
  course_name: string;
  teacher_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

/**
 * 时间段
 */
export interface TimeSlot {
  dayOfWeek: number; // 1-7
  startTime: string;
  endTime: string;
  date?: string;
}

/**
 * 教室维护记录
 */
export interface ClassroomMaintenance {
  id: number;
  classroomId: number;
  type: MaintenanceType;
  description: string;
  maintenanceDate: string;
  cost?: number; // 维护费用
  status: MaintenanceStatus;
  operator?: string; // 操作人
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 辅助接口 ====================

/**
 * 教室筛选条件
 */
export interface ClassroomFilter {
  type?: ClassroomType;
  capacity?: number; // 最小容量
  isAvailable?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 教室统计信息
 */
export interface ClassroomStats {
  totalClassrooms: number;
  availableClassrooms: number;
  unavailableClassrooms: number;
  totalCapacity: number;
  todayBookings: number;
  thisWeekBookings: number;
  utilizationRate: number;
  typeStats: ClassroomTypeStat[];
}

/**
 * 教室类型统计
 */
export interface ClassroomTypeStat {
  type: ClassroomType;
  count: number;
  percentage: number;
}

/**
 * 预约筛选条件
 */
export interface BookingFilter {
  classroomId?: number;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  bookerId?: number;
  page?: number;
  pageSize?: number;
}

// ==================== 请求/响应接口 ====================

/**
 * 创建教室请求
 */
export interface CreateClassroomRequest {
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
  type?: ClassroomType;
  description?: string;
  imageUrl?: string;
}

/**
 * 更新教室请求
 */
export interface UpdateClassroomRequest {
  name?: string;
  capacity?: number;
  location?: string;
  equipment?: string[];
  type?: ClassroomType;
  isAvailable?: boolean;
  description?: string;
  imageUrl?: string;
}

/**
 * 创建预约请求
 */
export interface CreateBookingRequest {
  classroomId: number;
  purpose: string;
  bookerId: number;
  bookerName: string;
  startTime: string;
  endTime: string;
  participants?: number;
  notes?: string;
}

/**
 * 更新预约请求
 */
export interface UpdateBookingRequest {
  purpose?: string;
  startTime?: string;
  endTime?: string;
  participants?: number;
  notes?: string;
  status?: BookingStatus;
}

/**
 * 创建维护记录请求
 */
export interface CreateMaintenanceRequest {
  classroomId: number;
  type: MaintenanceType;
  description: string;
  maintenanceDate: string;
  cost?: number;
  operator?: string;
}

// ==================== 类型枚举 ====================

/**
 * 教室类型
 */
export type ClassroomType =
  | '普通教室'
  | '多媒体教室'
  | '计算机教室'
  | '音乐教室'
  | '美术教室'
  | '舞蹈教室'
  | '实验室'
  | '会议室';

/**
 * 预约状态
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';

/**
 * 维护类型
 */
export type MaintenanceType = 'repair' | 'cleaning' | 'inspection' | 'upgrade';

/**
 * 维护状态
 */
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
