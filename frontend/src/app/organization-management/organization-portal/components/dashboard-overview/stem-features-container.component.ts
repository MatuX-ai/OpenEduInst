import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

// Import all STEM feature components from the new modular directory
import { HardwareManagementComponent } from '../../../../features/stem-cloud/hardware-management.component';
import { TokenManagementComponent } from '../../../../features/stem-cloud/token-management.component';
import { ProjectManagementComponent } from '../../../../features/stem-cloud/project-management.component';
import { SpaceSchedulingComponent } from '../../../../features/stem-cloud/space-scheduling.component';

@Component({
  selector: 'app-stem-features-container',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatExpansionModule,
    HardwareManagementComponent,
    TokenManagementComponent,
    ProjectManagementComponent,
    SpaceSchedulingComponent
  ],
  template: `
    <div class="stem-features-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>STEM 教育中心管理</h1>
          <p class="subtitle">硬件管理 · Token计费 · 项目管理 · 空间调度</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="硬件设备管理">
          <ng-template matTabContent>
            <app-hardware-management></app-hardware-management>
          </ng-template>
        </mat-tab>
        
        <mat-tab label="Token 计费管理">
          <ng-template matTabContent>
            <app-token-management></app-token-management>
          </ng-template>
        </mat-tab>
        
        <mat-tab label="实验项目跟踪">
          <ng-template matTabContent>
            <app-project-management></app-project-management>
          </ng-template>
        </mat-tab>
        
        <mat-tab label="创客空间预约">
          <ng-template matTabContent>
            <app-space-scheduling></app-space-scheduling>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    .stem-features-container {
      padding: 24px;
      background: $color-neutral-50;
      color: $color-neutral-700;
      min-height: 100%;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 20px;
      border-bottom: 1px solid $color-neutral-200;
      padding-bottom: 16px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: $color-neutral-900;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: $color-neutral-500;
      font-size: 14px;
    }

    /* Tab Group Styling - Light Mode */
    ::ng-deep .mat-mdc-tab-group {
      background: transparent;
    }

    ::ng-deep .mat-mdc-tab-header {
      background: $card-bg;
      border-radius: $radius-lg $radius-lg 0 0;
      border: $card-border;
      border-bottom: none;
    }

    ::ng-deep .mat-mdc-tab-label {
      color: $color-neutral-500 !important;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-tab-label.mat-mdc-tab-active {
      color: $color-brand-primary !important;
    }

    ::ng-deep .mat-mdc-ink-bar {
      background-color: $color-brand-primary !important;
      height: 2px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      background: $card-bg;
      border-radius: 0 0 $radius-lg $radius-lg;
      border: $card-border;
      border-top: none;
    }
  `]
})
export class StemFeaturesContainerComponent implements OnInit {
  selectedTabIndex = 0;

  constructor() {}

  ngOnInit(): void {}

  onTabChange(index: number): void {
    console.log('Tab changed to:', index);
    // You can add additional logic here when tab changes
  }
}