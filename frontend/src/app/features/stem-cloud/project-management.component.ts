import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StemCloudService, STEMProject, ProjectCategory } from '../../services/stem-cloud.service';

// Re-export for template compatibility if needed, but we'll use the service ones directly
export { STEMProject, ProjectCategory };

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatProgressBarModule
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
            <mat-icon>emoji_events</mat-icon>
            作品展示
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <span class="stat-label">进行中项目</span>
              <div class="stat-icon blue">
                <mat-icon>engineering</mat-icon>
              </div>
            </div>
            <div class="stat-value">{{ inProgressProjects }}</div>
            <div class="stat-trend up">活跃开展中</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <span class="stat-label">参与学生</span>
              <div class="stat-icon green">
                <mat-icon>people</mat-icon>
              </div>
            </div>
            <div class="stat-value">{{ totalStudents }}</div>
            <div class="stat-trend up">覆盖{{ projects.length }}个项目</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <span class="stat-label">平均进度</span>
              <div class="stat-icon orange">
                <mat-icon>trending_up</mat-icon>
              </div>
            </div>
            <div class="stat-value">{{ averageProgress }}%</div>
            <div class="stat-trend stable">整体推进良好</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-header">
              <span class="stat-label">本月完成</span>
              <div class="stat-icon purple">
                <mat-icon>emoji_events</mat-icon>
              </div>
            </div>
            <div class="stat-value">{{ completedThisMonth }}</div>
            <div class="stat-trend up">{{ lastCompletedProject || '暂无' }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Progress Distribution Chart -->
      <div class="chart-container">
        <div class="chart-header">
          <h3 class="chart-title">项目进度分布</h3>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot" style="background: #94a3b8"></span>
              规划中
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: $color-brand-primary"></span>
              进行中
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: #059669"></span>
              已完成
            </span>
          </div>
        </div>
        <div class="progress-distribution">
          <div class="distribution-item" *ngFor="let item of progressDistribution">
            <div class="distribution-label-section">
              <span class="distribution-label">{{ item.label }}</span>
              <span class="distribution-count">{{ item.count }}个</span>
            </div>
            <div class="distribution-bar">
              <div class="bar-fill" [style.width.%]="item.percentage" [style.background]="item.color">
                <span class="bar-percentage" *ngIf="item.percentage > 10">{{ item.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter Bar -->
      <div class="search-filter-bar">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            placeholder="搜索项目名称、描述、导师..." 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          />
        </div>
        <div class="filter-actions">
          <button mat-stroked-button (click)="toggleFilter()" [class.active]="showFilterPanel">
            <mat-icon>filter_list</mat-icon>
            筛选
            <span *ngIf="hasActiveFilters" class="filter-badge">{{ activeFilterCount }}</span>
          </button>
          <button mat-stroked-button (click)="toggleBatchMode()" [class.active]="batchMode">
            <mat-icon>checklist</mat-icon>
            {{ batchMode ? '取消批量' : '批量操作' }}
          </button>
          <button mat-stroked-button (click)="exportProjects()" *ngIf="!batchMode">
            <mat-icon>download</mat-icon>
            导出
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      <div *ngIf="showFilterPanel" class="filter-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label>项目状态</label>
            <div class="filter-options">
              <button 
                mat-button 
                [class.active]="statusFilter === ''"
                (click)="statusFilter = ''"
              >
                全部
              </button>
              <button 
                mat-button 
                [class.active]="statusFilter === 'planning'"
                (click)="statusFilter = 'planning'"
              >
                规划中
              </button>
              <button 
                mat-button 
                [class.active]="statusFilter === 'in_progress'"
                (click)="statusFilter = 'in_progress'"
              >
                进行中
              </button>
              <button 
                mat-button 
                [class.active]="statusFilter === 'completed'"
                (click)="statusFilter = 'completed'"
              >
                已完成
              </button>
            </div>
          </div>
          
          <div class="filter-group">
            <label>项目分类</label>
            <select [(ngModel)]="categoryFilter" class="filter-select">
              <option value="">全部分类</option>
              <option *ngFor="let cat of projectCategories" [value]="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-actions-bottom">
          <span class="filter-hint">* 筛选结果实时更新</span>
          <button mat-button color="warn" (click)="clearFilters()">
            <mat-icon>close</mat-icon>
            清除筛选
          </button>
        </div>
      </div>

      <!-- Batch Actions Bar -->
      <div *ngIf="batchMode && selectedProjects.size > 0" class="batch-actions-bar">
        <div class="batch-info">
          <mat-icon>checklist</mat-icon>
          <span class="selected-count">已选择 {{ selectedProjects.size }} 个项目</span>
        </div>
        <div class="batch-buttons">
          <button mat-flat-button color="primary" (click)="batchUpdateStatus('in_progress')">
            <mat-icon>play_arrow</mat-icon>
            设为进行中
          </button>
          <button mat-flat-button color="accent" (click)="batchUpdateStatus('completed')">
            <mat-icon>check_circle</mat-icon>
            设为已完成
          </button>
          <button mat-flat-button color="warn" (click)="batchDelete()">
            <mat-icon>delete</mat-icon>
            删除
          </button>
          <button mat-stroked-button (click)="clearSelection()">
            <mat-icon>close</mat-icon>
            取消
          </button>
        </div>
      </div>

      <!-- Toast Notification -->
      <div *ngIf="showToast" class="toast-notification" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
        <mat-icon>{{ toastType === 'success' ? 'check_circle' : 'error' }}</mat-icon>
        <span>{{ toastMessage }}</span>
        <button mat-icon-button (click)="hideToast()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Quick View Dialog -->
      <div *ngIf="showQuickView" class="dialog-overlay" (click)="closeQuickView()">
        <div class="quick-view-dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{ quickViewProject?.name }}</h2>
            <button mat-icon-button (click)="closeQuickView()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="dialog-content" *ngIf="quickViewProject">
            <div class="dialog-badges">
              <span class="category-badge" [style.background]="getCategoryColor(quickViewProject.category)">
                {{ getCategoryName(quickViewProject.category) }}
              </span>
              <span class="status-badge" [class]="getStatusClass(quickViewProject.status)">
                {{ getStatusText(quickViewProject.status) }}
              </span>
            </div>
            <p class="dialog-description">{{ quickViewProject.description }}</p>
            <div class="dialog-info-grid">
              <div class="info-row">
                <span class="info-label">指导教师：</span>
                <span class="info-value">{{ quickViewProject.mentor || '未分配' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">参与学生：</span>
                <span class="info-value">{{ quickViewProject.students }} 人</span>
              </div>
              <div class="info-row">
                <span class="info-label">开始日期：</span>
                <span class="info-value">{{ quickViewProject.startDate | date:'yyyy-MM-dd' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">结束日期：</span>
                <span class="info-value">{{ quickViewProject.endDate | date:'yyyy-MM-dd' }}</span>
              </div>
            </div>
            <div class="dialog-progress">
              <div class="progress-header">
                <span>项目进度</span>
                <span>{{ quickViewProject.progress }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="quickViewProject.progress"
                [class.progress-low]="quickViewProject.progress < 60"
                [class.progress-medium]="quickViewProject.progress >= 60 && quickViewProject.progress < 100"
                [class.progress-high]="quickViewProject.progress === 100">
              </mat-progress-bar>
            </div>
            <div class="dialog-tech" *ngIf="quickViewProject.technologies && quickViewProject.technologies.length > 0">
              <span class="tech-label">使用技术：</span>
              <div class="tech-tags">
                <span *ngFor="let tech of quickViewProject.technologies" class="tech-tag">{{ tech }}</span>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button mat-stroked-button (click)="closeQuickView()">关闭</button>
            <button mat-raised-button color="primary" (click)="onEditProject(quickViewProject!)">编辑项目</button>
          </div>
        </div>
      </div>

      <!-- Project List - Card Layout -->
      <div class="project-list-container">
        <div class="list-header">
          <h2 class="section-title-inline">项目列表</h2>
          <span class="count-badge">共 {{ filteredProjects.length }} 个</span>
        </div>
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>加载中...</p>
        </div>
        
        <div class="project-cards" *ngIf="!isLoading">
          <mat-card *ngFor="let project of filteredProjects" class="project-card" [class.selected]="isSelected(project.id)">
            <mat-card-content>
              <!-- Batch Selection Checkbox -->
              <div *ngIf="batchMode" class="batch-checkbox" (click)="toggleSelection(project.id)">
                <mat-icon>{{ isSelected(project.id) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
              </div>
              
              <div class="project-header">
                <div class="project-title-section">
                  <h3 class="project-name">{{ project.name }}</h3>
                  <div class="badges">
                    <span class="category-badge" [style.background]="getCategoryColor(project.category)">
                      {{ getCategoryName(project.category) }}
                    </span>
                    <span class="status-badge" [class]="getStatusClass(project.status)">
                      {{ getStatusText(project.status) }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <button mat-icon-button (click)="onQuickView(project)" title="快速查看">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button (click)="onEditProject(project)" title="编辑">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="onDeleteProject(project)" title="删除" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <p class="project-description">{{ project.description }}</p>
              
              <div class="project-info-grid">
                <div class="info-item">
                  <span class="info-label">指导教师</span>
                  <span class="info-value">{{ project.mentor || '未分配' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">参与学生</span>
                  <span class="info-value">{{ project.students }} 人</span>
                </div>
                <div class="info-item">
                  <span class="info-label">开始日期</span>
                  <span class="info-value">{{ project.startDate | date:'yyyy-MM-dd' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">结束日期</span>
                  <span class="info-value">{{ project.endDate | date:'yyyy-MM-dd' }}</span>
                </div>
              </div>
              
              <div class="progress-section">
                <div class="progress-header">
                  <span class="progress-label">项目进度</span>
                  <span class="progress-value">{{ project.progress }}%</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="project.progress"
                  [class.progress-low]="project.progress < 60"
                  [class.progress-medium]="project.progress >= 60 && project.progress < 100"
                  [class.progress-high]="project.progress === 100">
                </mat-progress-bar>
              </div>
            </mat-card-content>
          </mat-card>
          
          <!-- Empty State -->
          <div *ngIf="filteredProjects.length === 0" class="empty-state">
            <mat-icon class="empty-icon">inbox</mat-icon>
            <h3>暂无项目</h3>
            <p>点击“创建项目”开始您的第一个 STEM 项目</p>
            <button mat-raised-button color="primary" (click)="onCreateProject()">
              <mat-icon>add</mat-icon>
              创建项目
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/design-tokens' as *;
    .project-management {
      padding: 24px;
      background: $color-neutral-100;
      min-height: 100%;
      color: $color-neutral-700;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: $color-neutral-900;
      line-height: 1.3;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: $color-neutral-500;
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
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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

    .stat-label {
      font-size: 12px;
      color: $color-neutral-500;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.blue { background: $color-brand-primary-bg; color: $color-brand-primary; }
    .stat-icon.green { background: $color-stem-green-bg; color: $color-stem-green; }
    .stat-icon.orange { background: $color-warning-light; color: $color-warning; }
    .stat-icon.purple { background: $color-brand-primary-subtle; color: $color-brand-primary; }

    .stat-trend {
      font-size: 12px;
      font-weight: 500;
    }

    .stat-trend.up { 
      color: $color-stem-green;
    }
    .stat-trend.down { 
      color: $color-error;
    }
    .stat-trend.stable { 
      color: $color-brand-primary;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: $color-neutral-900;
      margin: 8px 0;
    }

    .stat-label {
      color: $color-neutral-500;
      font-size: 12px;
      font-weight: 500;
    }

    /* Section Title */
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-700;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .category-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .category-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
      font-size: 14px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .category-count {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: $color-neutral-500;
    }

    /* Project List Card */
    .project-list-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      margin-bottom: 24px;
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
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 8px 12px 8px 36px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      background: $card-bg;
      color: $color-neutral-900;
    }

    .search-box input::placeholder {
      color: #94a3b8;
    }

    .filter-controls {
      display: flex;
      gap: 12px;
    }

    .filter-controls select {
      padding: 8px 12px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      background: $card-bg;
      color: $color-neutral-900;
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
      background: #f1f5f9;
      color: #475569;
    }

    .status-chip {
      font-size: 12px;
    }

    .status-chip.planning {
      background: #f1f5f9;
      color: #475569;
    }

    .status-chip.in_progress {
      background: #dbeafe;
      color: $color-brand-primary;
    }

    .status-chip.completed {
      background: #d1fae5;
      color: $color-stem-green;
    }

    .status-chip.showcase {
      background: #ede9fe;
      color: #7c3aed;
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

    /* Search and Filter Bar */
    .search-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 12px;
    }

    .filter-actions button.active {
      background: #dbeafe;
      border-color: $color-brand-primary;
      color: $color-brand-primary;
    }

    .filter-actions button + button {
      margin-left: 8px;
    }

    .filter-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      margin-left: 6px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      border-radius: 9px;
    }

    /* Filter Panel */
    .filter-panel {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .filter-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 16px;
    }

    .filter-group {
      margin-bottom: 0;
    }

    .filter-group:last-of-type {
      margin-bottom: 0;
    }

    .filter-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
    }

    .filter-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      font-size: 14px;
      color: $color-neutral-700;
      background: white;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
    }

    .filter-select:hover {
      border-color: #cbd5e1;
    }

    .filter-select:focus {
      border-color: $color-brand-primary;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filter-options button {
      font-size: 13px;
      padding: 6px 16px;
      border-radius: 16px;
      border: 1px solid $color-neutral-200;
      background: $card-bg;
      color: #475569;
      transition: all 0.2s ease;
    }

    .filter-options button:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .filter-options button.active {
      background: $color-brand-primary;
      border-color: $color-brand-primary;
      color: white;
    }

    .filter-actions-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }

    .filter-hint {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
    }

    .filter-actions-bottom button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .search-box {
      position: relative;
      width: 224px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 8px 16px 8px 40px;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      background: $card-bg;
      color: $color-neutral-900;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-box input:focus {
      border-color: $color-brand-primary;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-box input::placeholder {
      color: #94a3b8;
    }

    /* Project List Container */
    .project-list-container {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      overflow: hidden;
    }

    .list-header {
      padding: 20px;
      border-bottom: 1px solid $color-neutral-200;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title-inline {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-700;
    }

    .count-badge {
      font-size: 12px;
      padding: 4px 12px;
      background: #f1f5f9;
      color: #475569;
      border-radius: 12px;
    }

    .project-cards {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .project-card {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
      position: relative;
    }

    .project-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .project-card mat-card-content {
      padding: 20px !important;
    }

    .project-title-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .project-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .badges {
      display: flex;
      gap: 8px;
    }

    .category-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 500;
    }

    .status-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 12px;
      border: 1px solid;
      font-weight: 500;
    }

    .status-badge.planning {
      background: #f8fafc;
      color: #475569;
      border-color: $color-neutral-200;
    }

    .status-badge.in_progress {
      background: #dbeafe;
      color: $color-brand-primary;
      border-color: #bfdbfe;
    }

    .status-badge.completed {
      background: #d1fae5;
      color: $color-stem-green;
      border-color: #a7f3d0;
    }

    .project-description {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
    }

    .project-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: $color-neutral-500;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: $color-neutral-900;
    }

    .progress-section {
      margin-top: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 12px;
      color: $color-neutral-500;
    }

    .progress-value {
      font-size: 12px;
      font-weight: 600;
      color: $color-brand-primary;
    }

    /* Card Actions */
    .card-actions {
      display: flex;
      gap: 4px;
    }

    .card-actions button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: $color-neutral-500;
    }

    .empty-state .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #cbd5e1;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: $color-neutral-700;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      font-size: 14px;
    }

    .empty-state button mat-icon {
      margin-right: 8px;
    }

    /* Chart Container */
    .chart-container {
      background: $card-bg;
      border: 1px solid $color-neutral-200;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .chart-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-neutral-700;
    }

    .chart-legend {
      display: flex;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $color-neutral-500;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .progress-distribution {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .distribution-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .distribution-label-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .distribution-bar {
      height: 24px;
      background: #f1f5f9;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      border-radius: 12px;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      min-width: 40px;
    }

    .bar-percentage {
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .distribution-label {
      font-size: 13px;
      color: #475569;
    }

    .distribution-count {
      font-size: 13px;
      font-weight: 600;
      color: $color-neutral-700;
    }

    /* Batch Actions Bar */
    .batch-actions-bar {
      background: white;
      border: 2px solid $color-brand-primary;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }

    .batch-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .batch-info mat-icon {
      color: $color-brand-primary;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .selected-count {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
    }

    .batch-buttons {
      display: flex;
      gap: 8px;
    }

    .batch-buttons button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    /* Batch Checkbox */
    .batch-checkbox {
      position: absolute;
      top: 12px;
      right: 12px;
      cursor: pointer;
      z-index: 10;
    }

    .batch-checkbox mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: $color-brand-primary;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .project-card.selected {
      border: 2px solid $color-brand-primary;
      background: #eff6ff;
    }

    /* Toast Notification */
    .toast-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      min-width: 280px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-notification.success {
      border-left: 4px solid #059669;
    }

    .toast-notification.success mat-icon {
      color: $color-stem-green;
    }

    .toast-notification.error {
      border-left: 4px solid #dc2626;
    }

    .toast-notification.error mat-icon {
      color: $color-error;
    }

    .toast-notification span {
      flex: 1;
      font-size: 14px;
      color: $color-neutral-700;
    }

    .toast-notification button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: $color-neutral-500;
    }

    /* Dialog Overlay */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .quick-view-dialog {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: scaleIn 0.2s ease;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: $color-neutral-900;
    }

    .dialog-content {
      padding: 24px;
    }

    .dialog-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .dialog-description {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    .dialog-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-row .info-label {
      font-size: 12px;
      color: $color-neutral-500;
    }

    .info-row .info-value {
      font-size: 14px;
      font-weight: 500;
      color: $color-neutral-900;
    }

    .dialog-progress {
      margin-bottom: 20px;
    }

    .dialog-progress .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: $color-neutral-500;
    }

    .dialog-tech {
      margin-top: 16px;
    }

    .tech-label {
      display: block;
      font-size: 13px;
      color: $color-neutral-500;
      margin-bottom: 8px;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tech-tag {
      padding: 4px 12px;
      background: #f1f5f9;
      color: #475569;
      border-radius: 12px;
      font-size: 12px;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      color: $color-neutral-500;
    }

    .loading-state mat-progress-bar {
      max-width: 300px;
      margin: 0 auto 16px;
    }

    .loading-state p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .project-management {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        flex: 1;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .search-filter-bar {
        flex-direction: column;
      }

      .search-box {
        max-width: 100%;
      }

      .filter-options {
        justify-content: center;
      }

      .project-title-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-actions {
        align-self: flex-end;
      }

      .project-info-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .project-info-grid {
        grid-template-columns: 1fr;
      }

      .badges {
        flex-wrap: wrap;
      }
    }
    ::ng-deep .mat-mdc-table {
      background: transparent;
      color: $color-neutral-700;
    }

    ::ng-deep .mat-mdc-header-cell {
      color: #64748b !important;
      font-weight: 600;
      font-size: 12px;
      border-bottom-color: $color-neutral-200 !important;
    }

    ::ng-deep .mat-mdc-cell {
      color: $color-neutral-700;
      border-bottom-color: #f1f5f9 !important;
    }

    ::ng-deep .mat-mdc-row:hover {
      background: #f8fafc;
    }

    /* Angular Material Tabs Light Theme */
    ::ng-deep .mat-mdc-tab-group {
      background: transparent;
    }

    ::ng-deep .mat-mdc-tab-header {
      background: $card-bg;
      border-radius: 12px 12px 0 0;
      border: 1px solid $color-neutral-200;
      border-bottom: none;
    }

    ::ng-deep .mat-mdc-tab-label {
      color: #64748b !important;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-tab-label.mat-mdc-tab-active {
      color: $color-brand-primary !important;
    }

    ::ng-deep .mat-mdc-ink-bar {
      background-color: $color-brand-primary !important;
      height: 2px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      background: $card-bg;
      border-radius: 0 0 12px 12px;
      border: 1px solid $color-neutral-200;
      border-top: none;
    }

    /* Angular Material Buttons Light Theme */
    ::ng-deep .mat-mdc-raised-button.mat-primary {
      background: $color-brand-primary;
      color: white;
    }

    ::ng-deep .mat-mdc-raised-button.mat-primary:hover {
      background: #1d4ed8;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }

    ::ng-deep .mat-mdc-stroked-button {
      border-color: $color-neutral-200;
      color: #475569;
    }

    ::ng-deep .mat-mdc-stroked-button:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    ::ng-deep .mat-mdc-icon-button {
      color: $color-neutral-500;
    }

    ::ng-deep .mat-mdc-icon-button:hover {
      background: #f1f5f9;
      color: $color-brand-primary;
    }

    /* Angular Material Progress Bar Light Theme */
    ::ng-deep .mat-mdc-progress-bar {
      --mdc-linear-progress-track-color: $color-neutral-200;
    }

    ::ng-deep .mat-mdc-progress-bar.progress-low {
      --mdc-linear-progress-active-indicator-color: #f59e0b;
    }

    ::ng-deep .mat-mdc-progress-bar.progress-medium {
      --mdc-linear-progress-active-indicator-color: $color-brand-primary;
    }

    ::ng-deep .mat-mdc-progress-bar.progress-high {
      --mdc-linear-progress-active-indicator-color: #059669;
    }

    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .project-card {
      background: $card-bg;
      border: $card-border;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      transition: all 0.2s ease;
    }

    .project-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
      color: $color-neutral-900;
    }

    .project-description {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: $color-neutral-500;
      line-height: 1.5;
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
      color: $color-neutral-500;
    }

    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }

    .project-progress {
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tech-chip {
      font-size: 12px;
      background: #f1f5f9;
      color: #475569;
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
  // Stats data with animation support
  totalProjects = 0;
  completedProjects = 0;
  inProgressProjects = 0;
  showcaseProjects = 0;
  totalStudents = 0;
  averageProgress = 0;
  completedThisMonth = 0;
  lastCompletedProject = '';

  // Project categories (Mock for now)
  projectCategories: ProjectCategory[] = [
    { id: 'robotics', name: '机器人', icon: 'precision_manufacturing', count: 15, color: '#fef3c7' },
    { id: 'programming', name: '编程项目', icon: 'code', count: 12, color: '#d1fae5' },
    { id: 'iot', name: '物联网', icon: 'devices', count: 8, color: '#dbeafe' },
    { id: 'ai', name: '人工智能', icon: 'neurology', count: 7, color: '#ede9fe' }
  ];

  // Sample projects data
  projects: STEMProject[] = [];
  isLoading = false;
  
  // Batch operations
  batchMode = false;
  selectedProjects: Set<string> = new Set();
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  
  // Quick view dialog
  showQuickView = false;
  quickViewProject: STEMProject | null = null;

  // Filter variables
  searchTerm = '';
  statusFilter = '';
  categoryFilter = '';
  searchQuery = '';
  showFilterPanel = false;

  orgId!: number;

  constructor(
    private stemService: StemCloudService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 1;
    this.loadProjectData();
  }

  loadProjectData(): void {
    this.isLoading = true;
    this.stemService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.loadMockProjects();
        this.isLoading = false;
      }
    });
  }

  updateStats(): void {
    this.totalProjects = this.projects.length;
    this.completedProjects = this.projects.filter(p => p.status === 'completed').length;
    this.inProgressProjects = this.projects.filter(p => p.status === 'in_progress').length;
    this.showcaseProjects = this.projects.filter(p => p.showcase).length;
    
    // 计算参与学生总数
    this.totalStudents = this.projects.reduce((sum, p) => sum + (p.students || 0), 0);
    
    // 计算平均进度
    if (this.projects.length > 0) {
      const totalProgress = this.projects.reduce((sum, p) => sum + (p.progress || 0), 0);
      this.averageProgress = Math.round(totalProgress / this.projects.length);
    } else {
      this.averageProgress = 0;
    }
    
    // 计算本月完成项目
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const completedThisMonthList = this.projects.filter(p => {
      if (p.status !== 'completed' || !p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
    });
    
    this.completedThisMonth = completedThisMonthList.length;
    this.lastCompletedProject = completedThisMonthList.length > 0 
      ? completedThisMonthList[completedThisMonthList.length - 1].name 
      : '';
  }

  loadMockProjects(): void {
    this.projects = [
      { id: 'PROJ-001', name: '智能温室控制系统', category: 'iot', status: 'in_progress', progress: 75, students: 18, mentor: '张老师', startDate: '2024-01-10', description: '基于Arduino的温湿度自动控制系统', technologies: ['Arduino', '传感器', 'Python'] },
      { id: 'PROJ-002', name: 'AI视觉识别小车', category: 'robotics', status: 'completed', progress: 100, students: 15, mentor: '李老师', startDate: '2023-12-01', endDate: '2024-01-15', description: '使用树莓派和摄像头实现物体识别和追踪', technologies: ['Raspberry Pi', 'Python', 'OpenCV'], showcase: true }
    ];
    this.updateStats();
  }

  // Helper methods
  get filteredProjects() {
    let result = this.projects;
    
    // 应用搜索过滤
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query)) ||
        (project.mentor && project.mentor.toLowerCase().includes(query))
      );
    }
    
    // 应用状态过滤
    if (this.statusFilter) {
      result = result.filter(project => project.status === this.statusFilter);
    }
    
    // 应用分类过滤
    if (this.categoryFilter) {
      result = result.filter(project => project.category === this.categoryFilter);
    }
    
    return result;
  }

  get hasActiveFilters(): boolean {
    return !!(this.statusFilter || this.categoryFilter);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.statusFilter) count++;
    if (this.categoryFilter) count++;
    return count;
  }

  get progressDistribution() {
    const total = this.projects.length || 1;
    const planning = this.projects.filter(p => p.status === 'planning').length;
    const inProgress = this.projects.filter(p => p.status === 'in_progress').length;
    const completed = this.projects.filter(p => p.status === 'completed').length;
    
    return [
      { 
        label: '规划中', 
        count: planning, 
        percentage: Math.round((planning / total) * 100),
        color: '#94a3b8'
      },
      { 
        label: '进行中', 
        count: inProgress, 
        percentage: Math.round((inProgress / total) * 100),
        color: '$color-brand-primary'
      },
      { 
        label: '已完成', 
        count: completed, 
        percentage: Math.round((completed / total) * 100),
        color: '#059669'
      }
    ];
  }

  onSearch(): void {
    // Search is handled by the getter automatically
  }

  toggleFilter(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.categoryFilter = '';
    this.showFilterPanel = false;
  }

  onDeleteProject(project: STEMProject): void {
    if (confirm(`确定要删除项目 "${project.name}" 吗？`)) {
      console.log('Delete project:', project.id);
      // TODO: 调用 API 删除项目
    }
  }

  // Batch operations
  toggleBatchMode(): void {
    this.batchMode = !this.batchMode;
    if (!this.batchMode) {
      this.clearSelection();
    }
  }

  toggleSelection(projectId: string): void {
    if (this.selectedProjects.has(projectId)) {
      this.selectedProjects.delete(projectId);
    } else {
      this.selectedProjects.add(projectId);
    }
  }

  isSelected(projectId: string): boolean {
    return this.selectedProjects.has(projectId);
  }

  clearSelection(): void {
    this.selectedProjects.clear();
  }

  batchUpdateStatus(status: string): void {
    const count = this.selectedProjects.size;
    if (confirm(`确定要将 ${count} 个项目设为"${this.getStatusText(status)}"吗？`)) {
      console.log('Batch update status:', status, 'for projects:', Array.from(this.selectedProjects));
      // TODO: 调用 API 批量更新状态
      this.clearSelection();
      this.batchMode = false;
    }
  }

  batchDelete(): void {
    const count = this.selectedProjects.size;
    if (confirm(`确定要删除 ${count} 个选中的项目吗？此操作不可恢复！`)) {
      console.log('Batch delete projects:', Array.from(this.selectedProjects));
      // TODO: 调用 API 批量删除
      this.clearSelection();
      this.batchMode = false;
    }
  }

  exportProjects(): void {
    if (this.projects.length === 0) {
      alert('没有可导出的项目');
      return;
    }

    // 生成 CSV 数据
    const headers = ['项目编号', '项目名称', '分类', '状态', '进度', '学生数', '导师', '开始日期', '结束日期', '描述'];
    const rows = this.filteredProjects.map(p => [
      p.id,
      p.name,
      this.getCategoryName(p.category),
      this.getStatusText(p.status),
      `${p.progress}%`,
      p.students,
      p.mentor || '未分配',
      p.startDate || '',
      p.endDate || '',
      p.description || ''
    ]);

    // 转换为 CSV 格式
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `项目列表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToastMessage('导出成功', 'success');
  }

  // Toast notification
  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast(): void {
    this.showToast = false;
  }

  // Quick view
  onQuickView(project: STEMProject): void {
    this.quickViewProject = project;
    this.showQuickView = true;
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.quickViewProject = null;
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'planning': return 'planning';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      default: return 'planning';
    }
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
    const categoryColors: Record<string, string> = {
      'IoT': '#ede9fe',
      'AI': '#d1fae5',
      '机器人': '#fef3c7',
      'robotics': '#fef3c7',
      'programming': '#d1fae5',
      'iot': '#dbeafe',
      'ai': '#ede9fe'
    };
    return categoryColors[categoryId] || '#f1f5f9';
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
    this.router.navigate(['/organization', this.orgId, 'projects', 'create']);
  }

  onViewShowcase(): void {
    this.router.navigate(['/organization', this.orgId, 'projects', 'showcase']);
  }

  onCategorySelect(category: ProjectCategory): void {
    console.log('Category selected:', category);
    // Filter projects by category
  }

  onViewProject(project: STEMProject): void {
    this.router.navigate(['/organization', this.orgId, 'projects', project.id]);
  }

  onEditProject(project: STEMProject): void {
    this.router.navigate(['/organization', this.orgId, 'projects', project.id, 'edit']);
  }

  onViewShowcaseItem(project: STEMProject): void {
    this.router.navigate(['/organization', this.orgId, 'projects', project.id, 'showcase']);
  }
}