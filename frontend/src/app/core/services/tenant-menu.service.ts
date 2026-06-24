import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

/** 教师角色可见的精简菜单 */
export const TEACHER_PORTAL_MENU: MenuItem[] = [
  { id: 'teacher-dashboard', title: '教学工作台', icon: 'co_present', path: 'teacher/dashboard' },
  { id: 'teacher-resources', title: 'STEM 资源库', icon: 'library_books', path: 'resources' },
  { id: 'teacher-knowledge-graph', title: '知识图谱', icon: 'hub', path: 'knowledge-graph' },
  { id: 'teacher-topic-studio', title: '课题工作室', icon: 'lightbulb', path: 'topic-studio' },
  { id: 'teacher-schedule', title: '我的课表', icon: 'calendar_month', path: 'schedule' },
  { id: 'teacher-ai', title: 'AI 助教', icon: 'psychology', path: 'ai-assistant' },
  { id: 'teacher-stem-dashboard', title: 'STEM 看板', icon: 'dashboard', path: 'stem/dashboard' },
  { id: 'teacher-stem-clubs', title: 'STEM 社团', icon: 'group_work', path: 'stem/clubs' },
];

@Injectable({
  providedIn: 'root',
})
export class TenantMenuService {
  private apiUrl = environment.apiUrl + '/api/v1';

  // Mock 菜单数据
  private mockMenu: MenuItem[] = [
    { id: 'dashboard', title: '经营仪表盘', icon: 'space_dashboard', path: 'dashboard' },
    { id: 'teacher-workbench', title: '教学工作台', icon: 'co_present', path: 'teacher/dashboard' },
    {
      id: 'academic', title: '教务中心', icon: 'school', children: [
        { id: 'students', title: '学员管理', icon: 'people', path: 'students' },
        { id: 'teachers', title: '教师管理', icon: 'person', path: 'teachers' },
        { id: 'schedule', title: '排课管理', icon: 'calendar_month', path: 'schedule' },
        { id: 'resources', title: '教学资源', icon: 'library_books', path: 'resources' },
        { id: 'knowledge-graph', title: '知识图谱', icon: 'hub', path: 'knowledge-graph' },
        { id: 'topic-studio', title: '课题工作室', icon: 'lightbulb', path: 'topic-studio' }
      ]
    },
    {
      id: 'marketing', title: '招生与营销', icon: 'campaign', children: [
        { id: 'marketing-center', title: '营销中心', icon: 'trending_up', path: 'marketing' },
        { id: 'leads', title: '招生线索', icon: 'person_search', path: 'leads' }
      ]
    },
    { id: 'classrooms', title: '教室管理', icon: 'meeting_room', path: 'classrooms' },
    { id: 'equipment', title: '设备与器材管理', icon: 'devices', path: 'devices' },
    { id: 'competitions', title: '竞赛认证', icon: 'emoji_events', path: 'competitions' },
    { id: 'ai-assistant', title: 'AI 助教 · 小启', icon: 'psychology', path: 'ai-assistant' },
    {
      id: 'stem', title: 'STEM 教育管理', icon: 'stadia_controller', children: [
        { id: 'stem-dashboard', title: 'STEM 看板', icon: 'dashboard', path: 'stem/dashboard' },
        { id: 'stem-clubs', title: '社团管理', icon: 'group_work', path: 'stem/clubs' },
        { id: 'stem-consumables', title: '耗材管理', icon: 'inventory_2', path: 'stem/consumables' },
      ]
    },
    {
      id: 'bureau', title: '教育局管理平台', icon: 'account_balance', children: [
        { id: 'bureau-dashboard', title: '数据总览', icon: 'dashboard', path: 'bureau' },
        { id: 'bureau-schools', title: '学校监管', icon: 'school', path: 'bureau' },
        { id: 'bureau-equipment', title: '设备调配', icon: 'devices', path: 'bureau' },
        { id: 'bureau-training', title: '师资培训', icon: 'school', path: 'bureau' },
        { id: 'bureau-competitions', title: '竞赛管理', icon: 'emoji_events', path: 'bureau' },
        { id: 'bureau-budget', title: '经费管理', icon: 'account_balance_wallet', path: 'bureau' },
        { id: 'bureau-curriculum', title: '课程资源', icon: 'library_books', path: 'bureau' },
        { id: 'bureau-reports', title: '数据报表', icon: 'assessment', path: 'bureau' },
      ]
    },
    {
      id: 'finance', title: '财务与资产', icon: 'account_balance_wallet', children: [
        { id: 'finance-dashboard', title: '财务管理', icon: 'payments', path: 'finance' },
        { id: 'licenses', title: '许可证/Token', icon: 'vpn_key', path: 'tokens' }
      ]
    },
    { id: 'multi-campus', title: '多校区管理', icon: 'business', path: 'multi-campus' },
    {
      id: 'system', title: '系统设置', icon: 'settings', children: [
        { id: 'users', title: '团队与权限', icon: 'group', path: 'users' },
        { id: 'notifications', title: '消息中心', icon: 'notifications', path: 'notifications' },
        { id: 'backup-management', title: '云端备份', icon: 'backup', path: 'backup-management' },
        { id: 'parent-portal', title: '家长中心', icon: 'family_restroom', path: 'parent-portal' },
        { id: 'settings', title: '基础配置', icon: 'tune', path: 'settings' }
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  getMenu(orgId: number): Observable<{ menu: MenuItem[] }> {
    if (environment.useMockData) {
      return of({ menu: this.mockMenu });
    }
    return this.http.get<{ menu: MenuItem[] }>(`${this.apiUrl}/tenant/menu/${orgId}`);
  }

  /** 按用户角色过滤菜单（纯教师仅见教学工作台相关项） */
  filterMenuForRole(menu: MenuItem[], role: string): MenuItem[] {
    if (role === 'teacher') {
      return [...TEACHER_PORTAL_MENU];
    }
    return menu;
  }

  getConfig(orgId: number): Observable<{ config: any; features: Record<string, boolean> }> {
    if (environment.useMockData) {
      return of({ config: {}, features: {} });
    }
    return this.http.get<{ config: any; features: Record<string, boolean> }>(`${this.apiUrl}/tenant/config/${orgId}`);
  }
}
