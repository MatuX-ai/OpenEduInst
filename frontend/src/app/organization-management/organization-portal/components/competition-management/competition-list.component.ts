import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface Competition {
  id: number;
  name: string;
  organizer: string;
  level: string;
  category: string;
  register_deadline: string;
  competition_date: string;
  participants_count: number;
  status: string;
  achievements?: string;
}

interface Certification {
  id: number;
  name: string;
  organizer: string;
  certification_type: string;
  levels: string;
  next_exam_date: string;
  registered_students: number;
  pass_rate?: number;
}

interface CompetitionStats {
  monthly_participants: number;
  total_awards: number;
  gold_awards: number;
  upcoming_events: number;
}

@Component({
  selector: 'app-competition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule
  ],
  template: `
    <div class="competitions-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">竞赛与认证</h1>
          <p class="page-subtitle">管理赛事报名、考级安排和获奖成果</p>
        </div>
        <button mat-raised-button color="primary" class="add-btn">
          <mat-icon>add</mat-icon>
          添加赛事
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月参赛人数</p>
              <p class="stat-value">{{ stats.monthly_participants || 0 }}</p>
              <p class="stat-desc">覆盖{{ competitions.length }}项赛事</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>groups</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">累计获奖</p>
              <p class="stat-value">{{ stats.total_awards || 0 }}</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">emoji_events</mat-icon>
                含金奖{{ stats.gold_awards || 0 }}个
              </p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>trophy</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">考级通过率</p>
              <p class="stat-value">{{ averagePassRate }}%</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">trending_up</mat-icon>
                高于平均
              </p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>military_tech</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">近期活动</p>
              <p class="stat-value">{{ stats.upcoming_events || 0 }}</p>
              <p class="stat-desc">未来30天</p>
            </div>
            <div class="stat-icon-wrapper emerald">
              <mat-icon>event</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Competitions Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="header-left">
            <mat-icon class="section-icon amber">trophy</mat-icon>
            <h2 class="section-title">赛事报名</h2>
            <span class="count-badge">共 {{ competitions.length }} 项</span>
          </div>
          <div class="header-right">
            <div class="search-box">
              <mat-icon class="search-icon">search</mat-icon>
              <input type="text" placeholder="搜索赛事名称..." [(ngModel)]="searchKeyword" (keyup.enter)="onSearch()">
            </div>
            <button mat-stroked-button class="filter-btn">
              <mat-icon>filter_list</mat-icon>
              筛选
            </button>
          </div>
        </div>

        <div class="competitions-list">
          <div *ngFor="let comp of competitions" class="competition-item">
            <div class="comp-header">
              <div class="comp-info">
                <div class="comp-title-row">
                  <h3 class="comp-name">{{ comp.name }}</h3>
                  <span [class]="getStatusClass(comp.status)">{{ comp.status }}</span>
                </div>
                <div class="comp-meta">
                  <span>主办: {{ comp.organizer }}</span>
                  <span class="level-badge blue">{{ comp.level }}</span>
                  <span class="category-badge purple">{{ comp.category }}</span>
                </div>
              </div>
            </div>

            <div class="comp-details">
              <div class="detail-item">
                <p class="detail-label">报名截止</p>
                <p class="detail-value">{{ formatDate(comp.register_deadline) }}</p>
              </div>
              <div class="detail-item">
                <p class="detail-label">比赛日期</p>
                <p class="detail-value">{{ formatDate(comp.competition_date) }}</p>
              </div>
              <div class="detail-item">
                <p class="detail-label">报名人数</p>
                <p class="detail-value">{{ comp.participants_count }} 人</p>
              </div>
            </div>

            <div *ngIf="comp.achievements" class="achievement-box">
              <p class="achievement-text">🏆 {{ comp.achievements }}</p>
            </div>

            <div class="comp-actions">
              <button mat-raised-button color="primary" class="action-btn">
                管理报名
              </button>
              <button mat-stroked-button class="action-btn secondary">
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Certifications Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="header-left">
            <mat-icon class="section-icon purple">military_tech</mat-icon>
            <h2 class="section-title">等级认证</h2>
            <span class="count-badge">共 {{ certifications.length }} 项</span>
          </div>
        </div>

        <div class="certifications-grid">
          <div *ngFor="let cert of certifications" class="certification-card">
            <div class="cert-header">
              <div>
                <h3 class="cert-name">{{ cert.name }}</h3>
                <p class="cert-organizer">{{ cert.organizer }}</p>
              </div>
              <span class="type-badge">{{ cert.certification_type }}</span>
            </div>

            <div class="cert-body">
              <div class="levels-section">
                <p class="section-label">认证级别</p>
                <div class="levels-list">
                  <span *ngFor="let level of getLevels(cert.levels)" class="level-tag">
                    {{ level }}
                  </span>
                </div>
              </div>

              <div class="cert-stats">
                <div class="stat-row">
                  <div>
                    <p class="stat-label">下次考试</p>
                    <p class="stat-value">{{ formatDate(cert.next_exam_date) }}</p>
                  </div>
                  <div>
                    <p class="stat-label">报名人数</p>
                    <p class="stat-value">{{ cert.registered_students }} 人</p>
                  </div>
                </div>

                <div class="pass-rate-section" *ngIf="cert.pass_rate">
                  <p class="section-label">历史通过率</p>
                  <div class="pass-rate-bar">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="cert.pass_rate"></div>
                    </div>
                    <span class="pass-rate-text">{{ cert.pass_rate }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="cert-actions">
              <button mat-raised-button class="action-btn primary-purple">
                报名管理
              </button>
              <button mat-stroked-button class="action-btn">
                详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/design-tokens' as *;
    .competitions-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: $color-neutral-500;
      margin: 0;
    }

    .add-btn {
      background: $color-brand-primary !important;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: $card-bg;
      border-radius: $radius-lg;
      padding: $spacing-lg;
      box-shadow: $card-shadow;
      border: $card-border;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: 12px;
      color: $color-neutral-500;
      margin: 0;
    }

    .stat-trend {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
    }

    .stat-trend.positive {
      color: $color-stem-green;
    }

    .trend-icon {
      font-size: 16px;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16px;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-icon-wrapper.blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon-wrapper.amber { background: $color-warning-light; color: $color-warning; }
    .stat-icon-wrapper.purple { background: $color-brand-primary-subtle; color: $color-brand-primary; }
    .stat-icon-wrapper.emerald { background: $color-stem-green-bg; color: $color-stem-green; }

    /* Section Card */
    .section-card {
      background: $card-bg;
      border-radius: $radius-lg;
      box-shadow: $card-shadow;
      border: $card-border;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .section-header {
      padding: 20px;
      border-bottom: 1px solid $color-neutral-100;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .section-icon.amber { color: $color-warning; }
    .section-icon.purple { color: $color-brand-primary; }

    .section-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-neutral-700;
      margin: 0;
    }

    .count-badge {
      font-size: 12px;
      padding: 4px 12px;
      background: $color-neutral-100;
      color: $color-neutral-600;
      border-radius: 12px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }

    .search-box input {
      padding: 8px 12px 8px 36px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
      width: 220px;
      outline: none;
    }

    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-btn {
      font-size: 13px;
    }

    /* Competitions List */
    .competitions-list {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .competition-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s;
    }

    .competition-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .comp-header {
      margin-bottom: 16px;
    }

    .comp-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .comp-name {
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0;
    }

    .status-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      border: 1px solid;
    }

    .status-badge.registering {
      background: #ecfdf5;
      color: #10b981;
      border-color: #a7f3d0;
    }

    .status-badge.preparing {
      background: #eff6ff;
      color: #3b82f6;
      border-color: #bfdbfe;
    }

    .status-badge.closed {
      background: #f8fafc;
      color: $color-neutral-500;
      border-color: #e2e8f0;
    }

    .comp-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: #475569;
    }

    .level-badge, .category-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .level-badge.blue {
      background: #eff6ff;
      color: #3b82f6;
    }

    .category-badge.purple {
      background: #f5f3ff;
      color: #8b5cf6;
    }

    .comp-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .detail-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .detail-label {
      font-size: 11px;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: $color-neutral-900;
      margin: 0;
    }

    .achievement-box {
      padding: 12px;
      background: #fffbeb;
      border-radius: 6px;
      border: 1px solid #fde68a;
      margin-bottom: 16px;
    }

    .achievement-text {
      font-size: 12px;
      color: #92400e;
      margin: 0;
    }

    .comp-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      font-size: 13px;
    }

    .action-btn.secondary {
      color: #475569;
    }

    .action-btn.primary-purple {
      background: #8b5cf6 !important;
    }

    /* Certifications Grid */
    .certifications-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .certification-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s;
    }

    .certification-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .cert-name {
      font-size: 15px;
      font-weight: 600;
      color: $color-neutral-900;
      margin: 0 0 4px 0;
    }

    .cert-organizer {
      font-size: 13px;
      color: #475569;
      margin: 0;
    }

    .type-badge {
      font-size: 11px;
      padding: 4px 10px;
      background: #f5f3ff;
      color: #8b5cf6;
      border-radius: 4px;
      font-weight: 500;
    }

    .cert-body {
      margin-bottom: 16px;
    }

    .section-label {
      font-size: 11px;
      color: $color-neutral-500;
      margin: 0 0 8px 0;
    }

    .levels-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .level-tag {
      font-size: 12px;
      padding: 4px 10px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 4px;
    }

    .cert-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-row .stat-label {
      font-size: 11px;
      color: $color-neutral-500;
      margin: 0 0 4px 0;
    }

    .stat-row .stat-value {
      font-size: 14px;
      font-weight: 500;
      color: $color-neutral-900;
      margin: 0;
    }

    .pass-rate-bar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .pass-rate-text {
      font-size: 13px;
      font-weight: 600;
      color: #10b981;
      min-width: 40px;
    }

    .cert-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
  `]
})
export class CompetitionListComponent implements OnInit {
  searchKeyword: string = '';
  
