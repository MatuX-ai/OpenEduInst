import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuestionBank {
  id: number;
  org_id: number;
  name: string;
  source: string;
  source_url?: string;
  subject?: string;
  description?: string;
  question_count: number;
  last_sync_at?: string;
  create_time: string;
}

export interface Question {
  id: number;
  bank_id: number;
  org_id: number;
  external_id?: string;
  type: string;
  difficulty: string;
  subject?: string;
  content: string;
  options?: any[];
  answer?: string;
  answer_analysis?: string;
  score: number;
  tags?: string[];
  status: string;
  create_time: string;
}

export interface ExamPaper {
  id: number;
  org_id: number;
  title: string;
  description?: string;
  total_score: number;
  duration: number;
  status: string;
  format_settings?: any;
  created_by?: number;
  create_time: string;
  questions?: PaperQuestion[];
}

export interface PaperQuestion {
  id: number;
  paper_id: number;
  question_id: number;
  order_no: number;
  score: number;
  section?: string;
  question?: Question;
}

export interface ExamTask {
  id: number;
  org_id: number;
  paper_id: number;
  title: string;
  mode: string;
  start_time: string;
  end_time: string;
  duration: number;
  student_ids?: number[];
  class_ids?: number[];
  submit_type: string;
  status: string;
  auto_grade: boolean;
  allow_late: boolean;
  created_by?: number;
  create_time: string;
  paper?: ExamPaper;
}

export interface ExamResult {
  id: number;
  exam_id: number;
  student_id: number;
  answers?: any;
  score?: number;
  objective_score?: number;
  subjective_score?: number;
  start_time?: string;
  submit_time?: string;
  status: string;
  graded_by?: number;
  graded_at?: string;
  feedback?: string;
  questions_detail?: any[];
}

export interface ExamStats {
  total_students: number;
  submitted_count: number;
  graded_count: number;
  average_score: number;
  max_score: number;
  min_score: number;
  pass_rate: number;
  score_distribution: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class ExamManagementService {
  private apiUrl = environment.apiUrl + '/api/v1/exam';

  constructor(private http: HttpClient) {}

  // ==================== 题库 ====================
  getBanks(subject?: string, source?: string): Observable<any> {
    let params: any = {};
    if (subject) params.subject = subject;
    if (source) params.source = source;
    return this.http.get(`${this.apiUrl}/banks`, { params });
  }

  createBank(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/banks`, data);
  }

  // ==================== 试题 ====================
  getQuestions(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions`, { params });
  }

  getQuestionDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions/${id}`);
  }

  createQuestion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions`, data);
  }

  updateQuestion(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${id}`, data);
  }

  syncQuestions(bankId?: number, subject?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions/sync`, { bank_id: bankId, subject });
  }

  // ==================== 试卷 ====================
  getPapers(status?: string, skip?: number, limit?: number): Observable<any> {
    let params: any = {};
    if (status) params.status = status;
    if (skip !== undefined) params.skip = skip;
    if (limit !== undefined) params.limit = limit;
    return this.http.get(`${this.apiUrl}/papers`, { params });
  }

  createPaper(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/papers`, data);
  }

  getPaperDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/papers/${id}`);
  }

  updatePaper(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/papers/${id}`, data);
  }

  deletePaper(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/papers/${id}`);
  }

  addQuestionToPaper(paperId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/papers/${paperId}/questions`, data);
  }

  removeQuestionFromPaper(paperId: number, pqId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/papers/${paperId}/questions/${pqId}`);
  }

  randomSelectQuestions(paperId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/papers/${paperId}/random-select`, data);
  }

  reorderQuestions(paperId: number, questionIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/papers/${paperId}/reorder`, { question_ids: questionIds });
  }

  // ==================== 考试任务 ====================
  getTasks(status?: string, skip?: number, limit?: number): Observable<any> {
    let params: any = {};
    if (status) params.status = status;
    if (skip !== undefined) params.skip = skip;
    if (limit !== undefined) params.limit = limit;
    return this.http.get(`${this.apiUrl}/tasks`, { params });
  }

  createTask(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks`, data);
  }

  getTaskDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/${id}`);
  }

  publishTask(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${id}/publish`, {});
  }

  cancelTask(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${id}/cancel`, {});
  }

  // ==================== 学生考试 ====================
  startExam(taskId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/${taskId}/start`);
  }

  submitExam(taskId: number, answers: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks/${taskId}/submit`, { answers });
  }

  saveProgress(taskId: number, answers: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks/${taskId}/save-progress`, { answers });
  }

  getMyExams(status?: string): Observable<any> {
    let params: any = {};
    if (status) params.status = status;
    return this.http.get(`${this.apiUrl}/my-exams`, { params });
  }

  // ==================== 阅卷与成绩 ====================
  getExamResults(taskId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/${taskId}/results`);
  }

  getResultDetail(resultId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/${resultId}`);
  }

  gradeResult(resultId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/results/${resultId}/grade`, data);
  }

  getExamStats(taskId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/${taskId}/stats`);
  }
}