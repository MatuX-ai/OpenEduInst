import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocCertificate } from '../../../../services/vocational.service';

@Component({
  selector: 'app-certificate-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>verified</mat-icon> 证书管理</h2>
        <span class="badge">{{ certificates.length }} 个证书</span>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="certificates" class="data-table">
            <ng-container matColumnDef="cert_name">
              <th mat-header-cell *matHeaderCellDef>证书名称</th>
              <td mat-cell *matCellDef="let c">{{ c.cert_name }}</td>
            </ng-container>
            <ng-container matColumnDef="student_name">
              <th mat-header-cell *matHeaderCellDef>学生姓名</th>
              <td mat-cell *matCellDef="let c">{{ c.student_name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="cert_number">
              <th mat-header-cell *matHeaderCellDef>证书编号</th>
              <td mat-cell *matCellDef="let c">{{ c.cert_number || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="cert_level">
              <th mat-header-cell *matHeaderCellDef>等级</th>
              <td mat-cell *matCellDef="let c">{{ c.cert_level || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="issuing_authority">
              <th mat-header-cell *matHeaderCellDef>发证机构</th>
              <td mat-cell *matCellDef="let c">{{ c.issuing_authority || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="issue_date">
              <th mat-header-cell *matHeaderCellDef>发证日期</th>
              <td mat-cell *matCellDef="let c">{{ c.issue_date || '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <div *ngIf="certificates.length === 0" class="empty">暂无证书记录</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .badge { background: #f3e5f5; color: #7b1fa2; padding: 4px 12px; border-radius: 12px; font-size: 13px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class CertificateManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  certificates: VocCertificate[] = [];
  columns = ['cert_name', 'student_name', 'cert_number', 'cert_level', 'issuing_authority', 'issue_date'];
  ngOnInit() { this.vocService.getCertificates().subscribe(data => this.certificates = data); }
}