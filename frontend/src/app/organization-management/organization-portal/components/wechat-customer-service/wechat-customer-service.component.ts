/**
 * 微信客服配置管理组件
 */
/* eslint-disable @typescript-eslint/unbound-method */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AgentStatus,
  ChatStatistics,
  MessageSession,
  WechatConfig,
} from '../../models/wechat-customer-service.models';
import { WechatCustomerServiceService } from '../../services/wechat-customer-service.service';

@Component({
  selector: 'app-wechat-customer-service',
  template: `
    <div class="wechat-cs-container">
      <div class="page-header">
        <h1><mat-icon>chat</mat-icon> 微信客服配置</h1>
        <p>微信公众号、小程序、企业微信接入与 AI 智能客服管理</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid" *ngIf="statistics">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon sessions-icon">
              <mat-icon>forum</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics?.total_sessions }}</h3>
              <p class="stat-label">总会话数</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon active-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics?.active_sessions }}</h3>
              <p class="stat-label">进行中会话</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon ai-icon">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">
                {{
                  statistics?.ai_replied_count && statistics?.total_messages
                    ? ((statistics.ai_replied_count! / statistics.total_messages!) * 100
                      | number: '1.0-0')
                    : 0
                }}%
              </h3>
              <p class="stat-label">AI 解决率</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon satisfaction-icon">
              <mat-icon>sentiment_satisfied_alt</mat-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ statistics?.satisfaction_rate }}%</h3>
              <p class="stat-label">满意度</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 配置表单 -->
      <mat-tab-group color="primary">
        <!-- 公众号配置 -->
        <mat-tab label="公众号配置">
          <div class="tab-content">
            <form [formGroup]="configForm" (ngSubmit)="saveConfig()">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>public</mat-icon>
                    微信公众号配置
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>AppID</mat-label>
                      <input
                        matInput
                        formControlName="official_account_appid"
                        placeholder="wx..."
                      />
                      <mat-hint>公众号 AppID</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>AppSecret</mat-label>
                      <input matInput formControlName="official_account_secret" type="password" />
                      <mat-hint>公众号 AppSecret</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Token</mat-label>
                      <input matInput formControlName="official_account_token" />
                      <mat-hint>消息推送 Token</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>EncodingAESKey</mat-label>
                      <input matInput formControlName="official_account_encoding_aes_key" />
                      <mat-hint>消息加密密钥</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="test-section">
                    <button
                      mat-raised-button
                      color="primary"
                      type="button"
                      (click)="testOfficialAccountConnection()"
                      [disabled]="
                        !configForm.get('official_account_appid')?.valid ||
                        !configForm.get('official_account_secret')?.valid
                      "
                    >
                      <mat-icon>wifi_find</mat-icon>
                      测试连接
                    </button>
                    <span class="status-badge" *ngIf="config?.official_account_verified">
                      <mat-icon color="accent">check_circle</mat-icon>
                      已验证
                    </span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-divider style="margin: 24px 0;"></mat-divider>

              <!-- 小程序配置 -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>phone_android</mat-icon>
                    微信小程序配置
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>小程序 AppID</mat-label>
                      <input matInput formControlName="mini_program_appid" placeholder="wx..." />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>小程序 AppSecret</mat-label>
                      <input matInput formControlName="mini_program_secret" type="password" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>小程序名称</mat-label>
                      <input matInput formControlName="mini_program_appname" />
                    </mat-form-field>
                  </div>

                  <div class="test-section">
                    <button
                      mat-raised-button
                      color="primary"
                      type="button"
                      (click)="testMiniProgramConnection()"
                      [disabled]="
                        !configForm.get('mini_program_appid')?.valid ||
                        !configForm.get('mini_program_secret')?.valid
                      "
                    >
                      <mat-icon>wifi_find</mat-icon>
                      测试连接
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-divider style="margin: 24px 0;"></mat-divider>

              <!-- 企业微信配置 -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>business</mat-icon>
                    企业微信配置
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>CorpID</mat-label>
                      <input matInput formControlName="wecom_corp_id" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>AgentID</mat-label>
                      <input matInput formControlName="wecom_agent_id" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Secret</mat-label>
                      <input matInput formControlName="wecom_secret" type="password" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Token</mat-label>
                      <input matInput formControlName="wecom_token" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>EncodingAESKey</mat-label>
                      <input matInput formControlName="wecom_encoding_aes_key" />
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-divider style="margin: 24px 0;"></mat-divider>

              <!-- AI 客服配置 -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>psychology</mat-icon>
                    AI 智能客服配置
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>AI 模型</mat-label>
                      <mat-select formControlName="ai_model">
                        <mat-option value="ERNIE-Bot-4.0">文心一言 4.0</mat-option>
                        <mat-option value="Qwen-Max">通义千问 Max</mat-option>
                        <mat-option value="ChatGLM3">ChatGLM3</mat-option>
                        <mat-option value="SparkDesk">讯飞星火</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>API Key</mat-label>
                      <input matInput formControlName="ai_api_key" type="password" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>置信度阈值</mat-label>
                      <input
                        matInput
                        formControlName="ai_confidence_threshold"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                      />
                      <mat-hint>低于此值将转人工（0-1）</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="toggle-section">
                    <mat-checkbox formControlName="enable_ai_assistant">启用 AI 客服</mat-checkbox>
                    <mat-checkbox formControlName="enable_auto_reply">启用自动回复</mat-checkbox>
                    <mat-checkbox formControlName="enable_human_transfer">支持转人工</mat-checkbox>
                    <mat-checkbox formControlName="enable_message_queue">启用消息队列</mat-checkbox>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-divider style="margin: 24px 0;"></mat-divider>

              <!-- 其他配置 -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>settings</mat-icon>
                    其他配置
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>客服工作时间</mat-label>
                      <input
                        matInput
                        formControlName="customer_service_hours"
                        placeholder="09:00-18:00"
                      />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>最大排队人数</mat-label>
                      <input matInput formControlName="max_queue_size" type="number" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>通知邮箱</mat-label>
                      <input matInput formControlName="notification_email" type="email" />
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="configForm.invalid"
                >
                  <mat-icon>save</mat-icon>
                  保存配置
                </button>
                <button mat-button type="button" (click)="resetForm()">
                  <mat-icon>refresh</mat-icon>
                  重置
                </button>
              </div>
            </form>
          </div>
        </mat-tab>

        <!-- 会话管理 -->
        <mat-tab label="会话管理">
          <div class="tab-content">
            <h3>消息会话列表</h3>
            <!-- TODO: 实现会话列表 UI -->
            <p>会话管理功能开发中...</p>
          </div>
        </mat-tab>

        <!-- 客服管理 -->
        <mat-tab label="客服管理">
          <div class="tab-content">
            <h3>客服状态</h3>
            <div class="agent-list" *ngFor="let agent of agents">
              <mat-card>
                <mat-card-content>
                  <div class="agent-item">
                    <div class="agent-info">
                      <strong>{{ agent.agent_name }}</strong>
                      <mat-chip [color]="getAgentStatusColor(agent.status)">
                        {{ getAgentStatusText(agent.status) }}
                      </mat-chip>
                    </div>
                    <div class="agent-stats">
                      <span>当前：{{ agent.current_chats }}/{{ agent.max_chats }}</span>
                      <span>今日回复：{{ agent.today_replies }}</span>
                      <span>平均响应：{{ agent.avg_response_time }}s</span>
                      <span>满意度：{{ agent.satisfaction_rate }}%</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .wechat-cs-container {
        height: 100%;
        overflow-y: auto;
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .page-header h1 {
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 2rem;
        color: #07c160;
      }

      .page-header p {
        margin: 0;
        color: #666;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }

      .stat-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
      }

      .stat-card mat-card-content {
        display: flex;
        align-items: center;
        padding: 20px;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }

      .sessions-icon {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
      }

      .active-icon {
        background: linear-gradient(135deg, #4caf50, #388e3c);
        color: white;
      }

      .ai-icon {
        background: linear-gradient(135deg, #9c27b0, #7b1fa2);
        color: white;
      }

      .satisfaction-icon {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
      }

      .stat-info h3 {
        margin: 0 0 4px 0;
        font-size: 1.8rem;
        font-weight: 600;
        color: #333;
      }

      .stat-label {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .tab-content {
        padding: 24px 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }

      .test-section,
      .toggle-section {
        margin-top: 16px;
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: #e8f5e9;
        border-radius: 16px;
        font-size: 14px;
        color: #2e7d32;
      }

      .form-actions {
        margin-top: 24px;
        display: flex;
        gap: 16px;
      }

      .agent-list {
        margin-bottom: 16px;
      }

      .agent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .agent-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .agent-stats {
        display: flex;
        gap: 24px;
        color: #666;
        font-size: 14px;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
})
export class WechatCustomerServiceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orgId!: number;
  configForm: FormGroup;
  config: WechatConfig | null = null;
  statistics: ChatStatistics | null = null;
  sessions: MessageSession[] = [];
  agents: AgentStatus[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private wechatService: WechatCustomerServiceService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.configForm = this.fb.group({
      official_account_appid: ['', [Validators.required]],
      official_account_secret: ['', [Validators.required]],
      official_account_token: [''],
      official_account_encoding_aes_key: [''],
      mini_program_appid: [''],
      mini_program_secret: [''],
      mini_program_appname: [''],
      wecom_corp_id: [''],
      wecom_agent_id: [''],
      wecom_secret: [''],
      wecom_token: [''],
      wecom_encoding_aes_key: [''],
      enable_auto_reply: [true],
      enable_ai_assistant: [false],
      enable_human_transfer: [true],
      enable_message_queue: [true],
      ai_model: ['ERNIE-Bot-4.0'],
      ai_api_key: [''],
      ai_confidence_threshold: [0.85],
      customer_service_hours: ['09:00-18:00'],
      max_queue_size: [50],
      notification_email: [''],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.orgId = idParam ? +idParam : 0;
    this.loadConfig();
    this.loadStatistics();
    this.loadAgents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfig(): void {
    this.wechatService
      .getWechatConfig(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: WechatConfig | null) => {
        if (data) {
          this.config = data;
          this.configForm.patchValue(data);
        }
        this.cdr.detectChanges();
      });
  }

  loadStatistics(): void {
    const today = new Date().toISOString().split('T')[0];
    this.wechatService
      .getChatStatistics(this.orgId, today, today)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ChatStatistics) => {
        this.statistics = data;
        this.cdr.detectChanges();
      });
  }

  loadAgents(): void {
    this.wechatService
      .getAgentStatusList(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: AgentStatus[]) => {
        this.agents = data;
        this.cdr.detectChanges();
      });
  }

  saveConfig(): void {
    if (this.configForm.invalid) return;

    const formValue = this.configForm.value as Partial<WechatConfig>;
    this.wechatService
      .saveWechatConfig(this.orgId, formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('配置已保存', '关闭', { duration: 3000 });
          this.loadConfig();
        },
        error: (err) => {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          this.snackBar.open(`保存失败：${errorMessage}`, '关闭', {
            duration: 5000,
          });
        },
      });
  }

  testOfficialAccountConnection(): void {
    const appid = this.configForm.get('official_account_appid')?.value as string;
    const secret = this.configForm.get('official_account_secret')?.value as string;

    this.wechatService
      .testOfficialAccountConnection(this.orgId, appid, secret)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if ('success' in result && result.success) {
          this.snackBar.open('公众号连接成功！', '关闭', { duration: 3000 });
        } else {
          const message =
            typeof (result as Record<string, unknown>)['message'] === 'string'
              ? String((result as Record<string, unknown>)['message'])
              : '未知错误';
          this.snackBar.open(`连接失败：${message}`, '关闭', {
            duration: 5000,
          });
        }
      });
  }

  testMiniProgramConnection(): void {
    const appid = this.configForm.get('mini_program_appid')?.value as string;
    const secret = this.configForm.get('mini_program_secret')?.value as string;

    this.wechatService
      .testMiniProgramConnection(this.orgId, appid, secret)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if ('success' in result && result.success) {
          this.snackBar.open('小程序连接成功！', '关闭', { duration: 3000 });
        } else {
          const message =
            typeof (result as Record<string, unknown>)['message'] === 'string'
              ? String((result as Record<string, unknown>)['message'])
              : '未知错误';
          this.snackBar.open(`连接失败：${message}`, '关闭', {
            duration: 5000,
          });
        }
      });
  }

  resetForm(): void {
    if (this.config) {
      this.configForm.patchValue(this.config);
    }
  }

  getAgentStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'online':
        return 'primary';
      case 'busy':
        return 'accent';
      case 'offline':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getAgentStatusText(status: string): string {
    const map: Record<string, string> = {
      online: '在线',
      offline: '离线',
      busy: '忙碌',
      away: '离开',
    };
    return map[status] || status;
  }
}
