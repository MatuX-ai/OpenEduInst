/**
 * 财务管理仪表板组件
 * 提供学费管理、薪酬发放、课程定价、消课记录等功能
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  CourseConsumption,
  CoursePricing,
  FinancialReport,
  TeacherSalary,
  TuitionRecord,
} from '../../models/finance.models';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-finance-dashboard',
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
  ],
})
export class FinanceDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orgId!: number;
  loading = false;

  // 统计数据
  monthlyRevenue = 0;
  monthlyExpense = 0;
  netProfit = 0;
  outstandingReceivable = 0;

  // 学费管理
  tuitionRecords: TuitionRecord[] = [];
  tuitionFilter = {
    studentName: '',
    paymentStatus: '',
  };
  tuitionColumns = [
    'student_name',
    'course_name',
    'final_amount',
    'paid_amount',
    'remaining_amount',
    'payment_status',
    'actions',
  ];

  // 薪酬管理
  salaries: TeacherSalary[] = [];
  salaryFilter = {
    month: new Date(),
  };
  salaryColumns = [
    'teacher_name',
    'total_salary',
    'deduction',
    'actual_salary',
    'status',
    'actions',
  ];

  // 课程定价
  coursePricings: CoursePricing[] = [];

  // 消课记录
  consumptions: CourseConsumption[] = [];
  consumptionFilter = {
    startDate: new Date(),
    endDate: new Date(),
  };
  consumptionColumns = [
    'student_name',
    'course_name',
    'consumed_hours',
    'remaining_hours',
    'consumption_date',
    'status',
    'actions',
  ];

  // 财务报表
  financialReport: FinancialReport | null = null;
  selectedReportMonth = new Date();

  constructor(
    private route: ActivatedRoute,
    private financeService: FinanceService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : 0;

    // 验证 ID 是否为有效数字
    if (!id || isNaN(id)) {
      console.error('无效的机构ID:', idParam);
      this.snackBar.open('机构ID无效，请从正确的入口访问', '关闭', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.orgId = id;
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loadStatistics();
    this.loadTuitionRecords();
    this.loadSalaries();
    this.loadCoursePricings();
    this.loadConsumptions();
    this.loadFinancialReport();
  }

  loadStatistics(): void {
    // TODO: 从服务加载真实统计数据
    this.monthlyRevenue = 177000;
    this.monthlyExpense = 135000;
    this.netProfit = 42000;
    this.outstandingReceivable = 20000;
  }

  loadTuitionRecords(): void {
    this.financeService
      .getTuitionRecords(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((records: TuitionRecord[]) => {
        this.tuitionRecords = records;
        this.cdr.detectChanges();
      });
  }

  loadSalaries(): void {
    const monthStr = this.formatMonth(this.salaryFilter.month);
    this.financeService
      .getTeacherSalaries(this.orgId, { salaryMonth: monthStr })
      .pipe(takeUntil(this.destroy$))
      .subscribe((salaries: TeacherSalary[]) => {
        this.salaries = salaries;
        this.cdr.detectChanges();
      });
  }

  loadCoursePricings(): void {
    this.financeService
      .getCoursePricing(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((pricings: CoursePricing[]) => {
        this.coursePricings = pricings;
        this.cdr.detectChanges();
      });
  }

  loadConsumptions(): void {
    this.financeService
      .getCourseConsumptions(this.orgId, {
        startDate: this.consumptionFilter.startDate.toISOString(),
        endDate: this.consumptionFilter.endDate.toISOString(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((consumptions: CourseConsumption[]) => {
        this.consumptions = consumptions;
        this.cdr.detectChanges();
      });
  }

  loadFinancialReport(): void {
    const period = this.formatMonth(this.selectedReportMonth);
    this.financeService
      .getFinancialReport(this.orgId, period)
      .pipe(takeUntil(this.destroy$))
      .subscribe((report) => {
        this.financialReport = report;
        this.cdr.detectChanges();
      });
  }

  get filteredTuitionRecords(): TuitionRecord[] {
    return this.tuitionRecords.filter((record) => {
      if (
        this.tuitionFilter.studentName &&
        !record.student_name.includes(this.tuitionFilter.studentName)
      ) {
        return false;
      }
      if (
        this.tuitionFilter.paymentStatus &&
        record.payment_status !== this.tuitionFilter.paymentStatus
      ) {
        return false;
      }
      return true;
    });
  }

  getPaymentStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'full_paid':
        return 'primary';
      case 'partial':
        return 'accent';
      case 'unpaid':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getPaymentStatusText(status: string): string {
    const textMap: Record<string, string> = {
      unpaid: '未缴费',
      partial: '部分缴费',
      full_paid: '已全额缴费',
      refunded: '已退费',
      partially_refunded: '部分退费',
    };
    return textMap[status] || status;
  }

  getSalaryStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'paid':
        return 'primary';
      case 'ready_to_pay':
        return 'accent';
      case 'error':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getSalaryStatusText(status: string): string {
    const textMap: Record<string, string> = {
      draft: '草稿',
      pending: '待审核',
      approved: '已审核',
      calculating: '计算中',
      ready_to_pay: '待发放',
      paid: '已发放',
      error: '异常',
    };
    return textMap[status] || status;
  }

  getPricingStrategyText(strategy: string): string {
    const textMap: Record<string, string> = {
      fixed: '固定定价',
      tiered: '阶梯定价',
      dynamic: '动态定价',
      market_based: '市场定价',
    };
    return textMap[strategy] || strategy;
  }

  getConsumptionStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'completed':
        return 'primary';
      case 'scheduled':
        return 'accent';
      case 'absent':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getConsumptionStatusText(status: string): string {
    const textMap: Record<string, string> = {
      scheduled: '已排课',
      completed: '已完成',
      absent: '缺勤',
      leave: '请假',
      cancelled: '已取消',
    };
    return textMap[status] || status;
  }

  openTuitionDialog(): void {
    // TODO: 实现新增学费记录对话框
  }

  collectPayment(_record: TuitionRecord): void {
    // TODO: 实现收款功能
  }

  viewTuitionDetail(_record: TuitionRecord): void {
    // TODO: 实现查看详情
  }

  applyRefund(_record: TuitionRecord): void {
    // TODO: 实现退费申请
  }

  batchCalculateSalary(): void {
    const monthStr = this.formatMonth(this.salaryFilter.month);
    this.financeService
      .batchCalculateSalaries(this.orgId, monthStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: { message?: string }) => {
          this.snackBar.open(result?.message ?? '批量计算成功', '关闭', { duration: 3000 });
          this.loadSalaries();
        },
        error: () => {
          this.snackBar.open('批量计算失败', '关闭', { duration: 3000 });
        },
      });
  }

  paySalary(salary: TeacherSalary): void {
    this.financeService
      .paySalary(this.orgId, salary.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('薪酬发放成功', '关闭', { duration: 3000 });
          this.loadSalaries();
        },
        error: () => {
          this.snackBar.open('发放失败', '关闭', { duration: 3000 });
        },
      });
  }

  viewSalaryDetail(_salary: TeacherSalary): void {
    // TODO: 查看薪酬详情
  }

  openPricingDialog(): void {
    // TODO: 实现新增定价对话框
  }

  editPricing(_pricing: CoursePricing): void {
    // TODO: 实现编辑定价
  }

  togglePricingStatus(pricing: CoursePricing): void {
    const updated = { ...pricing, is_active: !pricing.is_active };
    this.financeService.updateCoursePricing(this.orgId, pricing.id, updated).subscribe({
      next: () => {
        this.snackBar.open('状态更新成功', '关闭', { duration: 3000 });
        pricing.is_active = updated.is_active;
      },
      error: () => {
        this.snackBar.open('更新失败', '关闭', { duration: 3000 });
      },
    });
  }

  confirmConsumption(item: CourseConsumption): void {
    this.financeService
      .confirmConsumption(this.orgId, item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('消课确认成功', '关闭', { duration: 3000 });
          this.loadConsumptions();
        },
        error: () => {
          this.snackBar.open('确认失败', '关闭', { duration: 3000 });
        },
      });
  }

  exportReport(): void {
    // TODO: 实现导出报表功能
  }

  onMonthChange(_event: unknown): void {
    this.loadSalaries();
  }

  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
