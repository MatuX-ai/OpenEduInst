# -*- coding: utf-8 -*-
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
"""任务 1.1+ 验证脚本：登录 + 调通新路由 + 跨租户测试"""
import urllib.request, urllib.parse, json
from pathlib import Path

OUT_DIR = Path(r'g:\OpenMTEduInst\reports\acceptance_2026_06_17')
OUT_DIR.mkdir(parents=True, exist_ok=True)
BASE = 'https://jigou.matux.tech'

def call(method, path, token=None, data=None, json_body=None):
    url = f'{BASE}{path}'
    headers = {'Accept': 'application/json'}
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    elif data is not None:
        body = urllib.parse.urlencode(data).encode('utf-8')
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode('utf-8', errors='replace')
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {'_raw': body_text[:500]}

# ===== 1.1 登录 =====
print('=== 1.1 登录 ===')
status, login = call('POST', '/api/v1/auth/token',
    data={'username': 'zhao_admin', 'password': 'demo123456'})
print(f'POST /auth/token -> HTTP {status}')
print(f'  keys: {list(login.keys())}')
assert status == 200, f'登录失败: {login}'
token = login['access_token']
print(f'  access_token len={len(token)}')

# 1.1b 拿 /auth/me 取 org_id
status, me = call('GET', '/api/v1/auth/me', token=token)
print(f'GET /auth/me -> HTTP {status}')
print(f'  body: {json.dumps(me, ensure_ascii=False)[:800]}')
(OUT_DIR / 'me.json').write_text(json.dumps(me, ensure_ascii=False, indent=2), encoding='utf-8')

# 从 me 拿 org_id
def get_org_id(obj):
    if isinstance(obj, dict):
        if 'org_id' in obj: return obj['org_id']
        for v in obj.values():
            r = get_org_id(v)
            if r is not None: return r
    elif isinstance(obj, list):
        for x in obj:
            r = get_org_id(x)
            if r is not None: return r
    return None

org_id = get_org_id(me)
print(f'  org_id = {org_id}')
assert org_id is not None, f'拿不到 org_id: {me}'

# ===== 1.2 验证 org_scoped_router =====
print('\n=== 1.2 验证 8 个 org_scoped_router 路由 ===')
scoped_endpoints = [
    ('GET', f'/api/v1/educational_institution/org/{org_id}/overview', ['website', 'created_at', 'updated_at', 'statistics']),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/metrics', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/courses?page=1&page_size=5', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/course/stats', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/teachers', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/students', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/enrollment/stats', None),
    ('GET', f'/api/v1/educational_institution/org/{org_id}/dashboard', ['organization', 'statistics', 'charts', 'recentActivities', 'alerts']),
]
scoped_results = []
for method, path, expected_fields in scoped_endpoints:
    p = path.split('?')[0]
    qs = path.split('?')[1] if '?' in path else None
    status, body = call(method, p, token=token, data=None)
    field_ok = True
    if status == 200 and expected_fields:
        flat = json.dumps(body, ensure_ascii=False)
        for f in expected_fields:
            if f not in flat:
                field_ok = False
                print(f'  ✗ 字段缺失: {f}')
    mark = '✓' if status == 200 and field_ok else '✗'
    print(f'  {mark} {method} {p} -> HTTP {status}')
    scoped_results.append((method, path, status, field_ok))
    (OUT_DIR / f'scoped_{p.split("/")[-2]}_{p.split("/")[-1]}.json').write_text(
        json.dumps(body, ensure_ascii=False, indent=2), encoding='utf-8')

# ===== 1.3 org_overview_routes =====
print('\n=== 1.3 org_overview_routes 4 个 ===')
overview_endpoints = [
    ('GET', '/api/v1/org/overview'),
    ('GET', f'/api/v1/org/{org_id}/overview'),
    ('GET', f'/api/v1/org/{org_id}/dashboard'),
    ('GET', f'/api/v1/org/{org_id}/licenses/statistics'),
]
for method, path in overview_endpoints:
    status, body = call(method, path, token=token)
    print(f'  {"✓" if status==200 else "✗"} {method} {path} -> HTTP {status}')
    (OUT_DIR / f'overview_{path.replace("/","_").replace("?","_")}.json').write_text(
        json.dumps(body, ensure_ascii=False, indent=2), encoding='utf-8')

# ===== 1.4 tenant 路径变体 =====
print('\n=== 1.4 tenant 路径变体 4 个 ===')
tenant_endpoints = [
    ('GET', '/api/v1/tenant/menu'),
    ('GET', f'/api/v1/tenant/menu/{org_id}'),
    ('GET', '/api/v1/tenant/config'),
    ('GET', f'/api/v1/tenant/config/{org_id}'),
]
tenant_responses = {}
for method, path in tenant_endpoints:
    status, body = call(method, path, token=token)
    short_name = path.split('/')[-1] or path.split('/')[-2]
    print(f'  {"✓" if status==200 else "✗"} {method} {path} -> HTTP {status}')
    tenant_responses[path] = (status, body)
    (OUT_DIR / f'tenant_{path.replace("/","_")}.json').write_text(
        json.dumps(body, ensure_ascii=False, indent=2), encoding='utf-8')

# 对比 menu 两个变体一致性
if tenant_responses['/api/v1/tenant/menu'][0] == 200 and tenant_responses[f'/api/v1/tenant/menu/{org_id}'][0] == 200:
    same = tenant_responses['/api/v1/tenant/menu'][1] == tenant_responses[f'/api/v1/tenant/menu/{org_id}'][1]
    print(f'  /menu vs /menu/{org_id} 一致性: {"✓ 一致" if same else "✗ 不一致"}')

# ===== 1.5 跨租户检查 =====
print('\n=== 1.5 跨租户 403/404 校验 ===')
cross_endpoints = [
    ('GET', f'/api/v1/educational_institution/org/99999/overview'),
    ('GET', '/api/v1/tenant/menu/99999'),
    ('GET', f'/api/v1/org/99999/overview'),
]
for method, path in cross_endpoints:
    status, body = call(method, path, token=token)
    expect = status in (403, 404, 400)
    mark = '✓' if expect else '✗'
    print(f'  {mark} {method} {path} -> HTTP {status} (期望 400/403/404)')

# 汇总
print('\n=== 汇总 ===')
print(f'登录态: OK, org_id={org_id}, token_len={len(token)}')
print(f'org_scoped_router 8 路由: {sum(1 for _,_,s,f in scoped_results if s==200 and f)}/8 通过')
print('详细结果已写入:', OUT_DIR)
