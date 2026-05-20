"""
Demo 环境只读账号中间件
防止演示账号修改数据
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Callable
import logging

logger = logging.getLogger(__name__)


# Demo 账号标识（可以从环境变量读取）
DEMO_USER_EMAILS = [
    "%@student.local",
    "%starrobotics.edu.cn",
    "%xxprimary.edu.cn", 
    "%xxvocational.edu.cn",
    "%xxedu.gov.cn"
]


def is_demo_user(email: str) -> bool:
    """检查用户是否为演示账号"""
    if not email:
        return False
    
    for pattern in DEMO_USER_EMAILS:
        if pattern.startswith("%"):
            # 后缀匹配
            if email.endswith(pattern[1:]):
                return True
        else:
            # 精确匹配
            if email == pattern:
                return True
    
    return False


class DemoReadOnlyMiddleware:
    """
    Demo 环境只读中间件
    
    功能：
    1. 检测请求是否来自演示账号
    2. 拦截所有写操作（POST/PUT/DELETE/PATCH）
    3. 返回友好的错误提示
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # 只拦截写操作
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # 从请求中获取用户信息（假设已通过认证中间件）
            user_email = getattr(request.state, "user_email", None)
            
            if user_email and is_demo_user(user_email):
                # 演示账号尝试写操作，返回错误
                response_data = {
                    "detail": "演示环境为只读模式，无法修改数据",
                    "message": "这是演示账号，所有写操作已被禁用。如需完整功能，请下载本地版或注册云服务。",
                    "demo_mode": True,
                    "suggestion": "您可以浏览所有功能，但无法创建、修改或删除数据。"
                }
                
                response = JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content=response_data
                )
                
                logger.info(f"Demo 用户 {user_email} 尝试 {request.method} {request.url.path} - 已拦截")
                
                await response(scope, receive, send)
                return
        
        # 非演示账号或读操作，继续处理
        await self.app(scope, receive, send)


# 简化的依赖注入方式（用于路由级别控制）
async def verify_not_demo_user(request: Request):
    """
    依赖函数：验证用户不是演示账号
    
    用法：
    @router.post("/some-endpoint")
    async def create_something(
        data: SomeData,
        _: None = Depends(verify_not_demo_user)
    ):
        ...
    """
    user_email = getattr(request.state, "user_email", None)
    
    if user_email and is_demo_user(user_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "演示环境为只读模式",
                "suggestion": "请下载本地版或注册云服务以使用完整功能"
            }
        )
    
    return True


# 装饰器方式（更简洁）
def demo_readonly_guard(func: Callable):
    """
    装饰器：保护路由不被演示账号访问
    
    用法：
    @router.post("/some-endpoint")
    @demo_readonly_guard
    async def create_something(data: SomeData):
        ...
    """
    async def wrapper(*args, **kwargs):
        # 从 kwargs 中获取 request
        request = kwargs.get('request')
        if not request:
            # 尝试从 args 中找
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
        
        if request:
            user_email = getattr(request.state, "user_email", None)
            if user_email and is_demo_user(user_email):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="演示环境为只读模式，无法修改数据"
                )
        
        return await func(*args, **kwargs)
    
    return wrapper
