/**
 * 角色权限管理数据模型
 *
 * @fileoverview 定义角色、权限、用户关联等接口
 * @author AI Assistant
 * @date 2026-04-02
 */

// ==================== 核心接口 ====================

/**
 * 角色信息
 */
export interface Role {
  id: number;
  name: string; // 角色名称（如：校长、教务主任、教师）
  code: string; // 角色代码（如：principal、academic_director、teacher）
  description?: string; // 角色描述
  permissions: Permission[]; // 权限列表
  dataScope: DataScopeType; // 数据权限范围
  isInherited: boolean; // 是否继承父角色权限
  parentRoleId?: number; // 父角色 ID（用于继承）
  userCount: number; // 使用该角色的用户数
  isSystem: boolean; // 是否系统内置角色（不可删除）
  createdAt: string;
  updatedAt: string;
}

/**
 * 权限点
 */
export interface Permission {
  id: number;
  name: string; // 权限名称（如：查看学员列表）
  code: string; // 权限代码（如：student:list）
  type: PermissionType; // 权限类型
  module: string; // 所属模块（如：student、teacher、finance）
  action: string; // 操作类型（如：view、create、edit、delete）
  resource?: string; // 资源路径（如：/students）
  description?: string; // 权限描述
  parentId?: number; // 父权限 ID（用于权限树）
  children?: Permission[]; // 子权限列表
  checked?: boolean; // 是否选中（用于配置界面）
  expanded?: boolean; // 是否展开（用于权限树）
}

/**
 * 用户角色关联
 */
export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  roleName: string;
  grantedBy: number; // 授权人 ID
  grantedAt: string; // 授权时间
  expiresAt?: string; // 过期时间（可选，用于临时权限）
  isActive: boolean; // 是否激活
}

/**
 * 权限变更日志
 */
export interface PermissionChangeLog {
  id: number;
  roleId: number;
  roleName: string;
  operatorId: number; // 操作人 ID
  operatorName: string;
  changeType: ChangeType; // 变更类型
  changes: PermissionChange[]; // 具体变更内容
  reason?: string; // 变更原因
  createdAt: string;
}

/**
 * 权限变更详情
 */
export interface PermissionChange {
  permissionId: number;
  permissionCode: string;
  permissionName: string;
  action: 'add' | 'remove'; // 添加或移除
  module: string;
}

/**
 * 操作日志审计
 */
export interface OperationLog {
  id: number;
  userId: number;
  userName: string;
  roleId: number;
  roleName: string;
  action: string; // 操作行为
  module: string; // 操作模块
  resource?: string; // 操作资源
  resourceId?: number; // 资源 ID
  ipAddress?: string; // IP 地址
  userAgent?: string; // 浏览器信息
  status: 'success' | 'failure'; // 操作状态
  errorMessage?: string; // 错误信息
  duration?: number; // 耗时（毫秒）
  createdAt: string;
}

// ==================== 辅助接口 ====================

/**
 * 角色筛选条件
 */
export interface RoleFilter {
  search?: string; // 搜索关键词
  module?: string; // 按模块筛选
  dataScope?: DataScopeType; // 按数据范围筛选
  isSystem?: boolean; // 是否系统角色
  page?: number;
  pageSize?: number;
}

/**
 * 权限统计
 */
export interface PermissionStats {
  totalPermissions: number;
  totalRoles: number;
  totalUsers: number;
  systemRoles: number;
  customRoles: number;
  moduleStats: ModuleStat[];
}

/**
 * 模块统计
 */
export interface ModuleStat {
  module: string;
  moduleName: string;
  permissionCount: number;
  roleCount: number;
}

/**
 * 用户权限摘要
 */
export interface UserPermissionSummary {
  userId: number;
  userName: string;
  roles: string[]; // 角色名称列表
  permissions: string[]; // 权限代码列表
  dataScope: DataScopeType;
  lastLoginAt?: string;
}

// ==================== 请求/响应接口 ====================

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  permissionIds: number[]; // 选中的权限 ID 列表
  dataScope: DataScopeType;
  parentRoleId?: number;
  isInherited?: boolean;
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
  dataScope?: DataScopeType;
  parentRoleId?: number;
  isInherited?: boolean;
}

/**
 * 分配角色请求
 */
export interface AssignRoleRequest {
  userId: number;
  roleId: number;
  expiresAt?: string;
}

/**
 * 批量分配角色请求
 */
export interface BatchAssignRoleRequest {
  userIds: number[];
  roleId: number;
}

// ==================== 类型枚举 ====================

/**
 * 权限类型
 */
export type PermissionType =
  | 'menu' // 菜单权限
  | 'button' // 按钮权限
  | 'api' // API 接口权限
  | 'data'; // 数据权限

/**
 * 数据权限范围
 */
export type DataScopeType =
  | 'all' // 全部数据
  | 'department' // 本部门及以下
  | 'self' // 仅本人数据
  | 'custom'; // 自定义范围

/**
 * 变更类型
 */
export type ChangeType =
  | 'create' // 创建角色
  | 'update' // 更新角色
  | 'delete' // 删除角色
  | 'assign' // 分配角色
  | 'revoke'; // 撤销角色
