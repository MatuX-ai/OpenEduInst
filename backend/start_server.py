import os
os.environ["DATABASE_URL"] = "sqlite:///./openmt_acceptance.db"
os.environ["PG_SSL_DISABLE"] = "1"

import sys
sys.path.insert(0, r"G:\OpenMTEduInst\backend")

print("Importing main...")
from main import app
print("Import OK, routes count:", len(app.routes))

import uvicorn
uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
