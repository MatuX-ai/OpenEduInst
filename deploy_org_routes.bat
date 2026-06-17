@echo off
echo === STEP 1: SCP files to server ===
scp -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no "g:\OpenMTEduInst\backend\routes\educational_institution_routes.py" ubuntu@43.156.248.107:/tmp/edu_routes_new.py
echo edu_routes uploaded
scp -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no "g:\OpenMTEduInst\backend\main.py" ubuntu@43.156.248.107:/tmp/main_new.py
echo main.py uploaded
echo === STEP 2: Deploy via docker cp + restart ===
ssh -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "docker cp /tmp/edu_routes_new.py openmt-api:/app/routes/educational_institution_routes.py && docker cp /tmp/main_new.py openmt-api:/app/main.py && docker restart openmt-api && echo DEPLOY_DONE"
echo === STEP 3: Wait 12s for restart ===
timeout /t 12 /nobreak
echo === STEP 4: Check health ===
ssh -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s -o /dev/null -w 'HEALTH:%%{http_code}\n' http://127.0.0.1:8000/health"
echo === STEP 5: List org-scoped routes from OpenAPI ===
ssh -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s http://127.0.0.1:8000/openapi.json > /tmp/oa.json && python3 -c \"import json; d=json.load(open('/tmp/oa.json')); paths=[p for p in d.get('paths',{}).keys() if 'educational_institution/org' in p]; print(len(paths), 'org-scoped routes'); [print(p) for p in sorted(paths)]\""
echo === STEP 6: Login + test endpoints ===
ssh -i "%USERPROFILE%\.ssh\id_rsa" -o StrictHostKeyChecking=no ubuntu@43.156.248.107 "curl -s -X POST https://jigou.matux.tech/api/v1/auth/token -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'username=zhao_admin' --data-urlencode 'password=demo123456' > /tmp/login.json && python3 -c \"import json; t=json.load(open('/tmp/login.json')).get('access_token',''); print('TOKEN_LEN:',len(t)); open('/tmp/token.txt','w').write(t)\" && TOKEN=$(cat /tmp/token.txt) && curl -s -o /dev/null -w 'org/1/metrics:%%{http_code}\n' -H \"Authorization: Bearer $TOKEN\" https://jigou.matux.tech/api/v1/educational_institution/org/1/metrics && curl -s -o /dev/null -w 'org/1/dashboard:%%{http_code}\n' -H \"Authorization: Bearer $TOKEN\" https://jigou.matux.tech/api/v1/educational_institution/org/1/dashboard && curl -s -o /dev/null -w 'org/1/overview:%%{http_code}\n' -H \"Authorization: Bearer $TOKEN\" https://jigou.matux.tech/api/v1/educational_institution/org/1/overview"
echo === ALL DONE ===