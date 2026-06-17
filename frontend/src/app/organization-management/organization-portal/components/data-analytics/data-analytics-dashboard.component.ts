/**
 * 数据看板仪表盘组件
 *
 * @fileoverview 经营数据总览、统计分析、趋势预测的可视化展示
 * @author AI Assistant
 * @date 2026-04-02
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';

import {
  BusinessOverview,
  CategoryDistribution,
  CourseStats,
  DataWarning,
  FinanceStats,
  GradeDistribution,
  PopularCourse,
  StatusDistribution,
  StudentStats,
  TeacherPerformance,
  TeacherStats,
} from '../../models/data-analytics.models';
import { DataAnalyticsService } from '../../services/data-analytics.service';

@Component({
  selector: 'app-data-analytics-dashboard',
  template: `
    <div class="dashboard-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-left">
            <div class="title-section">
              <h1>
                <mat-icon class="title-icon">insights</mat-icon>
                <span class="title-text">数据看板与 BI 分析</span>
              </h1>
              <p class="subtitle">实时监控机构经营数据，智能洞察业务趋势</p>
            </div>
          </div>
          <div class="header-actions">
            <mat-form-field appearance="outline" class="time-selector" subscriptSizing="dynamic">
              <mat-label>时间范围</mat-label>
              <mat-select [(ngModel)]="selectedTimeRange">
                <mat-option value="today">今日</mat-option>
                <mat-option value="week">本周</mat-option>
                <mat-option value="month">本月</mat-option>
                <mat-option value="quarter">本季度</mat-option>
                <mat-option value="year">本年度</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button class="action-btn" (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              <span>刷新数据</span>
            </button>
            <button mat-flat-button color="primary" class="action-btn primary-btn" (click)="exportReport()">
              <mat-icon>download</mat-icon>
              <span>导出报表</span>
            </button>
          </div>
        </div>
      </header>

      <!-- 加载状态 -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="60"></mat-spinner>
        <p>正在加载经营数据...</p>
      </div>

      <!-- 主要内容 -->
      <div *ngIf="!loading" class="main-content">
        <!-- KPI 核心指标卡片 -->
        <section class="kpi-section">
          <div class="section-header">
            <h2 class="section-title">
              <mat-icon>trending_up</mat-icon>
              <span>核心经营指标</span>
            </h2>
            <span class="section-badge">实时更新</span>
          </div>
          <div class="overview-grid">
            <mat-card class="kpi-card revenue-card">
              <div class="kpi-icon-wrapper">
                <mat-icon class="kpi-icon">account_balance_wallet</mat-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">本月收入</div>
                <div class="kpi-value">¥{{ overview?.monthlyRevenue | number: '1.0-0' }}</div>
                <div class="kpi-trend positive">
                  <mat-icon>trending_up</mat-icon>
                  <span class="trend-value">+{{ overview?.monthlyGrowth }}%</span>
                  <span class="trend-label">较上月</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="kpi-card students-card">
              <div class="kpi-icon-wrapper">
                <mat-icon class="kpi-icon">school</mat-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">学员总数</div>
                <div class="kpi-value">{{ overview?.totalStudents | number }}</div>
                <div class="kpi-meta">
                  <span class="meta-item">在读 {{ overview?.activeStudents | number }} 人</span>
                </div>
                <div class="kpi-trend positive">
                  <mat-icon>person_add</mat-icon>
                  <span class="trend-value">+{{ studentStats?.newStudentsThisMonth }}</span>
                  <span class="trend-label">本月新增</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="kpi-card teachers-card">
              <div class="kpi-icon-wrapper">
                <mat-icon class="kpi-icon">group</mat-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">教师团队</div>
                <div class="kpi-value">{{ overview?.totalTeachers | number }}</div>
                <div class="kpi-meta">
                  <span class="meta-item">在职 {{ overview?.activeTeachers | number }} 人</span>
                </div>
                <div class="kpi-trend neutral">
                  <mat-icon>star</mat-icon>
                  <span class="trend-value">{{ teacherStats?.averageRating | number: '1.1' }}</span>
                  <span class="trend-label">平均评分</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="kpi-card courses-card">
              <div class="kpi-icon-wrapper">
                <mat-icon class="kpi-icon">menu_book</mat-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">课程体系</div>
                <div class="kpi-value">{{ overview?.totalCourses | number }}</div>
                <div class="kpi-meta">
                  <span class="meta-item">进行中 {{ overview?.runningCourses | number }} 门</span>
                </div>
                <div class="kpi-trend positive">
                  <mat-icon>check_circle</mat-icon>
                  <span class="trend-value">{{ overview?.classroomUtilization }}%</span>
                  <span class="trend-label">教室使用率</span>
                </div>
              </div>
            </mat-card>
          </div>
        </section>

        <!-- 智能预警中心 -->
        <section class="alerts-section" *ngIf="warnings.length > 0">
          <div class="section-header">
            <h2 class="section-title">
              <mat-icon>notifications_active</mat-icon>
              <span>智能预警中心</span>
            </h2>
            <mat-chip-set class="alert-badge" *ngIf="unreadWarnings > 0">
              <mat-chip color="warn" highlighted>
                <mat-icon>warning</mat-icon>
                {{ unreadWarnings }}条未读
              </mat-chip>
            </mat-chip-set>
          </div>
          <div class="alerts-grid">
            <div
              *ngFor="let warning of warnings; trackBy: trackByWarningFn"
              class="alert-card"
              [class.alert-critical]="warning.level === 'critical'"
              [class.alert-high]="warning.level === 'high'"
              [class.alert-medium]="warning.level === 'medium'"
              [class.alert-low]="warning.level === 'low'"
            >
              <div class="alert-header">
                <div class="alert-icon-wrapper">
                  <mat-icon class="alert-icon">{{ getWarningIcon(warning.level) }}</mat-icon>
                </div>
                <div class="alert-info">
                  <h3 class="alert-title">{{ warning.title }}</h3>
                  <p class="alert-message">{{ warning.message }}</p>
                </div>
                <button mat-icon-button class="dismiss-btn" (click)="dismissWarning(warning.id)" matTooltip="忽略此预警">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="alert-footer">
                <div class="alert-metric">
                  <span class="metric-label">当前值</span>
                  <span class="metric-value">{{ warning.metric }}: {{ warning.currentValue | number }}</span>
                </div>
                <div class="alert-threshold">
                  <span class="threshold-label">阈值</span>
                  <span class="threshold-value">{{ warning.thresholdValue | number }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 功能标签页 -->
        <section class="analytics-section">
          <mat-tab-group color="primary" dynamicHeight class="modern-tabs">
            <!-- 学员分析 -->
            <mat-tab>
              <ng-template mat-tab-label>
                <div class="tab-label">
                  <mat-icon>people</mat-icon>
                  <span>学员分析</span>
                </div>
              </ng-template>
              <div class="tab-content">
                <div class="charts-grid">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>school</mat-icon>
                        <span>年级分布</span>
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="stat-list">
                        <div
                          *ngFor="
                            let item of studentStats?.gradeDistribution;
                            trackBy: trackByGradeFn
                          "
                          class="stat-item"
                        >
                          <div class="stat-header">
                            <span class="stat-label">{{ item.grade }}</span>
                            <span class="stat-percentage">{{ item.percentage }}%</span>
                          </div>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="item.percentage"
                            color="primary"
                          ></mat-progress-bar>
                          <div class="stat-count">{{ item.count }}人</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>analytics</mat-icon>
                      <span>学员状态</span>
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="status-circles">
                      <div
                        *ngFor="
                          let item of studentStats?.statusDistribution;
                          trackBy: trackByStatusFn
                        "
                        class="status-circle"
                        [style.borderColor]="item.color"
                      >
                        <div class="circle-value" [style.color]="item.color">
                          {{ item.percentage }}%
                        </div>
                        <div class="circle-label">{{ item.label }}</div>
                        <div class="circle-count">{{ item.count }}人</div>
                      </div>
                    </div>
                    <div class="metrics-grid" style="margin-top: 24px;">
                      <div class="metric-item">
                        <div class="metric-label">学员增长率</div>
                        <div class="metric-value positive">
                          +{{ studentStats?.studentGrowthRate }}%
                        </div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-label">续费率</div>
                        <div class="metric-value positive">{{ studentStats?.retentionRate }}%</div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-label">平均出勤率</div>
                        <div class="metric-value">{{ studentStats?.averageAttendance }}%</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- 教师绩效 -->
          <mat-tab label="教师绩效">
            <div class="tab-content">
              <div class="ranking-list">
                <mat-card
                  *ngFor="let teacher of teacherStats?.topTeachers; trackBy: trackByTeacherFn"
                  class="ranking-card"
                  [class.top-3]="teacher.rank <= 3"
                >
                  <mat-card-header>
                    <mat-card-title>
                      <span
                        class="rank-badge"
                        [class.gold]="teacher.rank === 1"
                        [class.silver]="teacher.rank === 2"
                        [class.bronze]="teacher.rank === 3"
                      >
                        #{{ teacher.rank }}
                      </span>
                      <span
                        class="rank-change"
                        *ngIf="teacher.rankChange !== 0"
                        [class.up]="teacher.rankChange > 0"
                        [class.down]="teacher.rankChange < 0"
                      >
                        <mat-icon>{{
                          teacher.rankChange > 0 ? 'arrow_upward' : 'arrow_downward'
                        }}</mat-icon>
                        {{ getAbsValue(teacher.rankChange) }}
                      </span>
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="teacher-info">
                      <div class="teacher-avatar">
                        <mat-icon>account_circle</mat-icon>
                      </div>
                      <div class="teacher-details">
                        <div class="teacher-name">{{ teacher.name }}</div>
                        <div class="teacher-dept">{{ teacher.department }}</div>
                      </div>
                    </div>
                    <div class="teacher-stats">
                      <div class="stat-row">
                        <span class="stat-label">课时数</span>
                        <span class="stat-value">{{ teacher.courseCount }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">学员数</span>
                        <span class="stat-value">{{ teacher.studentCount | number }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">评分</span>
                        <span class="stat-value rating"
                          >{{ teacher.rating | number: '1.1' }}⭐</span
                        >
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">出勤率</span>
                        <span class="stat-value">{{ teacher.attendanceRate }}%</span>
                      </div>
                      <div class="stat-row highlight">
                        <span class="stat-label">创造收入</span>
                        <span class="stat-value"
                          >¥{{ teacher.revenue / 10000 | number: '1.0-0' }}万</span
                        >
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- 课程热度 -->
          <mat-tab label="课程热度">
            <div class="tab-content">
              <div class="course-list">
                <mat-card
                  *ngFor="let course of courseStats?.popularCourses; trackBy: trackByCourseFn"
                  class="course-card"
                  [class.top-3]="course.rank <= 3"
                >
                  <mat-card-header>
                    <mat-card-title>
                      <span
                        class="rank-badge"
                        [class.gold]="course.rank === 1"
                        [class.silver]="course.rank === 2"
                        [class.bronze]="course.rank === 3"
                      >
                        #{{ course.rank }}
                      </span>
                      <span
                        class="rank-change"
                        *ngIf="course.rankChange !== 0"
                        [class.up]="course.rankChange > 0"
                        [class.down]="course.rankChange < 0"
                      >
                        <mat-icon>{{
                          course.rankChange > 0 ? 'arrow_upward' : 'arrow_downward'
                        }}</mat-icon>
                        {{ getAbsValue(course.rankChange) }}
                      </span>
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="course-header">
                      <div class="course-name">{{ course.name }}</div>
                      <mat-chip [color]="'primary'">{{ course.type }}</mat-chip>
                    </div>
                    <div class="course-stats">
                      <div class="stat-item">
                        <mat-icon>people</mat-icon>
                        <span>{{ course.studentCount | number }}人</span>
                      </div>
                      <div class="stat-item">
                        <mat-icon>star</mat-icon>
                        <span>{{ course.rating | number: '1.1' }}</span>
                      </div>
                      <div class="stat-item growth" *ngIf="course.growth > 0">
                        <mat-icon>trending_up</mat-icon>
                        <span>+{{ course.growth }}%</span>
                      </div>
                      <div class="stat-item revenue">
                        <mat-icon>account_balance_wallet</mat-icon>
                        <span>¥{{ course.revenue / 10000 | number: '1.0-0' }}万</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- 财务分析 -->
          <mat-tab label="财务分析">
            <div class="tab-content">
              <div class="finance-overview">
                <mat-card class="finance-card">
                  <mat-card-header>
                    <mat-card-title>月度收支概况</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="finance-metrics">
                      <div class="finance-item">
                        <div class="label">本月收入</div>
                        <div class="value revenue">
                          ¥{{ financeStats?.monthlyRevenue | number: '1.0-0' }}
                        </div>
                      </div>
                      <div class="divider"></div>
                      <div class="finance-item">
                        <div class="label">本月支出</div>
                        <div class="value expense">
                          ¥{{ financeStats?.monthlyExpense | number: '1.0-0' }}
                        </div>
                      </div>
                      <div class="divider"></div>
                      <div class="finance-item">
                        <div class="label">净利润</div>
                        <div class="value profit">
                          ¥{{ financeStats?.monthlyProfit | number: '1.0-0' }}
                        </div>
                        <div class="rate">利润率 {{ financeStats?.profitMargin }}%</div>
                      </div>
                      <div class="divider"></div>
                      <div class="finance-item warning" *ngIf="financeStats?.receivables">
                        <div class="label">待收款</div>
                        <div class="value receivable">
                          ¥{{ financeStats?.receivables | number: '1.0-0' }}
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="finance-card">
                  <mat-card-header>
                    <mat-card-title>支出分类</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="expense-categories">
                      <div
                        *ngFor="
                          let item of financeStats?.categoryDistribution;
                          trackBy: trackByCategoryFn
                        "
                        class="category-item"
                      >
                        <div class="category-header">
                          <span class="category-name">{{ item.category }}</span>
                          <span class="category-percentage">{{ item.percentage }}%</span>
                        </div>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="item.percentage"
                          [color]="getExpenseCategoryColor(item.category)"
                        ></mat-progress-bar>
                        <div class="category-amount">
                          ¥{{ item.amount / 10000 | number: '1.0-0' }}万
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </section>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      /* ============================================
         数据看板 - 专业 UI/UX 设计系统
         Design System: MatuX Analytics Dashboard
         ============================================ */

      /* 全局容器 */
      .dashboard-container {
        min-height: 100%;
        background: linear-gradient(180deg, $color-neutral-50 0%, $card-bg 100%);
        padding: 32px;
      }

      /* ============================================
         页面头部区域
         ============================================ */
      .page-header {
        margin-bottom: 32px;
        background: $card-bg;
        border-radius: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
        border: 1px solid $color-neutral-200;
        overflow: hidden;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 28px 32px;
        gap: 24px;
      }

      .header-left {
        flex: 1;
      }

      .title-section h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: $color-neutral-900;
        letter-spacing: -0.5px;
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: $color-brand-primary;
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: $color-neutral-500;
        font-weight: 400;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .time-selector {
        min-width: 140px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
      }

      .primary-btn {
        background: linear-gradient(135deg, $color-brand-primary 0%, $color-brand-primary-dark 100%);
        box-shadow: 0 2px 8px rgba(0, 102, 255, 0.2);
      }

      .primary-btn:hover {
        box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
      }

      /* ============================================
         区块标题
         ============================================ */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .section-title mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: $color-brand-primary;
      }

      .section-badge {
        padding: 4px 12px;
        background: linear-gradient(135deg, $color-stem-green 0%, #00A84D 100%);
        color: white;
        font-size: $font-size-xs;
        font-weight: 600;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
      }

      /* ============================================
         KPI 核心指标卡片
         ============================================ */
      .kpi-section {
        margin-bottom: 32px;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }

      .kpi-card {
        position: relative;
        background: $card-bg;
        border-radius: 16px;
        padding: 24px;
        border: 1px solid $color-neutral-200;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .kpi-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--accent-color) 0%, var(--accent-light) 100%);
        opacity: 0;
        transition: opacity 0.3s;
      }

      .kpi-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
      }

      .kpi-card:hover::before {
        opacity: 1;
      }

      .kpi-card.revenue-card {
        --accent-color: $color-stem-green;
        --accent-light: #6EE7B7;
      }

      .kpi-card.students-card {
        --accent-color: $color-brand-primary;
        --accent-light: $color-brand-primary;
      }

      .kpi-card.teachers-card {
        --accent-color: $color-warning;
        --accent-light: #FBBF24;
      }

      .kpi-card.courses-card {
        --accent-color: $color-brand-primary;
        --accent-light: $color-brand-primary-bg;
      }

      .kpi-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-light) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .kpi-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      .kpi-label {
        font-size: 13px;
        font-weight: 500;
        color: $color-neutral-500;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .kpi-value {
        font-size: 32px;
        font-weight: 700;
        color: $color-neutral-900;
        line-height: 1;
        margin-bottom: 12px;
        letter-spacing: -1px;
      }

      .kpi-meta {
        margin-bottom: 12px;
      }

      .meta-item {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
      }

      .kpi-trend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 12px;
        border-radius: 8px;
        background: $color-neutral-50;
      }

      .kpi-trend mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .kpi-trend.positive {
        color: $color-stem-green;
        background: $color-stem-green-bg;
      }

      .kpi-trend.negative {
        color: $color-error;
        background: $color-error-light;
      }

      .kpi-trend.neutral {
        color: $color-neutral-500;
        background: $color-neutral-100;
      }

      .trend-value {
        font-weight: 700;
      }

      .trend-label {
        font-weight: 400;
        color: $color-neutral-400;
      }

      /* ============================================
         智能预警中心
         ============================================ */
      .alerts-section {
        margin-bottom: 32px;
      }

      .alert-badge {
        margin-left: auto;
      }

      .alerts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }

      .alert-card {
        background: $card-bg;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid $color-neutral-200;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.2s;
      }

      .alert-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .alert-card.alert-critical {
        border-left: 4px solid $color-error;
        background: linear-gradient(to right, $color-error-light 0%, white 100%);
      }

      .alert-card.alert-high {
        border-left: 4px solid $color-error;
        background: linear-gradient(to right, $color-error-light 0%, white 100%);
      }

      .alert-card.alert-medium {
        border-left: 4px solid $color-warning;
        background: linear-gradient(to right, $color-warning-light 0%, white 100%);
      }

      .alert-card.alert-low {
        border-left: 4px solid $color-brand-primary;
        background: linear-gradient(to right, $color-brand-primary-bg 0%, white 100%);
      }

      .alert-header {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .alert-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .alert-critical .alert-icon-wrapper,
      .alert-high .alert-icon-wrapper {
        background: $color-error-light-2;
      }

      .alert-medium .alert-icon-wrapper {
        background: $color-warning-light;
      }

      .alert-low .alert-icon-wrapper {
        background: #DBEAFE;
      }

      .alert-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .alert-critical .alert-icon,
      .alert-high .alert-icon {
        color: $color-error;
      }

      .alert-medium .alert-icon {
        color: #D97706;
      }

      .alert-low .alert-icon {
        color: #2563EB;
      }

      .alert-info {
        flex: 1;
        min-width: 0;
      }

      .alert-title {
        margin: 0 0 6px 0;
        font-size: 15px;
        font-weight: 600;
        color: $color-neutral-900;
        line-height: 1.4;
      }

      .alert-message {
        margin: 0;
        font-size: 13px;
        color: $color-neutral-500;
        line-height: 1.5;
      }

      .dismiss-btn {
        flex-shrink: 0;
      }

      .alert-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid $color-neutral-100;
        gap: 16px;
      }

      .alert-metric,
      .alert-threshold {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .metric-label,
      .threshold-label {
        font-size: 11px;
        font-weight: 500;
        color: $color-neutral-400;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value,
      .threshold-value {
        font-size: 14px;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .threshold-value {
        color: $color-error;
      }

      /* ============================================
         标签页区域
         ============================================ */
      .analytics-section {
        margin-top: 32px;
      }

      ::ng-deep .modern-tabs {
        background: transparent;
      }

      ::ng-deep .modern-tabs .mat-mdc-tab-header {
        background: $card-bg;
        border-radius: 12px 12px 0 0;
        border: 1px solid $color-neutral-200;
        border-bottom: none;
        padding: 0 8px;
      }

      ::ng-deep .modern-tabs .mat-mdc-tab {
        min-width: 140px;
        padding: 0 20px;
        height: 56px;
      }

      .tab-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 14px;
      }

      .tab-label mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      ::ng-deep .modern-tabs .mat-mdc-tab-body-wrapper {
        background: $card-bg;
        border: 1px solid $color-neutral-200;
        border-radius: 0 0 12px 12px;
        border-top: none;
      }

      .tab-content {
        padding: 24px;
      }

      /* ============================================
         图表卡片
         ============================================ */
      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .chart-card.full-width {
        grid-column: 1 / -1;
      }

      .chart-card {
        background: $card-bg;
        border-radius: 12px;
        border: 1px solid $color-neutral-200;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.2s;
      }

      .chart-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .chart-card mat-card-header {
        padding: 20px 24px !important;
        border-bottom: 1px solid $color-neutral-100;
      }

      .chart-card mat-card-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .chart-card mat-card-title mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: $color-brand-primary;
      }

      .chart-card mat-card-content {
        padding: 24px !important;
      }

      /* ============================================
         统计列表
         ============================================ */
      .stat-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .stat-item {
        padding: 16px;
        background: $color-neutral-50;
        border-radius: 10px;
        transition: all 0.2s;
      }

      .stat-item:hover {
        background: $color-neutral-100;
      }

      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .stat-label {
        font-size: 14px;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .stat-percentage {
        font-size: 14px;
        font-weight: 700;
        color: $color-brand-primary;
      }

      ::ng-deep .stat-item mat-progress-bar {
        margin-bottom: 8px;
        border-radius: 4px;
      }

      .stat-count {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
      }

      /* ============================================
         状态圆形图
         ============================================ */
      .status-circles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;
      }

      .status-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px;
        border: 3px solid;
        border-radius: 16px;
        text-align: center;
        transition: all 0.2s;
      }

      .status-circle:hover {
        transform: scale(1.05);
      }

      .circle-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
        line-height: 1;
      }

      .circle-label {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .circle-count {
        font-size: $font-size-xs;
        color: $color-neutral-400;
        font-weight: 600;
      }

      /* ============================================
         关键指标网格
         ============================================ */
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .metric-item {
        padding: 20px;
        background: linear-gradient(135deg, $color-neutral-50 0%, $color-neutral-100 100%);
        border-radius: 12px;
        text-align: center;
        border: 1px solid $color-neutral-200;
        transition: all 0.2s;
      }

      .metric-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      .metric-label {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
        margin-bottom: 10px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: 700;
        color: $color-neutral-900;
        letter-spacing: -0.5px;
      }

      .metric-value.highlight {
        color: $color-brand-primary;
      }

      .metric-value.positive {
        color: $color-stem-green;
      }

      /* ============================================
         排名卡片
         ============================================ */
      .ranking-list,
      .course-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 20px;
      }

      .ranking-card,
      .course-card {
        background: $card-bg;
        border-radius: 12px;
        border: 1px solid $color-neutral-200;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.2s;
      }

      .ranking-card:hover,
      .course-card:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .ranking-card.top-3,
      .course-card.top-3 {
        border-width: 2px;
      }

      .ranking-card.top-3.gold,
      .course-card.top-3.gold {
        border-color: #FCD34D;
        background: linear-gradient(135deg, $color-warning-light 0%, white 100%);
      }

      .ranking-card.top-3.silver,
      .course-card.top-3.silver {
        border-color: #D1D5DB;
        background: linear-gradient(135deg, #F9FAFB 0%, white 100%);
      }

      .ranking-card.top-3.bronze,
      .course-card.top-3.bronze {
        border-color: #FDBA74;
        background: linear-gradient(135deg, #FFF7ED 0%, white 100%);
      }

      .ranking-card mat-card-header,
      .course-card mat-card-header {
        padding: 20px 24px !important;
        border-bottom: 1px solid $color-neutral-100;
      }

      .ranking-card mat-card-title,
      .course-card mat-card-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .rank-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .rank-badge.gold {
        background: linear-gradient(135deg, #FCD34D 0%, #FDE68A 100%);
        color: #78350F;
      }

      .rank-badge.silver {
        background: linear-gradient(135deg, #D1D5DB 0%, #E5E7EB 100%);
        color: #374151;
      }

      .rank-badge.bronze {
        background: linear-gradient(135deg, #FDBA74 0%, #FED7AA 100%);
        color: #9A3412;
      }

      .rank-change {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
      }

      .rank-change mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .rank-change.up {
        color: $color-stem-green;
      }

      .rank-change.down {
        color: $color-error;
      }

      .ranking-card mat-card-content,
      .course-card mat-card-content {
        padding: 24px !important;
      }

      /* ============================================
         教师信息
         ============================================ */
      .teacher-info {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 20px;
      }

      .teacher-avatar mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #CBD5E1;
      }

      .teacher-details .teacher-name {
        font-size: 16px;
        font-weight: 600;
        color: $color-neutral-900;
        margin-bottom: 4px;
      }

      .teacher-details .teacher-dept {
        font-size: 13px;
        color: $color-neutral-500;
      }

      .teacher-stats {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        background: $color-neutral-50;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .stat-row:hover {
        background: $color-neutral-100;
      }

      .stat-row .stat-label {
        color: $color-neutral-500;
        font-weight: 500;
      }

      .stat-row .stat-value {
        font-weight: 600;
        color: $color-neutral-900;
      }

      .stat-row .stat-value.rating {
        color: $color-warning;
      }

      .stat-row.highlight {
        background: linear-gradient(135deg, $color-stem-green-bg 0%, #D1FAE5 100%);
        border: 1px solid #A7F3D0;
      }

      .stat-row.highlight .stat-value {
        color: #00A84D;
      }

      /* ============================================
         课程卡片
         ============================================ */
      .course-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        gap: 12px;
      }

      .course-name {
        font-size: 16px;
        font-weight: 600;
        color: $color-neutral-900;
        flex: 1;
      }

      .course-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .course-stats .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: $color-neutral-50;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: $color-neutral-500;
      }

      .course-stats .stat-item mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: $color-neutral-400;
      }

      .course-stats .stat-item.growth {
        color: $color-stem-green;
        background: $color-stem-green-bg;
      }

      .course-stats .stat-item.growth mat-icon {
        color: $color-stem-green;
      }

      .course-stats .stat-item.revenue {
        color: $color-brand-primary;
        background: $color-brand-primary-bg;
      }

      .course-stats .stat-item.revenue mat-icon {
        color: $color-brand-primary;
      }

      /* ============================================
         财务概览
         ============================================ */
      .finance-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .finance-card {
        background: $card-bg;
        border-radius: 12px;
        border: 1px solid $color-neutral-200;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .finance-card mat-card-header {
        padding: 20px 24px !important;
        border-bottom: 1px solid $color-neutral-100;
      }

      .finance-card mat-card-title {
        font-size: 16px;
        font-weight: 600;
        color: $color-neutral-900;
      }

      .finance-card mat-card-content {
        padding: 24px !important;
      }

      .finance-metrics {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .finance-item {
        text-align: center;
        padding: 16px;
        background: $color-neutral-50;
        border-radius: 10px;
      }

      .finance-item .label {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .finance-item .value {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .finance-item .value.revenue {
        color: $color-stem-green;
      }

      .finance-item .value.expense {
        color: $color-warning;
      }

      .finance-item .value.profit {
        color: $color-brand-primary;
      }

      .finance-item .value.receivable {
        color: $color-error;
      }

      .finance-item .rate {
        font-size: 13px;
        color: $color-neutral-400;
        margin-top: 6px;
        font-weight: 500;
      }

      .finance-item.warning .value {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .divider {
        height: 1px;
        background: $color-neutral-200;
        margin: 8px 0;
      }

      .expense-categories {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .category-item {
        padding: 16px;
        background: $color-neutral-50;
        border-radius: 10px;
      }

      .category-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .category-name {
        font-size: 14px;
        color: $color-neutral-900;
        font-weight: 600;
      }

      .category-percentage {
        font-size: 14px;
        color: $color-brand-primary;
        font-weight: 700;
      }

      ::ng-deep .category-item mat-progress-bar {
        margin-bottom: 8px;
        border-radius: 4px;
      }

      .category-amount {
        font-size: 13px;
        color: $color-neutral-500;
        font-weight: 500;
      }

      /* ============================================
         加载状态
         ============================================ */
      .loading-container {
        text-align: center;
        padding: 120px 20px;
      }

      .loading-container mat-spinner {
        margin: 0 auto 24px;
      }

      .loading-container p {
        font-size: 15px;
        color: $color-neutral-500;
        font-weight: 500;
      }

      /* ============================================
         响应式设计
         ============================================ */
      @media (max-width: 1024px) {
        .dashboard-container {
          padding: 24px;
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .overview-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .alerts-grid {
          grid-template-columns: 1fr;
        }

        .charts-grid {
          grid-template-columns: 1fr;
        }

        .ranking-list,
        .course-list {
          grid-template-columns: 1fr;
        }

        .finance-overview {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .dashboard-container {
          padding: 16px;
        }

        .header-content {
          padding: 20px;
        }

        .title-section h1 {
          font-size: 20px;
        }

        .overview-grid {
          grid-template-columns: 1fr;
        }

        .kpi-value {
          font-size: 28px;
        }

        .metrics-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .status-circles {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
})
export class DataAnalyticsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  overview: BusinessOverview | null = null;
  studentStats: StudentStats | null = null;
  teacherStats: TeacherStats | null = null;
  courseStats: CourseStats | null = null;
  financeStats: FinanceStats | null = null;
  warnings: DataWarning[] = [];
  selectedTimeRange = 'month';

  Math = Math; // 模板中使用

  constructor(private analyticsService: DataAnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    // 并行加载所有数据
    this.analyticsService.getBusinessOverview().subscribe((data) => {
      this.overview = data;
      this.checkLoadingComplete();
    });

    this.analyticsService.getStudentStats().subscribe((data) => {
      this.studentStats = data;
      this.checkLoadingComplete();
    });

    this.analyticsService.getTeacherStats().subscribe((data) => {
      this.teacherStats = data;
      this.checkLoadingComplete();
    });

    this.analyticsService.getCourseStats().subscribe((data) => {
      this.courseStats = data;
      this.checkLoadingComplete();
    });

    this.analyticsService.getFinanceStats().subscribe((data) => {
      this.financeStats = data;
      this.checkLoadingComplete();
    });

    this.analyticsService.getWarnings(true).subscribe((data) => {
      this.warnings = data;
      this.checkLoadingComplete();
    });
  }

  checkLoadingComplete(): void {
    if (
      this.overview &&
      this.studentStats &&
      this.teacherStats &&
      this.courseStats &&
      this.financeStats
    ) {
      this.loading = false;
    }
  }

  refreshData(): void {
    this.loadData();
  }

  exportReport(): void {
    // TODO: 实现导出功能
    // eslint-disable-next-line no-console
    console.log('导出报表');
  }

  dismissWarning(warningId: number): void {
    this.analyticsService.markWarningAsRead(warningId).subscribe(() => {
      this.warnings = this.warnings.filter((w) => w.id !== warningId);
    });
  }

  getWarningIcon(level: string): string {
    switch (level) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'warning';
    }
  }

  getExpenseCategoryColor(category: string): 'primary' | 'accent' | 'warn' {
    if (category.includes('薪酬')) return 'primary';
    if (category.includes('租金')) return 'accent';
    if (category.includes('设备')) return 'warn';
    return 'primary';
  }

  getAbsValue(value: number): number {
    return Math.abs(value);
  }

  trackByWarningFn(index: number, warning: DataWarning): number {
    return warning.id;
  }

  trackByGradeFn(index: number, grade: GradeDistribution): string {
    return grade.grade;
  }

  trackByStatusFn(index: number, status: StatusDistribution): string {
    return status.status;
  }

  trackByTeacherFn(index: number, teacher: TeacherPerformance): number {
    return teacher.id;
  }

  trackByCourseFn(index: number, course: PopularCourse): number {
    return course.id;
  }

  trackByCategoryFn(index: number, category: CategoryDistribution): string {
    return category.category;
  }

  get unreadWarnings(): number {
    return this.warnings.filter((w) => !w.isRead).length;
  }
}
