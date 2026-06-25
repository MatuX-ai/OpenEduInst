import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import {
  FeatureManagementService,
  OrgFeatureFlag,
  FeatureChangeLogEntry,
  ApiResponse,
  FeatureConfigResponse,
} from '../../../../core/services/feature-management.service';

interface FeatureGroup {
  category: string;
  label: string;
  icon: string;
  features: OrgFeatureFlag[];
  expanded: boolean;
  allSelected: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  academic: { label: '教务管理', icon: 'school' },
  marketing: { label: '招生与营销', icon: 'campaign' },
  finance: { label: '财务与资产', icon: 'account_balance_wallet' },
  asset: { label: '资产管理', icon: 'inventory_2' },
  communication: { label: '沟通协作', icon: 'chat' },
  stem: { label: 'STEM 教育', icon: 'stadia_controller' },
  exam: { label: '考试管理', icon: 'quiz' },
  vocational: { label: '职业教育', icon: 'handyman' },
  system: { label: '系统设置', icon: 'settings' },
  other: { label: '其他', icon: 'more_horiz' },
};

@Component({
  selector: 'app-feature-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  template: `
    <div class="feature-container">
      <div class="page-header">
        <div class="header-left">
          <h1>功能管理</h1>
          <p class="subtitle">根据机构规模和业务需求，自定义启用或禁用系统功能模块。禁用后，相关功能入口将隐藏，API 接口将返回权限错误。</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button color="warn" (click)="resetToDefault()" [disabled]="loading">
            <mat-icon>restart_alt</mat-icon> 重置默认
          </button>
        </div>
      </div>

      <mat-tab-group color="primary" class="feature-tabs" [(selectedIndex)]="activeTab">
        <!-- 功能配置标签页 -->
        <mat-tab label="功能管理">
          <div class="tab-content">

            <!-- 加载中 -->
            <div class="loading-container" *ngIf="loading">
              <mat-spinner diameter="40"></mat-spinner>
              <span>加载功能配置…</span>
            </div>

            <ng-container *ngIf="!loading">
              <!-- 批量操作工具栏 -->
              <div class="batch-toolbar" *ngIf="hasSelection()">
                <div class="batch-info">
                  <mat-icon>checklist</mat-icon>
                  <span>已选择 {{ getSelectedCount() }} 个功能</span>
                </div>
                <div class="batch-actions">
                  <mat-form-field appearance="outline" class="batch-note-field">
                    <mat-label>操作备注（可选）</mat-label>
                    <input matInput [(ngModel)]="batchNote" placeholder="例如：学期初批量配置" />
                  </mat-form-field>
                  <button mat-flat-button color="primary" (click)="batchEnable()" [disabled]="batchProcessing">
                    <mat-icon>check_circle</mat-icon> 批量启用
                  </button>
                  <button mat-flat-button color="warn" (click)="batchDisable()" [disabled]="batchProcessing">
                    <mat-icon>cancel</mat-icon> 批量禁用
                  </button>
                  <button mat-stroked-button (click)="clearSelection()">
                    <mat-icon>close</mat-icon> 取消选择
                  </button>
                </div>
              </div>

              <!-- 功能分组列表 -->
              <div class="feature-groups" *ngIf="featureGroups.length > 0; else emptyState">
                <mat-card *ngFor="let group of featureGroups" class="feature-group-card">
                  <mat-card-header (click)="group.expanded = !group.expanded" class="group-header">
                    <mat-icon mat-card-avatar>{{ group.icon }}</mat-icon>
                    <mat-card-title>
                      <mat-checkbox [checked]="group.allSelected" [indeterminate]="isGroupIndeterminate(group)"
                                    (click)="$event.stopPropagation()"
                                    (change)="toggleGroupSelection(group, $event.checked)">
                      </mat-checkbox>
                      {{ group.label }}
                    </mat-card-title>
                    <mat-card-subtitle>{{ group.features.length }} 个功能模块</mat-card-subtitle>
                    <mat-icon class="expand-icon" [class.expanded]="group.expanded">
                      {{ group.expanded ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </mat-card-header>
                  <mat-divider></mat-divider>

                  <div class="feature-list" *ngIf="group.expanded">
                    <div class="feature-item" *ngFor="let feature of group.features">
                      <div class="feature-info">
                        <mat-checkbox [checked]="isSelected(feature.feature_id)"
                                     (change)="toggleFeatureSelection(feature.feature_id, $event.checked)">
                        </mat-checkbox>
                        <mat-icon class="feature-icon">{{ feature.icon || 'settings' }}</mat-icon>
                        <div class="feature-detail">
                          <span class="feature-name">{{ feature.display_name }}</span>
                          <span class="feature-desc">{{ feature.description }}</span>
                          <span class="feature-deps" *ngIf="feature.dependencies && feature.dependencies.length > 0">
                            依赖功能：{{ getDependencyNames(feature.dependencies) }}
                          </span>
                        </div>
                      </div>
                      <div class="feature-controls">
                        <div class="feature-status" [class.status-disabled]="!feature.is_enabled">
                          <span class="status-dot" [class.dot-enabled]="feature.is_enabled" [class.dot-disabled]="!feature.is_enabled"></span>
                          {{ feature.is_enabled ? '已启用' : '已禁用' }}
                        </div>
                        <div class="toggle-spinner" *ngIf="togglingFeatures.has(feature.feature_id)">
                          <mat-spinner diameter="16"></mat-spinner>
                        </div>
                        <mat-slide-toggle
                          [checked]="feature.is_enabled"
                          (change)="toggleFeature(feature)"
                          color="primary">
                        </mat-slide-toggle>
                      </div>
                    </div>
                  </div>
                </mat-card>
              </div>

              <ng-template #emptyState>
                <mat-card class="empty-card">
                  <mat-card-content>
                    <mat-icon class="empty-icon">toggle_off</mat-icon>
                    <p>暂无可配置的功能模块</p>
                  </mat-card-content>
                </mat-card>
              </ng-template>
            </ng-container>
          </div>
        </mat-tab>

        <!-- 变更历史标签页 -->
        <mat-tab label="变更历史">
          <div class="tab-content">
            <div class="loading-container" *ngIf="historyLoading">
              <mat-spinner diameter="40"></mat-spinner>
              <span>加载变更历史…</span>
            </div>

            <ng-container *ngIf="!historyLoading">
              <div class="history-actions">
                <button mat-stroked-button (click)="refreshHistory()">
                  <mat-icon>refresh</mat-icon> 刷新
                </button>
              </div>

              <mat-card class="history-card" *ngIf="historyItems.length > 0; else noHistory">
                <div class="history-list">
                  <div class="history-item" *ngFor="let item of historyItems">
                    <div class="history-header">
                      <mat-icon class="history-type-icon" [class.icon-rollback]="item.change_type === 'rollback'"
                                                       [class.icon-batch]="item.change_type === 'batch_toggle'"
                                                       [class.icon-toggle]="item.change_type === 'toggle'">
                        {{ item.change_type === 'rollback' ? 'undo' : item.change_type === 'batch_toggle' ? 'multiple_stop' : 'toggle_on' }}
                      </mat-icon>
                      <div class="history-info">
                        <span class="history-type-badge" [class.badge-rollback]="item.change_type === 'rollback'"
                                                       [class.batch-toggle]="item.change_type === 'batch_toggle'"
                                                       [class.single-toggle]="item.change_type === 'toggle'">
                          {{ item.change_type === 'rollback' ? '回滚' : item.change_type === 'batch_toggle' ? '批量操作' : '单次切换' }}
                        </span>
                        <span class="history-detail">{{ item.change_detail }}</span>
                        <span class="history-meta">
                          操作人：{{ item.operated_by_name || '系统' }} · {{ item.created_at | date:'yyyy-MM-dd HH:mm:ss' }}
                        </span>
                      </div>
                    </div>
                    <div class="history-actions-right">
                      <button mat-stroked-button color="primary" (click)="rollbackHistory(item)" [disabled]="rollbackProcessing.has(item.id)">
                        <mat-icon>undo</mat-icon> 回滚到此版本
                      </button>
                    </div>
                  </div>
                </div>

                <mat-paginator
                  [length]="historyTotal"
                  [pageSize]="historyPageSize"
                  [pageIndex]="historyPage - 1"
                  (page)="onHistoryPageChange($event)"
                  showFirstLastButtons
                  class="history-paginator">
                </mat-paginator>
              </mat-card>

              <ng-template #noHistory>
                <mat-card class="empty-card">
                  <mat-card-content>
                    <mat-icon class="empty-icon">history</mat-icon>
                    <p>暂无变更记录</p>
                  </mat-card-content>
                </mat-card>
              </ng-template>
            </ng-container>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    .feature-container { padding: 24px; background: #F1F5F9; min-height: calc(100vh - 100px); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px;
    }
    .header-left h1 { font-size: 24px; font-weight: 600; color: #0F172A; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #64748B; margin: 0; max-width: 700px; line-height: 1.5; }
    .header-actions { display: flex; gap: 8px; }

    .feature-tabs { max-width: 1000px; }
    .tab-content { padding: 24px 0; }

    .loading-container {
      display: flex; align-items: center; gap: 12px; padding: 48px;
      justify-content: center; color: #64748B;
    }

    /* 批量工具栏 */
    .batch-toolbar {
      background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 20px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    }
    .batch-info { display: flex; align-items: center; gap: 8px; color: #1D4ED8; font-size: 14px; font-weight: 500; }
    .batch-info mat-icon { color: #3B82F6; }
    .batch-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .batch-note-field { width: 200px; margin-bottom: 0; }
    .batch-note-field .mat-form-field-wrapper { margin: 0; padding: 0; }

    /* 功能分组卡片 */
    .feature-group-card {
      margin-bottom: 16px;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
    }

    .group-header {
      cursor: pointer; padding: 16px 20px;
      display: flex; align-items: center;
    }
    .group-header:hover { background: #F8FAFC; }

    .group-header mat-card-title {
      display: flex; align-items: center; gap: 12px;
      font-size: 15px; font-weight: 600; color: #1E293B;
    }
    .group-header mat-card-subtitle { font-size: 12px; color: #64748B; }
    .expand-icon {
      margin-left: auto; transition: transform 0.2s; color: #64748B; cursor: pointer;
    }
    .expand-icon.expanded { transform: rotate(180deg); }

    mat-card-avatar {
      width: 32px !important; height: 32px !important;
      background: #EFF6FF !important; border-radius: 8px !important;
    }
    mat-card-avatar mat-icon { font-size: 16px !important; color: #3B82F6 !important; margin: 8px; }

    .feature-list { padding: 0 20px 12px; }

    .feature-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #F1F5F9;
    }
    .feature-item:last-child { border-bottom: none; }

    .feature-info {
      display: flex; align-items: center; gap: 12px; flex: 1;
    }
    .feature-icon {
      width: 20px !important; height: 20px !important;
      font-size: 20px !important; color: #64748B;
    }
    .feature-detail { display: flex; flex-direction: column; }
    .feature-name { font-size: 14px; font-weight: 500; color: #0F172A; }
    .feature-desc { font-size: 12px; color: #64748B; margin-top: 2px; }
    .feature-deps { font-size: 11px; color: #F59E0B; margin-top: 2px; }

    .feature-controls { display: flex; align-items: center; gap: 12px; }

    .feature-status {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #059669; font-weight: 500; min-width: 56px;
    }
    .feature-status.status-disabled { color: #DC2626; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .dot-enabled { background: #10B981; }
    .dot-disabled { background: #EF4444; }

    .toggle-spinner { width: 16px; height: 16px; }

    /* 变更历史 */
    .history-card { background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; }
    .history-actions { margin-bottom: 16px; }
    .history-list { padding: 0; }

    .history-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #F1F5F9;
    }
    .history-item:last-child { border-bottom: none; }

    .history-header { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
    .history-type-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; margin-top: 2px; }
    .icon-rollback { color: #8B5CF6; }
    .icon-batch { color: #3B82F6; }
    .icon-toggle { color: #10B981; }

    .history-info { display: flex; flex-direction: column; }
    .history-type-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 600; width: fit-content; margin-bottom: 4px;
      background: #F1F5F9; color: #475569;
    }
    .badge-rollback { background: #F3E8FF; color: #7C3AED; }
    .batch-toggle { background: #DBEAFE; color: #1D4ED8; }
    .single-toggle { background: #D1FAE5; color: #059669; }

    .history-detail { font-size: 13px; color: #1E293B; }
    .history-meta { font-size: 11px; color: #94A3B8; margin-top: 4px; }

    .history-actions-right { margin-left: 16px; }

    .history-paginator { border-top: 1px solid #F1F5F9; }

    /* 空状态 */
    .empty-card { text-align: center; padding: 48px; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; }
    .empty-icon { font-size: 48px !important; width: 48px !important; height: 48px !important; color: #CBD5E1; margin-bottom: 12px; }
    .empty-card p { color: #64748B; font-size: 14px; margin: 0; }
  `]
})
export class FeatureManagementComponent implements OnInit {
  loading = false;
  historyLoading = false;
  activeTab = 0;

  featureGroups: FeatureGroup[] = [];
  selectedFeatureIds: Set<number> = new Set();
  togglingFeatures: Set<number> = new Set();
  batchNote = '';
  batchProcessing = false;

  historyItems: FeatureChangeLogEntry[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyPageSize = 20;
  rollbackProcessing: Set<number> = new Set();

  private flagMap = new Map<number, OrgFeatureFlag>();

  constructor(
    private featureService: FeatureManagementService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.featureService.getConfig().subscribe({
      next: (res: ApiResponse<FeatureConfigResponse>) => {
        if (res.success && res.data) {
          this.buildFeatureGroups(res.data.org_flags);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('无法加载功能配置', '关闭', { duration: 3000 });
      },
    });
  }

  private buildFeatureGroups(orgFlags: OrgFeatureFlag[]): void {
    this.flagMap.clear();
    const groups = new Map<string, OrgFeatureFlag[]>();

    for (const flag of orgFlags) {
      this.flagMap.set(flag.feature_id, flag);
      const cat = flag.category || 'other';
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(flag);
    }

    this.featureGroups = [];
    const categoryOrder = ['academic', 'marketing', 'finance', 'asset', 'communication', 'stem', 'exam', 'vocational', 'system', 'other'];

    for (const cat of categoryOrder) {
      const features = groups.get(cat);
      if (features && features.length > 0) {
        const catInfo = CATEGORY_MAP[cat] || { label: cat, icon: 'settings' };
        features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        this.featureGroups.push({
          category: cat,
          label: catInfo.label,
          icon: catInfo.icon,
          features: features,
          expanded: cat === 'academic',
          allSelected: features.every(f => f.is_enabled),
        });
      }
    }
  }

  getDependencyNames(deps: string[]): string {
    if (!deps || deps.length === 0) return '';
    const names: string[] = [];
    for (const flag of this.flagMap.values()) {
      if (deps.includes(flag.feature_key)) {
        names.push(flag.display_name);
      }
    }
    return names.join('、') || deps.join(', ');
  }

  // ===== 选择逻辑 =====
  hasSelection(): boolean {
    return this.selectedFeatureIds.size > 0;
  }

  getSelectedCount(): number {
    return this.selectedFeatureIds.size;
  }

  isSelected(featureId: number): boolean {
    return this.selectedFeatureIds.has(featureId);
  }

  toggleFeatureSelection(featureId: number, checked: boolean): void {
    if (checked) {
      this.selectedFeatureIds.add(featureId);
    } else {
      this.selectedFeatureIds.delete(featureId);
    }
  }

  toggleGroupSelection(group: FeatureGroup, checked: boolean): void {
    for (const f of group.features) {
      if (checked) {
        this.selectedFeatureIds.add(f.feature_id);
      } else {
        this.selectedFeatureIds.delete(f.feature_id);
      }
    }
  }

  isGroupIndeterminate(group: FeatureGroup): boolean {
    const selected = group.features.filter(f => this.selectedFeatureIds.has(f.feature_id)).length;
    return selected > 0 && selected < group.features.length;
  }

  clearSelection(): void {
    this.selectedFeatureIds.clear();
    this.batchNote = '';
  }

  // ===== 切换功能 =====
  toggleFeature(feature: OrgFeatureFlag): void {
    const newState = !feature.is_enabled;
    this.togglingFeatures.add(feature.feature_id);

    this.featureService.toggleFeature(feature.feature_id, newState).subscribe({
      next: (res: ApiResponse<FeatureConfigResponse>) => {
        if (res.success) {
          this.buildFeatureGroups(res.data.org_flags);
          this.snackBar.open(res.message || '功能状态已更新', '关闭', { duration: 2000 });
        }
        this.togglingFeatures.delete(feature.feature_id);
      },
      error: (err: HttpErrorResponse) => {
        this.togglingFeatures.delete(feature.feature_id);
        const msg = err?.error?.error?.message || err?.error?.detail || '操作失败';
        this.snackBar.open(msg, '关闭', { duration: 3000 });
      },
    });
  }

  // ===== 批量操作 =====
  batchEnable(): void {
    this.doBatchToggle(true);
  }

  batchDisable(): void {
    this.doBatchToggle(false);
  }

  private doBatchToggle(isEnabled: boolean): void {
    const toggles = Array.from(this.selectedFeatureIds).map(id => ({
      feature_id: id,
      is_enabled: isEnabled,
    }));

    this.batchProcessing = true;
    this.featureService.batchToggle(toggles, this.batchNote).subscribe({
      next: (res: ApiResponse<FeatureConfigResponse>) => {
        if (res.success) {
          this.buildFeatureGroups(res.data.org_flags);
          this.clearSelection();
          this.snackBar.open(res.message, '关闭', { duration: 2000 });
        }
        this.batchProcessing = false;
      },
      error: () => {
        this.batchProcessing = false;
        this.snackBar.open('批量操作失败', '关闭', { duration: 3000 });
      },
    });
  }

  // ===== 重置 =====
  resetToDefault(): void {
    if (!confirm('确定要重置所有功能配置为默认状态吗？此操作不可撤销。')) {
      return;
    }

    this.loading = true;
    this.featureService.resetToDefault().subscribe({
      next: (res: ApiResponse<FeatureConfigResponse>) => {
        if (res.success) {
          this.buildFeatureGroups(res.data.org_flags);
          this.snackBar.open('已重置为默认配置', '关闭', { duration: 2000 });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('重置失败', '关闭', { duration: 3000 });
      },
    });
  }

  // ===== 变更历史 =====
  loadHistory(): void {
    this.historyLoading = true;
    this.featureService.getChangeHistory(this.historyPage, this.historyPageSize).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.historyItems = res.data.items;
          this.historyTotal = res.data.total;
        }
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
        this.snackBar.open('无法加载变更历史', '关闭', { duration: 3000 });
      },
    });
  }

  refreshHistory(): void {
    this.historyPage = 1;
    this.loadHistory();
  }

  onHistoryPageChange(event: PageEvent): void {
    this.historyPage = event.pageIndex + 1;
    this.historyPageSize = event.pageSize;
    this.loadHistory();
  }

  rollbackHistory(item: FeatureChangeLogEntry): void {
    if (!confirm(`确定要回滚到此版本的配置吗？（变更：${item.change_detail}）`)) {
      return;
    }

    this.rollbackProcessing.add(item.id);
    this.featureService.rollback(item.id).subscribe({
      next: (res: ApiResponse<FeatureConfigResponse>) => {
        if (res.success) {
          this.buildFeatureGroups(res.data.org_flags);
          this.snackBar.open('功能配置已回滚', '关闭', { duration: 2000 });
          this.loadHistory();
        }
        this.rollbackProcessing.delete(item.id);
      },
      error: () => {
        this.rollbackProcessing.delete(item.id);
        this.snackBar.open('回滚失败', '关闭', { duration: 3000 });
      },
    });
  }
}