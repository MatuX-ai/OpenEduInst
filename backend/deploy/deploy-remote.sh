#!/usr/bin/env bash
# ============================================================
# OpenMT SSH 远程部署脚本 (Linux/Mac)
#
# 用法：
#   # 首次部署（初始化服务器）
#   bash deploy-remote.sh root@1.2.3.4 --init
#
#   # 日常更新部署（标准型）
#   bash deploy-remote.sh root@1.2.3.4 -f docker-compose.yml
#
#   # 仅重启（不重新构建）
#   bash deploy-remote.sh root@1.2.3.4 --no-build --skip-upload
#
#   # 部署前备份 + 使用入门型 compose
#   bash deploy-remote.sh root@1.2.3.4 --backup
# ============================================================
set -euo pipefail

# ── 默认值 ──
SERVER=""
PORT=22
REMOTE_DIR="/opt/openmt"
COMPOSE_FILE="docker-compose.lite.yml"
INIT_SERVER=0
NO_BUILD=0
BACKUP_BEFORE=0
SKIP_UPLOAD=0
BACKEND_SUBDIR="backend"

GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; CYAN="\033[36m"; RESET="\033[0m"

# ── 解析参数 ──
while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--port)      PORT="$2"; shift 2 ;;
        -d|--dir)      REMOTE_DIR="$2"; shift 2 ;;
        -f|--file)     COMPOSE_FILE="$2"; shift 2 ;;
        --init)         INIT_SERVER=1; shift ;;
        --no-build)     NO_BUILD=1; shift ;;
        --backup)       BACKUP_BEFORE=1; shift ;;
        --skip-upload)  SKIP_UPLOAD=1; shift ;;
        -h|--help)
            grep "^#" "$0" | head -20; exit 0 ;;
        *)
            if [[ -z "$SERVER" ]]; then
                SERVER="$1"
            else
                echo -e "${RED}未知参数: $1${RESET}"; exit 1
            fi
            shift ;;
    esac
done

if [[ -z "$SERVER" ]]; then
    echo -e "${RED}请指定服务器地址: bash deploy-remote.sh root@1.2.3.4${RESET}"
    exit 1
fi

SSH_OPTS="-p $PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new"

# ── 0. 连通性检查 ──
echo -e "\n${GREEN}▶ 检查 SSH 连接:${RESET} $SERVER (端口 $PORT)"
HOSTNAME=$(ssh $SSH_OPTS "$SERVER" "hostname" 2>/dev/null) || {
    echo -e "${RED}✗ SSH 连接失败！请检查：${RESET}"
    echo "  1. 服务器地址和端口是否正确"
    echo "  2. 是否已配置 SSH 密钥: ssh-copy-id $SERVER"
    exit 1
}
echo -e "  ${GREEN}✓${RESET} 已连接: $HOSTNAME"

# ── 1. 首次初始化 ──
if [[ $INIT_SERVER -eq 1 ]]; then
    echo -e "\n${GREEN}▶ 首次部署：服务器初始化${RESET}"
    echo -e "${YELLOW}⚠${RESET} 此操作将安装 Docker、配置防火墙、创建 Swap"

    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    scp -P "$PORT" -o StrictHostKeyChecking=accept-new \
        "$SCRIPT_DIR/init-lite-server.sh" "$SERVER:/tmp/init-lite-server.sh"
    ssh $SSH_OPTS "$SERVER" "sudo bash /tmp/init-lite-server.sh"
    echo -e "  ${GREEN}✓${RESET} 初始化完成"

    ssh $SSH_OPTS "$SERVER" "sudo mkdir -p $REMOTE_DIR && sudo chown \$(whoami):\$(whoami) $REMOTE_DIR"
    echo -e "  ${GREEN}✓${RESET} 项目目录已创建: $REMOTE_DIR"
fi

# ── 2. 上传代码 ──
if [[ $SKIP_UPLOAD -eq 0 ]]; then
    echo -e "\n${GREEN}▶ 上传项目代码${RESET}"

    # 回到项目根目录
    PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

    if command -v rsync &>/dev/null; then
        echo -e "  ${CYAN}→${RESET} 使用 rsync 增量同步"
        rsync -avz --delete \
            --exclude='.git' \
            --exclude='__pycache__' \
            --exclude='*.pyc' \
            --exclude='node_modules' \
            --exclude='.venv' \
            --exclude='venv' \
            --exclude='logs' \
            --exclude='data' \
            --exclude='redis_data' \
            --exclude='pg_data' \
            --exclude='.mypy_cache' \
            --exclude='*.egg-info' \
            --exclude='.env' \
            --exclude='deploy/frontend' \
            --exclude='deploy/nginx/ssl' \
            -e "ssh -p $PORT -o StrictHostKeyChecking=accept-new" \
            "$PROJECT_ROOT/" "$SERVER:$REMOTE_DIR/"
    else
        echo -e "  ${YELLOW}⚠${RESET} rsync 不可用，使用 tar+scp"
        TEMP_ARCHIVE="/tmp/openmt-deploy-$$.tar.gz"
        EXCLUDE_FILE="/tmp/openmt-exclude-$$.txt"
        cat > "$EXCLUDE_FILE" <<'EOF'
