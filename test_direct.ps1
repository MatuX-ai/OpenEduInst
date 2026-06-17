$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "=== Login (raw output) ===" -ForegroundColor Green
$cmd = "curl -s -X POST https://jigou.matux.tech/api/v1/auth/token -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'username=zhao_admin' --data-urlencode 'password=demo123456' > /tmp/login.json; cat /tmp/login.json"
$out = ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 $cmd 2>&1
Write-Host $out

Write-Host "=== Test with token ===" -ForegroundColor Green
$cmd = "TOKEN=`$(cat /tmp/login.json | python3 -c 'import json,sys; print(json.load(sys.stdin).get(\"access_token\",\"\"))'); echo TOKEN_LEN=`${`$TOKEN`}; curl -s -w 'HTTP:%{http_code}\n' -H \"Authorization: Bearer `${TOKEN}\" https://jigou.matux.tech/api/v1/org/50/overview | head -c 600"
$out = ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 $cmd 2>&1
Write-Host $out

Write-Host "=== OpenAPI ===" -ForegroundColor Green
$cmd = 'curl -s http://127.0.0.1:8000/openapi.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(p) for p in d[\"paths\"] if \"overview\" in p or \"dashboard\" in p]"'
$out = ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 $cmd 2>&1
Write-Host $out