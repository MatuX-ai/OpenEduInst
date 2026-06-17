$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "=== Upload test script ===" -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no g:\OpenMTEduInst\test_org_api.sh ubuntu@43.156.248.107:/tmp/test_org_api.sh

Write-Host "=== Run test ===" -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "chmod +x /tmp/test_org_api.sh && bash /tmp/test_org_api.sh" 2>&1