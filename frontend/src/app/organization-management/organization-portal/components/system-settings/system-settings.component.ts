import { Component } from '@angular/core';
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

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatDividerModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatTabsModule],
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
    
    ::ng-deep .mat-mdc-slide-toggle {
      margin: 0;
    }
  `]
})
export class SystemSettingsComponent {
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

  constructor(private snackBar: MatSnackBar) {}

  saveSettings(): void {
    this.snackBar.open('设置已保存', '关闭', { duration: 2000 });
  }
}
