/**
 * 微信客服服务
 */

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  AgentStatus,
  ChatStatistics,
  MessageSession,
  UnifiedMessage,
  WechatConfig,
} from '../models/wechat-customer-service.models';

interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WechatCustomerServiceService {
  private readonly API_BASE = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /**
   * 获取微信客服配置
   */
  getWechatConfig(orgId: number): Observable<WechatConfig | null> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<WechatConfig>>(`${this.API_BASE}/wechat/org/${orgId}/config`, { headers })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.warn('获取微信配置失败，返回模拟数据:', err);
          return this.getMockConfig(orgId);
        })
      );
  }

  /**
   * 保存微信客服配置
   */
  saveWechatConfig(orgId: number, config: Partial<WechatConfig>): Observable<WechatConfig> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<WechatConfig>>(`${this.API_BASE}/wechat/org/${orgId}/config`, config, {
        headers,
      })
      .pipe(
        map((response) => response.data),
        timeout(8000),
        catchError((err) => {
          console.error('保存微信配置失败:', err);
          throw err;
        })
      );
  }

  /**
   * 测试公众号连接
   */
  testOfficialAccountConnection(
    orgId: number,
    appid: string,
    secret: string
  ): Observable<{ success: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<{ success: boolean; message: string }>
      >(`${this.API_BASE}/wechat/test-official-account`, { appid, secret }, { headers })
      .pipe(
        map((response) => response.data),
        timeout(10000),
        catchError((err) => {
          console.error('测试公众号连接失败:', err);
          return of({ success: false, message: err instanceof Error ? err.message : '未知错误' });
        })
      );
  }

  /**
   * 测试小程序连接
   */
  testMiniProgramConnection(
    orgId: number,
    appid: string,
    secret: string
  ): Observable<{ success: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<{ success: boolean; message: string }>
      >(`${this.API_BASE}/wechat/test-mini-program`, { appid, secret }, { headers })
      .pipe(
        map((response) => response.data),
        timeout(10000),
        catchError((err) => {
          console.error('测试小程序连接失败:', err);
          return of({ success: false, message: err instanceof Error ? err.message : '未知错误' });
        })
      );
  }

  /**
   * 获取消息会话列表
   */
  getMessageSessions(orgId: number, status?: string): Observable<MessageSession[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.API_BASE}/wechat/org/${orgId}/sessions`;
    if (status) {
      url += `?status=${status}`;
    }

    return this.http.get<ApiResponse<MessageSession[]>>(url, { headers }).pipe(
      map((response) => response.data || []),
      timeout(5000),
      catchError((err) => {
        console.warn('获取会话列表失败，返回模拟数据:', err);
        return this.getMockSessions();
      })
    );
  }

  /**
   * 获取会话详情
   */
  getSessionDetail(orgId: number, sessionId: string): Observable<MessageSession> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        ApiResponse<MessageSession>
      >(`${this.API_BASE}/wechat/org/${orgId}/sessions/${sessionId}`, { headers })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.error('获取会话详情失败:', err);
          throw err;
        })
      );
  }

  /**
   * 发送消息
   */
  sendMessage(
    orgId: number,
    sessionId: string,
    content: { type: string; text?: string; media_url?: string }
  ): Observable<UnifiedMessage> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<
        ApiResponse<UnifiedMessage>
      >(`${this.API_BASE}/wechat/org/${orgId}/sessions/${sessionId}/message`, content, { headers })
      .pipe(
        map((response) => response.data),
        timeout(8000),
        catchError((err) => {
          console.error('发送消息失败:', err);
          throw err;
        })
      );
  }

  /**
   * 转接人工客服
   */
  transferToHuman(
    orgId: number,
    sessionId: string,
    agentId?: string
  ): Observable<{ success: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiResponse<{ success: boolean }>>(
        `${this.API_BASE}/wechat/org/${orgId}/sessions/${sessionId}/transfer`,
        { agent_id: agentId },
        {
          headers,
        }
      )
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.error('转接人工客服失败:', err);
          throw err;
        })
      );
  }

  /**
   * 获取客服状态列表
   */
  getAgentStatusList(orgId: number): Observable<AgentStatus[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<AgentStatus[]>>(`${this.API_BASE}/wechat/org/${orgId}/agents/status`, {
        headers,
      })
      .pipe(
        map((response) => response.data || []),
        timeout(5000),
        catchError((err) => {
          console.warn('获取客服状态失败，返回模拟数据:', err);
          return this.getMockAgentStatusList();
        })
      );
  }

  /**
   * 更新客服状态
   */
  updateAgentStatus(
    orgId: number,
    agentId: string,
    status: 'online' | 'offline' | 'busy' | 'away'
  ): Observable<{ success: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<
        ApiResponse<{ success: boolean }>
      >(`${this.API_BASE}/wechat/org/${orgId}/agents/${agentId}/status`, { status }, { headers })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.error('更新客服状态失败:', err);
          throw err;
        })
      );
  }

  /**
   * 获取聊天统计
   */
  getChatStatistics(orgId: number, startDate: string, endDate: string): Observable<ChatStatistics> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<ChatStatistics>>(`${this.API_BASE}/wechat/org/${orgId}/statistics`, {
        headers,
        params: { start_date: startDate, end_date: endDate },
      })
      .pipe(
        map((response) => response.data),
        timeout(5000),
        catchError((err) => {
          console.warn('获取统计数据失败，返回模拟数据:', err);
          return this.getMockStatistics();
        })
      );
  }

  // ==================== 模拟数据 ====================

  private getMockConfig(orgId: number): Observable<WechatConfig | null> {
    return of({
      id: 1,
      org_id: orgId,
      official_account_appid: 'wx1234567890abcdef',
      official_account_secret: 'mock_secret_here',
      official_account_token: 'mock_token',
      official_account_encoding_aes_key: 'mock_aes_key',
      official_account_verified: true,
      mini_program_appid: 'wx9876543210fedcba',
      mini_program_secret: 'mock_mp_secret',
      mini_program_appname: '测试小程序',
      wecom_corp_id: 'ww1234567890abcdef',
      wecom_agent_id: '1000001',
      wecom_secret: 'mock_wecom_secret',
      wecom_token: 'mock_wecom_token',
      wecom_encoding_aes_key: 'mock_wecom_aes',
      mch_id: '1234567890',
      api_key_v3: 'mock_api_key_v3',
      enable_auto_reply: true,
      enable_ai_assistant: true,
      enable_human_transfer: true,
      enable_message_queue: true,
      ai_model: 'ERNIE-Bot-4.0',
      ai_api_key: 'mock_ai_key',
      ai_confidence_threshold: 0.85,
      customer_service_hours: '09:00-18:00',
      max_queue_size: 50,
      notification_email: 'support@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  private getMockSessions(): Observable<MessageSession[]> {
    return of([
      {
        session_id: 'sess_001',
        customer_openid: 'oHkDp5r1234567890',
        customer_nickname: '张三',
        customer_avatar: 'https://example.com/avatar1.jpg',
        channel: 'wechat_mp',
        messages: [
          {
            id: 'msg_001',
            channel_id: 'wechat_mp',
            customer_id: 'oHkDp5r1234567890',
            customer_info: {
              nickname: '张三',
              avatar: 'https://example.com/avatar1.jpg',
              union_id: 'union_001',
              tags: ['潜在学员'],
              source: '公众号',
            },
            content: { type: 'text', text: '请问课程怎么收费？' },
            timestamp: Date.now() - 300000,
            status: 'replied',
          },
        ],
        start_time: Date.now() - 600000,
        last_message_time: Date.now() - 300000,
        status: 'active',
        assigned_agent: 'agent_001',
        waiting_duration: 0,
      },
      {
        session_id: 'sess_002',
        customer_openid: 'oHkDp5r0987654321',
        customer_nickname: '李四',
        customer_avatar: 'https://example.com/avatar2.jpg',
        channel: 'wechat_mini',
        messages: [],
        start_time: Date.now() - 120000,
        last_message_time: Date.now() - 120000,
        status: 'waiting',
        waiting_duration: 120,
      },
    ]);
  }

  private getMockAgentStatusList(): Observable<AgentStatus[]> {
    return of([
      {
        agent_id: 'agent_001',
        agent_name: '王老师',
        status: 'online',
        current_chats: 3,
        max_chats: 5,
        today_replies: 45,
        avg_response_time: 30,
        satisfaction_rate: 98,
      },
      {
        agent_id: 'agent_002',
        agent_name: '李老师',
        status: 'busy',
        current_chats: 5,
        max_chats: 5,
        today_replies: 38,
        avg_response_time: 45,
        satisfaction_rate: 96,
      },
      {
        agent_id: 'agent_003',
        agent_name: '张老师',
        status: 'offline',
        current_chats: 0,
        max_chats: 5,
        today_replies: 0,
        avg_response_time: 0,
        satisfaction_rate: 0,
      },
    ]);
  }

  private getMockStatistics(): Observable<ChatStatistics> {
    return of({
      total_sessions: 150,
      active_sessions: 12,
      total_messages: 1280,
      ai_replied_count: 856,
      human_replied_count: 424,
      avg_response_time: 35,
      satisfaction_rate: 96.5,
      missed_chats: 3,
    });
  }
}
