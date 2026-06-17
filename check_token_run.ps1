$ErrorActionPreference = 'Continue'
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

scp -i $SSH_KEY -o StrictHostKeyChecking=no g:\OpenMTEduInst\check_token.py ubuntu@43.156.248.107:/tmp/check_token.py
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "python3 /tmp/check_token.py" 2>&1