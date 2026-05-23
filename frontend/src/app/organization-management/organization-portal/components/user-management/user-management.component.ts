import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="user-management-container">
      <h2>用户管理</h2>
      <p>用户管理功能开发中...</p>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 24px;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  orgId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.orgId = +this.route.parent?.snapshot.params['id'] || 0;
    console.log('[UserManagement] orgId:', this.orgId);
  }
}
