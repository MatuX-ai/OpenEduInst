#!/bin/bash
set -e
echo "==== Find nginx container ===="
CONTAINER=$(sudo docker ps --filter 'ancestor=nginx' --format '{{.Names}}' | head -1)
if [ -z "$CONTAINER" ]; then
    CONTAINER=$(sudo docker ps --format '{{.Names}}' | grep -i nginx | head -1)
fi
echo "NGINX_CONTAINER=$CONTAINER"

echo "==== Check main.*.js inside container ===="
sudo docker exec "$CONTAINER" ls /usr/share/nginx/html/main.*.js 2>/dev/null || true

echo "==== Restart nginx ===="
sudo docker restart "$CONTAINER"

echo "==== Wait for nginx up ===="
sleep 4
sudo docker ps --filter "name=$CONTAINER" --format 'table {{.Names}}\t{{.Status}}'
