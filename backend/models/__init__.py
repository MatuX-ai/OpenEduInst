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
from .token_billing import (  # 阶段三 3.2 充值订单
    TokenOrder,
    TokenOrderStatus,
    TokenOrderCreate,
    TokenOrderResponse,
    PaymentMethod,
    MockPaymentConfirmRequest,
)
from .schedule import Schedule, Lead, Settlement, ScheduleStatus, LeadStatus
from .classroom import Classroom, ClassSchedule
from .student import Student, Enrollment, AttendanceRecord, StudentStatus, Gender
from .resource import TeachingResource, ResourceCategory, ResourceType, ResourceFormat
from .competition import Competition, CompetitionRegistration, Certification, ExamRegistration
from .notification import Notification, NotificationType, NotificationPriority
from .marketing import MarketingCampaign, Coupon, CampaignType, CampaignStatus
from .parent_portal import ClassFeedback, StudentAchievement, ParentMessage, FeedbackRating
from .club import (
    Club, ClubMember, ClubActivity, ClubAttendance,
    ClubRecruitment, ClubApplication,
    ClubCategory, ClubStatus, ClubMemberRole, ClubMemberStatus,
    ActivityType, AttendanceStatus, ApplicationStatus,
    ClubCreate, ClubUpdate, ClubResponse,
    ClubMemberCreate, ClubMemberUpdate, ClubMemberResponse,
    ClubActivityCreate, ClubActivityUpdate, ClubActivityResponse,
    ClubAttendanceCreate, ClubAttendanceResponse,
    ClubRecruitmentCreate, ClubRecruitmentUpdate, ClubRecruitmentResponse,
    ClubApplicationCreate, ClubApplicationReview, ClubApplicationResponse,
    ClubStatsResponse, ClubDetailStats,
)
from .consumable import (
    Consumable, ConsumableUsage, ConsumablePurchaseRequest, PurchaseRequestItem,
    ConsumableCategory, PurchaseRequestStatus,
    ConsumableCreate, ConsumableUpdate, ConsumableResponse,
    ConsumableUsageCreate, ConsumableUsageResponse,
    PurchaseRequestCreate, PurchaseRequestReview, PurchaseRequestResponse,
    PurchaseRequestItemCreate, PurchaseRequestItemResponse,
    ConsumableStatsResponse, LowStockItem,
)
from .vocational_equipment import (
    VocEquipment, VocEquipmentBorrow, VocEquipmentMaintenance,
    VocFaultReport, VocInventoryRecord,
    VocEquipmentCategory, VocEquipmentStatus, VocSafetyLevel,
    VocBorrowStatus, VocMaintenanceType,
)
from .vocational_safety import (
    VocSafetyCertification, VocSafetyChecklist, VocIncidentReport,
    VocCourse, VocTrainingRoom, VocTrainingSchedule,
    VocSafetyCertStatus, VocIncidentType,
    VocSafetyCertCreate, VocChecklistCreate, VocIncidentCreate,
    VocCourseCreate, VocRoomCreate, VocScheduleCreate,
    VocSafetyStats, VocRoomUtilization,
)
from .vocational_cooperation import (
    VocEnterprise, VocEnterpriseDemand, VocCooperationProject,
    VocProjectMilestone, VocCompetition, VocCompetitionRegistration,
    VocInternshipPosition, VocInternshipRecord, VocEmploymentRecord,
    VocIncubatorProject, VocIncubatorMember,
    VocEnterpriseCreate, VocEnterpriseResponse,
    VocCoopProjectCreate, VocIncubatorCreate,
    VocCompetitionCreate, VocInternshipCreate, VocEmploymentCreate,
    VocCooperationStats,
)
from .vocational_assessment import (
    VocSkillStandard, VocSkillAssessment, VocCertificate,
    VocSkillStandardCreate, VocAssessmentCreate, VocCertificateCreate,
    VocStudentSkillProfile,
)
from .exam import (
    QuestionBank, Question, ExamPaper, PaperQuestion, ExamTask, ExamResult,
    QuestionType, QuestionDifficulty, QuestionBankSource, QuestionStatus,
    ExamPaperStatus, ExamMode, ExamTaskStatus, ExamResultStatus, SubmitType,
)
from .feature_flag import (
    FeatureModule, OrgFeatureFlag, FeatureChangeLog,
    FeatureCategory, FeatureModuleResponse, FeatureToggleRequest,
    BatchToggleRequest, OrgFeatureFlagResponse, FeatureChangeLogResponse,
    FeatureConfigResponse,
)

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
    # 阶段三 3.2 Token 充值订单
    "TokenOrder",
    "TokenOrderStatus",
    "TokenOrderCreate",
    "TokenOrderResponse",
    "PaymentMethod",
    "MockPaymentConfirmRequest",
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
    # Resource models
    "TeachingResource",
    "ResourceCategory",
    "ResourceType",
    "ResourceFormat",
    # Competition models
    "Competition",
    "CompetitionRegistration",
    "Certification",
    "ExamRegistration",
    # Notification models
    "Notification",
    "NotificationType",
    "NotificationPriority",
    # Marketing models
    "MarketingCampaign",
    "Coupon",
    "CampaignType",
    "CampaignStatus",
    # Parent Portal models
    "ClassFeedback",
    "StudentAchievement",
    "ParentMessage",
    "FeedbackRating",
    # Club models
    "Club", "ClubMember", "ClubActivity", "ClubAttendance",
    "ClubRecruitment", "ClubApplication",
    "ClubCategory", "ClubStatus", "ClubMemberRole", "ClubMemberStatus",
    "ActivityType", "AttendanceStatus", "ApplicationStatus",
    "ClubCreate", "ClubUpdate", "ClubResponse",
    "ClubMemberCreate", "ClubMemberUpdate", "ClubMemberResponse",
    "ClubActivityCreate", "ClubActivityUpdate", "ClubActivityResponse",
    "ClubAttendanceCreate", "ClubAttendanceResponse",
    "ClubRecruitmentCreate", "ClubRecruitmentUpdate", "ClubRecruitmentResponse",
    "ClubApplicationCreate", "ClubApplicationReview", "ClubApplicationResponse",
    "ClubStatsResponse", "ClubDetailStats",
    # Consumable models
    "Consumable", "ConsumableUsage", "ConsumablePurchaseRequest", "PurchaseRequestItem",
    "ConsumableCategory", "PurchaseRequestStatus",
    "ConsumableCreate", "ConsumableUpdate", "ConsumableResponse",
    "ConsumableUsageCreate", "ConsumableUsageResponse",
    "PurchaseRequestCreate", "PurchaseRequestReview", "PurchaseRequestResponse",
    "PurchaseRequestItemCreate", "PurchaseRequestItemResponse",
    "ConsumableStatsResponse", "LowStockItem",
    # Vocational Equipment models
    "VocEquipment", "VocEquipmentBorrow", "VocEquipmentMaintenance",
    "VocFaultReport", "VocInventoryRecord",
    "VocEquipmentCategory", "VocEquipmentStatus", "VocSafetyLevel",
    "VocBorrowStatus", "VocMaintenanceType",
    # Vocational Safety & Academic models
    "VocSafetyCertification", "VocSafetyChecklist", "VocIncidentReport",
    "VocCourse", "VocTrainingRoom", "VocTrainingSchedule",
    "VocSafetyCertStatus", "VocIncidentType",
    "VocSafetyCertCreate", "VocChecklistCreate", "VocIncidentCreate",
    "VocCourseCreate", "VocRoomCreate", "VocScheduleCreate",
    "VocSafetyStats", "VocRoomUtilization",
    # Vocational Cooperation models
    "VocEnterprise", "VocEnterpriseDemand", "VocCooperationProject",
    "VocProjectMilestone", "VocCompetition", "VocCompetitionRegistration",
    "VocInternshipPosition", "VocInternshipRecord", "VocEmploymentRecord",
    "VocIncubatorProject", "VocIncubatorMember",
    "VocEnterpriseCreate", "VocEnterpriseResponse",
    "VocCoopProjectCreate", "VocIncubatorCreate",
    "VocCompetitionCreate", "VocInternshipCreate", "VocEmploymentCreate",
    "VocCooperationStats",
    # Vocational Assessment models
    "VocSkillStandard", "VocSkillAssessment", "VocCertificate",
    "VocSkillStandardCreate", "VocAssessmentCreate", "VocCertificateCreate",
    "VocStudentSkillProfile",
    # Exam models
    "QuestionBank", "Question", "ExamPaper", "PaperQuestion", "ExamTask", "ExamResult",
    "QuestionType", "QuestionDifficulty", "QuestionBankSource", "QuestionStatus",
    "ExamPaperStatus", "ExamMode", "ExamTaskStatus", "ExamResultStatus", "SubmitType",
    # Feature Flag models
    "FeatureModule", "OrgFeatureFlag", "FeatureChangeLog",
    "FeatureCategory", "FeatureModuleResponse", "FeatureToggleRequest",
    "BatchToggleRequest", "OrgFeatureFlagResponse", "FeatureChangeLogResponse",
    "FeatureConfigResponse",
]
