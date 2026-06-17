$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

Write-Host "=== Login as zhao_admin ===" -ForegroundColor Green
$cmd = 'curl -s -X POST https://jigou.matux.tech/api/v1/auth/token -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "username=zhao_admin" --data-urlencode "password=demo123456" > /tmp/login.json && python3 -c "import json; t=json.load(open(\"/tmp/login.json\")).get(\"access_token\",\"\"); print(\"TOKEN_LEN:\",len(t)); open(\"/tmp/token.txt\",\"w\").write(t); d=json.load(open(\"/tmp/login.json\")); print(\"user:\",d.get(\"user_info\",{}).get(\"username\"),\"org_id:\",d.get(\"user_info\",{}).get(\"org_id\"))"'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== /api/v1/org/50/overview with token ===" -ForegroundColor Green
$cmd = 'TOKEN=$(cat /tmp/token.txt); curl -s -o /tmp/r1.json -w "HTTP:%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://jigou.matux.tech/api/v1/org/50/overview; cat /tmp/r1.json | head -c 500; echo ""'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== /api/v1/org/50/dashboard with token ===" -ForegroundColor Green
$cmd = 'TOKEN=$(cat /tmp/token.txt); curl -s -o /tmp/r2.json -w "HTTP:%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://jigou.matux.tech/api/v1/org/50/dashboard; cat /tmp/r2.json | head -c 500; echo ""'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Test without Authorization header ===" -ForegroundColor Green
$cmd = 'curl -s -o /tmp/r3.json -w "HTTP:%{http_code}\n" https://jigou.matux.tech/api/v1/org/50/overview; cat /tmp/r3.json'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== OpenAPI for /api/v1/org/{org_id}/overview ===" -ForegroundColor Green
$cmd = 'curl -s http://127.0.0.1:8000/openapi.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(p, list(d[\"paths\"][p].keys())) for p in d[\"paths\"] if \"org\" in p and \"overview\" in p]"'
iex "$SSH '$cmd'" 2>&1