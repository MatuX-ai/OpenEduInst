/**
 * 机构财务管理数据模型
 * 包含学费管理、薪酬计算、定价策略、消课记录等
 */

// ==================== 财务管理核心模型 ====================

export interface FinancialTransaction {
  id: string;
  org_id: number;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  related_entity?: {
    type: 'student' | 'course' | 'teacher' | 'salary';
    id: number;
    name: string;
  };
  payment_method?: PaymentMethod;
  transaction_date: string;
  due_date?: string;
  paid_date?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType =
  | 'tuition_fee' // 学费收入
  | 'material_fee' // 材料费
  | 'exam_fee' // 考试费
  | 'refund' // 退费支出
  | 'salary' // 薪酬支出
  | 'bonus' // 奖金
  | 'expense' // 日常支出
  | 'donation' // 捐赠收入
  | 'other_income' // 其他收入
  | 'other_expense'; // 其他支出

export type TransactionStatus =
  | 'pending' // 待处理
  | 'confirmed' // 已确认
  | 'paid' // 已支付
  | 'cancelled' // 已取消
  | 'overdue'; // 已逾期

export type PaymentMethod =
  | 'cash' // 现金
  | 'bank_transfer' // 银行转账
  | 'wechat' // 微信支付
  | 'alipay' // 支付宝
  | 'credit_card' // 信用卡
  | 'installment'; // 分期付款

// ==================== 学费管理 ====================

export interface TuitionRecord {
  id: string;
  student_id: number;
  student_name: string;
  course_id: number;
  course_name: string;
  original_price: number; // 原价
  discount_amount: number; // 优惠金额
  final_amount: number; // 实收金额
  paid_amount: number; // 已付金额
  remaining_amount: number; // 剩余金额
  payment_status: PaymentStatus;
  enrollment_date: string;
  payment_plan?: PaymentPlanItem[];
  refund_records?: RefundRecord[];
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'unpaid' // 未缴费
  | 'partial' // 部分缴费
  | 'full_paid' // 已全额缴费
  | 'refunded' // 已退费
  | 'partially_refunded'; // 部分退费

export interface PaymentPlanItem {
  installment_number: number; // 第几期
  amount: number; // 金额
  due_date: string; // 应缴日期
  paid_date?: string; // 实缴日期
  status: 'pending' | 'paid' | 'overdue';
}

export interface RefundRecord {
  id: string;
  tuition_record_id: string;
  refund_amount: number;
  refund_reason: string;
  refund_status: 'pending' | 'approved' | 'rejected' | 'completed';
  applied_date: string;
  approved_date?: string;
  completed_date?: string;
  remark?: string;
}

// ==================== 课程定价 ====================

export interface CoursePricing {
  id: number;
  course_id: number;
  course_name: string;
  base_price: number; // 基础价格
  pricing_strategy: PricingStrategy;
  tiered_prices?: TieredPrice[];
  discount_rules?: DiscountRule[];
  early_bird_discount?: EarlyBirdDiscount;
  group_discount?: GroupDiscount;
  is_active: boolean;
  effective_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export type PricingStrategy =
  | 'fixed' // 固定定价
  | 'tiered' // 阶梯定价
  | 'dynamic' // 动态定价
  | 'market_based'; // 市场定价

export interface TieredPrice {
  min_students: number;
  max_students?: number;
  price_per_student: number;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  value: number; // 折扣值（百分比或固定金额）
  conditions: DiscountCondition;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export type DiscountType = 'percentage' | 'fixed_amount';

export interface DiscountCondition {
  min_amount?: number; // 最低消费金额
  min_students?: number; // 最低人数
  student_type?: string; // 学生类型（新生/老生）
  course_category?: string; // 课程类别
}

export interface EarlyBirdDiscount {
  discount_percentage: number; // 优惠百分比
  deadline: string; // 截止日期
}

export interface GroupDiscount {
  min_group_size: number;
  discount_percentage: number;
}

// ==================== 薪酬管理 ====================

export interface TeacherSalary {
  id: string;
  teacher_id: number;
  teacher_name: string;
  org_id: number;
  base_salary: number; // 底薪
  performance_salary: number; // 绩效工资
  bonus: number; // 奖金
  deduction: number; // 扣款
  total_salary: number; // 应发工资
  tax: number; // 个税
  social_security: number; // 社保
  actual_salary: number; // 实发工资
  salary_month: string; // 薪资月份
  status: SalaryStatus;
  working_hours: number; // 工作时长
  class_count: number; // 上课节数
  student_count: number; // 学生数量
  evaluation_score?: number; // 评分
  remark?: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export type SalaryStatus =
  | 'draft' // 草稿
  | 'pending' // 待审核
  | 'approved' // 已审核
  | 'calculating' // 计算中
  | 'ready_to_pay' // 待发放
  | 'paid' // 已发放
  | 'error'; // 异常

export interface SalaryCalculationRule {
  id: number;
  org_id: number;
  rule_name: string;
  calculation_type: CalculationType;
  base_salary: number; // 底薪
  hourly_rate: number; // 课时费标准
  performance_weight: number; // 绩效权重
  bonus_rules: BonusRule[];
  deduction_rules: DeductionRule[];
  is_active: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export type CalculationType =
  | 'fixed_salary' // 固定工资
  | 'hourly_based' // 课时制
  | 'performance_based' // 绩效制
  | 'hybrid'; // 混合制

export interface BonusRule {
  type: BonusType;
  condition: {
    min_hours?: number;
    min_students?: number;
    min_evaluation?: number;
    achievement_type?: string;
  };
  bonus_amount: number;
  bonus_percentage?: number;
}

export type BonusType =
  | 'attendance_bonus' // 全勤奖
  | 'performance_bonus' // 绩效奖
  | 'excellence_bonus' // 优秀奖
  | 'achievement_bonus'; // 成就奖

export interface DeductionRule {
  type: DeductionType;
  condition: {
    absence_count?: number;
    late_count?: number;
    complaint_count?: number;
  };
  deduction_amount: number;
  deduction_percentage?: number;
}

export type DeductionType =
  | 'absence_deduction' // 缺勤扣款
  | 'late_deduction' // 迟到扣款
  | 'complaint_deduction' // 投诉扣款
  | 'violation_deduction'; // 违规扣款

// ==================== 消课管理 ====================

export interface CourseConsumption {
  id: string;
  student_id: number;
  student_name: string;
  course_id: number;
  course_name: string;
  schedule_id?: number;
  consumed_hours: number; // 消耗课时
  remaining_hours: number; // 剩余课时
  total_hours: number; // 总课时
  consumption_date: string; // 消课日期
  consumption_type: ConsumptionType;
  status: ConsumptionStatus;
  teacher_id?: number;
  teacher_name?: string;
  classroom_id?: number;
  classroom_name?: string;
  note?: string;
  confirmed_by?: number; // 确认人
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ConsumptionType =
  | 'normal_class' // 正常上课
  | 'makeup_class' // 补课
  | 'trial_class' // 试听课
  | 'activity_class' // 活动课
  | 'online_class'; // 线上课

export type ConsumptionStatus =
  | 'scheduled' // 已排课
  | 'completed' // 已完成
  | 'absent' // 缺勤
  | 'leave' // 请假
  | 'cancelled'; // 已取消

// ==================== 财务报表 ====================

export interface FinancialReport {
  period: string; // 报表期间（YYYY-MM）
  org_id: number;
  income: IncomeSummary;
  expense: ExpenseSummary;
  profit: ProfitSummary;
  cash_flow: CashFlowSummary;
  accounts_receivable: ReceivableSummary;
  generated_at: string;
}

export interface IncomeSummary {
  tuition_income: number; // 学费收入
  material_income: number; // 材料费收入
  other_income: number; // 其他收入
  total_income: number; // 总收入
  growth_rate?: number; // 增长率
}

export interface ExpenseSummary {
  salary_expense: number; // 薪酬支出
  rent_expense: number; // 房租
  utility_expense: number; // 水电费
  marketing_expense: number; // 营销费用
  maintenance_expense: number; // 维护费
  other_expense: number; // 其他支出
  total_expense: number; // 总支出
}

export interface ProfitSummary {
  gross_profit: number; // 毛利润
  net_profit: number; // 净利润
  profit_margin: number; // 利润率
}

export interface CashFlowSummary {
  operating_cash_flow: number; // 经营活动现金流
  investing_cash_flow: number; // 投资活动现金流
  financing_cash_flow: number; // 筹资活动现金流
  net_cash_flow: number; // 净现金流
}

export interface ReceivableSummary {
  total_receivable: number; // 应收总额
  collected: number; // 已收
  outstanding: number; // 未收
  overdue: number; // 逾期
  collection_rate: number; // 收款率
}
