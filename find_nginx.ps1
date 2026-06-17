$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$SSH = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no ubuntu@43.156.248.107"

# Find nginx container
Write-Host "=== Finding nginx container ===" -ForegroundColor Green
$cmd = 'sudo docker ps --format "{{.Names}} {{.Image}}" > /tmp/dockers.txt; cat /tmp/dockers.txt'
iex "$SSH '$cmd'" 2>&1

# Get the actual main hash from deployed files
Write-Host "=== Deployed files ===" -ForegroundColor Green
$cmd = 'ls /opt/openmt/backend/deploy/frontend/main.*.js 2>&1'
iex "$SSH '$cmd'" 2>&1

# Find nginx container name from list
$cmd = 'NGINX_NAME=$(sudo docker ps --format "{{.Names}}" | grep -i nginx | head -1); echo "NGINX=$NGINX_NAME"'
iex "$SSH '$cmd'" 2>&1