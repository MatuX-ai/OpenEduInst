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
    .k12-dashboard { 
      padding: 24px; 
      background: #f5f7fa;
      min-height: 100%;
    }
    
    /* 核心指标卡片 */
    .metrics-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 20px; 
      margin-bottom: 32px; 
    }
    
    .metric-card { 
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border-left: 4px solid transparent;
    }
    
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .metric-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .metric-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .metric-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .metric-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    
    .trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    .trend.up { color: #4caf50; background: #e8f5e9; }
    .trend.down { color: #f44336; background: #ffebee; }
    .trend.stable { color: #ff9800; background: #fff3e0; }
    
    .metric-value { 
      font-size: 32px; 
      font-weight: 700; 
      color: #1a1a1a;
      margin: 8px 0;
    }
    
    .metric-label { 
      color: #666; 
      font-size: 14px;
      font-weight: 500;
    }
    
    .metric-subtitle {
      color: #999;
      font-size: 12px;
      margin-top: 4px;
    }
    
    /* 常用功能模块 */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-left: 4px;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .module-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-left: 4px solid #4caf50;
    }
    
    .module-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }
    
    .module-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #4caf50;
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
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    
    .arrow {
      color: #999;
    }
    
    /* 快捷操作栏 */
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    
    .action-btn {
      text-transform: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 500;
      background: #4caf50;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      background: #43a047;
    }
    
    .action-btn mat-icon {
      margin-right: 8px;
    }
    
    /* 教学资源中心 */
    .resource-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .resource-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .resource-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .resource-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }
    
    .resource-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #4caf50;
    }
    
    .resource-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .resource-info h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .resource-info p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    
    /* STEM 特色功能区 */
    .stem-features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .stem-feature-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .stem-feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      border-color: #4caf50;
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
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .feature-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .feature-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .feature-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    .feature-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    
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
    
    .status-icon.success { color: #4caf50; }
    .status-icon.warning { color: #ff9800; }
    .status-icon.info { color: #2196f3; }
    
    .stem-feature-card h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .feature-desc {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }
    
    .feature-stats {
      display: flex;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .stat-value.orange { color: #ff9800; }
    .stat-value.green { color: #4caf50; }
    .stat-value.purple { color: #9c27b0; }
    .stat-value.blue { color: #2196f3; }
    
    .stat-label {
      display: block;
      font-size: 12px;
      color: #999;
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
