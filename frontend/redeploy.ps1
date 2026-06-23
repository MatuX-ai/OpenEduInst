# OpenMT 前端重新部署脚本 (UI 审计修复版)
# 流程: ng build -> tar -> scp -> extract -> restart nginx -> verify

$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$FRONTEND = "g:\OpenMTEduInst\frontend"
$DIST = "$FRONTEND\dist\openmt-edu-inst"
$TAR = "$FRONTEND\frontend.tar.gz"
$REMOTE = "ubuntu@43.156.248.107"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[1/6] ng build (production)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location $FRONTEND
$build = Start-Process -FilePath "npx.cmd" -ArgumentList "ng","build","--configuration=production" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$FRONTEND\build.out" -RedirectStandardError "$FRONTEND\build.err"
if ($build.ExitCode -ne 0) {
    Write-Host "ng build FAILED exit=$($build.ExitCode)" -ForegroundColor Red
    Get-Content "$FRONTEND\build.err" -Tail 50
    exit 1
}
Write-Host "ng build OK" -ForegroundColor Green
Get-Content "$FRONTEND\build.out" -Tail 20

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[2/6] Create tarball" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
if (Test-Path $TAR) { Remove-Item $TAR -Force }
$mainFile = Get-ChildItem -Path $DIST -Filter "main.*.js" -File | Select-Object -First 1
Write-Host "Main JS: $($mainFile.Name) ($($mainFile.Length) bytes)" -ForegroundColor Yellow
Set-Location $DIST
& tar -czf $TAR *
Set-Location $FRONTEND
Write-Host "Tarball: $((Get-Item $TAR).Length) bytes" -ForegroundColor Yellow

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[3/6] SCP upload" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
& scp -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=30 $TAR "${REMOTE}:/tmp/frontend.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "SCP FAILED" -ForegroundColor Red; exit 1 }
Write-Host "SCP OK" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[4/6] Extract on server (override)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
& ssh -i $SSH_KEY -o StrictHostKeyChecking=no $REMOTE "sudo rm -rf /opt/openmt/backend/deploy/frontend/* && sudo tar -xzf /tmp/frontend.tar.gz -C /opt/openmt/backend/deploy/frontend/ && ls /opt/openmt/backend/deploy/frontend/main.*.js && stat -c '%y %s %n' /opt/openmt/backend/deploy/frontend/main.*.js"
if ($LASTEXITCODE -ne 0) { Write-Host "Extract FAILED" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[5/6] Restart nginx" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
& ssh -i $SSH_KEY -o StrictHostKeyChecking=no $REMOTE "sudo docker restart openmt-nginx && sleep 3 && sudo docker ps --format 'table {{.Names}}\t{{.Status}}' | grep openmt-nginx"
if ($LASTEXITCODE -ne 0) { Write-Host "Restart FAILED" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[6/6] Verify jigou.matux.tech/app serves new hash" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3
$verify = & ssh -i $SSH_KEY -o StrictHostKeyChecking=no $REMOTE "curl -s https://jigou.matux.tech/app/ | grep -oE 'main\.[a-f0-9]+\.js' | head -1"
Write-Host "jigou.matux.tech serves: $verify" -ForegroundColor Yellow
if ($verify -match "main\.b9a9a26822a756fc\.js") {
    Write-Host "SAME HASH (no rebuild detected)" -ForegroundColor Yellow
} elseif ($verify -match "main\.[a-f0-9]+\.js") {
    Write-Host "NEW HASH DETECTED -> Deployment successful" -ForegroundColor Green
} else {
    Write-Host "VERIFY FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ALL DONE ===" -ForegroundColor Cyan
