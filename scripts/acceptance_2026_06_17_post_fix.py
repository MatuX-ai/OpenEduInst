# -*- coding: utf-8 -*-
"""
Post-fix 验收脚本 - 2026-06-17 P0 修复后验证
==============================================
整合 acceptance_2026_06_17.py / _dist.py / _degraded.py 三个脚本。
聚焦 5 个 P0 修复验证 + 全量路由回归 + dist 静态校验 + 基准对比。

用法:
    python scripts/acceptance_2026_06_17_post_fix.py

退出码:
    0 = PASS (全部通过)
    1 = FAIL (存在失败项)
"""
import sys
import os

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import urllib.request
import urllib.parse
import urllib.error
import json
import re
from pathlib import Path
from datetime import datetime

# ==================== 常量 ====================
OUT_DIR = Path(r"g:\OpenMTEduInst\reports\acceptance_2026_06_17_post_fix")
REF_DIR = Path(r"g:\OpenMTEduInst\reports\acceptance_2026_06_17")
BASE = "https://jigou.matux.tech"
LOG_FILE = OUT_DIR / "acceptance_post_fix.log"
REPORT_FILE = OUT_DIR / "ACCEPTANCE_REPORT_POSTFIX.md"

# 已知基准 hash（上次验收记录）
REF_MAIN_HASH = "818029bea5bd6c2b"

# ==================== 工具函数 ====================


def call(method, path, token=None, data=None, json_body=None):
    """HTTP 请求封装，返回 (status_code, body_dict)"""
    url = f"{BASE}{path}"
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
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"_raw": body_text[:500]}
    except Exception as e:
        return 0, {"_error": str(e)}


def fetch_raw(path, headers=None, timeout=60):
    """原始 HTTP GET，返回 (status_code, body_bytes, headers_dict)"""
    url = f"{BASE}{path}"
    req = urllib.request.Request(
        url, headers=headers or {"Cache-Control": "no-cache", "Pragma": "no-cache"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), dict(r.getheaders())
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers.items())


