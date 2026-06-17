import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AiAssistantService,
  AiStatus,
  AiTokenBalance,
  ChatMessage,
  ChatReply,
} from '../../../../core/services/ai-assistant.service';

interface UiMessage extends ChatMessage {
  ts: number;
  pending?: boolean;
  error?: boolean;
  tokenInfo?: { consumed: number; latency: number };
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="ai-assistant-container">
      <!-- 顶部状态栏 -->
      <header class="top-bar">
        <div class="title-block">
          <h1>
            <mat-icon class="title-icon">psychology</mat-icon>
            AI 助教 · 小启
          </h1>
          <p class="subtitle">面向 K12 STEM 教育培训机构，提供教学答疑、排课建议、学情分析、代码审查</p>
        </div>

        <div class="status-block">
          <!-- 状态角标 -->
          <div
            class="status-pill"
            [class.real]="status?.is_real_llm"
            [class.mock]="!status?.is_real_llm"
            [matTooltip]="
              status
                ? 'Provider: ' + status.provider + '\\nModel: ' + status.model + '\\nBase URL: ' + status.base_url
                : '加载中...'
            "
            aria-label="LLM 服务状态"
          >
            <span class="dot"></span>
            <span class="status-text">
              {{ status ? (status.is_real_llm ? '已连接真实 LLM' : 'Mock 兜底') : '加载中...' }}
            </span>
          </div>

          <!-- Token 余量 -->
          <button
            mat-stroked-button
            class="token-pill"
            (click)="refreshTokenBalance()"
            [matTooltip]="'已消耗: ' + (tokenBalance?.total_consumed || 0) + ' / 月度配额: ' + (tokenBalance?.monthly_quota || 0)"
            aria-label="Token 余量"
          >
            <mat-icon>token</mat-icon>
            <span class="token-num">{{ (tokenBalance?.balance ?? 0) | number }}</span>
            <span class="token-unit">Token</span>
          </button>
        </div>
      </header>

      <mat-divider></mat-divider>

      <!-- 主体：消息列表 + 输入栏 -->
      <main class="main-area">
        <!-- 快捷模板栏 -->
        <div class="quick-prompts" role="toolbar" aria-label="快捷模板">
          <span class="quick-label">
            <mat-icon>flash_on</mat-icon>
            快捷模板
          </span>
          <mat-chip-listbox
            aria-label="快捷模板选择"
            [multiple]="false"
          >
            <mat-chip-option
              *ngFor="let p of quickPrompts"
              (selectionChange)="onQuickPrompt(p)"
              [value]="p.id"
              [disabled]="loading"
              [attr.aria-label]="p.label"
            >
              <mat-icon class="chip-icon">{{ p.icon }}</mat-icon>
              {{ p.label }}
            </mat-chip-option>
          </mat-chip-listbox>
        </div>

        <!-- 消息列表 -->
        <div #scrollContainer class="message-list" role="log" aria-live="polite" aria-label="对话历史">
          <div *ngIf="messages.length === 0" class="empty-state">
            <mat-icon>forum</mat-icon>
            <h3>开始与「小启」对话</h3>
            <p>你可以直接输入问题，或点击上方快捷模板快速开始</p>
          </div>

