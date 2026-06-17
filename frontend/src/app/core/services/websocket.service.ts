import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WsEvent {
  /** 事件类型：backup_complete | backup_failed | system_notice | schedule_change 等 */
  event: string;
  title: string;
  content: string;
  data: any;
  timestamp: string;
}

export type WsConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * WebSocket 实时推送服务
 *
 * 管理与后端 WebSocket 端点的连接、自动重连、心跳保活、事件分发。
 * 组件通过注入此服务并订阅 events$ 来接收推送消息。
 *
 * 用法:
 * ```typescript
 * this.wsService.events$
 *   .pipe(filter(e => e.event === 'backup_complete'))
 *   .subscribe(e => { ... });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private eventBus = new Subject<WsEvent>();
  private stateSubject = new Subject<WsConnectionState>();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;
  private readonly RECONNECT_BASE_MS = 1000;
  private readonly HEARTBEAT_INTERVAL_MS = 30000;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private currentToken: string | null = null;

  /** 事件流，组件通过 filter 订阅特定事件 */
  events$: Observable<WsEvent> = this.eventBus.asObservable();

  /** 连接状态流 */
  connectionState$: Observable<WsConnectionState> = this.stateSubject.asObservable();

  constructor() {
    // 监听页面可见性变化，切回时检查连接
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** 建立 WebSocket 连接 */
  connect(token: string): void {
    if (!token) {
      console.warn('[WebSocket] 未提供 token，跳过连接');
      return;
    }

    this.currentToken = token;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // 已连接或正在连接
    }

    this.stateSubject.next('connecting');

    // 构造 WS URL
    const wsBase = environment.apiUrl
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:');
    const wsUrl = `${wsBase}/api/v1/ws/connect?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接已建立');
        this.reconnectAttempts = 0;
        this.stateSubject.next('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WsEvent = JSON.parse(event.data);
          this.eventBus.next(message);
        } catch {
          console.warn('[WebSocket] 收到非 JSON 消息:', event.data);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`[WebSocket] 连接关闭 (code=${event.code})`);
        this.stopHeartbeat();
        this.stateSubject.next('disconnected');
        this.ws = null;

        // 非主动关闭时自动重连
        if (!this.destroyed && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
      };
    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error);
      this.stateSubject.next('disconnected');
      if (!this.destroyed) {
        this.scheduleReconnect();
      }
    }
  }

  /** 主动断开连接 */
  disconnect(): void {
    this.reconnectAttempts = this.MAX_RECONNECT; // 阻止自动重连
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.onclose = null; // 阻止 onclose 触发重连
      this.ws.close(1000, '主动断开');
      this.ws = null;
    }

    this.currentToken = null;
    this.stateSubject.next('disconnected');
  }

  /** 获取当前连接状态 */
  get connectionState(): WsConnectionState {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      default: return 'disconnected';
    }
  }

  /** 检查是否已连接 */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** 重新连接（使用上一次的 token） */
  reconnect(): void {
    if (this.currentToken) {
      this.connect(this.currentToken);
    }
  }

  // ---------- 私有方法 ----------

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= this.MAX_RECONNECT) {
      console.warn(`[WebSocket] 已达最大重连次数 (${this.MAX_RECONNECT})，停止重连`);
      return;
    }

    this.stateSubject.next('reconnecting');
    const delay = this.RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts);
    console.log(`[WebSocket] ${delay}ms 后尝试第 ${this.reconnectAttempts + 1} 次重连`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) {
        this.reconnectAttempts++;
        this.reconnect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        try {
          this.ws?.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // 发送失败由 onclose 处理重连
        }
      } else {
        this.stopHeartbeat();
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** 页面可见性变化时检查连接 */
  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && !this.isConnected && this.currentToken) {
      this.reconnect();
    }
  };
}
