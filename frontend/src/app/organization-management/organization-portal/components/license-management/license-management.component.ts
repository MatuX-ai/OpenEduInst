import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface LicenseInfo {
  id: number;
  license_key: string;
  license_type: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  issued_at: string;
  expires_at: string;
  activated_at: string | null;
  max_users: number;
  max_devices: number;
  features: string[];
  notes: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  is_valid: boolean;
}

interface LicenseActivationResult {
  license: LicenseInfo;
  features: string[];
  max_users: number;
  max_devices: number;
  expires_at: string;
  days_until_expiry: number | null;
  license_type: string;
  already_activated: boolean;
  message: string;
}

interface MyFeaturesResult {
  org_id: number;
  features: string[];
  license_count: number;
  fetched_at: string;
}

@Component({
  selector: 'app-license-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="license-management-container">
      <header class="page-header">
        <div>
          <h1>许可证管理</h1>
          <p class="subtitle">激活许可证以解锁云托管专属功能模块</p>
        </div>
      </header>

      <!-- 当前可用功能 -->
      <mat-card class="features-card" aria-label="当前可用功能">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>verified_user</mat-icon>
            当前可用功能
            <span class="count-chip" *ngIf="myFeatures">
              {{ myFeatures.features.length }} 项
            </span>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingFeatures" class="loading-row">
            <mat-progress-spinner mode="indeterminate" diameter="24"></mat-progress-spinner>
            <span>加载中...</span>
          </div>
          <div *ngIf="!loadingFeatures && myFeatures && myFeatures.features.length > 0" class="features-list">
            <mat-chip *ngFor="let f of myFeatures.features" class="feature-chip" disableRipple>
              <mat-icon>check_circle</mat-icon>
              {{ getFeatureLabel(f) }}
            </mat-chip>
          </div>
          <div *ngIf="!loadingFeatures && myFeatures && myFeatures.features.length === 0" class="empty-state">
            <mat-icon>info</mat-icon>
            <span>尚未激活任何许可证，请输入密钥激活</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 激活表单 -->
      <mat-card class="activate-card" aria-label="许可证激活">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>vpn_key</mat-icon>
            激活新许可证
          </mat-card-title>
          <mat-card-subtitle>
            输入许可证密钥完成激活。密钥格式：OPENMT-XXXXXX-XXXX
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="activateLicense()" #activateForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>许可证密钥</mat-label>
              <input
                matInput
                type="text"
                [(ngModel)]="licenseKey"
                name="licenseKey"
                required
                minlength="10"
                placeholder="OPENMT-XXXXXXXX-XXXX"
                [disabled]="activating"
                aria-label="许可证密钥输入框"
                autocomplete="off"
              />
              <mat-icon matPrefix>key</mat-icon>
            </mat-form-field>

            <div class="actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!licenseKey || licenseKey.length < 10 || activating"
                aria-label="提交激活"
              >
                <mat-progress-spinner
                  *ngIf="activating"
                  mode="indeterminate"
                  diameter="18"
                  class="btn-spinner"
                ></mat-progress-spinner>
                <mat-icon *ngIf="!activating">play_arrow</mat-icon>
                立即激活
              </button>
              <button
                mat-stroked-button
                type="button"
                (click)="licenseKey = ''"
                [disabled]="activating"
                aria-label="清空输入"
              >
                <mat-icon>clear</mat-icon>
                清空
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- 已激活许可证列表 -->
      <mat-card class="licenses-card" aria-label="已激活许可证列表">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>list_alt</mat-icon>
            已激活许可证
            <span class="count-chip" *ngIf="licenses.length > 0">{{ licenses.length }} 张</span>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingLicenses" class="loading-row">
            <mat-progress-spinner mode="indeterminate" diameter="24"></mat-progress-spinner>
            <span>加载许可证列表...</span>
          </div>

          <div *ngIf="!loadingLicenses && licenses.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <span>暂无已激活的许可证</span>
          </div>

          <mat-accordion *ngIf="!loadingLicenses && licenses.length > 0" multi>
            <mat-expansion-panel
              *ngFor="let lic of licenses"
              class="license-panel"
              [class.expired]="lic.is_expired"
            >
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="status-icon" [class]="lic.status">
                    {{
                      lic.status === 'active' ? 'check_circle' :
                      lic.status === 'pending' ? 'hourglass_empty' :
                      lic.status === 'revoked' ? 'block' : 'history'
                    }}
                  </mat-icon>
                  <span class="license-key">{{ lic.license_key }}</span>
                </mat-panel-title>
                <mat-panel-description>
                  <span class="type-label">{{ getTypeLabel(lic.license_type) }}</span>
                  <span class="status-chip" [class]="lic.status">{{ getStatusText(lic.status) }}</span>
                  <span *ngIf="lic.days_until_expiry !== null && !lic.is_expired" class="days-info">
                    剩 {{ lic.days_until_expiry }} 天
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="license-details">
                <div class="detail-row">
                  <span class="label">生效时间</span>
                  <span class="value">{{ lic.activated_at | date:'yyyy-MM-dd HH:mm' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">到期时间</span>
                  <span class="value">{{ lic.expires_at | date:'yyyy-MM-dd HH:mm' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">用户上限</span>
                  <span class="value">{{ lic.max_users }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">设备上限</span>
                  <span class="value">{{ lic.max_devices }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="features-block">
                  <span class="label">解锁功能</span>
                  <div class="features-list">
                    <mat-chip
                      *ngFor="let f of lic.features"
                      class="feature-chip small"
                      disableRipple
                    >
                      <mat-icon>check</mat-icon>
                      {{ getFeatureLabel(f) }}
                    </mat-chip>
                    <span *ngIf="!lic.features || lic.features.length === 0" class="muted">
                      无附加功能
                    </span>
                  </div>
                </div>
                <div *ngIf="lic.notes" class="notes-block">
                  <span class="label">备注</span>
                  <span class="value">{{ lic.notes }}</span>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .license-management-container {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 24px;
      }
      .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #263238;
      }
      .subtitle {
        margin: 4px 0 0;
        color: #607d8b;
        font-size: 14px;
      }
      .features-card,
      .activate-card,
      .licenses-card {
        margin-bottom: 20px;
      }
      mat-card-title {
        display: flex !important;
        align-items: center;
        gap: 8px;
      }
      mat-card-title mat-icon {
        color: #1976d2;
      }
      .count-chip {
        margin-left: 8px;
        background: #e3f2fd;
        color: #1565c0;
        font-size: 12px;
        font-weight: 500;
        padding: 2px 10px;
        border-radius: 12px;
      }
      .loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px;
        color: #607d8b;
        justify-content: center;
      }
      .empty-state {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 24px;
        color: #607d8b;
        justify-content: center;
      }
      .empty-state mat-icon {
        opacity: 0.6;
      }
      .features-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 0;
      }
      .feature-chip {
        background: #e8f5e9 !important;
        color: #2e7d32 !important;
        font-size: 13px;
      }
      .feature-chip mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
      .feature-chip.small {
        font-size: 11px;
        padding: 2px 8px;
      }
      .feature-chip.small mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .full-width {
        width: 100%;
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-top: 8px;
      }
      .actions button mat-icon {
        margin-right: 4px;
      }
      .btn-spinner {
        margin-right: 6px;
        display: inline-block;
        vertical-align: middle;
      }
      .license-panel {
        margin-bottom: 8px;
      }
      .license-panel.expired {
        opacity: 0.7;
      }
      .status-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .status-icon.active {
        color: #2e7d32;
      }
      .status-icon.pending {
        color: #f57c00;
      }
      .status-icon.expired,
      .status-icon.revoked {
        color: #c62828;
      }
      .license-key {
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
      }
      .type-label {
        font-size: 12px;
        color: #607d8b;
        margin-right: 12px;
      }
      .status-chip {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 500;
      }
      .status-chip.active {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-chip.pending {
        background: #fff8e1;
        color: #f57c00;
      }
      .status-chip.expired,
      .status-chip.revoked {
        background: #ffebee;
        color: #c62828;
      }
      .days-info {
        font-size: 11px;
        color: #607d8b;
        margin-left: 8px;
      }
      .license-details {
        padding: 8px 0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;
      }
      .detail-row .label {
        color: #607d8b;
      }
      .detail-row .value {
        color: #263238;
        font-weight: 500;
      }
      .features-block,
      .notes-block {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .notes-block {
        background: #fafafa;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
      }
      .muted {
        color: #9e9e9e;
        font-size: 12px;
      }
      @media (max-width: 600px) {
        .license-management-container {
          padding: 16px;
        }
        .actions {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class LicenseManagementComponent implements OnInit {
  orgId!: number;
  licenseKey = '';
  activating = false;
  loadingLicenses = false;
  loadingFeatures = false;
  licenses: LicenseInfo[] = [];
  myFeatures: MyFeaturesResult | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    console.log('[LicenseManagement] orgId:', this.orgId);
    this.loadLicenses();
    this.loadFeatures();
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  loadLicenses(): void {
    this.loadingLicenses = true;
    this.http
      .get<LicenseInfo[]>(`${environment.apiUrl}/api/v1/licenses/my-active`, this.authHeaders)
      .subscribe({
        next: (data) => {
          this.licenses = data || [];
          this.loadingLicenses = false;
        },
        error: (err) => {
          console.error('加载许可证失败:', err);
          this.licenses = [];
          this.loadingLicenses = false;
        },
      });
  }

  loadFeatures(): void {
    this.loadingFeatures = true;
    this.http
      .get<MyFeaturesResult>(`${environment.apiUrl}/api/v1/licenses/my-features`, this.authHeaders)
      .subscribe({
        next: (data) => {
          this.myFeatures = data;
          this.loadingFeatures = false;
        },
        error: (err) => {
          console.error('加载 feature 列表失败:', err);
          this.myFeatures = { org_id: this.orgId, features: [], license_count: 0, fetched_at: new Date().toISOString() };
          this.loadingFeatures = false;
        },
      });
  }

  activateLicense(): void {
    if (!this.licenseKey || this.licenseKey.length < 10) {
      this.snackBar.open('请输入有效的许可证密钥（至少 10 个字符）', '关闭', { duration: 3000 });
      return;
    }

    this.activating = true;
    this.http
      .post<LicenseActivationResult>(
        `${environment.apiUrl}/api/v1/licenses/activate`,
        { license_key: this.licenseKey.trim() },
        this.authHeaders
      )
      .subscribe({
        next: (result) => {
          this.activating = false;
          if (result.already_activated) {
            this.snackBar.open(
              `该许可证已激活（${result.features.length} 项功能可用）`,
              '关闭',
              { duration: 3000, panelClass: ['info-snackbar'] }
            );
          } else {
            this.snackBar.open(
              `激活成功！解锁 ${result.features.length} 项功能，有效期 ${result.days_until_expiry ?? '?'} 天`,
              '关闭',
              { duration: 4000, panelClass: ['success-snackbar'] }
            );
          }
          this.licenseKey = '';
          this.loadLicenses();
          this.loadFeatures();
        },
        error: (err) => {
          this.activating = false;
          const status = err?.status;
          const detail = err?.error?.detail || '激活失败，请稍后重试';
          this.snackBar.open(detail, '关闭', {
            duration: 4000,
            panelClass: ['error-snackbar'],
          });
          console.error(`[License] activate failed (status=${status})`, err);
        },
      });
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      active: '已激活',
      pending: '待激活',
      expired: '已过期',
      revoked: '已撤销',
    };
    return map[status] || status;
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      open_source: '开源社区版',
      windows_local: 'Windows 本地版',
      cloud_hosted: '云托管版',
      trial: '试用版',
      commercial: '商业版',
      education: '教育版',
      enterprise: '企业定制版',
    };
    return map[type] || type;
  }

  getFeatureLabel(feature: string): string {
    const map: Record<string, string> = {
      ai_assistant: 'AI 助教',
      code_review: '代码审查',
      student_analysis: '学情分析',
      scheduling_suggest: '智能排课',
      cloud_backup: '云端备份',
      multi_tenant: '多租户管理',
      white_label: '白名单赛事',
      hardware_rental: '硬件租赁',
      advanced_reports: '高级报表',
      custom_branding: '定制品牌',
    };
    return map[feature] || feature;
  }
}
