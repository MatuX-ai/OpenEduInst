import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  OpenMtSciEdService,
  SciEdRecommendation,
} from '../../../../core/services/openmt-scied.service';

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="kg-container">
      <header class="kg-header">
        <div>
          <h1>知识图谱推荐</h1>
          <p class="subtitle">基于 OpenMTSciEd 知识图谱的只读推荐视图 · 经云托管代理访问</p>
        </div>
        <button type="button" class="btn-secondary" (click)="reload()" [disabled]="loading">
          <mat-icon>refresh</mat-icon>
          刷新
        </button>
      </header>

      <div *ngIf="integrationDisabled && !loading" class="state-card warn">
        <mat-icon>link_off</mat-icon>
        <div>
          <h3>OpenMTSciEd 集成未启用</h3>
          <p>请在系统设置中配置 API Key 后查看推荐资源。</p>
        </div>
      </div>

      <div *ngIf="loading" class="state-card loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>正在加载推荐…</p>
      </div>

      <div *ngIf="errorMessage && !loading && !integrationDisabled" class="state-card error">
        <mat-icon>error_outline</mat-icon>
        <div>
          <h3>加载失败</h3>
          <p>{{ errorMessage }}</p>
          <button type="button" class="btn-primary" (click)="reload()">重试</button>
        </div>
      </div>

      <div *ngIf="!loading && !integrationDisabled && !errorMessage" class="kg-body">
        <p class="hint" *ngIf="items.length === 0">暂无推荐数据，请确认上游知识图谱服务可用。</p>

        <div class="rec-grid">
          <article class="rec-card" *ngFor="let item of items; trackBy: trackById">
            <div class="rec-type">
              <mat-icon>{{ typeIcon(item.resource_type) }}</mat-icon>
              {{ typeLabel(item.resource_type) }}
            </div>
            <h3>{{ item.title || item.resource_id }}</h3>
            <p class="rec-desc" *ngIf="item.reason">{{ item.reason }}</p>
            <div class="rec-meta">
              <mat-chip *ngIf="item.subject">{{ item.subject }}</mat-chip>
              <mat-chip *ngIf="item.score != null">相关度 {{ item.score | number: '1.0-2' }}</mat-chip>
            </div>
            <button type="button" class="link-btn" (click)="openResource(item)">
              查看资源
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </article>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'design-tokens' as *;

      .kg-container {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }

      .kg-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
      }

      .kg-header h1 {
        margin: 0 0 6px;
        font-size: 24px;
        font-weight: 600;
        color: #0f172a;
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: #64748b;
      }

      .btn-secondary,
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 14px;
        cursor: pointer;
      }

      .btn-secondary {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #334155;
      }

      .btn-primary {
        border: none;
        background: #2563eb;
        color: #fff;
      }

      .state-card {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fff;
        margin-bottom: 20px;
      }

      .state-card.warn mat-icon {
        color: #d97706;
      }

      .state-card.error mat-icon {
        color: #dc2626;
      }

      .state-card.loading {
        align-items: center;
        color: #64748b;
      }

      .hint {
        color: #64748b;
        margin: 0 0 16px;
      }

      .rec-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .rec-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .rec-type {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .rec-card h3 {
        margin: 0;
        font-size: 16px;
        color: #0f172a;
      }

      .rec-desc {
        margin: 0;
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
        flex: 1;
      }

      .rec-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .link-btn {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: transparent;
        color: #2563eb;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
      }
    `,
  ],
})
export class KnowledgeGraphComponent implements OnInit {
  loading = true;
  integrationDisabled = false;
  errorMessage = '';
  items: SciEdRecommendation[] = [];

  constructor(
    private sciEdService: OpenMtSciEdService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = '';
    this.integrationDisabled = false;

    this.sciEdService.getRecommendations(12).subscribe({
      next: (data) => {
        this.items = this.normalizeRecommendations(data);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const code = err?.error?.detail?.code;
        if (code === 'OPENSCIEDU_DISABLED' || err?.status === 403) {
          this.integrationDisabled = true;
          return;
        }
        this.errorMessage =
          err?.error?.detail?.message || err?.message || '无法加载知识图谱推荐';
      },
    });
  }

  trackById(_index: number, item: SciEdRecommendation): string {
    return item.resource_id || item.title || String(_index);
  }

  typeIcon(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'courseware':
        return 'edit_note';
      case 'hardware_project':
      case 'hardware-project':
        return 'memory';
      default:
        return 'menu_book';
    }
  }

  typeLabel(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'courseware':
        return '课件';
      case 'hardware_project':
      case 'hardware-project':
        return '硬件项目';
      case 'tutorial':
        return '教程';
      default:
        return '资源';
    }
  }

  openResource(item: SciEdRecommendation): void {
    const tab = this.tabForType(item.resource_type);
    const orgMatch = this.router.url.match(/\/organization\/(\d+)/);
    const orgId = orgMatch?.[1];
    if (orgId) {
      this.router.navigate(['/organization', orgId, 'resources'], {
        queryParams: { tab },
      });
    }
  }

  private tabForType(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'courseware':
        return 'courseware';
      case 'hardware_project':
      case 'hardware-project':
        return 'hardware';
      default:
        return 'tutorials';
    }
  }

  private normalizeRecommendations(data: unknown): SciEdRecommendation[] {
    if (Array.isArray(data)) {
      return data as SciEdRecommendation[];
    }
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj['items'])) {
        return obj['items'] as SciEdRecommendation[];
      }
      if (Array.isArray(obj['recommendations'])) {
        return obj['recommendations'] as SciEdRecommendation[];
      }
    }
    return [];
  }
}
