<#
.SYNOPSIS
    OpenMT 一键部署到腾讯云新加坡 Lighthouse
.DESCRIPTION
    构建前端 → 复制dist → rsync到服务器 → 构建Docker镜像 → 重启服务
    用法: .\deploy.ps1 [--no-build] [--sync-only] [--restart]
.PARAMETER NoBuild
    跳过前端构建
.PARAMETER SyncOnly
    仅同步代码
.PARAMETER Restart
    仅重启远程服务
.NOTES
    首次使用需确保:
    1. SSH 密钥已配置: ssh-keygen -t rsa -b 4096
    2. 密钥已授权: ssh-copy-id root@43.156.248.107
    3. Node.js 已安装且 npx 可用
#>

param(
    [switch]$NoBuild,
    [switch]$SyncOnly,
    [switch]$Restart,
    [string]$ConfigFile = "deploy_config.json"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── 配置 ──────────────────────────────────────────────
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# 尝试加载 JSON 配置
$config = $null
if (Test-Path $ConfigFile) {
    try {
        $config = Get-Content $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
        Write-Warning "配置文件 $ConfigFile 解析失败，使用默认值: $_"
    }
}

$SERVER   = if ($config.server.host) { "$($config.server.user)@$($config.server.host)" } else { "root@43.156.248.107" }
$SSH_KEY  = if ($config.server.ssh_key) { $config.server.ssh_key -replace '^~', $env:USERPROFILE } else { "$env:USERPROFILE\.ssh\id_rsa" }
$REMOTE_DIR = if ($config.server.remote_dir) { $config.server.remote_dir } else { "/opt/openmt" }
$COMPOSE_FILE = if ($config.docker.compose_file) { $config.docker.compose_file } else { "docker-compose.lite.yml" }
$COMPOSE_DIR = if ($config.docker.compose_dir) { $config.docker.compose_dir } else { "backend" }
$ENV_FILE = if ($config.docker.env_file) { $config.docker.env_file } else { ".env" }
$NO_CACHE = if ($null -ne $config.docker.no_cache) { $config.docker.no_cache } else { $true }
$SITE_URL = if ($config.urls.main_site) { $config.urls.main_site } else { "https://jigou.matux.tech" }
$PROJECT_ROOT = (Get-Item ".").FullName

# ── SSH 辅助函数 ───────────────────────────────────────
$sshBaseArgs = @("-i", $SSH_KEY, "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes")

function Invoke-SSH {
    param([string]$Command)
    $args = $sshBaseArgs + @($SERVER, $Command)
    & ssh @args
}

# ── 颜色函数 ───────────────────────────────────────────
$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$RED    = "`e[31m"
$CYAN   = "`e[36m"
$RESET  = "`e[0m"

function Step { param($m) Write-Host "`n$GREEN▶ $m$RESET" }
function Info { param($m) Write-Host "  $CYAN  $m$RESET" }
function OK   { param($m) Write-Host "  $GREEN✓$RESET $m" }
function Warn { param($m) Write-Host "  $YELLOW⚠$RESET $m" }
function Err  { param($m) Write-Host "  ${RED}✗${RESET} $m" }

# ── 打印信息 ───────────────────────────────────────────
Write-Host "`nOpenMT 部署脚本"
Info "项目根目录: $PROJECT_ROOT"
Info "目标服务器: $SERVER"
Info "远程目录:   $REMOTE_DIR"
Info "Docker:      $COMPOSE_DIR/$COMPOSE_FILE"
if ($NoBuild) { Warn "前端构建:   跳过" }
Write-Host ""

# ── 1. 仅重启模式 ──────────────────────────────────────
if ($Restart) {
    Step "检查 SSH 连接"
    $hostname = Invoke-SSH "hostname" 2>&1
    if ($LASTEXITCODE -ne 0) { Err "SSH 连接失败: $hostname"; exit 1 }
    OK "已连接到 $hostname"

    Step "Docker - 重启服务"
    $composeArgs = "-f $COMPOSE_FILE --env-file $ENV_FILE"
    Invoke-SSH "cd $REMOTE_DIR/$COMPOSE_DIR && docker compose $composeArgs down"
    Invoke-SSH "cd $REMOTE_DIR/$COMPOSE_DIR && docker compose $composeArgs up -d"
    if ($LASTEXITCODE -ne 0) { Err "Docker 重启失败"; exit 1 }
    OK "Docker 服务已重启"

    Write-Host "`n${GREEN}============================================${RESET}"
    Write-Host "${GREEN}  部署完成！${RESET}"
    Write-Host "${GREEN}============================================${RESET}"
    Write-Host "网站: $SITE_URL"
    exit 0
}

# ── 2. 前置检查 ────────────────────────────────────────
Step "检查前置条件"
$missingTools = @()
if (-not (Get-Command "ssh" -ErrorAction SilentlyContinue)) { $missingTools += "ssh" }
if (-not $NoBuild) {
    if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) { $missingTools += "node" }
    if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) { $missingTools += "npx" }
}
if ($missingTools.Count -gt 0) {
    Err "缺少工具: $($missingTools -join ', ')"
    exit 1
}
OK "本地工具就绪"

