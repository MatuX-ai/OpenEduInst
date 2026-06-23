import logging
import os
import secrets
import string

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# -------- 默认值黑名单 (生产必须覆盖) --------
_DEFAULT_SECRET = "your-secret-key-here"


def _generate_secret_key(length: int = 48) -> str:
    """为开发环境自动生成一个强度足够的随机密钥（仅当用户未设置时）。"""
    alphabet = string.ascii_letters + string.digits + "-_@#"
    return secrets.token_urlsafe(length) + "".join(
        secrets.choice(alphabet) for _ in range(length // 2)
    )


# 开发环境：如果使用默认值，则在本次进程中替换为一个随机值；生产环境仍然要求显式覆盖。
_IS_DEV_ENV = os.getenv("ENV", "dev").lower() in ("dev", "development", "local")
_INITIAL_SECRET = os.getenv("SECRET_KEY", _DEFAULT_SECRET)
if _INITIAL_SECRET == _DEFAULT_SECRET and _IS_DEV_ENV:
    _GENERATED = _generate_secret_key()
    logger.warning(
        "检测到默认 SECRET_KEY，已在本次进程中自动替换为随机值（仅用于开发环境）。"
        "生产环境必须显式设置 SECRET_KEY 环境变量。"
    )
    os.environ["SECRET_KEY"] = _GENERATED
    _INITIAL_SECRET = _GENERATED


class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./openmt_dev.db"  # 本地开发默认 SQLite，生产必须覆盖
    )

    # JWT 配置
    SECRET_KEY: str = _INITIAL_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Redis 配置
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # OpenMTSciEd API 配置
    OPENSCIEDU_API_BASE: str = os.getenv(
        "OPENSCIEDU_API_BASE", "https://opensciedu.matux.tech/api"
    )
    OPENSCIEDU_API_KEY: str = os.getenv("OPENSCIEDU_API_KEY", "")
    OPENSCIEDU_API_TIMEOUT: int = int(os.getenv("OPENSCIEDU_API_TIMEOUT", "30"))
    OPENSCIEDU_SYNC_ENABLED: bool = os.getenv("OPENSCIEDU_SYNC_ENABLED", "true").lower() == "true"
    OPENSCIEDU_SYNC_INTERVAL: int = int(os.getenv("OPENSCIEDU_SYNC_INTERVAL", "3600"))
    OPENSCIEDU_CACHE_TTL: int = int(os.getenv("OPENSCIEDU_CACHE_TTL", "3600"))

    # CDN 配置
    OPENSCIEDU_CDN_BASE: str = os.getenv(
        "OPENSCIEDU_CDN_BASE", "https://cdn.opensciedu.matux.tech"
    )
    # OpenMTSciEd 桌面端 / Web SPA（课题工作室深链）
    OPENSCIEDU_WEB_BASE: str = os.getenv("OPENSCIEDU_WEB_BASE", "")

    # iMato 配置
    IMATU_API_BASE: str = os.getenv("IMATU_API_BASE", "https://api.imatu.com")
    IMATU_API_KEY: str = os.getenv("IMATU_API_KEY", "")
    IMATU_SECRET_KEY: str = os.getenv("IMATU_SECRET_KEY", "your-imatu-secret-key")
    IMATU_JWT_ALGORITHM: str = "HS256"
    IMATU_SYNC_ENABLED: bool = os.getenv("IMATU_SYNC_ENABLED", "true").lower() == "true"

    # ---- LLM 配置（OpenAI 兼容协议） ----
    # provider: mock（默认离线兜底） / openai / deepseek / qwen
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek-chat")
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "30"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2048"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.6"))
    # LLM 降级开关：开启后 LLM 异常时自动回退到规则引擎
    LLM_FALLBACK_TO_RULES: bool = os.getenv("LLM_FALLBACK_TO_RULES", "true").lower() == "true"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def runtime_safety_check() -> None:
    """应用启动时进行安全自检，发现硬编码默认值给出警告/报错。"""
    is_prod = os.getenv("ENV", "dev").lower() in ("prod", "production")

    # 1) SECRET_KEY：生产必须显式覆盖；开发环境若仍为默认值则再次告警
    if settings.SECRET_KEY == _DEFAULT_SECRET:
        msg = (
            "检测到使用默认 SECRET_KEY！生产环境必须显式通过环境变量 SECRET_KEY 覆盖。"
        )
        if is_prod:
            raise RuntimeError(msg)
        logger.warning(msg)
    elif len(settings.SECRET_KEY) < 16 and is_prod:
        raise RuntimeError(
            f"SECRET_KEY 长度不足 ({len(settings.SECRET_KEY)} 字符)，生产环境请使用至少 32 字符的随机字符串。"
        )

    # 2) IMATU 密钥（若启用了 IMATU/相关业务，则必须提供真实值）
    imatu_secret = getattr(settings, "IMATU_SECRET_KEY", "")
    imatu_enabled_env = os.getenv("IMATU_SYNC_ENABLED", "")
    imatu_enabled = imatu_enabled_env.lower() in ("1", "true", "yes")
    if not imatu_secret or "your-" in imatu_secret:
        msg = "检测到 IMATU_SECRET_KEY 未设置/为默认值。启用 IMATU 同步前请先配置。"
        if is_prod and imatu_enabled:
            raise RuntimeError(msg)
        if imatu_enabled:
            logger.warning(msg)

    # 3) 数据库：生产必须用 Postgres，SQLite 只可开发
    if "user:password@localhost" in settings.DATABASE_URL or settings.DATABASE_URL.startswith(
        "sqlite://"
    ):
        msg = "生产环境请使用独立的 PostgreSQL 实例 (DATABASE_URL)。"
        if is_prod:
            raise RuntimeError(msg)
        logger.warning(msg)

    # 4) 日志化：启动信息
    logger.info(
        "safety check ok: is_prod=%s DATABASE_URL=%s IMATU_SYNC_ENABLED=%s",
        is_prod,
        "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        imatu_enabled,
    )


runtime_safety_check()