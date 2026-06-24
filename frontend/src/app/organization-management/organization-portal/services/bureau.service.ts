import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiUrl}/api/v1/bureau`;

export interface BureauDashboardStats {
  totalSchools: number;
  totalStemStudents: number;
  totalStemTeachers: number;
  stemCoverageRate: number;
  crossSchoolSharingCount: number;
  annualAwardCount: number;
  weakSchoolCount: number;
  trends: Record<string, string>;
}

export interface CoverageTrend {
  month: string;
  rate: number;
  target: number;
}

export interface SchoolDistribution {
  name: string;
  value: number;
}

export interface WeakAlert {
  id: number;
  orgId: number;
  name: string;
  orgType: string;
  stemScore: number;
  equipmentStatus: string;
  suggestion: string;
}

export interface BureauSchool {
  id: number;
  orgId: number;
  name: string;
  orgType: string;
  studentCount: number;
  stemStudentCount: number;
  stemTeacherCount: number;
  stemScore: number;
  rating: string;
  equipmentStatus: string;
  districtArea: string;
  description: string;
}

export interface EquipmentPoolItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  totalQuantity: number;
  allocatedQuantity: number;
  inStockQuantity: number;
  inTransitQuantity: number;
  minStock: number;
  supplier: string;
  isLowStock: boolean;
}

export interface PendingRequest {
  id: number;
  schoolName: string;
  equipmentName: string;
  quantity: number;
  reason: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface CrossSchoolShare {
  id: number;
  fromSchool: string;
  toSchool: string;
  equipmentName: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate: string;
  reason: string;
  status: string;
}

export interface TrainingSession {
  id: number;
  title: string;
  trainer: string;
  trainerOrg: string;
  date: string;
  type: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  coverageArea: string;
  status: string;
  description: string;
}

export interface DistrictCoverage {
  area: string;
  totalSchools: number;
  trainedSchools: number;
  coverageRate: number;
  isMet: boolean;
}

export interface BureauCompetition {
  id: number;
  name: string;
  level: string;
  organizer: string;
  competitionDate: string;
  registrationDeadline: string;
  location: string;
  status: string;
  description: string;
}

export interface CompetitionAward {
  id: number;
  competitionName: string;
  awardName: string;
  awardLevel: string;
  schoolName: string;
  awardDate: string;
}

export interface BudgetOverview {
  fiscalYear: number;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  executionRate: number;
  status: string;
  categoryBreakdown: { category: string; amount: number }[];
  recentExpenses: {
    id: number;
    category: string;
    itemName: string;
    amount: number;
    schoolName: string;
    expenseDate: string;
    status: string;
  }[];
}

export interface CurriculumOverview {
  totalResources: number;
  publishedResources: number;
  contributingSchools: number;
  categoryBreakdown: { category: string; count: number }[];
}

export interface CurriculumResource {
  id: number;
  title: string;
  category: string;
  gradeRange: string;
  author: string;
  schoolName: string;
  fileType: string;
  description: string;
  downloadCount: number;
  rating: number;
  status: string;
  createdAt: string;
}

export interface SchoolRanking {
  rank: number;
  schoolName: string;
  orgType: string;
  stemScore: number;
  rating: string;
  equipmentStatus: string;
}

@Injectable({ providedIn: 'root' })
export class BureauService {
  constructor(private http: HttpClient) {}

  // === Dashboard ===
  getDashboardStats(): Observable<any> {
    return this.http.get(`${API_BASE}/dashboard/stats`);
  }
  getCoverageTrend(months: number = 6): Observable<any> {
    return this.http.get(`${API_BASE}/dashboard/coverage-trend?months=${months}`);
  }
  getSchoolDistribution(): Observable<any> {
    return this.http.get(`${API_BASE}/dashboard/school-distribution`);
  }
  getWeakAlerts(): Observable<any> {
    return this.http.get(`${API_BASE}/dashboard/weak-alerts`);
  }
  getQuickLinks(): Observable<any> {
    return this.http.get(`${API_BASE}/dashboard/quick-links`);
  }

  // === Schools ===
  getSchools(params?: { rating?: string; sortBy?: string; order?: string; page?: number; pageSize?: number }): Observable<any> {
    const p = new URLSearchParams();
    if (params?.rating) p.set('rating', params.rating);
    if (params?.sortBy) p.set('sort_by', params.sortBy);
    if (params?.order) p.set('order', params.order);
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('page_size', String(params.pageSize));
    return this.http.get(`${API_BASE}/schools?${p}`);
  }
  getSchoolDetail(schoolId: number): Observable<any> {
    return this.http.get(`${API_BASE}/schools/${schoolId}`);
  }
  evaluateSchool(schoolId: number, data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.put(`${API_BASE}/schools/${schoolId}/evaluate?${p}`, {});
  }

  // === Equipment ===
  getEquipmentPool(): Observable<any> {
    return this.http.get(`${API_BASE}/equipment-pool`);
  }
  addEquipmentItem(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/equipment-pool/items?${p}`, {});
  }
  getPendingRequests(page: number = 1, pageSize: number = 20): Observable<any> {
    return this.http.get(`${API_BASE}/equipment-requests/pending?page=${page}&page_size=${pageSize}`);
  }
  approveRequest(requestId: number, approved: boolean, comment: string = ''): Observable<any> {
    return this.http.put(`${API_BASE}/equipment-requests/${requestId}/approve?approved=${approved}&comment=${encodeURIComponent(comment)}`, {});
  }
  getCrossSchoolShares(page: number = 1, pageSize: number = 20): Observable<any> {
    return this.http.get(`${API_BASE}/cross-school-shares?page=${page}&page_size=${pageSize}`);
  }

  // === Training ===
  getTrainingOverview(): Observable<any> {
    return this.http.get(`${API_BASE}/training/overview`);
  }
  getTrainingSessions(params?: { status?: string; page?: number; pageSize?: number }): Observable<any> {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('page_size', String(params.pageSize));
    return this.http.get(`${API_BASE}/training/sessions?${p}`);
  }
  createTrainingSession(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/training/sessions?${p}`, {});
  }
  getDistrictCoverage(): Observable<any> {
    return this.http.get(`${API_BASE}/training/district-coverage`);
  }

  // === Competitions ===
  getCompetitions(params?: { level?: string; status?: string; page?: number; pageSize?: number }): Observable<any> {
    const p = new URLSearchParams();
    if (params?.level) p.set('level', params.level);
    if (params?.status) p.set('status', params.status);
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('page_size', String(params.pageSize));
    return this.http.get(`${API_BASE}/competitions?${p}`);
  }
  createCompetition(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/competitions?${p}`, {});
  }
  getCompetitionStats(): Observable<any> {
    return this.http.get(`${API_BASE}/competitions/stats`);
  }
  addCompetitionResult(competitionId: number, data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/competitions/${competitionId}/results?${p}`, {});
  }

  // === Budget ===
  getBudgetOverview(fiscalYear?: number): Observable<any> {
    const year = fiscalYear || new Date().getFullYear();
    return this.http.get(`${API_BASE}/budget/overview?fiscal_year=${year}`);
  }
  createBudgetPlan(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/budget/plans?${p}`, {});
  }
  createBudgetExpense(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/budget/expenses?${p}`, {});
  }

  // === Curriculum ===
  getCurriculumOverview(): Observable<any> {
    return this.http.get(`${API_BASE}/curriculum/overview`);
  }
  getCurriculumResources(params?: { category?: string; status?: string; page?: number; pageSize?: number }): Observable<any> {
    const p = new URLSearchParams();
    if (params?.category) p.set('category', params.category);
    if (params?.status) p.set('status', params.status);
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('page_size', String(params.pageSize));
    return this.http.get(`${API_BASE}/curriculum/resources?${p}`);
  }
  uploadCurriculumResource(data: any): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => p.set(k, String(v)));
    return this.http.post(`${API_BASE}/curriculum/resources?${p}`, {});
  }
  approveResource(resourceId: number, approved: boolean): Observable<any> {
    return this.http.put(`${API_BASE}/curriculum/resources/${resourceId}/approve?approved=${approved}`, {});
  }

  // === Reports ===
  getCoverageReport(): Observable<any> {
    return this.http.get(`${API_BASE}/reports/coverage`);
  }
  getSchoolRankingReport(): Observable<any> {
    return this.http.get(`${API_BASE}/reports/school-ranking`);
  }

  // === Verify ===
  verifyBureauAccess(): Observable<any> {
    return this.http.get(`${API_BASE}/verify`);
  }
}