import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeatureModule {
  id: number;
  feature_key: string;
  display_name: string;
  description: string;
  category: string;
  icon: string;
  route_path: string;
  sort_order: number;
  is_enabled_by_default: boolean;
  applicable_org_types: string[];
  dependencies: string[];
  is_active: boolean;
}

export interface OrgFeatureFlag {
  id: number;
  org_id: number;
  feature_id: number;
  is_enabled: boolean;
  extra_config: Record<string, any>;
  operated_by: number | null;
  operated_by_name: string | null;
  created_at: string;
  updated_at: string;
  feature_key: string;
  display_name: string;
  category: string;
  icon: string;
  description: string;
  route_path: string;
  sort_order: number;
  dependencies: string[];
}

export interface FeatureConfigResponse {
  modules: FeatureModule[];
  flags: Record<string, boolean>;
  org_flags: OrgFeatureFlag[];
}

export interface FeatureChangeLogEntry {
  id: number;
  org_id: number;
  feature_id: number | null;
  feature_name: string;
  change_type: string;
  before_snapshot: Record<string, boolean>;
  after_snapshot: Record<string, boolean>;
  change_detail: string;
  operated_by: number | null;
  operated_by_name: string | null;
  created_at: string;
}

export interface ChangeHistoryResponse {
  success: boolean;
  data: {
    items: FeatureChangeLogEntry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeatureManagementService {
  private apiUrl = environment.apiUrl + '/api/v1/features';

  constructor(private http: HttpClient) {}

  /** 获取当前机构的功能配置 */
  getConfig(): Observable<ApiResponse<FeatureConfigResponse>> {
    return this.http.get<ApiResponse<FeatureConfigResponse>>(`${this.apiUrl}/config`);
  }

  /** 获取系统所有功能模块 */
  getModules(): Observable<FeatureModule[]> {
    return this.http.get<FeatureModule[]>(`${this.apiUrl}/modules`);
  }

  /** 切换单个功能启用/禁用 */
  toggleFeature(featureId: number, isEnabled: boolean): Observable<ApiResponse<FeatureConfigResponse>> {
    return this.http.post<ApiResponse<FeatureConfigResponse>>(`${this.apiUrl}/toggle`, {
      feature_id: featureId,
      is_enabled: isEnabled,
    });
  }

  /** 批量切换功能状态 */
  batchToggle(toggles: { feature_id: number; is_enabled: boolean }[], batchNote: string = ''): Observable<ApiResponse<FeatureConfigResponse>> {
    return this.http.post<ApiResponse<FeatureConfigResponse>>(`${this.apiUrl}/batch-toggle`, {
      toggles: toggles,
      batch_note: batchNote,
    });
  }

  /** 获取配置变更历史 */
  getChangeHistory(page: number = 1, pageSize: number = 20): Observable<ChangeHistoryResponse> {
    return this.http.get<ChangeHistoryResponse>(`${this.apiUrl}/history?page=${page}&page_size=${pageSize}`);
  }

  /** 回滚到指定历史版本 */
  rollback(logId: number): Observable<ApiResponse<FeatureConfigResponse>> {
    return this.http.post<ApiResponse<FeatureConfigResponse>>(`${this.apiUrl}/rollback/${logId}`, {});
  }

  /** 重置所有功能为默认状态 */
  resetToDefault(): Observable<ApiResponse<FeatureConfigResponse>> {
    return this.http.post<ApiResponse<FeatureConfigResponse>>(`${this.apiUrl}/reset`, {});
  }
}