$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "=== STEP 1: Create tarball ===" -ForegroundColor Green
$frontendDir = "g:\OpenMTEduInst\frontend\dist\openmt-edu-inst"
$tarPath = "g:\OpenMTEduInst\frontend.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
$msysBase = "C:\msys64"  # adjust if needed
# Use tar via PowerShell 5+ built-in
$distFiles = Get-ChildItem -Path $frontendDir -File | Select-Object -ExpandProperty Name -OutVariable names
Set-Location $frontendDir
& tar -czf $tarPath *
Set-Location g:\OpenMTEduInst
Write-Host "Tarball created: $((Get-Item $tarPath).Length) bytes"

Write-Host "=== STEP 2: SCP tarball ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tarPath ubuntu@43.156.248.107:/tmp/frontend.tar.gz
Write-Host "Uploaded: $LASTEXITCODE"

Write-Host "=== STEP 3: Extract on server ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "sudo rm -rf /opt/openmt/backend/deploy/frontend/* && sudo tar -xzf /tmp/frontend.tar.gz -C /opt/openmt/backend/deploy/frontend/ && sudo ls /opt/openmt/backend/deploy/frontend/ | head -10"

Write-Host "=== STEP 4: Restart nginx ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "CONTAINER=$(docker ps --filter 'ancestor=nginx' --format '{{.Names}}' | head -1); if [ -z \"\$CONTAINER\" ]; then CONTAINER=\$(docker ps --format '{{.Names}}' | grep -i nginx | head -1); fi; echo NGINX=\$CONTAINER; sudo docker exec \$CONTAINER ls /usr/share/nginx/html/main.*.js 2>/dev/null | head -3; sudo docker restart \$CONTAINER"

Write-Host "=== STEP 5: Verify new main hash is served ===" -ForegroundColor Green
Start-Sleep -Seconds 5
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s https://jigou.matux.tech/ | grep -oE 'main\.[a-f0-9]+\.js' | head -3"

Write-Host "=== ALL DONE ===" -ForegroundColor Green