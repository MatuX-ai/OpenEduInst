"""
AES-256 字段加密 SQLAlchemy Type

用于对手机号、身份证号等敏感字段进行透明加密存储：
- 写入：自动使用 AES-256-GCM 加密
- 读取：自动解密为明文
- 密钥来源：环境变量 ``ENCRYPTION_KEY``（Base64 编码的 32 字节密钥）
- 派生：若未配置主密钥，则使用 SECRET_KEY + 固定 salt 通过 PBKDF2 派生

密文格式（Base64 字符串）：
    version(1B) | nonce(12B) | ciphertext | tag(16B)

安全建议：
- 生产环境必须显式设置 ENCRYPTION_KEY（推荐 32 字节随机）
- 不要将 ENCRYPTION_KEY 提交到 Git
- 密钥轮换：在保留旧密钥的情况下，新数据使用新密钥加密
"""

from __future__ import annotations

import base64
import logging
import os
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import String, TypeDecorator

logger = logging.getLogger(__name__)

_VERSION = b"\x01"  # 加密版本，便于未来升级
_NONCE_LEN = 12
_KEY_LEN = 32  # AES-256
_SALT = b"openmt-encryption-salt-v1"
_ITERATIONS = 200_000

# 全局派生密钥（首次使用时计算）
_derived_key: Optional[bytes] = None


def _get_key() -> bytes:
    """获取加密密钥。优先从环境变量读取，否则基于 SECRET_KEY 派生"""
    global _derived_key
    raw = os.getenv("ENCRYPTION_KEY")
    if raw:
        try:
            key = base64.b64decode(raw)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"ENCRYPTION_KEY 不是合法的 Base64: {exc}") from exc
        if len(key) != _KEY_LEN:
            raise RuntimeError(
                f"ENCRYPTION_KEY 长度必须为 {_KEY_LEN} 字节（AES-256），当前 {len(key)}"
            )
        return key

    # 兜底：使用 PBKDF2 从 SECRET_KEY 派生
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

    if _derived_key is None:
        from config.settings import settings

        secret = (settings.SECRET_KEY or "openmt-default-secret").encode("utf-8")
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=_KEY_LEN,
            salt=_SALT,
            iterations=_ITERATIONS,
        )
        _derived_key = kdf.derive(secret)
        logger.warning(
            "未设置 ENCRYPTION_KEY，已从 SECRET_KEY 派生 AES 密钥。"
            "生产环境强烈建议显式配置 ENCRYPTION_KEY。"
        )
    return _derived_key


def encrypt_str(plaintext: str) -> str:
    """加密字符串，返回 Base64 密文"""
    if plaintext is None or plaintext == "":
        return plaintext
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(_NONCE_LEN)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), associated_data=None)
    blob = _VERSION + nonce + ct
    return base64.b64encode(blob).decode("ascii")


def decrypt_str(token: str) -> str:
    """解密 Base64 密文，返回明文；解密失败返回原值（兼容历史明文数据）"""
    if not token:
        return token
    try:
        blob = base64.b64decode(token.encode("ascii"))
    except Exception:
        return token  # 不是 Base64，视为历史明文
    if len(blob) < 1 + _NONCE_LEN + 16 or blob[0:1] != _VERSION:
        return token  # 不是本版本密文，视为明文
    try:
        key = _get_key()
        aesgcm = AESGCM(key)
        nonce = blob[1 : 1 + _NONCE_LEN]
        ct = blob[1 + _NONCE_LEN :]
        pt = aesgcm.decrypt(nonce, ct, associated_data=None)
        return pt.decode("utf-8")
    except Exception as exc:  # noqa: BLE001
        logger.error("解密失败: %s", exc)
        return ""  # 解密失败返回空串，避免明文泄露


class EncryptedString(TypeDecorator):
    """SQLAlchemy 类型：透明加密/解密的 VARCHAR 字段"""

    impl = String
    cache_ok = True

    def __init__(self, length: int = 512, **kwargs):
        # 密文 Base64 比明文长，预留 4 倍空间
        super().__init__(length=length, **kwargs)

    def process_bind_param(self, value, dialect):  # type: ignore[override]
        if value is None or value == "":
            return value
        return encrypt_str(str(value))

    def process_result_value(self, value, dialect):  # type: ignore[override]
        if value is None or value == "":
            return value
        return decrypt_str(value)
