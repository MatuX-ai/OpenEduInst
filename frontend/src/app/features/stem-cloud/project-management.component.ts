import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

export interface STEMProject {
  id: string;
  name: string;
  category: string;
  status: 'planning' | 'in_progress' | 'completed' | 'showcase';
  progress: number;
  students: number;
  mentor: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies: string[];
  showcase?: boolean;
}

export interface ProjectCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatExpansionModule
  ],
  template: `
    <div class="project-management">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>实验项目跟踪</h1>
          <p class="subtitle">机器人竞赛、创客作品、编程项目归档</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="onCreateProject()">
            <mat-icon>add</mat-icon>
            创建项目
          </button>
          <button mat-stroked-button (click)="onViewShowcase()">
            <mat-icon>display_settings</mat-icon>
            作品展示
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon blue">
                <mat-icon>science</mat-icon>
              </div>
              <span class="stat-trend up">↑ 8%</span>
            </div>
            <div class="stat-value">{{ totalProjects }}</div>
            <div class="stat-label">项目总数</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon green">
                <mat-icon>check_circle</mat-icon>
              </div>
              <span class="stat-trend up">↑ 12%</span>
            </div>
            <div class="stat-value">{{ completedProjects }}</div>
            <div class="stat-label">已完成</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon orange">
                <mat-icon>hourglass_empty</mat-icon>
              </div>
              <span class="stat-trend stable">→ 稳定</span>
            </div>
            <div class="stat-value">{{ inProgressProjects }}</div>
            <div class="stat-label">进行中</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <div class="stat-icon purple">
                <mat-icon>emoji_events</mat-icon>
              </div>
              <span class="stat-trend up">↑ 5%</span>
            </div>
            <div class="stat-value">{{ showcaseProjects }}</div>
            <div class="stat-label">展示作品</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Project Categories -->
      <div class="section-title">项目分类</div>
      <div class="categories-grid">
        <mat-card *ngFor="let category of projectCategories" class="category-card" (click)="onCategorySelect(category)">
          <mat-card-content>
            <div class="category-icon" [style.background]="category.color">
              <mat-icon>{{ category.icon }}</mat-icon>
            </div>
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p class="category-count">{{ category.count }}个项目</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Project List -->
      <mat-card class="project-list-card">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex">
          <mat-tab label="全部项目">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="table-controls">
                  <div class="search-box">
                    <mat-icon>search</mat-icon>
                    <input type="text" placeholder="搜索项目名称、描述..." [(ngModel)]="searchTerm" />
                  </div>
                  <div class="filter-controls">
                    <select [(ngModel)]="statusFilter">
                      <option value="">全部状态</option>
                      <option value="planning">规划中</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="showcase">展示中</option>
                    </select>
                    <select [(ngModel)]="categoryFilter">
                      <option value="">全部分类</option>
                      <option *ngFor="let cat of projectCategories" [value]="cat.id">{{ cat.name }}</option>
                    </select>
                  </div>
                </div>

                <table mat-table [dataSource]="filteredProjects" class="project-table">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>项目编号</th>
                    <td mat-cell *matCellDef="let project">{{ project.id }}</td>
                  </ng-container>

                  <!-- Name Column -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>项目名称</th>
                    <td mat-cell *matCellDef="let project">
                      <div class="project-name-cell">
                        <span>{{ project.name }}</span>
                        <mat-icon *ngIf="project.showcase" class="showcase-icon" title="展示作品">stars</mat-icon>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Category Column -->
                  <ng-container matColumnDef="category">
                    <th mat-header-cell *matHeaderCellDef>分类</th>
                    <td mat-cell *matCellDef="let project">
                      <mat-chip class="category-chip">{{ getCategoryName(project.category) }}</mat-chip>
                    </td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let project">
                      <mat-chip [class]="'status-chip ' + project.status">
                        {{ getStatusText(project.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Progress Column -->
                  <ng-container matColumnDef="progress">
                    <th mat-header-cell *matHeaderCellDef>进度</th>
                    <td mat-cell *matCellDef="let project">
                      <div class="progress-cell">
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="project.progress"
                          [color]="getProgressColor(project.progress)">
                        </mat-progress-bar>
                        <span>{{ project.progress }}%</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Students Column -->
                  <ng-container matColumnDef="students">
                    <th mat-header-cell *matHeaderCellDef>学生数</th>
                    <td mat-cell *matCellDef="let project">{{ project.students }}人</td>
                  </ng-container>

                  <!-- Mentor Column -->
                  <ng-container matColumnDef="mentor">
                    <th mat-header-cell *matHeaderCellDef>导师</th>
                    <td mat-cell *matCellDef="let project">{{ project.mentor }}</td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let project">
                      <div class="action-buttons">
                        <button mat-icon-button (click)="onViewProject(project)" title="查看详情">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onEditProject(project)" title="编辑">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="onViewShowcaseItem(project)" title="作品展示" *ngIf="project.showcase">
                          <mat-icon>display_settings</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="进行中">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示进行中的项目...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="已完成">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示已完成的项目...</p>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab label="展示作品">
            <ng-template matTabContent>
              <div class="tab-content">
                <p>显示展示作品...</p>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Recent Projects Grid -->
      <div class="section-title">最近项目</div>
      <div class="projects-grid">
        <mat-card *ngFor="let project of recentProjects" class="project-card">
          <mat-card-content>
            <div class="project-header">
              <div class="project-category" [style.background]="getCategoryColor(project.category)">
                <mat-icon>{{ getCategoryIcon(project.category) }}</mat-icon>
              </div>
              <mat-chip [class]="'status-chip ' + project.status">
                {{ getStatusText(project.status) }}
              </mat-chip>
            </div>
            <h3>{{ project.name }}</h3>
            <p class="project-description">{{ project.description }}</p>
            
            <div class="project-meta">
              <div class="meta-item">
                <mat-icon>people</mat-icon>
                <span>{{ project.students }}名学生</span>
              </div>
              <div class="meta-item">
                <mat-icon>person</mat-icon>
                <span>{{ project.mentor }}</span>
              </div>
              <div class="meta-item">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ project.startDate }}</span>
              </div>
            </div>

            <div class="project-progress">
              <div class="progress-header">
                <span>项目进度</span>
                <span>{{ project.progress }}%</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="project.progress"
                [color]="getProgressColor(project.progress)">
              </mat-progress-bar>
            </div>

            <div class="project-tech">
              <mat-chip *ngFor="let tech of project.technologies" class="tech-chip">
                {{ tech }}
              </mat-chip>
            </div>

            <div class="project-actions">
              <button mat-stroked-button (click)="onViewProject(project)">
                查看详情
              </button>
              <button mat-raised-button color="primary" (click)="onEditProject(project)">
                编辑项目
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .project-management {
      padding: 24px;
      background: #f5f7fa;
      min-height: 100%;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .subtitle {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button mat-icon {
      margin-right: 8px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    mat-card-content {
      padding: 20px !important;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
    .stat-icon.green { background: linear-gradient(135deg, #4caf50, #388e3c); }
    .stat-icon.orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .stat-icon.purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }

    .stat-trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .stat-trend.up { color: #4caf50; background: #e8f5e9; }
    .stat-trend.down { color: #f44336; background: #ffebee; }
    .stat-trend.stable { color: #ff9800; background: #fff3e0; }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 8px 0;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    /* Section Title */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .category-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .category-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px !important;
    }

    .category-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: white;
    }

    .category-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .category-info {
      flex: 1;
    }

    .category-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .category-count {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #666;
    }

    /* Project List Card */
    .project-list-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 32px;
    }

    .tab-content {
      padding: 20px;
    }

    .table-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .search-box {
      position: relative;
      width: 300px;
    }

    .search-box mat-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
    }

    .search-box input {
      width: 100%;
      padding: 10px 10px 10px 40px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .filter-controls {
      display: flex;
      gap: 12px;
    }

    .filter-controls select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    /* Table Styles */
    .project-table {
      width: 100%;
    }

    .project-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .showcase-icon {
      color: #ff9800;
      font-size: 18px;
    }

    .category-chip {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-chip {
      font-size: 12px;
    }

    .status-chip.planning {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-chip.in_progress {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-chip.completed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-chip.showcase {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-cell mat-progress-bar {
      width: 80px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .project-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }

    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .project-card mat-card-content {
      padding: 20px !important;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .project-category {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .project-category mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .project-card h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .project-description {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }

    .project-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }

    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }

    .project-progress {
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tech-chip {
      font-size: 11px;
      background: #f5f5f5;
      color: #666;
    }

    .project-actions {
      display: flex;
      gap: 8px;
    }

    .project-actions button {
      flex: 1;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .projects-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .categories-grid {
        grid-template-columns: 1fr;
      }
      .projects-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .table-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .search-box {
        width: 100%;
      }
      .filter-controls {
        justify-content: stretch;
      }
      .filter-controls select {
        flex: 1;
      }
    }
  `]
})
export class ProjectManagementComponent implements OnInit {
  // Stats data
  totalProjects = 42;
  completedProjects = 18;
  inProgressProjects = 20;
  showcaseProjects = 8;

