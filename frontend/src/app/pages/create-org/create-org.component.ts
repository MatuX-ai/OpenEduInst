import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrganizationContextService, OrganizationType } from '../../core/services/organization-context.service';

@Component({
  selector: 'app-create-org',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="create-org-container">
      <mat-card class="create-org-card">
        <mat-card-header>
          <mat-card-title>创建您的 STEM 机构</mat-card-title>
          <mat-card-subtitle>开启智能化管理新篇章</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="onSubmit()" #orgForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>机构名称</mat-label>
              <input matInput [(ngModel)]="formData.name" name="name" required placeholder="例如：未来创客实验室">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>联系邮箱</mat-label>
              <input matInput type="email" [(ngModel)]="formData.contact_email" name="contact_email" required placeholder="admin@example.com">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>机构类型</mat-label>
              <mat-select [(ngModel)]="formData.org_type" name="org_type" required>
                <mat-option value="training_institution">STEM 培训机构</mat-option>
                <mat-option value="k12_school">K12 学校</mat-option>
                <mat-option value="vocational_school">职业学校</mat-option>
                <mat-option value="education_bureau">教育局/主管部门</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>联系电话 (可选)</mat-label>
              <input matInput [(ngModel)]="formData.phone" name="phone">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>地址 (可选)</mat-label>
              <textarea matInput [(ngModel)]="formData.address" name="address" rows="3"></textarea>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="!orgForm.form.valid || isLoading" class="full-width submit-btn">
              {{ isLoading ? '正在创建...' : '立即创建' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-org-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f7fa;
    }
    .create-org-card {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .submit-btn {
      margin-top: 20px;
      height: 48px;
      font-size: 16px;
    }
  `]
})
export class CreateOrgComponent {
  formData = {
    name: '',
    contact_email: '',
    org_type: 'training_institution',
    phone: '',
    address: ''
  };
  isLoading = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private orgContext: OrganizationContextService
  ) {}

  ngOnInit() {
    // 检查是否已登录，如果没有则跳转到登录页
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.isLoading = true;
    const token = localStorage.getItem('access_token');
    
    this.http.post(`${environment.apiUrl}/api/v1/organizations/create`, this.formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // 保存新的 Token（包含 org_id）
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('organization_id', res.organization_id);
        
        // 设置组织上下文
        this.orgContext.setContext({
          id: res.organization_id,
          name: this.formData.name,
          type: this.formData.org_type as OrganizationType
        });
        
        this.snackBar.open('机构创建成功！正在进入管理后台...', '关闭', { duration: 3000 });
        setTimeout(() => {
          this.router.navigate(['/organization', res.organization_id]);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.detail || '创建失败，请稍后重试';
        this.snackBar.open(msg, '关闭', { panelClass: ['error-snackbar'] });
      }
    });
  }
}
