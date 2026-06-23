"""
邮件发送服务

支持：
- SMTP 通用模式（Gmail / 阿里云 / 自建 Mailhog 等）
- SendGrid HTTP API
- 本地开发降级（写到 logs/emails.log 便于调试）

环境变量：
- EMAIL_PROVIDER           smtp | sendgrid | log（默认 log）
- SMTP_HOST, SMTP_PORT     SMTP 服务器
- SMTP_USERNAME, SMTP_PASSWORD
- SMTP_USE_TLS             1/0
- EMAIL_FROM               发件人地址
- SENDGRID_API_KEY         SendGrid API Key
"""

from __future__ import annotations

import asyncio
import logging
import os
import smtplib
import uuid
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: List[str]
    subject: str
    body_html: str
    body_text: Optional[str] = None
    from_addr: Optional[str] = None
    from_name: Optional[str] = "OpenMT 教育机构管理系统"


class EmailService:
    """邮件发送服务（支持多 provider 降级）"""

    def __init__(self) -> None:
        self.provider = os.getenv("EMAIL_PROVIDER", "log").lower()
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "1").lower() in ("1", "true", "yes")
        self.from_addr = os.getenv("EMAIL_FROM", "noreply@openmt.example.com")
        self.sendgrid_key = os.getenv("SENDGRID_API_KEY", "")

        self._log_dir = os.getenv("EMAIL_LOG_DIR", "logs")
        os.makedirs(self._log_dir, exist_ok=True)

    async def send(self, msg: EmailMessage) -> bool:
        """发送邮件（异步）"""
        if not msg.from_addr:
            msg.from_addr = self.from_addr

        if self.provider == "smtp":
            return await self._send_smtp(msg)
        elif self.provider == "sendgrid":
            return await self._send_sendgrid(msg)
        else:
            return self._write_to_log(msg)

    async def send_welcome(self, to: str, org_name: str, admin_username: str, login_url: str) -> bool:
        """发送欢迎邮件（机构注册成功场景）"""
        subject = f"欢迎使用 OpenMT - {org_name}"
        body_html = f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1976d2;">欢迎加入 OpenMT！</h2>
            <p>您的机构 <strong>{org_name}</strong> 已成功注册 OpenMT 教育机构管理系统。</p>
            <p>管理员账号：<code>{admin_username}</code></p>
            <p>您可点击下方按钮进入管理后台：</p>
            <p style="margin: 24px 0;">
                <a href="{login_url}" style="background: #1976d2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    进入管理后台
                </a>
            </p>
            <p style="color: #64748b; font-size: 13px;">
                本邮件由系统自动发送，请勿直接回复。如有问题请联系客服。
            </p>
        </div>
        """
        return await self.send(EmailMessage(
            to=[to],
            subject=subject,
            body_html=body_html,
            body_text=f"欢迎 {org_name} 加入 OpenMT！登录地址：{login_url}",
        ))

    async def send_license_expiring(
        self, to: str, org_name: str, days_remaining: int, renew_url: str
    ) -> bool:
        """发送许可证即将到期提醒"""
        subject = f"[OpenMT] 您的许可证将在 {days_remaining} 天后到期"
        body_html = f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #ff6600;">许可证到期提醒</h2>
            <p>尊敬的 <strong>{org_name}</strong>：</p>
            <p>您的 OpenMT 云托管版许可证将在 <strong style="color: #ff6600;">{days_remaining} 天</strong>后到期。</p>
            <p>为不影响正常使用，请尽快续费：</p>
            <p style="margin: 24px 0;">
                <a href="{renew_url}" style="background: #ff6600; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    立即续费
                </a>
            </p>
        </div>
        """
        return await self.send(EmailMessage(
            to=[to],
            subject=subject,
            body_html=body_html,
        ))

    # --------------------------------------------------------
    # Provider 实现
    # --------------------------------------------------------

    async def _send_smtp(self, msg: EmailMessage) -> bool:
        if not self.smtp_host:
            logger.error("SMTP_HOST 未配置，无法发送邮件")
            return self._write_to_log(msg)

        def _do_send() -> bool:
            try:
                mime_msg = MIMEMultipart("alternative")
                mime_msg["Subject"] = msg.subject
                mime_msg["From"] = formataddr((msg.from_name or "OpenMT", msg.from_addr))
                mime_msg["To"] = ", ".join(msg.to)

                if msg.body_text:
                    mime_msg.attach(MIMEText(msg.body_text, "plain", "utf-8"))
                mime_msg.attach(MIMEText(msg.body_html, "html", "utf-8"))

                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                    if self.smtp_use_tls:
                        server.starttls()
                    if self.smtp_username:
                        server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(msg.from_addr, msg.to, mime_msg.as_string())
                logger.info("邮件已发送: to=%s subject=%s", msg.to, msg.subject)
                return True
            except Exception as exc:  # noqa: BLE001
                logger.error("SMTP 发送失败: %s", exc)
                return False

        return await asyncio.to_thread(_do_send)

    async def _send_sendgrid(self, msg: EmailMessage) -> bool:
        if not self.sendgrid_key:
            logger.error("SENDGRID_API_KEY 未配置，降级为日志模式")
            return self._write_to_log(msg)

        import httpx

        payload = {
            "personalizations": [{"to": [{"email": a} for a in msg.to]}],
            "from": {"email": msg.from_addr, "name": msg.from_name or "OpenMT"},
            "subject": msg.subject,
            "content": [
                {"type": "text/plain", "value": msg.body_text or ""},
                {"type": "text/html", "value": msg.body_html},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.sendgrid_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=payload,
                    headers=headers,
                )
            if resp.status_code in (200, 202):
                logger.info("SendGrid 邮件已发送: to=%s", msg.to)
                return True
            logger.error("SendGrid 发送失败: status=%s body=%s", resp.status_code, resp.text)
            return False
        except Exception as exc:  # noqa: BLE001
            logger.error("SendGrid 异常: %s", exc)
            return False

    def _write_to_log(self, msg: EmailMessage) -> bool:
        """降级模式：写入 logs/emails.log"""
        import json
        from pathlib import Path

        log_path = Path(self._log_dir) / "emails.log"
        record = {
            "id": uuid.uuid4().hex[:12],
            "from": msg.from_addr,
            "to": msg.to,
            "subject": msg.subject,
            "body_text": msg.body_text,
            "body_html_preview": (msg.body_html or "")[:200],
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
        }
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
            logger.info("[降级] 邮件已写入 %s: to=%s subject=%s", log_path, msg.to, msg.subject)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error("邮件日志写入失败: %s", exc)
            return False


# 全局单例
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
