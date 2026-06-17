<#
.SYNOPSIS
    OpenMT SSH 远程部署脚本 (Windows PowerShell)
.DESCRIPTION
    通过 SSH 一键上传代码并部署到远程服务器。
    支持首次部署（含服务器初始化）和日常更新部署两种模式。
.PARAMETER Server
    服务器地址，格式: user@host 或 user@ip
.PARAMETER Port
    SSH 端口，默认 22
.PARAMETER RemoteDir
    服务器上项目目录，默认 /opt/openmt
.PARAMETER InitServer
    首次部署时使用，会先执行服务器初始化脚本
.PARAMETER ComposeFile
    Docker Compose 文件，默认: docker-compose.lite.yml (入门型 2核2GB)
    可选: docker-compose.yml (标准型 4核+)
.PARAMETER NoBuild
    跳过镜像构建（仅重启，适用于代码无依赖变更时）
.PARAMETER BackupBefore
    部署前备份数据库
.PARAMETER SkipUpload
    跳过文件上传（仅执行远程部署命令）
.EXAMPLE
    # 首次部署（初始化服务器 + 上传代码 + 构建启动）
    .\deploy-remote.ps1 -Server "root@123.456.789.0" -InitServer

    # 日常更新部署
    .\deploy-remote.ps1 -Server "root@123.456.789.0"

    # 使用标准型 compose 文件
    .\deploy-remote.ps1 -Server "root@your-server.com" -ComposeFile "docker-compose.yml"

    # 仅重启服务（不重新构建）
    .\deploy-remote.ps1 -Server "root@123.456.789.0" -NoBuild -SkipUpload
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="服务器地址，如 root@123.456.789.0")]
    [string]$Server,

    [Parameter(HelpMessage="SSH 端口")]
    [int]$Port = 22,

    [Parameter(HelpMessage="服务器项目路径")]
    [string]$RemoteDir = "/opt/openmt",

    [Parameter(HelpMessage="首次部署：执行服务器初始化")]
    [switch]$InitServer,

    [Parameter(HelpMessage="Docker Compose 文件名")]
    [string]$ComposeFile = "docker-compose.lite.yml",

    [Parameter(HelpMessage="跳过构建，直接重启")]
    [switch]$NoBuild,

    [Parameter(HelpMessage="部署前备份数据库")]
    [switch]$BackupBefore,

    [Parameter(HelpMessage="仅远程执行命令，跳过上传")]
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$RED    = "`e[31m"
$CYAN   = "`e[36m"
$RESET  = "`e[0m"

function Write-Step { param($msg) Write-Host "`n$GREEN▶ $msg$RESET" }
function Write-OK   { param($msg) Write-Host "  $GREEN✓$RESET $msg" }
function Write-Warn { param($msg) Write-Host "  $YELLOW⚠$RESET $msg" }
function Write-Err  { param($msg) Write-Host "  $RED✗$RESET $msg" }
function Write-Cmd  { param($msg) Write-Host "  $CYAN→$RESET $msg" }

# ──────────────────────────────────────────────
# SSH 参数
# ──────────────────────────────────────────────
$sshBase = "ssh -p $Port -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new"
$scpBase = "scp -P $Port -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -r"

# ──────────────────────────────────────────────
# 0. 预检：SSH 连通性
# ──────────────────────────────────────────────
Write-Step "检查 SSH 连接: $Server (端口 $Port)"
try {
    $hostname = & ssh -p $Port -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new $Server "hostname" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SSH 连接失败: $hostname"
    }
    Write-OK "已连接到 $hostname"
} catch {
    Write-Err "无法连接服务器，请检查："
    Write-Err "  1. 服务器 IP/域名是否正确"
    Write-Err "  2. SSH 端口 $Port 是否开放"
    Write-Err "  3. 是否已配置 SSH 密钥: ssh-copy-id $Server"
    exit 1
}

# ──────────────────────────────────────────────
# 1. 首次初始化（可选）
# ──────────────────────────────────────────────
if ($InitServer) {
    Write-Step "首次部署：上传并执行服务器初始化脚本"
    Write-Warn "此操作将：安装 Docker、配置防火墙、创建 Swap、调优内核参数"

    & $scpBase ".\deploy\init-lite-server.sh" "${Server}:/tmp/init-lite-server.sh"
    if ($LASTEXITCODE -ne 0) { throw "上传初始化脚本失败" }

    & $sshBase $Server "sudo bash /tmp/init-lite-server.sh"
    if ($LASTEXITCODE -ne 0) { throw "初始化脚本执行失败" }
    Write-OK "服务器初始化完成"

    # 创建项目目录
    & $sshBase $Server "sudo mkdir -p $RemoteDir && sudo chown `$(whoami) `$(whoami) $RemoteDir"
    if ($LASTEXITCODE -ne 0) { throw "创建项目目录失败" }
    Write-OK "项目目录已创建: $RemoteDir"
}

