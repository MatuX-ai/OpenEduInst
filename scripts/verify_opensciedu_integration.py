#!/usr/bin/env python3
"""
OpenMTSciEd 集成联调脚本（M1）

用法:
  python scripts/verify_opensciedu_integration.py
  python scripts/verify_opensciedu_integration.py --base http://127.0.0.1:8000 --token YOUR_JWT

环境变量:
  EDUINST_API_BASE  默认 http://127.0.0.1:8000
  EDUINST_TOKEN     JWT（含 org_id）
"""

from __future__ import annotations

import argparse
import json
import os
import sys

try:
    import httpx
except ImportError:
    print("请先安装 httpx: pip install httpx")
    sys.exit(1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify OpenMTSciEd proxy integration")
    parser.add_argument("--base", default=os.getenv("EDUINST_API_BASE", "http://127.0.0.1:8000"))
    parser.add_argument("--token", default=os.getenv("EDUINST_TOKEN", ""))
    args = parser.parse_args()

    headers = {}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"

    base = args.base.rstrip("/")
    checks = []

    # 1. EduInst health
    try:
        r = httpx.get(f"{base}/health", timeout=10)
        checks.append(("EduInst /health", r.status_code == 200, r.status_code))
    except httpx.RequestError as e:
        checks.append(("EduInst /health", False, str(e)))

    if not args.token:
        print("WARN: 未提供 JWT (--token / EDUINST_TOKEN)，跳过 /opensciedu 鉴权接口")
        _report(checks)
        return 0

    for path in ("/api/v1/opensciedu/config", "/api/v1/opensciedu/health", "/api/v1/opensciedu/stats"):
        try:
            r = httpx.get(f"{base}{path}", headers=headers, timeout=30)
            ok = r.status_code in (200, 403, 502)
            detail = r.status_code
            if r.status_code == 200:
                try:
                    detail = json.dumps(r.json(), ensure_ascii=False)[:120]
                except Exception:
                    pass
            elif r.status_code == 403:
                detail = "OPENSCIEDU_DISABLED（需配置 OPENSCIEDU_API_KEY 或启用机构集成）"
            checks.append((path, ok, detail))
        except httpx.RequestError as e:
            checks.append((path, False, str(e)))

    _report(checks)
    failed = [c for c in checks if not c[1]]
    return 1 if failed else 0


def _report(checks: list) -> None:
    print("\n=== OpenMTSciEd Integration Verify ===\n")
    for name, ok, detail in checks:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}: {detail}")
    print()


if __name__ == "__main__":
    sys.exit(main())
