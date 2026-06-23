@echo off
echo ============================================
echo   OpenMT 营销站点 - 远程部署脚本
echo ============================================
echo.
echo 1. 先配置 SSH 密钥（首次需要）
echo    ssh-copy-id root@43.156.248.107
echo.
echo 2. 一键部署命令：
echo    ssh root@43.156.248.107 "cd /opt/openmt ^&^& git pull origin feature/marketing-site-docker ^&^& cd backend ^&^& docker compose -f docker-compose.lite.yml up -d --build marketing ^&^& docker compose -f docker-compose.lite.yml restart nginx"
echo.
echo ============================================
echo 分步执行：
echo   步骤1 登录:  ssh root@43.156.248.107
echo   步骤2 拉取:  cd /opt/openmt ^&^& git pull origin feature/marketing-site-docker
echo   步骤3 构建:  cd backend ^&^& docker compose -f docker-compose.lite.yml up -d --build marketing
echo   步骤4 重启:  docker compose -f docker-compose.lite.yml restart nginx
echo ============================================
pause
