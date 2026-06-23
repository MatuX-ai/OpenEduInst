import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  OpenMtSciEdService,
  TopicStudioLinks,
} from '../../../../core/services/openmt-scied.service';

@Component({
  selector: 'app-topic-studio-launcher',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="ts-page">
      <header class="ts-header">
        <div>
          <h1>课题工作室</h1>
          <p class="subtitle">OpenMTSciEd 六步向导：课题 → AI 大纲 → 教程 → 资源匹配 → 品牌化 → 发布</p>
        </div>
      </header>

      <div *ngIf="loading" class="loading-row">
        <mat-spinner diameter="36"></mat-spinner>
        <span>加载深链配置…</span>
      </div>

      <div *ngIf="!loading && !links?.enabled" class="banner warn">
        <mat-icon>info</mat-icon>
        <span>OpenMTSciEd 集成未启用，请先在系统设置中配置 API Key。</span>
      </div>

      <mat-card *ngIf="!loading && links" class="launch-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>lightbulb</mat-icon>
          <mat-card-title>在 OpenMTSciEd 中打开</mat-card-title>
          <mat-card-subtitle>{{ links.web_base }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="note">{{ links.note }}</p>
          <ul class="steps">
            <li>提出课题并生成 AI 教学大纲</li>
            <li>确认教程结构并匹配课件 / 硬件项目</li>
            <li>品牌化包装后保存或提交发布</li>
          </ul>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-stroked-button type="button" (click)="openUrl(links.list_url)">
            <mat-icon>list</mat-icon> 草稿列表
          </button>
          <button mat-flat-button color="primary" type="button" (click)="openUrl(links.new_draft_url)">
            <mat-icon>add</mat-icon> 新建课题
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card *ngIf="!loading && links?.enabled && showIframe" class="iframe-card">
        <mat-card-header>
          <mat-card-title>内嵌预览（若被浏览器拦截请使用上方按钮）</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <iframe
            [src]="iframeUrl"
            title="OpenMTSciEd Topic Studio"
            class="ts-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          ></iframe>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .ts-page {
        max-width: 960px;
        margin: 0 auto;
        padding: 8px 4px 32px;
      }

      .ts-header h1 {
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

      .loading-row,
      .banner {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0;
        padding: 14px 16px;
        border-radius: 10px;
      }

      .banner.warn {
        background: #fffbeb;
        border: 1px solid #fde68a;
        color: #92400e;
      }

      .launch-card,
      .iframe-card {
        margin-top: 20px;
      }

      .note {
        font-size: 13px;
        color: #475569;
        margin: 0 0 12px;
      }

      .steps {
        margin: 0;
        padding-left: 20px;
        color: #334155;
        font-size: 14px;
        line-height: 1.8;
      }

      mat-card-actions button {
        margin-left: 8px;
      }

      .ts-iframe {
        width: 100%;
        min-height: 520px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
      }
    `,
  ],
})
export class TopicStudioLauncherComponent implements OnInit {
  loading = true;
  links: TopicStudioLinks | null = null;
  showIframe = false;
  iframeUrl: SafeResourceUrl | null = null;

  constructor(
    private sciEd: OpenMtSciEdService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.sciEd.getTopicStudioLinks().subscribe({
      next: (links) => {
        this.links = links;
        this.loading = false;
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(links.list_url);
        this.showIframe = links.enabled;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
