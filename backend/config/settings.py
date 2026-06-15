import os
import logging
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# -------- 默认值黑名单 (生产必须覆盖) --------
_DEFAULT_SECRET = "your-secret-key-here"


class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./openmt_dev.db"  # 本地开发默认 SQLite，生产必须覆盖
    )

    # JWT 配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET)
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

    # iMato 配置
    IMATU_API_BASE: str = os.getenv("IMATU_API_BASE", "https://api.imatu.com")
    IMATU_API_KEY: str = os.getenv("IMATU_API_KEY", "")
    IMATU_SECRET_KEY: str = os.getenv("IMATU_SECRET_KEY", "your-imatu-secret-key")
    IMATU_JWT_ALGORITHM: str = "HS256"
    IMATU_SYNC_ENABLED: bool = os.getenv("IMATU_SYNC_ENABLED", "true").lower() == "true"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def runtime_safety_check() -> None:
    """应用启动时进行安全自检，发现硬编码默认值给出警告。"""
    is_prod = os.getenv("ENV", "dev").lower() in ("prod", "production")

    if settings.SECRET_KEY == _DEFAULT_SECRET:
        msg = "检测到使用默认 SECRET_KEY！生产环境必须覆盖。"
        if is_prod:
            raise RuntimeError(msg)
        logger.warning(msg)

    if "your-" in settings.IMATU_SECRET_KEY or settings.IMATU_SECRET_KEY == "":
        msg = "检测到 IMATU_SECRET_KEY 未设置。"
        if is_prod:
            raise RuntimeError(msg)
        logger.warning(msg)

    if "user:password@localhost" in settings.DATABASE_URL or settings.DATABASE_URL.startswith(
        "sqlite://"
    ):
        msg = "生产环境请使用独立的 PostgreSQL 实例 (DATABASE_URL)。"
        if is_prod:
            raise RuntimeError(msg)
        logger.warning(msg)


runtime_safety_check()