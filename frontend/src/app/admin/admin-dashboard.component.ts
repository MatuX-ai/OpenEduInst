/**
 * Admin 管理后台 - 核心仪表板
 *
 * 功能：
 * - 顶部统计卡片（机构数/用户数/许可证数/风险事件）
 * - 最近高风险操作
 * - 按操作类型统计的图表
 * - 快速进入审计日志/用户管理/系统设置
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { EMPTY, Subject, forkJoin } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import {
  AdminBackendService,
  AuditSummary,
  CurrentUserInfo,
} from '../core/services/admin-backend.service';

type CardMetric = {
  key: string;
  label: string;
  icon: string;
  value: number | string;
  hint?: string;
  accent?: 'primary' | 'warn' | 'success';
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
  template: `
    <div class="dashboard">
      <header class="dashboard__header">
        <div>
          <h1>
            <mat-icon>admin_panel_settings</mat-icon>
            管理后台
          </h1>
          <p class="dashboard__subtitle">
            欢迎，<strong>{{ currentUser?.username || '管理员' }}</strong
            >，以下是平台的近期运行概况
          </p>
        </div>
        <div class="dashboard__header-actions">
          <span class="role-chip" *ngIf="currentUser?.role">
            <mat-icon>security</mat-icon>
            {{ currentUser.role }}
          </span>
          <button mat-raised-button color="primary" routerLink="/admin/audit">
            <mat-icon>description</mat-icon>
            审计日志
          </button>
          <button mat-raised-button routerLink="/admin/users">
            <mat-icon>group</mat-icon>
            用户管理
          </button>
          <button mat-raised-button routerLink="/admin/security">
            <mat-icon>shield</mat-icon>
            安全设置
          </button>
        </div>
      </header>

      <section *ngIf="loading" class="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>正在加载数据...</p>
      </section>

      <ng-container *ngIf="!loading">
        <!-- 顶部指标卡片 -->
        <div class="metric-grid">
          <mat-card *ngFor="let m of metrics" class="metric-card" [ngClass]="'metric-' + m.accent">
            <mat-card-content>
              <div class="metric-card__icon">
                <mat-icon>{{ m.icon }}</mat-icon>
              </div>
              <div class="metric-card__content">
                <div class="metric-card__value">{{ m.value }}</div>
                <div class="metric-card__label">{{ m.label }}</div>
                <div class="metric-card__hint" *ngIf="m.hint">{{ m.hint }}</div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 两列：按操作类型统计 / 高风险事件 -->
        <div class="row-grid">
          <mat-card class="content-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>insights</mat-icon>
                近期操作分布（按 operation）
              </mat-card-title>
              <mat-card-subtitle>最近 {{ auditSummary?.period_hours || 24 }} 小时</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="operationBars.length === 0" class="empty">
                <p>暂无数据</p>
              </div>
              <ul class="bar-list" *ngIf="operationBars.length > 0">
                <li *ngFor="let bar of operationBars">
                  <div class="bar-row">
                    <span class="bar-label">{{ bar.key }}</span>
                    <span class="bar-value">{{ bar.value }}</span>
                  </div>
                  <div class="bar-bg">
                    <div class="bar-fill" [style.width.%]="bar.percent"></div>
                  </div>
                </li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="content-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="warn">warning_amber</mat-icon>
                高风险 / 警告事件
              </mat-card-title>
              <mat-card-subtitle>建议及时审查</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="highRiskEvents.length === 0" class="empty">
                <p>👍 近 24 小时内无高风险事件</p>
              </div>
              <ul class="risk-list" *ngIf="highRiskEvents.length > 0">
                <li *ngFor="let e of highRiskEvents">
                  <div class="risk-head">
                    <span class="risk-level" [ngClass]="'risk-' + (e.risk_level || 'normal')">
                      {{ e.risk_level || 'normal' }}
                    </span>
                    <span class="risk-op">{{ e.operation || e.method + ' ' + e.path }}</span>
                    <span class="risk-ts">{{ e.ts | slice: 0:19 }}</span>
                  </div>
                  <div class="risk-meta">
                    <span>用户：{{ e.user || '<匿名>' }}</span>
                    <span>IP：{{ e.ip || '-' }}</span>
                    <span>状态：{{ e.status ?? '-' }}</span>
                  </div>
                </li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .dashboard { padding: 24px; }
      .dashboard__header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 24px;
      }
      .dashboard__header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 28px; color: #1f2937; }
      .dashboard__subtitle { color: #6b7280; margin: 6px 0 0; }
      .dashboard__header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .role-chip { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; background: #eef2ff; color: #4f46e5; border-radius: 12px; font-size: 13px; }

      .loading { text-align: center; color: #6b7280; padding: 48px 0; }
      .loading p { margin-top: 12px; }

      .metric-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 16px; margin-bottom: 24px;
      }
      .metric-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
      .metric-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
      .metric-card__icon {
        width: 56px; height: 56px; border-radius: 12px; background: #eef2ff;
        color: #4f46e5; display: flex; align-items: center; justify-content: center;
      }
      .metric-card.metric-warn .metric-card__icon { background: #fef2f2; color: #dc2626; }
      .metric-card.metric-success .metric-card__icon { background: #ecfdf5; color: #059669; }
      .metric-card__value { font-size: 28px; font-weight: 700; color: #111827; }
      .metric-card__label { color: #6b7280; font-size: 14px; margin-top: 4px; }
      .metric-card__hint { color: #9ca3af; font-size: 12px; margin-top: 2px; }

      .row-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
        gap: 20px;
      }
      .content-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
      .content-card mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 16px; }
      .bar-list { list-style: none; padding: 0; margin: 12px 0 0; }
      .bar-row { display: flex; justify-content: space-between; font-size: 14px; color: #374151; margin-bottom: 4px; }
      .bar-bg { background: #f3f4f6; border-radius: 8px; height: 10px; overflow: hidden; margin-bottom: 12px; }
      .bar-fill { background: linear-gradient(90deg, #4f46e5, #6366f1); height: 100%; transition: width .3s ease; }

      .risk-list { list-style: none; padding: 0; margin: 12px 0 0; }
      .risk-list li { padding: 10px 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #f59e0b; }
      .risk-head { display: flex; gap: 12px; align-items: center; margin-bottom: 4px; }
      .risk-level { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; color: #fff; background: #6b7280; }
      .risk-level.risk-high { background: #dc2626; }
      .risk-level.risk-warning { background: #f59e0b; }
      .risk-level.risk-normal { background: #3b82f6; }
      .risk-op { font-weight: 600; color: #111827; }
      .risk-ts { margin-left: auto; color: #9ca3af; font-size: 12px; }
      .risk-meta { display: flex; gap: 16px; color: #6b7280; font-size: 13px; }

      .empty { text-align: center; color: #9ca3af; padding: 24px 0; }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: CurrentUserInfo | null = null;
  auditSummary: AuditSummary | null = null;
  metrics: CardMetric[] = [];
  operationBars: { key: string; value: number; percent: number }[] = [];
  highRiskEvents: AuditSummary['high_risk_events'] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminBackendService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      me: this.adminService.getMe().pipe(catchError(() => EMPTY)),
      summary: this.adminService.getAuditSummary(24).pipe(catchError(() => EMPTY)),
      stats: this.adminService.getPlatformStats().pipe(catchError(() => EMPTY)),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ me, summary, stats }) => {
        this.currentUser = me ?? null;
        this.auditSummary = summary ?? null;

        const org = stats?.organizations ?? 0;
        const users = stats?.users ?? 0;
        const lic = stats?.licenses_active ?? 0;
        const warningCount =
          (summary?.risk_stats?.['warning'] || 0) + (summary?.risk_stats?.['high'] || 0);

        this.metrics = [
          { key: 'orgs', label: '活跃机构', icon: 'apartment', value: org, accent: 'primary' },
          { key: 'users', label: '平台用户', icon: 'people', value: users, accent: 'primary' },
          { key: 'licenses', label: '活跃许可证', icon: 'verified_user', value: lic, accent: 'success' },
          { key: 'risk', label: '风险事件(24h)', icon: 'warning', value: warningCount, accent: warningCount > 0 ? 'warn' : 'success', hint: 'warning + high 级别事件总数' },
        ];

        if (summary?.operation_stats) {
          const entries: [string, number][] = Object.entries(summary.operation_stats)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .slice(0, 10);
          const max = Math.max(1, ...entries.map(([, v]: [string, number]) => v));
          this.operationBars = entries.map(([key, value]: [string, number]) => ({
            key,
            value,
            percent: Math.round((value / max) * 100),
          }));
        }
        this.highRiskEvents = summary?.high_risk_events ?? [];
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
