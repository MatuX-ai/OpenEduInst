"""
细粒度权限定义（RBAC - Role Based Access Control）

角色等级（从高到低）：
    SUPER_ADMIN -> 平台级超级管理员，可访问所有机构
    ADMIN        -> 机构管理员，可管理本机构的所有业务
    TEACHER      -> 教师，可管理课程、学生、排课等
    PARENT       -> 家长（仅在 parent portal 场景下使用）
    STUDENT      -> 学生（只读自己的数据）
    USER         -> 普通用户，最低权限

细粒度权限（permission）：
    user:read         用户读取
    user:write        用户创建/修改
    user:delete       用户删除
    student:read      学生数据读取
    student:write     学生数据修改
    course:read       课程读取
    course:write      课程修改
    license:read      许可证读取
    license:write     许可证修改
    org:read          机构信息读取
    org:write         机构信息修改
    audit:read        审计日志读取
    audit:export      审计日志导出
    system:read       系统配置读取
    system:write      系统配置修改
    hardware:read     硬件设备读取
    hardware:write    硬件设备修改
    billing:read      账单与 token 消耗读取
    billing:write     账单与 token 消耗管理
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Set, Optional


class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    STUDENT = "STUDENT"
    USER = "USER"


class Permission(str, Enum):
    # 用户
    USER_READ = "user:read"
    USER_WRITE = "user:write"
    USER_DELETE = "user:delete"

    # 学生
    STUDENT_READ = "student:read"
    STUDENT_WRITE = "student:write"

    # 教师
    TEACHER_READ = "teacher:read"
    TEACHER_WRITE = "teacher:write"

    # 课程
    COURSE_READ = "course:read"
    COURSE_WRITE = "course:write"

    # 许可证
    LICENSE_READ = "license:read"
    LICENSE_WRITE = "license:write"

    # 机构
    ORG_READ = "org:read"
    ORG_WRITE = "org:write"

    # 审计
    AUDIT_READ = "audit:read"
    AUDIT_EXPORT = "audit:export"

    # 系统
    SYSTEM_READ = "system:read"
    SYSTEM_WRITE = "system:write"

    # 硬件
    HARDWARE_READ = "hardware:read"
    HARDWARE_WRITE = "hardware:write"

    # 计费
    BILLING_READ = "billing:read"
    BILLING_WRITE = "billing:write"

    # 排课
    SCHEDULE_READ = "schedule:read"
    SCHEDULE_WRITE = "schedule:write"

    # 资源
    RESOURCE_READ = "resource:read"
    RESOURCE_WRITE = "resource:write"

    # 云备份
    BACKUP_READ = "backup:read"
    BACKUP_WRITE = "backup:write"


# 角色 -> 权限集合
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.SUPER_ADMIN: {p for p in Permission},  # 全部权限

    Role.ADMIN: {
        Permission.USER_READ, Permission.USER_WRITE, Permission.USER_DELETE,
        Permission.STUDENT_READ, Permission.STUDENT_WRITE,
        Permission.TEACHER_READ, Permission.TEACHER_WRITE,
        Permission.COURSE_READ, Permission.COURSE_WRITE,
        Permission.LICENSE_READ,
        Permission.ORG_READ, Permission.ORG_WRITE,
        Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
        Permission.SYSTEM_READ,
        Permission.HARDWARE_READ, Permission.HARDWARE_WRITE,
        Permission.BILLING_READ,
        Permission.SCHEDULE_READ, Permission.SCHEDULE_WRITE,
        Permission.RESOURCE_READ, Permission.RESOURCE_WRITE,
        Permission.BACKUP_READ, Permission.BACKUP_WRITE,
    },

    Role.TEACHER: {
        Permission.USER_READ,
        Permission.STUDENT_READ, Permission.STUDENT_WRITE,
        Permission.TEACHER_READ,
        Permission.COURSE_READ, Permission.COURSE_WRITE,
        Permission.SCHEDULE_READ, Permission.SCHEDULE_WRITE,
        Permission.RESOURCE_READ,
        Permission.HARDWARE_READ,
    },

    Role.PARENT: {
        Permission.STUDENT_READ,
        Permission.COURSE_READ,
    },

    Role.STUDENT: {
        Permission.COURSE_READ,
        Permission.RESOURCE_READ,
    },

    Role.USER: {
        Permission.ORG_READ,
    },
}


def role_has_permission(role: Optional[str], permission: Permission) -> bool:
    """判断某个角色是否拥有指定权限"""
    if not role:
        return False
    try:
        r = Role(role.upper())
    except ValueError:
        return False
    perms = ROLE_PERMISSIONS.get(r, set())
    return permission in perms


def role_permission_list(role: Optional[str]) -> List[str]:
    """返回角色拥有的所有权限（string 列表）"""
    if not role:
        return []
    try:
        r = Role(role.upper())
    except ValueError:
        return []
    return sorted([p.value for p in ROLE_PERMISSIONS.get(r, set())])
