import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrgAdminGuard } from '../../guards/organization.guard';
import { LicenseGuard } from '../../guards/license.guard';
import { TeacherGuard } from '../../guards/teacher.guard';

import { OrganizationLayoutComponent } from './organization-layout.component';
import { OrganizationListComponent } from './organization-list.component';

const routes: Routes = [
  // 机构列表页面（默认页面）
  {
    path: '',
    component: OrganizationListComponent,
  },
  // 机构详情页面（需要ID）
  {
    path: ':id',
    component: OrganizationLayoutComponent,
    canActivate: [OrgAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./organization-dashboard.component').then(
            (m) => m.OrganizationDashboardComponent
          ),
      },
      // 财务模块：仅培训机构和职业学校可见（可通过 Guard 进一步控制）
      {
        path: 'finance',
        loadComponent: () =>
          import('./components/finance-dashboard/billing.component').then(
            (m) => m.BillingComponent
          ),
      },
      // 教室管理（独立菜单，与设备管理分开）
      {
        path: 'classrooms',
        loadComponent: () =>
          import('./components/classroom-dashboard/classroom-dashboard.component').then(
            (m) => m.ClassroomDashboardComponent
          ),
      },
      // 教室与设备管理（合并教室管理和设备资产）
      {
        path: 'devices',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/classroom-dashboard/classroom-dashboard.component').then(
                (m) => m.ClassroomDashboardComponent
              ),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('../../features/stem-cloud/hardware-management.component').then(
                (m) => m.HardwareManagementComponent
              ),
          },
          {
            path: ':id',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
              {
                path: 'edit',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
              {
                path: 'maintenance',
                loadComponent: () =>
                  import('../../features/stem-cloud/hardware-management.component').then(
                    (m) => m.HardwareManagementComponent
                  ),
              },
            ],
          },
        ],
      },
      // 竞赛认证
      {
        path: 'competitions',
        loadComponent: () =>
          import('./components/competition-management/competition-list.component').then(
            (m) => m.CompetitionListComponent
          ),
      },
      // Token中心（合并购买Token功能）
      {
        path: 'tokens',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/token-purchase/token-purchase.component').then(
                (m) => m.TokenPurchaseComponent
              ),
          },
          {
            path: 'purchase',
            loadComponent: () =>
              import('../../features/stem-cloud/token-management.component').then(
                (m) => m.TokenManagementComponent
              ),
          },
          {
            path: 'report',
            loadComponent: () =>
              import('../../features/stem-cloud/token-management.component').then(
                (m) => m.TokenManagementComponent
              ),
          },
          {
            path: 'service',
            children: [
              {
                path: ':id',
                loadComponent: () =>
                  import('../../features/stem-cloud/token-management.component').then(
                    (m) => m.TokenManagementComponent
                  ),
              },
            ],
          },
        ],
      },
      // 系统设置
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/system-settings/system-settings.component').then(
            (m) => m.SystemSettingsComponent
          ),
      },
      // 消息中心
      {
        path: 'notifications',
        loadComponent: () =>
          import('./components/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },
      // 营销中心
      {
        path: 'marketing',
        loadComponent: () =>
          import('./components/marketing/marketing.component').then(
            (m) => m.MarketingComponent
          ),
      },
      // 家长中心
      {
        path: 'parent-portal',
        loadComponent: () =>
          import('./components/parent-portal/parent-portal.component').then(
            (m) => m.ParentPortalComponent
          ),
      },
      // 多校区管理
      {
        path: 'multi-campus',
        loadComponent: () =>
          import('./components/multi-campus/multi-campus.component').then(
            (m) => m.MultiCampusComponent
          ),
      },
      // 微信客服：通用功能
      {
        path: 'wechat-cs',
        loadComponent: () =>
          import('./components/wechat-customer-service/wechat-customer-service.component').then(
            (m) => m.WechatCustomerServiceComponent
          ),
      },
      // 教师管理：通用功能
      {
        path: 'teachers',
        loadComponent: () =>
          import('./components/teacher-management/teacher-list.component').then(
            (m) => m.TeacherListComponent
          ),
      },
      // 学生管理：通用功能
      {
        path: 'students',
        loadComponent: () =>
          import('./components/student-management/student-list.component').then(
            (m) => m.StudentListComponent
          ),
      },
      // 招生线索管理
      {
        path: 'leads',
        loadComponent: () =>
          import('./components/leads-management/leads-management.component').then(
            (m) => m.LeadsManagementComponent
          ),
      },
      // 教学资源中心
      {
        path: 'resources',
        loadComponent: () =>
          import('./components/teaching-resources/teaching-resources.component').then(
            (m) => m.TeachingResourcesComponent
          ),
      },
      // 知识图谱推荐（只读）
      {
        path: 'knowledge-graph',
        canActivate: [TeacherGuard],
        loadComponent: () =>
          import('./components/knowledge-graph/knowledge-graph.component').then(
            (m) => m.KnowledgeGraphComponent
          ),
      },
      // 课题工作室（OpenMTSciEd 深链）
      {
        path: 'topic-studio',
        canActivate: [TeacherGuard],
        loadComponent: () =>
          import('./components/topic-studio/topic-studio-launcher.component').then(
            (m) => m.TopicStudioLauncherComponent
          ),
      },
      // 教师工作台（OpenMTSciEd 备课入口）
      {
        path: 'teacher',
        canActivate: [TeacherGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./components/teacher-portal/teacher-dashboard.component').then(
                (m) => m.TeacherDashboardComponent
              ),
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
        ],
      },
      // 排课管理：教育局通常不需要此功能，可考虑增加类型守卫
      {
        path: 'schedule',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/schedule-management/schedule-main.component').then(
                (m) => m.ScheduleMainComponent
              ),
          },
          {
            path: 'batch',
            loadComponent: () =>
              import('./components/schedule-management/batch-schedule.component').then(
                (m) => m.BatchScheduleComponent
              ),
          },
        ],
      },
      // 角色权限：通用功能
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/role-permission/role-list.component').then(
            (m) => m.RoleListComponent
          ),
      },
      // 数据分析：已整合到仪表盘中
      {
        path: 'analytics',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // STEM 教育管理
      {
        path: 'stem',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('../../features/stem-cloud/stem-dashboard.component').then(
                (m) => m.StemDashboardComponent
              ),
          },
          {
            path: 'clubs',
            loadComponent: () =>
              import('../../features/stem-cloud/stem-club-list.component').then(
                (m) => m.StemClubListComponent
              ),
          },
          {
            path: 'clubs/:id',
            loadComponent: () =>
              import('../../features/stem-cloud/stem-club-detail.component').then(
                (m) => m.StemClubDetailComponent
              ),
          },
          {
            path: 'consumables',
            loadComponent: () =>
              import('../../features/stem-cloud/stem-consumable-list.component').then(
                (m) => m.StemConsumableListComponent
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
      // 教育局管理平台
      {
        path: 'bureau',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/bureau/bureau-layout.component').then(
                (m) => m.BureauLayoutComponent
              ),
          },
          { path: '', redirectTo: '', pathMatch: 'full' },
        ],
      },
      // 考试管理
      {
        path: 'exam',
        children: [
          {
            path: 'bank',
            loadComponent: () =>
              import('../../features/exam-management/exam-question-bank.component').then(
                (m) => m.ExamQuestionBankComponent
              ),
          },
          {
            path: 'papers',
            loadComponent: () =>
              import('../../features/exam-management/exam-paper-list.component').then(
                (m) => m.ExamPaperListComponent
              ),
          },
          {
            path: 'papers/:paperId',
            loadComponent: () =>
              import('../../features/exam-management/exam-paper-editor.component').then(
                (m) => m.ExamPaperEditorComponent
              ),
          },
          {
            path: 'papers/:paperId/edit',
            loadComponent: () =>
              import('../../features/exam-management/exam-paper-editor.component').then(
                (m) => m.ExamPaperEditorComponent
              ),
          },
          {
            path: 'tasks',
            loadComponent: () =>
              import('../../features/exam-management/exam-task-list.component').then(
                (m) => m.ExamTaskListComponent
              ),
          },
          {
            path: 'tasks/create',
            loadComponent: () =>
              import('../../features/exam-management/exam-task-create.component').then(
                (m) => m.ExamTaskCreateComponent
              ),
          },
          {
            path: 'tasks/:taskId/exam',
            loadComponent: () =>
              import('../../features/exam-management/exam-student-exam.component').then(
                (m) => m.ExamStudentExamComponent
              ),
          },
          {
            path: 'tasks/:taskId/results',
            loadComponent: () =>
              import('../../features/exam-management/exam-results.component').then(
                (m) => m.ExamResultsComponent
              ),
          },
          {
            path: 'tasks/results/:resultId',
            loadComponent: () =>
              import('../../features/exam-management/exam-grading.component').then(
                (m) => m.ExamGradingComponent
              ),
          },
          {
            path: 'my-exams',
            loadComponent: () =>
              import('../../features/exam-management/exam-student-exam.component').then(
                (m) => m.ExamStudentExamComponent
              ),
          },
          { path: '', redirectTo: 'bank', pathMatch: 'full' },
        ],
      },
      // 职业学校 - 实训设备管理
      {
        path: 'vocational',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./components/dashboard-overview/vocational-dashboard.component').then(
                (m) => m.VocationalDashboardComponent
              ),
          },
          {
            path: 'equipment',
            loadComponent: () =>
              import('../../features/stem-cloud/hardware-management.component').then(
                (m) => m.HardwareManagementComponent
              ),
          },
          {
            path: 'consumables',
            loadComponent: () =>
              import('../../features/stem-cloud/stem-consumable-list.component').then(
                (m) => m.StemConsumableListComponent
              ),
          },
          // Phase 2: 安全准入
          {
            path: 'safety',
            loadComponent: () =>
              import('./components/vocational/safety-management.component').then(
                (m) => m.SafetyManagementComponent
              ),
          },
          // Phase 2: 实训课程
          {
            path: 'courses',
            loadComponent: () =>
              import('./components/vocational/course-management.component').then(
                (m) => m.CourseManagementComponent
              ),
          },
          // Phase 2: 实训室管理
          {
            path: 'rooms',
            loadComponent: () =>
              import('./components/vocational/room-management.component').then(
                (m) => m.RoomManagementComponent
              ),
          },
          // Phase 2: 排课管理
          {
            path: 'schedules',
            loadComponent: () =>
              import('./components/vocational/schedule-management.component').then(
                (m) => m.ScheduleManagementComponent
              ),
          },
          // Phase 3: 合作企业
          {
            path: 'enterprises',
            loadComponent: () =>
              import('./components/vocational/enterprise-management.component').then(
                (m) => m.EnterpriseManagementComponent
              ),
          },
          // Phase 3: 校企联合项目
          {
            path: 'cooperation-projects',
            loadComponent: () =>
              import('./components/vocational/cooperation-project.component').then(
                (m) => m.CooperationProjectComponent
              ),
          },
          // Phase 3: 技能竞赛
          {
            path: 'competitions',
            loadComponent: () =>
              import('./components/vocational/competition-management.component').then(
                (m) => m.CompetitionManagementComponent
              ),
          },
          // Phase 3: 实习管理
          {
            path: 'internships',
            loadComponent: () =>
              import('./components/vocational/internship-management.component').then(
                (m) => m.InternshipManagementComponent
              ),
          },
          // Phase 3: 就业管理
          {
            path: 'employment',
            loadComponent: () =>
              import('./components/vocational/employment-management.component').then(
                (m) => m.EmploymentManagementComponent
              ),
          },
          // Phase 3: 双创孵化
          {
            path: 'incubator',
            loadComponent: () =>
              import('./components/vocational/incubator-management.component').then(
                (m) => m.IncubatorManagementComponent
              ),
          },
          // Phase 4: 技能评估
          {
            path: 'assessments',
            loadComponent: () =>
              import('./components/vocational/assessment-management.component').then(
                (m) => m.AssessmentManagementComponent
              ),
          },
          // Phase 4: 证书管理
          {
            path: 'certificates',
            loadComponent: () =>
              import('./components/vocational/certificate-management.component').then(
                (m) => m.CertificateManagementComponent
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
      // 云端备份管理（需要 cloud_backup feature）
      {
        path: 'backup-management',
        canActivate: [LicenseGuard],
        data: { requiredFeature: 'cloud_backup' },
        loadComponent: () =>
          import('./components/backup-management/backup-management.component').then(
            (m) => m.BackupManagementComponent
          ),
      },
      // 许可证管理
      {
        path: 'licenses',
        loadComponent: () =>
          import('./components/license-management/license-management.component').then(
            (m) => m.LicenseManagementComponent
          ),
      },
      // 购买 Token
      {
        path: 'purchase-tokens',
        loadComponent: () =>
          import('./components/token-purchase/token-purchase.component').then(
            (m) => m.TokenPurchaseComponent
          ),
      },
      // AI 助教（需要 ai_assistant feature）
      {
        path: 'ai-assistant',
        canActivate: [LicenseGuard],
        data: { requiredFeature: 'ai_assistant' },
        loadComponent: () =>
          import('./components/ai-assistant/ai-assistant.component').then(
            (m) => m.AiAssistantComponent
          ),
      },
      // 用户管理
      {
        path: 'users',
        loadComponent: () =>
          import('./components/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationRoutingModule {}
