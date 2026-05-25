"""
消息通知数据模型
用于管理STEM培训机构的消息中心
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship

from utils.database import Base


class NotificationType(enum.Enum):
    """通知类型枚举"""
    APPROVAL = "approval"  # 审批提醒
    RENEWAL = "renewal"  # 续费预警
    ACTIVITY = "activity"  # 活动通知
    SYSTEM = "system"  # 系统通知
    PAYMENT = "payment"  # 缴费提醒
    SCHEDULE = "schedule"  # 排课提醒


class NotificationPriority(enum.Enum):
    """通知优先级枚举"""
    HIGH = "high"  # 高优先级（紧急）
    MEDIUM = "medium"  # 中优先级
    LOW = "low"  # 低优先级


class Notification(Base):
    """消息通知模型"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    
    # 基本信息
    title = Column(String(200), nullable=False)  # 通知标题
    content = Column(Text, nullable=False)  # 通知内容
    
    # 分类信息
    type = Column(Enum(NotificationType), nullable=False)  # 通知类型
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)  # 优先级
    
    # 状态
    is_read = Column(Boolean, default=False, nullable=False)  # 是否已读
    read_time = Column(DateTime, nullable=True)  # 阅读时间
    
    # 关联对象（可选）
    related_type = Column(String(50), nullable=True)  # 关联对象类型（student/competition/course等）
    related_id = Column(Integer, nullable=True)  # 关联对象ID
    
    # 操作按钮
    action_label = Column(String(50), nullable=True)  # 操作按钮文字
    action_url = Column(String(300), nullable=True)  # 操作链接
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    expire_time = Column(DateTime, nullable=True)  # 过期时间
    
    # 关联
    organization = relationship("Organization", back_populates="notifications")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "title": self.title,
            "content": self.content,
            "type": self.type.value if isinstance(self.type, NotificationType) else self.type,
            "priority": self.priority.value if isinstance(self.priority, NotificationPriority) else self.priority,
            "is_read": self.is_read,
            "read_time": self.read_time.isoformat() if self.read_time else None,
            "related_type": self.related_type,
            "related_id": self.related_id,
            "action_label": self.action_label,
            "action_url": self.action_url,
            "create_time": self.create_time.isoformat() if self.create_time else None,
            "expire_time": self.expire_time.isoformat() if self.expire_time else None,
        }
