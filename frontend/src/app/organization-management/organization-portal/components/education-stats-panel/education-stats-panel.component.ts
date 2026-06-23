import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { CourseStats, EnrollmentStats, OrgOverview } from '@app/core/services/org-admin.service';

@Component({
  selector: 'app-education-stats-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="education-section">
      <div class="section-header">
        <h2>教育场景模块</h2>
        <div class="section-actions">
          <button mat-raised-button color="primary" (click)="onRefresh()">
            <mat-icon>refresh</mat-icon>
            刷新数据
          </button>
        </div>
      </div>

      <!-- 核心统计卡片 - 4列横向排列，方形卡片 -->
      <div class="core-stats-grid">
        <mat-card class="stat-card square-card">
          <mat-card-content>
            <div class="stat-icon students">
              <mat-icon>school</mat-icon>
            </div>
            <div class="stat-value">{{ overview?.studentCount }}</div>
            <div class="stat-label">总学员数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card square-card">
          <mat-card-content>
            <div class="stat-icon teachers">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-value">{{ overview?.teacherCount }}</div>
            <div class="stat-label">在读学员</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card square-card">
          <mat-card-content>
            <div class="stat-icon courses">
              <mat-icon>class</mat-icon>
            </div>
            <div class="stat-value">{{ overview?.activeCourses }}</div>
            <div class="stat-label">已毕业</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card square-card">
          <mat-card-content>
            <div class="stat-icon members">
              <mat-icon>group</mat-icon>
            </div>
            <div class="stat-value">{{ overview?.activeMembers }}</div>
            <div class="stat-label">总课程数</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 扩展统计 -->
      <div class="stats-grid">
        <mat-card class="stat-card" *ngIf="enrollmentStats">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon enrollment">how_to_reg</mat-icon>
              <h3>总报名数</h3>
            </div>
            <div class="stat-value">{{ enrollmentStats.totalEnrollments }}</div>
            <div class="stat-footer">留存率: {{ enrollmentStats.retentionRate || 0 }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card" *ngIf="courseStats">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon completion">done_all</mat-icon>
              <h3>完成率</h3>
            </div>
            <div class="stat-value">{{ courseStats.completionRate || 0 }}%</div>
            <div class="stat-footer">平均进度: {{ courseStats.averageProgress || 0 }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card" *ngIf="overview?.totalRevenue">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon revenue">attach_money</mat-icon>
              <h3>总收入</h3>
            </div>
            <div class="stat-value">¥{{ overview?.totalRevenue | number }}</div>
            <div class="stat-footer">本月收入</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card" *ngIf="overview?.satisfactionRate">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon satisfaction">star</mat-icon>
              <h3>满意度</h3>
            </div>
            <div class="stat-value">{{ overview?.satisfactionRate }}%</div>
            <div class="stat-footer">客户评价</div>
          </mat-card-content>
        </mat-card>

        <!-- 快速入口 -->
        <mat-card class="stat-card finance-quick-access" (click)="onGoToFinance()">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon finance">account_balance</mat-icon>
              <h3>财务管理</h3>
            </div>
            <div class="stat-value">进入</div>
            <div class="stat-footer">学费·薪酬·报表</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card classroom-quick-access" (click)="onGoToClassrooms()">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon classroom">meeting_room</mat-icon>
              <h3>教室管理</h3>
            </div>
            <div class="stat-value">进入</div>
            <div class="stat-footer">资源·分配·设备</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card wechat-cs-quick-access" (click)="onGoToWechatCS()">
          <mat-card-content>
            <div class="stat-header">
              <mat-icon class="stat-icon wechat-cs">chat</mat-icon>
              <h3>微信客服</h3>
            </div>
            <div class="stat-value">进入</div>
            <div class="stat-footer">公众号·小程序·AI 客服</div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;
      .education-section {
        margin-bottom: 24px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      /* 核心统计卡片 - 4列方形横向排列 */
      .core-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .square-card {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .square-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        width: 100%;
      }

      .square-card .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .square-card .stat-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      .square-card .stat-icon.students {
        background: linear-gradient(135deg, $color-secondary, $color-secondary-dark);
      }
      .square-card .stat-icon.teachers {
        background: linear-gradient(135deg, $color-primary-light, $color-primary-dark);
      }
      .square-card .stat-icon.courses {
        background: linear-gradient(135deg, $color-warning, $color-warning);
      }
      .square-card .stat-icon.members {
        background: linear-gradient(135deg, $color-warning, $color-warning);
      }

      .square-card .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: $color-text-primary;
        margin-bottom: 4px;
        line-height: 1.2;
      }

      .square-card .stat-label {
        font-size: 14px;
        color: $color-text-secondary;
        font-weight: 500;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        cursor: pointer;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .finance-quick-access:hover,
      .classroom-quick-access:hover,
      .wechat-cs-quick-access:hover {
        background: linear-gradient(135deg, $color-primary 0%, $color-primary-dark 100%);
        color: white;
      }

      .finance-quick-access:hover .stat-header h3,
      .classroom-quick-access:hover .stat-header h3,
      .wechat-cs-quick-access:hover .stat-header h3,
      .finance-quick-access:hover .stat-footer,
      .classroom-quick-access:hover .stat-footer,
      .wechat-cs-quick-access:hover .stat-footer {
        color: white;
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .stat-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: $color-text-secondary;
      }

      .stat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .stat-icon.enrollment {
        color: $color-primary-light;
      }
      .stat-icon.completion {
        color: $color-secondary-light;
      }
      .stat-icon.revenue {
        color: $color-error;
      }
      .stat-icon.satisfaction {
        color: $color-warning;
      }
      .stat-icon.finance {
        color: $color-primary;
      }
      .stat-icon.classroom {
        color: $color-secondary;
      }
      .stat-icon.wechat-cs {
        color: $color-secondary;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: $color-text-primary;
        margin-bottom: 8px;
      }

      .stat-footer {
        font-size: 12px;
        color: $color-text-muted;
      }

      /* 响应式适配 */
      @media (max-width: 768px) {
        .core-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .square-card {
          aspect-ratio: 1.2;
        }
      }

      @media (max-width: 480px) {
        .core-stats-grid {
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .square-card .stat-icon {
          width: 40px;
          height: 40px;
        }
        .square-card .stat-icon mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
        .square-card .stat-value {
          font-size: 24px;
        }
      }
    `,
  ],
})
export class EducationStatsPanelComponent {
  @Input() overview: OrgOverview | null = null;
  @Input() enrollmentStats: EnrollmentStats | null = null;
  @Input() courseStats: CourseStats | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() goToFinance = new EventEmitter<void>();
  @Output() goToClassrooms = new EventEmitter<void>();
  @Output() goToWechatCS = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }

  onGoToFinance(): void {
    this.goToFinance.emit();
  }

  onGoToClassrooms(): void {
    this.goToClassrooms.emit();
  }

  onGoToWechatCS(): void {
    this.goToWechatCS.emit();
  }
}
