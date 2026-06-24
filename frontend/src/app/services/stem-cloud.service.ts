import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HardwareDevice {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged';
  location: string;
  lastUsed: string;
  condition: number;
  assignedTo?: string;
}

export interface DeviceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  available: number;
  color: string;
}

export interface TokenTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  date: string;
  service?: string;
  balanceAfter: number;
}

export interface TokenService {
  id: string;
  name: string;
  description: string;
  icon: string;
  costPerUse: number;
  totalUses: number;
  color: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

export interface STEMProject {
  id: string;
  name: string;
  category: string;
  status: 'planning' | 'in_progress' | 'completed' | 'showcase';
  progress: number;
  students: number;
  mentor: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  showcase?: boolean;
}

export interface ProjectCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  available?: number;
  color: string;
}

export interface SpaceRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentActivity?: string;
  nextBooking?: string;
  equipment?: string[];
  image?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  user: string;
  purpose: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  participants: number;
}

export interface SpaceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  available: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class StemCloudService {
  private baseUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  // --- Hardware Management ---
  getDevices(): Observable<HardwareDevice[]> {
    return this.http.get<HardwareDevice[]>(`${this.baseUrl}/hardware/devices`);
  }

  getDeviceStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/hardware/stats`);
  }

  // --- Token Management ---
  getTokenBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(`${this.baseUrl}/token/balance`);
  }

  getTokenTransactions(): Observable<TokenTransaction[]> {
    return this.http.get<TokenTransaction[]>(`${this.baseUrl}/token/transactions`);
  }

  // --- Project Management ---
  getProjects(): Observable<STEMProject[]> {
    return this.http.get<STEMProject[]>(`${this.baseUrl}/stem/projects`);
  }

  // --- Space Scheduling ---
  getSpaces(): Observable<SpaceRoom[]> {
    return this.http.get<SpaceRoom[]>(`${this.baseUrl}/space/rooms`);
  }

  // ========== Club Management ==========
  getClubs(params?: { category?: string; status?: string; search?: string }): Observable<any[]> {
    const queryParams: any = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.status) queryParams.status = params.status;
    if (params?.search) queryParams.search = params.search;
    return this.http.get<any[]>(`${this.baseUrl}/stem/clubs/`, { params: queryParams });
  }

  getClub(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/stem/clubs/${id}`);
  }

  createClub(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/clubs/`, data);
  }

  updateClub(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/stem/clubs/${id}`, data);
  }

  deleteClub(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/stem/clubs/${id}`);
  }

  getClubMembers(clubId: number, params?: { role?: string; status?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/clubs/${clubId}/members`, { params: params as any });
  }

  addClubMember(clubId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/clubs/${clubId}/members`, data);
  }

  removeClubMember(clubId: number, memberId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/stem/clubs/${clubId}/members/${memberId}`);
  }

  getClubActivities(clubId: number, params?: { year?: number; month?: number }): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/clubs/${clubId}/activities`, { params: params as any });
  }

  createClubActivity(clubId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/clubs/${clubId}/activities`, data);
  }

  getClubRecruitments(clubId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/clubs/${clubId}/recruitments`);
  }

  createRecruitment(clubId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/clubs/${clubId}/recruitments`, data);
  }

  getApplications(clubId: number, recruitmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/clubs/${clubId}/recruitments/${recruitmentId}/applications`);
  }

  reviewApplication(clubId: number, recruitmentId: number, applicationId: number, data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/stem/clubs/${clubId}/recruitments/${recruitmentId}/applications/${applicationId}/review`,
      data
    );
  }

  getClubStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stem/clubs/stats/overview`);
  }

  // ========== Consumable Management ==========
  getConsumables(params?: { category?: string; low_stock_only?: boolean; search?: string }): Observable<any[]> {
    const queryParams: any = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.low_stock_only) queryParams.low_stock_only = true;
    if (params?.search) queryParams.search = params.search;
    return this.http.get<any[]>(`${this.baseUrl}/stem/consumables/`, { params: queryParams });
  }

  createConsumable(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/consumables/`, data);
  }

  updateConsumable(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/stem/consumables/${id}`, data);
  }

  useConsumable(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/consumables/use`, data);
  }

  getConsumableStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stem/consumables/stats/overview`);
  }

  getLowStockItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/consumables/low-stock`);
  }

  createPurchaseRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stem/consumables/purchase-requests`, data);
  }

  getPurchaseRequests(params?: { status?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/consumables/purchase-requests`, { params: params as any });
  }

  reviewPurchaseRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/stem/consumables/purchase-requests/${id}/review`, data);
  }

  // ========== Dashboard ==========
  getDashboardOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stem/dashboard/overview`);
  }

  getClubCategoryDistribution(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stem/dashboard/club-category-distribution`);
  }

  getDeviceUsageStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stem/dashboard/device-usage-stats`);
  }
}
