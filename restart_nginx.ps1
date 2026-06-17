$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

Write-Host "=== Check nginx mount ===" -ForegroundColor Green
$cmd = 'sudo docker inspect openmt-nginx --format "{{json .Mounts}}" | head -200'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Verify new file is inside nginx container ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx ls /usr/share/nginx/html/main.*.js 2>&1'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Restart nginx ===" -ForegroundColor Green
$cmd = 'sudo docker restart openmt-nginx && sleep 3 && echo "RESTARTED"'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Check served hash ===" -ForegroundColor Green
Start-Sleep -Seconds 2
$cmd = 'curl -s https://jigou.matux.tech/ 2>&1 | grep -oE "main\.[a-f0-9]+\.js" | head -3'
iex "$SSH '$cmd'" 2>&1