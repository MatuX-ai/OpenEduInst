import os
os.environ["DATABASE_URL"] = "sqlite:///./openmt_acceptance.db"
os.environ["PG_SSL_DISABLE"] = "1"

import sys
sys.path.insert(0, r"G:\OpenMTEduInst\backend")

mods = [
    "auth_routes", "license_routes", "student_routes",
    "leads_routes", "educational_institution_routes",
    "org_overview_routes", "tenant_routes", "schedule_routes",
    "competition_routes", "notification_routes",
    "marketing_routes", "project_routes", "space_routes",
    "hardware_routes", "token_routes", "vocational_routes",
    "parent_portal_routes", "business_routes",
    "user_organization_routes", "user_license_routes",
]

for m in mods:
    try:
        __import__("routes." + m)
        print("[OK]", m)
    except Exception as e:
        print("[FAIL]", m, "->", str(e)[:200])
