# -*- coding: utf-8 -*-
"""
OpenMTSciEd 集成 M4 端到端验收脚本

覆盖场景：
1. 登录并获取 org_id
2. GET /opensciedu/config — 集成配置
3. GET /opensciedu/health — 上游连通性
4. GET /opensciedu/stats — 资源统计
5. GET /opensciedu/tutorials — 教程列表
6. GET /opensciedu/recommendations — 知识图谱推荐（只读）
7. POST /opensciedu/sync — 手动同步（管理员）
8. 内联 Celery 同步任务 smoke（可选）

环境变量：
  BASE          默认 http://localhost:8000
  USERNAME      默认 admin
  PASSWORD      默认 admin123
  SKIP_SYNC     设为 1 跳过 POST /sync 与 Celery inline

运行：
  python scripts/acceptance_opensciedu.py
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

BASE = os.getenv("BASE", "http://localhost:8000")
USERNAME = os.getenv("USERNAME", "admin")
PASSWORD = os.getenv("PASSWORD", "admin123")
SKIP_SYNC = os.getenv("SKIP_SYNC", "0").lower() in ("1", "true", "yes")

OUT_DIR = Path(__file__).parent.parent / "reports" / "acceptance_opensciedu"
OUT_DIR.mkdir(parents=True, exist_ok=True)

results: list[tuple[str, bool, str]] = []


def call(method, path, token=None, data=None, json_body=None, timeout=45):
    import urllib.error
    import urllib.parse
    import urllib.request

    url = f"{BASE.rstrip('/')}{path}"
    headers = {"Accept": "application/json"}
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is not None:
        body = urllib.parse.urlencode(data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8")
            try:
                return r.status, json.loads(raw)
            except json.JSONDecodeError:
                return r.status, {"_raw": raw[:500]}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"_raw": body_text[:500]}


def record(name: str, ok: bool, detail: str) -> None:
    results.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}: {detail}")


def get_org_id(obj):
    if isinstance(obj, dict):
        if "org_id" in obj:
            return obj["org_id"]
        for v in obj.values():
            r = get_org_id(v)
            if r is not None:
                return r
    elif isinstance(obj, list):
        for x in obj:
            r = get_org_id(x)
            if r is not None:
                return r
    return None


def main() -> int:
    print("=" * 60)
    print("OpenMTSciEd M4 验收")
    print("=" * 60)

    # 0. 登录
    print("\n--- 0. 登录 ---")
    status, login = call(
        "POST",
        "/api/v1/auth/token",
        data={"username": USERNAME, "password": PASSWORD},
    )
    if status != 200:
        record("登录", False, f"HTTP {status} {login}")
        _summary()
        return 1
    token = login.get("access_token")
    record("登录", bool(token), f"HTTP {status}, token len={len(token or '')}")

    status, me = call("GET", "/api/v1/auth/me", token=token)
    org_id = get_org_id(me)
    record("获取 org_id", org_id is not None, f"org_id={org_id}")
    if org_id is None:
        _summary()
        return 1
    (OUT_DIR / "me.json").write_text(json.dumps(me, ensure_ascii=False, indent=2), encoding="utf-8")

    # 1. config
    print("\n--- 1. 集成配置 ---")
    status, cfg = call("GET", "/api/v1/opensciedu/config", token=token)
    enabled = cfg.get("enabled") if isinstance(cfg, dict) else False
    ok = status in (200, 403)
    record("GET /opensciedu/config", ok, f"HTTP {status}, enabled={enabled}")
    if status == 200:
        (OUT_DIR / "config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    integration_on = status == 200 and enabled

    # 2. health
    print("\n--- 2. 连通性 ---")
    status, health = call("GET", "/api/v1/opensciedu/health", token=token)
    connected = health.get("connected") if isinstance(health, dict) else None
    ok = status in (200, 403, 502)
    record("GET /opensciedu/health", ok, f"HTTP {status}, connected={connected}")

    if not integration_on:
        print("\n  集成未启用（403 或 enabled=false），跳过后续资源接口")
        _summary()
        return 0 if all(r[1] for r in results) else 1

    # 3. stats
    print("\n--- 3. 资源统计 ---")
    status, stats = call("GET", "/api/v1/opensciedu/stats", token=token)
    ok = status in (200, 502)
    detail = f"HTTP {status}"
    if status == 200 and isinstance(stats, dict):
        detail += f", tutorials={stats.get('tutorials')}, coursewares={stats.get('coursewares')}"
        (OUT_DIR / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    record("GET /opensciedu/stats", ok, detail)

    # 4. tutorials
    print("\n--- 4. 教程列表 ---")
    status, tutorials = call("GET", "/api/v1/opensciedu/tutorials?page=1&size=5", token=token)
    ok = status in (200, 502)
    total = tutorials.get("total") if isinstance(tutorials, dict) else "?"
    record("GET /opensciedu/tutorials", ok, f"HTTP {status}, total={total}")

    # 5. recommendations
    print("\n--- 5. 知识图谱推荐 ---")
    status, recs = call("GET", "/api/v1/opensciedu/recommendations?limit=5", token=token)
    ok = status in (200, 502)
    count = len(recs) if isinstance(recs, list) else len(recs.get("items", [])) if isinstance(recs, dict) else "?"
    record("GET /opensciedu/recommendations", ok, f"HTTP {status}, count={count}")

    # 5b. unified search
    print("\n--- 5b. 统一检索 ---")
    status, search = call("GET", "/api/v1/opensciedu/search?q=robot&limit=5", token=token)
    ok = status in (200, 502)
    total = search.get("total") if isinstance(search, dict) else "?"
    record("GET /opensciedu/search", ok, f"HTTP {status}, total={total}")

    # 5c. topic studio links
    print("\n--- 5c. 课题工作室深链 ---")
    status, ts_links = call("GET", "/api/v1/opensciedu/topic-studio/links", token=token)
    ok = status == 200 and isinstance(ts_links, dict) and "list_url" in ts_links
    record("GET /opensciedu/topic-studio/links", ok, f"HTTP {status}, url={ts_links.get('list_url') if isinstance(ts_links, dict) else '?'}")

    # 6. manual sync
    if not SKIP_SYNC:
        print("\n--- 6. 手动同步 ---")
        status, sync = call("POST", "/api/v1/opensciedu/sync", token=token)
        ok = status in (200, 403, 502)
        sync_status = sync.get("status") if isinstance(sync, dict) else "?"
        record("POST /opensciedu/sync", ok, f"HTTP {status}, status={sync_status}")

        print("\n--- 7. Celery inline sync smoke ---")
        backend_dir = Path(__file__).parent.parent / "backend"
        try:
            proc = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "tasks.celery_app",
                    "run_inline",
                    "tasks.opensciedu_sync_tasks.run_opensciedu_sync_all",
                ],
                cwd=str(backend_dir),
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
            inline_ok = proc.returncode == 0
            record(
                "Celery inline run_opensciedu_sync_all",
                inline_ok,
                f"exit={proc.returncode}",
            )
        except Exception as exc:
            record("Celery inline run_opensciedu_sync_all", False, str(exc))
    else:
        print("\n  SKIP_SYNC=1，跳过同步相关用例")

    _summary()
    failed = [r for r in results if not r[1]]
    report = {
        "base": BASE,
        "org_id": org_id,
        "integration_enabled": integration_on,
        "results": [{"name": n, "ok": ok, "detail": d} for n, ok, d in results],
    }
    (OUT_DIR / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return 1 if failed else 0


def _summary() -> None:
    print("\n" + "=" * 60)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"合计: {passed}/{len(results)} 通过")
    print(f"报告目录: {OUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    raise SystemExit(main())
