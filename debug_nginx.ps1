$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

Write-Host "=== Inspect mounts ===" -ForegroundColor Green
$cmd = 'sudo docker inspect openmt-nginx --format "{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}"'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== List nginx html directory ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx ls -la /usr/share/nginx/html/ 2>&1 | head -30'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Find main.js in container ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx find /usr/share/nginx -name "main.*.js" 2>&1'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Nginx config ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx cat /etc/nginx/nginx.conf 2>&1 | head -40'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Direct curl nginx container ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx curl -s http://127.0.0.1/ 2>&1 | grep -oE "main\.[a-f0-9]+\.js" | head -3'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Test public URL with full HTML ===" -ForegroundColor Green
$cmd = 'curl -sL https://jigou.matux.tech/ 2>&1 | head -50'
iex "$SSH '$cmd'" 2>&1