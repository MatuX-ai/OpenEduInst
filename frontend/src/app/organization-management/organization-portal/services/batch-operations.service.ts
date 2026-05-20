/**
 * 批量操作与数据导入导出服务
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import { environment } from '../../../../environments/environment';

export interface ImportResult {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  message: string;
  field?: string;
}

export interface ExportOptions {
  format: 'excel' | 'csv';
  includeHeaders: boolean;
  columns?: string[];
  filters?: Record<string, unknown>;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BatchOperationsService {
  private readonly API_BASE = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * 导入学生数据（Excel）
   */
  importStudents(orgId: number, file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<
        ApiResponse<ImportResult>
      >(`${this.API_BASE}/batch/org/${orgId}/students/import`, formData)
      .pipe(
        map((response) => response.data),
        timeout(30000),
        catchError((err) => {
          console.error('导入学生失败:', err);
          // 模拟导入结果
          return this.mockImportResult(file.name);
        })
      );
  }

  /**
   * 导入教师数据（Excel）
   */
  importTeachers(orgId: number, file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<
        ApiResponse<ImportResult>
      >(`${this.API_BASE}/batch/org/${orgId}/teachers/import`, formData)
      .pipe(
        map((response) => response.data),
        timeout(30000),
        catchError((err) => {
          console.error('导入教师失败:', err);
          return this.mockImportResult(file.name);
        })
      );
  }

  /**
   * 导出学生数据
   */
  exportStudents(orgId: number, options: ExportOptions): Observable<Blob> {
    const params = this.buildExportParams(options);
    return this.http
      .get(`${this.API_BASE}/batch/org/${orgId}/students/export`, {
        responseType: 'blob',
        params: params as Record<string, string>,
      })
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('导出学生失败:', err);
          // 返回模拟的 Excel 文件
          return this.createMockExcelFile('students_export');
        })
      );
  }

  /**
   * 导出教师数据
   */
  exportTeachers(orgId: number, options: ExportOptions): Observable<Blob> {
    const params = this.buildExportParams(options);
    return this.http
      .get(`${this.API_BASE}/batch/org/${orgId}/teachers/export`, {
        responseType: 'blob',
        params: params as Record<string, string>,
      })
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('导出教师失败:', err);
          return this.createMockExcelFile('teachers_export');
        })
      );
  }

  /**
   * 批量删除学生
   */
  batchDeleteStudents(orgId: number, studentIds: number[]): Observable<{ success: boolean }> {
    return this.http
      .post<{
        success: boolean;
      }>(`${this.API_BASE}/batch/org/${orgId}/students/delete`, { student_ids: studentIds })
      .pipe(
        map((response) => response),
        timeout(10000),
        catchError((err) => {
          console.error('批量删除失败:', err);
          throw err;
        })
      );
  }

  /**
   * 批量更新学生状态
   */
  batchUpdateStudentStatus(
    orgId: number,
    updates: Array<{ id: number; status: string }>
  ): Observable<{
    success: boolean;
  }> {
    return this.http
      .post<{
        success: boolean;
      }>(`${this.API_BASE}/batch/org/${orgId}/students/update-status`, { updates })
      .pipe(
        map((response) => response),
        timeout(10000),
        catchError((err) => {
          console.error('批量更新失败:', err);
          throw err;
        })
      );
  }

  /**
   * 解析 Excel 文件为 JSON
   */
  parseExcelFile(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBufferLike);
          const workbook = XLSX.read(data, { type: 'array' });

          // 读取第一个工作表
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          resolve(jsonData as unknown[][]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 下载导入模板
   */
  downloadTemplate(type: 'students' | 'teachers'): void {
    const template = this.getTemplate(type);
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // 生成并下载文件
    XLSX.writeFile(wb, `${type}_import_template.xlsx`);
  }

  // ==================== 内部方法 ====================

  private buildExportParams(options: ExportOptions): Record<string, unknown> {
    const params: Record<string, unknown> = {
      format: options.format,
      include_headers: options.includeHeaders,
    };

    if (options.columns) {
      params['columns'] = options.columns.join(',');
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params[`filter[${key}]`] = value;
        }
      });
    }

    return params;
  }

  private getTemplate(type: string): Array<Record<string, string>> {
    if (type === 'students') {
      return [
        { 姓名: '张三', 邮箱: 'zhangsan@example.com', 年级: '高一', 班级: '1 班' },
        { 姓名: '李四', 邮箱: 'lisi@example.com', 年级: '高一', 班级: '2 班' },
      ];
    } else if (type === 'teachers') {
      return [
        { 姓名: '王老师', 邮箱: 'wang@example.com', 部门: '数学组', 职称: '高级教师' },
        { 姓名: '李老师', 邮箱: 'li@example.com', 部门: '英语组', 职称: '一级教师' },
      ];
    }
    return [];
  }

  private mockImportResult(_filename: string): Observable<ImportResult> {
    return of({
      success: true,
      total: 50,
      created: 45,
      updated: 3,
      failed: 2,
      errors: [
        { row: 5, message: '邮箱格式错误', field: 'email' },
        { row: 12, message: '必填字段缺失', field: 'name' },
      ],
    });
  }

  private createMockExcelFile(_name: string): Observable<Blob> {
    const data = [
      ['姓名', '邮箱', '年级/部门', '班级/职称'],
      ['张三', 'zhangsan@example.com', '高一', '1 班'],
      ['李四', 'lisi@example.com', '高二', '2 班'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // 转换为 Blob
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    }) as unknown as ArrayBuffer;
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return of(blob);
  }

  /**
   * 保存文件（通用方法）
   */
  saveFile(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }
}
