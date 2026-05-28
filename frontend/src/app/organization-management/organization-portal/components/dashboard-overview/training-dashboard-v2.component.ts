import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

export interface TrainingMetrics {
  activeStudents: number;
  monthlyRevenue: string;
  courseCompletionRate: string;
  equipmentUsageRate: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface StemFeatureItem {
  id: string;
  icon: string;
  label: string;
  desc: string;
  status: string;
  statusColor: string;
}

export interface ResourceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-training-dashboard-v2',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <div class="training-dashboard">
      <!-- 核心指标卡片 (KPI) -->
      <div class="kpi-grid">
        <!-- 在训学员 -->
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon-wrapper blue">
              <mat-icon>group</mat-icon>
            </div>
            <span class="kpi-trend up">^+12.5%</span>
          </div>
          <div class="kpi-value">
            {{ metrics.activeStudents }}
            <span class="kpi-unit">人</span>
          </div>
          <div class="kpi-label">在训学员</div>
        </div>

        <!-- 本月营收 -->
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon-wrapper green">
              <mat-icon>payments</mat-icon>
            </div>
            <span class="kpi-trend up">^+8.3%</span>
          </div>
          <div class="kpi-value">
            ¥{{ metrics.monthlyRevenue }}<span class="kpi-unit">万</span>
          </div>
          <div class="kpi-label">本月营收</div>
        </div>

        <!-- 本月消课率 -->
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon-wrapper purple">
              <mat-icon>auto_stories</mat-icon>
            </div>
            <span class="kpi-trend up">^+2.1%</span>
          </div>
          <div class="kpi-value">
            {{ metrics.courseCompletionRate }}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-label">本月消课率</div>
        </div>

        <!-- 设备使用率 -->
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon-wrapper orange">
              <mat-icon>desktop_mac</mat-icon>
            </div>
            <span class="kpi-trend down">^-3.2%</span>
          </div>
          <div class="kpi-value">
            {{ metrics.equipmentUsageRate }}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-label">设备使用率</div>
        </div>
      </div>

