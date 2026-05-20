/**
 * 财务管理服务
 * 提供学费、薪酬、定价、消课等财务相关 API 调用
 */

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  CourseConsumption,
  CoursePricing,
  FinancialReport,
  FinancialTransaction,
  PaymentStatus,
  SalaryStatus,
  TeacherSalary,
  TransactionStatus,
  TransactionType,
  TuitionRecord,
} from '../models/finance.models';

interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  private readonly API_BASE = environment.apiUrl + '/api/v1';
  private readonly FINANCE_API = this.API_BASE + '/finance';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // ==================== 交易记录管理 ====================

  /**
   * 获取交易记录列表
   */
  getTransactions(
    orgId: number,
    filters?: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<FinancialTransaction[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.FINANCE_API}/org/${orgId}/transactions`;

    if (filters) {
      const params = Object.entries(filters).filter(([_, v]) => v != null);
      if (params.length > 0) {
        url += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      }
    }

    return this.http.get<ApiResponse<FinancialTransaction[]>>(url, { headers }).pipe(
      map((response) => {
        if (!response.data || response.data.length === 0) {
          console.warn('交易记录数据为空，使用模拟数据');
          throw new Error('数据为空');
        }
        return response.data;
      }),
      catchError((err) => {
        console.warn('获取交易记录失败，返回模拟数据:', err);
        return this.getMockTransactions(orgId);
      })
    );
  }

  /**
   * 创建交易记录
   */
  createTransaction(
    orgId: number,
    transaction: Partial<FinancialTransaction>
  ): Observable<FinancialTransaction> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<FinancialTransaction>>(
        `${this.FINANCE_API}/org/${orgId}/transactions`,
        transaction,
        {
          headers,
        }
      )
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('创建交易记录失败:', err);
          throw err;
        })
      );
  }

  // ==================== 学费管理 ====================

  /**
   * 获取学费记录列表
   */
  getTuitionRecords(
    orgId: number,
    filters?: {
      studentId?: number;
      courseId?: number;
      paymentStatus?: PaymentStatus;
    }
  ): Observable<TuitionRecord[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.FINANCE_API}/org/${orgId}/tuition`;

    if (filters) {
      const params = Object.entries(filters).filter(([_, v]) => v != null);
      if (params.length > 0) {
        url += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
      }
    }

    return this.http.get<ApiResponse<TuitionRecord[]>>(url, { headers }).pipe(
      map((response) => {
        if (!response.data || response.data.length === 0) {
          console.warn('学费记录数据为空，使用模拟数据');
          throw new Error('数据为空');
        }
        return response.data;
      }),
      catchError((err) => {
        console.warn('获取学费记录失败，返回模拟数据:', err);
        return this.getMockTuitionRecords(orgId);
      })
    );
  }

  /**
   * 创建学费记录
   */
  createTuitionRecord(orgId: number, record: Partial<TuitionRecord>): Observable<TuitionRecord> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<TuitionRecord>>(`${this.FINANCE_API}/org/${orgId}/tuition`, record, {
        headers,
      })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('创建学费记录失败:', err);
          throw err;
        })
      );
  }

  /**
   * 更新缴费状态
   */
  updatePaymentStatus(
    orgId: number,
    tuitionId: string,
    status: PaymentStatus,
    paidAmount?: number
  ): Observable<TuitionRecord> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<
        ApiResponse<TuitionRecord>
      >(`${this.FINANCE_API}/org/${orgId}/tuition/${tuitionId}/payment`, { status, paid_amount: paidAmount }, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('更新缴费状态失败:', err);
          throw err;
        })
      );
  }

  /**
   * 申请退费
   */
  applyRefund(
    orgId: number,
    tuitionId: string,
    refundData: { amount: number; reason: string }
  ): Observable<TuitionRecord> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<TuitionRecord>>(
        `${this.FINANCE_API}/org/${orgId}/tuition/${tuitionId}/refund`,
        refundData,
        {
          headers,
        }
      )
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('申请退费失败:', err);
          throw err;
        })
      );
  }

  // ==================== 课程定价 ====================

  /**
   * 获取课程定价
   */
  getCoursePricing(orgId: number, courseId?: number): Observable<CoursePricing[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.FINANCE_API}/org/${orgId}/pricing`;
    if (courseId) {
      url += `?course_id=${courseId}`;
    }

    return this.http.get<ApiResponse<CoursePricing[]>>(url, { headers }).pipe(
      map((response) => {
        // 如果返回空数组，使用 mock 数据
        if (!response.data || response.data.length === 0) {
          console.warn('课程定价数据为空，使用模拟数据');
          throw new Error('数据为空');
        }
        return response.data;
      }),
      catchError((err) => {
        console.warn('获取课程定价失败，返回模拟数据:', err);
        return this.getMockCoursePricing(orgId);
      })
    );
  }

  /**
   * 设置课程定价
   */
  setCoursePricing(orgId: number, pricing: Partial<CoursePricing>): Observable<CoursePricing> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<CoursePricing>>(`${this.FINANCE_API}/org/${orgId}/pricing`, pricing, {
        headers,
      })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('设置课程定价失败:', err);
          throw err;
        })
      );
  }

  /**
   * 更新课程定价
   */
  updateCoursePricing(
    orgId: number,
    pricingId: number,
    pricing: Partial<CoursePricing>
  ): Observable<CoursePricing> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<
        ApiResponse<CoursePricing>
      >(`${this.FINANCE_API}/org/${orgId}/pricing/${pricingId}`, pricing, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('更新课程定价失败:', err);
          throw err;
        })
      );
  }

  // ==================== 薪酬管理 ====================

  /**
   * 获取教师薪酬列表
   */
  getTeacherSalaries(
    orgId: number,
    filters?: {
      teacherId?: number;
      salaryMonth?: string;
      status?: SalaryStatus;
    }
  ): Observable<TeacherSalary[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.FINANCE_API}/org/${orgId}/salaries`;

    if (filters) {
      const params = Object.entries(filters).filter(([_, v]) => v != null);
      if (params.length > 0) {
        url += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
      }
    }

    return this.http.get<ApiResponse<TeacherSalary[]>>(url, { headers }).pipe(
      map((response) => {
        if (!response.data || response.data.length === 0) {
          console.warn('教师薪酬数据为空，使用模拟数据');
          throw new Error('数据为空');
        }
        return response.data;
      }),
      catchError((err) => {
        console.warn('获取教师薪酬失败，返回模拟数据:', err);
        return this.getMockTeacherSalaries(orgId);
      })
    );
  }

  /**
   * 计算教师薪酬
   */
  calculateSalary(orgId: number, teacherId: number, month: string): Observable<TeacherSalary> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<TeacherSalary>
      >(`${this.FINANCE_API}/org/${orgId}/salaries/calculate`, { teacher_id: teacherId, month }, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('计算薪酬失败:', err);
          throw err;
        })
      );
  }

  /**
   * 批量计算薪酬
   */
  batchCalculateSalaries(
    orgId: number,
    month: string
  ): Observable<{ success: boolean; message?: string }> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<{ success: boolean; message?: string }>
      >(`${this.FINANCE_API}/org/${orgId}/salaries/batch-calculate`, { month }, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('批量计算薪酬失败:', err);
          throw err;
        })
      );
  }

  /**
   * 发放薪酬
   */
  paySalary(orgId: number, salaryId: string): Observable<TeacherSalary> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<TeacherSalary>
      >(`${this.FINANCE_API}/org/${orgId}/salaries/${salaryId}/pay`, {}, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('发放薪酬失败:', err);
          throw err;
        })
      );
  }

  // ==================== 消课管理 ====================

  /**
   * 获取消课记录
   */
  getCourseConsumptions(
    orgId: number,
    filters?: {
      studentId?: number;
      courseId?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<CourseConsumption[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.FINANCE_API}/org/${orgId}/consumptions`;

    if (filters) {
      const params = Object.entries(filters).filter(([_, v]) => v != null);
      if (params.length > 0) {
        url += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
      }
    }

    return this.http.get<ApiResponse<CourseConsumption[]>>(url, { headers }).pipe(
      map((response) => {
        // 如果返回空数组，使用 mock 数据
        if (!response.data || response.data.length === 0) {
          console.warn('消课记录数据为空，使用模拟数据');
          throw new Error('数据为空');
        }
        return response.data;
      }),
      catchError((err) => {
        console.warn('获取消课记录失败，返回模拟数据:', err);
        return this.getMockConsumptions(orgId);
      })
    );
  }

  /**
   * 确认消课
   */
  confirmConsumption(orgId: number, consumptionId: string): Observable<CourseConsumption> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<CourseConsumption>
      >(`${this.FINANCE_API}/org/${orgId}/consumptions/${consumptionId}/confirm`, {}, { headers })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('确认消课失败:', err);
          throw err;
        })
      );
  }

  // ==================== 财务报表 ====================

  /**
   * 获取财务报表
   */
  getFinancialReport(orgId: number, period: string): Observable<FinancialReport> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        ApiResponse<FinancialReport>
      >(`${this.FINANCE_API}/org/${orgId}/report?period=${period}`, { headers })
      .pipe(
        map((response) => {
          // 如果返回空数据，使用 mock 数据
          if (!response.data) {
            console.warn('财务报表数据为空，使用模拟数据');
            throw new Error('数据为空');
          }
          return response.data;
        }),
        catchError((err) => {
          console.warn('获取财务报表失败，返回模拟数据:', err);
          return this.getMockFinancialReport(orgId, period);
        })
      );
  }

  // ==================== 模拟数据 ====================

  private getMockTransactions(orgId: number): Observable<FinancialTransaction[]> {
    return of(
      Array.from({ length: 10 }, (_, i) => ({
        id: `txn_${i + 1}`,
        org_id: orgId,
        type: (i % 3 === 0 ? 'tuition_fee' : 'salary') as TransactionType,
        amount: Math.random() * 5000 + 1000,
        status: ['paid', 'pending', 'confirmed'][i % 3] as TransactionStatus,
        description: `交易记录 ${i + 1}`,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  }

  private getMockTuitionRecords(_orgId: number): Observable<TuitionRecord[]> {
    return of(
      Array.from({ length: 8 }, (_, i) => ({
        id: `tuition_${i + 1}`,
        student_id: 2000 + i,
        student_name: `学生${i + 1}`,
        course_id: 100 + i,
        course_name: `课程${i + 1}`,
        original_price: 5000,
        discount_amount: i % 2 === 0 ? 500 : 0,
        final_amount: 4500,
        paid_amount: i % 3 === 0 ? 0 : i % 3 === 1 ? 2250 : 4500,
        remaining_amount: i % 3 === 0 ? 4500 : i % 3 === 1 ? 2250 : 0,
        payment_status: ['unpaid', 'partial', 'full_paid'][i % 3] as PaymentStatus,
        enrollment_date: '2026-03-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  }

  private getMockCoursePricing(_orgId: number): Observable<CoursePricing[]> {
    return of(
      Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        course_id: 100 + i,
        course_name: `课程${i + 1}`,
        base_price: 5000 + i * 500,
        pricing_strategy: 'fixed' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  }

  private getMockTeacherSalaries(orgId: number): Observable<TeacherSalary[]> {
    return of(
      Array.from({ length: 5 }, (_, i) => ({
        id: `salary_${i + 1}`,
        teacher_id: 1000 + i,
        teacher_name: `教师${i + 1}`,
        org_id: orgId,
        base_salary: 3000,
        performance_salary: 2000,
        bonus: i % 2 === 0 ? 500 : 0,
        deduction: 0,
        total_salary: 5000 + (i % 2 === 0 ? 500 : 0),
        tax: 100,
        social_security: 500,
        actual_salary: 4400 + (i % 2 === 0 ? 500 : 0),
        salary_month: '2026-03',
        status: ['paid', 'ready_to_pay', 'approved'][i % 3] as SalaryStatus,
        working_hours: 120,
        class_count: 40,
        student_count: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  }

  private getMockConsumptions(_orgId: number): Observable<CourseConsumption[]> {
    return of(
      Array.from({ length: 10 }, (_, i) => ({
        id: `consume_${i + 1}`,
        student_id: 2000 + i,
        student_name: `学生${i + 1}`,
        course_id: 100 + i,
        course_name: `课程${i + 1}`,
        consumed_hours: 2,
        remaining_hours: 20 - i * 2,
        total_hours: 40,
        consumption_date: new Date().toISOString(),
        consumption_type: 'normal_class' as const,
        status: ['completed', 'scheduled', 'absent'][i % 3] as CourseConsumption['status'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  }

  private getMockFinancialReport(orgId: number, period: string): Observable<FinancialReport> {
    return of({
      period,
      org_id: orgId,
      income: {
        tuition_income: 150000,
        material_income: 20000,
        other_income: 5000,
        total_income: 177000,
        growth_rate: 15.5,
      },
      expense: {
        salary_expense: 80000,
        rent_expense: 30000,
        utility_expense: 5000,
        marketing_expense: 10000,
        maintenance_expense: 3000,
        other_expense: 7000,
        total_expense: 135000,
      },
      profit: {
        gross_profit: 97000,
        net_profit: 42000,
        profit_margin: 23.7,
      },
      cash_flow: {
        operating_cash_flow: 50000,
        investing_cash_flow: -20000,
        financing_cash_flow: 10000,
        net_cash_flow: 40000,
      },
      accounts_receivable: {
        total_receivable: 200000,
        collected: 180000,
        outstanding: 20000,
        overdue: 5000,
        collection_rate: 90,
      },
      generated_at: new Date().toISOString(),
    });
  }
}
