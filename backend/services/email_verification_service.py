"""
邮箱验证服务
提供验证码发送、校验、过期管理
"""

import hashlib
import logging
import random
import secrets
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, Boolean
from sqlalchemy.orm import Session

from utils.database import Base

logger = logging.getLogger(__name__)


# ---------- 数据模型 ----------

class EmailVerification(Base):
    """邮箱验证码记录"""
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    token_hash = Column(String(128), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=0)  # 验证尝试次数


# ---------- 配置 ----------

CODE_LENGTH = 6
CODE_EXPIRE_MINUTES = 15          # 验证码 15 分钟过期
MAX_ATTEMPTS = 5                   # 最多尝试 5 次
RESEND_COOLDOWN_SECONDS = 60       # 重发冷却 60 秒


# ---------- 服务类 ----------

class EmailVerificationService:

    def __init__(self, db: Session):
        self.db = db

    def send_verification_code(self, email: str) -> dict:
        """
        生成并发送邮箱验证码
        返回：{message, expires_in}
        生产环境应接入 SMTP/邮件服务商
        """
        # 冷却检查
        recent = (
            self.db.query(EmailVerification)
            .filter(
                EmailVerification.email == email,
                EmailVerification.created_at > datetime.utcnow() - timedelta(seconds=RESEND_COOLDOWN_SECONDS),
            )
            .first()
        )
        if recent:
            remaining = RESEND_COOLDOWN_SECONDS - int(
                (datetime.utcnow() - recent.created_at).total_seconds()
            )
            raise ValueError(f"发送过于频繁，请 {max(remaining, 1)} 秒后重试")

        # 生成 6 位数字验证码
        code = "".join(str(random.randint(0, 9)) for _ in range(CODE_LENGTH))
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        record = EmailVerification(
            email=email,
            code=code,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES),
        )
        self.db.add(record)
        self.db.commit()

        # === 生产环境应在此处发送邮件 ===
        # self._send_email(email, code)
        logger.info("验证码已生成: email=%s code=%s (开发模式：直接记录日志)", email, code)

        return {
            "message": "验证码已发送到您的邮箱",
            "expires_in": CODE_EXPIRE_MINUTES * 60,
            # 开发模式下直接返回验证码，生产环境必须移除此行
            "_dev_code": code,
        }

    def verify_code(self, email: str, code: str) -> dict:
        """
        校验邮箱验证码
        返回：{verified, message}
        """
        record = (
            self.db.query(EmailVerification)
            .filter(
                EmailVerification.email == email,
                EmailVerification.is_verified.is_(False),
            )
            .order_by(EmailVerification.created_at.desc())
            .first()
        )

        if not record:
            raise ValueError("未找到有效的验证码记录，请先发送验证码")

        record.attempts += 1

        # 过期检查
        if datetime.utcnow() > record.expires_at:
            raise ValueError("验证码已过期，请重新发送")

        # 次数检查
        if record.attempts > MAX_ATTEMPTS:
            raise ValueError(f"验证次数过多（最多 {MAX_ATTEMPTS} 次），请重新发送")

        # 验证码匹配
        if record.code != code.strip():
            remaining = MAX_ATTEMPTS - record.attempts
            raise ValueError(f"验证码错误，还剩 {max(remaining, 0)} 次机会")

        # 验证通过
        record.is_verified = True
        record.verified_at = datetime.utcnow()
        self.db.commit()

        return {
            "verified": True,
            "message": "邮箱验证成功",
        }

    def is_email_verified(self, email: str) -> bool:
        """检查邮箱是否已完成验证（24 小时内）"""
        record = (
            self.db.query(EmailVerification)
            .filter(
                EmailVerification.email == email,
                EmailVerification.is_verified.is_(True),
                EmailVerification.verified_at > datetime.utcnow() - timedelta(hours=24),
            )
            .first()
        )
        return record is not None

    def cleanup_expired(self) -> int:
        """清理过期的验证记录"""
        expired = (
            self.db.query(EmailVerification)
            .filter(EmailVerification.expires_at < datetime.utcnow())
            .all()
        )
        count = len(expired)
        for r in expired:
            self.db.delete(r)
        self.db.commit()
        logger.info("清理过期验证码记录: %d 条", count)
        return count
