import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DashboardMetrics {
  activeStudents: number;
  monthlyRevenue: string;
  courseCompletionRate: string;
}

@Component({
  selector: 'app-matux-core-metrics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="metrics-container">
      <mat-card class="metric-card primary">
        <mat-card-content>
          <div class="metric-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div class="metric-info">
            <h3>在训学员</h3>
            <div class="value">{{ metrics.activeStudents }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="metric-card revenue">
        <mat-card-content>
          <div class="metric-icon">
            <mat-icon>attach_money</mat-icon>
          </div>
          <div class="metric-info">
            <h3>本月营收</h3>
            <div class="value">{{ metrics.monthlyRevenue }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="metric-card rate">
        <mat-card-content>
          <div class="metric-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="metric-info">
            <h3>本月消课率</h3>
            <div class="value">{{ metrics.courseCompletionRate }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    @use '../../../../styles/design-tokens' as *;
    .metrics-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .metric-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      transition: transform 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-4px);
    }
    mat-card-content {
      display: flex;
      align-items: center;
      padding: 20px !important;
    }
    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: white;
    }
    .primary .metric-icon { background: linear-gradient(135deg, $color-brand-primary, $color-brand-primary-dark); }
    .revenue .metric-icon { background: linear-gradient(135deg, $color-stem-green, #00A84D); }
    .rate .metric-icon { background: linear-gradient(135deg, $color-warning, #E65C00); }
    .metric-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .metric-info h3 { margin: 0; font-size: $font-size-sm; color: $color-neutral-600; font-weight: 500; }
    .metric-info .value { font-size: 28px; font-weight: 700; color: $color-neutral-900; margin-top: 4px; }
  `]
})
export class MatuxCoreMetricsComponent {
  @Input() metrics: DashboardMetrics = { activeStudents: 0, monthlyRevenue: '¥0', courseCompletionRate: '0%' };
}