if (-not (Test-Path $SSH_KEY)) {
    Err "SSH 密钥不存在: $SSH_KEY"
    Warn "请先运行: ssh-keygen -t rsa -b 4096"
    Warn "然后: ssh-copy-id $SERVER"
    exit 1
}
OK "SSH 密钥: $SSH_KEY"

# ── 3. SSH 连通性 ──────────────────────────────────────
Step "检查 SSH 连接"
$hostname = Invoke-SSH "hostname" 2>&1
if ($LASTEXITCODE -ne 0) { Err "SSH 连接失败: $hostname"; exit 1 }
OK "已连接到 $hostname"

# ── 4. 构建前端 ────────────────────────────────────────
if (-not $NoBuild) {
    Step "构建前端 (Angular production)"
    Push-Location "$PROJECT_ROOT\frontend"
    npx ng build --configuration production
    if ($LASTEXITCODE -ne 0) { Pop-Location; Err "前端构建失败"; exit 1 }
    Pop-Location
    OK "前端构建完成"

    # ── 5. 复制 dist ────────────────────────────────────
    Step "复制前端构建产物"
    $distSrc = "$PROJECT_ROOT\frontend\dist\openmt-edu-inst"
    $deployDst = "$PROJECT_ROOT\$COMPOSE_DIR\deploy\frontend"

    if (-not (Test-Path $distSrc)) {
        Err "构建产物目录不存在: $distSrc"
        exit 1
    }

    if (Test-Path $deployDst) {
        Remove-Item "$deployDst\*" -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $deployDst -Force | Out-Null
    }
    Copy-Item "$distSrc\*" $deployDst -Recurse -Force
    $count = (Get-ChildItem $deployDst).Count
    OK "已复制 $count 个文件到 $COMPOSE_DIR/deploy/frontend"
} else {
    Step "跳过前端构建 (--no-build)"
}

# ── 6. 同步代码──────────────────────────────────────────
Step "同步代码到服务器"

# 尝试 rsync，失败则用 tar
$useRsync = $false
if (Get-Command "rsync" -ErrorAction SilentlyContinue) {
    $useRsync = $true
} else {
    Warn "未安装 rsync，使用 SSH + tar 方式同步"
}

