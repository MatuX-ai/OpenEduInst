import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface BackupStatus {
  total_snapshots: number;
  latest_backup: string | null;
  next_scheduled: string | null;
  total_storage_bytes: number;
  backup_enabled: boolean;
}

export interface BackupSnapshot {
  snapshot_id: string;
  label: string | null;
  backup_type: 'daily_incremental' | 'weekly_full' | 'manual';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
  file_size_bytes: number;
  record_count: number;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export interface CreateBackupResult {
  message: string;
  snapshot_id: string;
  status: string;
}

export interface RestoreResult {
  message: string;
  operation_id: number;
  status: string;
  records_restored: number;
  safety_snapshot_id: string | null;
}

/**
 * 云端备份服务
 * 封装备份状态查询、快照列表、手动备份、一键回滚 API
 */
@Injectable({
  providedIn: 'root',
})
export class CloudBackupService {
  private base = `${environment.apiUrl}/api/v1/cloud/backup`;

  constructor(private http: HttpClient) {}

  /** 获取备份状态概览 */
  getStatus(): Observable<BackupStatus> {
    return this.http.get<BackupStatus>(`${this.base}/status`);
  }

  /** 获取备份快照列表 */
  listSnapshots(limit: number = 50): Observable<BackupSnapshot[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<BackupSnapshot[]>(`${this.base}/list`, { params });
  }

  /** 手动创建备份 */
  createBackup(label?: string): Observable<CreateBackupResult> {
    let params = new HttpParams();
    if (label) {
      params = params.set('label', label);
    }
    return this.http.post<CreateBackupResult>(`${this.base}/create`, null, { params });
  }

  /** 从指定快照一键回滚 */
  restoreSnapshot(snapshotId: string): Observable<RestoreResult> {
    const params = new HttpParams().set('snapshot_id', snapshotId);
    return this.http.post<RestoreResult>(`${this.base}/restore`, null, { params });
  }
}
