"""
数据库模型包
"""

# 导入存在的模型
from .license import (
    License,
    LicenseActivityLog,
    LicenseCreate,
    LicenseResponse,
    LicenseStatus,
    LicenseType,
    Organization,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationType,
)
from .user_license import UserRole, UserLicense, UserLicenseStatus
from .user_organization import UserOrganization, UserOrganizationRole, UserOrganizationStatus
from .tenant import TenantConfig, TenantFeatureFlag
from .schedule import Schedule, Lead, Settlement, ScheduleStatus, LeadStatus
from .classroom import Classroom, ClassSchedule
from .student import Student, Enrollment, AttendanceRecord, StudentStatus, Gender

__all__ = [
    # License models
    "License",
    "LicenseActivityLog",
    "LicenseStatus",
    "LicenseType",
    "Organization",
    "LicenseCreate",
    "LicenseResponse",
    "OrganizationCreate",
    "OrganizationResponse",
    "OrganizationUpdate",
    "OrganizationType",
    # User License models
    "UserRole",
    "UserLicense",
    "UserLicenseStatus",
    # User Organization models
    "UserOrganization",
    "UserOrganizationRole",
    "UserOrganizationStatus",
    # Tenant models
    "TenantConfig",
    "TenantFeatureFlag",
    # Schedule models
    "Schedule",
    "Lead",
    "Settlement",
    "ScheduleStatus",
    "LeadStatus",
    # Classroom models
    "Classroom",
    "ClassSchedule",
    # Student models
    "Student",
    "Enrollment",
    "AttendanceRecord",
    "StudentStatus",
    "Gender",
]
