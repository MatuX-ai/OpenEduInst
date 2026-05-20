/**
 * 角色权限管理服务
 *
 * @fileoverview 提供角色管理、权限配置、用户授权等完整业务逻辑
 * @author AI Assistant
 * @date 2026-04-02
 */

import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';

import { generatePermissionTree, generateRealisticRoles } from '../mock-data-enhancements';
import {
  AssignRoleRequest,
  CreateRoleRequest,
  OperationLog,
  Permission,
  PermissionStats,
  Role,
  RoleFilter,
  UpdateRoleRequest,
  UserPermissionSummary,
  UserRole,
} from '../models/role-permission.models';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {
  // Mock 角色数据 - 基于教育机构组织架构生成
  private roles: Role[] = generateRealisticRoles() as Role[];

  // Mock 权限数据 - 动态生成权限树
  private permissions: Permission[] = generatePermissionTree() as Permission[];

  // Mock 用户角色关联
  private userRoles: UserRole[] = [];

  // Mock 操作日志
  private operationLogs: OperationLog[] = [];

  constructor(private dialog: MatDialog) {
    this.assignPermissionsToRoles();
  }

  /**
   * 为角色分配权限
   */
  private assignPermissionsToRoles(): void {
    // 校长拥有全部权限
    const principalRole = this.roles.find((r) => r.code === 'principal');
    if (principalRole) {
      principalRole.permissions = [...this.permissions];
    }
  }

  /**
   * 获取角色列表
   */
  getRoles(filter?: RoleFilter): Observable<Role[]> {
    let result = [...this.roles];

    if (filter?.search) {
      const keyword = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword) ||
          r.code.toLowerCase().includes(keyword) ||
          r.description?.toLowerCase().includes(keyword)
      );
    }

    if (filter?.isSystem !== undefined) {
      result = result.filter((r) => r.isSystem === filter.isSystem);
    }

    return of(result);
  }

  /**
   * 获取角色详情
   */
  getRoleById(id: number): Observable<Role | undefined> {
    const role = this.roles.find((r) => r.id === id);
    return of(role);
  }

  /**
   * 获取所有权限树
   */
  getAllPermissions(): Observable<Permission[]> {
    return of(this.permissions);
  }

  /**
   * 创建角色
   */
  createRole(request: CreateRoleRequest): Observable<Role> {
    const newRole: Role = {
      id: this.generateRoleId(),
      name: request.name,
      code: request.code,
      description: request.description,
      permissions: this.getPermissionsByIds(request.permissionIds),
      dataScope: request.dataScope,
      isInherited: request.isInherited ?? false,
      parentRoleId: request.parentRoleId,
      userCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.push(newRole);
    return of(newRole);
  }

  /**
   * 更新角色
   */
  updateRole(id: number, request: UpdateRoleRequest): Observable<Role> {
    const index = this.roles.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Role ${id} not found`);
    }

    const updatedRole = {
      ...this.roles[index],
      ...request,
      permissions: request.permissionIds
        ? this.getPermissionsByIds(request.permissionIds)
        : this.roles[index].permissions,
      updatedAt: new Date().toISOString(),
    };

    this.roles[index] = updatedRole;
    return of(updatedRole);
  }

  /**
   * 删除角色
   */
  deleteRole(id: number): Observable<boolean> {
    const role = this.roles.find((r) => r.id === id);
    if (!role || role.isSystem) {
      return of(false);
    }

    const index = this.roles.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.roles.splice(index, 1);
    }

    return of(true);
  }

  /**
   * 获取统计数据
   */
  getStats(): Observable<PermissionStats> {
    const moduleStats = this.permissions.map((p) => ({
      module: p.module,
      moduleName: `${p.module}管理`,
      permissionCount: 1 + (p.children?.length ?? 0),
      roleCount: this.roles.filter((r) => r.permissions.some((rp) => rp.module === p.module))
        .length,
    }));

    return of({
      totalPermissions: this.permissions.reduce((sum, p) => sum + 1 + (p.children?.length ?? 0), 0),
      totalRoles: this.roles.length,
      totalUsers: this.roles.reduce((sum, r) => sum + r.userCount, 0),
      systemRoles: this.roles.filter((r) => r.isSystem).length,
      customRoles: this.roles.filter((r) => !r.isSystem).length,
      moduleStats,
    });
  }

  /**
   * 获取用户的权限摘要
   */
  getUserPermissionSummary(userId: number): Observable<UserPermissionSummary> {
    const userUserRoles = this.userRoles.filter((ur) => ur.userId === userId && ur.isActive);

    const roleNames = userUserRoles.map((ur) => ur.roleName);
    const allPermissions = userUserRoles.flatMap(
      (ur) => this.roles.find((r) => r.id === ur.roleId)?.permissions ?? []
    );

    const uniquePermissions = Array.from(new Set(allPermissions.map((p) => p.code)));

    return of({
      userId,
      userName: `用户${userId}`,
      roles: roleNames,
      permissions: uniquePermissions,
      dataScope: 'self',
    });
  }

  /**
   * 分配角色给用户
   */
  assignRole(request: AssignRoleRequest): Observable<UserRole> {
    const role = this.roles.find((r) => r.id === request.roleId);
    const newUserRole: UserRole = {
      id: this.generateUserRoleId(),
      userId: request.userId,
      roleId: request.roleId,
      roleName: role?.name ?? '未知角色',
      grantedBy: 1, // Mock 当前用户 ID
      grantedAt: new Date().toISOString(),
      expiresAt: request.expiresAt,
      isActive: true,
    };

    this.userRoles.push(newUserRole);

    // 更新角色的用户数
    const targetRole = this.roles.find((r) => r.id === request.roleId);
    if (targetRole) {
      targetRole.userCount++;
    }

    return of(newUserRole);
  }

  /**
   * 撤销用户角色
   */
  revokeRole(userId: number, roleId: number): Observable<boolean> {
    const index = this.userRoles.findIndex(
      (ur) => ur.userId === userId && ur.roleId === roleId && ur.isActive
    );

    if (index === -1) {
      return of(false);
    }

    this.userRoles[index].isActive = false;

    // 更新角色的用户数
    const role = this.roles.find((r) => r.id === roleId);
    if (role) {
      role.userCount--;
    }

    return of(true);
  }

  /**
   * 获取用户的角色列表
   */
  getUserRoles(userId: number): Observable<UserRole[]> {
    const result = this.userRoles.filter((ur) => ur.userId === userId && ur.isActive);
    return of(result);
  }

  /**
   * 记录操作日志
   */
  logOperation(log: Omit<OperationLog, 'id' | 'createdAt'>): void {
    const newLog: OperationLog = {
      ...log,
      id: this.generateLogId(),
      createdAt: new Date().toISOString(),
    };
    this.operationLogs.push(newLog);
  }

  /**
   * 获取操作日志列表
   */
  getOperationLogs(roleId?: number, page?: number, pageSize?: number): Observable<OperationLog[]> {
    let result = [...this.operationLogs];

    if (roleId) {
      result = result.filter((log) => log.roleId === roleId);
    }

    // 简单分页
    const start = (page ?? 0) * (pageSize ?? 20);
    const end = start + (pageSize ?? 20);
    result = result.slice(start, end);

    return of(result);
  }

  // ==================== 辅助方法 ====================

  private generateRoleId(): number {
    return Math.max(...this.roles.map((r) => r.id), 0) + 1;
  }

  private generateUserRoleId(): number {
    return Math.max(...this.userRoles.map((ur) => ur.id), 0) + 1;
  }

  private generateLogId(): number {
    return Math.max(...this.operationLogs.map((l) => l.id), 0) + 1;
  }

  private getPermissionsByIds(ids: number[]): Permission[] {
    const result: Permission[] = [];

    const findPermission = (id: number): Permission | undefined => {
      for (const p of this.permissions) {
        if (p.id === id) return p;
        if (p.children) {
          const child = p.children.find((c) => c.id === id);
          if (child) return child;
        }
      }
      return undefined;
    };

    ids.forEach((id) => {
      const perm = findPermission(id);
      if (perm) result.push(perm);
    });

    return result;
  }
}