def log(msg):
    """同时写日志文件 + 控制台"""
    print(msg)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def save_json(filename, data):
    """保存 JSON 响应到输出目录"""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / filename).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def load_ref_json(filename):
    """加载基准 JSON 数据"""
    ref_path = REF_DIR / filename
    if ref_path.exists():
        try:
            return json.loads(ref_path.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def compare_with_ref(new_data, ref_data):
    """与基准数据对比，返回差异摘要"""
    if ref_data is None:
        return {"match": None, "note": "无基准数据可对比"}
    new_flat = json.dumps(new_data, ensure_ascii=False, sort_keys=True)
    ref_flat = json.dumps(ref_data, ensure_ascii=False, sort_keys=True)
    if new_flat == ref_flat:
        return {"match": True, "note": "完全一致"}

    # 对比 key 层级
    new_keys = set()
    ref_keys = set()
    if isinstance(new_data, dict):
        new_keys = set(new_data.keys())
    if isinstance(ref_data, dict):
        ref_keys = set(ref_data.keys())
    return {
        "match": False,
        "new_keys": sorted(new_keys - ref_keys),
        "removed_keys": sorted(ref_keys - new_keys),
        "common_keys": sorted(new_keys & ref_keys),
        "note": "数据有变化（可能是修复导致的正常变化）",
    }


# ==================== 结果收集 ====================
results = {
    "p0": [],  # [(label, pass_bool, detail)]
    "regression": [],  # [(label, pass_bool, detail)]
    "cross_tenant": [],  # [(label, pass_bool, detail)]
    "dist": [],  # [(label, pass_bool, detail)]
}


# ==================== 模块 1: 登录 ====================
def module_login():
    log("\n" + "=" * 60)
    log("模块 1: 登录 + Token 获取")
    log("=" * 60)

    status, login = call(
        "POST",
        "/api/v1/auth/token",
        data={"username": "zhao_admin", "password": "demo123456"},
    )
    log(f"  POST /api/v1/auth/token -> HTTP {status}")
    if status != 200:
        log(f"  ✗ 登录失败: {json.dumps(login, ensure_ascii=False)[:200]}")
        return None, None
    token = login["access_token"]
    log(f"  access_token len={len(token)}")
    save_json("login.json", login)

    status, me = call("GET", "/api/v1/auth/me", token=token)
    log(f"  GET /api/v1/auth/me -> HTTP {status}")
    log(f"  body: {json.dumps(me, ensure_ascii=False)[:300]}")
    save_json("me.json", me)

    org_id = me.get("org_id")
    log(f"  org_id = {org_id}")
    if org_id is None:
        log("  ✗ 拿不到 org_id")
        return None, None

    return token, org_id


# ==================== 模块 2: P0 核心验证 ====================
def module_p0_checks(token, org_id):
    log("\n" + "=" * 60)
    log("模块 2: P0 五项核心验证")
    log("=" * 60)

    p0_tests = [
        {
            "id": "P0-1",
            "label": "跨租户安全校验 (org_id=99999)",
            "method": "GET",
            "path": "/api/v1/educational_institution/org/99999/overview",
            "expect_status": [403, 404, 400],  # 修复后应拒绝
            "forbidden": True,
            "ref_note": "修复前: HTTP 200 返回跨租户数据（严重安全漏洞）",
        },
        {
            "id": "P0-2",
            "label": "students 路由 500 修复",
            "method": "GET",
            "path": f"/api/v1/educational_institution/org/{org_id}/students",
            "expect_status": [200],
            "forbidden": False,
            "expect_keys_in_data": ["items", "total"],
            "ref_note": "修复前: HTTP 500 Internal Server Error",
        },
        {
            "id": "P0-3",
            "label": "teachers 路由 500 修复",
            "method": "GET",
            "path": f"/api/v1/educational_institution/org/{org_id}/teachers",
            "expect_status": [200],
            "forbidden": False,
            "expect_keys_in_data": ["items", "total"],
            "ref_note": "修复前: HTTP 500 Internal Server Error",
        },
        {
            "id": "P0-4",
            "label": "enrollment/stats 路由 500 修复",
            "method": "GET",
            "path": f"/api/v1/educational_institution/org/{org_id}/enrollment/stats",
            "expect_status": [200],
            "forbidden": False,
            "ref_note": "修复前: HTTP 500 (Enrollment.is_active 字段不存在)",
        },
        {
            "id": "P0-5",
            "label": "licenses/statistics 路由 500 修复",
            "method": "GET",
            "path": f"/api/v1/org/{org_id}/licenses/statistics",
            "expect_status": [200],
            "forbidden": False,
            "expect_keys": ["total_licenses", "active_licenses", "expired_licenses"],
            "ref_note": "修复前: HTTP 500 (License.org_id 字段不存在，应为 organization_id)",
        },
    ]

    for test in p0_tests:
        log(f"\n  --- {test['id']}: {test['label']} ---")
        log(f"  {test['ref_note']}")
        status, body = call(test["method"], test["path"], token=token)
        log(f"  {test['method']} {test['path']} -> HTTP {status}")

        passed = False
        detail = ""

        if test["forbidden"]:
            # 跨租户：期望 400/403/404
            if status in test["expect_status"]:
                passed = True
                detail = f"✓ 正确拒绝 (HTTP {status})"
            else:
                detail = f"✗ 未拒绝! HTTP {status} (期望 {test['expect_status']})"
                if status == 200:
                    detail += f" 数据: {json.dumps(body, ensure_ascii=False)[:150]}"
        else:
            # 正常路由：期望 200
            if status in test["expect_status"]:
                # 进一步检查响应结构
                struct_ok = True
                if "expect_keys_in_data" in test:
                    data = body.get("data", {})
                    for k in test["expect_keys_in_data"]:
                        if k not in data:
                            struct_ok = False
                            detail += f" 缺少 data.{k};"
                if "expect_keys" in test:
                    for k in test["expect_keys"]:
                        if k not in body:
                            struct_ok = False
                            detail += f" 缺少 {k};"
                if struct_ok:
                    passed = True
                    detail = f"✓ HTTP {status}, 结构正确"
                else:
                    detail = f"⚠ HTTP {status}, 但结构异常:{detail}"
            else:
                body_snippet = json.dumps(body, ensure_ascii=False)[:150]
                detail = f"✗ HTTP {status} (期望 {test['expect_status']}), body: {body_snippet}"

        mark = "PASS" if passed else "FAIL"
        log(f"  [{mark}] {detail}")
        results["p0"].append((test["id"], test["label"], passed, detail))
        save_json(
            f"p0_{test['id'].lower().replace('-', '_')}.json",
            {"status": status, "body": body},
        )


# ==================== 模块 3: 全量路由回归 ====================
def module_regression(token, org_id):
    log("\n" + "=" * 60)
    log("模块 3: 全量路由回归")
    log("=" * 60)

    # 3.1 org_scoped_router 8 路由
    log("\n  --- 3.1 org_scoped_router 8 路由 ---")
    scoped_endpoints = [
        (f"/api/v1/educational_institution/org/{org_id}/overview", "scoped_overview"),
        (f"/api/v1/educational_institution/org/{org_id}/metrics", "scoped_metrics"),
        (f"/api/v1/educational_institution/org/{org_id}/courses", "scoped_courses"),
        (f"/api/v1/educational_institution/org/{org_id}/course/stats", "scoped_course_stats"),
        (f"/api/v1/educational_institution/org/{org_id}/teachers", "scoped_teachers"),
        (f"/api/v1/educational_institution/org/{org_id}/students", "scoped_students"),
        (f"/api/v1/educational_institution/org/{org_id}/enrollment/stats", "scoped_enrollment"),
        (f"/api/v1/educational_institution/org/{org_id}/dashboard", "scoped_dashboard"),
    ]
    for path, label in scoped_endpoints:
        status, body = call("GET", path, token=token)
        passed = status == 200
        mark = "✓" if passed else "✗"
        log(f"  {mark} GET {path} -> HTTP {status}")
        results["regression"].append((label, passed, f"HTTP {status}"))
        save_json(f"reg_{label}.json", body)

    # 3.2 org_overview_routes 4 路由
    log("\n  --- 3.2 org_overview_routes 4 路由 ---")
    overview_endpoints = [
        ("/api/v1/org/overview", "org_overview"),
        (f"/api/v1/org/{org_id}/overview", "org_overview_scoped"),
        (f"/api/v1/org/{org_id}/dashboard", "org_dashboard"),
        (f"/api/v1/org/{org_id}/licenses/statistics", "org_licenses_stats"),
    ]
    for path, label in overview_endpoints:
        status, body = call("GET", path, token=token)
        passed = status == 200
        mark = "✓" if passed else "✗"
        log(f"  {mark} GET {path} -> HTTP {status}")
        results["regression"].append((label, passed, f"HTTP {status}"))
        save_json(f"reg_{label}.json", body)

    # 3.3 tenant 路径变体 4 路由
    log("\n  --- 3.3 tenant 路径变体 4 路由 ---")
    tenant_endpoints = [
        ("/api/v1/tenant/menu", "tenant_menu"),
        (f"/api/v1/tenant/menu/{org_id}", "tenant_menu_scoped"),
        ("/api/v1/tenant/config", "tenant_config"),
        (f"/api/v1/tenant/config/{org_id}", "tenant_config_scoped"),
    ]
    for path, label in tenant_endpoints:
        status, body = call("GET", path, token=token)
        passed = status == 200
        mark = "✓" if passed else "✗"
        log(f"  {mark} GET {path} -> HTTP {status}")
        results["regression"].append((label, passed, f"HTTP {status}"))
        save_json(f"reg_{label}.json", body)


# ==================== 模块 4: 跨租户完整校验 ====================
def module_cross_tenant(token, org_id):
    log("\n" + "=" * 60)
    log("模块 4: 跨租户完整校验 (org_id=99999)")
    log("=" * 60)

    cross_tests = [
        ("/api/v1/educational_institution/org/99999/overview", "cross_ei_overview"),
        ("/api/v1/educational_institution/org/99999/students", "cross_ei_students"),
        ("/api/v1/educational_institution/org/99999/teachers", "cross_ei_teachers"),
        ("/api/v1/educational_institution/org/99999/dashboard", "cross_ei_dashboard"),
        ("/api/v1/org/99999/overview", "cross_org_overview"),
        ("/api/v1/tenant/menu/99999", "cross_tenant_menu"),
        ("/api/v1/tenant/config/99999", "cross_tenant_config"),
    ]

    for path, label in cross_tests:
        status, body = call("GET", path, token=token)
        # 期望 400/403/404 — 任何 200 都是安全漏洞
        passed = status in (400, 403, 404)
        mark = "✓" if passed else "✗"
        detail = f"HTTP {status}"
        if status == 200:
            detail += " ⚠ 安全漏洞! 返回了非授权数据"
        log(f"  {mark} GET {path} -> {detail}")
        results["cross_tenant"].append((label, passed, detail))
        save_json(f"cross_{label}.json", {"status": status, "body": body})


# ==================== 模块 5: dist 静态校验 ====================
def module_dist_check():
    log("\n" + "=" * 60)
    log("模块 5: dist 静态校验")
    log("=" * 60)

    # 5.1 fetch index.html
    log("\n  --- 5.1 index.html ---")
    status, body, headers = fetch_raw("/app/")
    log(f"  GET /app/ -> HTTP {status}, body_len={len(body)}")
    index_html = body.decode("utf-8", errors="replace")
    save_json("dist_index_size.json", {"status": status, "size": len(body)})

    # 5.2 解析 chunk hash
    mains = re.findall(r"main\.([a-f0-9]+)\.js", index_html)
    runtimes = re.findall(r"runtime\.([a-f0-9]+)\.js", index_html)
    polyfills = re.findall(r"polyfills\.([a-f0-9]+)\.js", index_html)
    styles = re.findall(r"styles\.([a-f0-9]+)\.css", index_html)

    main_hash = mains[0] if mains else "N/A"
    log(f"  main hash: {main_hash}")
    log(f"  runtime hash: {runtimes[0] if runtimes else 'N/A'}")
    log(f"  polyfills hash: {polyfills[0] if polyfills else 'N/A'}")
    log(f"  styles hash: {styles[0] if styles else 'N/A'}")
    log(f"  基准 main hash: {REF_MAIN_HASH}")
    hash_changed = main_hash != REF_MAIN_HASH and main_hash != "N/A"
    log(f"  hash 变化: {'是 (新部署)' if hash_changed else '否 (未更新)'}")

    # 5.3 4 个 chunk HEAD 200
    log("\n  --- 5.3 chunk 可达性 ---")
    chunks = []
    if mains:
        chunks.append(("main", f"/app/main.{mains[0]}.js"))
    if runtimes:
        chunks.append(("runtime", f"/app/runtime.{runtimes[0]}.js"))
    if polyfills:
        chunks.append(("polyfills", f"/app/polyfills.{polyfills[0]}.js"))
    if styles:
        chunks.append(("styles", f"/app/styles.{styles[0]}.css"))

    all_chunks_ok = True
    chunks_ok_count = 0
    for name, path in chunks:
        s, b, h = fetch_raw(path, headers={"Cache-Control": "no-cache"})
        ok = s == 200
        if ok:
            chunks_ok_count += 1
        else:
            all_chunks_ok = False
        log(f"  {'✓' if ok else '✗'} {name:10s} {path:55s} HTTP {s} size={len(b)}")
    results["dist"].append(("4_chunks_200", all_chunks_ok, f"{chunks_ok_count}/{len(chunks)} 可达"))

    # 5.4 SCSS 路径残留
    log("\n  --- 5.4 SCSS 路径残留检查 ---")
    if mains:
        main_path = f"/app/main.{mains[0]}.js"
        s, b, h = fetch_raw(main_path)
        main_js = b.decode("utf-8", errors="replace")
        bad_patterns = [
            "'../../../styles/design-tokens'",
            "'../../../styles/shared/mixins'",
            '"../../../styles/design-tokens"',
            '"../../../styles/shared/mixins"',
        ]
        scss_ok = True
        for p in bad_patterns:
            cnt = main_js.count(p)
            if cnt > 0:
                scss_ok = False
            log(f"  {'✗ 残留' if cnt > 0 else '✓ 已清理'}: {p} (count={cnt})")
        results["dist"].append(("scss_no_residual", scss_ok, "SCSS 相对路径无残留"))

        # 关键组件存在性
        log("\n  --- 5.5 关键组件存在性 ---")
        key_checks = [
            ("InstitutionDashboardComponent", "InstitutionDashboardComponent"),
            ("tenant/menu", "tenant/menu"),
            ("licenses/statistics", "licenses/statistics"),
        ]
        for label, pat in key_checks:
            cnt = main_js.count(pat)
            ok = cnt > 0
            log(f"  {'✓' if ok else '✗'} {label} (count={cnt})")

    # 5.6 SPA 路由可达
    log("\n  --- 5.6 SPA 路由可达性 ---")
    spa_routes = [
        "/app/login",
        "/app/admin/institution-management",
        "/app/features/stem-cloud/dashboard",
    ]
    for p in spa_routes:
        s, b, h = fetch_raw(p, headers={"Cache-Control": "no-cache"})
        body_text = b.decode("utf-8", errors="replace")
        has_app_root = "<app-root>" in body_text
        ok = s == 200 and has_app_root
        log(f"  {'✓' if ok else '✗'} GET {p} -> HTTP {s}, has <app-root>: {has_app_root}")


# ==================== 模块 6: 汇总报告 ====================
def module_report():
    log("\n" + "=" * 60)
    log("模块 6: 汇总报告")
    log("=" * 60)

    # 统计
    p0_pass = sum(1 for _, _, p, _ in results["p0"] if p)
    p0_total = len(results["p0"])
    reg_pass = sum(1 for _, p, _ in results["regression"] if p)
    reg_total = len(results["regression"])
    cross_pass = sum(1 for _, p, _ in results["cross_tenant"] if p)
    cross_total = len(results["cross_tenant"])
    dist_pass = sum(1 for _, p, _ in results["dist"] if p)
    dist_total = len(results["dist"])

    all_pass = (
        p0_pass == p0_total
        and reg_pass == reg_total
        and cross_pass == cross_total
        and dist_pass == dist_total
    )
    verdict = "PASS" if all_pass else "FAIL"

    # 控制台输出
    log(f"\n{'='*60}")
    log(f"  总判定: {'✅ ' + verdict if all_pass else '❌ ' + verdict}")
    log(f"{'='*60}")
    log(f"\n  P0 核心验证:    {p0_pass}/{p0_total} 通过")
    for pid, label, passed, detail in results["p0"]:
        log(f"    {'✓' if passed else '✗'} {pid} {label}: {detail}")

    log(f"\n  全量路由回归:  {reg_pass}/{reg_total} 通过")
    for label, passed, detail in results["regression"]:
        if not passed:
            log(f"    ✗ {label}: {detail}")

    log(f"\n  跨租户校验:    {cross_pass}/{cross_total} 通过")
    for label, passed, detail in results["cross_tenant"]:
        if not passed:
            log(f"    ✗ {label}: {detail}")

    log(f"\n  dist 静态校验: {dist_pass}/{dist_total} 通过")
    for label, passed, detail in results["dist"]:
        log(f"    {'✓' if passed else '✗'} {label}: {detail}")

    # 生成 Markdown 报告
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_lines = [
        f"# P0 修复后验收报告 - {now}",
        "",
        f"**验收环境**: {BASE}",
        f"**验收账号**: zhao_admin / demo123456 (org_id=50)",
        f"**验收时间**: {now}",
        f"**总体结论**: {'✅ **验收通过**' if all_pass else '❌ **验收不通过**'}",
        "",
        "---",
        "",
        "## P0 核心验证",
        "",
        "| # | 项目 | 结果 | 详情 |",
        "|---|------|------|------|",
    ]
    for pid, label, passed, detail in results["p0"]:
        report_lines.append(
            f"| {pid} | {label} | {'✅ PASS' if passed else '❌ FAIL'} | {detail} |"
        )

    report_lines += [
        "",
        "## 全量路由回归",
        "",
        f"通过率: {reg_pass}/{reg_total}",
        "",
    ]
    failed_regs = [(l, d) for l, p, d in results["regression"] if not p]
    if failed_regs:
        report_lines.append("| 路由 | 状态 |")
        report_lines.append("|------|------|")
        for label, detail in failed_regs:
            report_lines.append(f"| {label} | {detail} |")

    report_lines += [
        "",
        "## 跨租户校验",
        "",
        f"通过率: {cross_pass}/{cross_total}",
        "",
    ]
    failed_cross = [(l, d) for l, p, d in results["cross_tenant"] if not p]
    if failed_cross:
        report_lines.append("| 路由 | 状态 |")
        report_lines.append("|------|------|")
        for label, detail in failed_cross:
            report_lines.append(f"| {label} | {detail} |")

    report_lines += [
        "",
        "## dist 静态校验",
        "",
    ]
    for label, passed, detail in results["dist"]:
        report_lines.append(f"- {'✓' if passed else '✗'} {label}: {detail}")

    report_lines += [
        "",
        "---",
        "",
        f"详细日志: `{LOG_FILE}`",
        f"JSON 响应: `{OUT_DIR}/`",
    ]

    report_text = "\n".join(report_lines)
    REPORT_FILE.write_text(report_text, encoding="utf-8")
    log(f"\n  报告已写入: {REPORT_FILE}")

    return 0 if all_pass else 1


# ==================== 主流程 ====================
def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 清理日志
    if LOG_FILE.exists():
        LOG_FILE.unlink()

    log(f"OpenMT P0 修复后验收脚本")
    log(f"目标: {BASE}")
    log(f"输出: {OUT_DIR}")
    log(f"基准: {REF_DIR}")
    log(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 模块 1: 登录
    token, org_id = module_login()
    if token is None:
        log("\n✗ 登录失败，终止验收")
        return 1

    # 模块 2: P0 核心验证
    module_p0_checks(token, org_id)

    # 模块 3: 全量路由回归
    module_regression(token, org_id)

    # 模块 4: 跨租户完整校验
    module_cross_tenant(token, org_id)

    # 模块 5: dist 静态校验
    module_dist_check()

    # 模块 6: 汇总报告
    exit_code = module_report()

    log(f"\n验收完成。退出码: {exit_code}")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
