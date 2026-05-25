import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <h1>系统设置</h1>
        <p class="subtitle">配置机构基本信息、功能开关和系统参数</p>
      </div>
      
      <div class="content">
        <mat-card>
          <mat-card-content>
            <p>系统设置功能开发中...</p>
            <p class="hint">即将支持：机构信息、通知设置、安全配置等功能</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
    }
    
    .page-header {
      margin-bottom: 24px;
    }
    
    .page-header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 8px 0;
    }
    
    .subtitle {
      font-size: 14px;
      color: #64748B;
      margin: 0;
    }
    
    .content {
      max-width: 800px;
    }
    
    mat-card {
      padding: 24px;
    }
    
    .hint {
      color: #94A3B8;
      font-size: 13px;
      margin-top: 8px;
    }
  `]
})
export class SystemSettingsComponent {}
