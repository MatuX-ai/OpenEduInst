#!/bin/bash
echo "==== List all containers ===="
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

echo ""
echo "==== nginx container volumes ===="
sudo docker inspect openmt-nginx --format '{{json .Mounts}}' 2>/dev/null | python3 -m json.tool 2>/dev/null || sudo docker inspect openmt-nginx --format '{{json .Mounts}}'

echo ""
echo "==== nginx container main.*.js in /usr/share/nginx/html ===="
sudo docker exec openmt-nginx ls -la /usr/share/nginx/html/ 2>&1 | head -20

echo ""
echo "==== check /var/www/openmt ===="
sudo docker exec openmt-nginx ls -la /var/www/openmt/ 2>&1 | head -20

echo ""
echo "==== nginx config location ===="
sudo docker exec openmt-nginx cat /etc/nginx/nginx.conf 2>&1 | head -30
