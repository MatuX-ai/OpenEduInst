import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VocationalService, VocTrainingRoom, VocRoomUtilization } from '../../../../services/vocational.service';

@Component({
  selector: 'app-room-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2><mat-icon>meeting_room</mat-icon> 实训室管理</h2>
      </div>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>实训室列表</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="rooms" class="data-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>实训室名称</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="building">
              <th mat-header-cell *matHeaderCellDef>所在楼栋</th>
              <td mat-cell *matCellDef="let r">{{ r.building || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>容量(人)</th>
              <td mat-cell *matCellDef="let r">{{ r.capacity || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="room_type">
              <th mat-header-cell *matHeaderCellDef>类型</th>
              <td mat-cell *matCellDef="let r">{{ r.room_type || '-' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="roomColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: roomColumns;"></tr>
          </table>
          <div *ngIf="rooms.length === 0" class="empty">暂无实训室</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>利用率分析</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="utilizations" class="data-table">
            <ng-container matColumnDef="room_name">
              <th mat-header-cell *matHeaderCellDef>实训室</th>
              <td mat-cell *matCellDef="let u">{{ u.room_name }}</td>
            </ng-container>
            <ng-container matColumnDef="used_slots">
              <th mat-header-cell *matHeaderCellDef>已用时隙</th>
              <td mat-cell *matCellDef="let u">{{ u.used_slots }}</td>
            </ng-container>
            <ng-container matColumnDef="total_slots">
              <th mat-header-cell *matHeaderCellDef>总时隙</th>
              <td mat-cell *matCellDef="let u">{{ u.total_slots }}</td>
            </ng-container>
            <ng-container matColumnDef="utilization_rate">
              <th mat-header-cell *matHeaderCellDef>利用率</th>
              <td mat-cell *matCellDef="let u">{{ u.utilization_rate }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="utilColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: utilColumns;"></tr>
          </table>
          <div *ngIf="utilizations.length === 0" class="empty">暂无利用率数据</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px; }
    .page-header { margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
    .section-card { margin-bottom: 16px; }
    .data-table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `]
})
export class RoomManagementComponent implements OnInit {
  private vocService = inject(VocationalService);
  rooms: VocTrainingRoom[] = [];
  utilizations: VocRoomUtilization[] = [];
  roomColumns = ['name', 'building', 'capacity', 'room_type'];
  utilColumns = ['room_name', 'used_slots', 'total_slots', 'utilization_rate'];
  ngOnInit() {
    this.vocService.getRooms().subscribe(data => this.rooms = data);
    this.vocService.getRoomUtilization().subscribe(data => this.utilizations = data);
  }
}