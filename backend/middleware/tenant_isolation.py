"""
多租户数据隔离中间件
自动从 Token 中提取 org_id 并注入到请求上下文中，确保业务接口只能访问当前组织的数据
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from config.settings import settings
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_org_id(request: Request) -> int:
    """
    从请求的 Authorization Header 中提取 org_id
    """
    token = await oauth2_scheme(request)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        org_id: Optional[int] = payload.get("org_id")
        if org_id is None:
            raise HTTPException(
                status_code=403, 
                detail="Token 中缺少组织信息，请重新登录或创建组织"
            )
        return org_id
    except JWTError:
        raise HTTPException(
            status_code=401, 
            detail="无效的 Token"
        )

class TenantIsolationMiddleware:
    """
    简单的中间件示例，实际在 FastAPI 中通常通过 Depends 实现逻辑隔离
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # 这里可以添加全局的日志记录或预处理逻辑
        await self.app(scope, receive, send)
