import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { BureauService } from '../../services/bureau.service';

@Component({
  selector: 'app-bureau-layout',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatTabsModule,
    MatTableModule, MatChipsModule, MatProgressBarModule, MatBadgeModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatSnackBarModule,
    MatListModule, MatDividerModule,
  ],
  template: `
    <div class="bureau-layout">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>
            <mat-icon>account_balance</mat-icon>
            教育局 STEM 教育监管平台
          </h1>
          <p class="subtitle">全区 STEM 教育质量监测 · 资源统筹 · 决策支持</p>
        </div>
        <div class="header-actions">
          <mat-chip *ngIf="isBureauUser" color="primary" selected>
            <mat-icon>verified</mat-icon> 教育局管理员
          </mat-chip>
          <span class="org-name">{{ bureauName }}</span>
        </div>
      </div>

      <!-- Main Tabs -->
      <mat-tab-group [(selectedIndex)]="selectedTabIndex" animationDuration="300ms" (selectedIndexChange)="onTabChange($event)">
        <!-- Tab 1: 数据总览 -->
        <mat-tab label="数据总览">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="kpi-grid">
                <mat-card class="kpi-card"><mat-card-content>
                  <div class="kpi-icon blue"><mat-icon>school</mat-icon></div>
                  <div class="kpi-value">{{ stats.totalSchools }}</div>
                  <div class="kpi-label">管辖学校</div>
                  <div class="kpi-trend up">{{ stats.trends?.schoolsChange || '+0%' }}</div>
                </mat-card-content></mat-card>
                <mat-card class="kpi-card"><mat-card-content>
                  <div class="kpi-icon green"><mat-icon>people</mat-icon></div>
                  <div class="kpi-value">{{ stats.totalStemStudents }}</div>
                  <div class="kpi-label">STEM 学生数</div>
                </mat-card-content></mat-card>
                <mat-card class="kpi-card"><mat-card-content>
                  <div class="kpi-icon orange"><mat-icon>badge</mat-icon></div>
                  <div class="kpi-value">{{ stats.totalStemTeachers }}</div>
                  <div class="kpi-label">STEM 教师数</div>
                </mat-card-content></mat-card>
                <mat-card class="kpi-card"><mat-card-content>
                  <div class="kpi-icon purple"><mat-icon>donut_large</mat-icon></div>
                  <div class="kpi-value">{{ stats.stemCoverageRate }}%</div>
                  <div class="kpi-label">STEM 覆盖率</div>
                </mat-card-content></mat-card>
                <mat-card class="kpi-card"><mat-card-content>
                  <div class="kpi-icon cyan"><mat-icon>compare_arrows</mat-icon></div>
                  <div class="kpi-value">{{ stats.crossSchoolSharingCount }}</div>
                  <div class="kpi-label">跨校共享次数</div>
                </mat-card-content></mat-card>
                <mat-card class="kpi-card" [class.warn]="stats.weakSchoolCount > 0"><mat-card-content>
                  <div class="kpi-icon red"><mat-icon>warning</mat-icon></div>
                  <div class="kpi-value">{{ stats.weakSchoolCount }}</div>
                  <div class="kpi-label">薄弱学校</div>
                </mat-card-content></mat-card>
              </div>

              <!-- Coverage Trend & Distribution -->
              <div class="charts-row">
                <mat-card class="chart-card">
                  <mat-card-header><mat-card-title>STEM 覆盖率趋势</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="trend-bars">
                      <div class="bar-item" *ngFor="let t of coverageTrend">
                        <span class="bar-label">{{ t.month }}</span>
                        <div class="bar-track">
                          <div class="bar-fill" [style.width.%]="t.rate" [class.above-target]="t.rate >= t.target"></div>
                        </div>
                        <span class="bar-value">{{ t.rate }}%</span>
                        <span class="bar-target" *ngIf="t.rate < t.target">目标{{ t.target }}%</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="chart-card">
                  <mat-card-header><mat-card-title>学校类型分布</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="dist-list">
                      <div class="dist-item" *ngFor="let d of schoolDistribution">
                        <span class="dist-name">{{ d.name }}</span>
                        <div class="dist-bar-track">
                          <div class="dist-bar-fill" [style.width.%]="(d.value / totalSchoolsDist) * 100"></div>
                        </div>
                        <span class="dist-value">{{ d.value }}所</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Weak Alerts -->
              <mat-card class="alert-card" *ngIf="weakAlerts.length > 0">
                <mat-card-header>
                  <mat-card-title><mat-icon color="warn">notification_important</mat-icon> 薄弱校预警</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="alert-item" *ngFor="let a of weakAlerts">
                    <mat-icon class="alert-icon">error_outline</mat-icon>
                    <div class="alert-info">
                      <strong>{{ a.name }}</strong>
                      <span>评分 {{ a.stemScore }} · 设备{{ a.equipmentStatus }}</span>
                    </div>
                    <span class="alert-suggestion">{{ a.suggestion }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Quick Links -->
              <mat-card class="quick-links">
                <mat-card-header><mat-card-title>快捷入口</mat-card-title></mat-card-header>
                <mat-card-content>
                  <div class="quick-grid">
                    <div class="quick-item" (click)="selectedTabIndex = 3">
                      <mat-icon>devices</mat-icon>
                      <span>设备调配</span>
                      <mat-chip *ngIf="quickLinks.equipment?.pendingRequests" color="warn" selected>
                        {{ quickLinks.equipment.pendingRequests }} 待审批
                      </mat-chip>
                    </div>
                    <div class="quick-item" (click)="selectedTabIndex = 4">
                      <mat-icon>school</mat-icon>
                      <span>师资培训</span>
                      <mat-chip *ngIf="quickLinks.training?.activeSessions" color="primary" selected>
                        {{ quickLinks.training.activeSessions }} 进行中
                      </mat-chip>
                    </div>
                    <div class="quick-item" (click)="selectedTabIndex = 5">
                      <mat-icon>emoji_events</mat-icon>
                      <span>竞赛组织</span>
                    </div>
                    <div class="quick-item" (click)="selectedTabIndex = 7">
                      <mat-icon>library_books</mat-icon>
                      <span>课程共享</span>
                      <mat-chip *ngIf="quickLinks.curriculum?.pendingReviews" color="accent" selected>
                        {{ quickLinks.curriculum.pendingReviews }} 待审核
                      </mat-chip>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 2: 学校监管 -->
        <mat-tab label="学校监管">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="toolbar">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>评级筛选</mat-label>
                  <mat-select [(ngModel)]="schoolFilter.rating" (selectionChange)="loadSchools()">
                    <mat-option value="">全部</mat-option>
                    <mat-option value="优秀">优秀</mat-option>
                    <mat-option value="良好">良好</mat-option>
                    <mat-option value="待提升">待提升</mat-option>
                    <mat-option value="薄弱">薄弱</mat-option>
                  </mat-select>
                </mat-form-field>
                <span class="toolbar-info">共 {{ schools.length }} 所学校</span>
              </div>
              <table mat-table [dataSource]="schools" class="data-table">
                <ng-container matColumnDef="rank"><th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let s; let i = index">{{ i + 1 }}</td></ng-container>
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>学校名称</th>
                  <td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container>
                <ng-container matColumnDef="stemScore"><th mat-header-cell *matHeaderCellDef>STEM评分</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="score-badge" [class.high]="s.stemScore >= 85" [class.mid]="s.stemScore >= 60 && s.stemScore < 85" [class.low]="s.stemScore < 60">{{ s.stemScore }}</span>
                  </td></ng-container>
                <ng-container matColumnDef="rating"><th mat-header-cell *matHeaderCellDef>评级</th>
                  <td mat-cell *matCellDef="let s">
                    <mat-chip [color]="s.rating === '优秀' ? 'primary' : s.rating === '薄弱' ? 'warn' : 'accent'" selected>{{ s.rating }}</mat-chip>
                  </td></ng-container>
                <ng-container matColumnDef="equipmentStatus"><th mat-header-cell *matHeaderCellDef>设备状态</th>
                  <td mat-cell *matCellDef="let s">
                    <mat-chip [class.sufficient]="s.equipmentStatus === '充足'" [class.scarce]="s.equipmentStatus === '紧缺' || s.equipmentStatus === '严重不足'" selected>{{ s.equipmentStatus }}</mat-chip>
                  </td></ng-container>
                <ng-container matColumnDef="district"><th mat-header-cell *matHeaderCellDef>所属片区</th>
                  <td mat-cell *matCellDef="let s">{{ s.districtArea || '-' }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="schoolColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: schoolColumns;" (click)="selectedSchool = row; showSchoolDetail(row)"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 3: 设备调配 -->
        <mat-tab label="设备调配">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">设备总值</div>
                  <div class="summary-value">{{ equipmentPool.totalValue | number:'1.0-0' }}元</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">已配发</div>
                  <div class="summary-value">{{ equipmentPool.allocatedValue | number:'1.0-0' }}元</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">待审批申请</div>
                  <div class="summary-value warn">{{ equipmentPool.pendingRequests }}</div>
                </mat-card-content></mat-card>
              </div>
              <h3>设备品类清单</h3>
              <table mat-table [dataSource]="equipmentPool.items || []" class="data-table">
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>设备名称</th>
                  <td mat-cell *matCellDef="let e">{{ e.name }}</td></ng-container>
                <ng-container matColumnDef="totalQuantity"><th mat-header-cell *matHeaderCellDef>总量</th>
                  <td mat-cell *matCellDef="let e">{{ e.totalQuantity }}{{ e.unit }}</td></ng-container>
                <ng-container matColumnDef="inStock"><th mat-header-cell *matHeaderCellDef>库存</th>
                  <td mat-cell *matCellDef="let e">
                    <span [class.low-stock]="e.isLowStock">{{ e.inStockQuantity }}</span>
                  </td></ng-container>
                <ng-container matColumnDef="allocated"><th mat-header-cell *matHeaderCellDef>已配发</th>
                  <td mat-cell *matCellDef="let e">{{ e.allocatedQuantity }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['name','totalQuantity','inStock','allocated']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name','totalQuantity','inStock','allocated']"></tr>
              </table>

              <h3 *ngIf="pendingRequests.length > 0" class="section-title">待审批申请</h3>
              <div class="request-list" *ngIf="pendingRequests.length > 0">
                <div class="request-item" *ngFor="let r of pendingRequests">
                  <div class="request-info">
                    <strong>{{ r.schoolName }}</strong> 申请 {{ r.equipmentName }} × {{ r.quantity }}
                    <span class="request-reason">{{ r.reason }}</span>
                  </div>
                  <div class="request-actions">
                    <mat-chip [color]="r.priority === '紧急' ? 'warn' : 'accent'" selected>{{ r.priority }}</mat-chip>
                    <button mat-raised-button color="primary" (click)="approveEquipment(r.id, true)">批准</button>
                    <button mat-raised-button (click)="approveEquipment(r.id, false)">驳回</button>
                  </div>
                </div>
              </div>

              <h3 class="section-title">跨校设备共享</h3>
              <table mat-table [dataSource]="crossSchoolShares" class="data-table">
                <ng-container matColumnDef="fromSchool"><th mat-header-cell *matHeaderCellDef>来源学校</th>
                  <td mat-cell *matCellDef="let s">{{ s.fromSchool }}</td></ng-container>
                <ng-container matColumnDef="toSchool"><th mat-header-cell *matHeaderCellDef>目标学校</th>
                  <td mat-cell *matCellDef="let s">{{ s.toSchool }}</td></ng-container>
                <ng-container matColumnDef="equipmentName"><th mat-header-cell *matHeaderCellDef>设备</th>
                  <td mat-cell *matCellDef="let s">{{ s.equipmentName }}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let s">
                    <mat-chip [color]="s.status === '使用中' ? 'primary' : s.status === '逾期' ? 'warn' : 'accent'" selected>{{ s.status }}</mat-chip>
                  </td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['fromSchool','toSchool','equipmentName','status']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['fromSchool','toSchool','equipmentName','status']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 4: 师资培训 -->
        <mat-tab label="师资培训">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">培训场次</div>
                  <div class="summary-value">{{ trainingOverview.totalSessions }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">已参训人次</div>
                  <div class="summary-value">{{ trainingOverview.totalAttended }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">完成率</div>
                  <div class="summary-value">{{ trainingOverview.completionRate }}%</div>
                </mat-card-content></mat-card>
              </div>

              <h3 class="section-title">片区培训覆盖率</h3>
              <div class="coverage-list">
                <div class="coverage-item" *ngFor="let d of districtCoverage">
                  <span class="coverage-area">{{ d.area }}</span>
                  <div class="coverage-bar-track">
                    <div class="coverage-bar-fill" [style.width.%]="d.coverageRate" [class.met]="d.isMet" [class.unmet]="!d.isMet"></div>
                  </div>
                  <span class="coverage-rate" [class.met]="d.isMet" [class.unmet]="!d.isMet">{{ d.coverageRate }}%</span>
                  <span class="coverage-detail">{{ d.trainedSchools }}/{{ d.totalSchools }} 校</span>
                </div>
              </div>

              <h3 class="section-title">培训场次</h3>
              <table mat-table [dataSource]="trainingSessions" class="data-table">
                <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>培训主题</th>
                  <td mat-cell *matCellDef="let t">{{ t.title }}</td></ng-container>
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>日期</th>
                  <td mat-cell *matCellDef="let t">{{ t.date }}</td></ng-container>
                <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>类型</th>
                  <td mat-cell *matCellDef="let t">{{ t.type }}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let t">
                    <mat-chip [color]="t.status === '报名中' ? 'primary' : t.status === '已结束' ? '' : 'accent'" selected>{{ t.status }}</mat-chip>
                  </td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['title','date','type','status']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['title','date','type','status']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 5: 竞赛管理 -->
        <mat-tab label="竞赛管理">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card" *ngFor="let l of competitionLevelStats | keyvalue">
                  <mat-card-content>
                    <div class="summary-label">{{ l.key }}</div>
                    <div class="summary-value">{{ l.value }}项</div>
                  </mat-card-content>
                </mat-card>
              </div>

              <h3 class="section-title">竞赛列表</h3>
              <table mat-table [dataSource]="competitions" class="data-table">
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>竞赛名称</th>
                  <td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container>
                <ng-container matColumnDef="level"><th mat-header-cell *matHeaderCellDef>级别</th>
                  <td mat-cell *matCellDef="let c">{{ c.level }}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let c">{{ c.status }}</td></ng-container>
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>日期</th>
                  <td mat-cell *matCellDef="let c">{{ c.competitionDate }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['name','level','status','date']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name','level','status','date']"></tr>
              </table>

              <h3 class="section-title">近期获奖</h3>
              <table mat-table [dataSource]="recentAwards" class="data-table">
                <ng-container matColumnDef="competitionName"><th mat-header-cell *matHeaderCellDef>赛事</th>
                  <td mat-cell *matCellDef="let a">{{ a.competitionName }}</td></ng-container>
                <ng-container matColumnDef="schoolName"><th mat-header-cell *matHeaderCellDef>学校</th>
                  <td mat-cell *matCellDef="let a">{{ a.schoolName }}</td></ng-container>
                <ng-container matColumnDef="awardLevel"><th mat-header-cell *matHeaderCellDef>获奖等级</th>
                  <td mat-cell *matCellDef="let a">{{ a.awardLevel }}</td></ng-container>
                <ng-container matColumnDef="awardDate"><th mat-header-cell *matHeaderCellDef>日期</th>
                  <td mat-cell *matCellDef="let a">{{ a.awardDate }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['competitionName','schoolName','awardLevel','awardDate']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['competitionName','schoolName','awardLevel','awardDate']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 6: 经费管理 -->
        <mat-tab label="经费管理">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">年度预算</div>
                  <div class="summary-value">{{ budgetOverview.totalAmount | number:'1.0-0' }}元</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">已支出</div>
                  <div class="summary-value">{{ budgetOverview.spentAmount | number:'1.0-0' }}元</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">执行率</div>
                  <div class="summary-value">{{ budgetOverview.executionRate }}%</div>
                  <mat-progress-bar mode="determinate" [value]="budgetOverview.executionRate"></mat-progress-bar>
                </mat-card-content></mat-card>
              </div>

              <h3 class="section-title">预算分类占比</h3>
              <div class="budget-categories">
                <div class="cat-item" *ngFor="let cat of budgetOverview.categoryBreakdown">
                  <span class="cat-name">{{ cat.category }}</span>
                  <div class="cat-bar-track">
                    <div class="cat-bar-fill" [style.width.%]="(cat.amount / budgetOverview.totalAmount) * 100"></div>
                  </div>
                  <span class="cat-amount">{{ cat.amount | number:'1.0-0' }}元</span>
                </div>
              </div>

              <h3 class="section-title">近期支出</h3>
              <table mat-table [dataSource]="budgetOverview.recentExpenses" class="data-table">
                <ng-container matColumnDef="itemName"><th mat-header-cell *matHeaderCellDef>项目</th>
                  <td mat-cell *matCellDef="let e">{{ e.itemName }}</td></ng-container>
                <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>类别</th>
                  <td mat-cell *matCellDef="let e">{{ e.category }}</td></ng-container>
                <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>金额</th>
                  <td mat-cell *matCellDef="let e">{{ e.amount | number:'1.0-0' }}元</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let e">
                    <mat-chip [color]="e.status === '已拨付' ? 'primary' : 'accent'" selected>{{ e.status }}</mat-chip>
                  </td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['itemName','category','amount','status']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['itemName','category','amount','status']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 7: 课程资源 -->
        <mat-tab label="课程资源">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">共享资源总数</div>
                  <div class="summary-value">{{ curriculumOverview.totalResources }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">已发布</div>
                  <div class="summary-value">{{ curriculumOverview.publishedResources }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">贡献学校</div>
                  <div class="summary-value">{{ curriculumOverview.contributingSchools }}</div>
                </mat-card-content></mat-card>
              </div>

              <h3 class="section-title">课程分类</h3>
              <div class="cat-chips">
                <mat-chip *ngFor="let cat of curriculumOverview.categoryBreakdown" selected>
                  {{ cat.category }} ({{ cat.count }})
                </mat-chip>
              </div>

              <h3 class="section-title">资源列表</h3>
              <table mat-table [dataSource]="curriculumResources" class="data-table">
                <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>资源名称</th>
                  <td mat-cell *matCellDef="let r">{{ r.title }}</td></ng-container>
                <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>分类</th>
                  <td mat-cell *matCellDef="let r">{{ r.category }}</td></ng-container>
                <ng-container matColumnDef="schoolName"><th mat-header-cell *matHeaderCellDef>来源学校</th>
                  <td mat-cell *matCellDef="let r">{{ r.schoolName }}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip [color]="r.status === '已发布' ? 'primary' : r.status === '待审核' ? 'accent' : ''" selected>{{ r.status }}</mat-chip>
                  </td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['title','category','schoolName','status']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['title','category','schoolName','status']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab 8: 数据报表 -->
        <mat-tab label="数据报表">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="summary-row">
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">学校总数</div>
                  <div class="summary-value">{{ coverageReport.totalSchools }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">覆盖学校</div>
                  <div class="summary-value">{{ coverageReport.coveredSchools }}</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">覆盖率</div>
                  <div class="summary-value">{{ coverageReport.coverageRate }}%</div>
                </mat-card-content></mat-card>
                <mat-card class="summary-card"><mat-card-content>
                  <div class="summary-label">薄弱学校</div>
                  <div class="summary-value warn">{{ coverageReport.weakSchools }}</div>
                </mat-card-content></mat-card>
              </div>

              <h3 class="section-title">评级分布</h3>
              <div class="rating-dist">
                <div class="rating-item" *ngFor="let r of coverageReport.ratingDistribution | keyvalue">
                  <span class="rating-label">{{ r.key }}</span>
                  <div class="rating-bar-track">
                    <div class="rating-bar-fill" [style.width.%]="(r.value / coverageReport.totalSchools) * 100"
                         [class.excellent]="r.key === '优秀'" [class.good]="r.key === '良好'"
                         [class.weak]="r.key === '薄弱'"></div>
                  </div>
                  <span class="rating-value">{{ r.value }}所</span>
                </div>
              </div>

              <h3 class="section-title">学校排名</h3>
              <table mat-table [dataSource]="schoolRanking" class="data-table">
                <ng-container matColumnDef="rank"><th mat-header-cell *matHeaderCellDef>排名</th>
                  <td mat-cell *matCellDef="let r">#{{ r.rank }}</td></ng-container>
                <ng-container matColumnDef="schoolName"><th mat-header-cell *matHeaderCellDef>学校</th>
                  <td mat-cell *matCellDef="let r">{{ r.schoolName }}</td></ng-container>
                <ng-container matColumnDef="stemScore"><th mat-header-cell *matHeaderCellDef>评分</th>
                  <td mat-cell *matCellDef="let r">{{ r.stemScore }}</td></ng-container>
                <ng-container matColumnDef="rating"><th mat-header-cell *matHeaderCellDef>评级</th>
                  <td mat-cell *matCellDef="let r">{{ r.rating }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['rank','schoolName','stemScore','rating']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['rank','schoolName','stemScore','rating']"></tr>
              </table>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .bureau-layout { padding: 24px; background: #f5f7fa; min-height: 100%; color: #333; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .page-header h1 mat-icon { font-size: 28px; width: 28px; height: 28px; color: #1565c0; }
    .subtitle { margin: 4px 0 0 0; color: #888; font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .org-name { font-size: 14px; color: #666; }
    .tab-content { padding: 20px 0; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { cursor: default; }
    .kpi-card mat-card-content { text-align: center; padding: 16px; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
    .kpi-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
    .kpi-icon.blue { background: #1565c0; }
    .kpi-icon.green { background: #2e7d32; }
    .kpi-icon.orange { background: #ef6c00; }
    .kpi-icon.purple { background: #6a1b9a; }
    .kpi-icon.cyan { background: #00838f; }
    .kpi-icon.red { background: #c62828; }
    .kpi-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; color: #888; }
    .kpi-trend { font-size: 12px; margin-top: 4px; }
    .kpi-trend.up { color: #2e7d32; }
    .warn .kpi-value { color: #c62828; }

    /* Charts */
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .trend-bars { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
    .bar-item { display: flex; align-items: center; gap: 8px; }
    .bar-label { width: 55px; font-size: 12px; color: #666; flex-shrink: 0; }
    .bar-track { flex: 1; height: 20px; background: #e8eaf6; border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; background: #1565c0; border-radius: 10px; transition: width 0.5s; }
    .bar-fill.above-target { background: #2e7d32; }
    .bar-value { width: 38px; font-size: 12px; font-weight: 600; text-align: right; }
    .bar-target { font-size: 11px; color: #c62828; }
    .dist-list { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .dist-item { display: flex; align-items: center; gap: 8px; }
    .dist-name { width: 80px; font-size: 13px; flex-shrink: 0; }
    .dist-bar-track { flex: 1; height: 16px; background: #e8eaf6; border-radius: 8px; overflow: hidden; }
    .dist-bar-fill { height: 100%; background: #7c4dff; border-radius: 8px; }
    .dist-value { font-size: 12px; font-weight: 600; width: 40px; text-align: right; }

    /* Alert Card */
    .alert-card { margin-bottom: 24px; }
    .alert-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .alert-item:last-child { border-bottom: none; }
    .alert-icon { color: #c62828; }
    .alert-info { flex: 1; }
    .alert-info strong { display: block; font-size: 14px; }
    .alert-info span { font-size: 12px; color: #888; }
    .alert-suggestion { font-size: 12px; color: #1565c0; padding: 4px 8px; background: #e3f2fd; border-radius: 4px; }

    /* Quick Links */
    .quick-links { margin-bottom: 24px; }
    .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .quick-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; background: #f8f9fa; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .quick-item:hover { background: #e3f2fd; transform: translateY(-2px); }
    .quick-item mat-icon { font-size: 32px; width: 32px; height: 32px; color: #1565c0; }

    /* Summary Row */
    .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { text-align: center; }
    .summary-label { font-size: 13px; color: #888; margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; }
    .summary-value.warn { color: #c62828; }

    /* Toolbar */
    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .toolbar mat-form-field { width: 180px; }
    .toolbar-info { font-size: 13px; color: #888; }

    /* Data Table */
    .data-table { width: 100%; background: white; border-radius: 8px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .data-table th { background: #f5f5f5; font-weight: 600; font-size: 13px; color: #555; }
    .data-table td { font-size: 13px; padding: 8px 12px; }
    .data-table tr.mat-row:hover { background: #f5f8ff; cursor: pointer; }

    .section-title { font-size: 16px; font-weight: 600; margin: 20px 0 12px; color: #333; }

    /* Score Badge */
    .score-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: 600; font-size: 13px; }
    .score-badge.high { background: #e8f5e9; color: #2e7d32; }
    .score-badge.mid { background: #fff8e1; color: #ef6c00; }
    .score-badge.low { background: #ffebee; color: #c62828; }

    /* Coverage */
    .coverage-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .coverage-item { display: flex; align-items: center; gap: 10px; }
    .coverage-area { width: 100px; font-size: 13px; font-weight: 500; flex-shrink: 0; }
    .coverage-bar-track { flex: 1; height: 18px; background: #e8eaf6; border-radius: 9px; overflow: hidden; }
    .coverage-bar-fill { height: 100%; border-radius: 9px; transition: width 0.5s; }
    .coverage-bar-fill.met { background: #2e7d32; }
    .coverage-bar-fill.unmet { background: #c62828; }
    .coverage-rate { width: 40px; font-weight: 600; font-size: 13px; text-align: right; }
    .coverage-rate.met { color: #2e7d32; }
    .coverage-rate.unmet { color: #c62828; }
    .coverage-detail { font-size: 12px; color: #888; width: 60px; }

    /* Requests */
    .request-list { margin-bottom: 20px; }
    .request-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .request-info { flex: 1; }
    .request-info strong { font-size: 14px; }
    .request-reason { display: block; font-size: 12px; color: #888; margin-top: 2px; }
    .request-actions { display: flex; align-items: center; gap: 8px; }

    /* Budget */
    .budget-categories { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .cat-item { display: flex; align-items: center; gap: 10px; }
    .cat-name { width: 100px; font-size: 13px; flex-shrink: 0; }
    .cat-bar-track { flex: 1; height: 16px; background: #e8eaf6; border-radius: 8px; overflow: hidden; }
    .cat-bar-fill { height: 100%; background: #7c4dff; border-radius: 8px; }
    .cat-amount { width: 80px; font-size: 12px; font-weight: 600; text-align: right; }

    /* Rating Distribution */
    .rating-dist { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .rating-item { display: flex; align-items: center; gap: 10px; }
    .rating-label { width: 70px; font-size: 13px; flex-shrink: 0; }
    .rating-bar-track { flex: 1; height: 16px; background: #e8eaf6; border-radius: 8px; overflow: hidden; }
    .rating-bar-fill { height: 100%; border-radius: 8px; }
    .rating-bar-fill.excellent { background: #2e7d32; }
    .rating-bar-fill.good { background: #1565c0; }
    .rating-bar-fill.weak { background: #c62828; }
    .rating-value { width: 40px; font-size: 12px; font-weight: 600; text-align: right; }

    /* Cat Chips */
    .cat-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }

    /* Low Stock */
    .low-stock { color: #c62828; font-weight: 700; }

    /* Mat-chip overrides for custom classes */
    ::ng-deep .sufficient { background: #e8f5e9 !important; color: #2e7d32 !important; }
    ::ng-deep .scarce { background: #ffebee !important; color: #c62828 !important; }

    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
      .quick-grid { grid-template-columns: repeat(2, 1fr); }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class BureauLayoutComponent implements OnInit {
  selectedTabIndex = 0;

  // Auth
  isBureauUser = false;
  bureauName = '';

  // Dashboard
  stats: any = {};
  coverageTrend: any[] = [];
  schoolDistribution: any[] = [];
  totalSchoolsDist = 0;
  weakAlerts: any[] = [];
  quickLinks: any = {};

  // Schools
  schools: any[] = [];
  selectedSchool: any = null;
  schoolColumns = ['rank', 'name', 'stemScore', 'rating', 'equipmentStatus', 'district'];
  schoolFilter = { rating: '', sortBy: 'stem_score', order: 'desc' };

  // Equipment
  equipmentPool: any = { items: [] };
  pendingRequests: any[] = [];
  crossSchoolShares: any[] = [];

  // Training
  trainingOverview: any = {};
  trainingSessions: any[] = [];
  districtCoverage: any[] = [];

  // Competitions
  competitions: any[] = [];
  recentAwards: any[] = [];
  competitionLevelStats: any = {};

  // Budget
  budgetOverview: any = { categoryBreakdown: [], recentExpenses: [] };

  // Curriculum
  curriculumOverview: any = { categoryBreakdown: [] };
  curriculumResources: any[] = [];

  // Reports
  coverageReport: any = { ratingDistribution: {} };
  schoolRanking: any[] = [];

  constructor(private bureauService: BureauService) {}

  ngOnInit(): void {
    this.verifyAccess();
    this.loadDashboardData();
  }

  verifyAccess(): void {
    this.bureauService.verifyBureauAccess().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.isBureauUser = res.data.isBureau;
          this.bureauName = res.data.bureauName;
        }
      },
    });
  }

  loadDashboardData(): void {
    this.bureauService.getDashboardStats().subscribe(r => { if (r.success) this.stats = r.data; });
    this.bureauService.getCoverageTrend().subscribe(r => { if (r.success) this.coverageTrend = r.data.trend; });
    this.bureauService.getSchoolDistribution().subscribe(r => { if (r.success) { this.schoolDistribution = r.data.distribution; this.totalSchoolsDist = r.data.total; } });
    this.bureauService.getWeakAlerts().subscribe(r => { if (r.success) this.weakAlerts = r.data.alerts; });
    this.bureauService.getQuickLinks().subscribe(r => { if (r.success) this.quickLinks = r.data; });
    this.loadSchools();
    this.loadEquipmentData();
    this.loadTrainingData();
    this.loadCompetitionData();
    this.loadBudgetData();
    this.loadCurriculumData();
    this.loadReportData();
  }

  loadSchools(): void {
    this.bureauService.getSchools(this.schoolFilter).subscribe(r => {
      if (r.success) this.schools = r.data.items;
    });
  }

  showSchoolDetail(school: any): void {
    // TODO: open detail dialog
  }

  loadEquipmentData(): void {
    this.bureauService.getEquipmentPool().subscribe(r => { if (r.success) this.equipmentPool = r.data; });
    this.bureauService.getPendingRequests().subscribe(r => { if (r.success) this.pendingRequests = r.data.items; });
    this.bureauService.getCrossSchoolShares().subscribe(r => { if (r.success) this.crossSchoolShares = r.data.items; });
  }

  approveEquipment(requestId: number, approved: boolean): void {
    this.bureauService.approveRequest(requestId, approved).subscribe(r => {
      if (r.success) {
        this.loadEquipmentData();
      }
    });
  }

  loadTrainingData(): void {
    this.bureauService.getTrainingOverview().subscribe(r => { if (r.success) this.trainingOverview = r.data; });
    this.bureauService.getTrainingSessions().subscribe(r => { if (r.success) this.trainingSessions = r.data.items; });
    this.bureauService.getDistrictCoverage().subscribe(r => { if (r.success) this.districtCoverage = r.data.districts; });
  }

  loadCompetitionData(): void {
    this.bureauService.getCompetitions().subscribe(r => { if (r.success) this.competitions = r.data.items; });
    this.bureauService.getCompetitionStats().subscribe(r => {
      if (r.success) {
        this.competitionLevelStats = r.data.byLevel;
        this.recentAwards = r.data.recentAwards;
      }
    });
  }

  loadBudgetData(): void {
    this.bureauService.getBudgetOverview().subscribe(r => { if (r.success) this.budgetOverview = r.data; });
  }

  loadCurriculumData(): void {
    this.bureauService.getCurriculumOverview().subscribe(r => { if (r.success) this.curriculumOverview = r.data; });
    this.bureauService.getCurriculumResources().subscribe(r => { if (r.success) this.curriculumResources = r.data.items; });
  }

  loadReportData(): void {
    this.bureauService.getCoverageReport().subscribe(r => { if (r.success) this.coverageReport = r.data; });
    this.bureauService.getSchoolRankingReport().subscribe(r => { if (r.success) this.schoolRanking = r.data.ranking; });
  }

  onTabChange(index: number): void {
    // Refresh data for specific tabs when they're opened
    if (index === 2) this.loadSchools();
    if (index === 3) this.loadEquipmentData();
    if (index === 4) this.loadTrainingData();
    if (index === 5) this.loadCompetitionData();
    if (index === 6) this.loadBudgetData();
    if (index === 7) this.loadCurriculumData();
    if (index === 8) this.loadReportData();
  }
}