# ──────────────────────────────────────────────
# 2. 上传代码
# ──────────────────────────────────────────────
if (-not $SkipUpload) {
    Write-Step "上传项目代码到服务器"
    Write-Cmd "排除: .git, __pycache__, node_modules, .venv, logs, .env"

    # 创建排除列表
    $excludeFile = "$env:TEMP\openmt-rsync-exclude.txt"
    @"
.git
__pycache__
*.pyc
*.pyo
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
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

    # 使用 rsync (如果可用) 或 scp
    $rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
    if ($rsyncAvailable) {
        Write-Cmd "使用 rsync 增量同步 (更快)"
        $projectRoot = (Get-Item -Path "..\..").FullName
        $rsyncCmd = @(
            "rsync", "-avz", "--delete",
            "--exclude-from=`"$excludeFile`"",
            "-e `"ssh -p $Port -o StrictHostKeyChecking=accept-new`"",
            "`"$projectRoot/`"",
            "`"${Server}:$RemoteDir/`""
        ) -join " "
        Invoke-Expression $rsyncCmd
        if ($LASTEXITCODE -ne 0) { throw "rsync 上传失败" }
    } else {
        Write-Warn "未安装 rsync，使用 scp（较慢）。建议安装: winget install Rsync"
        Write-Cmd "正在压缩项目文件..."

        $tempArchive = "$env:TEMP\openmt-deploy.tar.gz"
        $projectRoot = (Get-Item -Path "..\..").FullName

        # 创建压缩包（排除不需要的文件）
        Push-Location $projectRoot
        & tar --exclude-from="$excludeFile" -czf "$tempArchive" .
        if ($LASTEXITCODE -ne 0) { throw "压缩失败" }
        Pop-Location

        Write-Cmd "上传压缩包..."
        & $scpBase "$tempArchive" "${Server}:/tmp/openmt-deploy.tar.gz"
        if ($LASTEXITCODE -ne 0) { throw "上传压缩包失败" }

        Write-Cmd "服务器解压..."
        & $sshBase $Server "sudo tar -xzf /tmp/openmt-deploy.tar.gz -C $RemoteDir && rm /tmp/openmt-deploy.tar.gz"
        if ($LASTEXITCODE -ne 0) { throw "解压失败" }

        Remove-Item $tempArchive -ErrorAction SilentlyContinue
    }

    Remove-Item $excludeFile -ErrorAction SilentlyContinue
    Write-OK "代码上传完成"
}

# ──────────────────────────────────────────────
# 3. 检查/配置 .env
# ──────────────────────────────────────────────
Write-Step "检查环境配置"
$envCheck = & $sshBase $Server "test -f $RemoteDir/backend/.env && echo 'EXISTS' || echo 'MISSING'"
if ($envCheck.Trim() -eq "MISSING") {
    Write-Warn ".env 文件不存在，从模板创建"
    & $sshBase $Server "cp $RemoteDir/backend/.env.lite.example $RemoteDir/backend/.env"
    Write-Err "请立即编辑服务器上的 .env 文件，填入数据库连接串和密钥："
    Write-Err "  ssh $Server 'vim $RemoteDir/backend/.env'"
    Write-Err "  必填: DATABASE_URL, SECRET_KEY"
    $confirm = Read-Host "配置完成后按 Enter 继续 (或输入 'q' 退出)"
    if ($confirm -eq 'q') { exit 0 }
} else {
    Write-OK ".env 已存在"
}

# ──────────────────────────────────────────────
# 4. 预部署备份（可选）
# ──────────────────────────────────────────────
if ($BackupBefore) {
    Write-Step "部署前数据库备份"
    $backupTime = Get-Date -Format "yyyyMMdd_HHmmss"
    & $sshBase $Server "cd $RemoteDir/backend && docker compose -f $ComposeFile exec api python -c `
        `"from services.cloud_backup_service import backup_database; backup_database('pre_deploy_$backupTime')`" 2>/dev/null || echo '备份跳过（服务未运行或备份服务不可用）'"
    Write-OK "备份完成"
}

# ──────────────────────────────────────────────
# 5. 构建 & 启动
# ──────────────────────────────────────────────
Write-Step "部署服务"
$remoteCmd = "cd $RemoteDir/backend"

if ($NoBuild) {
    Write-Cmd "跳过构建，直接重启"
    $remoteCmd += " && docker compose -f $ComposeFile --env-file .env down && docker compose -f $ComposeFile --env-file .env up -d"
} else {
    Write-Cmd "构建镜像并启动"
    $remoteCmd += " && docker compose -f $ComposeFile --env-file .env down && docker compose -f $ComposeFile --env-file .env build --no-cache && docker compose -f $ComposeFile --env-file .env up -d"
}

& $sshBase $Server $remoteCmd
if ($LASTEXITCODE -ne 0) { throw "部署命令执行失败" }
Write-OK "Docker 服务已启动"

# ──────────────────────────────────────────────
# 6. 健康检查
# ──────────────────────────────────────────────
Write-Step "健康检查 (等待服务就绪...)"
Start-Sleep -Seconds 8

Write-Cmd "容器状态:"
& $sshBase $Server "cd $RemoteDir/backend && docker compose -f $ComposeFile ps"

Write-Cmd "API 健康检查:"
$health = & $sshBase $Server "curl -fsS http://127.0.0.1:8000/health 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-OK "后端健康检查通过: $health"
} else {
    Write-Warn "后端健康检查失败，查看日志: ssh $Server 'cd $RemoteDir/backend && docker compose -f $ComposeFile logs api'"
}

Write-Cmd "Nginx 状态:"
$nginxStatus = & $sshBase $Server "curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:80/health 2>&1 || echo 'N/A'"
Write-OK "Nginx HTTP 状态码: $nginxStatus"

# ──────────────────────────────────────────────
# 7. 完成
# ──────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "部署完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "查看日志:" -ForegroundColor Cyan
Write-Host "  ssh $Server 'cd $RemoteDir/backend && docker compose -f $ComposeFile logs -f --tail=100'" -ForegroundColor White
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
Write-Host "  ssh $Server 'cd $RemoteDir/backend && docker compose -f $ComposeFile ps'" -ForegroundColor White
Write-Host "  ssh $Server 'cd $RemoteDir/backend && docker compose -f $ComposeFile restart api'" -ForegroundColor White
Write-Host "  ssh $Server 'cd $RemoteDir/backend && docker compose -f $ComposeFile down'" -ForegroundColor White