  // Project categories
  projectCategories: ProjectCategory[] = [
    { id: 'robotics', name: '机器人', icon: 'android', count: 15, color: 'linear-gradient(135deg, #2196f3, #1976d2)' },
    { id: 'programming', name: '编程项目', icon: 'code', count: 12, color: 'linear-gradient(135deg, #4caf50, #388e3c)' },
    { id: 'iot', name: '物联网', icon: 'wifi', count: 8, color: 'linear-gradient(135deg, #ff9800, #f57c00)' },
    { id: 'ai', name: '人工智能', icon: 'smart_toy', count: 7, color: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }
  ];

  // Sample projects data
  projects: STEMProject[] = [
    { 
      id: 'PROJ-001', 
      name: '智能温室控制系统', 
      category: 'iot', 
      status: 'in_progress', 
      progress: 75, 
      students: 18, 
      mentor: '张老师', 
      startDate: '2024-01-10', 
      description: '基于Arduino的温湿度自动控制系统',
      technologies: ['Arduino', '传感器', 'Python']
    },
    { 
      id: 'PROJ-002', 
      name: 'AI视觉识别小车', 
      category: 'robotics', 
      status: 'completed', 
      progress: 100, 
      students: 15, 
      mentor: '李老师', 
      startDate: '2023-12-01', 
      endDate: '2024-01-15',
      description: '使用树莓派和摄像头实现物体识别和追踪',
      technologies: ['Raspberry Pi', 'Python', 'OpenCV'],
      showcase: true
    },
    { 
      id: 'PROJ-003', 
      name: '物联网环境监测', 
      category: 'iot', 
      status: 'in_progress', 
      progress: 60, 
      students: 22, 
      mentor: '王老师', 
      startDate: '2024-01-05', 
      description: '多节点环境数据采集与云平台展示',
      technologies: ['ESP32', 'MQTT', '云平台']
    },
    { 
      id: 'PROJ-004', 
      name: '语音助手开发', 
      category: 'ai', 
      status: 'in_progress', 
      progress: 45, 
      students: 12, 
      mentor: '陈老师', 
      startDate: '2024-01-12', 
      description: '基于自然语言处理的智能语音交互系统',
      technologies: ['Python', 'NLP', '语音识别']
    },
    { 
      id: 'PROJ-005', 
      name: '无人机编程控制', 
      category: 'robotics', 
      status: 'planning', 
      progress: 20, 
      students: 9, 
      mentor: '赵老师', 
      startDate: '2024-01-20', 
      description: 'Scratch图形化编程控制无人机飞行',
      technologies: ['Scratch', '无人机', '图形化编程']
    },
    { 
      id: 'PROJ-006', 
      name: '智能家居控制系统', 
      category: 'iot', 
      status: 'completed', 
      progress: 100, 
      students: 16, 
      mentor: '刘老师', 
      startDate: '2023-11-15', 
      endDate: '2024-01-10',
      description: '手机APP控制家居设备的IoT系统',
      technologies: ['Arduino', 'WiFi模块', 'Android'],
      showcase: true
    }
  ];

