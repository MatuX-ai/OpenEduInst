#!/bin/bash
# 部署后端代码并重启 API
set -e

echo "=== 1. 复制文件到容器 ==="
sudo docker cp /tmp/edu_routes.py openmt-api:/app/routes/educational_institution_routes.py
sudo docker cp /tmp/main.py openmt-api:/app/main.py

# 持久化到磁盘
sudo cp /tmp/edu_routes.py /opt/openmt/backend/routes/educational_institution_routes.py
sudo cp /tmp/main.py /opt/openmt/backend/main.py

echo "=== 2. 重启 API 容器 ==="
sudo docker restart openmt-api

echo "=== 3. 等待启动 ==="
sleep 8

echo "=== 4. 检查 API 健康 ==="
curl -s -o /dev/null -w "HTTP: %{http_code}\n" http://127.0.0.1:8000/health