  stats: CompetitionStats = {
    monthly_participants: 0,
    total_awards: 0,
    gold_awards: 0,
    upcoming_events: 0
  };

  competitions: Competition[] = [];
  certifications: Certification[] = [];
  averagePassRate: number = 0;

  // Mock data
  mockCompetitions: Competition[] = [
    {
      id: 1,
      name: '全国青少年电子信息智能创新大赛',
      organizer: '中国电子学会',
      level: '国家级',
      category: '机器人',
      register_deadline: '2026-06-30T00:00:00',
      competition_date: '2026-08-15T00:00:00',
      participants_count: 12,
      status: '报名中',
      achievements: '往届获奖: 一等奖2名, 二等奖5名'
    },
    {
      id: 2,
      name: '蓝桥杯青少年编程大赛',
      organizer: '工业和信息化部人才交流中心',
      level: '国家级',
      category: '编程',
      register_deadline: '2026-06-15T00:00:00',
      competition_date: '2026-07-20T00:00:00',
      participants_count: 18,
      status: '报名中',
      achievements: '往届获奖: 省赛一等奖8名'
    },
    {
      id: 3,
      name: '世界机器人大会青少年挑战赛',
      organizer: '中国电子学会',
      level: '国际级',
      category: '机器人',
      register_deadline: '2026-07-10T00:00:00',
      competition_date: '2026-08-25T00:00:00',
      participants_count: 8,
      status: '筹备中',
      achievements: '首次参赛'
    },
    {
      id: 4,
      name: '中小学生创客大赛',
      organizer: '教育部教育装备研究发展中心',
      level: '国家级',
      category: '创客',
      register_deadline: '2026-05-30T00:00:00',
      competition_date: '2026-07-05T00:00:00',
      participants_count: 15,
      status: '已截止',
      achievements: '往届获奖: 特等奖1名, 一等奖3名'
    }
  ];