  // Recent projects for grid display
  recentProjects = this.projects.slice(0, 6);

  // Table configuration
  displayedColumns: string[] = ['id', 'name', 'category', 'status', 'progress', 'students', 'mentor', 'actions'];
  selectedTabIndex = 0;
  
  // Filter variables
  searchTerm = '';
  statusFilter = '';
  categoryFilter = '';

  constructor() {}

  ngOnInit(): void {}

  // Helper methods
  getFilteredProjects(): STEMProject[] {
    return this.projects.filter(project => {
      const matchesSearch = !this.searchTerm || 
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || project.status === this.statusFilter;
      const matchesCategory = !this.categoryFilter || project.category === this.categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  get filteredProjects() {
    return this.getFilteredProjects();
  }

  getCategoryName(categoryId: string): string {
    const category = this.projectCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.projectCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : 'science';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.projectCategories.find(cat => cat.id === categoryId);
    return category ? category.color : 'linear-gradient(135deg, #2196f3, #1976d2)';
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'planning': return '规划中';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'showcase': return '展示中';
      default: return status;
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 50) return 'accent';
    return 'warn';
  }

  // Event handlers
  onCreateProject(): void {
    console.log('Create new project');
  }

  onViewShowcase(): void {
    console.log('View project showcase');
  }

  onCategorySelect(category: ProjectCategory): void {
    console.log('Category selected:', category);
  }

  onViewProject(project: STEMProject): void {
    console.log('View project:', project);
  }

  onEditProject(project: STEMProject): void {
    console.log('Edit project:', project);
  }

  onViewShowcaseItem(project: STEMProject): void {
    console.log('View showcase item:', project);
  }
}