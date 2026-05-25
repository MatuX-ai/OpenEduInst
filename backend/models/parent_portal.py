"""
家长中心数据模型
用于STEM培训机构的家校互动和学员成长档案管理
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean
from sqlalchemy.orm import relationship

from utils.database import Base


class FeedbackRating(enum.Enum):
    """评价等级枚举"""
    EXCELLENT = 5  # 优秀
    GOOD = 4  # 良好
    AVERAGE = 3  # 一般
    NEED_IMPROVE = 2  # 需改进
    POOR = 1  # 较差


class ClassFeedback(Base):
    """课堂反馈模型"""
    __tablename__ = "class_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    
    # 基本信息
    course_name = Column(String(200), nullable=False)  # 课程名称
    teacher_name = Column(String(100), nullable=False)  # 教师姓名
    
    # 反馈内容
    content = Column(Text, nullable=False)  # 课堂表现描述
    homework = Column(Text, nullable=True)  # 课后作业
    
    # 评价
    rating = Column(Enum(FeedbackRating), nullable=False)  # 评分（1-5星）
    
    # 时间信息
    class_date = Column(DateTime, nullable=False)  # 上课日期
    feedback_time = Column(DateTime, default=datetime.utcnow, nullable=False)  # 反馈时间
    
    # 附件（JSON格式存储照片URL等）
    attachments = Column(Text, nullable=True)  # 课堂照片、作品照片等
    
    # 是否已读
    is_read = Column(Boolean, default=False, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="feedbacks")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "student_id": self.student_id,
            "course_name": self.course_name,
            "teacher_name": self.teacher_name,
            "content": self.content,
            "homework": self.homework,
            "rating": self.rating.value if isinstance(self.rating, FeedbackRating) else self.rating,
            "class_date": self.class_date.isoformat() if self.class_date else None,
            "feedback_time": self.feedback_time.isoformat() if self.feedback_time else None,
            "attachments": self.attachments,
            "is_read": self.is_read,
        }


class StudentAchievement(Base):
    """学员成就/荣誉模型"""
    __tablename__ = "student_achievements"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    
    # 基本信息
    name = Column(String(200), nullable=False)  # 成就名称（如"蓝桥杯三等奖"）
    type = Column(String(50), nullable=False)  # 类型：competition/certification/award
    
    # 描述
    description = Column(Text, nullable=True)  # 详细描述
    
    # 获得时间
    achieved_date = Column(DateTime, nullable=False)  # 获得日期
    
    # 图标/徽章
    icon = Column(String(50), nullable=True)  # emoji或图标代码
    
    # 关联证书/奖状文件
    certificate_url = Column(String(300), nullable=True)  # 证书图片URL
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="achievements")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "student_id": self.student_id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "achieved_date": self.achieved_date.isoformat() if self.achieved_date else None,
            "icon": self.icon,
            "certificate_url": self.certificate_url,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }


class ParentMessage(Base):
    """家长消息模型（家校沟通）"""
    __tablename__ = "parent_messages"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    
    # 发送者信息
    sender_type = Column(String(20), nullable=False)  # teacher/parent/admin
    sender_name = Column(String(100), nullable=False)  # 发送者姓名
    
    # 消息内容
    content = Column(Text, nullable=False)  # 消息内容
    
    # 消息类型
    message_type = Column(String(50), nullable=False)  # feedback/question/notification
    
    # 状态
    is_read = Column(Boolean, default=False, nullable=False)
    read_time = Column(DateTime, nullable=True)
    
    # 回复关联
    parent_message_id = Column(Integer, ForeignKey("parent_messages.id"), nullable=True)  # 回复的消息ID
    
    # 时间戳
    create_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联
    organization = relationship("Organization", back_populates="parent_messages")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "student_id": self.student_id,
            "sender_type": self.sender_type,
            "sender_name": self.sender_name,
            "content": self.content,
            "message_type": self.message_type,
            "is_read": self.is_read,
            "read_time": self.read_time.isoformat() if self.read_time else None,
            "parent_message_id": self.parent_message_id,
            "create_time": self.create_time.isoformat() if self.create_time else None,
        }
