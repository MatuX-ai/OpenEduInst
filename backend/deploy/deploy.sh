#!/usr/bin/env bash
# ============================================================
# OpenMT 机构管理系统 - 一键部署脚本
# 目标：Docker + docker-compose + Nginx + HTTPS
# 适用：Ubuntu 22.04 / Debian 12 （root 或 sudo 权限）
#
# 用法：
#   sudo bash deploy.sh          # 完整部署
#   sudo bash deploy.sh --dry-run # 只做环境检查，不真实部署
#   sudo bash deploy.sh --stop   # 停止服务
#
# 部署后：
#   - 后端 API: https://your-domain.com/api/
#   - 前端 SPA: https://your-domain.com/
#   - API 文档: https://your-domain.com/docs (可选暴露)
#   - 健康检查: https://your-domain.com/health
# ============================================================

set -euo pipefail

GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"
INFO="[INFO]"
OK="[OK]"
WARN="[WARN]"
ERR="[ERR]"

log_info()  { echo -e "${GREEN}${INFO}${RESET} $1"; }
log_ok()    { echo -e "${GREEN}${OK}${RESET}   $1"; }
log_warn()  { echo -e "${YELLOW}${WARN}${RESET} $1"; }
log_err()   { echo -e "${RED}${ERR}${RESET}  $1" >&2; }

DRY_RUN=0
STOP_MODE=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --stop)    STOP_MODE=1 ;;
        -h|--help)
            grep "^#" "$0"; exit 0 ;;
        *) log_err "未知参数：$arg"; exit 1 ;;
    esac
done

# ---------- 0. 基础检查 ----------
log_info "=== 步骤 0/6: 环境检查 ==="
if [ "$(id -u)" -ne 0 ]; then
    log_err "请使用 root 或 sudo 执行本脚本"
    exit 1
fi

required_cmds=("curl" "openssl")
for c in "${required_cmds[@]}"; do
    if ! command -v "$c" >/dev/null 2>&1; then
        log_err "未安装命令：$c （将尝试自动安装）"
        NEED_APT_INSTALL=1
    fi
done

DISTRO=""
if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    DISTRO="$ID"
fi
log_info "系统: $DISTRO $(uname -r), 用户: $(whoami)"

# ---------- 1. 安装 Docker + Compose v2 ----------
if [ "$DRY_RUN" -eq 0 ] && [ "$STOP_MODE" -eq 0 ]; then
    log_info "=== 步骤 1/6: 安装 Docker 引擎 ==="
    if ! command -v docker >/dev/null 2>&1; then
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        sh /tmp/get-docker.sh
        systemctl enable --now docker
    else
        log_ok "Docker 已安装: $(docker --version)"
    fi
    if ! docker compose version >/dev/null 2>&1; then
        log_err "docker compose 插件不可用"
        exit 1
    else
        log_ok "docker compose: $(docker compose version)"
    fi
fi

# ---------- 2. 停止服务模式（单独分支） ----------
if [ "$STOP_MODE" -eq 1 ]; then
    cd "$(dirname "$0")/.."
    docker compose down
    log_ok "服务已停止"
    exit 0
fi

# ---------- 3. 环境变量 + SSL 证书 ----------
cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
log_info "工作目录: $PROJECT_DIR"

if [ "$DRY_RUN" -eq 0 ]; then
    log_info "=== 步骤 2/6: 准备环境变量 ==="
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            cp .env.production .env
            log_info "已复制 .env.production -> .env ，请按需编辑"
        else
            log_err "未找到 .env.production 模板"
            exit 1
        fi
    fi

    # 生成/检查 JWT SECRET_KEY
    grep -q "CHANGE_ME" .env && {
        log_warn ".env 中仍包含 CHANGE_ME 占位符，请手动修改关键值！"
        # 自动替换默认的 JWT SECRET_KEY
        RANDOM_KEY=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))" 2>/dev/null || openssl rand -base64 48)
        sed -i "s|SECRET_KEY=CHANGE_ME.*|SECRET_KEY=${RANDOM_KEY}|" .env
        log_ok "已自动生成 SECRET_KEY"
    }

    log_info "=== 步骤 3/6: 准备 SSL 证书 ==="
    SSL_DIR="${PROJECT_DIR}/deploy/nginx/ssl"
    mkdir -p "${SSL_DIR}"
    if [ ! -f "${SSL_DIR}/cert.pem" ] || [ ! -f "${SSL_DIR}/privkey.pem" ]; then
        log_warn "未检测到 SSL 证书，将生成自签证书（仅用于测试）"
        openssl req -x509 -nodes -newkey rsa:2048 \
            -days 365 \
            -keyout "${SSL_DIR}/privkey.pem" \
            -out "${SSL_DIR}/cert.pem" \
            -subj "/CN=openmt.local/O=OpenMT/C=CN" 2>/dev/null
        log_ok "自签证书已生成（生产环境请替换为 Let's Encrypt 正式证书）"
    else
        log_ok "SSL 证书已就绪"
    fi

    # 证书文件权限
    chmod 600 "${SSL_DIR}/privkey.pem" 2>/dev/null || true
fi

# ---------- 4. 目录与权限 ----------
if [ "$DRY_RUN" -eq 0 ]; then
    log_info "=== 步骤 4/6: 准备持久化目录 ==="
    mkdir -p logs/nginx logs data deploy/frontend
    log_ok "目录已就绪"
fi

# ---------- 5. 构建 & 启动 ----------
if [ "$DRY_RUN" -eq 0 ]; then
    log_info "=== 步骤 5/6: 构建并启动服务 ==="
    docker compose build --no-cache
    docker compose up -d
    sleep 5
fi

# ---------- 6. 健康检查 ----------
log_info "=== 步骤 6/6: 健康检查 ==="
SERVICES=("api" "nginx" "redis")
for svc in "${SERVICES[@]}"; do
    if docker compose ps --format '{{.Service}} {{.Status}}' 2>/dev/null | grep -q "^${svc} .*Up"; then
        log_ok "服务 ${svc}: 运行中"
    else
        log_warn "服务 ${svc}: 未运行 (可用 docker compose logs ${svc} 查看)"
    fi
done

# 调用健康检查端点
if [ "$DRY_RUN" -eq 0 ]; then
    sleep 3
    if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
        log_ok "后端健康检查: 通过"
    else
        log_warn "后端健康检查: 失败，请查看 docker compose logs api"
    fi
fi

echo
echo "=========================================="
echo "部署完成！"
echo "  - API:     http://127.0.0.1:8000/"
echo "  - 健康:    http://127.0.0.1:8000/health"
echo "  - 文档:    http://127.0.0.1:8000/docs"
echo "  - 前端:    http://127.0.0.1 (Nginx 代理)"
echo "  - HTTPS:   https://<你的域名> (Nginx 443)"
echo "常用命令:"
echo "  docker compose logs -f --tail=200"
echo "  docker compose ps"
echo "  docker compose restart api"
echo "=========================================="
