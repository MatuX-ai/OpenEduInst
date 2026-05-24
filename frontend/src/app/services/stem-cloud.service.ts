import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HardwareDevice {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged';
  location: string;
  lastUsed: string;
  condition: number;
}

export interface TokenTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

export interface STEMProject {
  id: string;
  name: string;
  category: string;
  status: 'planning' | 'in_progress' | 'completed' | 'showcase';
  progress: number;
  students: number;
  mentor: string;
}

export interface SpaceRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
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
}
