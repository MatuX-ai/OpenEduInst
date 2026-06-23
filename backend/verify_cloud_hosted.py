# -*- coding: utf-8 -*-
from __future__ import annotations
import os, sys
from datetime import datetime, timedelta
from pathlib import Path
os.chdir(Path(__file__).parent)

results: list[tuple[str, bool, str]] = []

def record(label, ok, detail=''):
    results.append((label, ok, detail))
    print('  [%s] %s' % ('OK' if ok else 'XX', label))
    if detail:
        s = str(detail)
        if len(s) > 220: s = s[:220] + '...'
        print('       ' + s)

def section(title):
    print()
    print('========== %s ==========' % title)

section('Phase 1: load app & config')
try:
    from config.settings import settings
    record('config loaded', True, 'DB=%s, LLM=%s' % (settings.DATABASE_URL, settings.LLM_PROVIDER))
except Exception as e:
    record('config loaded', False, str(e))
    sys.exit(1)

try:
    import main as app_main
    from fastapi.testclient import TestClient
    client = TestClient(app_main.app)
    record('FastAPI app', True, 'routes=%s' % len(app_main.app.routes))
except Exception as e:
    record('FastAPI app', False, str(e))
    sys.exit(1)

section('Phase 2: database init')
try:
    from utils.database import Base, engine, SessionLocal
    from sqlalchemy import inspect as si
    before = len(si(engine).get_table_names())
    Base.metadata.create_all(bind=engine)
    tables = sorted(Base.metadata.tables.keys())
    record('SQLAlchemy create_all', True, 'tables=%s, before=%s' % (len(tables), before))
except Exception as e:
    record('SQLAlchemy create_all', False, str(e))

section('Phase 3: smoke tests')
for p in ('/', '/health'):
    try:
        r = client.get(p)
        record('GET %s' % p, r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:120]))
    except Exception as e:
        record('GET %s' % p, False, str(e))

section('Phase 4: register & login')
USERNAME = 'verify_cloud_admin'
EMAIL = 'verify_cloud_admin@openmt.local'
PASSWORD = 'Demo@2026!'
auth_headers = {}
org_token_headers = {}

try:
    db = SessionLocal()
    from models.base_models import User as U
    from models.user_organization import UserOrganization
    u = db.query(U).filter(U.username == USERNAME).first()
    if u:
        db.query(UserOrganization).filter(UserOrganization.user_id == u.id).delete(synchronize_session=False)
        db.query(U).filter(U.id == u.id).delete(synchronize_session=False)
        db.commit()
    db.close()
except Exception:
    pass

try:
    r = client.post('/api/v1/auth/register', json={'username': USERNAME, 'email': EMAIL, 'password': PASSWORD, 'full_name': 'cloud hosted verification admin'})
    record('POST /api/v1/auth/register', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:200]))
except Exception as e:
    record('POST /api/v1/auth/register', False, str(e))

try:
    r = client.post('/api/v1/auth/token', data={'username': USERNAME, 'password': PASSWORD})
    assert r.status_code == 200, 'login failed: %s' % r.text
    auth_headers = {'Authorization': 'Bearer %s' % r.json()['access_token']}
    record('POST /api/v1/auth/token', True, 'bearer token obtained')
except Exception as e:
    record('POST /api/v1/auth/token', False, str(e))

try:
    r = client.get('/api/v1/auth/me', headers=auth_headers)
    record('GET /api/v1/auth/me', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:180]))
except Exception as e:
    record('GET /api/v1/auth/me', False, str(e))

section('Phase 5: create cloud-hosted organization')
ORG_NAME = 'Cloud Hosted Verification Org'
ORG_EMAIL = 'verify-cloud-org@openmt.local'
created_org_id = None

