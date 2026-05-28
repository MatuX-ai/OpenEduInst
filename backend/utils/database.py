import os
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 数据库配置 - 从 settings 加载
from config.settings import settings

DATABASE_URL = settings.DATABASE_URL

# 清理 Neon 连接参数，移除 psycopg2 不支持的参数
def _clean_neon_url(url: str) -> str:
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    # 只保留 sslmode，移除 channel_binding 等不兼容参数
    safe_params = {}
    if 'sslmode' in query_params:
        safe_params['sslmode'] = query_params['sslmode'][0]
    if safe_params:
        new_query = urlencode(safe_params, doseq=True)
        return urlunparse(parsed._replace(query=new_query))
    # 如果没有查询参数则添加 sslmode=require
    if not parsed.query:
        return urlunparse(parsed._replace(query='sslmode=require'))
    return url

clean_url = _clean_neon_url(DATABASE_URL)

engine = create_engine(
    clean_url,
    pool_pre_ping=True,        # 使用前验证连接有效性
    pool_recycle=300,          # 5分钟回收连接
    pool_size=5,               # 连接池大小
    max_overflow=10,           # 最大溢出连接数
    connect_args={
        'connect_timeout': 10,  # 连接超时10秒
        'keepalives': 1,        # 启用TCP保活
        'keepalives_idle': 30,  # 30秒空闲后发送保活
        'keepalives_interval': 10,
        'keepalives_count': 5,
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
