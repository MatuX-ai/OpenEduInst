import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  system?: string;
}

export interface ChatReply {
  reply: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  token_consumed: number;
}

export interface AiStatus {
  provider: string;
  model: string;
  base_url: string;
  is_real_llm: boolean;
  fallback_enabled: boolean;
  timeout: number;
  max_tokens: number;
}

export interface AiTokenBalance {
  balance: number;
  total_consumed: number;
  monthly_quota: number;
  note?: string;
}

/**
 * AI 助教服务（阶段三 3.6）
 *
 * 消费后端 `/api/v1/ai/*` 端点：
 * - /chat       通用对话（流式返回）
 * - /status     LLM 服务状态
 * - /token-balance  Token 余量
 */
@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly base = `${environment.apiUrl}/api/v1/ai`;

  constructor(private http: HttpClient) {}

  chat(message: string, history: ChatMessage[] = [], system?: string): Observable<ChatReply> {
    const body: ChatRequest = { message, history };
    if (system) body.system = system;
    return this.http.post<ChatReply>(`${this.base}/chat`, body);
  }

  status(): Observable<AiStatus> {
    return this.http.get<AiStatus>(`${this.base}/status`);
  }

  tokenBalance(): Observable<AiTokenBalance> {
    return this.http.get<AiTokenBalance>(`${this.base}/token-balance`);
  }
}
