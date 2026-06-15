"""
iMato 同步服务
用于在课程报名、出勤记录等关键业务操作时回调 iMato 系统
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
import requests
from sqlalchemy.orm import Session

from config.settings import settings

# 配置日志
logger = logging.getLogger(__name__)


class ImatuSyncService:
    """iMato 同步服务类"""
    
    def __init__(self):
        self.api_base = settings.IMATU_API_BASE
        self.api_key = settings.IMATU_API_KEY
        self.enabled = settings.IMATU_SYNC_ENABLED
        self.timeout = 10  # 请求超时时间（秒）
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        发送 HTTP 请求到 iMato API
        
        Args:
            method: HTTP 方法 (GET, POST, PUT, DELETE)
            endpoint: API 端点
            data: 请求数据
            headers: 请求头
            
        Returns:
            响应数据字典，失败返回 None
        """
        if not self.enabled:
            logger.info("iMato 同步功能已禁用，跳过回调")
            return None
        
        try:
            url = f"{self.api_base}{endpoint}"
            
            # 默认请求头
            default_headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            if headers:
                default_headers.update(headers)
            
            # 发送请求
            if method.upper() == "GET":
                response = requests.get(
                    url,
                    params=data,
                    headers=default_headers,
                    timeout=self.timeout
                )
            elif method.upper() == "POST":
                response = requests.post(
                    url,
                    json=data,
                    headers=default_headers,
                    timeout=self.timeout
                )
            elif method.upper() == "PUT":
                response = requests.put(
                    url,
                    json=data,
                    headers=default_headers,
                    timeout=self.timeout
                )
            elif method.upper() == "DELETE":
                response = requests.delete(
                    url,
                    headers=default_headers,
                    timeout=self.timeout
                )
            else:
                logger.error(f"不支持的 HTTP 方法: {method}")
                return None
            
            # 检查响应状态
            response.raise_for_status()
            
            return response.json()
            
        except requests.Timeout:
            logger.error(f"iMato API 请求超时: {endpoint}")
            return None
        except requests.RequestException as e:
            logger.error(f"iMato API 请求失败: {endpoint}, 错误: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"iMato 同步异常: {str(e)}")
            return None
    
    def sync_enrollment(
        self,
        user_id: int,
        imatu_user_id: str,
        course_id: int,
        course_title: str,
        enrollment_date: datetime,
        org_id: int,
        db: Session
    ) -> bool:
        """
        同步课程报名信息到 iMato
        
        Args:
            user_id: 本地用户 ID
            imatu_user_id: iMato 用户 ID
            course_id: 课程 ID
            course_title: 课程标题
            enrollment_date: 报名时间
            org_id: 机构 ID
            db: 数据库会话
            
        Returns:
            bool: 同步是否成功
        """
        if not imatu_user_id:
            logger.warning(f"用户 {user_id} 未关联 iMato 账户，跳过同步")
            return False
        
        data = {
            "imatu_user_id": imatu_user_id,
            "local_user_id": user_id,
            "local_course_id": course_id,
            "course_title": course_title,
            "enrollment_date": enrollment_date.isoformat(),
            "org_id": org_id,
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
        response = self._make_request(
            "POST",
            "/sync/enrollment",
            data=data
        )
        
        if response:
            logger.info(f"课程报名同步成功: 用户 {user_id}, 课程 {course_id}")
            return True
        else:
            logger.error(f"课程报名同步失败: 用户 {user_id}, 课程 {course_id}")
            return False
    
    def sync_attendance(
        self,
        user_id: int,
        imatu_user_id: str,
        course_id: int,
        attendance_date: datetime,
        status: str,
        db: Session
    ) -> bool:
        """
        同步出勤记录到 iMato
        
        Args:
            user_id: 本地用户 ID
            imatu_user_id: iMato 用户 ID
            course_id: 课程 ID
            attendance_date: 出勤日期
            status: 出勤状态
            db: 数据库会话
            
        Returns:
            bool: 同步是否成功
        """
        if not imatu_user_id:
            logger.warning(f"用户 {user_id} 未关联 iMato 账户，跳过同步")
            return False
        
        data = {
            "imatu_user_id": imatu_user_id,
            "local_user_id": user_id,
            "local_course_id": course_id,
            "attendance_date": attendance_date.isoformat(),
            "status": status,
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
        response = self._make_request(
            "POST",
            "/sync/attendance",
            data=data
        )
        
        if response:
            logger.info(f"出勤记录同步成功: 用户 {user_id}, 课程 {course_id}")
            return True
        else:
            logger.error(f"出勤记录同步失败: 用户 {user_id}, 课程 {course_id}")
            return False
    
    def sync_user_profile(
        self,
        user_id: int,
        imatu_user_id: str,
        username: str,
        email: str,
        phone: Optional[str] = None,
        full_name: Optional[str] = None,
        db: Session = None
    ) -> bool:
        """
        同步用户资料到 iMato
        
        Args:
            user_id: 本地用户 ID
            imatu_user_id: iMato 用户 ID
            username: 用户名
            email: 邮箱
            phone: 手机号（可选）
            full_name: 全名（可选）
            db: 数据库会话
            
        Returns:
            bool: 同步是否成功
        """
        if not imatu_user_id:
            logger.warning(f"用户 {user_id} 未关联 iMato 账户，跳过同步")
            return False
        
        data = {
            "imatu_user_id": imatu_user_id,
            "local_user_id": user_id,
            "username": username,
            "email": email,
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
        if phone:
            data["phone"] = phone
        
        if full_name:
            data["full_name"] = full_name
        
        response = self._make_request(
            "PUT",
            "/sync/user",
            data=data
        )
        
        if response:
            logger.info(f"用户资料同步成功: 用户 {user_id}")
            return True
        else:
            logger.error(f"用户资料同步失败: 用户 {user_id}")
            return False
    
    def verify_imatu_user(self, imatu_user_id: str) -> bool:
        """
        验证 iMato 用户是否存在
        
        Args:
            imatu_user_id: iMato 用户 ID
            
        Returns:
            bool: 用户是否存在
        """
        if not imatu_user_id:
            return False
        
        response = self._make_request(
            "GET",
            f"/users/{imatu_user_id}"
        )
        
        return response is not None


# 全局实例
imatu_sync_service = ImatuSyncService()


def get_imatu_user_id(user_id: int, db: Session) -> Optional[str]:
    """
    获取用户关联的 iMato 用户 ID
    
    Args:
        user_id: 本地用户 ID
        db: 数据库会话
        
    Returns:
        iMato 用户 ID，如果未关联返回 None
    """
    try:
        from models.base_models import User
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user.imatu_user_id
        return None
    except Exception as e:
        logger.error(f"查询 iMato 用户 ID 失败: {str(e)}")
        return None