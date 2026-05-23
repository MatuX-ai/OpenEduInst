import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnifiedCourse } from '../../../models/unified-course.models';

@Component({
  selector: 'app-unified-course-card',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="course-card">{{ config?.course?.title }}</div>`,
  styles: [`
    .course-card { padding: 16px; border: 1px solid #eee; border-radius: 8px; }
  `]
})
export class UnifiedCourseCardComponent {
  @Input() config?: any;
}