      <!-- 图表区域 (营收趋势 + Token消耗) -->
      <div class="charts-grid">
        <!-- 月度营收趋势 -->
        <div class="chart-card revenue-chart">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">月度营收趋势</h3>
              <p class="chart-subtitle">STEM课程 + 设备租赁 + Token充值</p>
            </div>
            <select class="chart-select">
              <option>近 6 个月</option>
              <option>近 12 个月</option>
            </select>
          </div>
          <div class="chart-body">
            <div class="chart-placeholder">
              <div class="area-chart-placeholder">
                <div class="chart-y-axis">
                  <span>¥14万</span>
                  <span>¥11万</span>
                  <span>¥7万</span>
                  <span>¥4万</span>
                  <span>¥0万</span>
                </div>
                <div class="chart-area">
                  <svg viewBox="0 0 600 200" class="chart-svg">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#0066FF" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#0066FF" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <!-- 网格线 -->
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
                    <!-- 面积图 -->
                    <path d="M 0 150 Q 100 140 200 120 T 400 80 T 600 60 L 600 200 L 0 200 Z" 
                          fill="url(#areaGradient)" />
                    <!-- 折线 -->
                    <path d="M 0 150 Q 100 140 200 120 T 400 80 T 600 60" 
                          fill="none" stroke="#0066FF" stroke-width="3"/>
                    <!-- 数据点 -->
                    <circle cx="0" cy="150" r="4" fill="#0066FF"/>
                    <circle cx="120" cy="140" r="4" fill="#0066FF"/>
                    <circle cx="240" cy="120" r="4" fill="#0066FF"/>
                    <circle cx="360" cy="100" r="4" fill="#0066FF"/>
                    <circle cx="480" cy="80" r="4" fill="#0066FF"/>
                    <circle cx="600" cy="60" r="4" fill="#0066FF"/>
                  </svg>
                </div>
                <div class="chart-x-axis">
                  <span>9月</span>
                  <span>10月</span>
                  <span>11月</span>
                  <span>12月</span>
                  <span>1月</span>
                  <span>2月</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Token 消耗分布 -->
        <div class="chart-card token-chart">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Token 消耗分布</h3>
              <p class="chart-subtitle">本月累计 12,580点</p>
            </div>
          </div>
          <div class="chart-body">
            <div class="pie-chart-placeholder">
              <div class="donut-chart">
                <svg viewBox="0 0 100 100">
                  <!-- 背景圆环 -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" stroke-width="12"/>
                  <!-- 蓝色: AI助教 4800点 (38.2%) -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0066FF" stroke-width="12" 
                          stroke-dasharray="96 155" stroke-dashoffset="0" 
                          transform="rotate(-90 50 50)"/>
                  <!-- 紫色: 智能评测 3500点 (27.8%) -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#9C27B0" stroke-width="12" 
                          stroke-dasharray="70 181" stroke-dashoffset="-96" 
                          transform="rotate(-90 50 50)"/>
                  <!-- 绿色: 课程生成 2800点 (22.3%) -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#00CC66" stroke-width="12" 
                          stroke-dasharray="56 195" stroke-dashoffset="-166" 
                          transform="rotate(-90 50 50)"/>
                  <!-- 橙色: 代码审查 1480点 (11.8%) -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#FF9800" stroke-width="12" 
                          stroke-dasharray="30 221" stroke-dashoffset="-222" 
                          transform="rotate(-90 50 50)"/>
                </svg>
              </div>
              <div class="token-legend">
                <div class="legend-item">
                  <div class="legend-dot blue"></div>
                  <span class="legend-label">AI助教</span>
                  <span class="legend-value">4,800点</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot purple"></div>
                  <span class="legend-label">智能评测</span>
                  <span class="legend-value">3,500点</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot green"></div>
                  <span class="legend-label">课程生成</span>
                  <span class="legend-value">2,800点</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot orange"></div>
                  <span class="legend-label">代码审查</span>
                  <span class="legend-value">1,480点</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEM特色功能 + 快捷操作 + 教学资源 -->
      <div class="bottom-grid">
        <!-- STEM 特色功能 -->
        <div class="section-card stem-section">
          <div class="section-header">
            <h3 class="section-title">STEM 特色功能</h3>
            <p class="section-subtitle">区别于普通教培的核心模块</p>
          </div>
          <div class="section-body">
            <div class="feature-list">
              <div *ngFor="let feature of stemFeatures" class="feature-item">
                <div class="feature-icon-wrapper">
                  <mat-icon>{{ feature.icon }}</mat-icon>
                </div>
                <div class="feature-info">
                  <h4 class="feature-label">{{ feature.label }}</h4>
                  <p class="feature-desc">{{ feature.desc }}</p>
                </div>
                <span class="feature-status" [ngStyle]="{ 'color': feature.statusColor, 'background-color': feature.statusColor + '30' }">
                  {{ feature.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧栏：快捷操作 + 教学资源 -->
        <div class="right-column">
          <!-- 快捷操作 -->
          <div class="section-card actions-section">
            <div class="section-header">
              <h3 class="section-title">快捷操作</h3>
            </div>
            <div class="section-body">
              <div class="actions-grid">
                <button *ngFor="let action of quickActions" class="action-button" (click)="onQuickAction(action)">
                  <div class="action-icon-wrapper" [ngClass]="'action-' + action.color">
                    <mat-icon>{{ action.icon }}</mat-icon>
                  </div>
                  <span class="action-label">{{ action.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 教学资源中心 -->
          <div class="section-card resources-section">
            <div class="section-header">
              <h3 class="section-title">教学资源中心</h3>
            </div>
            <div class="section-body">
              <div class="resources-grid">
                <button *ngFor="let resource of resources" class="resource-item">
                  <div class="resource-icon-wrapper">
                    <mat-icon>{{ resource.icon }}</mat-icon>
                  </div>
                  <div class="resource-info">
                    <h4 class="resource-label">{{ resource.title }}</h4>
                    <p class="resource-desc">{{ resource.description }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/design-tokens' as *;

    .training-dashboard {
      padding: $spacing-lg;
      background: #F1F5F9;
      min-height: 100%;
    }

    /* KPI 卡片网格 */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .kpi-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      transform: translateY(-2px);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .kpi-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon-wrapper mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .kpi-icon-wrapper.blue { background: #EFF6FF; }
    .kpi-icon-wrapper.blue mat-icon { color: #3B82F6; }
    .kpi-icon-wrapper.green { background: #F0FDF4; }
    .kpi-icon-wrapper.green mat-icon { color: #10B981; }
    .kpi-icon-wrapper.purple { background: #F3E8FF; }
    .kpi-icon-wrapper.purple mat-icon { color: #A855F7; }
    .kpi-icon-wrapper.orange { background: #FFF7ED; }
    .kpi-icon-wrapper.orange mat-icon { color: #F97316; }

    .kpi-trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .kpi-trend.up { color: #10B981; background: #F0FDF4; }
    .kpi-trend.down { color: #EF4444; background: #FEF2F2; }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #0F172A;
      margin: 4px 0 0 0;
    }

    .kpi-unit {
      font-size: 14px;
      font-weight: 400;
      color: #94A3B8;
      margin-left: 4px;
    }

    .kpi-label {
      color: #64748B;
      font-size: 14px;
      font-weight: 500;
    }

    /* 图表区域 */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .chart-card {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
      overflow: hidden;
    }

    .chart-header {
      padding: 20px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 4px 0;
    }

    .chart-subtitle {
      font-size: 12px;
      color: #64748B;
      margin: 0;
    }

    .chart-select {
      padding: 8px 16px;
      font-size: 12px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      background: #F1F5F9;
      color: #64748B;
      cursor: pointer;
    }

    .chart-body {
      padding: 20px;
    }

    .chart-placeholder {
      height: 232px;
    }

    .area-chart-placeholder {
      height: 100%;
      display: flex;
      gap: 16px;
    }

    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: $font-size-xs;
      color: $color-neutral-400;
      padding-right: $spacing-sm;
    }

    .chart-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .chart-svg {
      width: 100%;
      height: 180px;
    }

    .chart-x-axis {
      display: flex;
      justify-content: space-between;
      font-size: $font-size-xs;
      color: $color-neutral-400;
      margin-top: $spacing-sm;
      padding: 0 12px;
    }

    .chart-x-axis span {
      flex: 1;
      text-align: center;
    }

    .chart-x-axis span:first-child {
      text-align: left;
    }

    .chart-x-axis span:last-child {
      text-align: right;
    }

    /* 环形图 */
    .pie-chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .donut-chart {
      width: 168px;
      height: 168px;
      margin-bottom: 16px;
    }

    .donut-chart svg {
      width: 100%;
      height: 100%;
    }

    .token-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .legend-dot.blue { background: $color-brand-primary; }
    .legend-dot.purple { background: #9C27B0; }
    .legend-dot.green { background: $color-stem-green; }
    .legend-dot.orange { background: #FF9800; }

    .legend-label {
      flex: 1;
      color: $color-neutral-500;
    }

    .legend-value {
      font-weight: 600;
      color: $color-neutral-800;
    }

    /* 底部网格 */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .right-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
    }

    .section-header {
      padding: 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 4px 0;
    }

    .section-subtitle {
      font-size: 12px;
      color: #64748B;
      margin: 0;
    }

    .section-body {
      padding: 20px;
    }

    /* STEM 特色功能列表 */
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid #F1F5F9;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .feature-item:hover {
      border-color: #BFDBFE;
      background: rgba(59, 130, 246, 0.03);
    }

    .feature-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #EFF6FF;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-icon-wrapper mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #3B82F6;
    }

    .feature-info {
      flex: 1;
    }

    .feature-label {
      font-size: 14px;
      font-weight: 500;
      color: #1E293B;
      margin: 0 0 4px 0;
    }

    .feature-desc {
      font-size: 12px;
      color: #64748B;
      margin: 0;
    }

    .feature-status {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    /* 快捷操作网格 */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      background: #F8FAFC;
    }

    .action-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-icon-wrapper mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .action-blue { background: #EFF6FF; }
    .action-blue mat-icon { color: #3B82F6; }
    .action-amber { background: #FFF7ED; }
    .action-amber mat-icon { color: #F97316; }
    .action-emerald { background: #F0FDF4; }
    .action-emerald mat-icon { color: #10B981; }
    .action-purple { background: #F3E8FF; }
    .action-purple mat-icon { color: #A855F7; }
    .action-rose { background: #FEF2F2; }
    .action-rose mat-icon { color: #EF4444; }
    .action-slate { background: #F1F5F9; }
    .action-slate mat-icon { color: #64748B; }

    .action-label {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }

    /* 教学资源中心 */
    .resources-section .section-body {
      padding: 20px;
    }

    .resources-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .resource-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 1px solid #F1F5F9;
      border-radius: 8px;
      background: #FFFFFF;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .resource-item:hover {
      border-color: #BFDBFE;
      background: rgba(59, 130, 246, 0.03);
    }

    .resource-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .resource-item:hover .resource-icon-wrapper {
      background: #DBEAFE;
    }

    .resource-icon-wrapper mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #64748B;
      transition: color 0.2s ease;
    }

    .resource-item:hover .resource-icon-wrapper mat-icon {
      color: #3B82F6;
    }

    .resource-info {
      flex: 1;
      min-width: 0;
    }

    .resource-label {
      font-size: 14px;
      font-weight: 500;
      color: #334155;
      margin: 0 0 2px 0;
      transition: color 0.2s ease;
    }

    .resource-item:hover .resource-label {
      color: #3B82F6;
    }

    .resource-desc {
      font-size: 12px;
      color: #94A3B8;
      margin: 0;
    }

    /* 响应式设计 */
    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .training-dashboard {
        padding: 16px;
      }
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .bottom-grid {
        grid-template-columns: 1fr;
      }
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class TrainingDashboardV2Component implements OnInit {
  @Input() metrics: TrainingMetrics = {
    activeStudents: 328,
    monthlyRevenue: '12.5',
    courseCompletionRate: '92',
    equipmentUsageRate: '78'
  };

  @Input() quickActions: QuickActionItem[] = [
    { id: 'enroll', label: '快速报名', icon: 'person_add', color: 'blue' },
    { id: 'device', label: '设备借出', icon: 'build', color: 'amber' },
    { id: 'checkin', label: '签到打卡', icon: 'assignment', color: 'emerald' },
    { id: 'project', label: '新建项目', icon: 'code', color: 'purple' },
    { id: 'renew', label: '续费提醒', icon: 'attach_money', color: 'rose' },
    { id: 'export', label: '导出报表', icon: 'assessment', color: 'slate' }
  ];

  @Input() stemFeatures: StemFeatureItem[] = [
    { 
      id: 'labs-assets', 
      icon: 'precision_manufacturing', 
      label: '实验室与资产', 
      desc: '空间预约、设备借用与维护管理', 
      status: '5台待维护',
      statusColor: '#FFF3E0'
    },
    { 
      id: 'rd-billing', 
      icon: 'science', 
      label: '教学研发与计费', 
      desc: '项目管理、Token消耗与成本核算', 
      status: '余额12,580点',
      statusColor: '#F3E5F5'
    },
    { 
      id: 'competitions', 
      icon: 'emoji_events', 
      label: '竞赛与成果中心', 
      desc: '赛事报名、作品展示与成长档案', 
      status: '3个进行中',
      statusColor: '#EBF5FF'
    }
  ];

  @Input() resources: ResourceItem[] = [
    { id: 'courseware', icon: 'edit_note', title: 'Arduino课件库', description: '32套教学方案' },
    { id: 'dataset', icon: 'sensors', title: '传感器数据集', description: '15组实验数据' },
    { id: 'competition', icon: 'campaign', title: '竞赛通知', description: '3场赛事报名中' },
    { id: 'iot-template', icon: 'wifi', title: 'IoT代码模板', description: 'ESP32/MQTT等' }
  ];

  constructor() {}

  ngOnInit(): void {}

  onQuickAction(action: QuickActionItem): void {
    console.log('Quick action clicked:', action);
  }
}
