"""
认证相关路由
提供用户注册、登录、Token刷新等功能
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.base_models import User
from utils.database import get_db
from utils.auth_utils import create_access_token_sync, get_current_user_sync
from config.settings import settings
import bcrypt

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


def hash_password(password: str) -> str:
    """对密码进行哈希处理"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


@router.post("/register", response_model=dict)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查用户名或邮箱是否已存在
    if db.query(User).filter((User.username == user_data.username) | (User.email == user_data.email)).first():
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册")
    
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


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """用户登录并获取 Access Token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token_sync(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


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
        
        org_id = user_org.organization_id if user_org else None
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
