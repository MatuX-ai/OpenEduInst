import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/v1/vocational`;

// ==================== Interfaces ====================

export interface VocEquipment {
  id: number;
  org_id: number;
  name: string;
  model: string;
  serial_number?: string;
  category: string;
  brand?: string;
  description?: string;
  location_building?: string;
  location_floor?: string;
  location_room?: string;
  location_station?: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier?: string;
  warranty_expire?: string;
  safety_level: string;
  status: string;
  qr_code_url?: string;
  total_borrow_count: number;
  total_usage_hours: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  is_active: boolean;
  created_at?: string;
}

export interface VocEquipmentCreate {
  name: string;
  model: string;
  serial_number?: string;
  category: string;
  brand?: string;
  description?: string;
  location_building?: string;
  location_floor?: string;
  location_room?: string;
  location_station?: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier?: string;
  warranty_expire?: string;
  safety_level?: string;
  specifications?: any;
  accessories?: any[];
}

export interface VocBorrowRecord {
  id: number;
  equipment_id: number;
  org_id: number;
  borrower_id: number;
  borrower_name?: string;
  borrower_type?: string;
  borrow_date?: string;
  expected_return_date?: string;
  actual_return_date?: string;
  purpose?: string;
  purpose_type?: string;
  status: string;
  approver_id?: number;
  approver_name?: string;
  is_damaged: boolean;
  damage_description?: string;
}

export interface VocFaultReport {
  id: number;
  equipment_id: number;
  org_id: number;
  reporter_id: number;
  reporter_name?: string;
  fault_type?: string;
  description?: string;
  photo_urls?: string[];
  status: string;
  assigned_to?: string;
  resolution?: string;
  created_at?: string;
}

export interface VocDashboardStats {
  total_equipment: number;
  equipment_in_use: number;
  equipment_available: number;
  equipment_maintenance: number;
  equipment_usage_rate: string;
  equipment_idle_count: number;
  active_borrows: number;
  overdue_borrows: number;
  total_faults_pending: number;
  safety_days: number;
}

// ==================== Phase 2: Safety & Academic Interfaces ====================

export interface VocSafetyCertification {
  id: number;
  org_id: number;
  user_id: number;
  user_name?: string;
  safety_level: string;
  exam_score?: number;
  exam_date?: string;
  expire_date?: string;
  status: string;
  created_at?: string;
}

export interface VocSafetyCertCreate {
  user_id: number;
  user_name: string;
  safety_level: string;
  exam_score?: number;
  expire_date?: string;
}

export interface VocSafetyChecklist {
  id: number;
  org_id: number;
  location_room: string;
  checker_id: number;
  checker_name?: string;
  items: any;
  passed: boolean;
  abnormality?: string;
  check_date?: string;
}

export interface VocIncidentReport {
  id: number;
  org_id: number;
  incident_type: string;
  location_room?: string;
  description?: string;
  severity: string;
  reporter_id: number;
  reporter_name?: string;
  status: string;
  incident_date?: string;
}

export interface VocSafetyStats {
  total_certifications: number;
  active_certifications: number;
  pending_incidents: number;
  checklists_today: number;
}

export interface VocCourse {
  id: number;
  org_id: number;
  name: string;
  major: string;
  grade?: string;
  semester?: string;
  total_hours: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface VocCourseCreate {
  name: string;
  major: string;
  grade?: string;
  semester?: string;
  total_hours: number;
  description?: string;
}

export interface VocTrainingRoom {
  id: number;
  org_id: number;
  name: string;
  building?: string;
  floor?: string;
  capacity?: number;
  equipment_list?: any;
  room_type?: string;
  is_active: boolean;
}

export interface VocTrainingSchedule {
  id: number;
  org_id: number;
  course_id: number;
  room_id: number;
  teacher_name?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  week_list?: string;
  semester?: string;
  status: string;
}

export interface VocRoomUtilization {
  room_id: number;
  room_name: string;
  total_slots: number;
  used_slots: number;
  utilization_rate: string;
}

// ==================== Phase 3: Cooperation & Competition Interfaces ====================

export interface VocEnterprise {
  id: number;
  org_id: number;
  name: string;
  industry?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  description?: string;
  cooperation_years?: number;
  is_active: boolean;
  created_at?: string;
}

export interface VocEnterpriseCreate {
  name: string;
  industry?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  description?: string;
  cooperation_years?: number;
}

export interface VocEnterpriseDemand {
  id: number;
  enterprise_id: number;
  demand_type: string;
  title: string;
  description?: string;
  status: string;
  created_at?: string;
}

export interface VocCooperationProject {
  id: number;
  org_id: number;
  enterprise_id: number;
  name: string;
  description?: string;
  tech_field?: string;
  stage: string;
  progress: number;
  school_supervisor?: string;
  enterprise_supervisor?: string;
  start_date?: string;
  expected_end?: string;
  total_funding: number;
  status: string;
  created_at?: string;
}

export interface VocCoopProjectCreate {
  enterprise_id: number;
  name: string;
  description?: string;
  tech_field?: string;
  school_supervisor?: string;
  enterprise_supervisor?: string;
  start_date?: string;
  expected_end?: string;
  total_funding?: number;
}

export interface VocCompetition {
  id: number;
  org_id: number;
  name: string;
  level: string;
  type?: string;
  competition_date?: string;
  registration_deadline?: string;
  description?: string;
  organizer?: string;
  location?: string;
  status: string;
  created_at?: string;
}

export interface VocCompetitionCreate {
  name: string;
  level: string;
  type?: string;
  competition_date?: string;
  registration_deadline?: string;
  description?: string;
  organizer?: string;
  location?: string;
}

export interface VocCompetitionRegistration {
  id: number;
  competition_id: number;
  student_id: number;
  student_name: string;
  teacher_name?: string;
  score?: number;
  award_level?: string;
  award_cert_url?: string;
  created_at?: string;
}

export interface VocInternshipRecord {
  id: number;
  org_id: number;
  student_id: number;
  student_name?: string;
  enterprise_id: number;
  position_name?: string;
  start_date?: string;
  end_date?: string;
  mentor_name?: string;
  monthly_report?: string;
  evaluation?: string;
  status: string;
}

export interface VocInternshipCreate {
  student_id: number;
  student_name: string;
  enterprise_id: number;
  position_name?: string;
  start_date?: string;
  end_date?: string;
  mentor_name?: string;
}

export interface VocEmploymentRecord {
  id: number;
  org_id: number;
  student_id: number;
  student_name?: string;
  enterprise_id: number;
  position_name?: string;
  salary?: number;
  location?: string;
  contract_type?: string;
  entry_date?: string;
}

export interface VocEmploymentCreate {
  student_id: number;
  student_name: string;
  enterprise_id: number;
  position_name?: string;
  salary?: number;
  location?: string;
  contract_type?: string;
  entry_date?: string;
}

export interface VocIncubatorProject {
  id: number;
  org_id: number;
  project_name: string;
  category: string;
  description?: string;
  leader_id: number;
  leader_name?: string;
  mentor_name?: string;
  stage: string;
  progress: number;
  total_funding: number;
  patent_applied: boolean;
  status: string;
  created_at?: string;
}

export interface VocIncubatorCreate {
  project_name: string;
  category: string;
  description?: string;
  leader_id: number;
  leader_name: string;
  mentor_name?: string;
  total_funding?: number;
}

export interface VocCooperationStats {
  total_enterprises: number;
  active_projects: number;
  total_internships: number;
  employment_rate: string;
  incubator_projects: number;
}

// ==================== Phase 4: Skill Assessment Interfaces ====================

export interface VocSkillStandard {
  id: number;
  org_id: number;
  skill_name: string;
  major: string;
  skill_level: string;
  description?: string;
  assessment_criteria?: string;
  is_active: boolean;
}

export interface VocSkillStandardCreate {
  skill_name: string;
  major: string;
  skill_level: string;
  description?: string;
  assessment_criteria?: string;
}

export interface VocSkillAssessment {
  id: number;
  org_id: number;
  student_id: number;
  student_name?: string;
  skill_id: number;
  score: number;
  comment?: string;
  evaluator_name?: string;
  assessment_date?: string;
}

export interface VocAssessmentCreate {
  student_id: number;
  student_name: string;
  skill_id: number;
  score: number;
  comment?: string;
  evaluator_id?: number;
  evaluator_name?: string;
}

export interface VocCertificate {
  id: number;
  org_id: number;
  student_id: number;
  student_name?: string;
  cert_name: string;
  cert_number?: string;
  cert_level?: string;
  issuing_authority?: string;
  issue_date?: string;
  expire_date?: string;
  cert_file_url?: string;
}

export interface VocCertificateCreate {
  student_id: number;
  student_name: string;
  cert_name: string;
  cert_number?: string;
  cert_level?: string;
  issuing_authority?: string;
  issue_date?: string;
  expire_date?: string;
}

export interface VocStudentSkillProfile {
  student_id: number;
  student_name: string;
  avg_score: number;
  skill_count: number;
  assessments: any[];
  certificates: any[];
  radar: Record<string, number>;
}

export interface VocEquipmentStats {
  total: number;
  in_use: number;
  available: number;
  maintenance: number;
  usage_rate: string;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_safety_level: Record<string, number>;
}

// ==================== Service ====================

@Injectable({
  providedIn: 'root',
})
export class VocationalService {
  constructor(private http: HttpClient) {}

  // ---- Equipment CRUD ----

  getEquipmentList(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    safety_level?: string;
    location_room?: string;
    search?: string;
  }): Observable<VocEquipment[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<VocEquipment[]>(`${API_URL}/equipment`, { params: httpParams });
  }

  getEquipment(id: number): Observable<VocEquipment> {
    return this.http.get<VocEquipment>(`${API_URL}/equipment/${id}`);
  }

  createEquipment(data: VocEquipmentCreate): Observable<VocEquipment> {
    return this.http.post<VocEquipment>(`${API_URL}/equipment`, data);
  }

  updateEquipment(id: number, data: Partial<VocEquipmentCreate>): Observable<VocEquipment> {
    return this.http.put<VocEquipment>(`${API_URL}/equipment/${id}`, data);
  }

  deleteEquipment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/equipment/${id}`);
  }

  updateLocation(
    id: number,
    location: { building?: string; floor?: string; room?: string; station?: string }
  ): Observable<{ message: string; equipment_id: number }> {
    let params = new HttpParams();
    if (location.building) params = params.set('building', location.building);
    if (location.floor) params = params.set('floor', location.floor);
    if (location.room) params = params.set('room', location.room);
    if (location.station) params = params.set('station', location.station);
    return this.http.put<any>(`${API_URL}/equipment/${id}/location`, null, { params });
  }

  // ---- Borrow/Return ----

  borrowEquipment(
    equipmentId: number,
    data: {
      equipment_id: number;
      borrower_id: number;
      borrower_name: string;
      borrower_type?: string;
      expected_return_date: string;
      purpose?: string;
      purpose_type?: string;
      related_id?: number;
      needs_approval?: boolean;
    }
  ): Observable<VocBorrowRecord> {
    return this.http.post<VocBorrowRecord>(`${API_URL}/equipment/${equipmentId}/borrow`, data);
  }

  returnEquipment(
    equipmentId: number,
    borrowerId: number,
    condition?: string,
    isDamaged?: boolean,
    damageDesc?: string
  ): Observable<{ message: string; equipment_id: number; is_damaged: boolean; return_date: string }> {
    let params = new HttpParams().set('borrower_id', borrowerId);
    if (condition) params = params.set('condition', condition);
    if (isDamaged) params = params.set('is_damaged', 'true');
    if (damageDesc) params = params.set('damage_desc', damageDesc);
    return this.http.post<any>(`${API_URL}/equipment/${equipmentId}/return`, null, { params });
  }

  getBorrows(params?: {
    equipment_id?: number;
    borrower_id?: number;
    status?: string;
    overdue_only?: boolean;
    skip?: number;
    limit?: number;
  }): Observable<VocBorrowRecord[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<VocBorrowRecord[]>(`${API_URL}/borrows`, { params: httpParams });
  }

  approveBorrow(borrowId: number, approved: boolean, rejectReason?: string): Observable<VocBorrowRecord> {
    let params = new HttpParams().set('approved', String(approved));
    if (rejectReason) params = params.set('reject_reason', rejectReason);
    return this.http.put<VocBorrowRecord>(`${API_URL}/borrows/${borrowId}/approve`, null, { params });
  }

  // ---- Maintenance ----

  addMaintenance(
    equipmentId: number,
    data: {
      equipment_id: number;
      maintenance_type: string;
      description: string;
      maintainer?: string;
      maintainer_contact?: string;
      maintenance_date?: string;
      cost?: number;
      notes?: string;
      attachment_url?: string;
    }
  ): Observable<{ message: string; maintenance_id: number; equipment_id: number }> {
    return this.http.post<any>(`${API_URL}/equipment/${equipmentId}/maintenance`, data);
  }

  getMaintenanceHistory(equipmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/equipment/${equipmentId}/maintenance`);
  }

  // ---- Fault Reports ----

  reportFault(
    equipmentId: number,
    data: {
      equipment_id: number;
      reporter_id: number;
      reporter_name: string;
      fault_type: string;
      description: string;
      photo_urls?: string[];
    }
  ): Observable<VocFaultReport> {
    return this.http.post<VocFaultReport>(`${API_URL}/equipment/${equipmentId}/report-fault`, data);
  }

  getFaultReports(params?: {
    equipment_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Observable<VocFaultReport[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<VocFaultReport[]>(`${API_URL}/fault-reports`, { params: httpParams });
  }

  resolveFault(reportId: number, resolution: string, assignedTo?: string): Observable<{ message: string; report_id: number }> {
    let params = new HttpParams().set('resolution', resolution);
    if (assignedTo) params = params.set('assigned_to', assignedTo);
    return this.http.put<any>(`${API_URL}/fault-reports/${reportId}/resolve`, null, { params });
  }

  // ---- Idle Alert ----

  getIdleEquipment(thresholdDays: number = 30): Observable<{ threshold_days: number; idle_count: number; idle_equipment: any[] }> {
    const params = new HttpParams().set('threshold_days', String(thresholdDays));
    return this.http.get<any>(`${API_URL}/equipment/idle-alert`, { params });
  }

  // ---- Stats ----

  getEquipmentStats(): Observable<VocEquipmentStats> {
    return this.http.get<VocEquipmentStats>(`${API_URL}/equipment/stats`);
  }

  getDashboardStats(): Observable<VocDashboardStats> {
    return this.http.get<VocDashboardStats>(`${API_URL}/dashboard`);
  }

  // ==================== Phase 2: Safety Certification ====================

  createSafetyCert(data: VocSafetyCertCreate): Observable<VocSafetyCertification> {
    return this.http.post<VocSafetyCertification>(`${API_URL}/safety/certifications`, data);
  }

  getSafetyCertifications(userId?: number): Observable<VocSafetyCertification[]> {
    let params = new HttpParams();
    if (userId) params = params.set('user_id', userId);
    return this.http.get<VocSafetyCertification[]>(`${API_URL}/safety/certifications`, { params });
  }

  createSafetyChecklist(data: any): Observable<VocSafetyChecklist> {
    return this.http.post<VocSafetyChecklist>(`${API_URL}/safety/checklists`, data);
  }

  getSafetyChecklists(dateFrom?: string, dateTo?: string): Observable<VocSafetyChecklist[]> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);
    return this.http.get<VocSafetyChecklist[]>(`${API_URL}/safety/checklists`, { params });
  }

  reportIncident(data: any): Observable<VocIncidentReport> {
    return this.http.post<VocIncidentReport>(`${API_URL}/safety/incidents`, data);
  }

  getIncidents(status?: string): Observable<VocIncidentReport[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<VocIncidentReport[]>(`${API_URL}/safety/incidents`, { params });
  }

  getSafetyStats(): Observable<VocSafetyStats> {
    return this.http.get<VocSafetyStats>(`${API_URL}/safety/stats`);
  }

  // ==================== Phase 2: Courses & Rooms & Schedules ====================

  createCourse(data: VocCourseCreate): Observable<VocCourse> {
    return this.http.post<VocCourse>(`${API_URL}/courses`, data);
  }

  getCourses(major?: string): Observable<VocCourse[]> {
    let params = new HttpParams();
    if (major) params = params.set('major', major);
    return this.http.get<VocCourse[]>(`${API_URL}/courses`, { params });
  }

  getCourse(id: number): Observable<VocCourse> {
    return this.http.get<VocCourse>(`${API_URL}/courses/${id}`);
  }

  createRoom(data: any): Observable<VocTrainingRoom> {
    return this.http.post<VocTrainingRoom>(`${API_URL}/rooms`, data);
  }

  getRooms(): Observable<VocTrainingRoom[]> {
    return this.http.get<VocTrainingRoom[]>(`${API_URL}/rooms`);
  }

  createSchedule(data: any): Observable<VocTrainingSchedule> {
    return this.http.post<VocTrainingSchedule>(`${API_URL}/schedules`, data);
  }

  getSchedules(roomId?: number, weekday?: number): Observable<VocTrainingSchedule[]> {
    let params = new HttpParams();
    if (roomId) params = params.set('room_id', roomId);
    if (weekday !== undefined && weekday !== null) params = params.set('weekday', weekday);
    return this.http.get<VocTrainingSchedule[]>(`${API_URL}/schedules`, { params });
  }

  getRoomUtilization(): Observable<VocRoomUtilization[]> {
    return this.http.get<VocRoomUtilization[]>(`${API_URL}/rooms/utilization`);
  }

  getTeacherWorkload(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/teacher-workload`);
  }

  // ==================== Phase 3: Enterprise & Cooperation ====================

  createEnterprise(data: VocEnterpriseCreate): Observable<VocEnterprise> {
    return this.http.post<VocEnterprise>(`${API_URL}/enterprises`, data);
  }

  getEnterprises(industry?: string, search?: string): Observable<VocEnterprise[]> {
    let params = new HttpParams();
    if (industry) params = params.set('industry', industry);
    if (search) params = params.set('search', search);
    return this.http.get<VocEnterprise[]>(`${API_URL}/enterprises`, { params });
  }

  getEnterprise(id: number): Observable<VocEnterprise> {
    return this.http.get<VocEnterprise>(`${API_URL}/enterprises/${id}`);
  }

  createEnterpriseDemand(entId: number, demandType: string, title: string, description?: string): Observable<VocEnterpriseDemand> {
    let params = new HttpParams()
      .set('demand_type', demandType)
      .set('title', title);
    if (description) params = params.set('description', description);
    return this.http.post<VocEnterpriseDemand>(`${API_URL}/enterprises/${entId}/demands`, null, { params });
  }

  createCoopProject(data: VocCoopProjectCreate): Observable<VocCooperationProject> {
    return this.http.post<VocCooperationProject>(`${API_URL}/cooperation-projects`, data);
  }

  getCoopProjects(status?: string): Observable<VocCooperationProject[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<VocCooperationProject[]>(`${API_URL}/cooperation-projects`, { params });
  }

  updateProjectProgress(projectId: number, progress: number, stage?: string): Observable<any> {
    let params = new HttpParams().set('progress', progress);
    if (stage) params = params.set('stage', stage);
    return this.http.put<any>(`${API_URL}/cooperation-projects/${projectId}/progress`, null, { params });
  }

  getCooperationStats(): Observable<VocCooperationStats> {
    return this.http.get<VocCooperationStats>(`${API_URL}/cooperation/stats`);
  }

  // ==================== Phase 3: Competitions ====================

  createCompetition(data: VocCompetitionCreate): Observable<VocCompetition> {
    return this.http.post<VocCompetition>(`${API_URL}/competitions`, data);
  }

  getCompetitions(level?: string, status?: string): Observable<VocCompetition[]> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);
    if (status) params = params.set('status', status);
    return this.http.get<VocCompetition[]>(`${API_URL}/competitions`, { params });
  }

  registerCompetition(compId: number, studentId: number, studentName: string, teacherName?: string): Observable<VocCompetitionRegistration> {
    let params = new HttpParams()
      .set('student_id', studentId)
      .set('student_name', studentName);
    if (teacherName) params = params.set('teacher_name', teacherName);
    return this.http.post<VocCompetitionRegistration>(`${API_URL}/competitions/${compId}/register`, null, { params });
  }

  updateCompetitionResult(compId: number, registrationId: number, awardLevel?: string, score?: number, certUrl?: string): Observable<any> {
    let params = new HttpParams().set('registration_id', registrationId);
    if (awardLevel) params = params.set('award_level', awardLevel);
    if (score !== undefined && score !== null) params = params.set('score', score);
    if (certUrl) params = params.set('cert_url', certUrl);
    return this.http.put<any>(`${API_URL}/competitions/${compId}/results`, null, { params });
  }

  getCompetitionStats(): Observable<any> {
    return this.http.get<any>(`${API_URL}/competitions/stats`);
  }

  // ==================== Phase 3: Internships & Employment ====================

  createInternship(data: VocInternshipCreate): Observable<VocInternshipRecord> {
    return this.http.post<VocInternshipRecord>(`${API_URL}/internships`, data);
  }

  getInternships(studentId?: number, status?: string): Observable<VocInternshipRecord[]> {
    let params = new HttpParams();
    if (studentId) params = params.set('student_id', studentId);
    if (status) params = params.set('status', status);
    return this.http.get<VocInternshipRecord[]>(`${API_URL}/internships`, { params });
  }

  createEmployment(data: VocEmploymentCreate): Observable<VocEmploymentRecord> {
    return this.http.post<VocEmploymentRecord>(`${API_URL}/employment/records`, data);
  }

  getEmploymentStats(): Observable<any> {
    return this.http.get<any>(`${API_URL}/employment/stats`);
  }

  // ==================== Phase 3: Incubator ====================

  createIncubatorProject(data: VocIncubatorCreate): Observable<VocIncubatorProject> {
    return this.http.post<VocIncubatorProject>(`${API_URL}/incubator/projects`, data);
  }

  getIncubatorProjects(stage?: string, status?: string): Observable<VocIncubatorProject[]> {
    let params = new HttpParams();
    if (stage) params = params.set('stage', stage);
    if (status) params = params.set('status', status);
    return this.http.get<VocIncubatorProject[]>(`${API_URL}/incubator/projects`, { params });
  }

  updateIncubatorStage(projectId: number, stage: string, progress?: number): Observable<any> {
    let params = new HttpParams().set('stage', stage);
    if (progress !== undefined && progress !== null) params = params.set('progress', progress);
    return this.http.put<any>(`${API_URL}/incubator/projects/${projectId}/stage`, null, { params });
  }

  getIncubatorStats(): Observable<any> {
    return this.http.get<any>(`${API_URL}/incubator/stats`);
  }

  // ==================== Phase 4: Skill Assessment ====================

  createSkillStandard(data: VocSkillStandardCreate): Observable<VocSkillStandard> {
    return this.http.post<VocSkillStandard>(`${API_URL}/assessments/standards`, data);
  }

  getSkillStandards(major?: string, skillLevel?: string): Observable<VocSkillStandard[]> {
    let params = new HttpParams();
    if (major) params = params.set('major', major);
    if (skillLevel) params = params.set('skill_level', skillLevel);
    return this.http.get<VocSkillStandard[]>(`${API_URL}/assessments/standards`, { params });
  }

  createAssessment(data: VocAssessmentCreate): Observable<VocSkillAssessment> {
    return this.http.post<VocSkillAssessment>(`${API_URL}/assessments/evaluate`, data);
  }

  getStudentSkillProfile(studentId: number): Observable<VocStudentSkillProfile> {
    return this.http.get<VocStudentSkillProfile>(`${API_URL}/assessments/student/${studentId}/profile`);
  }

  createCertificate(data: VocCertificateCreate): Observable<VocCertificate> {
    return this.http.post<VocCertificate>(`${API_URL}/certificates`, data);
  }

  getCertificates(studentId?: number): Observable<VocCertificate[]> {
    let params = new HttpParams();
    if (studentId) params = params.set('student_id', studentId);
    return this.http.get<VocCertificate[]>(`${API_URL}/certificates`, { params });
  }

  getAssessmentStats(): Observable<any> {
    return this.http.get<any>(`${API_URL}/assessments/stats`);
  }
}