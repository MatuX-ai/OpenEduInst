<#
.SYNOPSIS
    OpenMT 一键部署到腾讯云新加坡 Lighthouse
.DESCRIPTION
    构建前端 → 复制dist → rsync到服务器 → 构建Docker镜像 → 重启服务
    用法: 在项目根目录执行  .\deploy.ps1
#>

$ErrorActionPreference = "Stop"
$SERVER = "root@43.156.248.107"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$REMOTE_DIR = "/opt/openmt"
$COMPOSE_FILE = "docker-compose.lite.yml"
$PROJECT_ROOT = (Get-Item ".").FullName

$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$RED    = "`e[31m"
$RESET  = "`e[0m"

function Step { param($m) Write-Host "`n$GREEN▶ $m$RESET" }
function OK   { param($m) Write-Host "  $GREEN✓$RESET $m" }
function Warn { param($m) Write-Host "  $YELLOW⚠$RESET $m" }

# 1. 检查 SSH 连通性
Step "检查 SSH 连接 $SERVER"
$hostname = & ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new $SERVER "hostname" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "SSH 连接失败: $hostname"; exit 1 }
OK "已连接到 $hostname"

# 2. 构建前端
Step "构建前端 (Angular production)"
Push-Location "$PROJECT_ROOT\frontend"
npx ng build --configuration production
if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }
Pop-Location
OK "前端构建完成"

# 3. 复制 dist → deploy/frontend
Step "复制前端构建产物到 deploy 目录"
$distSrc = "$PROJECT_ROOT\frontend\dist\openmt-edu-inst"
$deployDst = "$PROJECT_ROOT\backend\deploy\frontend"
if (Test-Path $deployDst) { Remove-Item "$deployDst\*" -Recurse -Force }
Copy-Item "$distSrc\*" $deployDst -Recurse -Force
$count = (Get-ChildItem $deployDst).Count
OK "已复制 $count 个文件到 deploy/frontend"

# 4. rsync 同步到服务器
Step "同步代码到服务器 (rsync)"
$rsyncExclude = @(
    "--exclude=.git", "--exclude=__pycache__", "--exclude=*.pyc",
    "--exclude=node_modules", "--exclude=.venv", "--exclude=venv",
    "--exclude=logs", "--exclude=data", "--exclude=.env",
    "--exclude=deploy/nginx/ssl", "--exclude=.mypy_cache"
)
$rsyncCmd = "rsync -avz --delete $($rsyncExclude -join ' ') -e `"ssh -i $SSH_KEY`" `"$PROJECT_ROOT/`" ${SERVER}:${REMOTE_DIR}/"
Invoke-Expression $rsyncCmd
if ($LASTEXITCODE -ne 0) { throw "rsync 同步失败" }
OK "代码同步完成"

# 5. 远程构建并重启
Step "远程构建 Docker 镜像并重启服务"
$remoteCmd = "cd $REMOTE_DIR/backend && docker compose -f $COMPOSE_FILE --env-file .env down"
$remoteCmd += " && docker compose -f $COMPOSE_FILE --env-file .env build --no-cache"
$remoteCmd += " && docker compose -f $COMPOSE_FILE --env-file .env up -d"
& ssh -i "$SSH_KEY" $SERVER $remoteCmd
if ($LASTEXITCODE -ne 0) { throw "远程部署失败" }
OK "Docker 服务已启动"

# 6. 健康检查
Step "健康检查"
Start-Sleep -Seconds 10
Write-Host "`n容器状态:"
& ssh -i "$SSH_KEY" $SERVER "cd $REMOTE_DIR/backend && docker compose -f $COMPOSE_FILE ps"
Write-Host "`nAPI 健康检查:"
$health = & ssh -i "$SSH_KEY" $SERVER "curl -fsS http://127.0.0.1:8000/health" 2>&1
if ($LASTEXITCODE -eq 0) {
    OK "后端健康检查通过: $health"
} else {
    Warn "后端健康检查失败，请查看日志: ssh -i `"$SSH_KEY`" $SERVER 'cd $REMOTE_DIR/backend && docker compose -f $COMPOSE_FILE logs api'"
}

Write-Host "`n$GREEN============================================$RESET"
Write-Host "$GREEN  部署完成！$RESET"
Write-Host "$GREEN============================================$RESET"
Write-Host "网站: https://jigou.matux.tech"
Write-Host "日志: ssh -i `"$SSH_KEY`" $SERVER 'cd $REMOTE_DIR/backend && docker compose -f $COMPOSE_FILE logs -f --tail=100'"