  mockCertifications: Certification[] = [
    {
      id: 1,
      name: '全国青少年软件编程等级考试',
      organizer: '中国电子学会',
      certification_type: 'Python编程',
      levels: '一级,二级,三级,四级',
      next_exam_date: '2026-06-22T00:00:00',
      registered_students: 25,
      pass_rate: 85
    },
    {
      id: 2,
      name: 'Arduino官方认证工程师',
      organizer: 'Arduino官方',
      certification_type: '硬件开发',
      levels: '基础认证,进阶认证',
      next_exam_date: '2026-07-15T00:00:00',
      registered_students: 12,
      pass_rate: 78
    },
    {
      id: 3,
      name: '青少年人工智能技术水平测试',
      organizer: '中国人工智能产业发展联盟',
      certification_type: 'AI应用',
      levels: '初级,中级,高级',
      next_exam_date: '2026-08-10T00:00:00',
      registered_students: 18,
      pass_rate: 82
    }
  ];

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.competitions = this.mockCompetitions;
    this.certifications = this.mockCertifications;

    // 计算统计数据
    const totalParticipants = this.competitions.reduce((sum, comp) => sum + comp.participants_count, 0);
    const totalAwards = 127; // Mock
    const goldAwards = 15; // Mock
    
    this.stats = {
      monthly_participants: Math.floor(totalParticipants * 0.4),
      total_awards: totalAwards,
      gold_awards: goldAwards,
      upcoming_events: 3
    };

    // 计算平均通过率
    if (this.certifications.length > 0) {
      const totalPassRate = this.certifications.reduce((sum, cert) => sum + (cert.pass_rate || 0), 0);
      this.averagePassRate = Math.round(totalPassRate / this.certifications.length);
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      '报名中': 'status-badge registering',
      '筹备中': 'status-badge preparing',
      '已截止': 'status-badge closed'
    };
    return classes[status] || 'status-badge';
  }

  getLevels(levelsStr: string): string[] {
    return levelsStr ? levelsStr.split(',') : [];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSearch() {
    console.log('Searching for:', this.searchKeyword);
    // TODO: 实现搜索功能
  }
}
