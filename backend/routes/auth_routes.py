"""
认证相关路由
提供用户注册、登录、Token刷新等功能
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.base_models import User
from utils.database import get_db
from utils.auth_utils import (
    create_access_token_sync,
    create_refresh_token_sync,
    get_current_user_sync,
    verify_token_sync,
)
from config.settings import settings
import bcrypt
import requests

router = APIRouter(prefix="/api/v1/auth", tags=["认证"])

# 确保 User 模型有 password_hash 字段
# 如果 base_models.py 中还没有，请手动添加: password_hash = Column(String(255), nullable=False)


class Token(BaseModel):
    access_token: str
    token_type: str


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None
    verification_code: str | None = None  # 邮箱验证码（可选，云托管版必填）


class SendVerificationCodeRequest(BaseModel):
    email: str


class VerifyEmailCodeRequest(BaseModel):
    email: str
    code: str


class LinkImatuRequest(BaseModel):
    imatu_user_id: str
    phone: str | None = None


class VerifyImatuRequest(BaseModel):
    imatu_token: str


def hash_password(password: str) -> str:
    """对密码进行哈希处理"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


@router.post("/email/send-code", summary="发送邮箱验证码")
def send_email_verification_code(
    req: SendVerificationCodeRequest,
    db: Session = Depends(get_db),
):
    """发送邮箱验证码（注册 Step 4）"""
    from services.email_verification_service import EmailVerificationService
    svc = EmailVerificationService(db)
    try:
        result = svc.send_verification_code(req.email)
        return result
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))


@router.post("/email/verify-code", summary="校验邮箱验证码")
def verify_email_code(
    req: VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
):
    """校验邮箱验证码"""
    from services.email_verification_service import EmailVerificationService
    svc = EmailVerificationService(db)
    try:
        result = svc.verify_code(req.email, req.code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/register", response_model=dict)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册（支持邮箱验证）"""
    # 检查用户名或邮箱是否已存在
    if db.query(User).filter((User.username == user_data.username) | (User.email == user_data.email)).first():
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册")

    # 邮箱验证（如果提供了验证码）
    if user_data.verification_code:
        from services.email_verification_service import EmailVerificationService
        svc = EmailVerificationService(db)
        try:
            svc.verify_code(user_data.email, user_data.verification_code)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"邮箱验证失败: {e}")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "注册成功", "user_id": new_user.id}


@router.post("/token")
def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """用户登录并获取 Access Token

    - access_token 在 JSON body 中返回（前端放入内存/短期 store）
    - refresh_token 在 Set-Cookie (httpOnly, secure, sameSite=lax) 中返回
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from models.user_organization import UserOrganization

    user_org = db.query(UserOrganization).filter(
        UserOrganization.user_id == user.id
    ).first()
    org_id = user_org.org_id if user_org else None

    access_token = create_access_token_sync(
        data={"sub": user.username, "org_id": org_id, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token_sync(
        data={"sub": user.username, "org_id": org_id, "type": "refresh"},
    )

    _set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh")
def refresh_access_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """使用 refresh cookie 换取新的 access token"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="缺少 refresh token")

    payload = verify_token_sync(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="无效的 refresh token")

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户已禁用")

    from models.user_organization import UserOrganization

    user_org = db.query(UserOrganization).filter(
        UserOrganization.user_id == user.id
    ).first()
    org_id = user_org.org_id if user_org else None

    access_token = create_access_token_sync(
        data={"sub": username, "org_id": org_id, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # 可选：旋转 refresh token
    new_refresh = create_refresh_token_sync(
        data={"sub": username, "org_id": org_id, "type": "refresh"},
    )
    _set_refresh_cookie(response, new_refresh)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """登出：清除 refresh cookie"""
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        samesite="lax",
    )
    return {"message": "已登出"}


def _set_refresh_cookie(response: Response, token: str) -> None:
    # 生产部署若走 HTTPS 会自动加上 secure；本地开发 HTTP 也能工作
    secure = os.getenv("ENFORCE_HTTPS", "0").lower() in ("1", "true", "yes")
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,  # 7 天
    )


