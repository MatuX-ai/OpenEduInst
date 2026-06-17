#!/bin/bash
set -e
echo "=== Backend Deploy $(date) ==="

echo "--- 1. docker cp into container ---"
sudo docker cp /tmp/main.py openmt-api:/app/main.py
sudo docker cp /tmp/edu_routes.py openmt-api:/app/routes/educational_institution_routes.py
sudo docker cp /tmp/org_overview_routes.py openmt-api:/app/routes/org_overview_routes.py
sudo docker cp /tmp/tenant_routes.py openmt-api:/app/routes/tenant_routes.py

echo "--- 2. persist to disk ---"
sudo cp /tmp/main.py /opt/openmt/backend/main.py
sudo cp /tmp/edu_routes.py /opt/openmt/backend/routes/educational_institution_routes.py
sudo cp /tmp/org_overview_routes.py /opt/openmt/backend/routes/org_overview_routes.py
sudo cp /tmp/tenant_routes.py /opt/openmt/backend/routes/tenant_routes.py

echo "--- 3. restart API ---"
sudo docker restart openmt-api

echo "--- 4. wait for startup ---"
sleep 10

echo "--- 5. health check ---"
curl -s -o /dev/null -w "API health: HTTP %{http_code}\n" http://127.0.0.1:8000/health

echo "--- 6. openapi check ---"
curl -s -o /dev/null -w "OpenAPI: HTTP %{http_code}\n" http://127.0.0.1:8000/openapi.json

echo "=== Backend Deploy DONE ==="
