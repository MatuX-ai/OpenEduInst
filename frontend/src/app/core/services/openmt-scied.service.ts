import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  subject: string;
  duration_minutes: number;
  difficulty_level: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface Courseware {
  id: string;
  title: string;
  description: string;
  type: string;
  grade_level: string;
  subject: string;
  difficulty_level: string;
  file_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  knowledge_points: Array<{ id: string; name: string }>;
  created_at?: string;
}

export interface HardwareProject {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  category: string;
  subject: string;
  estimated_time_hours: number;
  thumbnail_url: string;
  hardware_required: Array<{ id: string; name: string; quantity: number }>;
  knowledge_points: Array<{ id: string; name: string }>;
  created_at?: string;
}

export interface OpenSciEdStats {
  tutorials: number;
  coursewares: number;
  hardware_projects: number;
}

export interface OpenSciEdConfig {
  enabled: boolean;
  opensciedu_api_enabled?: boolean;
  sync_status: string;
  last_sync: string | null;
  api_key_masked: string | null;
  platform_fallback: boolean;
  upstream: string;
}

export interface OpenSciEdHealth {
  connected: boolean;
  upstream: string;
  latency_ms: number;
}

export interface SciEdRecommendation {
  resource_id?: string;
  resource_type?: string;
  title?: string;
  subject?: string;
  reason?: string;
  score?: number;
}

export interface OpenSciEdSyncResult {
  org_id: number;
  status: string;
  stats?: OpenSciEdStats;
  error?: string;
  reason?: string;
}

export interface UnifiedSearchItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  source: string;
  subject?: string;
  grade_level?: string;
  url?: string;
  score?: number;
  local_type?: string;
  format?: string;
}

export interface UnifiedSearchResult {
  query: string;
  items: UnifiedSearchItem[];
  total: number;
  sources: { local: number; scied: number };
}

export interface TopicStudioLinks {
  enabled: boolean;
  web_base: string;
  list_url: string;
  new_draft_url: string;
  draft_url?: string | null;
  org_id: number;
  note: string;
}

/**
 * OpenMTSciEd 资源服务（经 EduInst 后端代理，禁止直连上游）
 * @see docs/OPENMTSCIED_INTEGRATION_PRD.md
 */
@Injectable({
  providedIn: 'root',
})
export class OpenMtSciEdService {
  private baseUrl = `${environment.apiUrl}/api/v1/opensciedu`;

  constructor(private http: HttpClient) {}

  getHealth(): Observable<OpenSciEdHealth> {
    return this.http.get<OpenSciEdHealth>(`${this.baseUrl}/health`);
  }

  getConfig(): Observable<OpenSciEdConfig> {
    return this.http.get<OpenSciEdConfig>(`${this.baseUrl}/config`);
  }

  getStats(): Observable<OpenSciEdStats> {
    return this.http.get<OpenSciEdStats>(`${this.baseUrl}/stats`);
  }

  getTutorials(
    page = 1,
    size = 20,
    subject?: string,
    gradeLevel?: string
  ): Observable<PaginatedResponse<Tutorial>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (subject) params = params.set('subject', subject);
    if (gradeLevel) params = params.set('grade_level', gradeLevel);
    return this.http.get<PaginatedResponse<Tutorial>>(`${this.baseUrl}/tutorials`, { params });
  }

  getTutorialById(id: string): Observable<Tutorial> {
    return this.http.get<Tutorial>(`${this.baseUrl}/tutorials/${id}`);
  }

  getCoursewares(
    page = 1,
    size = 20,
    subject?: string,
    gradeLevel?: string,
    type?: string
  ): Observable<PaginatedResponse<Courseware>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (subject) params = params.set('subject', subject);
    if (gradeLevel) params = params.set('grade_level', gradeLevel);
    if (type) params = params.set('type', type);
    return this.http.get<PaginatedResponse<Courseware>>(`${this.baseUrl}/coursewares`, { params });
  }

  getHardwareProjects(
    page = 1,
    size = 20,
    difficulty?: string,
    category?: string,
    subject?: string
  ): Observable<PaginatedResponse<HardwareProject>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (difficulty) params = params.set('difficulty', difficulty);
    if (category) params = params.set('category', category);
    if (subject) params = params.set('subject', subject);
    return this.http.get<PaginatedResponse<HardwareProject>>(`${this.baseUrl}/hardware-projects`, {
      params,
    });
  }

  updateConfig(body: {
    opensciedu_api_enabled?: boolean;
    opensciedu_api_key?: string;
  }): Observable<{ message: string; enabled: boolean }> {
    return this.http.put<{ message: string; enabled: boolean }>(`${this.baseUrl}/config`, body);
  }

  triggerSync(): Observable<OpenSciEdSyncResult> {
    return this.http.post<OpenSciEdSyncResult>(`${this.baseUrl}/sync`, {});
  }

  getRecommendations(limit = 10, subject?: string): Observable<SciEdRecommendation[] | Record<string, unknown>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (subject) params = params.set('subject', subject);
    return this.http.get<SciEdRecommendation[] | Record<string, unknown>>(
      `${this.baseUrl}/recommendations`,
      { params }
    );
  }

  searchUnified(
    q: string,
    type = 'all',
    limit = 20,
    includeLocal = true,
    includeScied = true
  ): Observable<UnifiedSearchResult> {
    let params = new HttpParams()
      .set('q', q)
      .set('type', type)
      .set('limit', limit.toString())
      .set('include_local', String(includeLocal))
      .set('include_scied', String(includeScied));
    return this.http.get<UnifiedSearchResult>(`${this.baseUrl}/search`, { params });
  }

  getTopicStudioLinks(draftId?: string): Observable<TopicStudioLinks> {
    let params = new HttpParams();
    if (draftId) params = params.set('draft_id', draftId);
    return this.http.get<TopicStudioLinks>(`${this.baseUrl}/topic-studio/links`, { params });
  }
}