.git
__pycache__
*.pyc
node_modules
.venv
venv
logs
data
redis_data
pg_data
.mypy_cache
*.egg-info
.env
.env.production
deploy/frontend
deploy/nginx/ssl
.gitignore
.dockerignore
EOF
        cd "$PROJECT_ROOT"
        tar --exclude-from="$EXCLUDE_FILE" -czf "$TEMP_ARCHIVE" .
        echo -e "  ${CYAN}→${RESET} 上传压缩包..."
        scp -P "$PORT" -o StrictHostKeyChecking=accept-new \
            "$TEMP_ARCHIVE" "$SERVER:/tmp/openmt-deploy.tar.gz"
        ssh $SSH_OPTS "$SERVER" \
            "sudo tar -xzf /tmp/openmt-deploy.tar.gz -C $REMOTE_DIR && rm /tmp/openmt-deploy.tar.gz"
        rm -f "$TEMP_ARCHIVE" "$EXCLUDE_FILE"
    fi
    echo -e "  ${GREEN}✓${RESET} 代码上传完成"
fi

# ── 3. 环境变量检查 ──
echo -e "\n${GREEN}▶ 检查环境配置${RESET}"
if ! ssh $SSH_OPTS "$SERVER" "test -f $REMOTE_DIR/$BACKEND_SUBDIR/.env" 2>/dev/null; then
    echo -e "  ${YELLOW}⚠${RESET} .env 不存在，从模板创建"
    ssh $SSH_OPTS "$SERVER" \
        "cp $REMOTE_DIR/$BACKEND_SUBDIR/.env.lite.example $REMOTE_DIR/$BACKEND_SUBDIR/.env"
    echo -e "  ${RED}⚠ 请立即编辑服务器 .env 文件！${RESET}"
    echo "    ssh $SERVER 'vim $REMOTE_DIR/$BACKEND_SUBDIR/.env'"
    echo "    必填: DATABASE_URL, SECRET_KEY"
    read -rp "  配置完成后按 Enter 继续 (或输入 q 退出): " confirm
    [[ "$confirm" == "q" ]] && exit 0
else
    echo -e "  ${GREEN}✓${RESET} .env 已存在"
fi

# ── 4. 备份 ──
if [[ $BACKUP_BEFORE -eq 1 ]]; then
    echo -e "\n${GREEN}▶ 部署前备份${RESET}"
    BACKUP_NAME="pre_deploy_$(date +%Y%m%d_%H%M%S)"
    ssh $SSH_OPTS "$SERVER" \
        "cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE exec api python -c \
        \"from services.cloud_backup_service import backup_database; backup_database('$BACKUP_NAME')\" 2>/dev/null || echo '备份跳过'"
    echo -e "  ${GREEN}✓${RESET} 备份: $BACKUP_NAME"
fi

# ── 5. 构建 & 启动 ──
echo -e "\n${GREEN}▶ 部署服务${RESET}"
if [[ $NO_BUILD -eq 1 ]]; then
    echo -e "  ${CYAN}→${RESET} 跳过构建，直接重启"
    ssh $SSH_OPTS "$SERVER" \
        "cd $REMOTE_DIR/$BACKEND_SUBDIR && \
         docker compose -f $COMPOSE_FILE --env-file .env down && \
         docker compose -f $COMPOSE_FILE --env-file .env up -d"
else
    echo -e "  ${CYAN}→${RESET} 构建镜像并启动 (约 3-5 分钟)"
    ssh $SSH_OPTS "$SERVER" \
        "cd $REMOTE_DIR/$BACKEND_SUBDIR && \
         docker compose -f $COMPOSE_FILE --env-file .env down && \
         docker compose -f $COMPOSE_FILE --env-file .env build --no-cache && \
         docker compose -f $COMPOSE_FILE --env-file .env up -d"
fi
echo -e "  ${GREEN}✓${RESET} Docker 服务已启动"

# ── 6. 健康检查 ──
echo -e "\n${GREEN}▶ 健康检查${RESET}"
sleep 8

echo -e "  ${CYAN}容器状态:${RESET}"
ssh $SSH_OPTS "$SERVER" "cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE ps"

if ssh $SSH_OPTS "$SERVER" "curl -fsS http://127.0.0.1:8000/health" 2>/dev/null; then
    echo -e "  ${GREEN}✓${RESET} 后端健康检查通过"
else
    echo -e "  ${YELLOW}⚠${RESET} 后端健康检查失败"
fi

HTTP_CODE=$(ssh $SSH_OPTS "$SERVER" "curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:80/health 2>/dev/null || echo N/A")
echo -e "  ${GREEN}✓${RESET} Nginx 状态码: $HTTP_CODE"

# ── 7. 完成 ──
echo -e "\n============================================"
echo -e "${GREEN}部署完成！${RESET}"
echo -e "============================================"
echo -e "查看日志:"
echo -e "  ssh $SERVER 'cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE logs -f --tail=100'"
echo
echo -e "常用命令:"
echo -e "  ssh $SERVER 'cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE ps'"
echo -e "  ssh $SERVER 'cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE restart api'"
echo -e "  ssh $SERVER 'cd $REMOTE_DIR/$BACKEND_SUBDIR && docker compose -f $COMPOSE_FILE down'"