          <div
            *ngFor="let msg of messages"
            class="message-row"
            [class.user]="msg.role === 'user'"
            [class.assistant]="msg.role === 'assistant'"
          >
            <div class="avatar" [class.user-avatar]="msg.role === 'user'">
              <mat-icon>{{ msg.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
            </div>
            <div class="bubble" [class.pending]="msg.pending" [class.error]="msg.error">
              <div class="bubble-content" [innerHTML]="renderMarkdown(msg.content)"></div>
              <div class="bubble-footer">
                <span class="ts">{{ msg.ts | date:'HH:mm:ss' }}</span>
                <span *ngIf="msg.tokenInfo" class="token-info">
                  <mat-icon>toll</mat-icon>
                  消耗 {{ msg.tokenInfo.consumed }} · {{ msg.tokenInfo.latency }}ms
                </span>
                <span *ngIf="msg.role === 'assistant' && !msg.pending && !msg.error" class="model-info">
                  {{ status?.model || '' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 加载占位 -->
          <div *ngIf="loading" class="message-row assistant">
            <div class="avatar"><mat-icon>smart_toy</mat-icon></div>
            <div class="bubble pending">
              <div class="typing">
                <span></span><span></span><span></span>
              </div>
              <div class="bubble-footer">
                <span class="ts">{{ now | date:'HH:mm:ss' }}</span>
                <span class="model-info">思考中...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入栏 -->
        <footer class="input-bar">
          <mat-form-field appearance="outline" class="input-field">
            <mat-label>输入问题（Shift+Enter 换行）</mat-label>
            <textarea
              matInput
              rows="2"
              [(ngModel)]="inputText"
              (keydown)="onKeyDown($event)"
              [disabled]="loading"
              placeholder="例如：帮我分析学生张三的学情，并给出改进建议"
              aria-label="问题输入框"
            ></textarea>
            <mat-hint align="end">{{ inputText.length }} / 2000</mat-hint>
          </mat-form-field>
          <div class="send-actions">
            <button
              mat-icon-button
              color="primary"
              (click)="clearMessages()"
              [disabled]="loading || messages.length === 0"
              matTooltip="清空对话"
              aria-label="清空对话"
            >
              <mat-icon>delete_sweep</mat-icon>
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || loading"
              aria-label="发送"
            >
              <mat-icon>send</mat-icon>
              发送
            </button>
          </div>
        </footer>

        <mat-progress-bar
          *ngIf="loading"
          mode="indeterminate"
          aria-label="AI 思考中"
          class="bottom-progress"
        ></mat-progress-bar>
      </main>
    </div>
  `,
  styles: [
    `
      .ai-assistant-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 64px);
        max-width: 1100px;
        margin: 0 auto;
        background: #f5f7fa;
      }
      .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px 24px;
        gap: 16px;
        flex-wrap: wrap;
        background: white;
      }
      .title-block h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #263238;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .title-icon {
        color: #1976d2;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .subtitle {
        margin: 4px 0 0;
        color: #607d8b;
        font-size: 13px;
      }
      .status-block {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: default;
      }
      .status-pill .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: pulse 1.6s ease-in-out infinite;
      }
      .status-pill.real {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-pill.real .dot {
        background: #2e7d32;
        box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.5);
      }
      .status-pill.mock {
        background: #fff8e1;
        color: #f57c00;
      }
      .status-pill.mock .dot {
        background: #f57c00;
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.5); }
        70% { box-shadow: 0 0 0 8px rgba(46, 125, 50, 0); }
        100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
      }
      .token-pill {
        font-weight: 500;
      }
      .token-pill .token-num {
        font-weight: 700;
        color: #1976d2;
        margin: 0 4px;
      }
      .token-pill .token-unit {
        color: #607d8b;
        font-size: 12px;
      }
      .main-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px 24px 0;
        min-height: 0;
      }
      .quick-prompts {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .quick-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #607d8b;
        font-size: 13px;
        font-weight: 500;
      }
      .quick-label mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .chip-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        margin-right: 4px;
        vertical-align: middle;
      }
      .message-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .empty-state {
        text-align: center;
        margin: auto;
        color: #607d8b;
      }
      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.4;
        color: #1976d2;
      }
      .empty-state h3 {
        margin: 12px 0 4px;
        color: #455a64;
      }
      .empty-state p {
        margin: 0;
        font-size: 13px;
      }
      .message-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .message-row.user {
        flex-direction: row-reverse;
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1976d2;
        color: white;
        flex-shrink: 0;
      }
      .avatar.user-avatar {
        background: #455a64;
      }
      .avatar mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .bubble {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 12px;
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        word-break: break-word;
      }
      .message-row.user .bubble {
        background: #1976d2;
        color: white;
      }
      .bubble.pending {
        opacity: 0.85;
      }
      .bubble.error {
        background: #ffebee;
        color: #c62828;
      }
      .bubble-content {
        line-height: 1.6;
        font-size: 14px;
      }
      .bubble-content :is(p) {
        margin: 0 0 8px;
      }
      .bubble-content :is(p:last-child) {
        margin-bottom: 0;
      }
      .bubble-content :is(code) {
        background: rgba(0, 0, 0, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
      }
      .message-row.user .bubble-content :is(code) {
        background: rgba(255, 255, 255, 0.18);
      }
      .bubble-content :is(pre) {
        background: rgba(0, 0, 0, 0.04);
        padding: 8px 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;
      }
      .message-row.user .bubble-content :is(pre) {
        background: rgba(255, 255, 255, 0.12);
      }
      .bubble-content :is(ul, ol) {
        margin: 4px 0 8px 20px;
      }
      .bubble-footer {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        font-size: 11px;
        opacity: 0.7;
      }
      .message-row.user .bubble-footer {
        color: rgba(255, 255, 255, 0.85);
      }
      .bubble-footer mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
        vertical-align: middle;
        margin-right: 2px;
      }
      .typing {
        display: inline-flex;
        gap: 4px;
      }
      .typing span {
        width: 8px;
        height: 8px;
        background: #1976d2;
        border-radius: 50%;
        display: inline-block;
        animation: typing 1.2s infinite;
      }
      .typing span:nth-child(2) { animation-delay: 0.15s; }
      .typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
        30% { transform: translateY(-6px); opacity: 1; }
      }
      .input-bar {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        padding: 12px 0 16px;
        background: white;
        border-top: 1px solid #eceff1;
        border-radius: 12px 12px 0 0;
        padding: 12px 16px 0;
        margin: 0 -16px;
      }
      .input-field {
        flex: 1;
      }
      .input-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        margin-top: 2px;
      }
      .send-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        padding-bottom: 12px;
      }
      .send-actions button mat-icon {
        margin-right: 4px;
      }
      .bottom-progress {
        margin: 0 -24px;
      }
      @media (max-width: 600px) {
        .top-bar {
          padding: 12px 16px;
        }
        .main-area {
          padding: 12px 16px 0;
        }
        .status-block {
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .bubble {
          max-width: 85%;
        }
      }
    `,
  ],
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  orgId!: number;
  messages: UiMessage[] = [];
  inputText = '';
  loading = false;
  now = new Date();

  status: AiStatus | null = null;
  tokenBalance: AiTokenBalance | null = null;

  quickPrompts: QuickPrompt[] = [
    {
      id: 'scheduling',
      label: '排课建议',
      icon: 'event',
      text: '请基于以下输入给出下周排课建议：10 名教师、5 间教室、8 门课程，需要满足容量约束并尽量均衡教师负载。',
    },
    {
      id: 'analysis',
      label: '学情分析',
      icon: 'insights',
      text: '请分析学生 #1 的学情，从出勤率、课时消耗、项目完成率、竞赛获奖、课堂参与度 5 个维度给出雷达图和具体改进建议。',
    },
    {
      id: 'code-review',
      label: '代码审查',
      icon: 'code',
      text: '请审查以下 Python 代码：\n```python\ndef add(a,b):\n    return a+b\n```\n指出风格、逻辑、可改进点。',
    },
  ];

  private subs = new Subscription();
  private streamTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private aiService: AiAssistantService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    this.refreshStatus();
    this.refreshTokenBalance();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  refreshStatus(): void {
    this.aiService.status().subscribe({
      next: (s) => (this.status = s),
      error: (err) => {
        console.error('[AI] status failed', err);
        this.status = {
          provider: 'unknown',
          model: 'unknown',
          base_url: '',
          is_real_llm: false,
          fallback_enabled: true,
          timeout: 0,
          max_tokens: 0,
        };
      },
    });
  }

  refreshTokenBalance(): void {
    this.aiService.tokenBalance().subscribe({
      next: (b) => (this.tokenBalance = b),
      error: (err) => {
        console.error('[AI] token balance failed', err);
        this.tokenBalance = { balance: 0, total_consumed: 0, monthly_quota: 0 };
      },
    });
  }

  onQuickPrompt(p: QuickPrompt): void {
    this.inputText = p.text;
    setTimeout(() => this.sendMessage(), 50);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    const userMsg: UiMessage = {
      role: 'user',
      content: text,
      ts: Date.now(),
    };
    this.messages = [...this.messages, userMsg];
    this.inputText = '';
    this.loading = true;
    this.scrollToBottom();

    const history: ChatMessage[] = this.messages
      .filter((m) => !m.pending && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const sub = this.aiService.chat(text, history).subscribe({
      next: (reply) => this.handleReply(reply),
      error: (err) => this.handleError(err),
    });
    this.subs.add(sub);
  }

  private handleReply(reply: ChatReply): void {
    this.loading = false;
    const assistantMsg: UiMessage = {
      role: 'assistant',
      content: '',
      ts: Date.now(),
      tokenInfo: { consumed: reply.token_consumed, latency: reply.latency_ms },
    };
    this.messages = [...this.messages, assistantMsg];
    this.scrollToBottom();

    // 模拟流式输出：每 30ms 追加 2~4 字符
    let idx = 0;
    const fullText = reply.reply || '（AI 未返回内容）';
    if (this.streamTimer) clearInterval(this.streamTimer);
    this.streamTimer = setInterval(() => {
      idx = Math.min(idx + 3 + Math.floor(Math.random() * 2), fullText.length);
      const lastIdx = this.messages.length - 1;
      this.messages = this.messages.map((m, i) =>
        i === lastIdx ? { ...m, content: fullText.slice(0, idx) } : m
      );
      this.scrollToBottom();
      if (idx >= fullText.length) {
        if (this.streamTimer) {
          clearInterval(this.streamTimer);
          this.streamTimer = null;
        }
        this.refreshTokenBalance();
      }
    }, 30);
  }

  private handleError(err: any): void {
    this.loading = false;
    const detail =
      err?.error?.detail || err?.message || 'AI 助教调用失败，请稍后重试';
    const errMsg: UiMessage = {
      role: 'assistant',
      content: `⚠️ ${detail}`,
      ts: Date.now(),
      error: true,
    };
    this.messages = [...this.messages, errMsg];
    this.scrollToBottom();
    this.snackBar.open(detail, '关闭', { duration: 4000, panelClass: ['error-snackbar'] });
  }

  clearMessages(): void {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.messages = [];
    this.loading = false;
  }

  /**
   * 极简 Markdown 渲染：标题/粗体/行内代码/代码块/列表
   * 走 DomSanitizer 防止 XSS
   */
  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 代码块 ```
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_m, _lang, code) => `<pre><code>${code}</code></pre>`
    );
    // 行内代码 `
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    // 标题 ## / ###
    html = html.replace(/^### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*)$/gm, '<h3>$1</h3>');
    // 粗体 **x**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 列表 -
    html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
    // 数字列表 1.
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
    // 段落换行
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 30);
  }
}
