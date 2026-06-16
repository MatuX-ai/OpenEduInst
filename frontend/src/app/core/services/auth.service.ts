import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  user_id: number;
  username: string;
  email: string;
  full_name: string | null;
  org_id: number | null;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/api/v1';
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // 初始化时检查是否有保存的用户信息
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUserInfo));
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  }

  /**
   * 用户登录
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const body = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    });

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/token`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).pipe(
      tap(response => {
        // 保存 token
        localStorage.setItem('access_token', response.access_token);
        // 获取用户信息
        this.loadUserInfo().subscribe();
      })
    );
  }

  /**
   * 获取当前用户信息
   */
  loadUserInfo(): Observable<UserInfo> {
    const token = localStorage.getItem('access_token');
    return this.http.get<UserInfo>(`${this.apiUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).pipe(
      tap(userInfo => {
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        this.currentUserSubject.next(userInfo);
      })
    );
  }

  /**
   * 登出
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    this.currentUserSubject.next(null);
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * 获取当前 token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }
}
