"""
敏感字段 AES-256 加密/解密工具

用途：
- 对数据库中存储的个人敏感信息（contact_email, phone, 身份证号等）进行加密
- 使用 Fernet (AES-256-CBC + HMAC) 对称加密
- 加密密钥从环境变量读取，生产必须覆盖默认值

用法示例：
    from utils.encryption import encrypt_field, decrypt_field

    # 写入时加密
    org.contact_email = encrypt_field(user_input_email)

    # 读取时解密
    display_email = decrypt_field(org.contact_email)

注意：
- 加密后的字段无法直接用于 SQL 的 LIKE/WHERE 查询
- 如需按邮箱查询，建议维护一个明文索引字段或使用 hash 做精确匹配
- 已加密字段可通过 is_encrypted() 检测
"""

from __future__ import annotations

import base64
import logging
import os
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

# 默认密钥（生产必须覆盖）
_DEFAULT_KEY = "replace-me-with-a-32-byte-secret-key-in-production!"

# 加密前缀标记，用于区分加密文本和明文
_ENCRYPTED_PREFIX = "enc:"


def _derive_key(secret: str) -> bytes:
    """从密钥字符串派生出 32 字节 Fernet 密钥（base64 编码）"""
    # 使用固定 salt（非密码学最优，但能满足字段加密场景）
    salt = b"OpenMTFieldEncryptSalt"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode("utf-8")))
    return key


def _get_fernet() -> Fernet:
    """获取 Fernet 加密实例（密钥从环境变量读取）"""
    secret = os.getenv("FIELD_ENCRYPTION_KEY", _DEFAULT_KEY)
    if secret == _DEFAULT_KEY:
        logger.warning(
            "FIELD_ENCRYPTION_KEY 使用默认值！生产环境必须通过环境变量设置。"
        )
    key = _derive_key(secret)
    return Fernet(key)


def encrypt_field(plain_text: Optional[str]) -> Optional[str]:
    """
    加密敏感字段

    Args:
        plain_text: 明文字符串

    Returns:
        加密后的字符串（带 enc: 前缀标记），输入为 None 时返回 None
    """
    if plain_text is None:
        return None
    if is_encrypted(plain_text):
        # 已加密的不重复加密
        return plain_text
    try:
        f = _get_fernet()
        token = f.encrypt(plain_text.encode("utf-8"))
        return _ENCRYPTED_PREFIX + token.decode("utf-8")
    except Exception as exc:
        logger.error("字段加密失败: %s", exc)
        # 加密失败时返回原文（不阻塞业务流程）
        return plain_text


def decrypt_field(encrypted_text: Optional[str]) -> Optional[str]:
    """
    解密敏感字段

    Args:
        encrypted_text: 加密后的字符串（带 enc: 前缀）

    Returns:
        明文字符串，输入为 None 或非加密格式时原样返回
    """
    if encrypted_text is None:
        return None
    if not is_encrypted(encrypted_text):
        return encrypted_text
    try:
        f = _get_fernet()
        # 去掉前缀后解码
        token = encrypted_text[len(_ENCRYPTED_PREFIX):]
        plain_bytes = f.decrypt(token.encode("utf-8"))
        return plain_bytes.decode("utf-8")
    except Exception as exc:
        logger.error("字段解密失败: %s", exc)
        # 解密失败返回原文（降级行为）
        return encrypted_text


def is_encrypted(text: Optional[str]) -> bool:
    """检测字符串是否为加密格式"""
    if text is None:
        return False
    return text.startswith(_ENCRYPTED_PREFIX)
