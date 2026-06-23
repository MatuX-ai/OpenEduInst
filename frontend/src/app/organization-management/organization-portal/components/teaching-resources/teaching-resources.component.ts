import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import {
  Courseware,
  HardwareProject,
  OpenMtSciEdService,
  OpenSciEdStats,
  Tutorial,
  UnifiedSearchItem,
} from '../../../../core/services/openmt-scied.service';
import {
  SciEdPageHeaderComponent,
  SciEdResourceDetailPanelComponent,
  SciEdResourceGridComponent,
  SciEdResourceItem,
  SciEdResourceType,
  SciEdSearchInputComponent,
  SciEdStateCardComponent,
  SciEdStatItem,
  SciEdStatsGridComponent,
  SciEdTabConfig,
} from '@openmt/scied-ui';

@Component({
  selector: 'app-teaching-resources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    SciEdPageHeaderComponent,
    SciEdStateCardComponent,
    SciEdStatsGridComponent,
    SciEdResourceDetailPanelComponent,
    SciEdSearchInputComponent,
    SciEdResourceGridComponent,
  ],
  template: `
    <div class="resources-container">
      <scied-page-header
        title="STEM 教学资源库"
        subtitle="OpenMTSciEd 教程、课件与硬件项目 · 经云托管代理安全访问"
      >
        <button sciedActions type="button" class="scied-btn scied-btn--secondary" (click)="retryLoad()" [disabled]="loading">
          <mat-icon>refresh</mat-icon>
          刷新
        </button>
        <button sciedActions type="button" class="scied-btn scied-btn--secondary" (click)="goTopicStudio()" [disabled]="integrationDisabled">
          <mat-icon>lightbulb</mat-icon>
          课题工作室
        </button>
      </scied-page-header>

      <scied-state-card
        *ngIf="integrationDisabled && !loading"
        variant="warn"
        icon="link_off"
        title="OpenMTSciEd 集成未启用"
        message="请在系统设置中配置 API Key，或由平台管理员设置 OPENSCIEDU_API_KEY。"
      ></scied-state-card>

      <scied-state-card
        *ngIf="loading"
        variant="loading"
        message="正在加载 OpenMTSciEd 资源…"
      ></scied-state-card>

      <scied-state-card
        *ngIf="errorMessage && !loading && !integrationDisabled"
        variant="error"
        icon="error_outline"
        title="加载失败"
        [message]="errorMessage"
        (retry)="retryLoad()"
      ></scied-state-card>

      <ng-container *ngIf="!loading && !integrationDisabled && !errorMessage">
        <scied-stats-grid [items]="statItems"></scied-stats-grid>

        <scied-resource-detail-panel
          *ngIf="selectedItem"
          [item]="selectedItem"
          [type]="activeTab"
          (close)="selectedItem = null"
        ></scied-resource-detail-panel>

        <mat-tab-group
          [(selectedIndex)]="tabIndex"
          (selectedIndexChange)="onTabIndexChange($event)"
          class="resource-tabs"
        >
          <mat-tab *ngFor="let tab of tabs" [label]="tab.label">
            <div class="tab-body">
              <p class="tab-desc">{{ tab.description }}</p>

              <scied-search-input
                placeholder="统一检索：机构本地 + OpenMTSciEd（输入 2 字以上）"
                [(value)]="searchKeyword"
                (valueChange)="onSearchInput($event)"
              ></scied-search-input>

              <scied-resource-grid
                [items]="filteredItems"
                [loading]="searchMode && searchLoading"
                loadingText="检索中…"
                [summary]="searchMode && !searchLoading && searchSummary ? searchSummary : ''"
                (itemSelect)="selectItem($event)"
              ></scied-resource-grid>

              <div class="pagination" *ngIf="canLoadMore && !searchMode">
                <button type="button" class="scied-btn scied-btn--secondary" (click)="loadMore()" [disabled]="loadingMore">
                  {{ loadingMore ? '加载中…' : '加载更多' }}
                </button>
                <span class="page-info">第 {{ page }} / {{ totalPages || 1 }} 页</span>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .resources-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 4px;
      }

      .scied-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: var(--scied-radius-md, 8px);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }

      .scied-btn--secondary {
        background: var(--scied-surface, #fff);
        color: #475569;
        border: 1px solid var(--scied-border, #e2e8f0);
      }

      .scied-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .resource-tabs {
        background: var(--scied-surface, #fff);
        border: 1px solid var(--scied-border, #e2e8f0);
        border-radius: var(--scied-radius-lg, 12px);
        overflow: hidden;
      }

      .tab-body {
        padding: 20px;
      }

      .tab-desc {
        margin: 0 0 16px;
        font-size: 14px;
        color: var(--scied-muted, #64748b);
      }

      .pagination {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 20px;
      }

      .page-info {
        font-size: 12px;
        color: var(--scied-muted, #64748b);
      }
    `,
  ],
})
export class TeachingResourcesComponent implements OnInit, OnDestroy {
  tabs: SciEdTabConfig[] = [
    { id: 'tutorials', label: '教程', icon: 'menu_book', description: 'OpenMTSciEd 结构化 STEM 教程' },
    { id: 'coursewares', label: '课件', icon: 'edit_note', description: 'PPT、PDF、视频等课件资源' },
    { id: 'hardware', label: '硬件项目', icon: 'memory', description: 'Arduino/机器人等实践项目（非机构设备台账）' },
  ];

