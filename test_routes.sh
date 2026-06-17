#!/bin/bash
# Test org-scoped routes with token
set -e
TOKEN=$(cat /tmp/token.txt)
echo "TOKEN_LEN=${#TOKEN}"
echo "--- org/1/metrics ---"
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/educational_institution/org/1/metrics
echo "--- org/1/dashboard ---"
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/educational_institution/org/1/dashboard
echo "--- org/1/overview ---"
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/educational_institution/org/1/overview
echo "--- org/1/dashboard FULL ---"
curl -s -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/educational_institution/org/1/dashboard | head -c 600
echo ""
echo "--- /api/v1/educational_institution/dashboard (no org prefix) ---"
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/educational_institution/dashboard
echo "--- /api/v1/org/1/overview ---"
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Authorization: Bearer ${TOKEN}" https://jigou.matux.tech/api/v1/org/1/overview