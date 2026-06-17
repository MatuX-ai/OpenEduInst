#!/bin/bash
# 测试演示账号登录
RESP=$(curl -s -X POST https://jigou.matux.tech/api/v1/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=zhao_admin&password=demo123456')
echo "=== Login Response ==="
echo "$RESP" | head -c 500
echo ""
echo ""
TOKEN=$(echo "$RESP" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('access_token', 'NO_TOKEN'))" 2>/dev/null || echo "PARSE_ERR")
echo "=== Token (first 30 chars) ==="
echo "${TOKEN:0:30}..."

if [ "${TOKEN}" != "NO_TOKEN" ] && [ "${TOKEN}" != "PARSE_ERR" ]; then
  echo ""
  echo "=== Test API call: /api/v1/org/1/overview ==="
  curl -s -H "Authorization: Bearer $TOKEN" https://jigou.matux.tech/api/v1/org/1/overview | head -c 400
fi
