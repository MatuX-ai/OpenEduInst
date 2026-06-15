"""
基础用户模型
用于解决外键依赖问题
注意：Student和Course表已在其他文件中定义
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from utils.database import Base


class User(Base):
    """简化版用户模型"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200))
    phone = Column(String(20), unique=True, index=True, nullable=True)  # 手机号码
    imatu_user_id = Column(String(100), unique=True, index=True, nullable=True)  # iMato 用户 ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class Teacher(Base):
    """简化版教师模型"""
    
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    specialty = Column(String(200))  # 专业领域
    hourly_rate = Column(Integer)  # 课时费
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Teacher(id={self.id}, name='{self.name}')>"


class Course(Base):
    """简化版课程模型"""
    
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500))
    category = Column(String(50))  # 课程分类
    difficulty = Column(String(20))  # 难度等级
    duration_hours = Column(Integer)  # 课程时长（小时）
    price = Column(Integer)  # 价格
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Course(id={self.id}, title='{self.title}')>"