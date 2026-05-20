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
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <h1><mat-icon>insights</mat-icon> 数据看板与 BI 分析</h1>
        <div class="actions">
          <mat-form-field appearance="outline" class="time-range-selector">
            <mat-label>时间范围</mat-label>
            <mat-select [(ngModel)]="selectedTimeRange">
              <mat-option value="today">今日</mat-option>
              <mat-option value="week">本周</mat-option>
              <mat-option value="month" selected>本月</mat-option>
              <mat-option value="quarter">本季度</mat-option>
              <mat-option value="year">本年度</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            刷新
          </button>
          <button mat-raised-button color="primary" (click)="exportReport()">
            <mat-icon>download</mat-icon>
            导出报表
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="60"></mat-spinner>
        <p>正在加载经营数据...</p>
      </div>

      <!-- 主要内容 -->
      <div *ngIf="!loading" class="main-content">
        <!-- 经营总览卡片 -->
        <div class="overview-grid">
          <mat-card class="overview-card revenue-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>account_balance_wallet</mat-icon>
                本月收入
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="value">¥{{ overview?.monthlyRevenue | number: '1.0-0' }}</div>
              <div class="trend positive">
                <mat-icon>trending_up</mat-icon>
                <span>+{{ overview?.monthlyGrowth }}%</span>
                <span class="label">较上月</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card students-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>school</mat-icon>
                学员总数
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="value">{{ overview?.totalStudents | number }}</div>
              <div class="sub-value">在读 {{ overview?.activeStudents | number }} 人</div>
              <div class="trend positive">
                <mat-icon>trending_up</mat-icon>
                <span>+{{ studentStats?.newStudentsThisMonth }}</span>
                <span class="label">本月新增</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card teachers-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>group</mat-icon>
                教师总数
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="value">{{ overview?.totalTeachers | number }}</div>
              <div class="sub-value">在职 {{ overview?.activeTeachers | number }} 人</div>
              <div class="trend neutral">
                <mat-icon>remove</mat-icon>
                <span>平均评分 {{ teacherStats?.averageRating | number: '1.1' }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card courses-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>menu_book</mat-icon>
                课程总数
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="value">{{ overview?.totalCourses | number }}</div>
              <div class="sub-value">进行中 {{ overview?.runningCourses | number }} 门</div>
              <div class="trend positive">
                <mat-icon>trending_up</mat-icon>
                <span>教室使用率 {{ overview?.classroomUtilization }}%</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 预警信息 -->
        <div class="warnings-section" *ngIf="warnings.length > 0">
          <mat-card class="warnings-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>warning</mat-icon>
                数据预警
                <mat-chip [color]="'warn'" *ngIf="unreadWarnings > 0"
                  >{{ unreadWarnings }}条未读</mat-chip
                >
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="warning-list">
                <div
                  *ngFor="let warning of warnings; trackBy: trackByWarningFn"
                  class="warning-item"
                  [class.warning-high]="warning.level === 'high'"
                  [class.warning-medium]="warning.level === 'medium'"
                  [class.warning-low]="warning.level === 'low'"
                >
                  <mat-icon class="warning-icon">{{ getWarningIcon(warning.level) }}</mat-icon>
                  <div class="warning-content">
                    <div class="warning-title">{{ warning.title }}</div>
                    <div class="warning-message">{{ warning.message }}</div>
                    <div class="warning-meta">
                      <span>{{ warning.metric }}: {{ warning.currentValue | number }}</span>
                      <span class="threshold">阈值：{{ warning.thresholdValue | number }}</span>
                    </div>
                  </div>
                  <button mat-icon-button (click)="dismissWarning(warning.id)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 功能标签页 -->
        <mat-tab-group color="primary" dynamicHeight>
          <!-- 学员分析 -->
          <mat-tab label="学员分析">
            <div class="tab-content">
              <div class="charts-grid">
                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>年级分布</mat-card-title>
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
                        <div class="stat-label">{{ item.grade }}</div>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="item.percentage"
                          color="primary"
                        ></mat-progress-bar>
                        <div class="stat-value">{{ item.count }}人 ({{ item.percentage }}%)</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>学员状态</mat-card-title>
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
                  </mat-card-content>
                </mat-card>

                <mat-card class="chart-card full-width">
                  <mat-card-header>
                    <mat-card-title>关键指标</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metrics-grid">
                      <div class="metric-item">
                        <div class="metric-label">本月新增学员</div>
                        <div class="metric-value highlight">
                          {{ studentStats?.newStudentsThisMonth | number }}
                        </div>
                      </div>
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
                        {{ Math.abs(teacher.rankChange) }}
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
                        {{ Math.abs(course.rankChange) }}
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
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        height: 100%;
        overflow-y: auto;
        padding: 24px;
        background-color: #f5f5f5;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 16px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
          flex-shrink: 1;
          min-width: 0;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #1976d2;
            flex-shrink: 0;
          }
        }

        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;

          .time-range-selector {
            min-width: 150px;
          }

          button {
            white-space: nowrap !important;
            flex-shrink: 0;
            min-width: auto;

            .mat-mdc-button-persistent-ripple {
              white-space: nowrap;
            }

            span {
              white-space: nowrap;
            }
          }
        }
      }

      .loading-container {
        text-align: center;
        padding: 100px 20px;

        mat-spinner {
          margin: 0 auto 24px;
        }

        p {
          font-size: 16px;
          color: #666;
        }
      }

      .main-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .overview-card {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;

        &:hover {
          transform: translateY(-4px);
        }

        &.revenue-card {
          border-left: 4px solid #4caf50;
        }

        &.students-card {
          border-left: 4px solid #2196f3;
        }

        &.teachers-card {
          border-left: 4px solid #ff9800;
        }

        &.courses-card {
          border-left: 4px solid #9c27b0;
        }

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0;

          mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 600;

            mat-icon {
              font-size: 22px;
              width: 22px;
              height: 22px;
            }
          }
        }

        mat-card-content {
          padding: 16px !important;

          .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            line-height: 1.2;
            margin-bottom: 8px;
          }

          .sub-value {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }

            &.neutral {
              color: #999;
            }

            .label {
              font-size: 12px;
              color: #999;
              margin-left: 4px;
            }
          }
        }
      }

      .warnings-section {
        .warnings-card {
          border-left: 4px solid #ff9800;

          mat-card-header {
            mat-card-title {
              display: flex;
              align-items: center;
              gap: 12px;
            }
          }
        }

        .warning-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .warning-item {
          display: flex;
          gap: 16px;
          padding: 12px;
          border-radius: 8px;
          background-color: #fff;
          border: 1px solid #e0e0e0;

          &.warning-high {
            background-color: #ffebee;
            border-color: #f44336;
          }

          &.warning-medium {
            background-color: #fff3e0;
            border-color: #ff9800;
          }

          &.warning-low {
            background-color: #e3f2fd;
            border-color: #2196f3;
          }

          .warning-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            flex-shrink: 0;
          }

          .warning-content {
            flex: 1;

            .warning-title {
              font-size: 15px;
              font-weight: 600;
              color: #333;
              margin-bottom: 4px;
            }

            .warning-message {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
            }

            .warning-meta {
              display: flex;
              gap: 16px;
              font-size: 13px;
              color: #999;

              .threshold {
                color: #f44336;
              }
            }
          }
        }
      }

      .tab-content {
        padding: 24px 0;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 16px;

        .full-width {
          grid-column: 1 / -1;
        }
      }

      .chart-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0;

          mat-card-title {
            font-size: 16px;
            font-weight: 600;
          }
        }

        mat-card-content {
          padding: 16px !important;
        }
      }

      .stat-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .stat-item {
          .stat-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          mat-progress-bar {
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 13px;
            color: #333;
          }
        }
      }

      .status-circles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;

        .status-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border: 3px solid;
          border-radius: 12px;
          text-align: center;

          .circle-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .circle-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }

          .circle-count {
            font-size: 13px;
            color: #999;
          }
        }
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .metric-item {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          text-align: center;

          .metric-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;

            &.highlight {
              color: #2196f3;
            }

            &.positive {
              color: #4caf50;
            }
          }
        }
      }

      .ranking-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }

      .ranking-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        &.top-3 {
          border: 2px solid;

          &.gold {
            border-color: #ffd700;
            background-color: #fffde7;
          }

          &.silver {
            border-color: #c0c0c0;
            background-color: #f5f5f5;
          }

          &.bronze {
            border-color: #cd7f32;
            background-color: #fff3e0;
          }
        }

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0;

          mat-card-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;

            .rank-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              font-weight: bold;
              font-size: 14px;

              &.gold {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
              }

              &.silver {
                background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
                color: #333;
              }

              &.bronze {
                background: linear-gradient(135deg, #cd7f32, #e8a87c);
                color: #fff;
              }
            }

            .rank-change {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              font-weight: 600;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }

              &.up {
                color: #4caf50;
              }

              &.down {
                color: #f44336;
              }
            }
          }
        }

        mat-card-content {
          padding: 16px !important;

          .teacher-info {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;

            .teacher-avatar {
              mat-icon {
                font-size: 48px;
                width: 48px;
                height: 48px;
                color: #999;
              }
            }

            .teacher-details {
              .teacher-name {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
              }

              .teacher-dept {
                font-size: 14px;
                color: #666;
              }
            }
          }

          .teacher-stats {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .stat-row {
              display: flex;
              justify-content: space-between;
              padding: 8px;
              background-color: #f5f5f5;
              border-radius: 4px;
              font-size: 14px;

              .stat-label {
                color: #666;
              }

              .stat-value {
                font-weight: 600;
                color: #333;

                &.rating {
                  color: #ff9800;
                }
              }

              &.highlight {
                background-color: #e8f5e9;

                .stat-value {
                  color: #2e7d32;
                }
              }
            }
          }
        }
      }

      .course-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }

      .course-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        &.top-3 {
          border: 2px solid;

          &.gold {
            border-color: #ffd700;
            background-color: #fffde7;
          }

          &.silver {
            border-color: #c0c0c0;
            background-color: #f5f5f5;
          }

          &.bronze {
            border-color: #cd7f32;
            background-color: #fff3e0;
          }
        }

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0;

          mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        mat-card-content {
          padding: 16px !important;

          .course-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .course-name {
              font-size: 16px;
              font-weight: 600;
              color: #333;
              flex: 1;
            }
          }

          .course-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;

            .stat-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px;
              background-color: #f5f5f5;
              border-radius: 4px;
              font-size: 14px;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
                color: #999;
              }

              &.growth {
                color: #4caf50;

                mat-icon {
                  color: #4caf50;
                }
              }

              &.revenue {
                color: #2196f3;

                mat-icon {
                  color: #2196f3;
                }
              }
            }
          }
        }
      }

      .finance-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 16px;
      }

      .finance-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        mat-card-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0;

          mat-card-title {
            font-size: 16px;
            font-weight: 600;
          }
        }

        mat-card-content {
          padding: 16px !important;

          .finance-metrics {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .finance-item {
              text-align: center;

              .label {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
              }

              .value {
                font-size: 24px;
                font-weight: bold;

                &.revenue {
                  color: #4caf50;
                }

                &.expense {
                  color: #ff9800;
                }

                &.profit {
                  color: #2196f3;
                }

                &.receivable {
                  color: #f44336;
                }
              }

              .rate {
                font-size: 13px;
                color: #999;
                margin-top: 4px;
              }

              &.warning {
                .value {
                  animation: pulse 2s infinite;
                }
              }
            }

            .divider {
              height: 1px;
              background-color: #e0e0e0;
              margin: 8px 0;
            }
          }

          .expense-categories {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .category-item {
              .category-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;

                .category-name {
                  font-size: 14px;
                  color: #333;
                  font-weight: 600;
                }

                .category-percentage {
                  font-size: 14px;
                  color: #666;
                  font-weight: 600;
                }
              }

              mat-progress-bar {
                margin-bottom: 4px;
              }

              .category-amount {
                font-size: 13px;
                color: #999;
              }
            }
          }
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      /* 响应式调整 */
      @media (max-width: 768px) {
        .toolbar {
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;

          .actions {
            flex-wrap: wrap;
            width: 100%;
          }
        }

        .overview-grid {
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