if ($useRsync) {
    $rsyncExclude = @(
        "--exclude=.git", "--exclude=__pycache__", "--exclude=*.pyc",
        "--exclude=node_modules", "--exclude=.venv", "--exclude=venv",
        "--exclude=logs", "--exclude=data", "--exclude=.env",
        "--exclude=deploy/nginx/ssl", "--exclude=.mypy_cache",
        "--exclude=deploy_tmp"
    )
    $rsyncArgs = @("-avz", "--delete") + $rsyncExclude + @(
        "-e", "ssh -i `"$SSH_KEY`" -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new",
        "$PROJECT_ROOT/",
        "${SERVER}:${REMOTE_DIR}/"
    )
    & rsync @rsyncArgs
    if ($LASTEXITCODE -ne 0) { Err "rsync 同步失败"; exit 1 }
} else {
    # 备用：tar + ssh 管道
    $excludeArgs = @(
        "--exclude=.git", "--exclude=__pycache__", "--exclude=*.pyc",
        "--exclude=node_modules", "--exclude=.venv", "--exclude=venv",
        "--exclude=logs", "--exclude=data", "--exclude=.env",
        "--exclude=deploy/nginx/ssl", "--exclude=.mypy_cache",
        "--exclude=deploy_tmp"
    )
    $tarExcludeParams = ($excludeArgs -join " ")
    $tarCmd = "tar czf - $tarExcludeParams -C `"$PROJECT_ROOT`" ."
    $sshTarCmd = "ssh -i `"$SSH_KEY`" -o ConnectTimeout=15 $SERVER `"cd $REMOTE_DIR && tar xzf -`""

    $fullCmd = "cmd /c `"$tarCmd | $sshTarCmd`""
    Invoke-Expression $fullCmd
    if ($LASTEXITCODE -ne 0) { Err "tar 同步失败"; exit 1 }
}

OK "代码同步完成"

# ── 7. 仅同步模式 ──────────────────────────────────────
if ($SyncOnly) {
    OK "仅同步模式 - 跳过 Docker 操作"
    Write-Host "`n${GREEN}============================================${RESET}"
    Write-Host "${GREEN}  同步完成！${RESET}"
    Write-Host "${GREEN}============================================${RESET}"
    exit 0
}

# ── 8. Docker 操作 ─────────────────────────────────────
$composePath = "$REMOTE_DIR/$COMPOSE_DIR"
$composeArgs = "-f $COMPOSE_FILE --env-file $ENV_FILE"

# 停止
Step "Docker - 停止现有服务"
Invoke-SSH "cd $composePath && docker compose $composeArgs down"
if ($LASTEXITCODE -ne 0) { Warn "docker compose down 失败 (可能首次运行)" }
else { OK "服务已停止" }

# 构建
$buildCacheFlag = if ($NO_CACHE) { "--no-cache" } else { "" }
Step "Docker - 重建镜像 $buildCacheFlag"
Invoke-SSH "cd $composePath && docker compose $composeArgs build $buildCacheFlag"
if ($LASTEXITCODE -ne 0) { Err "Docker 镜像构建失败"; exit 1 }
OK "Docker 镜像构建完成"

# 启动
Step "Docker - 启动服务"
Invoke-SSH "cd $composePath && docker compose $composeArgs up -d"
if ($LASTEXITCODE -ne 0) { Err "Docker 启动失败"; exit 1 }
OK "Docker 服务已启动"

# ── 9. 健康检查 ────────────────────────────────────────
Step "健康检查 (等待 15 秒)"
Start-Sleep -Seconds 15

Write-Host "`n容器状态:"
Invoke-SSH "cd $composePath && docker compose $composeArgs ps"

Write-Host "`nAPI 健康检查:"
$health = Invoke-SSH "curl -fsS http://127.0.0.1:8000/health" 2>&1
if ($LASTEXITCODE -eq 0) {
    OK "后端健康检查通过: $health"
} else {
    Warn "后端健康检查失败，请查看日志"
}

Write-Host "`n${GREEN}============================================${RESET}"
Write-Host "${GREEN}  部署完成！${RESET}"
Write-Host "${GREEN}============================================${RESET}"
Write-Host "  网站: $SITE_URL"
Write-Host "  时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "${GREEN}============================================${RESET}`n"
