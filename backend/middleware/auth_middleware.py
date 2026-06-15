"""
认证中间件
优先验证 iMato JWT，失败后回退到本地 JWT 验证
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.settings import settings
from models.base_models import User
from utils.database import get_db

# HTTP Bearer 认证方案
security = HTTPBearer(auto_error=False)


async def verify_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    验证 Token（优先尝试 iMato JWT，失败后回退到本地 JWT）
    
    Args:
        request: FastAPI 请求对象
        credentials: HTTP Bearer 凭证
        db: 数据库会话
        
    Returns:
        User: 认证后的用户对象
        
    Raises:
        HTTPException: 认证失败时抛出
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # 尝试从请求头判断是否为 iMato token
    auth_source = request.headers.get("X-Auth-Source", "")
    
    # 优先尝试验证 iMato token
    if auth_source == "imatu" or _try_verify_imatu_token(token):
        return await _verify_imatu_user(token, db)
    
    # 回退到本地 token 验证
    return await _verify_local_token(token, db)


async def _verify_imatu_user(token: str, db: Session) -> User:
    """
    验证 iMato token 并获取本地用户
    
    Args:
        token: iMato JWT token
        db: 数据库会话
        
    Returns:
        User: 本地用户对象
    """
    try:
        # 尝试使用 iMato 密钥解码
        payload = jwt.decode(
            token,
            settings.IMATU_SECRET_KEY,
            algorithms=[settings.IMATU_JWT_ALGORITHM]
        )
        
        imatu_user_id = payload.get("user_id") or payload.get("sub")
        
        if not imatu_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="iMato token 无效：缺少用户 ID"
            )
        
        # 查找关联的本地用户
        stmt = select(User).filter(
            User.imatu_user_id == str(imatu_user_id),
            User.is_active == True
        )
        result = db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未找到关联的本地用户，请先关联账户"
            )
        
        return user
        
    except JWTError as e:
        # iMato token 解码失败，不抛出错误，让回退逻辑处理
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"iMato token 无效: {str(e)}"
        )


async def _verify_local_token(token: str, db: Session) -> User:
    """
    验证本地 token 并获取用户
    
    Args:
        token: 本地 JWT token
        db: 数据库会话
        
    Returns:
        User: 本地用户对象
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="本地 token 无效：缺少用户名"
            )
        
        # 查询用户
        stmt = select(User).filter(
            User.username == username,
            User.is_active == True
        )
        result = db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或已被禁用"
            )
        
        # 将租户 ID 附加到用户对象上（如果存在）
        org_id: Optional[int] = payload.get("org_id")
        if org_id:
            user.org_id = org_id
        
        return user
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"本地 token 无效: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _try_verify_imatu_token(token: str) -> bool:
    """
    尝试验证是否为有效的 iMato token（不抛出异常）
    
    Args:
        token: JWT token
        
    Returns:
        bool: 是否为有效的 iMato token
    """
    try:
        payload = jwt.decode(
            token,
            settings.IMATU_SECRET_KEY,
            algorithms=[settings.IMATU_JWT_ALGORITHM]
        )
        # 如果解码成功且包含 user_id 或 sub 字段，认为是 iMato token
        return bool(payload.get("user_id") or payload.get("sub"))
    except JWTError:
        return False


# 便捷的依赖项函数
get_current_user = verify_token