try:
    db = SessionLocal()
    from models.license import Organization as Org, License
    from models.user_organization import UserOrganization
    from models.tenant import TenantConfig, TenantFeatureFlag
    e = db.query(Org).filter(Org.contact_email == ORG_EMAIL).first()
    if e:
        oid = e.id
        for MC in (License, UserOrganization, TenantConfig, TenantFeatureFlag):
            try:
                db.query(MC).filter(getattr(MC, 'org_id', None) == oid).delete(synchronize_session=False)
            except Exception:
                pass
        db.query(Org).filter(Org.id == oid).delete(synchronize_session=False)
        db.commit()
    db.close()
except Exception:
    pass

try:
    r = client.post('/api/v1/organizations/create', json={
        'name': ORG_NAME, 'contact_email': ORG_EMAIL,
        'org_type': 'training_institution', 'phone': '+86-138-0000-0001',
        'address': 'verify-address'
    }, headers=auth_headers)
    ok = r.status_code == 200
    body = r.json() if ok else {}
    record('POST /api/v1/organizations/create', ok, 'status=%s, body=%s' % (r.status_code, r.text[:220]))
    if ok:
        created_org_id = body.get('organization_id')
        new_tok = body.get('access_token')
        if new_tok:
            org_token_headers = {'Authorization': 'Bearer %s' % new_tok}
        else:
            r2 = client.post('/api/v1/auth/token', data={'username': USERNAME, 'password': PASSWORD})
            if r2.status_code == 200:
                org_token_headers = {'Authorization': 'Bearer %s' % r2.json()['access_token']}
except Exception as e:
    record('POST /api/v1/organizations/create', False, str(e))

try:
    from models.license import License, LicenseType
    db = SessionLocal()
    if created_org_id:
        lic = db.query(License).filter(License.organization_id == created_org_id).first()
        ok = lic is not None and lic.license_type == LicenseType.CLOUD_HOSTED
        key = lic.license_key[:20] if lic else 'N/A'
        record('auto-issued CLOUD_HOSTED license', ok, 'type=%s, key=%s, status=%s' % (getattr(lic, 'license_type', None), key, getattr(lic, 'status', 'N/A')))
    else:
        record('auto-issued CLOUD_HOSTED license', False, 'no organization_id from creation step')
    db.close()
except Exception as e:
    record('auto-issued CLOUD_HOSTED license', False, str(e))

using_headers = org_token_headers or auth_headers

section('Phase 6: cloud-hosted exclusive (backup)')
for p, m in [('/api/v1/cloud/backup/status', 'GET'), ('/api/v1/cloud/backup/list', 'GET')]:
    try:
        r = client.request(m, p, headers=using_headers)
        record('%s %s' % (m, p), r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:160]))
    except Exception as e:
        record('%s %s' % (m, p), False, str(e))

try:
    r = client.post('/api/v1/cloud/backup/create', headers=using_headers, params={'label': 'verification-manual-backup'})
    record('POST /api/v1/cloud/backup/create', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:200]))
except Exception as e:
    record('POST /api/v1/cloud/backup/create', False, str(e))

section('Phase 7: license & tenant')
for p in ('/api/v1/licenses/my-active', '/api/v1/licenses/my-features', '/api/v1/organizations/my'):
    try:
        r = client.get(p, headers=using_headers)
        record('GET %s' % p, r.status_code == 200, 'status=%s, body_len=%s' % (r.status_code, len(r.text)))
    except Exception as e:
        record('GET %s' % p, False, str(e))

section('Phase 8: AI assistant (mock)')
try:
    r = client.get('/api/v1/ai/status', headers=using_headers)
    record('GET /api/v1/ai/status', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:200]))
except Exception as e:
    record('GET /api/v1/ai/status', False, str(e))

try:
    r = client.post('/api/v1/ai/chat', json={'message': 'Please suggest a 30-min maker class for grade-2 students.', 'history': [], 'system': 'You are an experienced STEM education assistant.'}, headers=using_headers)
    record('POST /api/v1/ai/chat (mock)', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:240]))
except Exception as e:
    record('POST /api/v1/ai/chat (mock)', False, str(e))

