"""
认证相关路由
提供用户注册、登录、Token刷新等功能
"""

from datetime import datetime, timedelta
import logging
import os
import re
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator, Field

from models.base_models import User
from utils.database import get_db
from utils.auth_utils import (
    create_access_token_sync,
    create_refresh_token_sync,
    get_current_user_sync,
    verify_token_sync,
    hash_password,
    verify_password,
)
from config.settings import settings
import requests

# 向后兼容：user_license_routes.py 等此前依赖此别名
get_current_user = get_current_user_sync

router = APIRouter(prefix="/api/v1/auth", tags=["认证"])

# 模块级 logger：日志中出现 `routes.auth_routes`，方便 grep 过滤
logger = logging.getLogger(__name__)

# ---------- 校验规则常量（集中管理，便于测试与调整） ----------
USERNAME_MIN_LEN = 3
USERNAME_MAX_LEN = 50
PASSWORD_MIN_LEN = 8
PASSWORD_MAX_LEN = 128
EMAIL_MAX_LEN = 254

# RFC 5322 简化版邮箱正则（足够覆盖 99% 的真实用户场景）
_EMAIL_RE = re.compile(
    r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+"
    r"(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*"
    r"@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+"
    r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$"
)

# 密码强度：必须同时包含大写字母 / 小写字母 / 数字 / 特殊字符
_HAS_UPPER = re.compile(r"[A-Z]")
_HAS_LOWER = re.compile(r"[a-z]")
_HAS_DIGIT = re.compile(r"[0-9]")
_HAS_SPECIAL = re.compile(r"[!@#$%^&*()\-_=+[\]{};:'\",.<>/?\\|`~]")

# 常见弱密码黑名单（注册 / 重置密码时拒绝）
_COMMON_PASSWORDS = frozenset({
    "password", "123456", "12345678", "123456789", "qwerty",
    "abc123", "password1", "111111", "letmein", "admin",
    "welcome", "iloveyou", "monkey", "dragon", "master",
})


def _mask_email(email: str | None) -> str:
    """脱敏工具：仅打印邮箱前 3 个字符 + '@domain'。"""
    if not email:
        return ""
    try:
        local, _, domain = email.strip().partition("@")
        prefix = local[:3] + "***" if len(local) > 3 else "***"
        return f"{prefix}@{domain or '?'}"
    except Exception:
        return "<masked>"


def _mask_username(username: str | None) -> str:
    """脱敏工具：仅打印用户名前 3 个字符 + '***'。"""
    if not username:
        return ""
    u = username.strip()
    return u[:3] + "***" if len(u) > 3 else "***"


def _validate_email(email: str) -> str:
    """标准化邮箱：小写去空格 + 格式校验 + 长度校验。

    每条校验失败都会写入 WARNING 日志，便于定位用户注册失败时是哪个规则被触发。
    """
    rule = "email_type"
    try:
        if not isinstance(email, str):
            raise ValueError("邮箱必须是字符串")
        rule = "email_empty"
        cleaned = email.strip().lower()
        if not cleaned:
            raise ValueError("邮箱不能为空")
        rule = "email_length"
        if len(cleaned) > EMAIL_MAX_LEN:
            raise ValueError(f"邮箱长度不能超过 {EMAIL_MAX_LEN} 个字符")
        rule = "email_format"
        if not _EMAIL_RE.match(cleaned):
            raise ValueError("邮箱格式无效，请输入有效的邮箱地址（例如 name@example.com）")
        logger.info("[auth.validate.email] PASS rule=ALL input=%s", _mask_email(cleaned))
        return cleaned
    except ValueError as exc:
        # 注意：不在日志中打印原始 email 字符串，仅打印脱敏后的前缀 + 规则名
        logger.warning("[auth.validate.email] FAIL rule=%s input=%s reason=%s",
                       rule, _mask_email(email if isinstance(email, str) else str(email)),
                       str(exc))
        raise


