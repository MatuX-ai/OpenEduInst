"""Verify @use lines in modified files"""
import os

FILES = [
    r"g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\dashboard-overview\training-dashboard-v2.component.ts",
    r"g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\data-analytics\data-analytics-dashboard.component.ts",
    r"g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\dashboard-overview\training-dashboard.component.ts",
    r"g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\dashboard-overview\k12-dashboard.component.ts",
]
for f in FILES:
    print(f"=== {os.path.basename(f)} ===")
    with open(f, "rb") as fp:
        data = fp.read()
    text = data.decode("utf-8", errors="replace")
    for i, line in enumerate(text.split("\n")[:15], 1):
        print(f"  L{i}: {line[:120]}")
    print()
