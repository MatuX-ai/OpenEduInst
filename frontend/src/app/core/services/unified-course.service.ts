import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UnifiedCourse } from '../../models/unified-course.models';

@Injectable({
  providedIn: 'root',
})
export class UnifiedCourseService {
  getCourses(): Observable<UnifiedCourse[]> {
    return of([]);
  }

  getPopularCourses(orgId?: number, limit = 6): Observable<any[]> {
    return of([]);
  }

  getNewestCourses(limit = 6): Observable<any[]> {
    return of([]);
  }
}
