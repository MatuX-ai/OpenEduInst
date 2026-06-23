# 🚀 部署指南 (Multi-IDE SSH Deploy)

本项目的 SSH 部署配置文件兼容 **VSCode / Cursor / Windsurf / JetBrains** 等主流 IDE。

---

## 📂 配置文件一览

| 文件 | 用途 | 适用 IDE |
|------|------|----------|
| `deploy/ssh-config` | 标准 SSH 配置片段，添加到 `~/.ssh/config` | 所有工具 |
| `.vscode/sftp.json` | SFTP 自动同步上传配置 | VSCode / Cursor / Windsurf |
| `.vscode/tasks.json` | 一键部署任务（构建/重启/健康检查） | VSCode / Cursor / Windsurf |
| `.vscode/extensions.json` | 推荐安装的插件列表 | VSCode / Cursor / Windsurf |

---

## ⚡ 快速开始

### 方式一：VSCode / Cursor / Windsurf（推荐）

**1. 安装推荐插件**

打开项目后，IDE 会提示安装推荐插件：
- **SFTP** (liximomo.sftp) — 文件同步上传
- **Remote - SSH** (ms-vscode-remote.remote-ssh) — 远程终端
- **Docker** (ms-azuretools.vscode-docker) — Docker 管理

或者手动安装：`Ctrl+Shift+P` → `Extensions: Show Recommended Extensions`

**2. 配置 SSH 密钥**

```bash
# 生成密钥（如果没有）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# 上传公钥到服务器
ssh-copy-id root@43.156.248.107
```

**3. 一键部署**

`Ctrl+Shift+P` → `Tasks: Run Task` → 选择部署命令：

| 任务 | 说明 |
|------|------|
| 🔨 Deploy: Full | 完整部署：上传代码 + 构建 + 启动 |
| 🚀 Deploy: Quick Restart | 快速重启（不上传、不构建） |
| 📦 Deploy: Build Only | 服务器代码已更新，仅构建启动 |
| ⬇️ Deploy: Pull Git + Rebuild | 服务器 git pull 后重建 |
| 🔍 Deploy: Health Check | 查看容器状态和健康端点 |
| 📋 Deploy: View Logs | 查看实时日志 |

或使用快捷键：`Ctrl+Shift+B`（默认执行 Full Deploy）

---

### 方式二：标准 SSH + 命令行

**1. 添加 SSH 配置**

将 `deploy/ssh-config` 的内容追加到 `~/.ssh/config`：

```bash
cat deploy/ssh-config >> ~/.ssh/config
```

然后可以：

```bash
# 直接登录
ssh openmt

# 查看容器状态
ssh openmt-ps

# 查看日志
ssh openmt-logs

# 使用部署脚本
bash backend/deploy/deploy-remote.sh root@43.156.248.107
```

---

### 方式三：JetBrains (IntelliJ / WebStorm / PyCharm)

**1. 配置 Deployment**

`Settings` → `Build, Execution, Deployment` → `Deployment` → `+` → `SFTP`

| 字段 | 值 |
|------|-----|
| Host | 43.156.248.107 |
| Port | 22 |
| User name | root |
| Authentication | Key pair |
| Private key file | ~/.ssh/id_rsa |
| Root path | /opt/openmt |

**2. 设置自动上传**

`Tools` → `Deployment` → `Automatic Upload`（可选）

**3. 排除项 (Excluded Paths)**

```
.git;node_modules;__pycache__;*.pyc;.venv;venv;logs;data;.mypy_cache;*.egg-info
```

---

## 🖥️ 服务器信息

| 项目 | 值 |
|------|-----|
| 名称 | MatuX-JiGou |
| 地域 | 新加坡 (ap-singapore) |
| IP | 43.156.248.107 |
| 端口 | 22 |
| 用户 | root |
| 项目路径 | /opt/openmt |
| Compose 文件 | docker-compose.lite.yml |

---

## 🔌 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx (HTTP) | 80 | 自动重定向到 HTTPS |
| Nginx (HTTPS) | 443 | 主入口 |
| API (内部) | 8000 | FastAPI 后端 |
| Marketing (内部) | 3000 | Next.js 营销站 |

---

## 📝 常用 SSH 命令

```bash
# 查看容器状态
ssh openmt 'cd /opt/openmt/backend && docker compose -f docker-compose.lite.yml ps'

# 重启 API
ssh openmt 'cd /opt/openmt/backend && docker compose -f docker-compose.lite.yml restart api'

# 停止所有服务
ssh openmt 'cd /opt/openmt/backend && docker compose -f docker-compose.lite.yml down'

# 查看 API 日志
ssh openmt 'cd /opt/openmt/backend && docker compose -f docker-compose.lite.yml logs -f api'

# Git 同步 + 重建
ssh openmt 'cd /opt/openmt && git pull && cd backend && docker compose -f docker-compose.lite.yml up -d --build'
```