  tabIndex = 0;
  activeTab: SciEdResourceType = 'tutorials';
  searchKeyword = '';
  searchMode = false;
  searchLoading = false;
  searchSummary = '';

  loading = true;
  loadingMore = false;
  integrationDisabled = false;
  errorMessage: string | null = null;

  stats: OpenSciEdStats = { tutorials: 0, coursewares: 0, hardware_projects: 0 };
  items: SciEdResourceItem[] = [];
  selectedItem: SciEdResourceItem | null = null;

  page = 1;
  totalPages = 1;
  readonly pageSize = 20;

  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  constructor(
    private sciEd: OpenMtSciEdService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get statItems(): SciEdStatItem[] {
    return [
      { label: '教程', value: this.stats.tutorials },
      { label: '课件', value: this.stats.coursewares },
      { label: '硬件项目', value: this.stats.hardware_projects },
      { label: '当前列表', value: this.filteredItems.length },
    ];
  }

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.runUnifiedSearch(q));

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'courseware' || tab === 'coursewares') {
        this.setTab('coursewares');
      } else if (tab === 'hardware' || tab === 'hardware-projects') {
        this.setTab('hardware');
      } else if (tab === 'tutorial' || tab === 'tutorials') {
        this.setTab('tutorials');
      }
      this.loadAll();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredItems(): SciEdResourceItem[] {
    if (this.searchMode) {
      return this.items;
    }
    const q = this.searchKeyword.trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q)
    );
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  goTopicStudio(): void {
    const orgMatch = this.router.url.match(/\/organization\/(\d+)/);
    const orgId = orgMatch?.[1];
    if (orgId) {
      void this.router.navigate(['/organization', orgId, 'topic-studio']);
    }
  }

  private runUnifiedSearch(keyword: string): void {
    const q = keyword.trim();
    if (q.length < 2) {
      this.searchMode = false;
      this.searchSummary = '';
      if (this.items.length === 0 && !this.loading) {
        this.resetAndLoadTab();
      }
      return;
    }

    this.searchMode = true;
    this.searchLoading = true;
    this.selectedItem = null;
    this.sciEd.searchUnified(q, 'all', 30).subscribe({
      next: (res) => {
        this.items = res.items.map((item) => this.mapUnifiedItem(item));
        this.searchSummary = `共 ${res.total} 条 · 本地 ${res.sources.local} · SciEd ${res.sources.scied}`;
        this.searchLoading = false;
        this.loading = false;
      },
      error: (err) => {
        this.searchLoading = false;
        this.handleError(err);
      },
    });
  }

  private mapUnifiedItem(item: UnifiedSearchItem): SciEdResourceItem {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      subject: item.subject,
      gradeLevel: item.grade_level,
      extraLabel: item.local_type || item.type,
      sourceKind: item.type,
      sourceLabel: item.source,
      score: item.score,
      fileUrl: item.url || undefined,
    };
  }

  get canLoadMore(): boolean {
    return this.page < this.totalPages;
  }

  onTabIndexChange(index: number): void {
    const tab = this.tabs[index]?.id ?? 'tutorials';
    this.setTab(tab);
    this.searchKeyword = '';
    this.searchMode = false;
    this.searchSummary = '';
    this.updateQueryParam(tab);
    this.resetAndLoadTab();
  }

  setTab(tab: SciEdResourceType): void {
    this.activeTab = tab;
    const idx = this.tabs.findIndex((t) => t.id === tab);
    if (idx >= 0) {
      this.tabIndex = idx;
    }
  }

  selectItem(item: SciEdResourceItem): void {
    this.selectedItem = item;
    if (this.activeTab === 'tutorials' && !this.searchMode) {
      this.sciEd.getTutorialById(item.id).subscribe({
        next: (detail) => {
          this.selectedItem = this.mapTutorial(detail);
        },
      });
    }
  }

  retryLoad(): void {
    this.loadAll();
  }

  loadMore(): void {
    if (!this.canLoadMore || this.loadingMore) {
      return;
    }
    this.page += 1;
    this.loadingMore = true;
    this.fetchTabPage(this.activeTab, this.page, true);
  }

  private loadAll(): void {
    this.loading = true;
    this.errorMessage = null;
    this.integrationDisabled = false;
    this.selectedItem = null;

    this.sciEd.getConfig().subscribe({
      next: (cfg) => {
        if (!cfg.enabled) {
          this.integrationDisabled = true;
          this.loading = false;
          return;
        }
        this.sciEd.getStats().subscribe({
          next: (stats) => (this.stats = stats),
          error: () => {},
        });
        this.resetAndLoadTab();
      },
      error: (err) => this.handleError(err),
    });
  }

  private resetAndLoadTab(): void {
    this.page = 1;
    this.totalPages = 1;
    this.items = [];
    this.fetchTabPage(this.activeTab, 1, false);
  }

  private fetchTabPage(tab: SciEdResourceType, page: number, append: boolean): void {
    const done = () => {
      this.loading = false;
      this.loadingMore = false;
    };

    if (tab === 'tutorials') {
      this.sciEd.getTutorials(page, this.pageSize).subscribe({
        next: (res) => this.applyPage(res.items.map((t) => this.mapTutorial(t)), res.total_pages, page, append),
        error: (err) => {
          done();
          this.handleError(err);
        },
        complete: done,
      });
      return;
    }

    if (tab === 'coursewares') {
      this.sciEd.getCoursewares(page, this.pageSize).subscribe({
        next: (res) => this.applyPage(res.items.map((c) => this.mapCourseware(c)), res.total_pages, page, append),
        error: (err) => {
          done();
          this.handleError(err);
        },
        complete: done,
      });
      return;
    }

    this.sciEd.getHardwareProjects(page, this.pageSize).subscribe({
      next: (res) =>
        this.applyPage(res.items.map((p) => this.mapHardwareProject(p)), res.total_pages, page, append),
      error: (err) => {
        done();
        this.handleError(err);
      },
      complete: done,
    });
  }

  private applyPage(
    mapped: SciEdResourceItem[],
    totalPages: number,
    page: number,
    append: boolean
  ): void {
    this.page = page;
    this.totalPages = totalPages || 1;
    this.items = append ? [...this.items, ...mapped] : mapped;
  }

  private mapTutorial(t: Tutorial): SciEdResourceItem {
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      subject: t.subject,
      gradeLevel: t.grade_level,
      difficulty: t.difficulty_level,
      extraLabel: t.duration_minutes ? `${t.duration_minutes} 分钟` : undefined,
      createdAt: t.created_at,
    };
  }

  private mapCourseware(c: Courseware): SciEdResourceItem {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      subject: c.subject,
      gradeLevel: c.grade_level,
      difficulty: c.difficulty_level,
      extraLabel: c.type,
      fileUrl: c.file_url,
      thumbnailUrl: c.thumbnail_url,
      createdAt: c.created_at,
    };
  }

  private mapHardwareProject(p: HardwareProject): SciEdResourceItem {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      subject: p.subject,
      difficulty: p.difficulty_level,
      extraLabel: p.category,
      thumbnailUrl: p.thumbnail_url,
      fileUrl: p.thumbnail_url,
    };
  }

  private updateQueryParam(tab: SciEdResourceType): void {
    const queryTab =
      tab === 'coursewares' ? 'courseware' : tab === 'hardware' ? 'hardware' : 'tutorials';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: queryTab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private handleError(err: { status?: number; error?: { detail?: { code?: string; message?: string } | string } }): void {
    this.loading = false;
    this.loadingMore = false;
    if (err.status === 403) {
      this.integrationDisabled = true;
      this.errorMessage = null;
      return;
    }
    const detail = err.error?.detail;
    if (typeof detail === 'object' && detail?.message) {
      this.errorMessage = detail.message;
    } else if (typeof detail === 'string') {
      this.errorMessage = detail;
    } else {
      this.errorMessage = '无法连接 OpenMTSciEd，请稍后重试';
    }
  }
}
