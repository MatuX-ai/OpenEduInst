/**
 * Admin 管理后台 - 安全设置（只读展示）
 *
 * 展示当前生效的安全配置：JWT/限流/Token 黑名单/审计日志/HTTPS/CORS 等
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AdminBackendService,
  CurrentUserInfo,
  SecurityConfig,
} from '../core/services/admin-backend.service';

@Component({
  selector: 'app-admin-security',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="security">
      <header class="security__header">
        <div>
          <h1>
            <mat-icon>shield</mat-icon>
            安全配置
          </h1>
          <p class="security__subtitle">
            当前运行的安全策略概览，涉及 JWT、限流、Token 黑名单、审计日志、HTTPS、CORS 等
          </p>
        </div>
        <button mat-raised-button color="warn" (click)="logout()">
          <mat-icon>logout</mat-icon>
          退出登录（本次 Token 失效）
        </button>
      </header>

      <div *ngIf="loading" class="state-card">
        <p>加载中...</p>
      </div>

      <ng-container *ngIf="!loading && config">
        <div class="grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">vpn_key</mat-icon>
                JWT 配置
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item>
                  <span>算法</span><span class="val">{{ config.algorithm }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span>访问令牌有效期</span><span class="val">{{ config.access_token_expire_minutes }} 分钟</span>
                </mat-list-item>
                <mat-list-item>
                  <span>密钥（已脱敏）</span><span class="val monospace">{{ config.secret_key_masked }}</span>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">speed</mat-icon>
                限流（Rate Limit）
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item><span>匿名用户</span><span class="val">{{ config.rate_limit.anon }}</span></mat-list-item>
                <mat-list-item><span>普通登录用户</span><span class="val">{{ config.rate_limit.auth }}</span></mat-list-item>
                <mat-list-item><span>登录接口</span><span class="val">{{ config.rate_limit.login }}</span></mat-list-item>
                <mat-list-item><span>管理员</span><span class="val">{{ config.rate_limit.admin }}</span></mat-list-item>
                <mat-list-item><span>超级管理员</span><span class="val">{{ config.rate_limit.super_admin }}</span></mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="warn">block</mat-icon>
                Token 黑名单
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item>
                  <span>黑名单默认 TTL</span>
                  <span class="val">{{ config.token_blacklist.ttl_seconds }} 秒</span>
                </mat-list-item>
                <mat-list-item>
                  <span>Redis 模式</span>
                  <span class="val">{{ config.token_blacklist.redis_enabled ? '已启用' : '内存回退（单节点）' }}</span>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">description</mat-icon>
                审计日志
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item>
                  <span>日志路径</span>
                  <span class="val monospace">{{ config.audit.log_file }}</span>
                </mat-list-item>
                <mat-list-item><span>级别</span><span class="val">{{ config.audit.level }}</span></mat-list-item>
                <mat-list-item>
                  <span>记录请求体</span>
                  <span class="val">{{ config.audit.record_body ? '启用（敏感字段自动脱敏）' : '关闭' }}</span>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">https</mat-icon>
                HTTPS / CORS
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item>
                  <span>强制 HTTPS（HSTS）</span>
                  <span class="val">{{ config.enforce_https ? '启用' : '关闭' }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span>允许跨域来源数</span>
                  <span class="val">{{ config.cors_allow_origin_count }}</span>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card *ngIf="currentUser">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">account_circle</mat-icon>
                当前用户 / 权限
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list dense>
                <mat-list-item><span>用户</span><span class="val">{{ currentUser.username }}</span></mat-list-item>
                <mat-list-item><span>角色</span><span class="val">{{ currentUser.role }}</span></mat-list-item>
                <mat-list-item><span>组织ID</span><span class="val">{{ currentUser.org_id }}</span></mat-list-item>
                <mat-list-item>
                  <span>权限数量</span>
                  <span class="val">{{ currentUser.permissions.length }}</span>
                </mat-list-item>
              </mat-list>
              <div class="perms">
                <span
                  *ngFor="let p of currentUser.permissions"
                  class="perm-chip"
                  [matTooltip]="p"
                >{{ p }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .security { padding: 24px; }
      .security__header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 20px;
      }
      .security__header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 24px; color: #1f2937; }
      .security__subtitle { color: #6b7280; margin: 6px 0 0; }
      .state-card { text-align: center; color: #6b7280; padding: 24px; }
      .grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }
      mat-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
      mat-list-item { display: flex; justify-content: space-between; }
      .val { color: #111827; font-weight: 500; }
      .monospace { font-family: ui-monospace, monospace; font-size: 12px; }
      .perms { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
      .perm-chip {
        padding: 4px 10px; background: #eef2ff; color: #4f46e5;
        border-radius: 999px; font-size: 12px; cursor: default;
      }
    `,
  ],
})
export class AdminSecurityComponent implements OnInit, OnDestroy {
  config: SecurityConfig | null = null;
  currentUser: CurrentUserInfo | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminBackendService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService
      .getSecurityConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cfg: SecurityConfig) => (this.config = cfg),
        error: () => this.snackBar.open('加载安全配置失败', '关闭', { duration: 3000 }),
      });
    this.adminService
      .getMe()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (me: CurrentUserInfo) => (this.currentUser = me),
        complete: () => (this.loading = false),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    if (!confirm('确认退出登录？退出后当前 Token 会被加入黑名单。')) return;
    this.adminService.logout().subscribe({
      next: (resp: { success: boolean; message?: string }) => {
        if (typeof localStorage !== 'undefined') localStorage.removeItem('access_token');
        this.snackBar.open(resp?.message || '已退出，Token 已失效', '关闭', { duration: 3000 });
      },
      error: () => this.snackBar.open('退出失败', '关闭', { duration: 2400 }),
    });
  }
}