try:
    r = client.post('/api/v1/ai/scheduling/suggest', json={
        'teachers': [{'id': 1, 'name': 'teacher_A', 'available_slots': ['Mon-1', 'Mon-2', 'Tue-1']},
                     {'id': 2, 'name': 'teacher_B', 'available_slots': ['Tue-1', 'Wed-2']}],
        'classrooms': [{'id': 101, 'name': 'room_101', 'capacity': 20}, {'id': 102, 'name': 'room_102', 'capacity': 30}],
        'courses': [{'id': 1, 'name': 'intro_stem', 'students': 15, 'duration': 1}, {'id': 2, 'name': 'arduino_1', 'students': 22, 'duration': 1}],
        'constraints': {'forbid_overlap': True, 'max_hours_per_day': 3}, 'use_llm_advice': True
    }, headers=using_headers)
    record('POST /api/v1/ai/scheduling/suggest (mock)', r.status_code == 200, 'status=%s, body_len=%s, preview=%s' % (r.status_code, len(r.text), r.text[:180]))
except Exception as e:
    record('POST /api/v1/ai/scheduling/suggest (mock)', False, str(e))

try:
    r = client.post('/api/v1/ai/code/review', json={'code': 'void setup(){ Serial.begin(9600); }\nvoid loop(){ digitalWrite(13, HIGH); delay(500); }', 'language': 'arduino', 'student_name': 'verify_student', 'use_llm_review': True}, headers=using_headers)
    record('POST /api/v1/ai/code/review (mock)', r.status_code == 200, 'status=%s, body=%s' % (r.status_code, r.text[:200]))
except Exception as e:
    record('POST /api/v1/ai/code/review (mock)', False, str(e))

section('Phase 9: business endpoints')
for p, m in [('/api/v1/hardware/devices', 'GET'), ('/api/v1/students', 'GET'), ('/api/v1/business/organizations/my', 'GET')]:
    try:
        r = client.request(m, p, headers=using_headers)
        record('%s %s' % (m, p), r.status_code == 200, 'status=%s, body_len=%s' % (r.status_code, len(r.text)))
    except Exception as e:
        record('%s %s' % (m, p), False, str(e))

section('Phase 10: tenant isolation (security)')
try:
    from jose import jwt as jose_jwt
    fake_token = jose_jwt.encode({'sub': USERNAME, 'org_id': 999999, 'exp': datetime.utcnow() + timedelta(minutes=30), 'type': 'access'}, settings.SECRET_KEY, algorithm='HS256')
    r = client.get('/api/v1/cloud/backup/status', headers={'Authorization': 'Bearer %s' % fake_token})
    record('forged org_id -> rejected (tenant isolation)', r.status_code in (401, 403), 'status=%s, body=%s' % (r.status_code, r.text[:120]))
except Exception as e:
    record('forged org_id -> rejected (tenant isolation)', False, str(e))

section('Phase 11: route inventory')
total_api = sum(1 for rt in app_main.app.routes if getattr(rt, 'path', '').startswith('/api/v1/'))
total_routes = len(app_main.app.routes)
cloud_count = sum(1 for rt in app_main.app.routes if '/cloud/' in getattr(rt, 'path', ''))
ai_count = sum(1 for rt in app_main.app.routes if '/ai/' in getattr(rt, 'path', ''))
record('route inventory', True, 'total=%s, /api/v1/*=%s, /cloud/*=%s, /ai/*=%s' % (total_routes, total_api, cloud_count, ai_count))

total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = total - passed

print()
print('=' * 64)
print('    FINAL REPORT: %s/%s PASSED  %s' % (passed, total, 'OK' if failed == 0 else '%s failed' % failed))
print('=' * 64)
for label, ok, detail in results:
    print('  [%s] %s' % ('OK' if ok else 'XX', label))
    if detail:
        s = str(detail)
        if len(s) > 220: s = s[:220] + '...'
        print('       ' + s)
print('=' * 64)
if failed == 0:
    print('Cloud hosted edition is fully functional.')
else:
    print('%s item(s) failed - please review logs above.' % failed)
print('=' * 64)
