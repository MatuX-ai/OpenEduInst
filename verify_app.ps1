$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

Write-Host "=== List /var/www/openmt in nginx container ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx ls /var/www/openmt/ 2>&1 | head -20'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Check main.js in /var/www/openmt ===" -ForegroundColor Green
$cmd = 'sudo docker exec openmt-nginx ls /var/www/openmt/main.*.js 2>&1'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== Check /app URL works ===" -ForegroundColor Green
$cmd = 'curl -sL https://jigou.matux.tech/app 2>&1 | head -c 800'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== curl /app/main.*.js ===" -ForegroundColor Green
$cmd = 'curl -s -o /dev/null -w "HTTP:%{http_code}\n" https://jigou.matux.tech/app/main.2162b33112f162bc.js'
iex "$SSH '$cmd'" 2>&1

Write-Host "=== curl /app/index.html ===" -ForegroundColor Green
$cmd = 'curl -s https://jigou.matux.tech/app/ 2>&1 | grep -oE "main\.[a-f0-9]+\.js" | head -3'
iex "$SSH '$cmd'" 2>&1