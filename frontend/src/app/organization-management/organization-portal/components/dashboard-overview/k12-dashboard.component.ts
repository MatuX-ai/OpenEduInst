import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface K12Metrics {
  totalStudents: number;
  courseCompletionRate: string;
  equipmentIntactRate: string;
  competitionAwards: number;
}

@Component({
  selector: 'app-k12-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="k12-dashboard">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <mat-card class="metric-card" (click)="onMetricClick('students')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon green">school</mat-icon>
              <span class="trend up">↑ 5%</span>
            </div>
            <div class="metric-value">{{ metrics.totalStudents }}</div>
            <div class="metric-label">在训学生数</div>
            <div class="metric-subtitle">覆盖全校 65% 学生</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('completion')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon blue">trending_up</mat-icon>
              <span class="trend up">↑ 8%</span>
            </div>
            <div class="metric-value">{{ metrics.courseCompletionRate }}</div>
            <div class="metric-label">课程完成率</div>
            <div class="metric-subtitle">本学期进度</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('equipment')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon orange">devices</mat-icon>
              <span class="trend stable">→ 稳定</span>
            </div>
            <div class="metric-value">{{ metrics.equipmentIntactRate }}</div>
            <div class="metric-label">设备完好率</div>
            <div class="metric-subtitle">Micro:bit/传感器等</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card" (click)="onMetricClick('awards')">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon class="metric-icon purple">emoji_events</mat-icon>
              <span class="trend up">↑ 12%</span>
            </div>
            <div class="metric-value">{{ metrics.competitionAwards }}</div>
            <div class="metric-label">竞赛获奖数</div>
            <div class="metric-subtitle">本年累计</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 常用功能模块 -->
      <div class="section-title">常用功能</div>
      <div class="modules-grid">
        <mat-card class="module-card" (click)="onModuleClick('schedule')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="module-info">
              <h4>课表查询</h4>
              <p class="subtitle">本周 56 节 STEM 课</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('communication')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon matBadge="12" matBadgeColor="warn">message</mat-icon>
            </div>
            <div class="module-info">
              <h4>家校互动</h4>
              <p class="subtitle">12条未读消息</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('analysis')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>bar_chart</mat-icon>
            </div>
            <div class="module-info">
              <h4>成绩分析</h4>
              <p class="subtitle">平均分 85.3</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="module-card" (click)="onModuleClick('attendance')">
          <mat-card-content>
            <div class="module-icon">
              <mat-icon>clipboard_check</mat-icon>
            </div>
            <div class="module-info">
              <h4>考勤管理</h4>
              <p class="subtitle">今日出勤率 94%</p>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 快捷操作栏 -->
      <div class="section-title">快捷操作</div>
      <div class="quick-actions-bar">
        <button *ngFor="let action of quickActions" mat-raised-button class="action-btn" (click)="onQuickAction(action)">
          <mat-icon>{{ action.icon }}</mat-icon>
          {{ action.label }}
        </button>
      </div>

      <!-- 教学资源中心 -->
      <div class="section-title">教学资源中心</div>
      <div class="resource-grid">
        <mat-card *ngFor="let resource of resources" class="resource-card" (click)="onResourceSelect(resource)">
          <mat-card-content>
            <div class="resource-icon">
              <mat-icon>{{ resource.icon }}</mat-icon>
            </div>
            <div class="resource-info">
              <h4>{{ resource.title }}</h4>
              <p>{{ resource.description }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- STEM 特色功能区 -->
      <div class="section-title">STEM 特色功能</div>
      <div class="stem-features-grid">
        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('classroom-equipment')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon green">
                <mat-icon>devices</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>班级设备管理</h4>
            <p class="feature-desc">Micro:bit、传感器等教学设备借用与盘点</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">240</span>
                <span class="stat-label">设备总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value green">96%</span>
                <span class="stat-label">完好率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('showcase')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon blue">
                <mat-icon>display_settings</mat-icon>
              </div>
              <mat-icon class="status-icon info">info</mat-icon>
            </div>
            <h4>学生作品展示</h4>
            <p class="feature-desc">机器人、编程作品的在线展厅与投票互动</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">86</span>
                <span class="stat-label">作品总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value blue">1.2K</span>
                <span class="stat-label">总点赞</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('portfolio')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon purple">
                <mat-icon>account_book</mat-icon>
              </div>
              <mat-icon class="status-icon success">check_circle</mat-icon>
            </div>
            <h4>成长档案</h4>
            <p class="feature-desc">记录学生从小学到高中的 STEM 学习轨迹</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">1,250</span>
                <span class="stat-label">档案数量</span>
              </div>
              <div class="stat-item">
                <span class="stat-value purple">100%</span>
                <span class="stat-label">覆盖率</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stem-feature-card" (click)="onStemFeatureClick('competition')">
          <mat-card-content>
            <div class="feature-header">
              <div class="feature-icon orange">
                <mat-icon>emoji_events</mat-icon>
              </div>
              <mat-icon class="status-icon warning">pending</mat-icon>
            </div>
            <h4>竞赛报名</h4>
            <p class="feature-desc">FLL、VEX、NOI 等赛事的统一报名入口</p>
            <div class="feature-stats">
              <div class="stat-item">
                <span class="stat-value">5</span>
                <span class="stat-label">开放赛事</span>
              </div>
              <div class="stat-item">
                <span class="stat-value orange">32</span>
                <span class="stat-label">已报名</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .k12-dashboard { 
      padding: $spacing-lg; 
      background: $color-neutral-50;
      min-height: 100%;
    }
    
    /* 核心指标卡片 */
    .metrics-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 20px; 
      margin-bottom: $spacing-xl; 
    }
    
    .metric-card { 
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
      border-left: 4px solid transparent;
    }
    
    .metric-card:hover {
      transform: $card-transform-hover;
      box-shadow: $card-shadow-hover;
    }
    
    mat-card-content {
      padding: 20px !important;
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: $radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .metric-icon.green { background: $color-stem-green; }
    .metric-icon.blue { background: $color-brand-primary; }
    .metric-icon.orange { background: #FF9800; }
    .metric-icon.purple { background: #9C27B0; }
    
    .trend {
      font-size: $font-size-xs;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    .trend.up { color: $color-stem-green; background: $color-stem-green-bg; }
    .trend.down { color: $color-error; background: $color-error-light; }
    .trend.stable { color: #FF9800; background: $color-warning-light; }
    
    .metric-value { 
      font-size: $font-size-4xl; 
      font-weight: 700; 
      color: $color-neutral-900;
      margin: $spacing-xs 0;
    }
    
    .metric-label { 
      color: $color-neutral-500; 
      font-size: $font-size-sm;
      font-weight: 500;
    }
    
    .metric-subtitle {
      color: $color-neutral-400;
      font-size: $font-size-xs;
      margin-top: 4px;
    }
    
    /* 常用功能模块 */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: $color-neutral-900;
      margin-bottom: $spacing-md;
      padding-left: 4px;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-md;
      margin-bottom: $spacing-xl;
    }
    
    .module-card {
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
    }
    
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: $card-shadow-hover;
      border-left: 4px solid $color-stem-green;
    }
    
    .module-card mat-card-content {
      display: flex;
      align-items: center;
      padding: $spacing-md !important;
    }
    
    .module-icon {
      width: 56px;
      height: 56px;
      border-radius: $radius-lg;
      background: $color-stem-green-bg;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
      color: $color-stem-green;
    }
    
    .module-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .module-info {
      flex: 1;
    }
    
    .module-info h4 {
      margin: 0;
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-900;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }
    
    .arrow {
      color: $color-neutral-400;
    }
    
    /* 快捷操作栏 */
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: $spacing-xl;
    }
    
    .action-btn {
      text-transform: none;
      border-radius: $btn-primary-radius;
      padding: 12px 20px;
      font-weight: $btn-font-weight;
      background: $color-brand-primary;
      color: $btn-primary-color;
      transition: all $transition-normal ease;
      border: none;
      cursor: pointer;
    }
    
    .action-btn:hover {
      transform: $btn-primary-transform-hover;
      box-shadow: $btn-primary-shadow-hover;
      background: $btn-primary-bg-hover;
    }
    
    .action-btn mat-icon {
      margin-right: 8px;
    }
    
    /* 教学资源中心 */
    .resource-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $spacing-md;
      margin-bottom: $spacing-xl;
    }
    
    .resource-card {
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
    }
    
    .resource-card:hover {
      transform: $card-transform-hover;
      box-shadow: $card-shadow-hover;
    }
    
    .resource-card mat-card-content {
      display: flex;
      align-items: center;
      padding: $spacing-md !important;
    }
    
    .resource-icon {
      width: 48px;
      height: 48px;
      border-radius: $radius-lg;
      background: $color-brand-primary-bg;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
      color: $color-brand-primary;
    }
    
    .resource-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .resource-info h4 {
      margin: 0;
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-neutral-900;
    }
    
    .resource-info p {
      margin: 4px 0 0 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }
    
    /* STEM 特色功能区 */
    .stem-features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .stem-feature-card {
      border-radius: $card-border-radius;
      box-shadow: $card-shadow;
      transition: all $transition-normal ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: $card-transform-hover;
      box-shadow: $card-shadow-hover;
      border-color: $color-stem-green;
    }
    
    .stem-feature-card mat-card-content {
      padding: 20px !important;
    }
    
    .feature-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: $radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .feature-icon.green { background: $color-stem-green; }
    .feature-icon.blue { background: $color-brand-primary; }
    .feature-icon.purple { background: #9C27B0; }
    .feature-icon.orange { background: #FF9800; }
    
    .feature-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .status-icon.success { color: $color-stem-green; }
    .status-icon.warning { color: #FF9800; }
    .status-icon.info { color: $color-brand-primary; }
    
    .stem-feature-card h4 {
      margin: 0 0 8px 0;
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-900;
    }
    
    .feature-desc {
      margin: 0 0 $spacing-md 0;
      font-size: $font-size-sm;
      color: $color-neutral-500;
      line-height: 1.5;
    }
    
    .feature-stats {
      display: flex;
      gap: $spacing-md;
      padding-top: $spacing-md;
      border-top: 1px solid $color-neutral-100;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: $font-size-lg;
      font-weight: 700;
      color: $color-neutral-900;
      margin-bottom: 4px;
    }
    
    .stat-value.orange { color: #FF9800; }
    .stat-value.green { color: $color-stem-green; }
    .stat-value.purple { color: #9C27B0; }
    .stat-value.blue { color: $color-brand-primary; }
    
    .stat-label {
      display: block;
      font-size: $font-size-xs;
      color: $color-neutral-400;
    }
    
    /* 响应式设计 */
    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .resource-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stem-features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      .modules-grid {
        grid-template-columns: 1fr;
      }
      .resource-grid {
        grid-template-columns: 1fr;
      }
      .stem-features-grid {
        grid-template-columns: 1fr;
      }
      .quick-actions-bar {
        flex-direction: column;
      }
      .action-btn {
        width: 100%;
      }
    }
  `]
})
export class K12DashboardComponent implements OnInit {
  @Input() metrics: any = {
    totalStudents: 1250,
    courseCompletionRate: '78%',
    equipmentIntactRate: '96%',
    competitionAwards: 23
  };
  
  @Input() quickActions = [
    { id: 'class-assign', label: '快速分班', icon: 'users' },
    { id: 'leave-approve', label: '请假审批', icon: 'check_circle' },
    { id: 'work-upload', label: '作品上传', icon: 'upload' },
    { id: 'parent-notify', label: '家长通知', icon: 'send' },
    { id: 'equip-borrow', label: '设备借用', icon: 'package' }
  ];
  
  @Input() resources = [
    { id: 'curriculum', title: '课程资源', description: 'STEM课程标准教案', icon: 'menu_book' },
    { id: 'activity', title: '活动推广', description: '校园科技节策划', icon: 'celebration' },
    { id: 'report', title: '学情报告', description: '学生能力发展评估', icon: 'description' },
    { id: 'material', title: '素材库', description: '实验视频与教程', icon: 'library_books' }
  ];
  
  @Output() quickActionClick = new EventEmitter<any>();
  @Output() resourceSelect = new EventEmitter<any>();
  @Output() stemFeatureClick = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}
  
  onMetricClick(metric: string): void {
    console.log('Metric clicked:', metric);
  }

  onModuleClick(module: string): void {
    console.log('Module clicked:', module);
  }
  
  onQuickAction(action: any): void {
    console.log('Quick action clicked:', action);
    this.quickActionClick.emit(action);
  }
  
  onResourceSelect(resource: any): void {
    console.log('Resource selected:', resource);
    this.resourceSelect.emit(resource);
  }
  
  onStemFeatureClick(feature: string): void {
    console.log('STEM feature clicked:', feature);
    this.stemFeatureClick.emit(feature);
  }
}