import os  # noqa: E402  - 放置于文件末段，不影响风格检查


@router.get("/me", response_model=dict)
def get_current_user_info(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """获取当前登录用户信息"""
    try:
        from models.user_organization import UserOrganization
        
        # 查询用户所属的组织
        user_org = db.query(UserOrganization).filter(
            UserOrganization.user_id == current_user.id
        ).first()
        
        org_id = user_org.org_id if user_org else None
        role = user_org.role.value if user_org and user_org.role else "user"
        
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "org_id": org_id,
            "role": role
        }
    except Exception as e:
        # 如果查询失败，返回基本用户信息
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "org_id": None,
            "role": "user",
            "error": str(e)
        }


@router.post("/link-imatu", response_model=dict)
def link_imatu_account(
    request: LinkImatuRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """关联 iMato 账户"""
    try:
        # 检查 imatu_user_id 是否已被其他用户关联
        existing_user = db.query(User).filter(User.imatu_user_id == request.imatu_user_id).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="该 iMato 用户 ID 已被关联")
        
        # 更新当前用户的 iMato 用户 ID 和手机号
        current_user.imatu_user_id = request.imatu_user_id
        if request.phone:
            # 检查手机号是否已被使用
            existing_phone_user = db.query(User).filter(User.phone == request.phone).first()
            if existing_phone_user and existing_phone_user.id != current_user.id:
                raise HTTPException(status_code=400, detail="该手机号已被使用")
            current_user.phone = request.phone
        
        current_user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "message": "iMato 账户关联成功",
            "imatu_user_id": current_user.imatu_user_id,
            "phone": current_user.phone
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"关联失败: {str(e)}")


@router.post("/verify-imatu", response_model=dict)
def verify_imatu_token(
    request: VerifyImatuRequest,
    db: Session = Depends(get_db)
):
    """验证 iMato JWT Token 并创建/获取本地用户"""
    try:
        imatu_token = request.imatu_token
        # 验证 iMato token（需要 iMato 提供验证接口）
        # 这里假设 iMato 提供了验证接口
        verify_url = f"{settings.IMATU_API_BASE}/auth/verify"
        headers = {"Authorization": f"Bearer {imatu_token}"}
        
        response = requests.get(verify_url, headers=headers, timeout=5)
        response.raise_for_status()
        
        imatu_user_data = response.json()
        imatu_user_id = imatu_user_data.get("user_id")
        
        if not imatu_user_id:
            raise HTTPException(status_code=400, detail="iMato token 无效")
        
        # 查找是否已有本地用户
        user = db.query(User).filter(User.imatu_user_id == imatu_user_id).first()
        
        if user:
            # 用户已存在，生成本地 token
            org_id = _get_user_org_id(user.id, db)
            access_token = _generate_local_token(user.username, org_id)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.id,
                "username": user.username,
                "is_new_user": False
            }
        else:
            # 新用户，需要先关联才能使用
            return {
                "message": "新用户，请先关联账户",
                "imatu_user_id": imatu_user_id,
                "is_new_user": True
            }
            
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"iMato 服务不可用: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"验证失败: {str(e)}")


def _get_user_org_id(user_id: int, db: Session) -> int | None:
    """获取用户所属组织 ID"""
    from models.user_organization import UserOrganization
    user_org = db.query(UserOrganization).filter(
        UserOrganization.user_id == user_id
    ).first()
    return user_org.org_id if user_org else None


def _generate_local_token(username: str, org_id: int | None = None) -> str:
    """生成本地访问令牌"""
    token_data = {"sub": username}
    if org_id:
        token_data["org_id"] = org_id
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token_sync(
        data=token_data, expires_delta=access_token_expires
    )
