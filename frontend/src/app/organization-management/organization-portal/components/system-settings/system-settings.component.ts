import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  OpenMtSciEdService,
  OpenSciEdConfig,
  OpenSciEdHealth,
} from '../../../../core/services/openmt-scied.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatDividerModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatTabsModule, MatProgressSpinnerModule],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <h1>系统设置</h1>
        <p class="subtitle">配置机构基本信息、功能开关和系统参数</p>
      </div>

      <mat-tab-group color="primary" class="settings-tabs">
        <!-- 机构信息 -->
        <mat-tab label="机构信息">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>business</mat-icon>
                <mat-card-title>基本信息</mat-card-title>
                <mat-card-subtitle>配置机构名称、联系方式和地址</mat-card-subtitle>
              </mat-card-header>
              <mat-divider></mat-divider>
              <mat-card-content class="form-content">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>机构名称</mat-label>
                    <input matInput [(ngModel)]="settings.orgName" placeholder="请输入机构名称" />
                  </mat-form-field>
                </div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>机构地址</mat-label>
                    <input matInput [(ngModel)]="settings.orgAddress" placeholder="请输入机构地址" />
                  </mat-form-field>
                </div>
                <div class="form-row form-row-2col">
                  <mat-form-field appearance="outline">
                    <mat-label>联系电话</mat-label>
                    <input matInput [(ngModel)]="settings.orgPhone" placeholder="请输入联系电话" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>联系邮箱</mat-label>
                    <input matInput [(ngModel)]="settings.orgEmail" placeholder="请输入联系邮箱" />
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-divider></mat-divider>
              <mat-card-actions align="end">
                <button mat-stroked-button (click)="saveSettings()">
                  <mat-icon>save</mat-icon> 保存设置
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- 功能开关 -->
        <mat-tab label="功能开关">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>toggle_on</mat-icon>
                <mat-card-title>机构功能开关</mat-card-title>
                <mat-card-subtitle>启用或禁用机构的功能模块</mat-card-subtitle>
              </mat-card-header>
              <mat-divider></mat-divider>
              <mat-card-content class="form-content">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>notifications</mat-icon>
                    <div>
                      <span class="toggle-label">消息通知</span>
                      <span class="toggle-desc">启用系统消息和通知推送</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.features.notifications" color="primary"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>email</mat-icon>
                    <div>
                      <span class="toggle-label">邮件通知</span>
                      <span class="toggle-desc">发送课程提醒、续费通知等邮件</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.features.emailAlerts" color="primary"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>auto_backup</mat-icon>
                    <div>
                      <span class="toggle-label">自动备份</span>
                      <span class="toggle-desc">云托管每日自动备份数据</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.features.autoBackup" color="primary" [disabled]="true"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>smart_toy</mat-icon>
                    <div>
                      <span class="toggle-label">AI 助教</span>
                      <span class="toggle-desc">AI 智能排课、学情分析和代码审查</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.features.aiAssistant" color="primary" [disabled]="true"></mat-slide-toggle>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- 安全配置 -->
        <mat-tab label="安全配置">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>security</mat-icon>
                <mat-card-title>安全与权限</mat-card-title>
                <mat-card-subtitle>配置登录策略和数据安全选项</mat-card-subtitle>
              </mat-card-header>
              <mat-divider></mat-divider>
              <mat-card-content class="form-content">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>fingerprint</mat-icon>
                    <div>
                      <span class="toggle-label">双因素认证</span>
                      <span class="toggle-desc">登录时需额外验证码验证</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.security.twoFactor" color="primary"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <mat-icon>timer</mat-icon>
                    <div>
                      <span class="toggle-label">会话超时</span>
                      <span class="toggle-desc">30 分钟无操作自动登出</span>
                    </div>
                  </div>
                  <mat-slide-toggle [(ngModel)]="settings.security.sessionTimeout" color="primary"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>密码复杂度要求</mat-label>
                    <mat-select [(ngModel)]="settings.security.passwordPolicy">
                      <mat-option value="basic">基本（6 位以上）</mat-option>
                      <mat-option value="medium">中等（8 位，含字母数字）</mat-option>
                      <mat-option value="strong">强（10 位，含大小写字母、数字和符号）</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-divider></mat-divider>
              <mat-card-actions align="end">
                <button mat-stroked-button (click)="saveSettings()">
                  <mat-icon>save</mat-icon> 保存设置
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- OpenMTSciEd 集成 -->
        <mat-tab label="OpenMTSciEd 集成">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>hub</mat-icon>
                <mat-card-title>STEM 资源平台集成</mat-card-title>
                <mat-card-subtitle>连接 OpenMTSciEd 教程、课件与硬件项目库</mat-card-subtitle>
              </mat-card-header>
              <mat-divider></mat-divider>
              <mat-card-content class="form-content">
                <div *ngIf="sciEdLoading" class="sci-ed-loading">
                  <mat-spinner diameter="32"></mat-spinner>
                  <span>加载集成配置…</span>
                </div>

                <ng-container *ngIf="!sciEdLoading">
                  <div class="toggle-row">
                    <div class="toggle-info">
                      <mat-icon>power</mat-icon>
                      <div>
                        <span class="toggle-label">启用 OpenMTSciEd</span>
                        <span class="toggle-desc">开启后机构与教师可浏览 STEM 资源库</span>
                      </div>
                    </div>
                    <mat-slide-toggle [(ngModel)]="sciEdForm.enabled" color="primary"></mat-slide-toggle>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="form-row" style="margin-top: 16px">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>机构 API Key（可选，留空使用平台 Key）</mat-label>
                      <input
                        matInput
                        [(ngModel)]="sciEdForm.apiKey"
                        [placeholder]="sciEdConfig?.api_key_masked || '输入新 Key 以更新'"
                        type="password"
                      />
                    </mat-form-field>
                  </div>

                  <div class="sci-ed-status" *ngIf="sciEdConfig">
                    <p><strong>当前状态：</strong>{{ sciEdConfig.enabled ? '已启用' : '未启用' }}</p>
                    <p><strong>同步状态：</strong>{{ sciEdConfig.sync_status }}</p>
                    <p *ngIf="sciEdConfig.last_sync"><strong>上次同步：</strong>{{ sciEdConfig.last_sync }}</p>
                    <p><strong>上游地址：</strong>{{ sciEdConfig.upstream }}</p>
                    <p *ngIf="sciEdHealth">
                      <strong>连通性：</strong>
                      {{ sciEdHealth.connected ? '正常' : '不可用' }}
                      ({{ sciEdHealth.latency_ms }}ms)
                    </p>
                  </div>
                </ng-container>
              </mat-card-content>
              <mat-divider></mat-divider>
              <mat-card-actions align="end">
                <button mat-stroked-button (click)="testSciEdConnection()" [disabled]="sciEdSaving">
                  <mat-icon>link</mat-icon> 测试连接
                </button>
                <button mat-stroked-button (click)="syncSciEdNow()" [disabled]="sciEdSaving || sciEdSyncing">
                  <mat-icon>sync</mat-icon> 立即同步
                </button>
                <button mat-flat-button color="primary" (click)="saveSciEdConfig()" [disabled]="sciEdSaving">
                  <mat-icon>save</mat-icon> 保存集成配置
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    .settings-container { padding: 24px; background: #F1F5F9; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 600; color: #0F172A; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #64748B; margin: 0; }
    .settings-tabs { max-width: 900px; }
    .tab-content { padding: 24px 0; }
    
    mat-card {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
    }
    
    mat-card-header {
      padding: 20px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    mat-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
    }
    
    mat-card-subtitle {
      font-size: 12px;
      color: #64748B;
      margin-top: 4px;
    }
    
    mat-card-avatar {
      width: 32px !important;
      height: 32px !important;
      background: #EFF6FF !important;
      border-radius: 8px !important;
    }
    
    mat-card-avatar mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #3B82F6 !important;
    }
    
    .form-content { padding: 20px; }
    .form-row { margin-bottom: 16px; }
    .form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
    .toggle-info { display: flex; align-items: center; gap: 16px; }
    .toggle-info mat-icon { color: #64748B; }
    .toggle-label { display: block; font-size: 14px; font-weight: 500; color: #0F172A; }
    .toggle-desc { display: block; font-size: 12px; color: #64748B; margin-top: 2px; }
    mat-card-actions { padding: 16px 20px; }
    .sci-ed-loading { display: flex; align-items: center; gap: 12px; padding: 16px 0; color: #64748B; }
    .sci-ed-status { font-size: 13px; color: #475569; line-height: 1.8; margin-top: 8px; }
    .sci-ed-status p { margin: 0; }

    /* Material slide toggle 样式已迁移至 styles/_material-overrides.scss */
  `]
})
export class SystemSettingsComponent implements OnInit {
  settings = {
    orgName: '星海机器人培训中心',
    orgAddress: '北京市海淀区中关村大街1号',
    orgPhone: '010-88886666',
    orgEmail: 'admin@starrobotics.edu.cn',
    features: {
      notifications: true,
      emailAlerts: true,
      autoBackup: true,
      aiAssistant: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: true,
      passwordPolicy: 'medium',
    },
  };

  sciEdLoading = true;
  sciEdSaving = false;
  sciEdSyncing = false;
  sciEdConfig: OpenSciEdConfig | null = null;
  sciEdHealth: OpenSciEdHealth | null = null;
  sciEdForm = {
    enabled: false,
    apiKey: '',
  };

  constructor(
    private snackBar: MatSnackBar,
    private sciEdService: OpenMtSciEdService
  ) {}

  ngOnInit(): void {
    this.loadSciEdConfig();
  }

  loadSciEdConfig(): void {
    this.sciEdLoading = true;
    this.sciEdService.getConfig().subscribe({
      next: (cfg) => {
        this.sciEdConfig = cfg;
        this.sciEdForm.enabled = cfg.opensciedu_api_enabled ?? cfg.enabled;
        this.sciEdLoading = false;
      },
      error: () => {
        this.sciEdLoading = false;
        this.snackBar.open('无法加载 OpenMTSciEd 配置', '关闭', { duration: 3000 });
      },
    });
  }

  testSciEdConnection(): void {
    this.sciEdService.getHealth().subscribe({
      next: (health) => {
        this.sciEdHealth = health;
        const msg = health.connected
          ? `连接成功 (${health.latency_ms}ms)`
          : '无法连接 OpenMTSciEd 上游';
        this.snackBar.open(msg, '关闭', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('连接测试失败', '关闭', { duration: 3000 });
      },
    });
  }

  saveSciEdConfig(): void {
    this.sciEdSaving = true;
    const body: { opensciedu_api_enabled: boolean; opensciedu_api_key?: string } = {
      opensciedu_api_enabled: this.sciEdForm.enabled,
    };
    if (this.sciEdForm.apiKey.trim()) {
      body.opensciedu_api_key = this.sciEdForm.apiKey.trim();
    }
    this.sciEdService.updateConfig(body).subscribe({
      next: (res) => {
        this.sciEdSaving = false;
        this.sciEdForm.apiKey = '';
        this.snackBar.open(res.message || '集成配置已保存', '关闭', { duration: 2500 });
        this.loadSciEdConfig();
      },
      error: () => {
        this.sciEdSaving = false;
        this.snackBar.open('保存失败，请确认管理员权限', '关闭', { duration: 3000 });
      },
    });
  }

  syncSciEdNow(): void {
    this.sciEdSyncing = true;
    this.sciEdService.triggerSync().subscribe({
      next: (res) => {
        this.sciEdSyncing = false;
        const msg =
          res.status === 'success'
            ? '元数据同步完成'
            : res.status === 'skipped'
              ? '集成未启用，已跳过同步'
              : '同步完成';
        this.snackBar.open(msg, '关闭', { duration: 3000 });
        this.loadSciEdConfig();
      },
      error: (err) => {
        this.sciEdSyncing = false;
        const detail = err?.error?.detail?.message || '同步失败';
        this.snackBar.open(detail, '关闭', { duration: 4000 });
        this.loadSciEdConfig();
      },
    });
  }

  saveSettings(): void {
    this.snackBar.open('设置已保存', '关闭', { duration: 2000 });
  }
}
