import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxEchartsModule } from 'ngx-echarts';

import { InstitutionDashboardComponent } from './institution-dashboard.component';
import { InstitutionListComponent } from './institution-list.component';
import { InstitutionManagementRoutingModule } from './institution-management-routing.module';

/**
 * 阶段二 2.7：ECharts 按需加载（tree-shakable）
 * 只注册用到的图表/组件/渲染器，避免拉入完整 ~1MB echarts 包
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatBadgeModule,
    MatNativeDateModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts').then((m) => {
        // 仅注册必要模块：折线、柱状、饼图 + 标题/提示/网格/图例/工具箱 + Canvas 渲染
        m.use([
          // 图表
          ...(m as any).LineChart ? [(m as any).LineChart] : [],
          ...(m as any).BarChart ? [(m as any).BarChart] : [],
          ...(m as any).PieChart ? [(m as any).PieChart] : [],
          // 组件
          ...(m as any).TitleComponent ? [(m as any).TitleComponent] : [],
          ...(m as any).TooltipComponent ? [(m as any).TooltipComponent] : [],
          ...(m as any).GridComponent ? [(m as any).GridComponent] : [],
          ...(m as any).LegendComponent ? [(m as any).LegendComponent] : [],
          ...(m as any).ToolboxComponent ? [(m as any).ToolboxComponent] : [],
          // 渲染器
          ...(m as any).CanvasRenderer ? [(m as any).CanvasRenderer] : [],
        ]);
        return m;
      }),
    }),
    InstitutionManagementRoutingModule,
    InstitutionListComponent,
    InstitutionDashboardComponent,
  ],
})
export class InstitutionManagementModule {}
