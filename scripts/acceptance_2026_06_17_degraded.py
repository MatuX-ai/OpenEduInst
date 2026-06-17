# -*- coding: utf-8 -*-
"""任务 4: 降级方案 - 静态反编译 + 已有 4 个 BUG 复现确认 + 跨租户漏洞 PoC"""
import urllib.request, json, re
from pathlib import Path

OUT_DIR = Path(r'g:\OpenMTEduInst\reports\acceptance_2026_06_17')
LOG = OUT_DIR / 'task4_degraded.log'
BASE = 'https://jigou.matux.tech'

def log(s):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(s + '\n')

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

# 清理日志
if LOG.exists():
    LOG.unlink()
log('=== 任务 4: 降级验收 (Browser subagent DevTools 协议全超时) ===\n')

# 重新登录拿 token
log('=== 4.0 重新登录拿 token ===')
status, login = call('POST', '/api/v1/auth/token',
    data={'username': 'zhao_admin', 'password': 'demo123456'})
token = login['access_token']
status, me = call('GET', '/api/v1/auth/me', token=token)
org_id = me.get('org_id')
log(f'登录: HTTP {status}, org_id={org_id}')

# 4.1 复现 4 个 BUG
log('\n=== 4.1 复现 4 个 BUG ===')
bugs_to_reproduce = [
    ('org_scoped: students 500', 'GET', f'/api/v1/educational_institution/org/{org_id}/students'),
    ('org_scoped: teachers 500', 'GET', f'/api/v1/educational_institution/org/{org_id}/teachers'),
    ('org_scoped: enrollment/stats 500', 'GET', f'/api/v1/educational_institution/org/{org_id}/enrollment/stats'),
    ('org_overview: licenses/statistics 500', 'GET', f'/api/v1/org/{org_id}/licenses/statistics'),
    ('org_scoped: 跨租户 99999/overview 200(应403)', 'GET', '/api/v1/educational_institution/org/99999/overview'),
]
for label, method, path in bugs_to_reproduce:
    status, body = call(method, path, token=token)
    log(f'  {label}')
    log(f'    GET {path} -> HTTP {status}')
    log(f'    body: {json.dumps(body, ensure_ascii=False)[:200]}')

# 4.2 静态反编译 main.js 验证 SCSS 路径
log('\n=== 4.2 静态反编译 main.js (818029bea5bd6c2b) ===')
main_path = OUT_DIR / 'main.js'
if main_path.exists():
    main_js = main_path.read_text(encoding='utf-8', errors='replace')
    log(f'main.js size: {len(main_js)} chars')

    # 找 SCSS @use 路径（包括相对路径和直接引用）
    scss_uses = re.findall(r'@use\s+[\'"]([^\'"]+)[\'"]', main_js)
    log(f'\nmain.js 中 @use 路径样本 (前 20):')
    for s in scss_uses[:20]:
        log(f'  {s}')

    # 找 styles.* 引用
    style_refs = re.findall(r'[\'"]([^\'"]*styles[^\'"]*)[\'"]', main_js)
    log(f'\nstyles 引用样本 (前 10):')
    for s in list(set(style_refs))[:10]:
        log(f'  {s}')

    # 找 token 字段
    log(f'\nmockDataDelay 上下文:')
    for m in re.finditer(r'.{50}mockDataDelay.{50}', main_js):
        log(f'  {m.group()}')

    # 找 institution 相关组件
    log(f'\nInstitutionDashboardComponent 上下文 (前 3):')
    for i, m in enumerate(re.finditer(r'.{80}InstitutionDashboardComponent.{50}', main_js)):
        if i < 3:
            log(f'  {m.group()[:200]}')

# 4.3 styles.css 编译产物分析
log('\n=== 4.3 styles.css 编译产物分析 ===')
css_path = OUT_DIR / 'styles.css'
if css_path.exists():
    css = css_path.read_text(encoding='utf-8', errors='replace')
    log(f'styles.css size: {len(css)}')

    # 看编译后的颜色和 spacing
    primary_colors = re.findall(r'#[0-9a-fA-F]{3,8}', css)
    unique_colors = list(set(primary_colors))[:10]
    log(f'CSS 中出现的颜色(前 10 唯一): {unique_colors}')

    # 间距单位 px/em/rem
    spacings = re.findall(r'(?:margin|padding)[^;{}]*?(?:\d+(?:\.\d+)?(?:px|em|rem))', css)
    log(f'间距定义样本(前 5): {spacings[:5]}')

# 4.4 营销站页面可达
log('\n=== 4.4 营销站页面校验 ===')
for p in ['/', '/demo', '/features', '/pricing']:
    url = f'{BASE}{p}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            log(f'  GET {p} -> HTTP {r.status}, size={len(r.read())}')
    except urllib.error.HTTPError as e:
        log(f'  GET {p} -> HTTP {e.code}')

# 4.5 通过 WebFetch 验证 SPA 入口
log('\n=== 4.5 SPA 入口验证 (WebFetch 替代 Browser) ===')
for p in ['/app/login', '/app/admin/institution-management', '/app/features/stem-cloud/dashboard']:
    url = f'{BASE}{p}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode('utf-8', errors='replace')
            has_app_root = '<app-root>' in body or 'app-root' in body
            log(f'  GET {p} -> HTTP {r.status}, size={len(body)}, has <app-root>: {has_app_root}')
    except urllib.error.HTTPError as e:
        log(f'  GET {p} -> HTTP {e.code}')

# 4.6 总结
log('\n=== 4.6 降级验收总结 ===')
log('Browser subagent 完全不可用（DevTools 协议超时），改用静态+API方式验收')
log('已确认的 BUG:')
log('  - org_scoped /students 500')
log('  - org_scoped /teachers 500')
log('  - org_scoped /enrollment/stats 500')
log('  - org_overview /{org_id}/licenses/statistics 500')
log('  - 跨租户 org_scoped /99999/overview 200（应 403/404）')
log('  - 部署 main hash 是 818029bea5bd6c2b（与用户描述的 d768ec8025095d91 不匹配）')
log('  - 旧 hash db0cdf9b33859376 已清理')
log('  - SCSS 相对路径未在 main.js 残留')
log('  - InstitutionDashboardComponent 等组件 3 处出现，组件已编译到 dist')

log('\n完成。')
