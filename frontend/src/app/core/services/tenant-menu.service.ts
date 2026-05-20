import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenantMenuService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  getMenu(orgId: number): Observable<{ menu: MenuItem[] }> {
    return this.http.get<{ menu: MenuItem[] }>(`${this.apiUrl}/tenant/menu/${orgId}`);
  }

  getConfig(orgId: number): Observable<{ config: any; features: Record<string, boolean> }> {
    return this.http.get<{ config: any; features: Record<string, boolean> }>(`${this.apiUrl}/tenant/config/${orgId}`);
  }
}
