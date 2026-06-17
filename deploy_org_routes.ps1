# 部署脚本 - PowerShell版本（简化版）
$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "=== STEP 1: SCP files to server ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no "g:\OpenMTEduInst\backend\routes\educational_institution_routes.py" ubuntu@43.156.248.107:/tmp/edu_routes_new.py
Write-Host "edu_routes uploaded: $LASTEXITCODE" -ForegroundColor Cyan
scp -i $SSH_KEY -o StrictHostKeyChecking=no "g:\OpenMTEduInst\backend\main.py" ubuntu@43.156.248.107:/tmp/main_new.py
Write-Host "main.py uploaded: $LASTEXITCODE" -ForegroundColor Cyan

Write-Host "=== STEP 2: Deploy via docker cp + restart ===" -ForegroundColor Green
$cmd1 = "sudo docker cp /tmp/edu_routes_new.py openmt-api:/app/routes/educational_institution_routes.py && sudo docker cp /tmp/main_new.py openmt-api:/app/main.py && sudo docker restart openmt-api && echo DEPLOY_DONE"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 $cmd1

Write-Host "=== STEP 3: Wait 12s for restart ===" -ForegroundColor Green
Start-Sleep -Seconds 12

Write-Host "=== STEP 4: Check health ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s -o /dev/null -w 'HEALTH:%{http_code}' http://127.0.0.1:8000/health; echo ''"

Write-Host "=== STEP 5: List org-scoped routes from OpenAPI ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no "g:\OpenMTEduInst\check_routes.py" ubuntu@43.156.248.107:/tmp/check_routes.py
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s http://127.0.0.1:8000/openapi.json > /tmp/oa.json && python3 /tmp/check_routes.py"

Write-Host "=== STEP 6: Login + test endpoints ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no "g:\OpenMTEduInst\save_token.py" ubuntu@43.156.248.107:/tmp/save_token.py
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s -X POST https://jigou.matux.tech/api/v1/auth/token -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'username=zhao_admin' --data-urlencode 'password=demo123456' > /tmp/login.json && python3 /tmp/save_token.py"
scp -i $SSH_KEY -o StrictHostKeyChecking=no "g:\OpenMTEduInst\test_routes.sh" ubuntu@43.156.248.107:/tmp/test_routes.sh
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "chmod +x /tmp/test_routes.sh && bash /tmp/test_routes.sh"

Write-Host "=== ALL DONE ===" -ForegroundColor Green