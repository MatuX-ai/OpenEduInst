$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

Write-Host "=== Verify served main hash ===" -ForegroundColor Green
$cmd = 'curl -s https://jigou.matux.tech/app/ | grep -oE "main\.[a-f0-9]+\.js"'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Verify new endpoint works ===" -ForegroundColor Green
$cmd = 'TOKEN=$(cat /tmp/token.txt); echo "TOKEN_LEN=${#TOKEN}"; curl -s -o /dev/null -w "metrics:%{http_code} dashboard:" -H "Authorization: Bearer $TOKEN" https://jigou.matux.tech/api/v1/educational_institution/org/1/metrics; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://jigou.matux.tech/api/v1/educational_institution/org/1/dashboard'
iex "$SSH '$cmd'" 2>&1