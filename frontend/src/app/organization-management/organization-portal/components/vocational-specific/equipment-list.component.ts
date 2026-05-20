import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  template: `
    <div class="equipment-container">
      <h2>实训设备管理</h2>
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="dataSource" class="full-width-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> 设备名称 </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <ng-container matColumnDef="model">
              <th mat-header-cell *matHeaderCellDef> 型号 </th>
              <td mat-cell *matCellDef="let element"> {{element.model}} </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef> 状态 </th>
              <td mat-cell *matCellDef="let element"> 
                <span [class.available]="element.status === 'available'">{{element.status}}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .equipment-container { padding: 20px; }
    .full-width-table { width: 100%; }
    .available { color: green; font-weight: bold; }
  `]
})
export class EquipmentListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'model', 'status'];
  dataSource = [
    { name: '工业机器人 A6', model: 'ABB-IRB6700', status: 'available' },
    { name: '3D 打印机', model: 'Ultimaker S5', status: 'in_use' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
