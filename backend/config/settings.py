﻿import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/openmt_edu_inst")
    
    # JWT 配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis 配置
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # OpenMTSciEd API 配置
    OPENSCIEDU_API_BASE: str = os.getenv("OPENSCIEDU_API_BASE", "https://opensciedu.matux.tech/api")
    OPENSCIEDU_API_KEY: str = os.getenv("OPENSCIEDU_API_KEY", "")
    OPENSCIEDU_API_TIMEOUT: int = int(os.getenv("OPENSCIEDU_API_TIMEOUT", "30"))
    OPENSCIEDU_SYNC_ENABLED: bool = os.getenv("OPENSCIEDU_SYNC_ENABLED", "true").lower() == "true"
    OPENSCIEDU_SYNC_INTERVAL: int = int(os.getenv("OPENSCIEDU_SYNC_INTERVAL", "3600"))  # 同步间隔（秒）
    OPENSCIEDU_CACHE_TTL: int = int(os.getenv("OPENSCIEDU_CACHE_TTL", "3600"))  # 缓存过期时间（秒）
    
    # CDN 配置
    OPENSCIEDU_CDN_BASE: str = os.getenv("OPENSCIEDU_CDN_BASE", "https://cdn.opensciedu.matux.tech")
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # 忽略 .env 文件中未定义的字段

settings = Settings()