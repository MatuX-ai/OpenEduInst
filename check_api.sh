#!/bin/bash
# Download openapi.json and find auth/login endpoints
curl -s -o /tmp/openapi.json https://jigou.matux.tech/openapi.json
echo "=== Auth/Login endpoints ==="
grep -oE '"/api/v1/[^"]*(auth|login|token)[^"]*"' /tmp/openapi.json | sort -u
echo "=== File size ==="
ls -lh /tmp/openapi.json
