import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ResourceCategory {
  id: number;
  name: string;
  icon: string;
  count: number;
  description: string;
  resources: TeachingResource[];
}

interface TeachingResource {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  category: string;
  resource_type: string;
  format: string;
  file_size?: number;
  download_count: number;
  upload_time: string;
  tags?: string;
  difficulty_level?: string;
}

interface ResourceStats {
  total_resources: number;
  monthly_downloads: number;
  video_hours: number;
  code_examples: number;
  category_stats: Array<{category: string, count: number}>;
}

@Component({
  selector: 'app-teaching-resources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="resources-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">教学资源库</h1>
          <p class="page-subtitle">课件、代码、视频等教学资源共享平台</p>
        </div>
        <button mat-raised-button color="primary" class="upload-btn">
          <mat-icon>add</mat-icon>
          上传资源
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">资源总数</p>
              <p class="stat-value">{{ stats.total_resources || 0 }}</p>
              <p class="stat-desc">覆盖{{ categoryCount }}大类别</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>menu_book</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">本月下载</p>
              <p class="stat-value">{{ stats.monthly_downloads || 0 }}</p>
              <p class="stat-trend positive">
                <mat-icon class="trend-icon">trending_up</mat-icon>
                +18% 较上月
              </p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>download</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">视频时长</p>
              <p class="stat-value">{{ stats.video_hours || 0 }}h</p>
              <p class="stat-desc">累计录制</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>videocam</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">代码示例</p>
              <p class="stat-value">{{ stats.code_examples || 0 }}</p>
              <p class="stat-desc">个项目</p>
            </div>
            <div class="stat-icon-wrapper emerald">
              <mat-icon>code</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>搜索资源</mat-label>
          <input matInput placeholder="输入资源名称或关键词" [(ngModel)]="searchKeyword" (keyup.enter)="onSearch()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <button mat-stroked-button class="filter-btn">
          <mat-icon>filter_list</mat-icon>
          筛选
        </button>
      </div>

      <!-- Resource Categories -->
      <div class="categories-container">
        <div *ngFor="let category of categories" class="category-section">
          <div class="category-header">
            <div class="category-info">
              <span class="category-icon">{{ category.icon }}</span>
              <div>
                <h2 class="category-name">{{ category.name }}</h2>
                <p class="category-description">{{ category.description }}</p>
              </div>
            </div>
            <div class="category-actions">
              <span class="resource-count-badge">{{ category.count }} 个资源</span>
              <button mat-stroked-button class="view-all-btn">
                <mat-icon>folder</mat-icon>
                查看全部
              </button>
            </div>
          </div>

          <div class="resources-grid">
            <div *ngFor="let resource of category.resources" class="resource-card">
              <div class="resource-header">
                <div class="resource-icon-title">
                  <span class="format-icon">{{ getFormatIcon(resource.format) }}</span>
                  <div>
                    <p class="resource-name">{{ resource.name }}</p>
                    <p class="resource-meta">{{ resource.resource_type }} · {{ resource.format }}</p>
                  </div>
                </div>
              </div>

              <div class="resource-details">
                <span *ngIf="resource.file_size" class="detail-item">{{ resource.file_size }}MB</span>
                <span class="detail-item">下载 {{ resource.download_count }}次</span>
              </div>

              <div class="resource-footer">
                <span class="upload-date">{{ formatDate(resource.upload_time) }}</span>
                <button mat-button class="download-btn" (click)="onDownload(resource)">
                  <mat-icon>download</mat-icon>
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Upload Area -->
      <div class="upload-area">
        <div class="upload-content">
          <div class="upload-icon-wrapper">
            <mat-icon>add_circle_outline</mat-icon>
          </div>
          <h3 class="upload-title">拖拽文件到此处上传</h3>
          <p class="upload-description">支持 PPT、PDF、视频、代码文件等多种格式</p>
          <button mat-raised-button color="primary" class="select-file-btn">
            选择文件
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resources-container {
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
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .upload-btn {
      background: #3b82f6 !important;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
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
      color: #64748b;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: 12px;
      color: #64748b;
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
      color: #10b981;
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

    .stat-icon-wrapper.blue {
      background: #eff6ff;
      color: #3b82f6;
    }

    .stat-icon-wrapper.purple {
      background: #f5f3ff;
      color: #8b5cf6;
    }

    .stat-icon-wrapper.amber {
      background: #fffbeb;
      color: #f59e0b;
    }

    .stat-icon-wrapper.emerald {
      background: #ecfdf5;
      color: #10b981;
    }

    /* Search Bar */
    .search-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .search-field {
      flex: 1;
    }

    .filter-btn {
      min-width: 100px;
    }

    /* Categories Container */
    .categories-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 24px;
    }

    .category-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .category-header {
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .category-icon {
      font-size: 32px;
    }

    .category-name {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 2px 0;
    }

    .category-description {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    .category-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .resource-count-badge {
      font-size: 12px;
      padding: 4px 12px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 12px;
    }

    .view-all-btn {
      font-size: 13px;
    }

    /* Resources Grid */
    .resources-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .resource-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .resource-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .resource-header {
      margin-bottom: 12px;
    }

    .resource-icon-title {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .format-icon {
      font-size: 24px;
    }

    .resource-name {
      font-size: 14px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 2px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .resource-meta {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    .resource-details {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
    }

    .resource-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .upload-date {
      font-size: 12px;
      color: #94a3b8;
    }

    .download-btn {
      font-size: 12px;
      background: #eff6ff;
      color: #3b82f6;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .resource-card:hover .download-btn {
      opacity: 1;
    }

    /* Upload Area */
    .upload-area {
      background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
      border: 2px dashed #93c5fd;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
    }

    .upload-content {
      max-width: 500px;
      margin: 0 auto;
    }

    .upload-icon-wrapper {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .upload-icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3b82f6;
    }

    .upload-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .upload-description {
      font-size: 14px;
      color: #475569;
      margin: 0 0 16px 0;
    }

    .select-file-btn {
      padding: 10px 24px;
    }
  `]
})
export class TeachingResourcesComponent implements OnInit {
  searchKeyword: string = '';
  stats: ResourceStats = {
    total_resources: 0,
    monthly_downloads: 0,
    video_hours: 0,
    code_examples: 0,
    category_stats: []
  };

  categories: ResourceCategory[] = [];
  categoryCount: number = 0;

  // Mock data
  mockCategories: ResourceCategory[] = [
    {
      id: 1,
      name: 'Arduino课件库',
      icon: '📚',
      count: 32,
      description: '传感器/通信/控制等教学方案',
      resources: [
        {
          id: 1,
          org_id: 1,
          name: 'Arduino基础入门教程',
          category: 'Arduino课件库',
          resource_type: '课件',
          format: 'PPT',
          file_size: 15,
          download_count: 156,
          upload_time: '2026-05-10T10:00:00'
        },
        {
          id: 2,
          org_id: 1,
          name: '传感器应用实验指导',
          category: 'Arduino课件库',
          resource_type: '实验手册',
          format: 'PDF',
          file_size: 8,
          download_count: 203,
          upload_time: '2026-05-08T10:00:00'
        },
        {
          id: 3,
          org_id: 1,
          name: 'PWM控制原理讲解',
          category: 'Arduino课件库',
          resource_type: '视频',
          format: 'MP4',
          file_size: 125,
          download_count: 89,
          upload_time: '2026-05-05T10:00:00'
        },
        {
          id: 4,
          org_id: 1,
          name: '智能小车项目完整代码',
          category: 'Arduino课件库',
          resource_type: '代码',
          format: 'ZIP',
          file_size: 2,
          download_count: 312,
          upload_time: '2026-04-28T10:00:00'
        }
      ]
    },
    {
      id: 2,
      name: 'Python编程资源',
      icon: '💻',
      count: 28,
      description: '基础语法/AI应用/数据分析',
      resources: [
        {
          id: 5,
          org_id: 1,
          name: 'Python零基础教程',
          category: 'Python编程资源',
          resource_type: '课件',
          format: 'PPT',
          file_size: 20,
          download_count: 245,
          upload_time: '2026-05-12T10:00:00'
        },
        {
          id: 6,
          org_id: 1,
          name: 'AI图像识别示例代码',
          category: 'Python编程资源',
          resource_type: '代码',
          format: 'PY',
          file_size: 5,
          download_count: 178,
          upload_time: '2026-05-09T10:00:00'
        },
        {
          id: 7,
          org_id: 1,
          name: '数据处理实战案例',
          category: 'Python编程资源',
          resource_type: '实验手册',
          format: 'PDF',
          file_size: 12,
          download_count: 134,
          upload_time: '2026-05-06T10:00:00'
        }
      ]
    },
    {
      id: 3,
      name: '机器人课程包',
      icon: '🤖',
      count: 18,
      description: '结构搭建/运动控制/算法设计',
      resources: [
        {
          id: 8,
          org_id: 1,
          name: '乐高EV3基础课程',
          category: '机器人课程包',
          resource_type: '课件',
          format: 'PPT',
          file_size: 25,
          download_count: 167,
          upload_time: '2026-05-11T10:00:00'
        },
        {
          id: 9,
          org_id: 1,
          name: '巡线算法详解',
          category: '机器人课程包',
          resource_type: '视频',
          format: 'MP4',
          file_size: 98,
          download_count: 145,
          upload_time: '2026-05-07T10:00:00'
        },
        {
          id: 10,
          org_id: 1,
          name: '机械臂控制程序',
          category: '机器人课程包',
          resource_type: '代码',
          format: 'INO',
          file_size: 3,
          download_count: 198,
          upload_time: '2026-05-03T10:00:00'
        }
      ]
    },
    {
      id: 4,
      name: 'IoT物联网项目',
      icon: '🌐',
      count: 15,
      description: 'ESP32/MQTT/云平台接入',
      resources: [
        {
          id: 11,
          org_id: 1,
          name: 'ESP32 WiFi连接教程',
          category: 'IoT物联网项目',
          resource_type: '课件',
          format: 'PPT',
          file_size: 18,
          download_count: 189,
          upload_time: '2026-05-13T10:00:00'
        },
        {
          id: 12,
          org_id: 1,
          name: 'MQTT通信协议实例',
          category: 'IoT物联网项目',
          resource_type: '代码',
          format: 'ZIP',
          file_size: 4,
          download_count: 223,
          upload_time: '2026-05-10T10:00:00'
        },
        {
          id: 13,
          org_id: 1,
          name: '智能家居监控系统',
          category: 'IoT物联网项目',
          resource_type: '项目文档',
          format: 'PDF',
          file_size: 10,
          download_count: 156,
          upload_time: '2026-05-04T10:00:00'
        }
      ]
    }
  ];

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    // 使用Mock数据
    this.categories = this.mockCategories;
    this.categoryCount = this.categories.length;
    
    // 计算统计数据
    let totalResources = 0;
    let totalDownloads = 0;
    let videoCount = 0;
    let codeCount = 0;

    this.categories.forEach(cat => {
      totalResources += cat.resources.length;
      cat.resources.forEach(res => {
        totalDownloads += res.download_count;
        if (res.resource_type === '视频') videoCount++;
        if (res.resource_type === '代码') codeCount++;
      });
    });

    this.stats = {
      total_resources: totalResources,
      monthly_downloads: Math.floor(totalDownloads * 0.3), // 模拟本月下载量
      video_hours: videoCount * 0.5, // 假设每个视频30分钟
      code_examples: codeCount,
      category_stats: this.categories.map(cat => ({
        category: cat.name,
        count: cat.resources.length
      }))
    };
  }

  getFormatIcon(format: string): string {
    const icons: Record<string, string> = {
      'PPT': '📊',
      'PDF': '📄',
      'MP4': '🎥',
      'ZIP': '📦',
      'PY': '🐍',
      'INO': '⚙️',
      'DOCX': '📝'
    };
    return icons[format] || '📄';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSearch() {
    console.log('Searching for:', this.searchKeyword);
    // TODO: 实现搜索功能
  }

  onDownload(resource: TeachingResource) {
    console.log('Downloading resource:', resource.name);
    // TODO: 调用API记录下载并触发文件下载
  }
}
