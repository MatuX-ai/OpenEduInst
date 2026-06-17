$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$tarPath = "g:\OpenMTEduInst\frontend.tar.gz"

Write-Host "=== STEP 1: Create tarball ===" -ForegroundColor Green
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
Set-Location g:\OpenMTEduInst\frontend\dist\openmt-edu-inst
& tar -czf $tarPath *
Set-Location g:\OpenMTEduInst
Write-Host "Tarball: $((Get-Item $tarPath).Length) bytes"

Write-Host "=== STEP 2: SCP ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tarPath ubuntu@43.156.248.107:/tmp/frontend.tar.gz
Write-Host "Upload exit: $LASTEXITCODE"

Write-Host "=== STEP 3: Extract ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "sudo rm -rf /opt/openmt/backend/deploy/frontend/* && sudo tar -xzf /tmp/frontend.tar.gz -C /opt/openmt/backend/deploy/frontend/"
Write-Host "Extract exit: $LASTEXITCODE"

Write-Host "=== STEP 4: Restart nginx ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "sudo docker restart openmt-nginx"

Write-Host "=== STEP 5: Verify ===" -ForegroundColor Green
Start-Sleep -Seconds 3
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s https://jigou.matux.tech/app/ | grep -oP 'main\.[a-f0-9]+\.js'"

Write-Host "=== ALL DONE ===" -ForegroundColor Green