def _validate_password(password: str, username: str | None = None, email: str | None = None) -> str:
    """密码强度校验：长度 + 字符多样性 + 不能与用户名/邮箱重复。

    每条失败规则都会写入 WARNING 日志，便于定位用户注册时被哪条规则拦截。
    注意：绝对不在日志中输出 password 明文，只写规则名和字符串长度。
    """
    rule = "password_type"
    try:
        if not isinstance(password, str):
            raise ValueError("密码必须是字符串")
        pwd_len = len(password)

        rule = "password_min_len"
        if pwd_len < PASSWORD_MIN_LEN:
            raise ValueError(f"密码长度至少为 {PASSWORD_MIN_LEN} 个字符")
        rule = "password_max_len"
        if pwd_len > PASSWORD_MAX_LEN:
            raise ValueError(f"密码长度不能超过 {PASSWORD_MAX_LEN} 个字符")
        rule = "password_has_upper"
        if not _HAS_UPPER.search(password):
            raise ValueError("密码必须至少包含一个大写字母（A-Z）")
        rule = "password_has_lower"
        if not _HAS_LOWER.search(password):
            raise ValueError("密码必须至少包含一个小写字母（a-z）")
        rule = "password_has_digit"
        if not _HAS_DIGIT.search(password):
            raise ValueError("密码必须至少包含一个数字（0-9）")
        rule = "password_has_special"
        if not _HAS_SPECIAL.search(password):
            raise ValueError("密码必须至少包含一个特殊字符（例如 !@#$%^&* 等）")
        rule = "password_common_blacklist"
        if password.lower() in _COMMON_PASSWORDS:
            raise ValueError("密码过于常见，请选择更复杂的密码")
        rule = "password_equals_username"
        if username and password.lower() == username.lower():
            raise ValueError("密码不能与用户名相同")
        rule = "password_equals_email"
        if email and password.lower() == email.lower():
            raise ValueError("密码不能与邮箱相同")

        logger.info(
            "[auth.validate.password] PASS rule=ALL length=%d username=%s email=%s",
            pwd_len, _mask_username(username), _mask_email(email),
        )
        return password
    except ValueError as exc:
        logger.warning(
            "[auth.validate.password] FAIL rule=%s length=%d username=%s email=%s reason=%s",
            rule, len(password) if isinstance(password, str) else -1,
            _mask_username(username), _mask_email(email),
            str(exc),
        )
        raise


def _validate_username(username: str) -> str:
    """用户名校验：长度 + 允许的字符集（字母、数字、下划线、短横线）。

    每条校验失败会写入 WARNING 日志；成功写入 INFO 日志。
    """
    rule = "username_type"
    try:
        if not isinstance(username, str):
            raise ValueError("用户名必须是字符串")
        s = username.strip()
        rule = "username_length"
        if len(s) < USERNAME_MIN_LEN or len(s) > USERNAME_MAX_LEN:
            raise ValueError(
                f"用户名长度必须在 {USERNAME_MIN_LEN}-{USERNAME_MAX_LEN} 个字符之间"
            )
        rule = "username_charset"
        if not re.fullmatch(r"[A-Za-z0-9_\-]+", s):
            raise ValueError("用户名只能包含字母、数字、下划线或短横线")
        logger.info("[auth.validate.username] PASS rule=ALL input=%s", _mask_username(s))
        return s
    except ValueError as exc:
        logger.warning("[auth.validate.username] FAIL rule=%s input=%s reason=%s",
                       rule, _mask_username(username if isinstance(username, str) else str(username)),
                       str(exc))
        raise


class Token(BaseModel):
    access_token: str
    token_type: str


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = Field(default=None, max_length=100)
    verification_code: str | None = Field(
        default=None, max_length=32, description="邮箱验证码（可选，云托管版必填）"
    )

    @field_validator("username", mode="before")
    @classmethod
    def _check_username(cls, v: object) -> str:
        return _validate_username(v if isinstance(v, str) else "")

    @field_validator("email", mode="before")
    @classmethod
    def _check_email(cls, v: object) -> str:
        return _validate_email(v if isinstance(v, str) else "")

    @field_validator("password", mode="before")
    @classmethod
    def _check_password(cls, v: object, info: object) -> str:
        values = getattr(info, "data", {}) if hasattr(info, "data") else {}
        # 在 Pydantic v2 中，info.data 是验证到此为止已完成字段的 dict
        username_val = values.get("username") if isinstance(values, dict) else None
        email_val = values.get("email") if isinstance(values, dict) else None
        return _validate_password(
            v if isinstance(v, str) else "",
            username=username_val if isinstance(username_val, str) else None,
            email=email_val if isinstance(email_val, str) else None,
        )

    # 注册完成后：用 cleaned 过的 email / username，避免大小写重复注册
    def get_normalized_email(self) -> str:
        return self.email

    def get_normalized_username(self) -> str:
        return self.username


