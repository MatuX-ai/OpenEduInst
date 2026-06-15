# ============================================================
# OpenMT 机构管理系统 - 后端 Dockerfile
# 多阶段构建：builder -> runtime，最终镜像约 150MB
# ============================================================

# -------- 阶段 1: 构建依赖 --------
FROM python:3.12-slim AS builder

WORKDIR /app

# 系统依赖：为 psycopg2、bcrypt 等 C 扩展准备
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖声明，利用 Docker layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# -------- 阶段 2: 运行时镜像 --------
FROM python:3.12-slim AS runtime

WORKDIR /app

# 仅安装运行期需要的共享库（libpq 供 psycopg2 使用）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin -m appuser

# 把 builder 阶段里装的包复制过来
COPY --from=builder /install /usr/local

# 复制应用代码
COPY . .

# 持久化目录：日志、上传、SQLite 文件
RUN mkdir -p /app/logs /app/data \
    && chown -R appuser:appuser /app

USER appuser

# 健康检查：调用 FastAPI /health 接口
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

EXPOSE 8000

# 默认使用 gunicorn + uvicorn worker（多进程）
# 通过环境变量可调整 WORKERS / LOG_LEVEL
ENV WORKERS=4
ENV LOG_LEVEL=info
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "gunicorn main:app --workers $WORKERS --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level $LOG_LEVEL --access-logfile - --error-logfile -"]
