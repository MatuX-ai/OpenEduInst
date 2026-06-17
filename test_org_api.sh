#!/bin/bash
set -e
echo "=== Login ==="
curl -s -X POST https://jigou.matux.tech/api/v1/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=zhao_admin' \
  --data-urlencode 'password=demo123456' > /tmp/login.json
cat /tmp/login.json
echo ""

TOKEN=$(python3 -c 'import json; print(json.load(open("/tmp/login.json")).get("access_token",""))')
echo "TOKEN_LEN=${#TOKEN}"

echo "=== /api/v1/org/50/overview with token ==="
curl -s -w 'HTTP:%{http_code}\n' -H "Authorization: Bearer ${TOKEN}" \
  https://jigou.matux.tech/api/v1/org/50/overview | head -c 500
echo ""

echo "=== /api/v1/org/50/dashboard with token ==="
curl -s -w 'HTTP:%{http_code}\n' -H "Authorization: Bearer ${TOKEN}" \
  https://jigou.matux.tech/api/v1/org/50/dashboard | head -c 500
echo ""

echo "=== Test without Authorization ==="
curl -s -w 'HTTP:%{http_code}\n' https://jigou.matux.tech/api/v1/org/50/overview | head -c 200
echo ""

echo "=== OpenAPI list for /api/v1/org/ paths ==="
curl -s http://127.0.0.1:8000/openapi.json | python3 -c '
import json, sys
d = json.load(sys.stdin)
for p in sorted(d["paths"]):
    if "/org/" in p:
        print(p, list(d["paths"][p].keys()))
'