class SendVerificationCodeRequest(BaseModel):
    email: str

    @field_validator("email", mode="before")
    @classmethod
    def _check_email(cls, v: object) -> str:
        return _validate_email(v if isinstance(v, str) else "")


class VerifyEmailCodeRequest(BaseModel):
    email: str
    code: str = Field(..., min_length=1, max_length=32)

    @field_validator("email", mode="before")
    @classmethod
    def _check_email(cls, v: object) -> str:
        return _validate_email(v if isinstance(v, str) else "")


class LinkImatuRequest(BaseModel):
    imatu_user_id: str = Field(..., min_length=1, max_length=128)
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{6,20}$", description="E.164 风格手机号")


class VerifyImatuRequest(BaseModel):
    imatu_token: str = Field(..., min_length=1, max_length=2048)


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
    """用户注册（支持邮箱验证）。

    注意：`user_data` 已在 Pydantic 层完成规范化（去空格、小写邮箱）
    与密码强度检查；db 层再做一次"是否已存在"检查，存在则返回 400。
    """
    normalized_username = user_data.get_normalized_username()
    normalized_email = user_data.get_normalized_email()

    # db 侧去重检查
    existing = (
        db.query(User)
        .filter(
            (User.username == normalized_username) | (User.email == normalized_email)
        )
        .first()
    )
    if existing:
        # 记录是 username 冲突还是 email 冲突（便于定位"恶意撞库"或用户自己误操作）
        conflict_on = []
        if existing.username == normalized_username:
            conflict_on.append("username")
        if existing.email == normalized_email:
            conflict_on.append("email")
        logger.warning(
            "[auth.register] REJECT reason=duplicate conflict_on=%s username=%s email=%s",
            ",".join(conflict_on) or "unknown",
            _mask_username(normalized_username),
            _mask_email(normalized_email),
        )
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册")

    # 邮箱验证码
    if user_data.verification_code:
        from services.email_verification_service import EmailVerificationService
        svc = EmailVerificationService(db)
        try:
            svc.verify_code(user_data.email, user_data.verification_code)
            logger.info("[auth.register] verification_code OK email=%s",
                        _mask_email(user_data.email))
        except ValueError as exc:
            logger.warning("[auth.register] verification_code FAIL email=%s reason=%s",
                           _mask_email(user_data.email), str(exc))
            raise HTTPException(status_code=400, detail=f"邮箱验证失败: {exc}")

    new_user = User(
        username=normalized_username,
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info("[auth.register] CREATED user_id=%d username=%s email=%s",
                new_user.id,
                _mask_username(normalized_username),
                _mask_email(normalized_email))
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
    username = form_data.username
    user = db.query(User).filter(User.username == username).first()
    # 无论用户是否存在、密码是否正确，日志均以 WARNING/INFO 输出，便于定位撞库
    if not user:
        logger.warning(
            "[auth.login] FAIL user_not_found username=%s",
            _mask_username(username),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.password_hash):
        logger.warning(
            "[auth.login] FAIL bad_password user_id=%d username=%s",
            user.id,
            _mask_username(username),
        )
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
    logger.info(
        "[auth.login] OK user_id=%d username=%s org_id=%s",
        user.id,
        _mask_username(user.username),
        org_id,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh")
def refresh_access_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """使用 refresh cookie 换取新的 access token"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("[auth.refresh] FAIL reason=missing_cookie")
        raise HTTPException(status_code=401, detail="缺少 refresh token")

    payload = verify_token_sync(refresh_token)
    if not payload or payload.get("type") != "refresh":
        logger.warning(
            "[auth.refresh] FAIL reason=invalid_token sub=%s type=%s",
            _mask_username(str(payload.get("sub"))) if isinstance(payload, dict) and payload.get("sub") else "",
            payload.get("type") if isinstance(payload, dict) else None,
        )
        raise HTTPException(status_code=401, detail="无效的 refresh token")

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if not user:
        logger.warning("[auth.refresh] FAIL reason=inactive_or_missing_user sub=%s",
                       _mask_username(username))
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
    logger.info("[auth.refresh] OK user_id=%d username=%s org_id=%s",
                user.id, _mask_username(user.username), org_id)
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
    logger.info("[auth.logout] OK cookie_cleared=true")
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


@router.get("/me", response_model=dict)
def get_current_user_info(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """获取当前登录用户信息"""
    try:
        from models.user_organization import UserOrganization

        user_org = db.query(UserOrganization).filter(
            UserOrganization.user_id == current_user.id
        ).first()

        org_id = user_org.org_id if user_org else None
        role = user_org.role.value if user_org and user_org.role else "user"

        logger.info(
            "[auth.me] OK user_id=%d username=%s org_id=%s role=%s",
            current_user.id,
            _mask_username(current_user.username),
            org_id,
            role,
        )
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
        logger.warning(
            "[auth.me] FAIL reason=lookup_error user_id=%d detail=%s",
            getattr(current_user, "id", -1),
            str(e),
        )
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
            logger.warning(
                "[auth.link_imatu] FAIL reason=duplicate_imatu_id user_id=%d imatu_user_id=%s",
                current_user.id,
                request.imatu_user_id,
            )
            raise HTTPException(status_code=400, detail="该 iMato 用户 ID 已被关联")

        current_user.imatu_user_id = request.imatu_user_id
        if request.phone:
            # 检查手机号是否已被使用
            existing_phone_user = db.query(User).filter(User.phone == request.phone).first()
            if existing_phone_user and existing_phone_user.id != current_user.id:
                logger.warning(
                    "[auth.link_imatu] FAIL reason=duplicate_phone user_id=%d",
                    current_user.id,
                )
                raise HTTPException(status_code=400, detail="该手机号已被使用")
            current_user.phone = request.phone

        current_user.updated_at = datetime.utcnow()
        db.commit()

        logger.info(
            "[auth.link_imatu] OK user_id=%d username=%s has_phone=%s",
            current_user.id,
            _mask_username(current_user.username),
            "true" if request.phone else "false",
        )
        return {
            "message": "iMato 账户关联成功",
            "imatu_user_id": current_user.imatu_user_id,
            "phone": current_user.phone
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.warning(
            "[auth.link_imatu] FAIL reason=exception user_id=%d detail=%s",
            getattr(current_user, "id", -1),
            str(e),
        )
        raise HTTPException(status_code=500, detail=f"关联失败: {str(e)}")


@router.post("/verify-imatu", response_model=dict)
def verify_imatu_token(
    request: VerifyImatuRequest,
    db: Session = Depends(get_db)
):
    """验证 iMato JWT Token 并创建/获取本地用户"""
    try:
        imatu_token = request.imatu_token
        verify_url = f"{settings.IMATU_API_BASE}/auth/verify"
        headers = {"Authorization": f"Bearer {imatu_token}"}

        response = requests.get(verify_url, headers=headers, timeout=5)
        response.raise_for_status()

        imatu_user_data = response.json()
        imatu_user_id = imatu_user_data.get("user_id")

        if not imatu_user_id:
            logger.warning("[auth.verify_imatu] FAIL reason=missing_user_id")
            raise HTTPException(status_code=400, detail="iMato token 无效")

        user = db.query(User).filter(User.imatu_user_id == imatu_user_id).first()

        if user:
            org_id = _get_user_org_id(user.id, db)
            access_token = _generate_local_token(user.username, org_id)

            logger.info(
                "[auth.verify_imatu] OK user_id=%d username=%s is_new_user=false",
                user.id,
                _mask_username(user.username),
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.id,
                "username": user.username,
                "is_new_user": False
            }
        else:
            # 新用户，需要先关联才能使用
            logger.info(
                "[auth.verify_imatu] OK need_link imatu_user_id=%s is_new_user=true",
                imatu_user_id,
            )
            return {
                "message": "新用户，请先关联账户",
                "imatu_user_id": imatu_user_id,
                "is_new_user": True
            }

    except requests.RequestException as e:
        logger.warning("[auth.verify_imatu] FAIL reason=imatu_http detail=%s", str(e))
        raise HTTPException(status_code=503, detail=f"iMato 服务不可用: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("[auth.verify_imatu] FAIL reason=exception detail=%s", str(e))
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
