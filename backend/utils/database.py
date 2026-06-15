import os
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config.settings import settings

DATABASE_URL = settings.DATABASE_URL

_IS_SQLITE = DATABASE_URL.startswith("sqlite")
_IS_POSTGRES = DATABASE_URL.startswith("postgresql")


def _clean_neon_url(url: str) -> str:
    """处理 Neon/PostgreSQL 特有的 query 参数。对 sqlite 不修改。"""
    if _IS_SQLITE:
        return url
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    safe_params = {}
    if "sslmode" in query_params:
        safe_params["sslmode"] = query_params["sslmode"][0]
    if safe_params:
        new_query = urlencode(safe_params, doseq=True)
        return urlunparse(parsed._replace(query=new_query))
    if not parsed.query:
        # 默认需要 sslmode=require（线上 Neon；但开发环境可显式关闭）
        if os.getenv("PG_SSL_DISABLE", "0").lower() in ("1", "true", "yes"):
            return url
        return urlunparse(parsed._replace(query="sslmode=require"))
    return url


clean_url = _clean_neon_url(DATABASE_URL)


def _build_connect_args():
    if _IS_SQLITE:
        # sqlite 不支持 keepalives_* 参数
        return {"check_same_thread": False}
    return {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }


_connect_args = _build_connect_args()

# sqlite 不需要连接池；PostgreSQL 使用连接池
if _IS_SQLITE:
    engine = create_engine(clean_url, connect_args=_connect_args)
else:
    engine = create_engine(
        clean_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        connect_args=_connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
