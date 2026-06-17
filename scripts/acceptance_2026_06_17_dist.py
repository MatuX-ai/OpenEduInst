# -*- coding: utf-8 -*-
"""任务 2: 前端 dist 静态校验 - 直接写文件避免 pipeline 缓冲"""
import urllib.request, re, json
from pathlib import Path

OUT_DIR = Path(r'g:\OpenMTEduInst\reports\acceptance_2026_06_17')
LOG = OUT_DIR / 'dist_test.log'
BASE = 'https://jigou.matux.tech'
NEW_HASH_EXPECTED = 'd768ec8025095d91'
OLD_HASH_REMOVED = 'db0cdf9b33859376'

def log(s):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(s + '\n')

def fetch(path, headers=None):
    url = f'{BASE}{path}'
    req = urllib.request.Request(url, headers=headers or {'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read(), dict(r.getheaders())
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers.items())

# 清理日志
if LOG.exists():
    LOG.unlink()

log('=== 任务 2: 前端 dist 静态校验 ===\n')

# 2.1 fetch index.html
log('=== 2.1 fetch /app/ ===')
status, body, headers = fetch('/app/')
log(f'GET /app/ -> HTTP {status}, body_len={len(body)}')
index_html = body.decode('utf-8', errors='replace')
(OUT_DIR / 'index.html').write_text(index_html, encoding='utf-8')

# 2.2 解析 chunk 名
mains = re.findall(r'main\.([a-f0-9]+)\.js', index_html)
runtimes = re.findall(r'runtime\.([a-f0-9]+)\.js', index_html)
polyfills = re.findall(r'polyfills\.([a-f0-9]+)\.js', index_html)
styles = re.findall(r'styles\.([a-f0-9]+)\.css', index_html)
log(f'main hash: {mains}')
log(f'runtime hash: {runtimes}')
log(f'polyfills hash: {polyfills}')
log(f'styles hash: {styles}')
log(f'旧 hash {OLD_HASH_REMOVED} 残留: {OLD_HASH_REMOVED in index_html}')
log(f'用户描述新 hash {NEW_HASH_EXPECTED} 出现: {NEW_HASH_EXPECTED in index_html}')

# 2.3 验证每个 chunk
log('\n=== 2.3 4 个 chunk HEAD ===')
chunks = []
if mains: chunks.append(('main', f'/app/main.{mains[0]}.js'))
if runtimes: chunks.append(('runtime', f'/app/runtime.{runtimes[0]}.js'))
if polyfills: chunks.append(('polyfills', f'/app/polyfills.{polyfills[0]}.js'))
if styles: chunks.append(('styles', f'/app/styles.{styles[0]}.css'))
for name, path in chunks:
    s, b, h = fetch(path, headers={'Cache-Control': 'no-cache'})
    log(f'  {name:10s} {path:60s} HTTP {s} size={len(b)}')

# 2.4 下载 main.js 检查
log('\n=== 2.4 main.js 静态检查 ===')
if mains:
    main_path = f'/app/main.{mains[0]}.js'
    s, b, h = fetch(main_path)
    main_js = b.decode('utf-8', errors='replace')
    (OUT_DIR / 'main.js').write_text(main_js, encoding='utf-8')
    log(f'main.js size: {len(main_js)}')

    # 关键字符串检查
    bad_patterns = [
        "'../../../styles/design-tokens'",
        "'../../../styles/shared/mixins'",
        '"../../../styles/design-tokens"',
        '"../../../styles/shared/mixins"',
    ]
    for p in bad_patterns:
        cnt = main_js.count(p)
        mark = '✗ 残留' if cnt > 0 else '✓ 已清理'
        log(f'  {mark}: {p} (count={cnt})')

    # 关键功能/路由检查
    checks = [
        ('mockDataDelay', 'mockDataDelay'),
        ('InstitutionDashboardComponent', 'InstitutionDashboardComponent'),
        ('institution-management 路径', 'institution-management'),
        ('org_scoped 路径', 'educational_institution/org'),
        ('tenant/menu', 'tenant/menu'),
        ('tenant/config', 'tenant/config'),
        ('org/overview', 'org/overview'),
        ('org/dashboard', 'org/dashboard'),
        ('licenses/statistics', 'licenses/statistics'),
    ]
    for label, pat in checks:
        cnt = main_js.count(pat)
        mark = '✓' if cnt > 0 else '✗'
        log(f'  {mark} {label} (count={cnt})')

# 2.5 styles.css
log('\n=== 2.5 styles.css 关键变量 ===')
if styles:
    style_path = f'/app/styles.{styles[0]}.css'
    s, b, h = fetch(style_path)
    css = b.decode('utf-8', errors='replace')
    (OUT_DIR / 'styles.css').write_text(css, encoding='utf-8')
    log(f'styles.css size: {len(css)}')

    var_checks = [
        ('spacing-xl 出现', 'spacing-xl'),
        ('color-primary 出现', 'color-primary'),
        ('primary 出现', 'primary'),
    ]
    for label, compiled in var_checks:
        present = compiled in css
        mark = '✓' if present else '✗'
        log(f'  {mark} {label}: {present}')

# 2.6 营销站入口确认
log('\n=== 2.6 / 营销站可达性 ===')
s, b, h = fetch('/', headers={'Cache-Control': 'no-cache'})
log(f'GET / -> HTTP {s}, size={len(b)}')
log(f'  contains "OpenMT": {"OpenMT" in b.decode("utf-8", errors="replace")}')

# 2.7 SPA 路由
log('\n=== 2.7 SPA 路由可达性 ===')
for p in ['/app/login', '/app/admin/institution-management', '/app/features/stem-cloud/dashboard', '/app/organization-management/organization-portal']:
    s, b, h = fetch(p, headers={'Cache-Control': 'no-cache'})
    log(f'  GET {p} -> HTTP {s}')

# 汇总
log('\n=== 任务2 汇总 ===')
log(f'部署 dist main hash: {mains[0] if mains else "N/A"}')
log(f'用户描述新 hash: {NEW_HASH_EXPECTED}')
if mains:
    if mains[0] == NEW_HASH_EXPECTED:
        log('→ 完全匹配')
    else:
        log(f'→ 不匹配 (部署的是 {mains[0]}，可能本地构建与 CI 部署不同步)')
log(f'旧 hash {OLD_HASH_REMOVED} 残留: {OLD_HASH_REMOVED in index_html}')
log(f'详细文件在: {OUT_DIR}')

log('\n完成。')
