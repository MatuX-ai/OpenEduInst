import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

interface StudentProfile {
  name: string;
  grade: string;
  avatar: string;
  rating: number;
}

interface Course {
  name: string;
  instructor: string;
  progress: number;
  next_class: string;
  remaining_hours: number;
  rating: number;
}

interface Achievement {
  id: number;
  name: string;
  type: string;
  achieved_date: string;
  icon: string;
}

interface ClassFeedback {
  id: number;
  course_name: string;
  teacher_name: string;
  content: string;
  homework?: string;
  rating: number;
  class_date: string;
  attachments?: string[];
}

interface Project {
  name: string;
  status: string;
  progress: number;
  category: string;
}

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="parent-portal-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">家长中心</h1>
          <p class="page-subtitle">学员成长档案、课堂反馈、家校互动</p>
        </div>
        <button mat-raised-button color="primary" (click)="viewNotifications()">
          <mat-icon>notifications</mat-icon>
          消息通知
        </button>
      </div>

      <!-- Student Profile Card -->
      <div class="profile-card">
        <div class="profile-content">
          <div class="avatar">{{ student.avatar }}</div>
          <div class="profile-info">
            <h2 class="student-name">{{ student.name }}</h2>
            <p class="student-grade">{{ student.grade }} · 在训{{ courses.length }}门课程</p>
          </div>
          <div class="rating-section">
            <div class="rating-display">
              <mat-icon class="star-icon">star</mat-icon>
              <span class="rating-value">{{ student.rating }}</span>
            </div>
            <p class="rating-label">综合评分</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">剩余课时</p>
              <p class="stat-value">{{ totalRemainingHours }}</p>
              <p class="stat-desc">{{ courses.length }}门课程</p>
            </div>
            <div class="stat-icon-wrapper blue">
              <mat-icon>menu_book</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">完成项目</p>
              <p class="stat-value">{{ completedProjects }}</p>
              <p class="stat-desc green">{{ inProgressProjects }}个进行中</p>
            </div>
            <div class="stat-icon-wrapper purple">
              <mat-icon>emoji_events</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">获得荣誉</p>
              <p class="stat-value">{{ achievements.length }}</p>
              <p class="stat-desc amber">本月新增1项</p>
            </div>
            <div class="stat-icon-wrapper amber">
              <mat-icon>trending_up</mat-icon>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">下次上课</p>
              <p class="stat-value-small">{{ nextClassDate }}</p>
              <p class="stat-desc blue">{{ nextClassTime }}</p>
            </div>
            <div class="stat-icon-wrapper green">
              <mat-icon>event</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Current Courses -->
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">在学课程</h3>
            </div>
            <div class="section-body">
              <div *ngFor="let course of courses" class="course-item">
                <div class="course-header">
                  <div class="course-info">
                    <h4 class="course-name">{{ course.name }}</h4>
                    <p class="course-teacher">教师：{{ course.instructor }}</p>
                  </div>
                  <div class="course-rating">
                    <mat-icon class="star-filled">star</mat-icon>
                    <span>{{ course.rating }}</span>
                  </div>
                </div>

                <div class="course-progress">
                  <div class="progress-header">
                    <span class="progress-label">学习进度</span>
                    <span class="progress-percent">{{ course.progress }}%</span>
                  </div>
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="course.progress"
                    class="progress-bar">
                  </mat-progress-bar>
                </div>

                <div class="course-footer">
                  <span class="remaining-hours">剩余 {{ course.remaining_hours }} 课时</span>
                  <span class="next-class">下次：{{ formatDateTime(course.next_class) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Class Feedback -->
          <div class="section-card">
            <div class="section-header">
              <div class="header-left">
                <mat-icon class="section-icon">chat</mat-icon>
                <h3 class="section-title">课堂反馈</h3>
              </div>
              <span class="badge">最近{{ feedbacks.length }}次</span>
            </div>
            <div class="section-body">
              <div *ngFor="let feedback of feedbacks" class="feedback-item">
                <div class="feedback-header">
                  <div>
                    <p class="feedback-course">{{ feedback.course_name }}</p>
                    <p class="feedback-meta">{{ formatDate(feedback.class_date) }} · {{ feedback.teacher_name }}</p>
                  </div>
                  <div class="feedback-rating">
                    <mat-icon *ngFor="let star of getStars(feedback.rating)" class="star-filled">star</mat-icon>
                  </div>
                </div>
                <p class="feedback-content">{{ feedback.content }}</p>
                <div *ngIf="feedback.homework" class="homework-box">
                  <p class="homework-label">📝 课后作业</p>
                  <p class="homework-text">{{ feedback.homework }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Achievements -->
          <div class="sidebar-card">
            <div class="section-header">
              <h3 class="section-title">🏆 荣誉墙</h3>
            </div>
            <div class="section-body">
              <div *ngFor="let achievement of achievements" class="achievement-item">
                <span class="achievement-icon">{{ achievement.icon }}</span>
                <div class="achievement-info">
                  <p class="achievement-name">{{ achievement.name }}</p>
                  <p class="achievement-date">{{ formatDate(achievement.achieved_date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Projects -->
          <div class="sidebar-card">
            <div class="section-header">
              <h3 class="section-title">💻 项目作品</h3>
            </div>
            <div class="section-body">
              <div *ngFor="let project of projects" class="project-item">
                <div class="project-header">
                  <p class="project-name">{{ project.name }}</p>
                  <span [class]="'status-badge ' + (project.status === '已完成' ? 'completed' : 'in-progress')">
                    {{ project.status }}
                  </span>
                </div>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="project.progress"
                  [color]="project.progress === 100 ? 'accent' : 'primary'"
                  class="project-progress">
                </mat-progress-bar>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="sidebar-card">
            <div class="section-header">
              <h3 class="section-title">快捷操作</h3>
            </div>
            <div class="section-body">
              <button mat-stroked-button class="action-btn" (click)="scheduleClass()">
                <mat-icon>event</mat-icon>
                预约调课
              </button>
              <button mat-stroked-button class="action-btn" (click)="contactTeacher()">
                <mat-icon>chat</mat-icon>
                联系老师
              </button>
              <button mat-stroked-button class="action-btn" (click)="renewCourse()">
                <mat-icon>menu_book</mat-icon>
                续费课程
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parent-portal-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    /* Profile Card */
    .profile-card {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
      margin-bottom: 24px;
    }

    .profile-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }

    .profile-info {
      flex: 1;
    }

    .student-name {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }

    .student-grade {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    .rating-section {
      text-align: right;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .star-icon {
      color: #fde047;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .rating-value {
      font-size: 20px;
      font-weight: bold;
    }

    .rating-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .stat-value-small {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .stat-desc {
      font-size: 12px;
      margin: 0;
    }

    .stat-desc.green { color: #10b981; }
    .stat-desc.blue { color: #3b82f6; }
    .stat-desc.amber { color: #f59e0b; }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16px;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
    .stat-icon-wrapper.purple { background: #f5f3ff; color: #8b5cf6; }
    .stat-icon-wrapper.amber { background: #fffbeb; color: #f59e0b; }
    .stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    .left-column, .right-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Section Card */
    .section-card, .sidebar-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .section-header {
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      color: #3b82f6;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .badge {
      font-size: 12px;
      padding: 4px 10px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 12px;
    }

    .section-body {
      padding: 20px;
    }

    /* Course Item */
    .course-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      transition: box-shadow 0.2s;
    }

    .course-item:last-child {
      margin-bottom: 0;
    }

    .course-item:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .course-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .course-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 4px 0;
    }

    .course-teacher {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    .course-rating {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .star-filled {
      color: #facc15;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .course-progress {
      margin-bottom: 12px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .progress-label {
      font-size: 12px;
      color: #475569;
    }

    .progress-percent {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }

    .progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .course-footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .remaining-hours {
      color: #64748b;
    }

    .next-class {
      color: #3b82f6;
      font-weight: 500;
    }

    /* Feedback Item */
    .feedback-item {
      border-left: 4px solid #3b82f6;
      padding-left: 16px;
      padding-top: 12px;
      padding-bottom: 12px;
      padding-right: 16px;
      background: #f8fafc;
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
    }

    .feedback-item:last-child {
      margin-bottom: 0;
    }

    .feedback-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .feedback-course {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 2px 0;
    }

    .feedback-meta {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }

    .feedback-rating {
      display: flex;
      gap: 2px;
    }

    .feedback-content {
      font-size: 13px;
      color: #334155;
      margin: 0 0 12px 0;
      line-height: 1.5;
    }

    .homework-box {
      background: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #e2e8f0;
    }

    .homework-label {
      font-size: 11px;
      font-weight: 500;
      color: #475569;
      margin: 0 0 4px 0;
    }

    .homework-text {
      font-size: 13px;
      color: #0f172a;
      margin: 0;
    }

    /* Achievement Item */
    .achievement-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .achievement-item:last-child {
      margin-bottom: 0;
    }

    .achievement-icon {
      font-size: 24px;
    }

    .achievement-info {
      flex: 1;
    }

    .achievement-name {
      font-size: 13px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 2px 0;
    }

    .achievement-date {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }

    /* Project Item */
    .project-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .project-item:last-child {
      margin-bottom: 0;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .project-name {
      font-size: 13px;
      font-weight: 500;
      color: #0f172a;
      margin: 0;
    }

    .status-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-badge.completed {
      background: #ecfdf5;
      color: #10b981;
    }

    .status-badge.in-progress {
      background: #eff6ff;
      color: #3b82f6;
    }

    .project-progress {
      height: 6px;
      border-radius: 3px;
    }

    /* Action Buttons */
    .action-btn {
      width: 100%;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      padding: 10px 16px;
    }

    .action-btn:last-child {
      margin-bottom: 0;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ParentPortalComponent implements OnInit {
  student: StudentProfile = {
    name: '王小明',
    grade: '五年级',
    avatar: '王',
    rating: 4.7
  };

  courses: Course[] = [];
  feedbacks: ClassFeedback[] = [];
  achievements: Achievement[] = [];
  projects: Project[] = [];

  totalRemainingHours: number = 0;
  completedProjects: number = 0;
  inProgressProjects: number = 0;
  nextClassDate: string = '';
  nextClassTime: string = '';

  // Mock data
  mockCourses: Course[] = [
    {
      name: 'Arduino基础',
      instructor: '张老师',
      progress: 85,
      next_class: '2026-05-25T14:00:00',
      remaining_hours: 8,
      rating: 4.8
    },
    {
      name: 'Python编程',
      instructor: '李老师',
      progress: 72,
      next_class: '2026-05-27T15:30:00',
      remaining_hours: 12,
      rating: 4.6
    }
  ];

  mockFeedbacks: ClassFeedback[] = [
    {
      id: 1,
      course_name: 'Arduino基础',
      teacher_name: '张老师',
      content: '今天学习了PWM控制原理，小明表现积极，成功完成了LED亮度调节实验。建议课后复习analogWrite函数的使用方法。',
      homework: '完成3种不同亮度的LED程序',
      rating: 5,
      class_date: '2026-05-22T14:00:00'
    },
    {
      id: 2,
      course_name: 'Python编程',
      teacher_name: '李老师',
      content: '学习了列表和循环的使用，小明能够独立完成猜数字游戏。逻辑思维能力强，继续保持！',
      homework: '编写一个简易计算器程序',
      rating: 5,
      class_date: '2026-05-20T15:30:00'
    },
    {
      id: 3,
      course_name: 'Arduino基础',
      teacher_name: '张老师',
      content: '传感器数据采集实验，小明对DHT11温湿度传感器的使用掌握较快。团队协作能力有待提升。',
      homework: '记录一周室内温湿度数据',
      rating: 4,
      class_date: '2026-05-18T14:00:00'
    }
  ];

  mockAchievements: Achievement[] = [
    {
      id: 1,
      name: '蓝桥杯三等奖',
      type: 'competition',
      achieved_date: '2026-05-10T00:00:00',
      icon: '🏆'
    },
    {
      id: 2,
      name: '电子学会一级认证',
      type: 'certification',
      achieved_date: '2026-04-20T00:00:00',
      icon: '📜'
    },
    {
      id: 3,
      name: '优秀学员',
      type: 'award',
      achieved_date: '2026-03-15T00:00:00',
      icon: '⭐'
    }
  ];

  mockProjects: Project[] = [
    {
      name: '智能温室控制系统',
      status: '进行中',
      progress: 75,
      category: 'IoT'
    },
    {
      name: 'LED呼吸灯实验',
      status: '已完成',
      progress: 100,
      category: '硬件'
    }
  ];

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.courses = this.mockCourses;
    this.feedbacks = this.mockFeedbacks;
    this.achievements = this.mockAchievements;
    this.projects = this.mockProjects;

    // Calculate stats
    this.totalRemainingHours = this.courses.reduce((sum, c) => sum + c.remaining_hours, 0);
    this.completedProjects = this.projects.filter(p => p.status === '已完成').length;
    this.inProgressProjects = this.projects.filter(p => p.status === '进行中').length;

    // Next class
    if (this.courses.length > 0) {
      const nextClass = this.courses[0];
      const date = new Date(nextClass.next_class);
      this.nextClassDate = `${date.getMonth() + 1}月${date.getDate()}日`;
      this.nextClassTime = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${nextClass.name}`;
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  formatDate(dateString: string): string {
    return dateString.split('T')[0];
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  }

  viewNotifications() {
    console.log('View notifications');
  }

  scheduleClass() {
    console.log('Schedule class');
  }

  contactTeacher() {
    console.log('Contact teacher');
  }

  renewCourse() {
    console.log('Renew course');
  }
}
