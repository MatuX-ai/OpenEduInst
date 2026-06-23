#!/usr/bin/env bash
# ============================================================
# OpenMT 入门型套餐 (2核 2GB) - 服务器初始化脚本
# 目标：Ubuntu 22.04 LTS / Debian 12，root 执行
#
#   sudo bash init-lite-server.sh
#
# 完成：
#   1) 2GB Swap（防 OOM）
#   2) 基础安全：UFW 防火墙 / 时区 / 必要包
#   3) Docker + Compose v2 安装
#   4) 容器日志轮转（防止磁盘写满）
# ============================================================
set -euo pipefail

GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; RESET="\033[0m"
INFO="[INFO]"; OK="[OK]"; WARN="[WARN]"; ERR="[ERR]"
log_info() { echo -e "${GREEN}${INFO}${RESET} $1"; }
log_ok()   { echo -e "${GREEN}${OK}${RESET}   $1"; }
log_warn() { echo -e "${YELLOW}${WARN}${RESET} $1"; }
log_err()  { echo -e "${RED}${ERR}${RESET}  $1" >&2; }

# ---------- 0. 校验 ----------
[ "$(id -u)" -ne 0 ] && { log_err "请使用 root 或 sudo 执行"; exit 1; }

if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO="$ID"
    if [ "$DISTRO" != "ubuntu" ] && [ "$DISTRO" != "debian" ]; then
        log_warn "本脚本针对 Ubuntu/Debian 优化，$DISTRO 仅供参考"
    fi
else
    log_err "无法识别发行版"; exit 1
fi
log_info "系统: $DISTRO $(uname -r)"

# ---------- 1. Swap（关键：2GB 机器必备 2GB swap）----------
log_info "=== 配置 2GB Swap ==="
if [ ! -f /swapfile ] || ! swapon --show | grep -q "/swapfile"; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    # 持久化
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    # 优化 swappiness：值越低越倾向用物理内存（默认 60 对小内存机器偏高）
    sysctl vm.swappiness=10
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    log_ok "2GB Swap 已启用，swappiness=10"
else
    log_ok "Swap 已存在"
fi

# ---------- 2. 时区 / 软件源 ----------
log_info "=== 时区与基础包 ==="
timedatectl set-timezone Asia/Shanghai 2>/dev/null || true
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends \
    curl wget git ca-certificates gnupg lsb-release \
    ufw chrony htop vim unzip
log_ok "基础包已安装"

# ---------- 3. 防火墙 ----------
log_info "=== 配置 UFW ==="
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
# SSH
ufw allow 22/tcp comment "SSH" >/dev/null
# HTTP/HTTPS
ufw allow 80/tcp comment "HTTP" >/dev/null
ufw allow 443/tcp comment "HTTPS" >/dev/null
ufw --force enable >/dev/null
log_ok "UFW 已启用（22/80/443）"

# ---------- 4. Docker ----------
log_info "=== 安装 Docker ==="
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    systemctl enable --now docker
    log_ok "Docker 已安装: $(docker --version)"
else
    log_ok "Docker 已存在: $(docker --version)"
fi

if docker compose version >/dev/null 2>&1; then
    log_ok "Docker Compose: $(docker compose version)"
else
    log_err "Docker Compose v2 不可用"; exit 1
fi

# ---------- 5. Docker 日志轮转（40GB 磁盘省着用）----------
log_info "=== 配置 Docker 日志轮转 ==="
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": { "Name": "nofile", "Hard": 65536, "Soft": 65536 }
  }
}
EOF
systemctl restart docker
log_ok "Docker 日志已限速：单容器最大 30MB"

# ---------- 6. 内核参数 ----------
log_info "=== 内核网络优化 ==="
cat >> /etc/sysctl.conf <<'EOF'
# OpenMT 2GB 优化
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
EOF
sysctl -p
log_ok "网络参数已调优"

echo
echo "============================================="
echo "初始化完成！下一步："
echo "  1) ssh user@your-server 'cd /opt/openmt && cp .env.lite.example .env && vim .env'"
echo "  2) 在 .env 中填入 Neon DATABASE_URL 和生成的 SECRET_KEY"
echo "  3) 把前端 dist/* 拷贝到 deploy/frontend/"
echo "  4) docker compose -f docker-compose.lite.yml --env-file .env up -d"
echo "  5) 申请 SSL: certbot certonly --standalone -d your-domain.com"
echo "============================================="
